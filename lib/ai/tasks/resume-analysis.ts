import { generateStructured } from "@/lib/ai/gemini";
import { RESUME_ANALYSIS_SYSTEM } from "@/lib/ai/prompts";
import { resumeAnalysisSchema, type ResumeAnalysisPayload } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";

export type ResumeAnalysisContext = {
  resumeText: string;
  currentRole?: string | null;
  targetRole?: string | null;
  educationLevel?: string | null;
  declaredSkills?: string[];
};

export function buildResumeAnalysisPrompt(context: ResumeAnalysisContext) {
  const declared =
    context.declaredSkills && context.declaredSkills.length > 0
      ? context.declaredSkills.join(", ")
      : "none provided";

  return [
    "Candidate supplied context:",
    `Current role: ${context.currentRole ?? "not stated"}`,
    `Target role: ${context.targetRole ?? "not stated"}`,
    `Education level: ${context.educationLevel ?? "not stated"}`,
    `Self declared skills: ${declared}`,
    "",
    "Resume text:",
    "<<<RESUME",
    context.resumeText,
    "RESUME",
    "",
    "Extract the structured profile now.",
  ].join("\n");
}

export function analyzeResume(
  context: ResumeAnalysisContext,
): Promise<AiResult<ResumeAnalysisPayload>> {
  return generateStructured({
    system: RESUME_ANALYSIS_SYSTEM,
    user: buildResumeAnalysisPrompt(context),
    schema: resumeAnalysisSchema,
    temperature: 0.2,
    maxOutputTokens: 8192,
  });
}
