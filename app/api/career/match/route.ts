import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError } from "@/lib/api/response";
import {
  ensureCareerExplanation,
  recomputeCareerIntelligence,
} from "@/lib/services/career-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  const guard = await guardRoute({ route: "career-match", limit: 10, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const result = await recomputeCareerIntelligence(guard.user.id);
    const top = result.matches[0];

    if (top) {
      await ensureCareerExplanation(guard.user.id, top.careerRoleId);
    }

    await prisma.activityEvent.create({
      data: {
        userId: guard.user.id,
        kind: "CAREER_MATCHED",
        label: top ? `Top match: ${top.title} at ${top.score}%` : "Recalculated career matches",
        value: top?.score ?? 0,
      },
    });

    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
