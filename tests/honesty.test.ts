import { describe, expect, it } from "vitest";
import { SkillResolver } from "@/lib/services/skill-resolver";
import { buildHeuristicAnalysis, lengthAdequacy } from "@/lib/services/heuristic-analysis";
import { computeCareerMatch } from "@/lib/engine/scoring";
import { SKILL_SEEDS } from "@/lib/data/skills";
import { CAREER_ROLE_SEEDS } from "@/lib/data/careers";
import type { SkillCategoryValue } from "@/lib/validation/ai";
import type { RoleSkillInput } from "@/lib/engine/types";

const catalog = SKILL_SEEDS.map((skill) => ({
  id: skill.slug,
  slug: skill.slug,
  name: skill.name,
  aliases: skill.aliases,
}));
const resolver = new SkillResolver(catalog);
const categoryOf = (slug: string) =>
  (SKILL_SEEDS.find((skill) => skill.slug === slug)?.category ?? "TOOLS") as SkillCategoryValue;

const role = CAREER_ROLE_SEEDS.find((entry) => entry.slug === "frontend-developer")!;
const roleSkills: RoleSkillInput[] = role.skills.map((roleSkill) => ({
  skillId: roleSkill.skill,
  skillName: roleSkill.skill,
  requirement: roleSkill.requirement,
  weight: roleSkill.weight,
  requiredLevel: roleSkill.requiredLevel,
}));

const RESUMES: Record<string, string> = {
  JUNK: `hi my name is bob
i want a job at your company
i am hard working and a team player and i learn fast
i am available immediately
thanks for reading`,

  WEAK: `Bob Smith
bob@example.com | 555-0100

OBJECTIVE
Looking for a role where I can grow my skills and contribute to a great team.

EDUCATION
BSc Computer Science, State University, 2023

SKILLS
HTML, CSS, JavaScript, Microsoft Word, teamwork, communication

EXPERIENCE
Intern, Local Shop, Summer 2023
- Helped with the website
- Did various tasks assigned by my manager
- Attended team meetings

Volunteer, Community Centre, 2022
- Assisted with events
- Helped visitors with questions`,

  AVERAGE: `Priya Rao
priya@example.com | github.com/example-priya

SUMMARY
Frontend developer with 2 years of experience building React applications for
internal business tools. Comfortable working from designs and shipping features.

EXPERIENCE
Frontend Developer | Midsize Co | 2023 - Present
- Built React components for the customer portal used by the support team
- Worked with the design team to implement the new checkout flow
- Fixed bugs reported by QA during release cycles
- Used Git for version control and participated in code reviews
- Wrote unit tests for the forms module
- Helped migrate some older pages to the new component library

Junior Developer | Small Agency | 2022 - 2023
- Built landing pages in HTML and CSS for client campaigns
- Updated content on existing WordPress sites
- Assisted senior developers with JavaScript tasks

EDUCATION
BSc Computer Science, State University, 2018 - 2022

SKILLS
JavaScript, React, HTML, CSS, Git, TypeScript, Testing`,

  STRONG: `Alex Chen
alex@example.com | github.com/example-alex | linkedin.com/in/example-alex

SUMMARY
Senior frontend engineer with 7 years building large React and TypeScript
applications. Focused on performance, accessibility, and design systems that
other teams can build on.

EXPERIENCE
Senior Frontend Engineer | ScaleCo | 2020 - Present
- Led migration of a 400k line codebase to TypeScript, cutting runtime type errors by 82 percent
- Rebuilt the design system in React, adopted by 9 teams and reducing UI build time by 40 percent
- Cut Largest Contentful Paint from 4.1s to 1.3s across the marketing surface
- Introduced Playwright and Testing Library coverage, taking the checkout path from 12 to 88 percent
- Resolved 140 WCAG 2.1 AA violations and set up automated accessibility gates in CI
- Mentored 4 engineers through the promotion process and ran the frontend guild

Frontend Engineer | StartupCo | 2018 - 2020
- Shipped the Next.js server rendered storefront serving 2.4m monthly users
- Built the Redux state layer and REST API integration for the ordering flow
- Reduced JavaScript bundle size by 340k through code splitting and dependency audits
- Implemented the Tailwind CSS design tokens shared across web and email

PROJECTS
Component Inspector - Open source React devtools extension
- Visualises render cost per component, 1200 stars on GitHub

EDUCATION
BSc Computer Science, Tech University, 2014 - 2018

SKILLS
JavaScript, TypeScript, React, Next.js, Redux, HTML, CSS, Tailwind CSS, Testing,
Web Performance, Accessibility, REST APIs, Git, Figma, Node.js, GraphQL`,
};

function evaluate(text: string) {
  const analysis = buildHeuristicAnalysis(text, resolver, categoryOf);
  const candidateSkills = analysis.skills
    .map((skill) => {
      const resolved = resolver.resolve(skill.name);
      return resolved
        ? { skillId: resolved.slug, level: skill.proficiency, confidence: skill.confidence }
        : null;
    })
    .filter((v): v is { skillId: string; level: number; confidence: number } => v !== null);

  return {
    resumeScore: analysis.resumeQuality.overallScore,
    atsScore: analysis.resumeQuality.atsScore,
    skillCount: analysis.skills.length,
    match: computeCareerMatch(candidateSkills, roleSkills),
  };
}

const junk = evaluate(RESUMES.JUNK);
const weak = evaluate(RESUMES.WEAK);
const average = evaluate(RESUMES.AVERAGE);
const strong = evaluate(RESUMES.STRONG);

describe("scoring honesty: a bad resume must score badly", () => {
  it("gives a content-free resume a near-zero resume score", () => {
    expect(junk.resumeScore).toBeLessThanOrEqual(12);
    expect(junk.atsScore).toBeLessThanOrEqual(12);
  });

  it("gives a content-free resume a zero career match", () => {
    expect(junk.match.score).toBe(0);
    expect(junk.match.requiredMet).toBe(0);
  });

  it("keeps a thin resume well below passing", () => {
    expect(weak.resumeScore).toBeGreaterThanOrEqual(10);
    expect(weak.resumeScore).toBeLessThanOrEqual(35);
  });

  it("places a resume with no quantified outcomes in the middle band", () => {
    expect(average.resumeScore).toBeGreaterThanOrEqual(35);
    expect(average.resumeScore).toBeLessThanOrEqual(62);
  });

  it("rewards a genuinely strong resume with a high score", () => {
    expect(strong.resumeScore).toBeGreaterThanOrEqual(75);
    expect(strong.match.score).toBeGreaterThanOrEqual(70);
    expect(strong.match.requiredMet).toBeGreaterThanOrEqual(3);
  });
});

describe("scoring honesty: ordering is strictly monotonic", () => {
  it("orders resume quality by actual quality", () => {
    expect(junk.resumeScore).toBeLessThan(weak.resumeScore);
    expect(weak.resumeScore).toBeLessThan(average.resumeScore);
    expect(average.resumeScore).toBeLessThan(strong.resumeScore);
  });

  it("orders ATS readiness by actual quality", () => {
    expect(junk.atsScore).toBeLessThan(weak.atsScore);
    expect(weak.atsScore).toBeLessThan(average.atsScore);
    expect(average.atsScore).toBeLessThan(strong.atsScore);
  });

  it("orders career compatibility by actual quality", () => {
    expect(junk.match.score).toBeLessThan(weak.match.score);
    expect(weak.match.score).toBeLessThan(average.match.score);
    expect(average.match.score).toBeLessThan(strong.match.score);
  });

  it("separates the weakest and strongest by a wide margin", () => {
    expect(strong.resumeScore - weak.resumeScore).toBeGreaterThanOrEqual(45);
  });
});

describe("scoring honesty: headings alone do not earn a score", () => {
  const headingsOnly = [
    "Jane Doe",
    "SUMMARY",
    "EXPERIENCE",
    "EDUCATION",
    "SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
  ].join("\n");

  it("does not reward an empty skeleton of section headings", () => {
    const result = evaluate(headingsOnly);
    expect(result.resumeScore).toBeLessThanOrEqual(20);
    expect(result.atsScore).toBeLessThanOrEqual(20);
  });

  it("scores the skeleton far below a real resume with the same headings", () => {
    const result = evaluate(headingsOnly);
    expect(result.resumeScore).toBeLessThan(strong.resumeScore - 50);
  });
});

describe("scoring honesty: every score is a bounded integer", () => {
  it("never emits a fractional score", () => {
    for (const result of [junk, weak, average, strong]) {
      expect(Number.isInteger(result.resumeScore)).toBe(true);
      expect(Number.isInteger(result.atsScore)).toBe(true);
      expect(Number.isInteger(result.match.score)).toBe(true);
    }
  });

  it("keeps every score within zero to one hundred", () => {
    for (const result of [junk, weak, average, strong]) {
      expect(result.resumeScore).toBeGreaterThanOrEqual(0);
      expect(result.resumeScore).toBeLessThanOrEqual(100);
      expect(result.atsScore).toBeGreaterThanOrEqual(0);
      expect(result.atsScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("scoring honesty: skill levels reflect evidence, not mentions", () => {
  it("rates a bare skill listing far below a demonstrated skill", () => {
    const listed = buildHeuristicAnalysis(
      "Jane Doe\nSKILLS\nKubernetes",
      resolver,
      categoryOf,
    ).skills.find((skill) => skill.name === "Kubernetes");

    const demonstrated = buildHeuristicAnalysis(
      [
        "Jane Doe",
        "EXPERIENCE",
        "Platform Engineer | Acme | 2019 - 2024",
        "- Ran Kubernetes across 3 regions and cut deploy time by 60 percent",
        "- Migrated 40 services onto Kubernetes with zero downtime",
        "SKILLS",
        "Kubernetes",
      ].join("\n"),
      resolver,
      categoryOf,
    ).skills.find((skill) => skill.name === "Kubernetes");

    expect(listed).toBeDefined();
    expect(demonstrated).toBeDefined();
    expect(demonstrated!.proficiency).toBeGreaterThan(listed!.proficiency + 20);
  });
});

describe("lengthAdequacy", () => {
  it("penalises resumes that are too short to assess", () => {
    expect(lengthAdequacy(30)).toBeLessThan(lengthAdequacy(150));
    expect(lengthAdequacy(150)).toBeLessThan(lengthAdequacy(400));
  });

  it("does not reward padding beyond a normal resume length", () => {
    expect(lengthAdequacy(2000)).toBeLessThan(lengthAdequacy(500));
  });

  it("stays within a sensible multiplier range", () => {
    for (const count of [0, 50, 100, 250, 500, 1200, 3000]) {
      expect(lengthAdequacy(count)).toBeGreaterThan(0);
      expect(lengthAdequacy(count)).toBeLessThanOrEqual(1);
    }
  });
});
