"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export function ScoreGauge({
  value,
  max = 100,
  caption,
  size = 200,
  className,
}: {
  value: number;
  max?: number;
  caption?: string;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(max, Math.round(value)));
  const shown = useCountUp(clamped, 1000);
  const fraction = max > 0 ? clamped / max : 0;

  const thickness = 16;
  const radius = (size - thickness) / 2;
  const height = size / 2 + thickness;
  const cx = size / 2;
  const cy = size / 2;
  const arc = Math.PI * radius;

  const tone =
    fraction >= 0.75 ? "hsl(var(--success))" : fraction >= 0.5 ? "hsl(var(--chart-1))" : "hsl(var(--warning))";

  const round = (input: number) => Number(input.toFixed(3));

  const describe = (sweep: number) => {
    const end = Math.PI - sweep * Math.PI;
    const x = round(cx + radius * Math.cos(end));
    const y = round(cy - radius * Math.sin(end));
    return `M ${round(cx - radius)} ${round(cy)} A ${round(radius)} ${round(radius)} 0 ${
      sweep > 0.5 ? 1 : 0
    } 1 ${x} ${y}`;
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: size, height }}
        role="img"
        aria-label={`Resume score ${clamped} out of ${max}`}
      >
        <svg width={size} height={height} aria-hidden="true">
          <path
            d={describe(1)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          <path
            d={describe(Math.max(0.001, fraction))}
            fill="none"
            stroke={tone}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={Number(arc.toFixed(3))}
            strokeDashoffset={0}
            style={{ transition: "d 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="display-figure text-[32px] leading-none">
            {shown}
            <span className="text-base text-muted-foreground">/{max}</span>
          </span>
        </div>
      </div>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
