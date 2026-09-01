import { prisma } from "@/lib/db/client";
import { DEMO_EMAIL } from "@/lib/data/demo";
import { categoryLabel } from "./resume-service";
import { summarizeRoadmapProgress } from "./roadmap-service";
import { asStringArray } from "@/types/analysis";

export type LandingPreviewData = {
  skills: Array<{ name: string; category: string; level: number; confidence: number; evidence: string | null }>;
  skillCount: number;
  matches: Array<{ role: string; score: number }>;
  roleCount: number;
  simulation: {
    roleTitle: string;
    baselineScore: number;
    projectedScore: number;
    delta: number;
    addedSkills: string[];
    explanation: string | null;
  } | null;
  roadmap: {
    title: string;
    weeklyHours: number;
    percentage: number;
    taskCount: number;
    phases: Array<{ title: string; weekStart: number; weekEnd: number; done: number; total: number }>;
  } | null;
  interview: {
    roleTitle: string;
    kind: string;
    experience: string;
    question: string;
    score: number;
    improvements: string[];
  } | null;
  resume: {
    atsScore: number;
    overallScore: number;
    roleTitle: string;
    bullet: string | null;
  } | null;
};

function firstSubstantiveBullet(text: string) {
  const bullet = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[-*•]/.test(line) && line.length > 50);
  return bullet ? bullet.replace(/^[-*•]\s*/, "") : null;
}

export async function loadLandingPreview(): Promise<LandingPreviewData | null> {
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!demo) return null;

  const [skills, matches, roleCount, simulation, roadmap, interview, resume] = await Promise.all([
    prisma.candidateSkill.findMany({
      where: { userId: demo.id },
      include: { skill: true },
      orderBy: { level: "desc" },
    }),
    prisma.careerMatch.findMany({
      where: { userId: demo.id },
      include: { careerRole: true },
      orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
      take: 4,
    }),
    prisma.careerRole.count(),
    prisma.careerSimulation.findFirst({
      where: { userId: demo.id },
      include: { careerRole: true },
      orderBy: { delta: "desc" },
    }),
    prisma.roadmap.findFirst({
      where: { userId: demo.id, isActive: true },
      include: { phases: { orderBy: { order: "asc" }, include: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interviewSession.findFirst({
      where: { userId: demo.id },
      include: {
        careerRole: true,
        messages: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.resume.findFirst({
      where: { userId: demo.id, isActive: true },
      include: { analysis: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const answered = interview?.messages.find(
    (message) => message.role === "CANDIDATE" && message.score !== null,
  );
  const askedQuestion = interview?.messages.find((message) => message.role === "INTERVIEWER");

  return {
    skills: skills.slice(0, 5).map((entry) => ({
      name: entry.skill.name,
      category: categoryLabel(entry.skill.category),
      level: entry.level,
      confidence: entry.confidence,
      evidence: entry.evidence,
    })),
    skillCount: skills.length,
    matches: matches.map((match) => ({ role: match.careerRole.title, score: match.score })),
    roleCount,
    simulation: simulation
      ? {
          roleTitle: simulation.careerRole.title,
          baselineScore: simulation.baselineScore,
          projectedScore: simulation.projectedScore,
          delta: simulation.delta,
          addedSkills: asStringArray(simulation.addedSkills),
          explanation: simulation.explanation,
        }
      : null,
    roadmap: roadmap
      ? {
          title: roadmap.title,
          weeklyHours: roadmap.weeklyHours,
          percentage: summarizeRoadmapProgress(roadmap.phases).percentage,
          taskCount: roadmap.phases.reduce((total, phase) => total + phase.tasks.length, 0),
          phases: roadmap.phases.slice(0, 5).map((phase) => ({
            title: phase.title,
            weekStart: phase.weekStart,
            weekEnd: phase.weekEnd,
            done: phase.tasks.filter((task) => task.completed).length,
            total: phase.tasks.length,
          })),
        }
      : null,
    interview:
      interview && answered && askedQuestion
        ? {
            roleTitle: interview.careerRole.title,
            kind: interview.kind,
            experience: interview.experience,
            question: askedQuestion.content,
            score: answered.score ?? 0,
            improvements: asStringArray(answered.improvements),
          }
        : null,
    resume: resume?.analysis
      ? {
          atsScore: resume.analysis.atsScore,
          overallScore: resume.analysis.overallScore,
          roleTitle: matches[0]?.careerRole.title ?? "your target role",
          bullet: firstSubstantiveBullet(resume.extractedText),
        }
      : null,
  };
}
