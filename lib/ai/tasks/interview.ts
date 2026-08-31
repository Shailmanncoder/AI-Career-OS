import { generateStructured } from "@/lib/ai/gemini";
import { INTERVIEW_EVALUATION_SYSTEM, INTERVIEW_QUESTION_SYSTEM } from "@/lib/ai/prompts";
import {
  interviewEvaluationSchema,
  interviewQuestionSchema,
  type InterviewEvaluationPayload,
} from "@/lib/validation/ai";
import type { AiResult } from "@/lib/ai/errors";
import type { z } from "zod";

export type InterviewContext = {
  roleTitle: string;
  kind: string;
  experience: string;
  candidateStrengths: string[];
  focusSkills: string[];
};

export type InterviewTurnContext = InterviewContext & {
  question: string;
  answer: string;
  askedQuestions: string[];
};

function describeContext(context: InterviewContext) {
  return [
    `Role: ${context.roleTitle}`,
    `Interview type: ${context.kind}`,
    `Seniority: ${context.experience}`,
    `Candidate strengths on record: ${context.candidateStrengths.join(", ") || "unknown"}`,
    `Skills worth probing: ${context.focusSkills.join(", ") || "core role skills"}`,
  ].join("\n");
}

export function openingQuestion(
  context: InterviewContext,
): Promise<AiResult<z.infer<typeof interviewQuestionSchema>>> {
  return generateStructured({
    system: INTERVIEW_QUESTION_SYSTEM,
    user: [describeContext(context), "", "Ask the opening question."].join("\n"),
    schema: interviewQuestionSchema,
    temperature: 0.7,
    maxOutputTokens: 512,
  });
}

export function evaluateAnswer(
  context: InterviewTurnContext,
): Promise<AiResult<InterviewEvaluationPayload>> {
  return generateStructured({
    system: INTERVIEW_EVALUATION_SYSTEM,
    user: [
      describeContext(context),
      "",
      "Questions already asked in this session:",
      context.askedQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n") ||
        "none",
      "",
      `Current question: ${context.question}`,
      "",
      "Candidate answer:",
      "<<<ANSWER",
      context.answer,
      "ANSWER",
      "",
      "Evaluate the answer and ask a different follow-up question.",
    ].join("\n"),
    schema: interviewEvaluationSchema,
    temperature: 0.45,
    maxOutputTokens: 2048,
  });
}
