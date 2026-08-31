import { prisma } from "@/lib/db/client";
import { guardRoute } from "@/lib/api/guard";
import { apiError, apiSuccess, handleRouteError, validationError } from "@/lib/api/response";
import { roadmapTaskUpdateSchema } from "@/lib/validation/forms";
import { summarizeRoadmapProgress } from "@/lib/services/roadmap-service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const guard = await guardRoute({ route: "roadmap-task", limit: 120, windowMs: 60_000 });
  if (!guard.ok) return guard.response;

  try {
    const parsed = roadmapTaskUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const task = await prisma.roadmapTask.findFirst({
      where: {
        id: parsed.data.taskId,
        phase: { roadmap: { userId: guard.user.id } },
      },
      select: { id: true, title: true, phase: { select: { roadmapId: true } } },
    });

    if (!task) return apiError("NOT_FOUND", "That roadmap task could not be found.");

    await prisma.roadmapTask.update({
      where: { id: task.id },
      data: {
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
      },
    });

    const phases = await prisma.roadmapPhase.findMany({
      where: { roadmapId: task.phase.roadmapId },
      select: { tasks: { select: { completed: true, estimateHrs: true } } },
    });

    const progress = summarizeRoadmapProgress(phases);

    if (parsed.data.completed) {
      await prisma.activityEvent.create({
        data: {
          userId: guard.user.id,
          kind: "TASK_COMPLETED",
          label: `Completed: ${task.title}`,
          value: progress.percentage,
        },
      });
    }

    return apiSuccess({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}
