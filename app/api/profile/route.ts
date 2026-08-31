import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { onboardingSchema } from "@/lib/validation/forms";
import { SkillResolver, type ResolvableSkill } from "@/lib/services/skill-resolver";
import { recomputeCareerIntelligence } from "@/lib/services/career-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await guardRoute({ route: "profile-get", limit: 60 });
  if (!guard.ok) return guard.response;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: guard.user.id },
      include: { targetCareer: true },
    });

    return apiSuccess({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  const guard = await guardRoute({ route: "profile-patch", limit: 20 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = onboardingSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const { skills, targetCareerId, ...rest } = parsed.data;

    const targetCareer = targetCareerId
      ? await prisma.careerRole.findUnique({ where: { id: targetCareerId }, select: { id: true } })
      : null;

    const profile = await prisma.profile.upsert({
      where: { userId: guard.user.id },
      create: {
        userId: guard.user.id,
        educationLevel: rest.educationLevel || null,
        currentRole: rest.currentRole || null,
        yearsExperience: rest.yearsExperience ?? null,
        learningStyle: rest.learningStyle ?? null,
        weeklyLearningHrs: rest.weeklyLearningHrs ?? null,
        targetCareerId: targetCareer?.id ?? null,
        onboardingDone: true,
      },
      update: {
        educationLevel: rest.educationLevel || null,
        currentRole: rest.currentRole || null,
        yearsExperience: rest.yearsExperience ?? null,
        learningStyle: rest.learningStyle ?? null,
        weeklyLearningHrs: rest.weeklyLearningHrs ?? null,
        targetCareerId: targetCareer?.id ?? null,
        onboardingDone: true,
      },
      include: { targetCareer: true },
    });

    if (skills.length > 0) {
      const catalog = await prisma.skill.findMany({
        select: { id: true, slug: true, name: true, aliases: true },
      });
      const resolver = new SkillResolver(catalog as ResolvableSkill[]);

      const resolvedIds = new Set<string>();
      for (const raw of skills) {
        const match = resolver.resolve(raw);
        if (match) resolvedIds.add(match.id);
      }

      const existing = await prisma.candidateSkill.findMany({
        where: { userId: guard.user.id, skillId: { in: Array.from(resolvedIds) } },
        select: { skillId: true },
      });
      const existingIds = new Set(existing.map((entry) => entry.skillId));

      const newSkills = Array.from(resolvedIds).filter((id) => !existingIds.has(id));
      if (newSkills.length > 0) {
        await prisma.candidateSkill.createMany({
          data: newSkills.map((skillId) => ({
            userId: guard.user.id,
            skillId,
            level: 45,
            confidence: 0.4,
            evidence: "Self declared during onboarding.",
            source: "ONBOARDING" as const,
          })),
          skipDuplicates: true,
        });
      }

      await recomputeCareerIntelligence(guard.user.id);
    }

    return apiSuccess({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
