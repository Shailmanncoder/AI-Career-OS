import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { assessmentGenerateSchema } from "@/lib/validation/forms";
import { generateAssessment, type AssessmentContext } from "@/lib/ai/tasks/assessment";
import { fallbackAssessment } from "@/lib/services/fallbacks";
import { categoryLabel } from "@/lib/services/resume-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "assessment-generate", limit: 10, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = assessmentGenerateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const skill = await prisma.skill.findUnique({ where: { id: parsed.data.skillId } });
    if (!skill) return apiError("NOT_FOUND", "That skill could not be found.");

    const candidateSkill = await prisma.candidateSkill.findUnique({
      where: { userId_skillId: { userId: guard.user.id, skillId: skill.id } },
      select: { level: true },
    });

    const context: AssessmentContext = {
      skillName: skill.name,
      skillCategory: categoryLabel(skill.category),
      difficulty: parsed.data.difficulty,
      questionCount: parsed.data.questionCount,
      estimatedLevel: candidateSkill?.level ?? 0,
    };

    const aiResult = await generateAssessment(context);
    const plan = aiResult.ok ? aiResult.data : fallbackAssessment(context);

    const assessment = await prisma.assessment.create({
      data: {
        userId: guard.user.id,
        skillId: skill.id,
        title: plan.title,
        difficulty: parsed.data.difficulty,
        isFallback: !aiResult.ok,
        questions: {
          create: plan.questions.map((question, index) => ({
            order: index + 1,
            kind: question.kind,
            prompt: question.prompt,
            options: question.kind === "MULTIPLE_CHOICE" ? question.options : [],
            correctOption:
              question.kind === "MULTIPLE_CHOICE" &&
              question.correctOption !== undefined &&
              question.correctOption < question.options.length
                ? question.correctOption
                : null,
            expectedPoints: question.kind === "MULTIPLE_CHOICE" ? [] : question.expectedPoints,
            explanation: question.explanation,
            points: 10,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } }, skill: true },
    });

    return apiSuccess({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        skillName: assessment.skill.name,
        difficulty: assessment.difficulty,
        questions: assessment.questions.map((question) => ({
          id: question.id,
          order: question.order,
          kind: question.kind,
          prompt: question.prompt,
          options: question.options as string[],
        })),
      },
      usedFallback: !aiResult.ok,
      aiErrorCode: aiResult.ok ? undefined : aiResult.code,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
