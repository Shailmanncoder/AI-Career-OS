import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, ExternalLink, ListChecks, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ScoreRing } from "@/components/shared/score-ring";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { GapBars } from "@/components/charts/gap-bars";
import { ExplainMatchButton } from "@/components/career/explain-button";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getLearningRecommendations } from "@/lib/services/roadmap-service";
import { asStringArray } from "@/types/analysis";

export const dynamic = "force-dynamic";

const REQUIREMENT_LABEL: Record<string, string> = {
  REQUIRED: "Required",
  IMPORTANT: "Important",
  OPTIONAL: "Optional",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = await prisma.careerRole.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: role?.title ?? "Career role" };
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireSessionUser();
  const { slug } = await params;

  const role = await prisma.careerRole.findUnique({
    where: { slug },
    include: { roleSkills: { include: { skill: true } } },
  });

  if (!role) notFound();

  const [match, gaps, candidateSkills, recommendations] = await Promise.all([
    prisma.careerMatch.findUnique({
      where: { userId_careerRoleId: { userId: user.id, careerRoleId: role.id } },
    }),
    prisma.skillGap.findMany({
      where: { userId: user.id, careerRoleId: role.id },
      include: { skill: true },
      orderBy: [{ priorityScore: "desc" }, { gap: "desc" }],
    }),
    prisma.candidateSkill.findMany({
      where: { userId: user.id },
      select: { skillId: true, level: true, verified: true },
    }),
    getLearningRecommendations(user.id, role.id, 6),
  ]);

  const levelBySkill = new Map(candidateSkills.map((skill) => [skill.skillId, skill.level]));
  const strengths = asStringArray(match?.strengths);
  const focusAreas = asStringArray(match?.focusAreas);

  const orderedRoleSkills = [...role.roleSkills].sort((a, b) => {
    const order = { REQUIRED: 0, IMPORTANT: 1, OPTIONAL: 2 } as Record<string, number>;
    if (order[a.requirement] !== order[b.requirement]) {
      return order[a.requirement] - order[b.requirement];
    }
    return b.weight - a.weight;
  });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/careers">
          <ArrowLeft />
          All career matches
        </Link>
      </Button>

      <PageHeader
        title={role.title}
        description={role.description}
        actions={
          match ? (
            <div className="flex gap-2">
              <ExplainMatchButton careerRoleId={role.id} />
              <Button asChild size="sm">
                <Link href="/simulator">Simulate skills</Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/careers">Run matching first</Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-3 p-6">
          <ScoreRing
            value={match?.score ?? 0}
            size={132}
            label="Compatibility"
            tone={(match?.score ?? 0) >= 75 ? "success" : (match?.score ?? 0) >= 50 ? "primary" : "warning"}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              {match ? `${match.requiredMet} of ${match.requiredTotal} required skills met` : "Not scored"}
            </p>
            <p className="text-xs text-muted-foreground">
              {match ? `Skill coverage ${match.coverage}%` : "Recalculate matches to score this role"}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Why this score
            </CardTitle>
            <CardDescription>
              The number is calculated by the application. The explanation is written by AI from that
              number and your recorded skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {match?.explanation ? (
              <p className="text-sm leading-relaxed text-pretty">{match.explanation}</p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                No explanation generated yet. Use the button above to produce one from your current
                profile.
              </p>
            )}

            {strengths.length > 0 || focusAreas.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {strengths.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {strengths.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {focusAreas.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Focus areas
                    </p>
                    <ul className="space-y-1.5">
                      {focusAreas.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill gaps</CardTitle>
            <CardDescription>
              Prioritised by gap size, role weight, and the foundation you already have.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GapBars
              data={gaps.slice(0, 8).map((gap) => ({
                skill: gap.skill.name,
                current: gap.currentLevel,
                required: gap.requiredLevel,
                gap: gap.gap,
                priority: gap.priority,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              Role responsibilities
            </CardTitle>
            <CardDescription>{role.shortDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {role.responsibilities.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learning areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.learningAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="font-normal">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Skill requirements
          </CardTitle>
          <CardDescription>
            Every skill this role weights, with the level expected and your recorded level.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-y bg-muted/40 text-left">
                <tr>
                  <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Skill</th>
                  <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Requirement</th>
                  <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Weight</th>
                  <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Expected</th>
                  <th scope="col" className="w-56 px-6 py-2.5 font-medium text-muted-foreground">Your level</th>
                </tr>
              </thead>
              <tbody>
                {orderedRoleSkills.map((roleSkill) => {
                  const level = levelBySkill.get(roleSkill.skillId) ?? 0;
                  const met = level >= roleSkill.requiredLevel;
                  return (
                    <tr key={roleSkill.id} className="border-b last:border-b-0">
                      <td className="px-6 py-3 font-medium">{roleSkill.skill.name}</td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={
                            roleSkill.requirement === "REQUIRED"
                              ? "default"
                              : roleSkill.requirement === "IMPORTANT"
                                ? "secondary"
                                : "muted"
                          }
                        >
                          {REQUIREMENT_LABEL[roleSkill.requirement]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 tabular-nums text-muted-foreground">
                        {roleSkill.weight.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 tabular-nums text-muted-foreground">
                        {roleSkill.requiredLevel}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={level}
                            className="h-1.5"
                            indicatorClassName={met ? "bg-success" : "bg-warning"}
                          />
                          <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {level}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {gaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Learning recommendations
            </CardTitle>
            <CardDescription>
              Curated public resources mapped to your highest priority gaps for this role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No curated resources are catalogued for these specific gaps yet.
              </p>
            ) : (
              recommendations.map((group) => (
                <div key={group.skillId} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{group.skillName}</p>
                    <PriorityBadge priority={group.priority} />
                    <span className="text-xs text-muted-foreground">
                      {group.currentLevel} to {group.requiredLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group rounded-lg border p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-snug">{resource.title}</span>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {resource.provider} · {resource.estimateHrs}h ·{" "}
                          {resource.difficulty.toLowerCase()}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
