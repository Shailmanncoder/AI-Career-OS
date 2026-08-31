import type { Metadata } from "next";
import { Wand2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { OptimizerPanel } from "@/components/optimizer/optimizer-panel";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Resume optimizer" };
export const dynamic = "force-dynamic";

export default async function OptimizerPage() {
  const user = await requireSessionUser();

  const [resume, roles, matches, profile] = await Promise.all([
    prisma.resume.findFirst({
      where: { userId: user.id, isActive: true },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.careerRole.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.careerMatch.findMany({
      where: { userId: user.id },
      select: { careerRoleId: true, score: true },
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
  ]);

  if (!resume) {
    return (
      <>
        <PageHeader
          title="Resume optimizer"
          description="Score your resume against a target role, find missing keywords, and get rewrites grounded in what you actually wrote."
        />
        <EmptyState
          icon={Wand2}
          title="No resume to optimize"
          description="Upload and analyze a resume first. The optimizer works from the extracted text, so nothing is fabricated."
          actionLabel="Upload your resume"
          actionHref="/resume"
        />
      </>
    );
  }

  const scoreByRole = new Map(matches.map((match) => [match.careerRoleId, match.score]));
  const roleOptions = roles
    .map((role) => ({ id: role.id, title: role.title, score: scoreByRole.get(role.id) ?? null }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const defaultRoleId = profile?.targetCareerId ?? roleOptions[0]?.id ?? "";

  return (
    <>
      <PageHeader
        title="Resume optimizer"
        description="Score your resume against a target role, find missing keywords, and get rewrites grounded in what you actually wrote."
      />
      <OptimizerPanel roles={roleOptions} defaultRoleId={defaultRoleId} />
    </>
  );
}
