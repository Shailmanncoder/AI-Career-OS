import type { Metadata } from "next";
import type { SkillRequirement } from "@prisma/client";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CareerSimulator, type SimulatorRole } from "@/components/career/career-simulator";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { loadCandidateSkills } from "@/lib/services/career-service";
import { formatRelative } from "@/lib/utils";
import { asStringArray } from "@/types/analysis";

export const metadata: Metadata = { title: "Career simulator" };
export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const user = await requireSessionUser();

  const [roles, candidateSkills, profile, topMatch, history] = await Promise.all([
    prisma.careerRole.findMany({
      include: { roleSkills: { include: { skill: true } } },
      orderBy: { title: "asc" },
    }),
    loadCandidateSkills(user.id),
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.careerMatch.findFirst({
      where: { userId: user.id },
      orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
    }),
    prisma.careerSimulation.findMany({
      where: { userId: user.id },
      include: { careerRole: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (candidateSkills.length === 0) {
    return (
      <>
        <PageHeader
          title="Career simulator"
          description="Test what learning a specific skill would actually do to your career compatibility, before spending a month on it."
        />
        <EmptyState
          icon={Sparkles}
          title="Build a skill profile first"
          description="The simulator recalculates your compatibility from your recorded skills. Upload and analyze a resume to populate them."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      </>
    );
  }

  const simulatorRoles: SimulatorRole[] = roles.map((role) => ({
    id: role.id,
    title: role.title,
    shortDescription: role.shortDescription,
    roleSkills: role.roleSkills.map((roleSkill) => ({
      skillId: roleSkill.skillId,
      skillName: roleSkill.skill.name,
      requirement: roleSkill.requirement as SkillRequirement,
      weight: roleSkill.weight,
      requiredLevel: roleSkill.requiredLevel,
    })),
  }));

  const initialRoleId =
    profile?.targetCareerId ?? topMatch?.careerRoleId ?? simulatorRoles[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title="Career simulator"
        description="Test what learning a specific skill would actually do to your career compatibility, before spending a month on it."
      />

      <CareerSimulator
        roles={simulatorRoles}
        candidateSkills={candidateSkills}
        initialRoleId={initialRoleId}
      />

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Saved simulations</CardTitle>
            <CardDescription>
              Compare the paths you have already modelled against each other.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((entry) => {
              const added = asStringArray(entry.addedSkills);
              return (
                <div key={entry.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{entry.careerRole.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {entry.baselineScore}% → {entry.projectedScore}%
                      </span>
                      <Badge variant={entry.delta > 0 ? "success" : "muted"} className="tabular-nums">
                        {entry.delta > 0 ? "+" : ""}
                        {entry.delta}%
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {added.map((skill) => (
                      <Badge key={skill} variant="secondary" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {entry.explanation ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {entry.explanation}
                    </p>
                  ) : null}

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatRelative(entry.createdAt)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
