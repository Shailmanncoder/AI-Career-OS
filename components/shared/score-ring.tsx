import { cn } from "@/lib/utils";

type ScoreRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  tone?: "primary" | "success" | "warning";
};

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 9,
  label,
  className,
  tone = "primary",
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    tone === "success"
      ? "hsl(var(--success))"
      : tone === "warning"
        ? "hsl(var(--warning))"
        : "hsl(var(--primary))";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
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
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{clamped}</span>
        {label ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
