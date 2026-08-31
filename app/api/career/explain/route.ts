import { z } from "zod";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { ensureCareerExplanation } from "@/lib/services/career-service";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ careerRoleId: z.string().min(1) });

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "career-explain", limit: 20, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const match = await ensureCareerExplanation(guard.user.id, parsed.data.careerRoleId);
    if (!match) {
      return apiError("NOT_FOUND", "No career match exists for that role yet. Run matching first.");
    }

    return apiSuccess({
      explanation: match.explanation,
      strengths: match.strengths,
      focusAreas: match.focusAreas,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
