import type { Metadata } from "next";
import {
  Braces,
  ClipboardCheck,
  Flame,
  MessagesSquare,
  Route,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressTrend, type TrendDatum } from "@/components/charts/progress-trend";
import { requireSessionUser } from "@/lib/auth/session";
import { loadDashboardData } from "@/lib/services/dashboard-service";
import { formatDate, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

const ACTIVITY_LABEL: Record<string, string> = {
  RESUME_ANALYZED: "Resume analyzed",
  CAREER_MATCHED: "Career matching",
  ROADMAP_GENERATED: "Roadmap generated",
  TASK_COMPLETED: "Roadmap task",
  RESOURCE_COMPLETED: "Learning resource",
  ASSESSMENT_SCORED: "Assessment",
  INTERVIEW_STARTED: "Interview",
  SIMULATION_RUN: "Simulation",
  RESUME_OPTIMIZED: "Resume optimizer",
};

export default async function ProgressPage() {
  const user = await requireSessionUser();
  const data = await loadDashboardData(user.id);

  const assessmentTrend: TrendDatum[] = [...data.attempts]
    .reverse()
    .map((attempt) => ({
      label: formatDate(attempt.submittedAt ?? attempt.startedAt),
      value: attempt.score,
    }));

  const simulationTrend: TrendDatum[] = [...data.simulations]
    .reverse()
    .map((simulation) => ({
      label: simulation.careerRole.title.split(" ")[0],
      value: simulation.projectedScore,
    }));

  const hasActivity = data.activities.length > 0;

  return (
    <>
      <PageHeader
        title="Progress"
        description="Everything you have completed, scored, and simulated, tracked over time."
      />

      {!hasActivity ? (
        <EmptyState
          icon={TrendingUp}
          title="No activity recorded yet"
          description="Upload a resume, generate a roadmap, or take an assessment. Every action is recorded here so you can see movement over time."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Roadmap completion"
          value={data.stats.roadmapPercentage}
          suffix="%"
          hint={`${data.roadmapProgress.completed} of ${data.roadmapProgress.total} tasks`}
          icon={Route}
          tone="success"
        />
        <StatCard
          label="Skills verified"
          value={data.stats.verifiedSkillCount}
          hint={`of ${data.stats.skillCount} tracked`}
          icon={Braces}
          tone="primary"
        />
        <StatCard
          label="Resources completed"
          value={data.stats.learningCompleted}
          hint="Marked done from recommendations"
          icon={Sparkles}
        />
        <StatCard
          label="Learning streak"
          value={data.stats.streak}
          suffix="d"
          hint="Consecutive active days"
          icon={Flame}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              Assessment scores over time
            </CardTitle>
            <CardDescription>
              Each scored attempt. Assessment evidence replaces AI estimates in your skill profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTrend data={assessmentTrend} name="Score" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Simulated compatibility
            </CardTitle>
            <CardDescription>
              Projected scores from the career paths you have modelled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressTrend data={simulationTrend} name="Projected" />
          </CardContent>
        </Card>
      </div>

      {data.roadmap ? (
        <Card>
          <CardHeader>
            <CardTitle>Roadmap phase progress</CardTitle>
            <CardDescription>{data.roadmap.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.roadmap.phases.map((phase) => {
              const done = phase.tasks.filter((task) => task.completed).length;
              const percentage =
                phase.tasks.length > 0 ? Math.round((done / phase.tasks.length) * 100) : 0;
              return (
                <div key={phase.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{phase.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {done}/{phase.tasks.length}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-1.5"
                    indicatorClassName={percentage === 100 ? "bg-success" : undefined}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              Interview sessions
            </CardTitle>
            <CardDescription>Practice interviews and their average scores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.interviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No interview sessions yet.
              </p>
            ) : (
              data.interviews.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.careerRole.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.answeredCount} answered · {formatRelative(session.createdAt)}
                    </p>
                  </div>
                  <Badge variant="muted" className="tabular-nums">
                    {session.answeredCount > 0 ? session.averageScore : "—"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>Every recorded action, most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing recorded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm leading-snug">{activity.label}</p>
                        <Badge variant="secondary" className="shrink-0 font-normal">
                          {ACTIVITY_LABEL[activity.kind] ?? activity.kind}
                        </Badge>
                      </div>
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
    </>
  );
}
