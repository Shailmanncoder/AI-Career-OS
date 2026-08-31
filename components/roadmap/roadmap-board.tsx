"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Dumbbell, FlaskConical, Hammer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { patchJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type RoadmapTaskView = {
  id: string;
  title: string;
  objective: string;
  kind: string;
  estimateHrs: number;
  completed: boolean;
  skillName: string | null;
};

export type RoadmapPhaseView = {
  id: string;
  title: string;
  focus: string;
  weekStart: number;
  weekEnd: number;
  tasks: RoadmapTaskView[];
};

const KIND_META: Record<string, { icon: typeof BookOpenCheck; label: string }> = {
  LEARN: { icon: BookOpenCheck, label: "Learn" },
  PRACTICE: { icon: Dumbbell, label: "Practice" },
  PROJECT: { icon: Hammer, label: "Project" },
  ASSESSMENT: { icon: FlaskConical, label: "Assessment" },
};

export function RoadmapBoard({
  phases,
  initialPercentage,
}: {
  phases: RoadmapPhaseView[];
  initialPercentage: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [completed, setCompleted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      phases.flatMap((phase) => phase.tasks.map((task) => [task.id, task.completed])),
    ),
  );
  const [percentage, setPercentage] = useState(initialPercentage);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const allTasks = phases.flatMap((phase) => phase.tasks);
  const completedCount = allTasks.filter((task) => completed[task.id]).length;

  const toggle = async (taskId: string, next: boolean) => {
    const previous = completed[taskId];
    setCompleted((current) => ({ ...current, [taskId]: next }));
    setPendingTaskId(taskId);

    const result = await patchJson<{ progress: { percentage: number } }>("/api/roadmap/tasks", {
      taskId,
      completed: next,
    });

    setPendingTaskId(null);

    if (!result.ok) {
      setCompleted((current) => ({ ...current, [taskId]: previous }));
      toast.error(result.message);
      return;
    }

    setPercentage(result.data.progress.percentage);
    if (next) toast.success("Task marked complete");
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {completedCount} of {allTasks.length} tasks complete
            </p>
            <p className="text-xs text-muted-foreground">
              Progress is stored in the database and drives your dashboard and streak.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:w-64">
            <Progress value={percentage} className="h-2" indicatorClassName="bg-success" />
            <span className="shrink-0 text-sm font-semibold tabular-nums">{percentage}%</span>
          </div>
        </CardContent>
      </Card>

      {phases.map((phase, index) => {
        const phaseDone = phase.tasks.filter((task) => completed[task.id]).length;
        const phaseComplete = phaseDone === phase.tasks.length && phase.tasks.length > 0;

        return (
          <Card key={phase.id}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    Phase {index + 1}
                  </span>
                  {phase.title}
                </CardTitle>
                <CardDescription className="mt-1">{phase.focus}</CardDescription>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant={phaseComplete ? "success" : "muted"} className="tabular-nums">
                  {phaseDone}/{phase.tasks.length}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Weeks {phase.weekStart}–{phase.weekEnd}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {phase.tasks.map((task) => {
                const meta = KIND_META[task.kind] ?? KIND_META.LEARN;
                const Icon = meta.icon;
                const isDone = completed[task.id];

                return (
                  <label
                    key={task.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                      isDone ? "border-success/30 bg-success/5" : "hover:bg-muted/60",
                    )}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={isDone}
                      disabled={pendingTaskId === task.id}
                      onCheckedChange={(value) => void toggle(task.id, value === true)}
                      aria-label={`Mark ${task.title} ${isDone ? "incomplete" : "complete"}`}
                    />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </span>
                        {pendingTaskId === task.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>

                      <p className="text-sm leading-relaxed text-muted-foreground">{task.objective}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                        {task.skillName ? (
                          <Badge variant="muted" className="font-normal">
                            {task.skillName}
                          </Badge>
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          about {task.estimateHrs}h
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
