import { Badge } from "@/components/ui/badge";
import { AppSidebar, MobileNav } from "@/components/dashboard/app-sidebar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { Notifications, type NotificationItem } from "@/components/dashboard/notifications";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireSessionUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/env";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

async function buildNotifications(userId: string): Promise<NotificationItem[]> {
  const [resume, matchCount, roadmap, verifiedCount, interviewCount] = await Promise.all([
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { id: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.careerMatch.count({ where: { userId } }),
    prisma.roadmap.findFirst({ where: { userId, isActive: true }, select: { id: true } }),
    prisma.candidateSkill.count({ where: { userId, verified: true } }),
    prisma.interviewSession.count({ where: { userId } }),
  ]);

  const items: NotificationItem[] = [];

  if (!resume) {
    items.push({
      id: "resume",
      label: "Upload your resume",
      href: "/resume",
      hint: "Everything else is derived from it",
    });
  } else if (resume.status === "FAILED") {
    items.push({
      id: "resume-failed",
      label: "Resume analysis failed",
      href: "/resume",
      hint: "Re-analyze or upload a different file",
    });
  }

  if (resume && matchCount === 0) {
    items.push({
      id: "matches",
      label: "Score your career matches",
      href: "/careers",
      hint: "14 roles ready to compare",
    });
  }

  if (matchCount > 0 && !roadmap) {
    items.push({
      id: "roadmap",
      label: "Generate your roadmap",
      href: "/roadmap",
      hint: "Turn gaps into weekly work",
    });
  }

  if (resume && verifiedCount === 0) {
    items.push({
      id: "assessment",
      label: "Verify a skill with an assessment",
      href: "/assessments",
      hint: "Replaces an AI estimate with evidence",
    });
  }

  if (resume && interviewCount === 0) {
    items.push({
      id: "interview",
      label: "Try a practice interview",
      href: "/interview",
      hint: "Scored on five dimensions",
    });
  }

  return items.slice(0, 5);
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  const aiReady = isAiConfigured();
  const notifications = await buildNotifications(user.id);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <MobileNav />
            <GlobalSearch />

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div className="hidden items-center gap-2 xl:flex">
                {user.isDemo ? <Badge variant="warning">Demo account</Badge> : null}
                <Badge variant={aiReady ? "success" : "muted"}>
                  {aiReady ? "Gemini connected" : "Offline engine"}
                </Badge>
              </div>
              <Notifications items={notifications} />
              <ThemeToggle />
              <UserMenu name={user.name} email={user.email} />
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-24 pt-6 sm:px-6 sm:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl space-y-5">{children}</div>
        </main>

        <MobileTabBar />
      </div>
    </div>
  );
}
