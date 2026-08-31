import type { RoadmapHorizon, TaskKind } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { generateRoadmapPlan, type RoadmapContext } from "@/lib/ai/tasks/roadmap";
import { fallbackRoadmapPlan } from "./fallbacks";
import { SkillResolver, type ResolvableSkill } from "./skill-resolver";
import { completionPercentage } from "@/lib/engine/scoring";

export const HORIZON_WEEKS: Record<RoadmapHorizon, number> = {
  DAYS_30: 4,
  DAYS_60: 8,
  DAYS_90: 12,
};

export const HORIZON_LABEL: Record<RoadmapHorizon, string> = {
  DAYS_30: "30 days",
  DAYS_60: "60 days",
  DAYS_90: "90 days",
};

export async function generateRoadmapForUser(
  userId: string,
  careerRoleId: string,
  horizon: RoadmapHorizon,
  weeklyHours: number,
) {
  const [role, gaps, strengths, profile, skills] = await Promise.all([
    prisma.careerRole.findUnique({ where: { id: careerRoleId } }),
    prisma.skillGap.findMany({
      where: { userId, careerRoleId },
      include: { skill: true },
      orderBy: { priorityScore: "desc" },
      take: 12,
    }),
    prisma.candidateSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { level: "desc" },
      take: 8,
    }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.skill.findMany({ select: { id: true, slug: true, name: true, aliases: true } }),
  ]);

  if (!role) throw new Error("CAREER_ROLE_NOT_FOUND");

  const resolver = new SkillResolver(skills as ResolvableSkill[]);

  const context: RoadmapContext = {
    roleTitle: role.title,
    horizonWeeks: HORIZON_WEEKS[horizon],
    weeklyHours,
    learningStyle: profile?.learningStyle ?? "MIXED",
    yearsExperience: profile?.yearsExperience ?? 0,
    currentStrengths: strengths.map((skill) => ({ name: skill.skill.name, level: skill.level })),
    gaps: gaps.map((gap) => ({
      name: gap.skill.name,
      currentLevel: gap.currentLevel,
      requiredLevel: gap.requiredLevel,
      priority: gap.priority,
    })),
    learningAreas: role.learningAreas,
  };

  const aiResult = await generateRoadmapPlan(context);
  const plan = aiResult.ok ? aiResult.data : fallbackRoadmapPlan(context);

  await prisma.roadmap.updateMany({
    where: { userId, careerRoleId, isActive: true },
    data: { isActive: false },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      careerRoleId,
      horizon,
      weeklyHours,
      title: plan.title,
      summary: plan.summary,
      isActive: true,
      isFallback: !aiResult.ok,
      phases: {
        create: plan.phases.map((phase, phaseIndex) => ({
          order: phaseIndex + 1,
          title: phase.title,
          focus: phase.focus,
          weekStart: phase.weekStart,
          weekEnd: Math.max(phase.weekStart, phase.weekEnd),
          tasks: {
            create: phase.tasks.map((task, taskIndex) => ({
              order: taskIndex + 1,
              kind: task.kind as TaskKind,
              title: task.title,
              objective: task.objective,
              estimateHrs: task.estimateHours,
              skillId: task.skill ? (resolver.resolve(task.skill)?.id ?? null) : null,
            })),
          },
        })),
      },
    },
    include: { phases: { include: { tasks: true } } },
  });

  await prisma.activityEvent.create({
    data: {
      userId,
      kind: "ROADMAP_GENERATED",
      label: `Generated a ${HORIZON_LABEL[horizon]} roadmap for ${role.title}`,
      value: roadmap.phases.reduce((total, phase) => total + phase.tasks.length, 0),
    },
  });

  return { roadmap, usedFallback: !aiResult.ok, aiErrorCode: aiResult.ok ? undefined : aiResult.code };
}

export async function getActiveRoadmap(userId: string) {
  return prisma.roadmap.findFirst({
    where: { userId, isActive: true },
    include: {
      careerRole: true,
      phases: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: { skill: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function summarizeRoadmapProgress(
  phases: Array<{ tasks: Array<{ completed: boolean; estimateHrs: number }> }>,
) {
  const tasks = phases.flatMap((phase) => phase.tasks);
  const completed = tasks.filter((task) => task.completed).length;
  const totalHours = tasks.reduce((sum, task) => sum + task.estimateHrs, 0);
  const completedHours = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.estimateHrs, 0);

  return {
    total: tasks.length,
    completed,
    percentage: completionPercentage(completed, tasks.length),
    totalHours,
    completedHours,
  };
}

export async function getLearningRecommendations(userId: string, careerRoleId: string, take = 12) {
  const gaps = await prisma.skillGap.findMany({
    where: { userId, careerRoleId },
    orderBy: { priorityScore: "desc" },
    take,
    include: {
      skill: {
        include: {
          learningResources: {
            orderBy: [{ difficulty: "asc" }, { estimateHrs: "asc" }],
            take: 3,
          },
        },
      },
    },
  });

  const progress = await prisma.learningProgress.findMany({
    where: { userId },
    select: { resourceId: true, completed: true },
  });
  const completedIds = new Set(
    progress.filter((entry) => entry.completed).map((entry) => entry.resourceId),
  );

  return gaps
    .filter((gap) => gap.skill.learningResources.length > 0)
    .map((gap) => ({
      skillId: gap.skillId,
      skillName: gap.skill.name,
      priority: gap.priority,
      gap: gap.gap,
      currentLevel: gap.currentLevel,
      requiredLevel: gap.requiredLevel,
      resources: gap.skill.learningResources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        provider: resource.provider,
        url: resource.url,
        type: resource.type,
        difficulty: resource.difficulty,
        estimateHrs: resource.estimateHrs,
        completed: completedIds.has(resource.id),
      })),
    }));
}
