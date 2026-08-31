import { Badge } from "@/components/ui/badge";

const PRIORITY_VARIANT = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "muted",
} as const;

export function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" | string }) {
  const key = (priority as keyof typeof PRIORITY_VARIANT) in PRIORITY_VARIANT ? (priority as keyof typeof PRIORITY_VARIANT) : "LOW";
  return (
    <Badge variant={PRIORITY_VARIANT[key]} className="uppercase tracking-wide">
      {key.toLowerCase()}
    </Badge>
  );
}
