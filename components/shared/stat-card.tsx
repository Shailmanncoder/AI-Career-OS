import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning";
  className?: string;
  suffix?: string;
};

const TONE_STYLES = {
  default: "bg-muted text-muted-foreground ring-border",
  primary: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/15 text-warning ring-warning/20",
};

const ACCENT_STYLES = {
  default: "from-muted-foreground/25",
  primary: "from-primary/60",
  success: "from-success/60",
  warning: "from-warning/60",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
  suffix = "",
}: StatCardProps) {
  const numeric = typeof value === "number" ? value : null;

  return (
    <Card className={cn("card-interactive surface-sheen group relative overflow-hidden p-5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent opacity-70",
          ACCENT_STYLES[tone],
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            {label}
          </p>

          <p className="display-figure mt-2.5 text-[28px] leading-none">
            {numeric !== null ? <AnimatedNumber value={numeric} suffix={suffix} /> : value}
          </p>

          {hint ? (
            <p className="mt-2 truncate text-xs leading-relaxed text-muted-foreground">{hint}</p>
          ) : null}
        </div>

        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:scale-105",
            TONE_STYLES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
