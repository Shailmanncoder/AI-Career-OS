import { generateStructured } from "@/lib/ai/gemini";
import { ROADMAP_SYSTEM } from "@/lib/ai/prompts";
import { roadmapPlanSchema, type RoadmapPlanPayload } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";

export type RoadmapContext = {
  roleTitle: string;
  horizonWeeks: number;
  weeklyHours: number;
  learningStyle: string;
  yearsExperience: number;
  currentStrengths: Array<{ name: string; level: number }>;
  gaps: Array<{ name: string; currentLevel: number; requiredLevel: number; priority: string }>;
  learningAreas: string[];
};

export function buildRoadmapPrompt(context: RoadmapContext) {
  return [
    `Target role: ${context.roleTitle}`,
    `Plan length: ${context.horizonWeeks} weeks`,
    `Weekly study budget: ${context.weeklyHours} hours`,
    `Preferred learning style: ${context.learningStyle}`,
    `Years of professional experience: ${context.yearsExperience}`,
    `Role learning areas: ${context.learningAreas.join(", ") || "not specified"}`,
    "",
    "Skills the candidate already holds (name, estimated level):",
    context.currentStrengths.length > 0
      ? context.currentStrengths.map((skill) => `- ${skill.name}: ${skill.level}`).join("\n")
      : "- none recorded",
    "",
    "Skill gaps to close (name, current, required, priority):",
    context.gaps.length > 0
      ? context.gaps
          .map(
            (gap) =>
              `- ${gap.name}: ${gap.currentLevel} of ${gap.requiredLevel}, priority ${gap.priority}`,
          )
          .join("\n")
      : "- none recorded",
    "",
    `Produce between ${Math.max(3, Math.round(context.horizonWeeks / 3))} and 6 phases covering the full ${context.horizonWeeks} weeks without overlap.`,
  ].join("\n");
}

export function generateRoadmapPlan(
  context: RoadmapContext,
): Promise<AiResult<RoadmapPlanPayload>> {
  return generateStructured({
    system: ROADMAP_SYSTEM,
    user: buildRoadmapPrompt(context),
    schema: roadmapPlanSchema,
    temperature: 0.45,
    maxOutputTokens: 8192,
  });
}
