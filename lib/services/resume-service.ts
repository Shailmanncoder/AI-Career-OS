import type { SkillCategory } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { analyzeResume } from "@/lib/ai/tasks/resume-analysis";
import type { ResumeAnalysisPayload, SkillCategoryValue } from "@/lib/validation/ai";
import { buildHeuristicAnalysis } from "./heuristic-analysis";
import { SkillResolver, type ResolvableSkill } from "./skill-resolver";
import { recomputeCareerIntelligence } from "./career-service";
import { clamp } from "@/lib/utils";

export type ResumeProcessingOutcome = {
  resumeId: string;
  usedFallback: boolean;
  aiErrorCode?: string;
  skillCount: number;
  overallScore: number;
  atsScore: number;
};

async function loadResolver() {
  const skills = await prisma.skill.findMany({
    select: { id: true, slug: true, name: true, aliases: true, category: true },
  });

  const resolvable: ResolvableSkill[] = skills.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    aliases: skill.aliases,
  }));

  const categoryBySlug = new Map(skills.map((skill) => [skill.slug, skill.category]));

  return {
    resolver: new SkillResolver(resolvable),
    categoryOf: (slug: string) =>
      (categoryBySlug.get(slug) ?? "TOOLS") as unknown as SkillCategoryValue,
    skillIdByName: new Map(skills.map((skill) => [skill.name, skill.id])),
  };
}

export async function persistExtractedSkills(
  userId: string,
  payload: ResumeAnalysisPayload,
  resolver: SkillResolver,
) {
  const resolved = new Map<
    string,
    { level: number; confidence: number; evidence?: string; yearsUsed?: number }
  >();

  for (const extracted of payload.skills) {
    const skill = resolver.resolve(extracted.name);
    if (!skill) continue;
    const existing = resolved.get(skill.id);
    if (existing && existing.level >= extracted.proficiency) continue;
    resolved.set(skill.id, {
      level: clamp(extracted.proficiency),
      confidence: extracted.confidence,
      evidence: extracted.evidence,
      yearsUsed: extracted.yearsUsed,
    });
  }

  const existingVerified = await prisma.candidateSkill.findMany({
    where: { userId, verified: true },
    select: { skillId: true, level: true },
  });
  const verifiedFloor = new Map(existingVerified.map((skill) => [skill.skillId, skill.level]));

  const operations = Array.from(resolved.entries()).map(([skillId, data]) => {
    const floor = verifiedFloor.get(skillId);
    const level = floor !== undefined ? Math.max(floor, data.level) : data.level;

    return prisma.candidateSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: {
        userId,
        skillId,
        level,
        confidence: data.confidence,
        evidence: data.evidence,
        yearsUsed: data.yearsUsed,
        source: "RESUME",
      },
      update: {
        level,
        confidence: data.confidence,
        evidence: data.evidence,
        yearsUsed: data.yearsUsed,
      },
    });
  });

  if (operations.length > 0) await prisma.$transaction(operations);
  return resolved.size;
}

export async function processResumeAnalysis(
  userId: string,
  resumeId: string,
): Promise<ResumeProcessingOutcome> {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) throw new Error("RESUME_NOT_FOUND");

  await prisma.resume.update({ where: { id: resumeId }, data: { status: "ANALYZING" } });

  const [{ resolver, categoryOf }, profile] = await Promise.all([
    loadResolver(),
    prisma.profile.findUnique({
      where: { userId },
      include: { targetCareer: true },
    }),
  ]);

  const declaredSkills = await prisma.candidateSkill.findMany({
    where: { userId, source: "ONBOARDING" },
    include: { skill: true },
  });

  const aiResult = await analyzeResume({
    resumeText: resume.extractedText,
    currentRole: profile?.currentRole,
    targetRole: profile?.targetCareer?.title,
    educationLevel: profile?.educationLevel,
    declaredSkills: declaredSkills.map((skill) => skill.skill.name),
  });

  const usedFallback = !aiResult.ok;
  const payload = aiResult.ok
    ? aiResult.data
    : buildHeuristicAnalysis(resume.extractedText, resolver, categoryOf);

  const skillCount = await persistExtractedSkills(userId, payload, resolver);

  await prisma.resumeAnalysis.upsert({
    where: { resumeId },
    create: {
      resumeId,
      summary: payload.candidateProfile.summary,
      fullName: payload.candidateProfile.fullName,
      headline: payload.candidateProfile.headline,
      yearsExperience: payload.candidateProfile.yearsExperience,
      overallScore: payload.resumeQuality.overallScore,
      atsScore: payload.resumeQuality.atsScore,
      education: payload.candidateProfile.education,
      experience: payload.candidateProfile.experience,
      projects: payload.candidateProfile.projects,
      certifications: payload.candidateProfile.certifications,
      achievements: payload.candidateProfile.achievements,
      careerSignals: payload.careerSignals,
      strengths: payload.resumeQuality.strengths,
      weaknesses: payload.resumeQuality.weaknesses,
      recommendations: payload.resumeQuality.recommendations,
      modelUsed: aiResult.ok ? aiResult.model : "offline-heuristic",
      isFallback: usedFallback,
    },
    update: {
      summary: payload.candidateProfile.summary,
      fullName: payload.candidateProfile.fullName,
      headline: payload.candidateProfile.headline,
      yearsExperience: payload.candidateProfile.yearsExperience,
      overallScore: payload.resumeQuality.overallScore,
      atsScore: payload.resumeQuality.atsScore,
      education: payload.candidateProfile.education,
      experience: payload.candidateProfile.experience,
      projects: payload.candidateProfile.projects,
      certifications: payload.candidateProfile.certifications,
      achievements: payload.candidateProfile.achievements,
      careerSignals: payload.careerSignals,
      strengths: payload.resumeQuality.strengths,
      weaknesses: payload.resumeQuality.weaknesses,
      recommendations: payload.resumeQuality.recommendations,
      modelUsed: aiResult.ok ? aiResult.model : "offline-heuristic",
      isFallback: usedFallback,
    },
  });

  if (payload.candidateProfile.yearsExperience > 0) {
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, yearsExperience: payload.candidateProfile.yearsExperience },
      update: { yearsExperience: payload.candidateProfile.yearsExperience },
    });
  }

  await prisma.resume.update({ where: { id: resumeId }, data: { status: "READY" } });

  await recomputeCareerIntelligence(userId);

  await prisma.activityEvent.create({
    data: {
      userId,
      kind: "RESUME_ANALYZED",
      label: `Analyzed ${resume.fileName}`,
      value: payload.resumeQuality.overallScore,
    },
  });

  return {
    resumeId,
    usedFallback,
    aiErrorCode: aiResult.ok ? undefined : aiResult.code,
    skillCount,
    overallScore: payload.resumeQuality.overallScore,
    atsScore: payload.resumeQuality.atsScore,
  };
}

export async function getActiveResume(userId: string) {
  return prisma.resume.findFirst({
    where: { userId, isActive: true },
    include: { analysis: true },
    orderBy: { createdAt: "desc" },
  });
}

export function categoryLabel(category: SkillCategory | string) {
  const labels: Record<string, string> = {
    PROGRAMMING: "Programming",
    FRAMEWORKS: "Frameworks",
    DATABASES: "Databases",
    CLOUD: "Cloud",
    DEVOPS: "DevOps",
    AI_ML: "AI / ML",
    DATA: "Data",
    SECURITY: "Security",
    TOOLS: "Tools",
    SOFT_SKILLS: "Soft Skills",
    COMMUNICATION: "Communication",
    LEADERSHIP: "Leadership",
  };
  return labels[category as string] ?? "Other";
}
