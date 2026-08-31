import { describe, expect, it } from "vitest";
import { SkillResolver, normalizeSkillKey } from "@/lib/services/skill-resolver";
import {
  cleanResumeText,
  detectResumeKind,
  validateResumeFile,
} from "@/lib/services/resume-extract";
import {
  guessYearsExperience,
  scoreResumeQuality,
  splitResumeSections,
} from "@/lib/services/heuristic-analysis";
import {
  fallbackCareerExplanation,
  fallbackResumeOptimization,
  fallbackRoadmapPlan,
  heuristicGradeOpenAnswer,
} from "@/lib/services/fallbacks";
import { roadmapPlanSchema } from "@/lib/validation/ai";
import { MAX_RESUME_BYTES } from "@/lib/validation/forms";
import { SKILL_SEEDS } from "@/lib/data/skills";
import { CAREER_ROLE_SEEDS } from "@/lib/data/careers";
import { LEARNING_RESOURCE_SEEDS } from "@/lib/data/resources";

const catalog = SKILL_SEEDS.map((skill) => ({
  id: skill.slug,
  slug: skill.slug,
  name: skill.name,
  aliases: skill.aliases,
}));

const resolver = new SkillResolver(catalog);

describe("normalizeSkillKey", () => {
  it("normalises punctuation heavy skill names", () => {
    expect(normalizeSkillKey("Node.js")).toBe("nodejs");
    expect(normalizeSkillKey("C++")).toBe("cpp");
    expect(normalizeSkillKey("C#")).toBe("csharp");
    expect(normalizeSkillKey("  REACT   ")).toBe("react");
  });
});

describe("SkillResolver", () => {
  it("resolves exact catalogue names", () => {
    expect(resolver.resolve("React")?.slug).toBe("react");
    expect(resolver.resolve("PostgreSQL")?.slug).toBe("postgresql");
  });

  it("resolves known aliases", () => {
    expect(resolver.resolve("reactjs")?.slug).toBe("react");
    expect(resolver.resolve("js")?.slug).toBe("javascript");
    expect(resolver.resolve("k8s")?.slug).toBe("kubernetes");
    expect(resolver.resolve("postgres")?.slug).toBe("postgresql");
    expect(resolver.resolve("golang")?.slug).toBe("go");
  });

  it("is insensitive to case, spacing, and punctuation", () => {
    expect(resolver.resolve("  node.JS ")?.slug).toBe("nodejs");
    expect(resolver.resolve("Next JS")?.slug).toBe("nextjs");
  });

  it("strips descriptive noise words", () => {
    expect(resolver.resolve("React framework")?.slug).toBe("react");
    expect(resolver.resolve("Python programming")?.slug).toBe("python");
  });

  it("returns null for unknown and empty input", () => {
    expect(resolver.resolve("Underwater Basket Weaving")).toBeNull();
    expect(resolver.resolve("")).toBeNull();
    expect(resolver.resolve("   ")).toBeNull();
  });

  it("detects skills mentioned in free text", () => {
    const found = resolver.detectMentions(
      "Built a React and TypeScript dashboard backed by PostgreSQL and deployed with Docker.",
    );
    const slugs = found.map((skill) => skill.slug);
    expect(slugs).toContain("react");
    expect(slugs).toContain("typescript");
    expect(slugs).toContain("postgresql");
    expect(slugs).toContain("docker");
  });

  it("does not report skills absent from the text", () => {
    const slugs = resolver.detectMentions("I write poetry.").map((skill) => skill.slug);
    expect(slugs).not.toContain("react");
  });
});

describe("resume file validation", () => {
  it("accepts PDF and DOCX by mime type or extension", () => {
    expect(validateResumeFile("cv.pdf", "application/pdf", 1000).ok).toBe(true);
    expect(
      validateResumeFile(
        "cv.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        1000,
      ).ok,
    ).toBe(true);
    expect(validateResumeFile("cv.pdf", "", 1000).ok).toBe(true);
  });

  it("rejects unsupported types", () => {
    const result = validateResumeFile("cv.txt", "text/plain", 1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNSUPPORTED_TYPE");
  });

  it("rejects empty and oversized files", () => {
    const empty = validateResumeFile("cv.pdf", "application/pdf", 0);
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe("EMPTY_FILE");

    const large = validateResumeFile("cv.pdf", "application/pdf", MAX_RESUME_BYTES + 1);
    expect(large.ok).toBe(false);
    if (!large.ok) expect(large.code).toBe("FILE_TOO_LARGE");
  });

  it("detects the file kind", () => {
    expect(detectResumeKind("a.PDF", "")).toBe("pdf");
    expect(detectResumeKind("a.DOCX", "")).toBe("docx");
    expect(detectResumeKind("a.rtf", "application/rtf")).toBeNull();
  });
});

describe("cleanResumeText", () => {
  it("collapses excess blank lines and whitespace", () => {
    expect(cleanResumeText("A\n\n\n\nB")).toBe("A\n\nB");
    expect(cleanResumeText("A     B")).toBe("A B");
  });

  it("normalises bullet glyphs", () => {
    expect(cleanResumeText("• Built a thing")).toBe("- Built a thing");
  });

  it("normalises carriage returns", () => {
    expect(cleanResumeText("A\r\nB")).toBe("A\nB");
  });
});

describe("resume section parsing", () => {
  const resume = [
    "Jane Doe",
    "SUMMARY",
    "Frontend developer.",
    "EXPERIENCE",
    "Engineer | Acme | 2020 - 2023",
    "- Shipped a thing that cut latency by 40 percent",
    "EDUCATION",
    "BSc Computer Science | Some University | 2016 - 2020",
    "SKILLS",
    "React, TypeScript",
  ].join("\n");

  it("splits a resume into recognised sections", () => {
    const sections = splitResumeSections(resume);
    expect(sections.summary).toContain("Frontend developer.");
    expect(sections.experience?.length).toBeGreaterThan(0);
    expect(sections.education?.length).toBeGreaterThan(0);
    expect(sections.skills).toContain("React, TypeScript");
  });

  it("extracts years of experience from an explicit statement", () => {
    expect(guessYearsExperience("I have 6 years of experience")).toBe(6);
  });

  it("infers years of experience from a date range", () => {
    expect(guessYearsExperience("Worked 2018 - 2023 at Acme")).toBe(5);
  });

  it("returns zero when no signal is present", () => {
    expect(guessYearsExperience("No dates at all here")).toBe(0);
  });

  it("scores a structured resume above a bare one", () => {
    const structured = scoreResumeQuality(resume, splitResumeSections(resume), 12);
    const bare = scoreResumeQuality("Jane Doe", splitResumeSections("Jane Doe"), 0);
    expect(structured.overallScore).toBeGreaterThan(bare.overallScore);
    expect(structured.atsScore).toBeGreaterThan(bare.atsScore);
  });

  it("always returns bounded scores and non-empty guidance", () => {
    const result = scoreResumeQuality("", splitResumeSections(""), 0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe("offline fallbacks", () => {
  const explanationContext = {
    roleTitle: "Full Stack Developer",
    roleDescription: "Ships features end to end.",
    score: 66,
    strongSkills: [{ name: "React", level: 80 }],
    gapSkills: [{ name: "Node.js", currentLevel: 34, requiredLevel: 75 }],
    candidateSummary: "Frontend developer.",
  };

  it("produces an explanation naming the role and the gaps", () => {
    const result = fallbackCareerExplanation(explanationContext);
    expect(result.explanation).toContain("Full Stack Developer");
    expect(result.explanation).toContain("Node.js");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.focusAreas.length).toBeGreaterThan(0);
  });

  it("still returns usable copy when there are no skills at all", () => {
    const result = fallbackCareerExplanation({
      ...explanationContext,
      strongSkills: [],
      gapSkills: [],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.focusAreas.length).toBeGreaterThan(0);
  });

  it("builds a roadmap that satisfies the same schema as the AI output", () => {
    const plan = fallbackRoadmapPlan({
      roleTitle: "Full Stack Developer",
      horizonWeeks: 12,
      weeklyHours: 8,
      learningStyle: "PROJECTS",
      yearsExperience: 2,
      currentStrengths: [{ name: "React", level: 80 }],
      gaps: [
        { name: "Node.js", currentLevel: 34, requiredLevel: 75, priority: "HIGH" },
        { name: "SQL", currentLevel: 28, requiredLevel: 70, priority: "HIGH" },
      ],
      learningAreas: ["API design"],
    });
    expect(roadmapPlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.phases.length).toBeGreaterThanOrEqual(2);
  });

  it("builds a valid roadmap even with no recorded gaps", () => {
    const plan = fallbackRoadmapPlan({
      roleTitle: "Frontend Developer",
      horizonWeeks: 4,
      weeklyHours: 2,
      learningStyle: "MIXED",
      yearsExperience: 0,
      currentStrengths: [{ name: "React", level: 60 }],
      gaps: [],
      learningAreas: [],
    });
    expect(roadmapPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("computes keyword coverage from the resume text", () => {
    const report = fallbackResumeOptimization({
      roleTitle: "Full Stack Developer",
      roleDescription: "Ships features.",
      roleSkills: ["React", "Node.js", "SQL", "Docker"],
      missingSkills: [],
      resumeText: "Built interfaces with React and queried data with SQL.",
    });
    expect(report.keywordCoverage).toBe(50);
    expect(report.missingKeywords).toContain("Docker");
    expect(report.missingKeywords).not.toContain("React");
    expect(report.atsReadinessScore).toBeGreaterThanOrEqual(0);
    expect(report.atsReadinessScore).toBeLessThanOrEqual(100);
  });

  it("scores an empty answer at zero", () => {
    const result = heuristicGradeOpenAnswer("", ["Timeouts", "Retries"]);
    expect(result.scorePercent).toBe(0);
  });

  it("rewards an answer that covers the expected points", () => {
    const weak = heuristicGradeOpenAnswer("I would just restart it honestly.", [
      "Timeouts on outbound calls",
      "Circuit breaking or graceful degradation",
    ]);
    const strong = heuristicGradeOpenAnswer(
      "I would set timeouts on outbound calls, add bounded retries, and use circuit breaking so a persistent failure degrades gracefully rather than cascading. I would also emit metrics so the failure is visible within 30 seconds.",
      ["Timeouts on outbound calls", "Circuit breaking or graceful degradation"],
    );
    expect(strong.scorePercent).toBeGreaterThan(weak.scorePercent);
    expect(strong.scorePercent).toBeLessThanOrEqual(100);
  });
});

describe("seed catalogue integrity", () => {
  const slugs = new Set(SKILL_SEEDS.map((skill) => skill.slug));

  it("has unique skill slugs", () => {
    expect(slugs.size).toBe(SKILL_SEEDS.length);
  });

  it("has unique career slugs", () => {
    const careerSlugs = new Set(CAREER_ROLE_SEEDS.map((role) => role.slug));
    expect(careerSlugs.size).toBe(CAREER_ROLE_SEEDS.length);
  });

  it("references only known skills from every career role", () => {
    for (const role of CAREER_ROLE_SEEDS) {
      for (const roleSkill of role.skills) {
        expect(slugs.has(roleSkill.skill), `${role.slug} -> ${roleSkill.skill}`).toBe(true);
      }
    }
  });

  it("references only known skills from every learning resource", () => {
    for (const resource of LEARNING_RESOURCE_SEEDS) {
      expect(slugs.has(resource.skill), `resource -> ${resource.skill}`).toBe(true);
    }
  });

  it("gives every career role at least one required skill", () => {
    for (const role of CAREER_ROLE_SEEDS) {
      expect(
        role.skills.some((skill) => skill.requirement === "REQUIRED"),
        role.slug,
      ).toBe(true);
    }
  });

  it("keeps every required level and weight within sane bounds", () => {
    for (const role of CAREER_ROLE_SEEDS) {
      for (const skill of role.skills) {
        expect(skill.requiredLevel).toBeGreaterThan(0);
        expect(skill.requiredLevel).toBeLessThanOrEqual(100);
        expect(skill.weight).toBeGreaterThan(0);
      }
    }
  });

  it("has no duplicate skill entries within a career role", () => {
    for (const role of CAREER_ROLE_SEEDS) {
      const seen = new Set(role.skills.map((skill) => skill.skill));
      expect(seen.size, role.slug).toBe(role.skills.length);
    }
  });

  it("uses only https urls for learning resources", () => {
    for (const resource of LEARNING_RESOURCE_SEEDS) {
      expect(resource.url.startsWith("https://"), resource.url).toBe(true);
    }
  });

  it("has no duplicate resource urls per skill", () => {
    const seen = new Set<string>();
    for (const resource of LEARNING_RESOURCE_SEEDS) {
      const key = `${resource.skill}::${resource.url}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});
