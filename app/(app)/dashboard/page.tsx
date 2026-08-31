import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Braces,
  ClipboardCheck,
  Flame,
  Gauge,
  Route,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreRing } from "@/components/shared/score-ring";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { AiEstimateBadge, DemoDataNotice } from "@/components/shared/ai-notice";
import { CareerComparison } from "@/components/charts/career-comparison";
import { GapBars } from "@/components/charts/gap-bars";
import { SkillRadar, type SkillRadarDatum } from "@/components/charts/skill-radar";
import { requireSessionUser } from "@/lib/auth/session";
import { loadDashboardData, resolveNextAction } from "@/lib/services/dashboard-service";
import { prisma } from "@/lib/db/client";
import { categoryLabel } from "@/lib/services/resume-service";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

async function buildRadarData(
  userId: string,
  careerRoleId: string | null,
): Promise<SkillRadarDatum[]> {
  const [candidateSkills, roleSkills] = await Promise.all([
    prisma.candidateSkill.findMany({ where: { userId }, include: { skill: true } }),
    careerRoleId
      ? prisma.careerRoleSkill.findMany({
          where: { careerRoleId },
          include: { skill: true },
        })
      : Promise.resolve([]),
  ]);

  const buckets = new Map<string, { candidate: number[]; required: number[] }>();

  for (const entry of candidateSkills) {
    const key = categoryLabel(entry.skill.category);
    const bucket = buckets.get(key) ?? { candidate: [], required: [] };
    bucket.candidate.push(entry.level);
    buckets.set(key, bucket);
  }

  for (const entry of roleSkills) {
    const key = categoryLabel(entry.skill.category);
    const bucket = buckets.get(key) ?? { candidate: [], required: [] };
    bucket.required.push(entry.requiredLevel);
    buckets.set(key, bucket);
  }

  const average = (values: number[]) =>
    values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  return Array.from(buckets.entries())
    .map(([category, bucket]) => ({
      category,
      candidate: average(bucket.candidate),
      required: average(bucket.required),
    }))
    .filter((entry) => entry.candidate > 0 || entry.required > 0)
    .sort((a, b) => b.required - a.required)
    .slice(0, 8);
}

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const data = await loadDashboardData(user.id);
  const nextAction = resolveNextAction(data);
  const radarData = await buildRadarData(user.id, data.focusRoleId);

  const focusRole =
    data.matches.find((match) => match.careerRoleId === data.focusRoleId) ?? data.topMatch;

  const firstName = (data.analysis?.fullName ?? user.name ?? "there").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your skill profile, career compatibility, and the single next action that moves you forward."
        actions={
          <Button asChild>
            <Link href={nextAction.href}>
              {nextAction.cta}
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {user.isDemo ? <DemoDataNotice /> : null}

      {!data.resume ? (
        <EmptyState
          icon={Sparkles}
          title="Start with your resume"
          description="AI CareerOS derives your skills, career matches, gaps, and roadmap from a single resume upload. Nothing else needs to be filled in by hand."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Top compatibility"
          value={data.stats.topScore > 0 ? `${data.stats.topScore}%` : "—"}
          hint={data.topMatch?.careerRole.title ?? "Run career matching"}
          icon={Target}
          tone="primary"
        />
        <StatCard
          label="Resume score"
          value={data.stats.resumeScore > 0 ? data.stats.resumeScore : "—"}
          hint={data.stats.atsScore > 0 ? `ATS readiness ${data.stats.atsScore}` : "Upload a resume"}
          icon={Gauge}
        />
        <StatCard
          label="Skills tracked"
          value={data.stats.skillCount}
          hint={`${data.stats.verifiedSkillCount} verified by assessment`}
          icon={Braces}
        />
        <StatCard
          label="Roadmap progress"
          value={`${data.stats.roadmapPercentage}%`}
          hint={
            data.roadmapProgress.total > 0
              ? `${data.roadmapProgress.completed} of ${data.roadmapProgress.total} tasks`
              : "No roadmap yet"
          }
          icon={Route}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Career compatibility</CardTitle>
              <CardDescription>
                Deterministic weighted matching across {data.matches.length} scored roles.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/careers">All roles</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <CareerComparison
              data={data.matches.map((match) => ({
                role: match.careerRole.title,
                score: match.score,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next action</CardTitle>
            <CardDescription>The highest leverage thing you can do right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 p-5 text-center">
              <ScoreRing
                value={data.stats.topScore}
                size={104}
                label="Best fit"
                tone={data.stats.topScore >= 75 ? "success" : data.stats.topScore >= 50 ? "primary" : "warning"}
              />
              <p className="text-sm font-medium">{focusRole?.careerRole.title ?? "No match yet"}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">{nextAction.label}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{nextAction.description}</p>
              <Button asChild className="w-full">
                <Link href={nextAction.href}>
                  {nextAction.cta}
                  <ArrowRight />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-warning" />
                Learning streak
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {data.stats.streak} {data.stats.streak === 1 ? "day" : "days"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Skill coverage by category
              <AiEstimateBadge />
            </CardTitle>
            <CardDescription>
              Your average level against what {focusRole?.careerRole.title ?? "your target role"} expects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillRadar data={radarData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Priority skill gaps</CardTitle>
              <CardDescription>
                Ranked by gap size, role weight, and the foundation you already have.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/simulator">Simulate</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.gaps.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No gaps calculated yet. Analyze a resume to populate your skill profile.
                </p>
              </div>
            ) : (
              <GapBars
                data={data.gaps.slice(0, 6).map((gap) => ({
                  skill: gap.skill.name,
                  current: gap.currentLevel,
                  required: gap.requiredLevel,
                  gap: gap.gap,
                  priority: gap.priority,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Active roadmap</CardTitle>
              <CardDescription>
                {data.roadmap
                  ? data.roadmap.title
                  : "Generate a plan to turn your gaps into weekly work."}
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/roadmap">Open</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.roadmap ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Progress value={data.roadmapProgress.percentage} className="h-2" />
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {data.roadmapProgress.percentage}%
                  </span>
                </div>
                <ul className="space-y-2">
                  {data.roadmap.phases.slice(0, 5).map((phase) => {
                    const done = phase.tasks.filter((task) => task.completed).length;
                    return (
                      <li
                        key={phase.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{phase.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Weeks {phase.weekStart}–{phase.weekEnd}
                          </p>
                        </div>
                        <Badge variant={done === phase.tasks.length ? "success" : "muted"}>
                          {done}/{phase.tasks.length}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                <Route className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active roadmap. Generate one from your prioritised gaps.
                </p>
                <Button asChild size="sm">
                  <Link href="/roadmap">Generate roadmap</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Everything you have done in AI CareerOS.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Your activity will appear here once you upload a resume.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.activities.slice(0, 7).map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{activity.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(activity.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Assessment average"
          value={data.stats.assessmentAverage > 0 ? data.stats.assessmentAverage : "—"}
          hint={`${data.attempts.length} scored attempts`}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Interview average"
          value={data.stats.interviewAverage > 0 ? data.stats.interviewAverage : "—"}
          hint={`${data.interviews.length} sessions`}
          icon={TrendingUp}
        />
        <StatCard
          label="Resources completed"
          value={data.stats.learningCompleted}
          hint="Marked done from your recommendations"
          icon={Sparkles}
        />
      </div>

      {data.gaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Gap detail</CardTitle>
            <CardDescription>
              Current level against required level for {focusRole?.careerRole.title ?? "your target role"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-y bg-muted/40 text-left">
                  <tr>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Skill</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Current</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Required</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Gap</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gaps.map((gap) => (
                    <tr key={gap.id} className="border-b last:border-b-0">
                      <td className="px-6 py-3 font-medium">{gap.skill.name}</td>
                      <td className="px-6 py-3 tabular-nums text-muted-foreground">{gap.currentLevel}</td>
                      <td className="px-6 py-3 tabular-nums text-muted-foreground">{gap.requiredLevel}</td>
                      <td className="px-6 py-3 tabular-nums font-medium">{gap.gap}</td>
                      <td className="px-6 py-3">
                        <PriorityBadge priority={gap.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
