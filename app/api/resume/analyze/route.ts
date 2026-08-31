import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { processResumeAnalysis } from "@/lib/services/resume-service";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({ resumeId: z.string().min(1).optional() });

export async function POST(request: Request) {
  const guard = await guardRoute({ route: "resume-analyze", limit: 8, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) return validationError(parsed.error);

    const resume = parsed.data.resumeId
      ? await prisma.resume.findFirst({
          where: { id: parsed.data.resumeId, userId: guard.user.id },
          select: { id: true },
        })
      : await prisma.resume.findFirst({
          where: { userId: guard.user.id, isActive: true },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

    if (!resume) {
      return apiError("NOT_FOUND", "No resume was found to analyze. Upload one first.");
    }

    try {
      const outcome = await processResumeAnalysis(guard.user.id, resume.id);
      return apiSuccess(outcome);
    } catch (error) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { status: "FAILED", failureCode: "ANALYSIS_FAILED" },
      });
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
