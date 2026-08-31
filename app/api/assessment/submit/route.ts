import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { assessmentSubmitSchema } from "@/lib/validation/forms";
import { gradeOpenAnswers } from "@/lib/ai/tasks/assessment";
import { heuristicGradeOpenAnswer } from "@/lib/services/fallbacks";
import { assessmentLevelFromScore, scoreAssessment } from "@/lib/engine/scoring";
import { recomputeCareerIntelligence } from "@/lib/services/career-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "assessment-submit", limit: 15, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = assessmentSubmitSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const assessment = await prisma.assessment.findFirst({
      where: { id: parsed.data.assessmentId, userId: guard.user.id },
      include: { questions: { orderBy: { order: "asc" } }, skill: true },
    });
    if (!assessment) return apiError("NOT_FOUND", "That assessment could not be found.");

    const answerByQuestion = new Map(
      parsed.data.answers.map((answer) => [answer.questionId, answer]),
    );

    const openItems = assessment.questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => question.kind !== "MULTIPLE_CHOICE")
      .map(({ question, index }) => ({
        index,
        prompt: question.prompt,
        expectedPoints: (question.expectedPoints as string[]) ?? [],
        answer: answerByQuestion.get(question.id)?.responseText ?? "",
      }));

    let aiGrades = new Map<number, { scorePercent: number; feedback: string }>();
    let usedFallback = false;

    if (openItems.length > 0) {
      const graded = await gradeOpenAnswers({ skillName: assessment.skill.name, items: openItems });
      if (graded.ok) {
        aiGrades = new Map(
          graded.data.grades.map((grade) => [
            grade.questionIndex,
            { scorePercent: grade.scorePercent, feedback: grade.feedback },
          ]),
        );
      } else {
        usedFallback = true;
      }
    }

    let earnedPoints = 0;
    let totalPoints = 0;

    const answerRows = assessment.questions.map((question, index) => {
      const submitted = answerByQuestion.get(question.id);
      totalPoints += question.points;

      if (question.kind === "MULTIPLE_CHOICE") {
        const isCorrect =
          question.correctOption !== null &&
          submitted?.selectedOption !== undefined &&
          submitted.selectedOption === question.correctOption;
        const points = isCorrect ? question.points : 0;
        earnedPoints += points;

        return {
          questionId: question.id,
          selectedOption: submitted?.selectedOption ?? null,
          responseText: null,
          isCorrect,
          earnedPoints: points,
          feedback: isCorrect
            ? "Correct."
            : question.explanation ?? "That option is not the expected answer.",
        };
      }

      const expectedPoints = (question.expectedPoints as string[]) ?? [];
      const responseText = submitted?.responseText ?? "";
      const grade =
        aiGrades.get(index) ?? heuristicGradeOpenAnswer(responseText, expectedPoints);
      const points = Math.round((grade.scorePercent / 100) * question.points);
      earnedPoints += points;

      return {
        questionId: question.id,
        selectedOption: null,
        responseText: responseText.slice(0, 4000) || null,
        isCorrect: grade.scorePercent >= 70,
        earnedPoints: points,
        feedback: grade.feedback,
      };
    });

    const score = scoreAssessment(earnedPoints, totalPoints);

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        userId: guard.user.id,
        status: "SCORED",
        score,
        earnedPoints,
        totalPoints,
        submittedAt: new Date(),
        feedback:
          score >= 80
            ? `Strong result on ${assessment.skill.name}. This is now recorded as assessment evidence rather than a resume estimate.`
            : score >= 55
              ? `Working knowledge of ${assessment.skill.name} confirmed, with specific gaps noted per question.`
              : `${assessment.skill.name} needs more practice before it can carry weight in a career match.`,
        answers: { create: answerRows },
      },
      include: { answers: true },
    });

    const verifiedLevel = assessmentLevelFromScore(score);
    await prisma.candidateSkill.upsert({
      where: { userId_skillId: { userId: guard.user.id, skillId: assessment.skillId } },
      create: {
        userId: guard.user.id,
        skillId: assessment.skillId,
        level: verifiedLevel,
        confidence: 0.95,
        evidence: `Assessment evidence: scored ${score} on ${assessment.title}.`,
        source: "ASSESSMENT",
        verified: true,
      },
      update: {
        level: verifiedLevel,
        confidence: 0.95,
        evidence: `Assessment evidence: scored ${score} on ${assessment.title}.`,
        source: "ASSESSMENT",
        verified: true,
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: guard.user.id,
        kind: "ASSESSMENT_SCORED",
        label: `Scored ${score} on ${assessment.title}`,
        value: score,
      },
    });

    await recomputeCareerIntelligence(guard.user.id);

    const feedbackByQuestion = new Map(
      attempt.answers.map((answer) => [answer.questionId, answer]),
    );

    return apiSuccess({
      attemptId: attempt.id,
      score,
      earnedPoints,
      totalPoints,
      feedback: attempt.feedback,
      verifiedLevel,
      usedFallback,
      results: assessment.questions.map((question) => {
        const answer = feedbackByQuestion.get(question.id);
        return {
          questionId: question.id,
          prompt: question.prompt,
          kind: question.kind,
          isCorrect: answer?.isCorrect ?? false,
          earnedPoints: answer?.earnedPoints ?? 0,
          points: question.points,
          feedback: answer?.feedback ?? "",
          correctOption: question.correctOption,
          options: question.options as string[],
        };
      }),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
