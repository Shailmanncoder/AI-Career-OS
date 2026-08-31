import type { Metadata } from "next";
import { Clock, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { OfflineEngineNotice } from "@/components/shared/ai-notice";
import { RoadmapGenerator, type RoadmapRoleOption } from "@/components/roadmap/roadmap-generator";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { LearningResources } from "@/components/roadmap/learning-resources";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import {
  HORIZON_LABEL,
  getActiveRoadmap,
  getLearningRecommendations,
  summarizeRoadmapProgress,
} from "@/lib/services/roadmap-service";

export const metadata: Metadata = { title: "Roadmap" };
export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const user = await requireSessionUser();

  const [roadmap, roles, matches, profile, gapCount] = await Promise.all([
    getActiveRoadmap(user.id),
    prisma.careerRole.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.careerMatch.findMany({
      where: { userId: user.id },
      select: { careerRoleId: true, score: true },
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.skillGap.count({ where: { userId: user.id } }),
  ]);

  const scoreByRole = new Map(matches.map((match) => [match.careerRoleId, match.score]));
  const roleOptions: RoadmapRoleOption[] = roles
    .map((role) => ({
      id: role.id,
      title: role.title,
      score: scoreByRole.get(role.id) ?? null,
    }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const defaultRoleId =
    roadmap?.careerRoleId ?? profile?.targetCareerId ?? roleOptions[0]?.id ?? "";

  const progress = roadmap
    ? summarizeRoadmapProgress(roadmap.phases)
    : { total: 0, completed: 0, percentage: 0, totalHours: 0, completedHours: 0 };

  const recommendations = roadmap
    ? await getLearningRecommendations(user.id, roadmap.careerRoleId, 6)
    : [];

  return (
    <>
      <PageHeader
        title="Personalized roadmap"
        description="Your prioritised skill gaps turned into a week by week plan with learning, practice, projects, and checkpoints."
      />

      {gapCount === 0 && !roadmap ? (
        <EmptyState
          icon={Route}
          title="No skill gaps calculated yet"
          description="Upload and analyze a resume, then recalculate career matches. The roadmap is built from the gaps that produces."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      ) : (
        <RoadmapGenerator
          roles={roleOptions}
          defaultRoleId={defaultRoleId}
          defaultWeeklyHours={profile?.weeklyLearningHrs ?? 6}
          hasRoadmap={Boolean(roadmap)}
        />
      )}

      {roadmap ? (
        <>
          {roadmap.isFallback ? <OfflineEngineNotice context="this roadmap" /> : null}

          <Card>
            <CardContent className="space-y-3 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{roadmap.title}</h2>
                <Badge variant="muted">{HORIZON_LABEL[roadmap.horizon]}</Badge>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Clock className="h-3 w-3" />
                  {roadmap.weeklyHours}h per week
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {roadmap.careerRole.title}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {roadmap.summary}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress.totalHours} estimated hours across {progress.total} tasks ·{" "}
                {progress.completedHours}h completed
              </p>
            </CardContent>
          </Card>

          <RoadmapBoard
            initialPercentage={progress.percentage}
            phases={roadmap.phases.map((phase) => ({
              id: phase.id,
              title: phase.title,
              focus: phase.focus,
              weekStart: phase.weekStart,
              weekEnd: phase.weekEnd,
              tasks: phase.tasks.map((task) => ({
                id: task.id,
                title: task.title,
                objective: task.objective,
                kind: task.kind,
                estimateHrs: task.estimateHrs,
                completed: task.completed,
                skillName: task.skill?.name ?? null,
              })),
            }))}
          />

          <LearningResources groups={recommendations} />
        </>
      ) : null}
    </>
  );
}
