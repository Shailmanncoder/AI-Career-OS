import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InterviewCoach, type InterviewRoleOption } from "@/components/interview/interview-coach";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Interview coach" };
export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const user = await requireSessionUser();

  const [roles, matches, profile, sessions] = await Promise.all([
    prisma.careerRole.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.careerMatch.findMany({
      where: { userId: user.id },
      select: { careerRoleId: true, score: true },
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.interviewSession.findMany({
      where: { userId: user.id },
      include: { careerRole: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (roles.length === 0) {
    return (
      <>
        <PageHeader
          title="Interview coach"
          description="Practise one question at a time and get scored feedback on five dimensions."
        />
        <EmptyState
          icon={MessagesSquare}
          title="No career roles available"
          description="The career database has not been seeded. Run the database seed to populate roles."
        />
      </>
    );
  }

  const scoreByRole = new Map(matches.map((match) => [match.careerRoleId, match.score]));
  const roleOptions: InterviewRoleOption[] = roles
    .map((role) => ({ id: role.id, title: role.title, score: scoreByRole.get(role.id) ?? null }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const defaultRoleId = profile?.targetCareerId ?? roleOptions[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title="Interview coach"
        description="Practise one question at a time and get scored feedback on relevance, technical accuracy, structure, communication, and completeness."
      />

      <InterviewCoach roles={roleOptions} defaultRoleId={defaultRoleId} />

      {sessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Session history</CardTitle>
            <CardDescription>Every practice interview you have run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{session.careerRole.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.kind.toLowerCase()} · {session.experience} · {session.answeredCount}{" "}
                    {session.answeredCount === 1 ? "answer" : "answers"} ·{" "}
                    {formatRelative(session.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      session.status === "COMPLETED"
                        ? "success"
                        : session.status === "ACTIVE"
                          ? "default"
                          : "muted"
                    }
                  >
                    {session.status.toLowerCase()}
                  </Badge>
                  {session.answeredCount > 0 ? (
                    <Badge variant="muted" className="tabular-nums">
                      avg {session.averageScore}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
