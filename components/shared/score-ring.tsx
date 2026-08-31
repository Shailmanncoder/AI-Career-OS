"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type ScoreRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  tone?: "primary" | "success" | "warning";
  animate?: boolean;
};

const TONE_STOPS: Record<string, [string, string]> = {
  primary: ["hsl(var(--chart-1))", "hsl(var(--chart-5))"],
  success: ["hsl(var(--success))", "hsl(var(--chart-2))"],
  warning: ["hsl(var(--warning))", "hsl(var(--chart-3))"],
};

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 9,
  label,
  className,
  tone = "primary",
  animate = true,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const animated = useCountUp(animate ? clamped : 0, animate ? 900 : 0);
  const display = animate ? animated : clamped;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = `ring-${tone}-${size}-${strokeWidth}`;
  const [from, to] = TONE_STOPS[tone] ?? TONE_STOPS.primary;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${clamped} out of 100` : `${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1100ms cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 6px ${from}40)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="display-figure leading-none"
          style={{ fontSize: Math.max(18, Math.round(size * 0.235)) }}
        >
          {display}
        </span>
        {label ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
