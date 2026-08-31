import { generateStructured } from "@/lib/ai/gemini";
import { CAREER_EXPLANATION_SYSTEM } from "@/lib/ai/prompts";
import { careerExplanationSchema, type CareerExplanationPayload } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";

export type CareerExplanationContext = {
  roleTitle: string;
  roleDescription: string;
  score: number;
  strongSkills: Array<{ name: string; level: number }>;
  gapSkills: Array<{ name: string; currentLevel: number; requiredLevel: number }>;
  candidateSummary: string;
};

export function buildCareerExplanationPrompt(context: CareerExplanationContext) {
  return [
    `Target role: ${context.roleTitle}`,
    `Role description: ${context.roleDescription}`,
    `Application calculated compatibility score: ${context.score}`,
    "",
    "Candidate summary:",
    context.candidateSummary || "No summary available.",
    "",
    "Strongest matching skills (name, estimated level):",
    context.strongSkills.length > 0
      ? context.strongSkills.map((skill) => `- ${skill.name}: ${skill.level}`).join("\n")
      : "- none recorded",
    "",
    "Largest gaps (name, current, required):",
    context.gapSkills.length > 0
      ? context.gapSkills
          .map((skill) => `- ${skill.name}: ${skill.currentLevel} of ${skill.requiredLevel}`)
          .join("\n")
      : "- none recorded",
    "",
    "Explain the alignment now.",
  ].join("\n");
}

export function explainCareerMatch(
  context: CareerExplanationContext,
): Promise<AiResult<CareerExplanationPayload>> {
  return generateStructured({
    system: CAREER_EXPLANATION_SYSTEM,
    user: buildCareerExplanationPrompt(context),
    schema: careerExplanationSchema,
    temperature: 0.4,
    maxOutputTokens: 1600,
  });
}
