import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { resumeOptimizeSchema } from "@/lib/validation/forms";
import { optimizeResume, type ResumeOptimizerContext } from "@/lib/ai/tasks/resume-optimizer";
import { fallbackResumeOptimization } from "@/lib/services/fallbacks";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "resume-optimize", limit: 8, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = resumeOptimizeSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [resume, role, gaps] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId: guard.user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.careerRole.findUnique({
        where: { id: parsed.data.careerRoleId },
        include: { roleSkills: { include: { skill: true } } },
      }),
      prisma.skillGap.findMany({
        where: { userId: guard.user.id, careerRoleId: parsed.data.careerRoleId },
        include: { skill: true },
        orderBy: { priorityScore: "desc" },
        take: 10,
      }),
    ]);

    if (!resume) return apiError("CONFLICT", "Upload and analyze a resume before optimizing it.");
    if (!role) return apiError("NOT_FOUND", "That career role could not be found.");

    const context: ResumeOptimizerContext = {
      roleTitle: role.title,
      roleDescription: role.shortDescription,
      roleSkills: role.roleSkills.map((roleSkill) => roleSkill.skill.name),
      roleSkillAliases: Object.fromEntries(
        role.roleSkills.map((roleSkill) => [roleSkill.skill.name, roleSkill.skill.aliases]),
      ),
      missingSkills: gaps.map((gap) => gap.skill.name),
      resumeText: resume.extractedText,
    };

    const aiResult = await optimizeResume(context);
    const payload = aiResult.ok ? aiResult.data : fallbackResumeOptimization(context);

    await prisma.activityEvent.create({
      data: {
        userId: guard.user.id,
        kind: "RESUME_OPTIMIZED",
        label: `Reviewed resume against ${role.title}`,
        value: payload.atsReadinessScore,
      },
    });

    return apiSuccess({
      roleTitle: role.title,
      report: payload,
      usedFallback: !aiResult.ok,
      aiErrorCode: aiResult.ok ? undefined : aiResult.code,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
