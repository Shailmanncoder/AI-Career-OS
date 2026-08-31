import { generateStructured } from "@/lib/ai/gemini";
import { RESUME_OPTIMIZER_SYSTEM } from "@/lib/ai/prompts";
import { resumeOptimizationSchema, type ResumeOptimizationPayload } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";

export type ResumeOptimizerContext = {
  roleTitle: string;
  roleDescription: string;
  roleSkills: string[];
  missingSkills: string[];
  resumeText: string;
};

export function buildResumeOptimizerPrompt(context: ResumeOptimizerContext) {
  return [
    `Target role: ${context.roleTitle}`,
    `Role description: ${context.roleDescription}`,
    `Skills this role expects: ${context.roleSkills.join(", ")}`,
    `Skills the application found missing or weak: ${context.missingSkills.join(", ") || "none"}`,
    "",
    "Resume text:",
    "<<<RESUME",
    context.resumeText,
    "RESUME",
    "",
    "Review the resume against the target role now.",
  ].join("\n");
}

export function optimizeResume(
  context: ResumeOptimizerContext,
): Promise<AiResult<ResumeOptimizationPayload>> {
  return generateStructured({
    system: RESUME_OPTIMIZER_SYSTEM,
    user: buildResumeOptimizerPrompt(context),
    schema: resumeOptimizationSchema,
    temperature: 0.3,
    maxOutputTokens: 6144,
  });
}
