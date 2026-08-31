import { z } from "zod";
import {
  boundedScore,
  confidenceValue,
  nonNegativeNumber,
  optionalText,
  requiredText,
  stringList,
} from "./primitives";

export const skillCategoryValues = [
  "PROGRAMMING",
  "FRAMEWORKS",
  "DATABASES",
  "CLOUD",
  "DEVOPS",
  "AI_ML",
  "DATA",
  "SECURITY",
  "TOOLS",
  "SOFT_SKILLS",
  "COMMUNICATION",
  "LEADERSHIP",
] as const;

export type SkillCategoryValue = (typeof skillCategoryValues)[number];

const categoryAliases: Record<string, SkillCategoryValue> = {
  programming: "PROGRAMMING",
  language: "PROGRAMMING",
  languages: "PROGRAMMING",
  "programming language": "PROGRAMMING",
  framework: "FRAMEWORKS",
  frameworks: "FRAMEWORKS",
  library: "FRAMEWORKS",
  libraries: "FRAMEWORKS",
  database: "DATABASES",
  databases: "DATABASES",
  cloud: "CLOUD",
  devops: "DEVOPS",
  infrastructure: "DEVOPS",
  ai: "AI_ML",
  ml: "AI_ML",
  "ai/ml": "AI_ML",
  "ai_ml": "AI_ML",
  "machine learning": "AI_ML",
  data: "DATA",
  analytics: "DATA",
  security: "SECURITY",
  cybersecurity: "SECURITY",
  tool: "TOOLS",
  tools: "TOOLS",
  soft: "SOFT_SKILLS",
  "soft skill": "SOFT_SKILLS",
  "soft skills": "SOFT_SKILLS",
  soft_skills: "SOFT_SKILLS",
  communication: "COMMUNICATION",
  leadership: "LEADERSHIP",
  management: "LEADERSHIP",
};

export const skillCategorySchema = z.preprocess((value) => {
  if (typeof value !== "string") return "TOOLS";
  const normalized = value.trim().toLowerCase();
  const upper = value.trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if ((skillCategoryValues as readonly string[]).includes(upper)) return upper;
  return categoryAliases[normalized] ?? "TOOLS";
}, z.enum(skillCategoryValues));

export const educationEntrySchema = z.object({
  institution: requiredText(200, "Unknown institution"),
  degree: optionalText(200),
  field: optionalText(200),
  period: optionalText(80),
  highlights: stringList.default([]),
});

export const experienceEntrySchema = z.object({
  company: requiredText(200, "Unknown company"),
  title: requiredText(200, "Unknown role"),
  period: optionalText(80),
  location: optionalText(120),
  highlights: stringList.default([]),
});

export const projectEntrySchema = z.object({
  name: requiredText(200, "Untitled project"),
  description: requiredText(1200, ""),
  technologies: stringList.default([]),
  link: optionalText(500),
});

export const certificationEntrySchema = z.object({
  name: requiredText(200, "Certification"),
  issuer: optionalText(200),
  year: optionalText(20),
});

export const extractedSkillSchema = z.object({
  name: requiredText(80, "Unnamed skill"),
  category: skillCategorySchema,
  proficiency: boundedScore,
  evidence: optionalText(600),
  confidence: confidenceValue,
  yearsUsed: nonNegativeNumber.optional(),
});

export const careerSignalSchema = z.object({
  role: requiredText(120, "General Software Role"),
  confidence: confidenceValue,
  reasoning: requiredText(800, ""),
});

export const resumeAnalysisSchema = z.object({
  candidateProfile: z.object({
    fullName: optionalText(120),
    headline: optionalText(200),
    summary: requiredText(1500, "Summary unavailable from the submitted resume."),
    yearsExperience: nonNegativeNumber.default(0),
    education: z.array(educationEntrySchema).default([]),
    experience: z.array(experienceEntrySchema).default([]),
    projects: z.array(projectEntrySchema).default([]),
    certifications: z.array(certificationEntrySchema).default([]),
    achievements: stringList.default([]),
  }),
  skills: z.array(extractedSkillSchema).default([]),
  careerSignals: z.array(careerSignalSchema).default([]),
  resumeQuality: z.object({
    overallScore: boundedScore,
    atsScore: boundedScore,
    strengths: stringList.default([]),
    weaknesses: stringList.default([]),
    recommendations: stringList.default([]),
  }),
});

export type ResumeAnalysisPayload = z.infer<typeof resumeAnalysisSchema>;
export type ExtractedSkill = z.infer<typeof extractedSkillSchema>;

export const careerExplanationSchema = z.object({
  explanation: requiredText(1200, ""),
  strengths: stringList.default([]),
  focusAreas: stringList.default([]),
});

export type CareerExplanationPayload = z.infer<typeof careerExplanationSchema>;

export const roadmapTaskSchema = z.object({
  title: requiredText(160, "Learning task"),
  kind: z.preprocess((value) => {
    if (typeof value !== "string") return "LEARN";
    const upper = value.trim().toUpperCase();
    return ["LEARN", "PRACTICE", "PROJECT", "ASSESSMENT"].includes(upper) ? upper : "LEARN";
  }, z.enum(["LEARN", "PRACTICE", "PROJECT", "ASSESSMENT"])),
  objective: requiredText(600, ""),
  skill: optionalText(80),
  estimateHours: z.preprocess((value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 3;
    return Math.min(40, Math.max(1, Math.round(numeric)));
  }, z.number().int().min(1).max(40)),
});

export const roadmapPhaseSchema = z.object({
  title: requiredText(120, "Phase"),
  focus: requiredText(600, ""),
  weekStart: z.preprocess((value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 1;
    return Math.min(13, Math.max(1, Math.round(numeric)));
  }, z.number().int().min(1).max(13)),
  weekEnd: z.preprocess((value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 2;
    return Math.min(13, Math.max(1, Math.round(numeric)));
  }, z.number().int().min(1).max(13)),
  tasks: z.array(roadmapTaskSchema).min(1).max(8),
});

export const roadmapPlanSchema = z.object({
  title: requiredText(140, "Personalized Career Roadmap"),
  summary: requiredText(900, ""),
  phases: z.array(roadmapPhaseSchema).min(2).max(8),
});

export type RoadmapPlanPayload = z.infer<typeof roadmapPlanSchema>;

export const resumeOptimizationSchema = z.object({
  targetAlignmentScore: boundedScore,
  atsReadinessScore: boundedScore,
  keywordCoverage: boundedScore,
  sectionCompleteness: boundedScore,
  strengths: stringList.default([]),
  weaknesses: stringList.default([]),
  missingKeywords: stringList.default([]),
  formattingWarnings: stringList.default([]),
  suggestions: z
    .array(
      z.object({
        section: requiredText(80, "Resume"),
        issue: requiredText(400, ""),
        action: requiredText(400, ""),
      }),
    )
    .default([]),
  rewrites: z
    .array(
      z.object({
        section: requiredText(80, "Experience"),
        original: requiredText(600, ""),
        improved: requiredText(600, ""),
        rationale: requiredText(400, ""),
      }),
    )
    .default([]),
});

export type ResumeOptimizationPayload = z.infer<typeof resumeOptimizationSchema>;

export const assessmentQuestionSchema = z.object({
  kind: z.preprocess((value) => {
    if (typeof value !== "string") return "MULTIPLE_CHOICE";
    const upper = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    return ["MULTIPLE_CHOICE", "SHORT_ANSWER", "PRACTICAL"].includes(upper)
      ? upper
      : "MULTIPLE_CHOICE";
  }, z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER", "PRACTICAL"])),
  prompt: requiredText(900, "Describe your experience with this skill."),
  options: stringList.default([]),
  correctOption: z.preprocess((value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (typeof numeric !== "number" || !Number.isFinite(numeric)) return undefined;
    return Math.max(0, Math.round(numeric));
  }, z.number().int().min(0).optional()),
  expectedPoints: stringList.default([]),
  explanation: optionalText(700),
});

export const assessmentPlanSchema = z.object({
  title: requiredText(140, "Skill Assessment"),
  questions: z.array(assessmentQuestionSchema).min(3).max(10),
});

export type AssessmentPlanPayload = z.infer<typeof assessmentPlanSchema>;

export const openAnswerGradeSchema = z.object({
  grades: z
    .array(
      z.object({
        questionIndex: z.preprocess((value) => {
          const numeric = typeof value === "string" ? Number(value) : value;
          if (typeof numeric !== "number" || !Number.isFinite(numeric)) return 0;
          return Math.max(0, Math.round(numeric));
        }, z.number().int().min(0)),
        scorePercent: boundedScore,
        feedback: requiredText(600, ""),
      }),
    )
    .default([]),
});

export const interviewQuestionSchema = z.object({
  question: requiredText(700, "Tell me about a project you are proud of."),
});

export const interviewEvaluationSchema = z.object({
  relevance: boundedScore,
  technicalAccuracy: boundedScore,
  structure: boundedScore,
  communication: boundedScore,
  completeness: boundedScore,
  feedback: requiredText(900, ""),
  strengths: stringList.default([]),
  improvements: stringList.default([]),
  followUpQuestion: requiredText(700, ""),
});

export type InterviewEvaluationPayload = z.infer<typeof interviewEvaluationSchema>;
