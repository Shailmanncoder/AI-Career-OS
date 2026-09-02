import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Milestone = { days: string; label: string; state: "done" | "current" | "upcoming" };

export function MilestoneTrack({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="flex w-full items-start justify-between gap-1">
      {milestones.map((milestone, index) => (
        <li
          key={milestone.days}
          className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
        >
          {index < milestones.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-[calc(50%+0.875rem)] right-[calc(-50%+0.875rem)] top-3 h-0.5",
                milestone.state === "done" ? "bg-primary" : "bg-border",
              )}
            />
          ) : null}

          <span
            className={cn(
              "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background transition-colors",
              milestone.state === "done"
                ? "border-primary bg-primary text-primary-foreground"
                : milestone.state === "current"
                  ? "border-primary"
                  : "border-border",
            )}
          >
            {milestone.state === "done" ? (
              <Check className="h-3.5 w-3.5" />
            ) : milestone.state === "current" ? (
              <span className="h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </span>

          <span className="truncate text-xs font-medium sm:text-sm">{milestone.days}</span>
          <span className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
            {milestone.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
