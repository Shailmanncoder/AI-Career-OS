"use client";

import { useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { patchJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type ResourceView = {
  id: string;
  title: string;
  provider: string;
  url: string;
  type: string;
  difficulty: string;
  estimateHrs: number;
  completed: boolean;
};

export type ResourceGroup = {
  skillId: string;
  skillName: string;
  priority: string;
  currentLevel: number;
  requiredLevel: number;
  resources: ResourceView[];
};

export function LearningResources({ groups }: { groups: ResourceGroup[] }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groups.flatMap((group) => group.resources.map((resource) => [resource.id, resource.completed])),
    ),
  );

  const toggle = async (resourceId: string, next: boolean) => {
    const previous = completed[resourceId];
    setCompleted((current) => ({ ...current, [resourceId]: next }));

    const result = await patchJson<{ completedCount: number }>("/api/learning", {
      resourceId,
      completed: next,
    });

    if (!result.ok) {
      setCompleted((current) => ({ ...current, [resourceId]: previous }));
      toast.error(result.message);
      return;
    }

    if (next) toast.success("Marked as completed");
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Learning recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No curated resources are catalogued for your current gaps yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Learning recommendations
        </CardTitle>
        <CardDescription>
          Public resources from official documentation and open courses, mapped to your highest
          priority gaps. Links open in a new tab.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={group.skillId} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{group.skillName}</p>
              <PriorityBadge priority={group.priority} />
              <span className="text-xs tabular-nums text-muted-foreground">
                level {group.currentLevel} of {group.requiredLevel}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {group.resources.map((resource) => {
                const done = completed[resource.id];
                return (
                  <div
                    key={resource.id}
                    className={cn(
                      "flex gap-3 rounded-lg border p-3 transition-colors",
                      done ? "border-success/30 bg-success/5" : "hover:bg-muted/60",
                    )}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={done}
                      onCheckedChange={(value) => void toggle(resource.id, value === true)}
                      aria-label={`Mark ${resource.title} ${done ? "incomplete" : "complete"}`}
                    />

                    <div className="min-w-0 flex-1">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group flex items-start justify-between gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={cn(
                            "text-sm font-medium leading-snug group-hover:underline",
                            done && "text-muted-foreground",
                          )}
                        >
                          {resource.title}
                        </span>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>

                      <p className="mt-1 text-xs text-muted-foreground">{resource.provider}</p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="font-normal capitalize">
                          {resource.type.toLowerCase()}
                        </Badge>
                        <Badge variant="muted" className="font-normal capitalize">
                          {resource.difficulty.toLowerCase()}
                        </Badge>
                        <Badge variant="muted" className="font-normal">
                          {resource.estimateHrs}h
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
