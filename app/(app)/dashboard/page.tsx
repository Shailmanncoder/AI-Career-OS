import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DemoDataNotice } from "@/components/shared/ai-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressRing } from "@/components/charts/progress-ring";
import { SkillGapDonut } from "@/components/charts/skill-gap-donut";
import { ScoreGauge } from "@/components/charts/score-gauge";
import { StreakSparkline } from "@/components/charts/streak-sparkline";
import { MilestoneTrack, type Milestone } from "@/components/dashboard/milestone-track";
import { SkillsSnapshot } from "@/components/dashboard/skills-snapshot";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { requireSessionUser } from "@/lib/auth/session";
import { loadDashboardData, resolveNextAction } from "@/lib/services/dashboard-service";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const HORIZON_WEEKS: Record<string, number> = { DAYS_30: 4, DAYS_60: 8, DAYS_90: 12 };

function buildMilestones(percentage: number): Milestone[] {
  const stages = [
    { days: "30 Days", label: "Foundation", threshold: 33 },
    { days: "60 Days", label: "Build & Practice", threshold: 66 },
    { days: "90 Days", label: "Master & Apply", threshold: 100 },
  ];

  return stages.map((stage, index) => {
    const previous = index === 0 ? 0 : stages[index - 1].threshold;
    if (percentage >= stage.threshold) return { ...stage, state: "done" as const };
    if (percentage >= previous) return { ...stage, state: "current" as const };
    return { ...stage, state: "upcoming" as const };
  });
}

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const data = await loadDashboardData(user.id);
  const nextAction = resolveNextAction(data);

  const firstName = (data.analysis?.fullName ?? user.name ?? "there").split(" ")[0];
  const focusRole =
    data.matches.find((match) => match.careerRoleId === data.focusRoleId) ?? data.topMatch;
  const focusScore = focusRole?.score ?? 0;
  const gaps = data.skillGapBreakdown;
  const roadmapPercent = data.roadmapProgress.percentage;
  const roadmapWeeks = data.roadmap ? HORIZON_WEEKS[data.roadmap.horizon] ?? 12 : 12;
  const currentPhase = data.roadmap?.phases.find((phase) =>
    phase.tasks.some((task) => !task.completed),
  );

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your progress and close the gap to your target role.
          </p>
        </div>

        <Card className="w-full shrink-0 p-4 lg:w-[300px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-warning" />
                Learning streak
              </p>
              <p className="display-figure mt-1 text-2xl leading-none">
                {data.stats.streak}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {data.stats.streak === 1 ? "day" : "days"}
                </span>
              </p>
            </div>
            <StreakSparkline data={data.streakHistory} width={140} height={44} />
          </div>
        </Card>
      </div>

      {user.isDemo ? <DemoDataNotice /> : null}

      {!data.resume ? (
        <EmptyState
          icon={Sparkles}
          title="Start with your resume"
          description="Your skills, career matches, gaps and roadmap are all derived from a single resume upload."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall progress</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6 pt-2">
            <ProgressRing
              value={roadmapPercent}
              caption={
                data.roadmapProgress.total > 0
                  ? `${data.roadmapProgress.completed} of ${data.roadmapProgress.total} roadmap tasks`
                  : "Generate a roadmap to begin"
              }
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top matched career</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <p className="text-xl font-semibold leading-snug tracking-tight">
                {focusRole?.careerRole.title ?? "No match yet"}
              </p>
              <p className="display-figure mt-3 text-[30px] leading-none">
                {focusScore}
                <span className="text-lg">%</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Compatibility</p>
              <Progress value={focusScore} className="mt-3 h-2" />
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href={focusRole ? `/careers/${focusRole.careerRole.slug}` : "/careers"}>
                View details
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skill gap overview</CardTitle>
            <CardDescription className="text-xs">
              Against {focusRole?.careerRole.title ?? "your target role"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <SkillGapDonut
              segments={[
                { label: "Known skills", value: gaps.known, color: "hsl(var(--chart-1))" },
                { label: "Learning", value: gaps.learning, color: "hsl(var(--chart-4))" },
                { label: "Missing", value: gaps.missing, color: "hsl(var(--destructive))" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Roadmap progress</CardTitle>
              <CardDescription className="text-xs">
                {data.roadmap ? `${roadmapWeeks}-week plan · ${currentPhase?.title ?? "Complete"}` : "No active roadmap"}
              </CardDescription>
            </div>
            <span className="shrink-0 text-lg font-semibold tabular-nums">{roadmapPercent}%</span>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={roadmapPercent} className="h-2" />
            <MilestoneTrack milestones={buildMilestones(roadmapPercent)} />
            {!data.roadmap ? (
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/roadmap">Generate roadmap</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={data.activities.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skills snapshot</CardTitle>
            <CardDescription className="text-xs">
              {data.stats.skillCount} tracked · {data.stats.verifiedSkillCount} verified by assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillsSnapshot
              skills={data.candidateSkills.slice(0, 6).map((entry) => ({
                name: entry.skill.name,
                level: entry.level,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resume score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pb-6">
            <ScoreGauge
              value={data.stats.resumeScore}
              caption={
                data.stats.atsScore > 0 ? `ATS readiness ${data.stats.atsScore}` : "Upload a resume"
              }
            />
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/optimizer">Improve it</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/25">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <Badge variant="muted" className="mb-1">
              Next action
            </Badge>
            <p className="text-sm font-semibold">{nextAction.label}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{nextAction.description}</p>
          </div>
          <Button asChild className="shrink-0">
            <Link href={nextAction.href}>
              {nextAction.cta}
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
