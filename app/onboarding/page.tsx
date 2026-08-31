import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireSessionUser();

  const [careers, profile, declaredSkills] = await Promise.all([
    prisma.careerRole.findMany({
      select: { id: true, title: true, category: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.candidateSkill.findMany({
      where: { userId: user.id, source: "ONBOARDING" },
      include: { skill: true },
    }),
  ]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 grid-backdrop" aria-hidden="true" />

      <header className="relative border-b">
        <div className="container flex h-16 items-center justify-between">
          <Logo href="/dashboard" />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Skip to dashboard
          </Link>
        </div>
      </header>

      <main id="main" className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <div className="max-w-2xl space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tell us where you are and where you are going
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Four short steps. Every field is optional, but each one makes your roadmap and career
            matches more specific.
          </p>
        </div>

        <OnboardingForm
          careers={careers}
          initial={{
            educationLevel: profile?.educationLevel ?? "",
            currentRole: profile?.currentRole ?? "",
            yearsExperience: profile?.yearsExperience ? String(profile.yearsExperience) : "",
            targetCareerId: profile?.targetCareerId ?? "",
            learningStyle: profile?.learningStyle ?? "MIXED",
            weeklyLearningHrs: profile?.weeklyLearningHrs ? String(profile.weeklyLearningHrs) : "6",
            skills: declaredSkills.map((entry) => entry.skill.name),
          }}
        />
      </main>
    </div>
  );
}
