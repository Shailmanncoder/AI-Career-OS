import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { interviewRespondSchema } from "@/lib/validation/forms";
import { evaluateAnswer, type InterviewContext } from "@/lib/ai/tasks/interview";
import { fallbackInterviewEvaluation } from "@/lib/services/fallbacks";
import { averageOf } from "@/lib/engine/scoring";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_QUESTIONS = 8;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "interview-respond", limit: 40, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = interviewRespondSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const session = await prisma.interviewSession.findFirst({
      where: { id: parsed.data.sessionId, userId: guard.user.id },
      include: {
        careerRole: true,
        messages: { orderBy: { order: "asc" } },
      },
    });

    if (!session) return apiError("NOT_FOUND", "That interview session could not be found.");
    if (session.status !== "ACTIVE") {
      return apiError("CONFLICT", "This interview session has already ended.");
    }

    const questions = session.messages.filter((message) => message.role === "INTERVIEWER");
    const currentQuestion = questions[questions.length - 1];
    if (!currentQuestion) return apiError("CONFLICT", "This session has no pending question.");

    const [strengths, gaps] = await Promise.all([
      prisma.candidateSkill.findMany({
        where: { userId: guard.user.id },
        include: { skill: true },
        orderBy: { level: "desc" },
        take: 6,
      }),
      prisma.skillGap.findMany({
        where: { userId: guard.user.id, careerRoleId: session.careerRoleId },
        include: { skill: true },
        orderBy: { priorityScore: "desc" },
        take: 5,
      }),
    ]);

    const context: InterviewContext = {
      roleTitle: session.careerRole.title,
      kind: session.kind,
      experience: session.experience,
      candidateStrengths: strengths.map((skill) => skill.skill.name),
      focusSkills: gaps.map((gap) => gap.skill.name),
    };

    const aiResult = await evaluateAnswer({
      ...context,
      question: currentQuestion.content,
      answer: parsed.data.answer,
      askedQuestions: questions.map((question) => question.content),
    });

    const evaluation = aiResult.ok
      ? aiResult.data
      : fallbackInterviewEvaluation(context, parsed.data.answer, questions.length);

    const answerScore = Math.round(
      (evaluation.relevance +
        evaluation.technicalAccuracy +
        evaluation.structure +
        evaluation.communication +
        evaluation.completeness) /
        5,
    );

    const nextOrder = session.messages.length;
    const isFinalQuestion = questions.length >= MAX_QUESTIONS;

    const previousScores = session.messages
      .filter((message) => message.role === "CANDIDATE" && message.score !== null)
      .map((message) => message.score as number);
    const averageScore = averageOf([...previousScores, answerScore]);

    await prisma.$transaction([
      prisma.interviewMessage.create({
        data: {
          sessionId: session.id,
          order: nextOrder + 1,
          role: "CANDIDATE",
          content: parsed.data.answer,
          score: answerScore,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
      }),
      prisma.interviewMessage.create({
        data: {
          sessionId: session.id,
          order: nextOrder + 2,
          role: "EVALUATION",
          content: evaluation.feedback,
          score: answerScore,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
      }),
      ...(isFinalQuestion
        ? []
        : [
            prisma.interviewMessage.create({
              data: {
                sessionId: session.id,
                order: nextOrder + 3,
                role: "INTERVIEWER",
                content: evaluation.followUpQuestion,
                strengths: [],
                improvements: [],
              },
            }),
          ]),
      prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          answeredCount: { increment: 1 },
          questionCount: isFinalQuestion ? questions.length : questions.length + 1,
          averageScore,
          status: isFinalQuestion ? "COMPLETED" : "ACTIVE",
          summary: isFinalQuestion
            ? `Completed ${questions.length} questions for ${session.careerRole.title} with an average score of ${averageScore}.`
            : null,
        },
      }),
    ]);

    return apiSuccess({
      score: answerScore,
      breakdown: {
        relevance: evaluation.relevance,
        technicalAccuracy: evaluation.technicalAccuracy,
        structure: evaluation.structure,
        communication: evaluation.communication,
        completeness: evaluation.completeness,
      },
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      nextQuestion: isFinalQuestion ? null : evaluation.followUpQuestion,
      averageScore,
      completed: isFinalQuestion,
      usedFallback: !aiResult.ok,
      aiErrorCode: aiResult.ok ? undefined : aiResult.code,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
