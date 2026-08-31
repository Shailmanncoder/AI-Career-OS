import { guardRoute } from "@/lib/api/guard";
import { apiSuccess, handleRouteError } from "@/lib/api/response";
import { getActiveRoadmap, summarizeRoadmapProgress } from "@/lib/services/roadmap-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await guardRoute({ route: "roadmap-get", limit: 60 });
  if (!guard.ok) return guard.response;

  try {
    const roadmap = await getActiveRoadmap(guard.user.id);
    return apiSuccess({
      roadmap,
      progress: roadmap ? summarizeRoadmapProgress(roadmap.phases) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
