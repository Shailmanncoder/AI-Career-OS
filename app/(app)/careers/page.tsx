import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CareerComparison } from "@/components/charts/career-comparison";
import { RecalculateMatchesButton } from "@/components/career/recalculate-button";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Career matches" };
export const dynamic = "force-dynamic";

function scoreTone(score: number) {
  if (score >= 75) return "bg-success";
  if (score >= 55) return "bg-primary";
  if (score >= 35) return "bg-warning";
  return "bg-destructive";
}

export default async function CareersPage() {
  const user = await requireSessionUser();

  const [roles, matches, profile] = await Promise.all([
    prisma.careerRole.findMany({
      include: { _count: { select: { roleSkills: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.careerMatch.findMany({
      where: { userId: user.id },
      orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
  ]);

  const matchByRole = new Map(matches.map((match) => [match.careerRoleId, match]));
  const scored = matches.length > 0;

  const ranked = roles
    .map((role) => ({ role, match: matchByRole.get(role.id) ?? null }))
    .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));

  const byCategory = new Map<string, typeof ranked>();
  for (const entry of ranked) {
    byCategory.set(entry.role.category, [...(byCategory.get(entry.role.category) ?? []), entry]);
  }

  return (
    <>
      <PageHeader
        title="Career matches"
        description="Your profile scored against every role in the career database using weighted skill matching. Identical inputs always produce an identical score."
        actions={<RecalculateMatchesButton />}
      />

      {!scored ? (
        <EmptyState
          icon={Target}
          title="No matches calculated yet"
          description="Upload and analyze a resume, then recalculate to score your profile against all 14 roles."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Top matches</CardTitle>
              <CardDescription>
                Compatibility is the weighted attainment of each role&apos;s required, important, and
                optional skills.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CareerComparison
                data={ranked
                  .filter((entry) => entry.match)
                  .slice(0, 8)
                  .map((entry) => ({
                    role: entry.role.title,
                    score: entry.match?.score ?? 0,
                  }))}
              />
            </CardContent>
          </Card>

          {Array.from(byCategory.entries()).map(([category, entries]) => (
            <section key={category} className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {entries.map(({ role, match }) => {
                  const isTarget = profile?.targetCareerId === role.id;
                  return (
                    <Card key={role.id} className={cn(isTarget && "border-primary/40")}>
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base leading-snug">{role.title}</CardTitle>
                          <span className="shrink-0 text-lg font-semibold tabular-nums">
                            {match ? `${match.score}%` : "—"}
                          </span>
                        </div>
                        <Progress
                          value={match?.score ?? 0}
                          className="h-1.5"
                          indicatorClassName={scoreTone(match?.score ?? 0)}
                        />
                        <CardDescription className="leading-relaxed">
                          {role.shortDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {isTarget ? <Badge>Target role</Badge> : null}
                          {match ? (
                            <Badge variant="muted">
                              {match.requiredMet}/{match.requiredTotal} required met
                            </Badge>
                          ) : null}
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            demand {role.demandIndex}
                          </Badge>
                        </div>

                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/careers/${role.slug}`}>
                            View gap analysis
                            <ArrowRight />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
