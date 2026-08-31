import { clamp, titleCase } from "@/lib/utils";
import type { ResumeAnalysisPayload } from "@/lib/validation/ai";
import type { SkillCategoryValue } from "@/lib/validation/ai";
import { normalizeSkillKey, type ResolvableSkill, SkillResolver } from "./skill-resolver";

const SECTION_PATTERNS: Record<string, RegExp> = {
  summary: /^(professional\s+)?(summary|profile|objective|about(\s+me)?)\b/i,
  experience: /^(work\s+|professional\s+|employment\s+)?(experience|history)\b/i,
  education: /^education(al)?(\s+background)?\b/i,
  projects: /^(personal\s+|academic\s+|key\s+)?projects?\b/i,
  skills: /^(technical\s+|core\s+)?(skills|competencies|technologies|tech\s+stack)\b/i,
  certifications: /^(certifications?|licenses?|credentials)\b/i,
  achievements: /^(achievements?|awards?|honou?rs|accomplishments)\b/i,
};

export type ResumeSections = Record<string, string[]>;

export function splitResumeSections(text: string): ResumeSections {
  const lines = text.split("\n");
  const sections: ResumeSections = { header: [] };
  let current = "header";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const isHeadingCandidate = trimmed.length <= 60 && !/[.;]$/.test(trimmed);
    if (isHeadingCandidate) {
      const bare = trimmed.replace(/[:\-–—|]+$/, "").trim();
      const matched = Object.entries(SECTION_PATTERNS).find(([, pattern]) => pattern.test(bare));
      if (matched) {
        current = matched[0];
        if (!sections[current]) sections[current] = [];
        continue;
      }
    }

    if (!sections[current]) sections[current] = [];
    sections[current].push(trimmed);
  }

  return sections;
}

export function guessFullName(sections: ResumeSections) {
  const header = sections.header ?? [];
  for (const line of header.slice(0, 4)) {
    const cleaned = line.replace(/[^A-Za-z .'-]/g, "").trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) continue;
    if (/@|http|\d/.test(line)) continue;
    const looksLikeName = words.every((word) => /^[A-Z][a-zA-Z.'-]*$/.test(word));
    if (looksLikeName) return words.join(" ");
  }
  return undefined;
}

export function guessYearsExperience(text: string) {
  const explicit = text.match(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years|yrs)\b/i);
  if (explicit) {
    const value = Number(explicit[1]);
    if (Number.isFinite(value) && value <= 45) return value;
  }

  const years = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g))
    .map((match) => Number(match[0]))
    .filter((year) => year >= 1980 && year <= new Date().getFullYear());

  if (years.length >= 2) {
    const earliest = Math.min(...years);
    const latest = Math.max(...years);
    const span = latest - earliest;
    if (span > 0 && span <= 45) return Math.min(span, 25);
  }

  return 0;
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export function estimateSkillProficiency(
  skill: ResolvableSkill,
  normalizedText: string,
  yearsExperience: number,
  inSkillsSection: boolean,
) {
  const terms = [skill.name, ...skill.aliases].map(normalizeSkillKey).filter(Boolean);
  const mentions = terms.reduce(
    (total, term) => total + countOccurrences(` ${normalizedText} `, ` ${term} `),
    0,
  );

  const base = 34;
  const mentionBoost = Math.min(26, mentions * 7);
  const experienceBoost = Math.min(18, Math.round(yearsExperience * 3.5));
  const sectionBoost = inSkillsSection ? 6 : 0;

  return clamp(base + mentionBoost + experienceBoost + sectionBoost, 20, 88);
}

export function estimateSkillConfidence(mentionsInExperience: boolean, mentionCount: number) {
  const base = 0.45;
  const evidenceBoost = mentionsInExperience ? 0.2 : 0;
  const repetitionBoost = Math.min(0.2, mentionCount * 0.05);
  return Number(Math.min(0.9, base + evidenceBoost + repetitionBoost).toFixed(2));
}

function parseExperienceEntries(lines: string[]) {
  const entries: ResumeAnalysisPayload["candidateProfile"]["experience"] = [];
  let current: (typeof entries)[number] | null = null;

  for (const line of lines) {
    const isBullet = /^[-*•]/.test(line);
    if (isBullet && current) {
      current.highlights.push(line.replace(/^[-*•]\s*/, "").slice(0, 400));
      continue;
    }

    const period = line.match(
      /((?:19|20)\d{2}|present|current|[A-Z][a-z]{2}\s+(?:19|20)\d{2})\s*[-–—to]+\s*((?:19|20)\d{2}|present|current|[A-Z][a-z]{2}\s+(?:19|20)\d{2})/i,
    );
    const separated = line.split(/\s+[|@•·]\s+|\s+-\s+|,\s+/).map((part) => part.trim());

    if (current && current.highlights.length === 0 && !period && separated.length < 2) {
      current.highlights.push(line.slice(0, 400));
      continue;
    }

    current = {
      company: separated[1] ?? separated[0] ?? "Unknown company",
      title: separated[0] ?? "Unknown role",
      period: period ? period[0] : undefined,
      location: undefined,
      highlights: [],
    };
    entries.push(current);
  }

  return entries.slice(0, 8);
}

function parseEducationEntries(lines: string[]) {
  return lines
    .filter((line) => !/^[-*•]/.test(line))
    .slice(0, 6)
    .map((line) => {
      const parts = line.split(/\s+[|,]\s+|\s+-\s+/).map((part) => part.trim());
      const period = line.match(/((?:19|20)\d{2})(?:\s*[-–—]\s*((?:19|20)\d{2}|present))?/i);
      const degreeMatch = line.match(
        /(bachelor[^,|]*|master[^,|]*|b\.?\s?tech[^,|]*|m\.?\s?tech[^,|]*|b\.?\s?sc[^,|]*|m\.?\s?sc[^,|]*|bca|mca|mba|ph\.?d[^,|]*|diploma[^,|]*)/i,
      );
      return {
        institution: parts.find((part) => /university|college|institute|school|academy/i.test(part)) ??
          parts[0] ??
          "Unknown institution",
        degree: degreeMatch ? degreeMatch[0].trim() : undefined,
        field: undefined,
        period: period ? period[0] : undefined,
        highlights: [],
      };
    });
}

function parseProjectEntries(lines: string[], resolver: SkillResolver) {
  const entries: ResumeAnalysisPayload["candidateProfile"]["projects"] = [];
  let current: (typeof entries)[number] | null = null;

  for (const line of lines) {
    const isBullet = /^[-*•]/.test(line);
    if (isBullet && current) {
      current.description = `${current.description} ${line.replace(/^[-*•]\s*/, "")}`.trim().slice(0, 1200);
      continue;
    }
    current = {
      name: line.split(/[|:–—-]/)[0].trim().slice(0, 200) || "Untitled project",
      description: line.slice(0, 1200),
      technologies: resolver.detectMentions(line).map((skill) => skill.name).slice(0, 10),
      link: line.match(/https?:\/\/\S+/)?.[0],
    };
    entries.push(current);
  }

  return entries.slice(0, 8);
}

export function scoreResumeQuality(text: string, sections: ResumeSections, skillCount: number) {
  const bulletCount = (text.match(/^[-*•]/gm) ?? []).length;
  const quantifiedCount = (text.match(/\b\d+(\.\d+)?\s*(%|percent|k\b|m\b|x\b|users|requests|ms\b)/gi) ?? [])
    .length;
  const hasContact = /@|linkedin|github/i.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const sectionScore =
    (sections.experience?.length ? 22 : 0) +
    (sections.education?.length ? 14 : 0) +
    (sections.skills?.length ? 14 : 0) +
    (sections.projects?.length ? 12 : 0) +
    (sections.summary?.length ? 8 : 0) +
    (sections.certifications?.length ? 5 : 0);

  const evidenceScore =
    Math.min(14, Math.round(bulletCount * 1.2)) +
    Math.min(12, quantifiedCount * 4) +
    (hasContact ? 5 : 0) +
    Math.min(8, Math.round(skillCount / 2));

  const lengthPenalty = wordCount < 180 ? 12 : wordCount > 1400 ? 6 : 0;

  const overallScore = clamp(sectionScore + evidenceScore - lengthPenalty, 10, 96);

  const atsScore = clamp(
    (sections.skills?.length ? 26 : 8) +
      (sections.experience?.length ? 24 : 6) +
      (sections.education?.length ? 14 : 4) +
      Math.min(18, skillCount * 1.4) +
      (hasContact ? 8 : 0) +
      (bulletCount >= 6 ? 8 : 2),
    10,
    96,
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (sections.experience?.length) strengths.push("A dedicated experience section is present and parseable.");
  if (skillCount >= 10) strengths.push(`${skillCount} distinct skills were detected across the document.`);
  if (quantifiedCount >= 2) strengths.push("Several bullets already carry quantified outcomes.");
  if (sections.projects?.length) strengths.push("Project work gives concrete evidence beyond job titles.");
  if (strengths.length === 0) strengths.push("The document is machine readable, which many resumes are not.");

  if (!sections.summary?.length) {
    weaknesses.push("No professional summary was found at the top of the resume.");
    recommendations.push("Add a three line summary naming your target role and two strongest skills.");
  }
  if (!sections.projects?.length) {
    weaknesses.push("No project section was detected.");
    recommendations.push("Add two projects with the problem, your approach, and the measurable result.");
  }
  if (quantifiedCount < 2) {
    weaknesses.push("Most bullets describe responsibilities rather than measurable outcomes.");
    recommendations.push("Rewrite your top bullets to include a number: users served, latency saved, or time reduced.");
  }
  if (bulletCount < 6) {
    weaknesses.push("Experience is written in prose rather than scannable bullets.");
    recommendations.push("Convert experience paragraphs into three to five bullets per role.");
  }
  if (skillCount < 8) {
    weaknesses.push("Few recognisable technical keywords were found.");
    recommendations.push("List your tools and technologies explicitly in a dedicated skills section.");
  }
  if (weaknesses.length === 0) weaknesses.push("No structural problems were detected by the offline parser.");
  if (recommendations.length === 0) {
    recommendations.push("Tailor the summary and skills section to each target role before applying.");
  }

  return { overallScore, atsScore, strengths, weaknesses, recommendations };
}

export function buildHeuristicAnalysis(
  text: string,
  resolver: SkillResolver,
  categoryOf: (slug: string) => SkillCategoryValue,
): ResumeAnalysisPayload {
  const sections = splitResumeSections(text);
  const normalizedText = normalizeSkillKey(text);
  const yearsExperience = guessYearsExperience(text);
  const skillsSectionText = (sections.skills ?? []).join(" ");
  const experienceText = (sections.experience ?? []).concat(sections.projects ?? []).join(" ");
  const normalizedExperience = normalizeSkillKey(experienceText);
  const skillsSectionSlugs = new Set(
    resolver.detectMentions(skillsSectionText).map((skill) => skill.slug),
  );

  const detected = resolver.detectMentions(text);
  const skills = detected.slice(0, 30).map((skill) => {
    const terms = [skill.name, ...skill.aliases].map(normalizeSkillKey).filter(Boolean);
    const mentionCount = terms.reduce(
      (total, term) => total + countOccurrences(` ${normalizedText} `, ` ${term} `),
      0,
    );
    const inExperience = terms.some((term) => ` ${normalizedExperience} `.includes(` ${term} `));

    return {
      name: skill.name,
      category: categoryOf(skill.slug),
      proficiency: estimateSkillProficiency(
        skill,
        normalizedText,
        yearsExperience,
        skillsSectionSlugs.has(skill.slug),
      ),
      evidence: inExperience
        ? "Mentioned in the experience or project sections of the resume."
        : "Listed in the resume without supporting experience detail.",
      confidence: estimateSkillConfidence(inExperience, mentionCount),
      yearsUsed: undefined,
    };
  });

  const experience = parseExperienceEntries(sections.experience ?? []);
  const education = parseEducationEntries(sections.education ?? []);
  const projects = parseProjectEntries(sections.projects ?? [], resolver);
  const certifications = (sections.certifications ?? []).slice(0, 8).map((line) => ({
    name: line.replace(/^[-*•]\s*/, "").slice(0, 200),
    issuer: undefined,
    year: line.match(/\b(19|20)\d{2}\b/)?.[0],
  }));
  const achievements = (sections.achievements ?? [])
    .map((line) => line.replace(/^[-*•]\s*/, "").slice(0, 300))
    .slice(0, 10);

  const quality = scoreResumeQuality(text, sections, skills.length);

  const topSkills = [...skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 5);
  const summaryFromResume = (sections.summary ?? []).join(" ").slice(0, 1000);
  const summary =
    summaryFromResume ||
    [
      `Offline analysis detected ${skills.length} recognised skills`,
      experience.length > 0 ? ` across ${experience.length} recorded roles` : "",
      topSkills.length > 0 ? `. Strongest signals: ${topSkills.map((s) => s.name).join(", ")}.` : ".",
      " Connect a Gemini API key for a full narrative analysis.",
    ].join("");

  const careerSignals = topSkills.slice(0, 3).map((skill, index) => ({
    role: `${titleCase(skill.name)} focused role`,
    confidence: Number(Math.max(0.3, 0.7 - index * 0.12).toFixed(2)),
    reasoning: `Derived from keyword frequency for ${skill.name} in the submitted resume, not from a language model.`,
  }));

  return {
    candidateProfile: {
      fullName: guessFullName(sections),
      headline: experience[0]?.title,
      summary,
      yearsExperience,
      education,
      experience,
      projects,
      certifications,
      achievements,
    },
    skills,
    careerSignals,
    resumeQuality: quality,
  };
}
