import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { roadmapGenerateSchema } from "@/lib/validation/forms";
import { generateRoadmapForUser, summarizeRoadmapProgress } from "@/lib/services/roadmap-service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "roadmap-generate", limit: 6, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = roadmapGenerateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const { roadmap, usedFallback, aiErrorCode } = await generateRoadmapForUser(
      guard.user.id,
      parsed.data.careerRoleId,
      parsed.data.horizon,
      parsed.data.weeklyHours,
    );

    return apiSuccess({
      roadmapId: roadmap.id,
      title: roadmap.title,
      phaseCount: roadmap.phases.length,
      taskCount: roadmap.phases.reduce((total, phase) => total + phase.tasks.length, 0),
      progress: summarizeRoadmapProgress(roadmap.phases),
      usedFallback,
      aiErrorCode,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
