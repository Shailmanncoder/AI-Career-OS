import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { interviewStartSchema } from "@/lib/validation/forms";
import { openingQuestion, type InterviewContext } from "@/lib/ai/tasks/interview";
import { fallbackInterviewQuestion } from "@/lib/services/fallbacks";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "interview-start", limit: 10, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = interviewStartSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [role, strengths, gaps] = await Promise.all([
      prisma.careerRole.findUnique({ where: { id: parsed.data.careerRoleId } }),
      prisma.candidateSkill.findMany({
        where: { userId: guard.user.id },
        include: { skill: true },
        orderBy: { level: "desc" },
        take: 6,
      }),
      prisma.skillGap.findMany({
        where: { userId: guard.user.id, careerRoleId: parsed.data.careerRoleId },
        include: { skill: true },
        orderBy: { priorityScore: "desc" },
        take: 5,
      }),
    ]);

    if (!role) return apiError("NOT_FOUND", "That career role could not be found.");

    await prisma.interviewSession.updateMany({
      where: { userId: guard.user.id, status: "ACTIVE" },
      data: { status: "ABANDONED" },
    });

    const context: InterviewContext = {
      roleTitle: role.title,
      kind: parsed.data.kind,
      experience: parsed.data.experience,
      candidateStrengths: strengths.map((skill) => skill.skill.name),
      focusSkills: gaps.map((gap) => gap.skill.name),
    };

    const aiResult = await openingQuestion(context);
    const question = aiResult.ok ? aiResult.data.question : fallbackInterviewQuestion(context, 0);

    const session = await prisma.interviewSession.create({
      data: {
        userId: guard.user.id,
        careerRoleId: role.id,
        kind: parsed.data.kind,
        experience: parsed.data.experience,
        status: "ACTIVE",
        questionCount: 1,
        messages: {
          create: {
            order: 1,
            role: "INTERVIEWER",
            content: question,
            strengths: [],
            improvements: [],
          },
        },
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: guard.user.id,
        kind: "INTERVIEW_STARTED",
        label: `Started a ${parsed.data.kind.toLowerCase()} interview for ${role.title}`,
        value: 0,
      },
    });

    return apiSuccess({
      sessionId: session.id,
      roleTitle: role.title,
      question,
      usedFallback: !aiResult.ok,
      aiErrorCode: aiResult.ok ? undefined : aiResult.code,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
