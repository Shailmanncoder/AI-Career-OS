import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SnapshotSkill = { name: string; level: number };

export function proficiencyLabel(level: number) {
  if (level >= 75) return "Advanced";
  if (level >= 45) return "Intermediate";
  return "Beginner";
}

const TONE: Record<string, string> = {
  Advanced: "text-success",
  Intermediate: "text-primary",
  Beginner: "text-warning",
};

export function SkillsSnapshot({ skills }: { skills: SnapshotSkill[] }) {
  if (skills.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No skills recorded yet. Upload a resume to populate this.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => {
          const label = proficiencyLabel(skill.level);
          return (
            <li
              key={skill.name}
              className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
            >
              <span className="truncate text-sm font-medium">{skill.name}</span>
              <span className={cn("shrink-0 text-xs font-medium", TONE[label])}>{label}</span>
            </li>
          );
        })}
      </ul>

      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        View all skills
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
