import { generateStructured } from "@/lib/ai/gemini";
import { RESUME_REWRITE_SYSTEM } from "@/lib/ai/prompts";
import { resumeRewriteSchema, type ResumeRewritePayload } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";

export type ResumeRewriteContext = {
  roleTitle: string;
  roleSkills: string[];
  missingSkills: string[];
  resumeText: string;
};

export function buildResumeRewritePrompt(context: ResumeRewriteContext) {
  return [
    `Target role: ${context.roleTitle}`,
    `Vocabulary this role uses: ${context.roleSkills.join(", ")}`,
    `Terms currently absent from the resume: ${context.missingSkills.join(", ") || "none"}`,
    "Do not add an absent term unless the source resume already evidences it under another name.",
    "",
    "Source resume:",
    "<<<RESUME",
    context.resumeText,
    "RESUME",
    "",
    "Rewrite it now.",
  ].join("\n");
}

export function rewriteResume(
  context: ResumeRewriteContext,
): Promise<AiResult<ResumeRewritePayload>> {
  return generateStructured({
    system: RESUME_REWRITE_SYSTEM,
    user: buildResumeRewritePrompt(context),
    schema: resumeRewriteSchema,
    temperature: 0.25,
    maxOutputTokens: 8192,
  });
}
