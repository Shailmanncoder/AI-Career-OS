import type { GapPriority, SkillRequirement } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import {
  computeCareerMatch,
  computeSkillGaps,
  rankCareerMatches,
} from "@/lib/engine/scoring";
import type { CandidateSkillInput, RoleSkillInput } from "@/lib/engine/types";
import { explainCareerMatch } from "@/lib/ai/tasks/career-explanation";
import { fallbackCareerExplanation } from "./fallbacks";

export type RoleWithSkills = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  demandIndex: number;
  learningAreas: string[];
  responsibilities: string[];
  roleSkills: RoleSkillInput[];
};

export async function loadCareerRoles(): Promise<RoleWithSkills[]> {
  const roles = await prisma.careerRole.findMany({
    include: { roleSkills: { include: { skill: true } } },
    orderBy: { title: "asc" },
  });

  return roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    title: role.title,
    shortDescription: role.shortDescription,
    description: role.description,
    category: role.category,
    demandIndex: role.demandIndex,
    learningAreas: role.learningAreas,
    responsibilities: role.responsibilities,
    roleSkills: role.roleSkills.map((roleSkill) => ({
      skillId: roleSkill.skillId,
      skillName: roleSkill.skill.name,
      requirement: roleSkill.requirement as SkillRequirement,
      weight: roleSkill.weight,
      requiredLevel: roleSkill.requiredLevel,
    })),
  }));
}

export async function loadCandidateSkills(userId: string): Promise<CandidateSkillInput[]> {
  const skills = await prisma.candidateSkill.findMany({
    where: { userId },
    select: { skillId: true, level: true, confidence: true, verified: true },
  });

  return skills.map((skill) => ({
    skillId: skill.skillId,
    level: skill.level,
    confidence: skill.confidence,
    verified: skill.verified,
  }));
}

export async function recomputeCareerIntelligence(userId: string) {
  const [candidateSkills, roles] = await Promise.all([
    loadCandidateSkills(userId),
    loadCareerRoles(),
  ]);

  if (roles.length === 0) return { matches: [], gapCount: 0 };

  const computed = roles.map((role) => ({
    role,
    result: computeCareerMatch(candidateSkills, role.roleSkills),
  }));

  const ranked = rankCareerMatches(
    computed.map((entry) => ({ careerRoleId: entry.role.id, score: entry.result.score })),
  );
  const rankByRole = new Map(ranked.map((entry) => [entry.careerRoleId, entry.rank]));

  const gapRows: Array<{
    userId: string;
    careerRoleId: string;
    skillId: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
    priority: GapPriority;
    priorityScore: number;
    weight: number;
  }> = [];

  for (const entry of computed) {
    const gaps = computeSkillGaps(candidateSkills, entry.role.roleSkills);
    for (const gap of gaps) {
      if (gap.gap <= 0) continue;
      gapRows.push({
        userId,
        careerRoleId: entry.role.id,
        skillId: gap.skillId,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        gap: gap.gap,
        priority: gap.priority as GapPriority,
        priorityScore: gap.priorityScore,
        weight: gap.weight,
      });
    }
  }

  await prisma.$transaction([
    prisma.skillGap.deleteMany({ where: { userId } }),
    ...(gapRows.length > 0 ? [prisma.skillGap.createMany({ data: gapRows })] : []),
    ...computed.map((entry) =>
      prisma.careerMatch.upsert({
        where: {
          userId_careerRoleId: { userId, careerRoleId: entry.role.id },
        },
        create: {
          userId,
          careerRoleId: entry.role.id,
          score: entry.result.score,
          coverage: entry.result.coverage,
          requiredMet: entry.result.requiredMet,
          requiredTotal: entry.result.requiredTotal,
          rank: rankByRole.get(entry.role.id) ?? 0,
          strengths: [],
          focusAreas: [],
        },
        update: {
          score: entry.result.score,
          coverage: entry.result.coverage,
          requiredMet: entry.result.requiredMet,
          requiredTotal: entry.result.requiredTotal,
          rank: rankByRole.get(entry.role.id) ?? 0,
        },
      }),
    ),
  ]);

  return {
    matches: computed
      .map((entry) => ({
        careerRoleId: entry.role.id,
        title: entry.role.title,
        score: entry.result.score,
        rank: rankByRole.get(entry.role.id) ?? 0,
      }))
      .sort((a, b) => a.rank - b.rank),
    gapCount: gapRows.length,
  };
}

export async function ensureCareerExplanation(userId: string, careerRoleId: string) {
  const match = await prisma.careerMatch.findUnique({
    where: { userId_careerRoleId: { userId, careerRoleId } },
    include: { careerRole: true },
  });
  if (!match) return null;
  if (match.explanation) return match;

  const [gaps, candidateSkills, analysis] = await Promise.all([
    prisma.skillGap.findMany({
      where: { userId, careerRoleId },
      include: { skill: true },
      orderBy: { priorityScore: "desc" },
      take: 5,
    }),
    prisma.candidateSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { level: "desc" },
      take: 6,
    }),
    prisma.resumeAnalysis.findFirst({
      where: { resume: { userId, isActive: true } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const context = {
    roleTitle: match.careerRole.title,
    roleDescription: match.careerRole.shortDescription,
    score: match.score,
    strongSkills: candidateSkills.map((skill) => ({ name: skill.skill.name, level: skill.level })),
    gapSkills: gaps.map((gap) => ({
      name: gap.skill.name,
      currentLevel: gap.currentLevel,
      requiredLevel: gap.requiredLevel,
    })),
    candidateSummary: analysis?.summary ?? "",
  };

  const aiResult = await explainCareerMatch(context);
  const payload = aiResult.ok ? aiResult.data : fallbackCareerExplanation(context);

  return prisma.careerMatch.update({
    where: { userId_careerRoleId: { userId, careerRoleId } },
    data: {
      explanation: payload.explanation,
      strengths: payload.strengths,
      focusAreas: payload.focusAreas,
    },
    include: { careerRole: true },
  });
}

export async function getTopCareerMatches(userId: string, limit = 8) {
  return prisma.careerMatch.findMany({
    where: { userId },
    include: { careerRole: true },
    orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
    take: limit,
  });
}

export async function getSkillGapsForRole(userId: string, careerRoleId: string) {
  return prisma.skillGap.findMany({
    where: { userId, careerRoleId },
    include: { skill: true },
    orderBy: [{ priorityScore: "desc" }, { gap: "desc" }],
  });
}
