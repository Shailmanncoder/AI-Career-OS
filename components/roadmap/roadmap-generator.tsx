"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Route, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorPanel } from "@/components/shared/error-panel";
import { postJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type RoadmapRoleOption = { id: string; title: string; score: number | null };

type GenerateResponse = {
  roadmapId: string;
  title: string;
  phaseCount: number;
  taskCount: number;
  usedFallback: boolean;
};

const HORIZONS = [
  { value: "DAYS_30", label: "30 days", hint: "4 weeks" },
  { value: "DAYS_60", label: "60 days", hint: "8 weeks" },
  { value: "DAYS_90", label: "90 days", hint: "12 weeks" },
];

const WEEKLY_HOURS = [2, 4, 6, 8, 12, 20];

export function RoadmapGenerator({
  roles,
  defaultRoleId,
  defaultWeeklyHours,
  hasRoadmap,
}: {
  roles: RoadmapRoleOption[];
  defaultRoleId: string;
  defaultWeeklyHours: number;
  hasRoadmap: boolean;
}) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(defaultRoleId);
  const [horizon, setHorizon] = useState("DAYS_90");
  const [weeklyHours, setWeeklyHours] = useState(defaultWeeklyHours);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!roleId) {
      setError("Select a target career role first.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await postJson<GenerateResponse>("/api/roadmap/generate", {
      careerRoleId: roleId,
      horizon,
      weeklyHours,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success(
      result.data.usedFallback
        ? `Roadmap built by the offline engine: ${result.data.taskCount} tasks`
        : `Roadmap generated: ${result.data.phaseCount} phases, ${result.data.taskCount} tasks`,
    );
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-4 w-4 text-muted-foreground" />
          {hasRoadmap ? "Generate a new roadmap" : "Generate your roadmap"}
        </CardTitle>
        <CardDescription>
          Built from your prioritised skill gaps for the selected role, sequenced so prerequisites come
          first. Generating replaces the active roadmap for that role.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error ? <ErrorPanel message={error} onRetry={generate} /> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="roadmap-role">Target role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="roadmap-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                    {role.score !== null ? ` — ${role.score}%` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plan length</Label>
            <div className="grid grid-cols-3 gap-2">
              {HORIZONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHorizon(option.value)}
                  aria-pressed={horizon === option.value}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    horizon === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="block">{option.label}</span>
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Weekly hours</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {WEEKLY_HOURS.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setWeeklyHours(hours)}
                aria-pressed={weeklyHours === hours}
                className={cn(
                  "rounded-lg border py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  weeklyHours === hours ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
                )}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={pending} className="w-full sm:w-auto">
          {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
          {pending ? "Generating roadmap" : hasRoadmap ? "Regenerate roadmap" : "Generate roadmap"}
        </Button>
      </CardContent>
    </Card>
  );
}
