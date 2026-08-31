import { generateStructured } from "@/lib/ai/gemini";
import { ASSESSMENT_GRADING_SYSTEM, ASSESSMENT_SYSTEM } from "@/lib/ai/prompts";
import { assessmentPlanSchema, openAnswerGradeSchema } from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";
import type { z } from "zod";

export type AssessmentContext = {
  skillName: string;
  skillCategory: string;
  difficulty: string;
  questionCount: number;
  estimatedLevel: number;
};

export type OpenAnswerGradingContext = {
  skillName: string;
  items: Array<{
    index: number;
    prompt: string;
    expectedPoints: string[];
    answer: string;
  }>;
};

export function buildAssessmentPrompt(context: AssessmentContext) {
  return [
    `Skill: ${context.skillName}`,
    `Skill category: ${context.skillCategory}`,
    `Difficulty: ${context.difficulty}`,
    `Question count: ${context.questionCount}`,
    `Resume estimated level for this candidate: ${context.estimatedLevel} out of 100`,
    "",
    `Write exactly ${context.questionCount} questions. At least one must be SHORT_ANSWER or PRACTICAL.`,
  ].join("\n");
}

export function generateAssessment(
  context: AssessmentContext,
): Promise<AiResult<z.infer<typeof assessmentPlanSchema>>> {
  return generateStructured({
    system: ASSESSMENT_SYSTEM,
    user: buildAssessmentPrompt(context),
    schema: assessmentPlanSchema,
    temperature: 0.5,
    maxOutputTokens: 4096,
  });
}

export function buildGradingPrompt(context: OpenAnswerGradingContext) {
  return [
    `Skill under assessment: ${context.skillName}`,
    "",
    "Answers to grade:",
    context.items
      .map((item) =>
        [
          `Question index ${item.index}`,
          `Question: ${item.prompt}`,
          `Expected points: ${item.expectedPoints.join("; ") || "not specified"}`,
          `Candidate answer: ${item.answer || "(no answer provided)"}`,
        ].join("\n"),
      )
      .join("\n\n"),
    "",
    "Grade each answer now.",
  ].join("\n");
}

export function gradeOpenAnswers(
  context: OpenAnswerGradingContext,
): Promise<AiResult<z.infer<typeof openAnswerGradeSchema>>> {
  return generateStructured({
    system: ASSESSMENT_GRADING_SYSTEM,
    user: buildGradingPrompt(context),
    schema: openAnswerGradeSchema,
    temperature: 0.2,
    maxOutputTokens: 3072,
  });
}
