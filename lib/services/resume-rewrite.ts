import type { ResumeRewritePayload } from "@/lib/validation/ai";
import { scoreResumeQuality, splitResumeSections } from "./heuristic-analysis";
import { normalizeSkillKey } from "./skill-resolver";

export type RewriteScore = {
  overallScore: number;
  atsScore: number;
  keywordCoverage: number;
  quantifiedCount: number;
  bulletCount: number;
  wordCount: number;
};

export function renderResumeText(rewrite: ResumeRewritePayload): string {
  const lines: string[] = [];

  lines.push(rewrite.fullName);
  if (rewrite.contactLine) lines.push(rewrite.contactLine);
  if (rewrite.headline) lines.push(rewrite.headline);
  lines.push("");

  if (rewrite.summary) {
    lines.push("SUMMARY", rewrite.summary, "");
  }

  if (rewrite.skillGroups.length > 0) {
    lines.push("SKILLS");
    for (const group of rewrite.skillGroups) {
      if (group.items.length === 0) continue;
      lines.push(`${group.label}: ${group.items.join(", ")}`);
    }
    lines.push("");
  }

  if (rewrite.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const role of rewrite.experience) {
      lines.push(`${role.title} | ${role.company}${role.period ? ` | ${role.period}` : ""}`);
      for (const bullet of role.bullets) lines.push(`- ${bullet}`);
      lines.push("");
    }
  }

  if (rewrite.projects.length > 0) {
    lines.push("PROJECTS");
    for (const project of rewrite.projects) {
      lines.push(project.name);
      for (const bullet of project.bullets) lines.push(`- ${bullet}`);
      lines.push("");
    }
  }

  if (rewrite.education.length > 0) {
    lines.push("EDUCATION");
    for (const entry of rewrite.education) {
      lines.push(
        `${entry.degree} | ${entry.institution}${entry.period ? ` | ${entry.period}` : ""}`,
      );
    }
    lines.push("");
  }

  if (rewrite.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    for (const item of rewrite.certifications) lines.push(`- ${item}`);
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type RoleSkillTerm = { name: string; aliases: string[] };

export function matchedRoleSkills(text: string, roleSkills: RoleSkillTerm[]) {
  const normalized = ` ${normalizeSkillKey(text)} `;
  return roleSkills.filter((skill) =>
    [skill.name, ...skill.aliases].some((term) => {
      const key = normalizeSkillKey(term);
      return key.length > 1 && normalized.includes(` ${key} `);
    }),
  );
}

export function scoreRewrittenResume(text: string, roleSkills: RoleSkillTerm[]): RewriteScore {
  const sections = splitResumeSections(text);
  const present = matchedRoleSkills(text, roleSkills);
  const skillCount = present.length;
  const quality = scoreResumeQuality(text, sections, skillCount);

  const bulletCount = text.split("\n").filter((line) => line.trim().startsWith("-")).length;
  const quantifiedCount = (
    text.match(/\b\d+(\.\d+)?\s*(%|percent|k\b|m\b|x\b|users|requests|ms\b|s\b|hours|lines|teams)/gi) ??
    []
  ).length;

  return {
    overallScore: quality.overallScore,
    atsScore: quality.atsScore,
    keywordCoverage:
      roleSkills.length > 0 ? Math.round((present.length / roleSkills.length) * 100) : 0,
    quantifiedCount,
    bulletCount,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

export function unfilledPlaceholders(text: string) {
  return (text.match(/\[[^\]]+\]/g) ?? []).map((value) => value.trim());
}

export function improvementGuidance(score: RewriteScore, placeholders: string[]): string[] {
  const notes: string[] = [];

  if (placeholders.length > 0) {
    notes.push(
      `Fill the ${placeholders.length} bracketed placeholder${placeholders.length === 1 ? "" : "s"} with real numbers. Each one you replace raises the score, and they are the fastest gain available.`,
    );
  }
  if (score.quantifiedCount < 4) {
    notes.push(
      `Only ${score.quantifiedCount} measurable result${score.quantifiedCount === 1 ? "" : "s"} were found. Four or more is where this scores well.`,
    );
  }
  if (score.bulletCount < 10) {
    notes.push(
      `There are ${score.bulletCount} bullets. Ten or more substantive bullets reads as a complete history.`,
    );
  }
  if (score.wordCount < 300) {
    notes.push(
      `At ${score.wordCount} words this is short. Between 300 and 700 words scores best without padding.`,
    );
  }
  if (score.keywordCoverage < 70) {
    notes.push(
      `Keyword coverage against the target role is ${score.keywordCoverage}%. Only add terms you have genuinely used.`,
    );
  }

  return notes;
}

export function projectFilledScore(text: string, roleSkills: RoleSkillTerm[]): RewriteScore {
  const filled = text.replace(/\[[^\]]+\]/g, "42 percent");
  return scoreRewrittenResume(filled, roleSkills);
}
