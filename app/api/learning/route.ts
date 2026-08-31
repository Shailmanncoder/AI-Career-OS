import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { learningProgressSchema } from "@/lib/validation/forms";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const guard = await guardRoute({ route: "learning-progress", limit: 120, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = learningProgressSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const resource = await prisma.learningResource.findUnique({
      where: { id: parsed.data.resourceId },
      select: { id: true, title: true },
    });
    if (!resource) return apiError("NOT_FOUND", "That learning resource could not be found.");

    await prisma.learningProgress.upsert({
      where: { userId_resourceId: { userId: guard.user.id, resourceId: resource.id } },
      create: {
        userId: guard.user.id,
        resourceId: resource.id,
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
      },
      update: {
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
      },
    });

    if (parsed.data.completed) {
      await prisma.activityEvent.create({
        data: {
          userId: guard.user.id,
          kind: "RESOURCE_COMPLETED",
          label: `Completed: ${resource.title}`,
          value: 1,
        },
      });
    }

    const completedCount = await prisma.learningProgress.count({
      where: { userId: guard.user.id, completed: true },
    });

    return apiSuccess({ completedCount });
  } catch (error) {
    return handleRouteError(error);
  }
}
