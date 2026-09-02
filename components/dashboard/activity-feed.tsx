import {
  ClipboardCheck,
  FileText,
  MessagesSquare,
  Route,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";

const ICONS: Record<string, typeof FileText> = {
  RESUME_ANALYZED: FileText,
  CAREER_MATCHED: Target,
  ROADMAP_GENERATED: Route,
  TASK_COMPLETED: Route,
  RESOURCE_COMPLETED: Sparkles,
  ASSESSMENT_SCORED: ClipboardCheck,
  INTERVIEW_STARTED: MessagesSquare,
  SIMULATION_RUN: TrendingUp,
  RESUME_OPTIMIZED: FileText,
};

export type ActivityItem = { id: string; kind: string; label: string; createdAt: Date };

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Your activity will appear here once you upload a resume.
      </p>
    );
  }

  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const Icon = ICONS[item.kind] ?? Sparkles;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-snug">{item.label}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelative(item.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
