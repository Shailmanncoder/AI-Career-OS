import { clamp, roundTo } from "@/lib/utils";
import type {
  CandidateSkillInput,
  CareerMatchResult,
  GapPriorityLevel,
  RoleSkillInput,
  SimulationResult,
  SkillContribution,
  SkillGapResult,
  SkillRequirementLevel,
} from "./types";

export const REQUIREMENT_MULTIPLIER: Record<SkillRequirementLevel, number> = {
  REQUIRED: 1,
  IMPORTANT: 0.65,
  OPTIONAL: 0.3,
};

export const REQUIRED_MASTERY_THRESHOLD = 0.8;

export function effectiveWeightOf(roleSkill: RoleSkillInput) {
  const baseWeight = Number.isFinite(roleSkill.weight) ? Math.max(0, roleSkill.weight) : 0;
  return roundTo(baseWeight * REQUIREMENT_MULTIPLIER[roleSkill.requirement], 4);
}

export function confidenceAdjustedLevel(skill: CandidateSkillInput) {
  const level = clamp(skill.level);
  if (level === 0) return 0;
  const confidence = skill.verified ? 1 : clamp(skill.confidence, 0, 1);
  return roundTo(level * (0.7 + 0.3 * confidence), 2);
}

export function attainmentOf(currentLevel: number, requiredLevel: number) {
  if (requiredLevel <= 0) return currentLevel > 0 ? 1 : 0;
  return roundTo(Math.min(1, clamp(currentLevel) / requiredLevel), 4);
}

export function buildSkillIndex(candidateSkills: CandidateSkillInput[]) {
  const index = new Map<string, number>();
  for (const skill of candidateSkills) {
    const adjusted = confidenceAdjustedLevel(skill);
    const existing = index.get(skill.skillId) ?? 0;
    index.set(skill.skillId, Math.max(existing, adjusted));
  }
  return index;
}

export function computeCareerMatch(
  candidateSkills: CandidateSkillInput[],
  roleSkills: RoleSkillInput[],
): CareerMatchResult {
  const levels = buildSkillIndex(candidateSkills);
  const contributions: SkillContribution[] = [];

  let weightedScore = 0;
  let weightedTotal = 0;
  let requiredTotal = 0;
  let requiredMet = 0;
  let covered = 0;

  for (const roleSkill of roleSkills) {
    const effectiveWeight = effectiveWeightOf(roleSkill);
    const currentLevel = roundTo(levels.get(roleSkill.skillId) ?? 0, 2);
    const attainment = attainmentOf(currentLevel, roleSkill.requiredLevel);

    if (roleSkill.requirement === "REQUIRED") {
      requiredTotal += 1;
      if (attainment >= REQUIRED_MASTERY_THRESHOLD) requiredMet += 1;
    }
    if (currentLevel > 0) covered += 1;

    weightedScore += attainment * effectiveWeight;
    weightedTotal += effectiveWeight;

    contributions.push({
      skillId: roleSkill.skillId,
      skillName: roleSkill.skillName,
      requirement: roleSkill.requirement,
      effectiveWeight,
      currentLevel,
      requiredLevel: roleSkill.requiredLevel,
      attainment,
      contribution: roundTo(attainment * effectiveWeight, 4),
    });
  }

  const score = weightedTotal > 0 ? Math.round((weightedScore / weightedTotal) * 100) : 0;

  return {
    score: clamp(score),
    coverage: roleSkills.length > 0 ? Math.round((covered / roleSkills.length) * 100) : 0,
    requiredMet,
    requiredTotal,
    weightedTotal: roundTo(weightedTotal, 4),
    contributions: contributions.sort((a, b) => b.effectiveWeight - a.effectiveWeight),
  };
}

export function priorityFromScore(score: number): GapPriorityLevel {
  if (score >= 55) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

export function computeSkillGaps(
  candidateSkills: CandidateSkillInput[],
  roleSkills: RoleSkillInput[],
): SkillGapResult[] {
  const levels = buildSkillIndex(candidateSkills);

  const gaps = roleSkills.map((roleSkill) => {
    const currentLevel = Math.round(levels.get(roleSkill.skillId) ?? 0);
    const requiredLevel = clamp(roleSkill.requiredLevel);
    const gap = Math.max(0, requiredLevel - currentLevel);
    const effectiveWeight = effectiveWeightOf(roleSkill);
    const gapRatio = requiredLevel > 0 ? gap / requiredLevel : 0;
    const foundationBonus = currentLevel > 0 && gapRatio < 0.75 ? 8 : 0;
    const requirementBoost = roleSkill.requirement === "REQUIRED" ? 12 : 0;
    const priorityScore = roundTo(
      clamp(gapRatio * effectiveWeight * 70 + foundationBonus + requirementBoost),
      2,
    );

    return {
      skillId: roleSkill.skillId,
      skillName: roleSkill.skillName,
      requirement: roleSkill.requirement,
      currentLevel,
      requiredLevel,
      gap,
      weight: effectiveWeight,
      priority: gap === 0 ? ("LOW" as GapPriorityLevel) : priorityFromScore(priorityScore),
      priorityScore: gap === 0 ? 0 : priorityScore,
    };
  });

  return gaps.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (b.gap !== a.gap) return b.gap - a.gap;
    return a.skillName.localeCompare(b.skillName);
  });
}

export function rankCareerMatches<T extends { careerRoleId: string; score: number }>(matches: T[]) {
  return [...matches]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.careerRoleId.localeCompare(b.careerRoleId);
    })
    .map((match, index) => ({ ...match, rank: index + 1 }));
}

export function simulateSkillAcquisition(
  candidateSkills: CandidateSkillInput[],
  roleSkills: RoleSkillInput[],
  addedSkillIds: string[],
  targetLevel = 75,
): SimulationResult {
  const baseline = computeCareerMatch(candidateSkills, roleSkills);
  const uniqueAdded = Array.from(new Set(addedSkillIds));

  const projectedSkills: CandidateSkillInput[] = candidateSkills.map((skill) => ({ ...skill }));
  for (const skillId of uniqueAdded) {
    const existing = projectedSkills.find((skill) => skill.skillId === skillId);
    const roleSkill = roleSkills.find((skill) => skill.skillId === skillId);
    const ceiling = clamp(Math.max(targetLevel, roleSkill?.requiredLevel ?? targetLevel));

    if (existing) {
      existing.level = Math.max(existing.level, ceiling);
      existing.confidence = Math.max(existing.confidence, 0.85);
    } else {
      projectedSkills.push({
        skillId,
        level: ceiling,
        confidence: 0.85,
        verified: false,
      });
    }
  }

  const projected = computeCareerMatch(projectedSkills, roleSkills);

  return {
    baselineScore: baseline.score,
    projectedScore: projected.score,
    delta: projected.score - baseline.score,
    addedSkillIds: uniqueAdded,
    remainingGaps: computeSkillGaps(projectedSkills, roleSkills).filter((gap) => gap.gap > 0),
  };
}

export function completionPercentage(completed: number, total: number) {
  if (total <= 0) return 0;
  return clamp(Math.round((completed / total) * 100));
}

export function scoreAssessment(earnedPoints: number, totalPoints: number) {
  if (totalPoints <= 0) return 0;
  return clamp(Math.round((earnedPoints / totalPoints) * 100));
}

export function assessmentLevelFromScore(score: number) {
  return clamp(Math.round(score * 0.95));
}

export function averageOf(values: number[]) {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export function learningStreak(dates: Date[]) {
  if (dates.length === 0) return 0;

  const days = new Set(
    dates.map((date) => {
      const copy = new Date(date);
      copy.setHours(0, 0, 0, 0);
      return copy.getTime();
    }),
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = today.getTime();
  if (!days.has(cursor)) {
    cursor -= dayMs;
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= dayMs;
  }
  return streak;
}
