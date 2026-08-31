"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  suffix = "",
  className,
  durationMs = 900,
}: {
  value: number;
  suffix?: string;
  className?: string;
  durationMs?: number;
}) {
  const animated = useCountUp(value, durationMs);
  return (
    <span className={cn("numeric", className)} aria-label={`${value}${suffix}`}>
      <span aria-hidden="true">
        {animated}
        {suffix}
      </span>
    </span>
  );
}
