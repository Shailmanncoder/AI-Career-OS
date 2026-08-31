import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address").max(160),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address").max(160),
  password: z.string().min(1, "Password is required").max(72),
});

export const onboardingSchema = z.object({
  educationLevel: z.string().max(80).optional().or(z.literal("")),
  currentRole: z.string().max(120).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().min(0).max(50).optional(),
  targetCareerId: z.string().max(60).optional().or(z.literal("")),
  learningStyle: z
    .enum(["VIDEO", "READING", "PROJECTS", "INTERACTIVE", "MIXED"])
    .optional(),
  weeklyLearningHrs: z.coerce.number().int().min(1).max(60).optional(),
  skills: z.array(z.string().min(1).max(60)).max(40).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const careerMatchRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const careerSimulationSchema = z.object({
  careerRoleId: z.string().min(1, "Select a career role"),
  skillIds: z.array(z.string().min(1)).min(1, "Select at least one skill").max(12),
  targetLevel: z.coerce.number().int().min(10).max(100).default(75),
  persist: z.boolean().default(true),
});

export type CareerSimulationInput = z.infer<typeof careerSimulationSchema>;

export const roadmapGenerateSchema = z.object({
  careerRoleId: z.string().min(1, "Select a career role"),
  horizon: z.enum(["DAYS_30", "DAYS_60", "DAYS_90"]).default("DAYS_90"),
  weeklyHours: z.coerce.number().int().min(1).max(40).default(6),
});

export const roadmapTaskUpdateSchema = z.object({
  taskId: z.string().min(1),
  completed: z.boolean(),
});

export const learningProgressSchema = z.object({
  resourceId: z.string().min(1),
  completed: z.boolean(),
});

export const assessmentGenerateSchema = z.object({
  skillId: z.string().min(1, "Select a skill"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
  questionCount: z.coerce.number().int().min(3).max(8).default(5),
});

export const assessmentSubmitSchema = z.object({
  assessmentId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOption: z.coerce.number().int().min(0).max(9).optional(),
        responseText: z.string().max(4000).optional(),
      }),
    )
    .min(1),
});

export const interviewStartSchema = z.object({
  careerRoleId: z.string().min(1, "Select a career role"),
  kind: z.enum(["TECHNICAL", "BEHAVIORAL", "MIXED"]).default("MIXED"),
  experience: z.enum(["entry", "mid", "senior"]).default("entry"),
});

export const interviewRespondSchema = z.object({
  sessionId: z.string().min(1),
  answer: z.string().min(10, "Answer must be at least 10 characters").max(6000),
});

export const resumeOptimizeSchema = z.object({
  careerRoleId: z.string().min(1, "Select a target career role"),
});

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".docx"] as const;
