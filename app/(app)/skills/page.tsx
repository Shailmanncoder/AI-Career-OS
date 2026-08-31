import type { Metadata } from "next";
import { BadgeCheck, Braces, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { categoryLabel } from "@/lib/services/resume-service";

export const metadata: Metadata = { title: "Skills" };
export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  RESUME: "From resume",
  ONBOARDING: "Self declared",
  ASSESSMENT: "Assessment evidence",
  SIMULATION: "Simulated",
};

function levelTone(level: number) {
  if (level >= 75) return "bg-success";
  if (level >= 50) return "bg-primary";
  if (level >= 30) return "bg-warning";
  return "bg-destructive";
}

export default async function SkillsPage() {
  const user = await requireSessionUser();

  const skills = await prisma.candidateSkill.findMany({
    where: { userId: user.id },
    include: { skill: true },
    orderBy: [{ level: "desc" }, { skillId: "asc" }],
  });

  if (skills.length === 0) {
    return (
      <>
        <PageHeader
          title="Skill intelligence"
          description="Every skill extracted from your resume, categorised and levelled with the evidence behind it."
        />
        <EmptyState
          icon={Braces}
          title="No skills recorded yet"
          description="Upload and analyze a resume, or add self declared skills during onboarding, to build your skill profile."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      </>
    );
  }

  const grouped = new Map<string, typeof skills>();
  for (const entry of skills) {
    const key = categoryLabel(entry.skill.category);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }

  const categories = Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length);
  const verified = skills.filter((skill) => skill.verified);
  const averageLevel = Math.round(
    skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length,
  );

  return (
    <>
      <PageHeader
        title="Skill intelligence"
        description="Every skill extracted from your resume, categorised and levelled with the evidence behind it."
      />

      <Alert variant="info">
        <Sparkles />
        <AlertTitle>Levels are estimates unless marked verified</AlertTitle>
        <AlertDescription>
          Resume-derived levels are AI estimates of demonstrated depth, not measured proficiency.
          Completing a skill assessment replaces the estimate with recorded evidence and marks the
          skill verified.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Skills tracked" value={skills.length} icon={Braces} tone="primary" />
        <StatCard
          label="Verified by assessment"
          value={verified.length}
          hint={`${skills.length - verified.length} still estimated`}
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="Average level"
          value={averageLevel}
          hint={`Across ${categories.length} categories`}
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map(([category, entries]) => (
          <Card key={category}>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>{category}</CardTitle>
                <CardDescription>
                  {entries.length} {entries.length === 1 ? "skill" : "skills"}
                </CardDescription>
              </div>
              <Badge variant="muted" className="tabular-nums">
                avg{" "}
                {Math.round(entries.reduce((sum, entry) => sum + entry.level, 0) / entries.length)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{entry.skill.name}</span>
                      {entry.verified ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Verified by an assessment attempt, not an AI estimate.
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {entry.level}
                    </span>
                  </div>

                  <Progress
                    value={entry.level}
                    className="h-1.5"
                    indicatorClassName={levelTone(entry.level)}
                  />

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{SOURCE_LABEL[entry.source] ?? entry.source}</span>
                    <span>confidence {Math.round(entry.confidence * 100)}%</span>
                  </div>

                  {entry.evidence ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">{entry.evidence}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
