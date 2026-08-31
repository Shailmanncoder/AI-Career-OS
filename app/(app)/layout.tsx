import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSidebar, MobileNav } from "@/components/dashboard/app-sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireSessionUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  const aiReady = isAiConfigured();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <MobileNav />
              <div className="hidden items-center gap-2 sm:flex">
                {user.isDemo ? <Badge variant="warning">Demo account</Badge> : null}
                <Badge variant={aiReady ? "success" : "muted"}>
                  {aiReady ? "Gemini connected" : "Offline engine"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link href="/resume">Upload resume</Link>
              </Button>
              <ThemeToggle />
              <UserMenu name={user.name} email={user.email} />
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
