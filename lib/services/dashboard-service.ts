import { prisma } from "@/lib/db/client";
import { averageOf, learningStreak } from "@/lib/engine/scoring";
import { getActiveRoadmap, summarizeRoadmapProgress } from "./roadmap-service";

export type NextAction = {
  label: string;
  description: string;
  href: string;
  cta: string;
};

export async function loadDashboardData(userId: string) {
  const [
    profile,
    resume,
    matches,
    candidateSkills,
    roadmap,
    attempts,
    interviews,
    simulations,
    activities,
    learningDone,
    totalRoleCount,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, include: { targetCareer: true } }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      include: { analysis: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.careerMatch.findMany({
      where: { userId },
      include: { careerRole: true },
      orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
      take: 6,
    }),
    prisma.candidateSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { level: "desc" },
    }),
    getActiveRoadmap(userId),
    prisma.assessmentAttempt.findMany({
      where: { userId, status: "SCORED" },
      include: { assessment: { include: { skill: true } } },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
    prisma.interviewSession.findMany({
      where: { userId },
      include: { careerRole: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.careerSimulation.findMany({
      where: { userId },
      include: { careerRole: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.learningProgress.count({ where: { userId, completed: true } }),
    prisma.careerRole.count(),
  ]);

  const topMatch = matches[0] ?? null;
  const focusRoleId = profile?.targetCareerId ?? topMatch?.careerRoleId ?? null;

  const [gaps, focusRoleSkills] = await Promise.all([
    focusRoleId
      ? prisma.skillGap.findMany({
          where: { userId, careerRoleId: focusRoleId },
          include: { skill: true },
          orderBy: { priorityScore: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
    focusRoleId
      ? prisma.careerRoleSkill.findMany({
          where: { careerRoleId: focusRoleId },
          include: { skill: true },
        })
      : Promise.resolve([]),
  ]);

  const roadmapProgress = roadmap
    ? summarizeRoadmapProgress(roadmap.phases)
    : { total: 0, completed: 0, percentage: 0, totalHours: 0, completedHours: 0 };

  const streakDates = [
    ...activities.map((activity) => activity.createdAt),
    ...attempts.map((attempt) => attempt.submittedAt ?? attempt.startedAt),
    ...interviews.map((session) => session.createdAt),
  ];

  const levelBySkill = new Map(candidateSkills.map((entry) => [entry.skillId, entry.level]));
  const skillGapBreakdown = focusRoleSkills.reduce(
    (totals, roleSkill) => {
      const level = levelBySkill.get(roleSkill.skillId) ?? 0;
      if (level >= roleSkill.requiredLevel) totals.known += 1;
      else if (level > 0) totals.learning += 1;
      else totals.missing += 1;
      return totals;
    },
    { known: 0, learning: 0, missing: 0 },
  );

  const dayKey = (value: Date) => value.toISOString().slice(0, 10);
  const activityByDay = new Map<string, number>();
  for (const date of streakDates) {
    const key = dayKey(date);
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  }
  const streakHistory = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    const key = dayKey(date);
    return { label: key.slice(5), value: activityByDay.get(key) ?? 0 };
  });

  return {
    profile,
    resume,
    analysis: resume?.analysis ?? null,
    matches,
    topMatch,
    focusRoleId,
    gaps,
    candidateSkills,
    roadmap,
    roadmapProgress,
    attempts,
    interviews,
    simulations,
    activities,
    totalRoleCount,
    skillGapBreakdown,
    streakHistory,
    stats: {
      skillCount: candidateSkills.length,
      verifiedSkillCount: candidateSkills.filter((skill) => skill.verified).length,
      gapCount: gaps.length,
      resumeScore: resume?.analysis?.overallScore ?? 0,
      atsScore: resume?.analysis?.atsScore ?? 0,
      topScore: topMatch?.score ?? 0,
      assessmentAverage: averageOf(attempts.map((attempt) => attempt.score)),
      interviewAverage: averageOf(
        interviews.filter((session) => session.answeredCount > 0).map((session) => session.averageScore),
      ),
      learningCompleted: learningDone,
      streak: learningStreak(streakDates),
      roadmapPercentage: roadmapProgress.percentage,
    },
  };
}

export function resolveNextAction(data: Awaited<ReturnType<typeof loadDashboardData>>): NextAction {
  if (!data.resume || data.resume.status === "FAILED") {
    return {
      label: "Upload your resume",
      description: "Everything else in AI CareerOS is derived from your resume. Start here.",
      href: "/resume",
      cta: "Upload resume",
    };
  }

  if (!data.profile?.onboardingDone) {
    return {
      label: "Finish your profile",
      description: "Your target role and weekly time budget sharpen every recommendation.",
      href: "/onboarding",
      cta: "Complete onboarding",
    };
  }

  if (data.matches.length === 0) {
    return {
      label: "Run career matching",
      description: "Score your profile against every role in the career database.",
      href: "/careers",
      cta: "Match careers",
    };
  }

  if (!data.roadmap) {
    return {
      label: "Generate your roadmap",
      description: `Turn your ${data.gaps.length} skill gaps into a week by week plan.`,
      href: "/roadmap",
      cta: "Build roadmap",
    };
  }

  if (data.roadmapProgress.percentage < 100 && data.roadmapProgress.total > 0) {
    return {
      label: "Continue your roadmap",
      description: `${data.roadmapProgress.completed} of ${data.roadmapProgress.total} tasks done. Keep the streak alive.`,
      href: "/roadmap",
      cta: "Open roadmap",
    };
  }

  if (data.attempts.length === 0) {
    return {
      label: "Verify a skill",
      description: "Replace an AI estimate with assessment evidence.",
      href: "/assessments",
      cta: "Take an assessment",
    };
  }

  return {
    label: "Practise an interview",
    description: "Rehearse the role you are targeting and get scored feedback.",
    href: "/interview",
    cta: "Start interview",
  };
}
