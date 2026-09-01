import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { resumeOptimizeSchema } from "@/lib/validation/forms";
import { rewriteResume, type ResumeRewriteContext } from "@/lib/ai/tasks/resume-rewrite";
import {
  improvementGuidance,
  projectFilledScore,
  renderResumeText,
  scoreRewrittenResume,
  unfilledPlaceholders,
} from "@/lib/services/resume-rewrite";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "resume-improve", limit: 6, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = resumeOptimizeSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const [resume, role, gaps] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId: guard.user.id, isActive: true },
        include: { analysis: true },
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

    if (!resume) return apiError("CONFLICT", "Upload and analyze a resume first.");
    if (!role) return apiError("NOT_FOUND", "That career role could not be found.");

    const roleSkills = role.roleSkills.map((entry) => ({
      name: entry.skill.name,
      aliases: entry.skill.aliases,
    }));
    const roleSkillNames = roleSkills.map((entry) => entry.name);

    const context: ResumeRewriteContext = {
      roleTitle: role.title,
      roleSkills: roleSkillNames,
      missingSkills: gaps.map((gap) => gap.skill.name),
      resumeText: resume.extractedText,
    };

    const aiResult = await rewriteResume(context);
    if (!aiResult.ok) {
      return apiError(
        "UPSTREAM",
        `A rewritten resume needs live AI, which is currently unavailable (${aiResult.code}). The optimizer report still works without it.`,
      );
    }

    const improvedText = renderResumeText(aiResult.data);
    const before = scoreRewrittenResume(resume.extractedText, roleSkills);
    const after = scoreRewrittenResume(improvedText, roleSkills);
    const placeholders = unfilledPlaceholders(improvedText);
    const projected = placeholders.length > 0 ? projectFilledScore(improvedText, roleSkills) : after;

    await prisma.activityEvent.create({
      data: {
        userId: guard.user.id,
        kind: "RESUME_REWRITTEN",
        label: `Generated an improved resume for ${role.title}`,
        value: after.atsScore,
      },
    });

    return apiSuccess({
      roleTitle: role.title,
      improvedText,
      before,
      after,
      projected,
      placeholders,
      guidance: improvementGuidance(after, placeholders),
      keywordsAdded: aiResult.data.keywordsAdded,
      changeNotes: aiResult.data.changeNotes,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
