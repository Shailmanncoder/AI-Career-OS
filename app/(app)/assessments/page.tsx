import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const user = await requireSessionUser();

  const [candidateSkills, attempts] = await Promise.all([
    prisma.candidateSkill.findMany({
      where: { userId: user.id },
      include: { skill: true },
      orderBy: [{ verified: "asc" }, { level: "desc" }],
      take: 40,
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: user.id, status: "SCORED" },
      include: { assessment: { include: { skill: true } } },
      orderBy: { submittedAt: "desc" },
      take: 12,
    }),
  ]);

  if (candidateSkills.length === 0) {
    return (
      <>
        <PageHeader
          title="Skill assessments"
          description="Turn an AI estimate into recorded evidence. Assessment results override resume estimates and feed back into your career scores."
        />
        <EmptyState
          icon={ClipboardCheck}
          title="No skills to assess yet"
          description="Assessments are generated for skills already in your profile. Upload a resume to populate it first."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Skill assessments"
        description="Turn an AI estimate into recorded evidence. Assessment results override resume estimates and feed back into your career scores."
      />

      <AssessmentRunner
        skills={candidateSkills.map((entry) => ({
          id: entry.skillId,
          name: entry.skill.name,
          level: entry.level,
          verified: entry.verified,
        }))}
      />

      {attempts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Assessment history</CardTitle>
            <CardDescription>
              Every scored attempt. The most recent attempt for a skill sets its verified level.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-y bg-muted/40 text-left">
                  <tr>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Skill</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Assessment</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Score</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">Points</th>
                    <th scope="col" className="px-6 py-2.5 font-medium text-muted-foreground">When</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b last:border-b-0">
                      <td className="px-6 py-3 font-medium">{attempt.assessment.skill.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{attempt.assessment.title}</td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={
                            attempt.score >= 70 ? "success" : attempt.score >= 45 ? "warning" : "destructive"
                          }
                          className="tabular-nums"
                        >
                          {attempt.score}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 tabular-nums text-muted-foreground">
                        {attempt.earnedPoints}/{attempt.totalPoints}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatRelative(attempt.submittedAt ?? attempt.startedAt)}
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
