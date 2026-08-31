export type SkillRequirementLevel = "REQUIRED" | "IMPORTANT" | "OPTIONAL";

export type GapPriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export type CandidateSkillInput = {
  skillId: string;
  level: number;
  confidence: number;
  verified?: boolean;
};

export type RoleSkillInput = {
  skillId: string;
  skillName: string;
  requirement: SkillRequirementLevel;
  weight: number;
  requiredLevel: number;
};

export type SkillContribution = {
  skillId: string;
  skillName: string;
  requirement: SkillRequirementLevel;
  effectiveWeight: number;
  currentLevel: number;
  requiredLevel: number;
  attainment: number;
  contribution: number;
};

export type CareerMatchResult = {
  score: number;
  coverage: number;
  requiredMet: number;
  requiredTotal: number;
  weightedTotal: number;
  contributions: SkillContribution[];
};

export type SkillGapResult = {
  skillId: string;
  skillName: string;
  requirement: SkillRequirementLevel;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  weight: number;
  priority: GapPriorityLevel;
  priorityScore: number;
};

export type SimulationResult = {
  baselineScore: number;
  projectedScore: number;
  delta: number;
  addedSkillIds: string[];
  remainingGaps: SkillGapResult[];
};
