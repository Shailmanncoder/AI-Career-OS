import { describe, expect, it } from "vitest";
import {
  attainmentOf,
  averageOf,
  assessmentLevelFromScore,
  completionPercentage,
  computeCareerMatch,
  computeSkillGaps,
  confidenceAdjustedLevel,
  effectiveWeightOf,
  learningStreak,
  priorityFromScore,
  rankCareerMatches,
  scoreAssessment,
  simulateSkillAcquisition,
} from "@/lib/engine/scoring";
import type { CandidateSkillInput, RoleSkillInput } from "@/lib/engine/types";

const roleSkills: RoleSkillInput[] = [
  { skillId: "react", skillName: "React", requirement: "REQUIRED", weight: 1.4, requiredLevel: 80 },
  { skillId: "node", skillName: "Node.js", requirement: "REQUIRED", weight: 1.2, requiredLevel: 75 },
  { skillId: "sql", skillName: "SQL", requirement: "IMPORTANT", weight: 1, requiredLevel: 70 },
  { skillId: "docker", skillName: "Docker", requirement: "OPTIONAL", weight: 0.8, requiredLevel: 55 },
];

const verifiedSkill = (skillId: string, level: number): CandidateSkillInput => ({
  skillId,
  level,
  confidence: 1,
  verified: true,
});

describe("effectiveWeightOf", () => {
  it("scales the raw weight by the requirement multiplier", () => {
    expect(effectiveWeightOf(roleSkills[0])).toBe(1.4);
    expect(effectiveWeightOf(roleSkills[2])).toBe(0.65);
    expect(effectiveWeightOf(roleSkills[3])).toBeCloseTo(0.24, 5);
  });

  it("treats a negative weight as zero", () => {
    expect(effectiveWeightOf({ ...roleSkills[0], weight: -3 })).toBe(0);
  });
});

describe("confidenceAdjustedLevel", () => {
  it("returns the full level when the skill is verified", () => {
    expect(confidenceAdjustedLevel(verifiedSkill("react", 80))).toBe(80);
  });

  it("dampens the level for low confidence estimates", () => {
    expect(confidenceAdjustedLevel({ skillId: "react", level: 80, confidence: 0 })).toBe(56);
  });

  it("keeps a zero level at zero regardless of confidence", () => {
    expect(confidenceAdjustedLevel({ skillId: "react", level: 0, confidence: 1 })).toBe(0);
  });
});

describe("attainmentOf", () => {
  it("caps attainment at one when the candidate exceeds the requirement", () => {
    expect(attainmentOf(95, 80)).toBe(1);
  });

  it("returns the ratio below the requirement", () => {
    expect(attainmentOf(40, 80)).toBe(0.5);
  });

  it("treats a zero requirement as met when any level exists", () => {
    expect(attainmentOf(10, 0)).toBe(1);
    expect(attainmentOf(0, 0)).toBe(0);
  });
});

describe("computeCareerMatch", () => {
  it("returns zero for a candidate with no skills", () => {
    const result = computeCareerMatch([], roleSkills);
    expect(result.score).toBe(0);
    expect(result.requiredMet).toBe(0);
    expect(result.requiredTotal).toBe(2);
    expect(result.coverage).toBe(0);
  });

  it("returns 100 when every requirement is fully met", () => {
    const skills = roleSkills.map((skill) => verifiedSkill(skill.skillId, skill.requiredLevel));
    const result = computeCareerMatch(skills, roleSkills);
    expect(result.score).toBe(100);
    expect(result.requiredMet).toBe(2);
    expect(result.coverage).toBe(100);
  });

  it("weights required skills more heavily than optional ones", () => {
    const requiredOnly = computeCareerMatch([verifiedSkill("react", 80)], roleSkills);
    const optionalOnly = computeCareerMatch([verifiedSkill("docker", 55)], roleSkills);
    expect(requiredOnly.score).toBeGreaterThan(optionalOnly.score);
  });

  it("is deterministic across repeated calls with identical inputs", () => {
    const skills = [verifiedSkill("react", 70), verifiedSkill("sql", 40)];
    const first = computeCareerMatch(skills, roleSkills);
    const second = computeCareerMatch(skills, roleSkills);
    expect(first.score).toBe(second.score);
    expect(first.contributions).toEqual(second.contributions);
  });

  it("does not exceed 100 when the candidate overshoots every level", () => {
    const skills = roleSkills.map((skill) => verifiedSkill(skill.skillId, 100));
    expect(computeCareerMatch(skills, roleSkills).score).toBe(100);
  });

  it("counts a required skill as met only at the mastery threshold", () => {
    const justUnder = computeCareerMatch([verifiedSkill("react", 63)], roleSkills);
    const atThreshold = computeCareerMatch([verifiedSkill("react", 64)], roleSkills);
    expect(justUnder.requiredMet).toBe(0);
    expect(atThreshold.requiredMet).toBe(1);
  });

  it("handles an empty role definition without dividing by zero", () => {
    const result = computeCareerMatch([verifiedSkill("react", 80)], []);
    expect(result.score).toBe(0);
    expect(result.coverage).toBe(0);
  });

  it("uses the highest level when a skill appears more than once", () => {
    const duplicated = computeCareerMatch(
      [verifiedSkill("react", 20), verifiedSkill("react", 80)],
      roleSkills,
    );
    const single = computeCareerMatch([verifiedSkill("react", 80)], roleSkills);
    expect(duplicated.score).toBe(single.score);
  });
});

describe("computeSkillGaps", () => {
  it("reports no gap for a fully met skill", () => {
    const gaps = computeSkillGaps([verifiedSkill("react", 80)], roleSkills);
    const react = gaps.find((gap) => gap.skillId === "react");
    expect(react?.gap).toBe(0);
    expect(react?.priority).toBe("LOW");
    expect(react?.priorityScore).toBe(0);
  });

  it("computes the gap as required minus current", () => {
    const gaps = computeSkillGaps([verifiedSkill("react", 35)], roleSkills);
    const react = gaps.find((gap) => gap.skillId === "react");
    expect(react?.currentLevel).toBe(35);
    expect(react?.requiredLevel).toBe(80);
    expect(react?.gap).toBe(45);
  });

  it("never produces a negative gap when the candidate exceeds the requirement", () => {
    const gaps = computeSkillGaps([verifiedSkill("react", 95)], roleSkills);
    expect(gaps.every((gap) => gap.gap >= 0)).toBe(true);
  });

  it("ranks higher weighted gaps above lower weighted ones of the same size", () => {
    const gaps = computeSkillGaps([], roleSkills);
    const react = gaps.findIndex((gap) => gap.skillId === "react");
    const docker = gaps.findIndex((gap) => gap.skillId === "docker");
    expect(react).toBeLessThan(docker);
  });

  it("sorts results by descending priority score", () => {
    const gaps = computeSkillGaps([verifiedSkill("sql", 20)], roleSkills);
    const scores = gaps.map((gap) => gap.priorityScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});

describe("priorityFromScore", () => {
  it("maps score bands to priority levels", () => {
    expect(priorityFromScore(80)).toBe("HIGH");
    expect(priorityFromScore(55)).toBe("HIGH");
    expect(priorityFromScore(54)).toBe("MEDIUM");
    expect(priorityFromScore(25)).toBe("MEDIUM");
    expect(priorityFromScore(24)).toBe("LOW");
  });
});

describe("simulateSkillAcquisition", () => {
  it("raises the score when a weighted gap is closed", () => {
    const result = simulateSkillAcquisition([verifiedSkill("react", 80)], roleSkills, ["node"], 75);
    expect(result.projectedScore).toBeGreaterThan(result.baselineScore);
    expect(result.delta).toBe(result.projectedScore - result.baselineScore);
  });

  it("does not mutate the candidate skills passed in", () => {
    const skills = [verifiedSkill("react", 30)];
    const snapshot = JSON.parse(JSON.stringify(skills));
    simulateSkillAcquisition(skills, roleSkills, ["react"], 90);
    expect(skills).toEqual(snapshot);
  });

  it("produces no change when simulating a skill already above the target", () => {
    const skills = [verifiedSkill("react", 95)];
    const result = simulateSkillAcquisition(skills, roleSkills, ["react"], 75);
    expect(result.delta).toBe(0);
  });

  it("deduplicates repeated skill ids", () => {
    const result = simulateSkillAcquisition([], roleSkills, ["node", "node", "node"], 75);
    expect(result.addedSkillIds).toEqual(["node"]);
  });

  it("ignores skills the role does not weight", () => {
    const withUnrelated = simulateSkillAcquisition([], roleSkills, ["kubernetes"], 75);
    expect(withUnrelated.delta).toBe(0);
  });

  it("agrees with computeCareerMatch on the projected score", () => {
    const baseline = [verifiedSkill("react", 80)];
    const simulated = simulateSkillAcquisition(baseline, roleSkills, ["node", "sql"], 75);
    const direct = computeCareerMatch(
      [
        ...baseline,
        { skillId: "node", level: 75, confidence: 0.85 },
        { skillId: "sql", level: 75, confidence: 0.85 },
      ],
      roleSkills,
    );
    expect(simulated.projectedScore).toBe(direct.score);
  });

  it("only returns gaps that remain open", () => {
    const result = simulateSkillAcquisition([], roleSkills, ["react", "node", "sql", "docker"], 100);
    expect(result.remainingGaps).toHaveLength(0);
  });
});

describe("rankCareerMatches", () => {
  it("assigns ranks in descending score order", () => {
    const ranked = rankCareerMatches([
      { careerRoleId: "a", score: 40 },
      { careerRoleId: "b", score: 90 },
      { careerRoleId: "c", score: 65 },
    ]);
    expect(ranked.map((entry) => entry.careerRoleId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties deterministically by role id", () => {
    const ranked = rankCareerMatches([
      { careerRoleId: "z", score: 50 },
      { careerRoleId: "a", score: 50 },
    ]);
    expect(ranked[0].careerRoleId).toBe("a");
  });

  it("does not mutate the input array", () => {
    const input = [{ careerRoleId: "a", score: 10 }, { careerRoleId: "b", score: 20 }];
    rankCareerMatches(input);
    expect(input[0].careerRoleId).toBe("a");
  });
});

describe("progress helpers", () => {
  it("computes completion percentage and guards against zero totals", () => {
    expect(completionPercentage(3, 12)).toBe(25);
    expect(completionPercentage(0, 0)).toBe(0);
    expect(completionPercentage(12, 12)).toBe(100);
  });

  it("scores assessments from earned points", () => {
    expect(scoreAssessment(19, 30)).toBe(63);
    expect(scoreAssessment(0, 0)).toBe(0);
    expect(scoreAssessment(30, 30)).toBe(100);
  });

  it("derives a slightly conservative skill level from an assessment score", () => {
    expect(assessmentLevelFromScore(100)).toBe(95);
    expect(assessmentLevelFromScore(0)).toBe(0);
  });

  it("averages values and handles an empty list", () => {
    expect(averageOf([80, 90, 70])).toBe(80);
    expect(averageOf([])).toBe(0);
  });
});

describe("learningStreak", () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const daysAgo = (count: number) => new Date(Date.now() - count * dayMs);

  it("returns zero with no activity", () => {
    expect(learningStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(learningStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
  });

  it("still counts a streak that ended yesterday", () => {
    expect(learningStreak([daysAgo(1), daysAgo(2)])).toBe(2);
  });

  it("returns zero when the most recent activity is older than yesterday", () => {
    expect(learningStreak([daysAgo(5), daysAgo(6)])).toBe(0);
  });

  it("ignores duplicate activity on the same day", () => {
    expect(learningStreak([daysAgo(0), daysAgo(0), daysAgo(1)])).toBe(2);
  });

  it("stops counting at the first missing day", () => {
    expect(learningStreak([daysAgo(0), daysAgo(1), daysAgo(3)])).toBe(2);
  });
});
