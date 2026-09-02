"use client";

import { cn } from "@/lib/utils";

export type GapSegment = { label: string; value: number; color: string };

export function SkillGapDonut({
  segments,
  size = 150,
  thickness = 22,
  className,
}: {
  segments: GapSegment[];
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let consumed = 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={thickness}
          />
          {total > 0
            ? segments.map((segment) => {
                const fraction = segment.value / total;
                const dash = fraction * circumference;
                const element = (
                  <circle
                    key={segment.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-consumed}
                    style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />
                );
                consumed += dash;
                return element;
              })
            : null}
        </svg>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: segment.color }}
              />
              <span className="truncate text-sm text-muted-foreground">{segment.label}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
