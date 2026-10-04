import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { JobSearch } from "@/components/jobs/job-search";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isJobSearchConfigured } from "@/lib/jobs/search";

export const metadata: Metadata = { title: "Job search" };
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Live openings gathered from job boards such as LinkedIn, Shine, Foundit and company career pages. Only listings with a recent posting date that have not expired or been marked filled are shown.";

export default async function JobsPage() {
  const user = await requireSessionUser();

  if (!isJobSearchConfigured()) {
    return (
      <>
        <PageHeader title="Job search" description={DESCRIPTION} />
        <EmptyState
          icon={BriefcaseBusiness}
          title="Job search is not connected"
          description="Add a JSEARCH_API_KEY (RapidAPI) or ADZUNA_APP_ID and ADZUNA_APP_KEY to the server environment, then restart to search live openings."
        />
      </>
    );
  }

  const [profile, topMatch] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: user.id },
      include: { targetCareer: { select: { title: true } } },
    }),
    prisma.careerMatch.findFirst({
      where: { userId: user.id },
      orderBy: [{ score: "desc" }, { careerRoleId: "asc" }],
      include: { careerRole: { select: { title: true } } },
    }),
  ]);

  const defaultQuery =
    profile?.targetCareer?.title ?? topMatch?.careerRole.title ?? profile?.currentRole ?? "";

  return (
    <>
      <PageHeader title="Job search" description={DESCRIPTION} />
      <JobSearch defaultQuery={defaultQuery} defaultLocation={profile?.location ?? ""} />
    </>
  );
}
