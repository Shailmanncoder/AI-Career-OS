import { describe, expect, it } from "vitest";
import {
  interviewEvaluationSchema,
  resumeAnalysisSchema,
  roadmapPlanSchema,
  skillCategorySchema,
} from "@/lib/validation/ai";
import {
  assessmentSubmitSchema,
  careerSimulationSchema,
  onboardingSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/forms";
import { extractJsonBlock, parseJsonLoose, stripCodeFences } from "@/lib/ai/json";

describe("skillCategorySchema", () => {
  it("passes through canonical enum values", () => {
    expect(skillCategorySchema.parse("PROGRAMMING")).toBe("PROGRAMMING");
  });

  it("normalises common aliases and casing", () => {
    expect(skillCategorySchema.parse("machine learning")).toBe("AI_ML");
    expect(skillCategorySchema.parse("Soft Skills")).toBe("SOFT_SKILLS");
    expect(skillCategorySchema.parse("ai/ml")).toBe("AI_ML");
    expect(skillCategorySchema.parse("frameworks")).toBe("FRAMEWORKS");
  });

  it("falls back to TOOLS for unrecognised or non-string input", () => {
    expect(skillCategorySchema.parse("something invented")).toBe("TOOLS");
    expect(skillCategorySchema.parse(42)).toBe("TOOLS");
    expect(skillCategorySchema.parse(null)).toBe("TOOLS");
  });
});

describe("resumeAnalysisSchema", () => {
  const minimal = {
    candidateProfile: { summary: "A summary." },
    resumeQuality: { overallScore: 70, atsScore: 60 },
  };

  it("fills defaults for omitted collections", () => {
    const parsed = resumeAnalysisSchema.parse(minimal);
    expect(parsed.skills).toEqual([]);
    expect(parsed.candidateProfile.education).toEqual([]);
    expect(parsed.candidateProfile.yearsExperience).toBe(0);
    expect(parsed.careerSignals).toEqual([]);
  });

  it("clamps out-of-range scores rather than rejecting them", () => {
    const parsed = resumeAnalysisSchema.parse({
      ...minimal,
      resumeQuality: { overallScore: 999, atsScore: -40 },
    });
    expect(parsed.resumeQuality.overallScore).toBe(100);
    expect(parsed.resumeQuality.atsScore).toBe(0);
  });

  it("normalises a percentage confidence into the zero to one range", () => {
    const parsed = resumeAnalysisSchema.parse({
      ...minimal,
      skills: [{ name: "React", category: "FRAMEWORKS", proficiency: 80, confidence: 90 }],
    });
    expect(parsed.skills[0].confidence).toBe(0.9);
  });

  it("coerces numeric strings emitted by the model", () => {
    const parsed = resumeAnalysisSchema.parse({
      ...minimal,
      skills: [{ name: "SQL", category: "DATABASES", proficiency: "65", confidence: "0.8" }],
    });
    expect(parsed.skills[0].proficiency).toBe(65);
    expect(parsed.skills[0].confidence).toBe(0.8);
  });

  it("substitutes a fallback summary when the model returns an empty one", () => {
    const parsed = resumeAnalysisSchema.parse({
      candidateProfile: { summary: "   " },
      resumeQuality: { overallScore: 50, atsScore: 50 },
    });
    expect(parsed.candidateProfile.summary.length).toBeGreaterThan(0);
  });

  it("coerces a bare string into a string list", () => {
    const parsed = resumeAnalysisSchema.parse({
      ...minimal,
      resumeQuality: { overallScore: 50, atsScore: 50, strengths: "Only one strength" },
    });
    expect(parsed.resumeQuality.strengths).toEqual(["Only one strength"]);
  });

  it("rejects input missing the required top level shape", () => {
    expect(resumeAnalysisSchema.safeParse({ nonsense: true }).success).toBe(false);
    expect(resumeAnalysisSchema.safeParse(null).success).toBe(false);
    expect(resumeAnalysisSchema.safeParse("a string").success).toBe(false);
  });
});

describe("roadmapPlanSchema", () => {
  const phase = {
    title: "Foundations",
    focus: "Basics",
    weekStart: 1,
    weekEnd: 2,
    tasks: [{ title: "Learn", kind: "LEARN", objective: "Do it", estimateHours: 4 }],
  };

  it("requires at least two phases", () => {
    expect(roadmapPlanSchema.safeParse({ title: "x", summary: "y", phases: [phase] }).success).toBe(
      false,
    );
    expect(
      roadmapPlanSchema.safeParse({ title: "x", summary: "y", phases: [phase, phase] }).success,
    ).toBe(true);
  });

  it("defaults an unknown task kind to LEARN", () => {
    const parsed = roadmapPlanSchema.parse({
      title: "x",
      summary: "y",
      phases: [
        { ...phase, tasks: [{ ...phase.tasks[0], kind: "SOMETHING_ELSE" }] },
        phase,
      ],
    });
    expect(parsed.phases[0].tasks[0].kind).toBe("LEARN");
  });

  it("clamps an out-of-range hour estimate", () => {
    const parsed = roadmapPlanSchema.parse({
      title: "x",
      summary: "y",
      phases: [{ ...phase, tasks: [{ ...phase.tasks[0], estimateHours: 900 }] }, phase],
    });
    expect(parsed.phases[0].tasks[0].estimateHours).toBe(40);
  });

  it("rejects a phase with no tasks", () => {
    expect(
      roadmapPlanSchema.safeParse({
        title: "x",
        summary: "y",
        phases: [{ ...phase, tasks: [] }, phase],
      }).success,
    ).toBe(false);
  });
});

describe("interviewEvaluationSchema", () => {
  it("clamps every dimension into the zero to one hundred range", () => {
    const parsed = interviewEvaluationSchema.parse({
      relevance: 150,
      technicalAccuracy: -20,
      structure: "70",
      communication: 80,
      completeness: 60,
      feedback: "Good",
      followUpQuestion: "Next?",
    });
    expect(parsed.relevance).toBe(100);
    expect(parsed.technicalAccuracy).toBe(0);
    expect(parsed.structure).toBe(70);
    expect(parsed.strengths).toEqual([]);
  });
});

describe("form schemas", () => {
  it("enforces password complexity on sign up", () => {
    expect(
      signUpSchema.safeParse({ name: "Ada", email: "a@b.co", password: "Passw0rdd" }).success,
    ).toBe(true);
    expect(signUpSchema.safeParse({ name: "Ada", email: "a@b.co", password: "short" }).success).toBe(
      false,
    );
    expect(
      signUpSchema.safeParse({ name: "Ada", email: "a@b.co", password: "alllowercase1" }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ name: "Ada", email: "a@b.co", password: "NoDigitsHere" }).success,
    ).toBe(false);
  });

  it("rejects a malformed email on sign in", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("treats every onboarding field as optional", () => {
    const parsed = onboardingSchema.parse({});
    expect(parsed.skills).toEqual([]);
  });

  it("rejects an onboarding learning style outside the enum", () => {
    expect(onboardingSchema.safeParse({ learningStyle: "OSMOSIS" }).success).toBe(false);
  });

  it("requires at least one skill and caps the simulation batch", () => {
    expect(careerSimulationSchema.safeParse({ careerRoleId: "r", skillIds: [] }).success).toBe(false);
    expect(
      careerSimulationSchema.safeParse({
        careerRoleId: "r",
        skillIds: Array.from({ length: 13 }, (_, index) => `s${index}`),
      }).success,
    ).toBe(false);
  });

  it("defaults the simulation target level and persistence flag", () => {
    const parsed = careerSimulationSchema.parse({ careerRoleId: "r", skillIds: ["a"] });
    expect(parsed.targetLevel).toBe(75);
    expect(parsed.persist).toBe(true);
  });

  it("requires at least one answer on assessment submission", () => {
    expect(assessmentSubmitSchema.safeParse({ assessmentId: "a", answers: [] }).success).toBe(false);
  });
});

describe("json extraction", () => {
  it("strips markdown code fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("extracts a JSON object surrounded by prose", () => {
    expect(extractJsonBlock('Here you go: {"a":1} hope that helps')).toBe('{"a":1}');
  });

  it("handles braces inside string values", () => {
    expect(extractJsonBlock('{"a":"a } brace"}')).toBe('{"a":"a } brace"}');
  });

  it("handles escaped quotes inside string values", () => {
    expect(parseJsonLoose('{"a":"say \\"hi\\""}')).toEqual({ a: 'say "hi"' });
  });

  it("parses nested structures", () => {
    expect(parseJsonLoose('{"a":{"b":[1,2,{"c":3}]}}')).toEqual({ a: { b: [1, 2, { c: 3 }] } });
  });

  it("recovers from a trailing comma", () => {
    expect(parseJsonLoose('{"a":1,}')).toEqual({ a: 1 });
  });

  it("returns null when there is no JSON at all", () => {
    expect(parseJsonLoose("I cannot help with that.")).toBeNull();
    expect(extractJsonBlock("no json here")).toBeNull();
  });

  it("returns null for an unterminated object", () => {
    expect(extractJsonBlock('{"a":1')).toBeNull();
  });

  it("extracts a top level array", () => {
    expect(parseJsonLoose("[1,2,3]")).toEqual([1, 2, 3]);
  });
});
