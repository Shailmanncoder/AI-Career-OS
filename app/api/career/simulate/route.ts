import type { SkillRequirement } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { careerSimulationSchema } from "@/lib/validation/forms";
import { simulateSkillAcquisition } from "@/lib/engine/scoring";
import type { RoleSkillInput } from "@/lib/engine/types";
import { loadCandidateSkills } from "@/lib/services/career-service";
import { explainCareerMatch } from "@/lib/ai/tasks/career-explanation";
import { fallbackCareerExplanation } from "@/lib/services/fallbacks";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "career-simulate", limit: 40, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = careerSimulationSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const role = await prisma.careerRole.findUnique({
      where: { id: parsed.data.careerRoleId },
      include: { roleSkills: { include: { skill: true } } },
    });
    if (!role) return apiError("NOT_FOUND", "That career role could not be found.");

    const roleSkills: RoleSkillInput[] = role.roleSkills.map((roleSkill) => ({
      skillId: roleSkill.skillId,
      skillName: roleSkill.skill.name,
      requirement: roleSkill.requirement as SkillRequirement,
      weight: roleSkill.weight,
      requiredLevel: roleSkill.requiredLevel,
    }));

    const candidateSkills = await loadCandidateSkills(guard.user.id);
    const simulation = simulateSkillAcquisition(
      candidateSkills,
      roleSkills,
      parsed.data.skillIds,
      parsed.data.targetLevel,
    );

    const nameBySkillId = new Map(roleSkills.map((skill) => [skill.skillId, skill.skillName]));
    const addedNames = simulation.addedSkillIds.map((id) => nameBySkillId.get(id) ?? "Unknown skill");

    let explanation: string | null = null;

    if (parsed.data.persist) {
      const analysis = await prisma.resumeAnalysis.findFirst({
        where: { resume: { userId: guard.user.id, isActive: true } },
        orderBy: { createdAt: "desc" },
        select: { summary: true },
      });

      const context = {
        roleTitle: role.title,
        roleDescription: role.shortDescription,
        score: simulation.projectedScore,
        strongSkills: addedNames.map((name) => ({ name, level: parsed.data.targetLevel })),
        gapSkills: simulation.remainingGaps.slice(0, 4).map((gap) => ({
          name: gap.skillName,
          currentLevel: gap.currentLevel,
          requiredLevel: gap.requiredLevel,
        })),
        candidateSummary: analysis?.summary ?? "",
      };

      const aiResult = await explainCareerMatch(context);
      explanation = (aiResult.ok ? aiResult.data : fallbackCareerExplanation(context)).explanation;

      await prisma.careerSimulation.create({
        data: {
          userId: guard.user.id,
          careerRoleId: role.id,
          baselineScore: simulation.baselineScore,
          projectedScore: simulation.projectedScore,
          delta: simulation.delta,
          addedSkills: addedNames,
          remainingGaps: simulation.remainingGaps.slice(0, 6).map((gap) => gap.skillName),
          explanation,
        },
      });

      await prisma.activityEvent.create({
        data: {
          userId: guard.user.id,
          kind: "SIMULATION_RUN",
          label: `Simulated ${addedNames.length} skills against ${role.title}`,
          value: simulation.delta,
        },
      });
    }

    return apiSuccess({
      roleTitle: role.title,
      baselineScore: simulation.baselineScore,
      projectedScore: simulation.projectedScore,
      delta: simulation.delta,
      addedSkills: addedNames,
      remainingGaps: simulation.remainingGaps.slice(0, 8).map((gap) => ({
        skillId: gap.skillId,
        skillName: gap.skillName,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        gap: gap.gap,
        priority: gap.priority,
      })),
      explanation,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
