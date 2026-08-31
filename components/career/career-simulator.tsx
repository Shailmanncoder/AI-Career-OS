"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, RotateCcw, Save, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreRing } from "@/components/shared/score-ring";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { postJson } from "@/lib/api/client";
import { simulateSkillAcquisition } from "@/lib/engine/scoring";
import type { CandidateSkillInput, RoleSkillInput } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

export type SimulatorRole = {
  id: string;
  title: string;
  shortDescription: string;
  roleSkills: RoleSkillInput[];
};

type SimulateResponse = {
  baselineScore: number;
  projectedScore: number;
  delta: number;
  explanation: string | null;
};

const TARGET_LEVELS = [
  { value: 60, label: "Working knowledge" },
  { value: 75, label: "Job ready" },
  { value: 90, label: "Deep expertise" },
];

export function CareerSimulator({
  roles,
  candidateSkills,
  initialRoleId,
}: {
  roles: SimulatorRole[];
  candidateSkills: CandidateSkillInput[];
  initialRoleId: string;
}) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(initialRoleId);
  const [selected, setSelected] = useState<string[]>([]);
  const [targetLevel, setTargetLevel] = useState(75);
  const [saving, setSaving] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const role = useMemo(
    () => roles.find((entry) => entry.id === roleId) ?? roles[0],
    [roles, roleId],
  );

  const levelBySkill = useMemo(() => {
    const map = new Map<string, number>();
    for (const skill of candidateSkills) {
      map.set(skill.skillId, Math.max(map.get(skill.skillId) ?? 0, skill.level));
    }
    return map;
  }, [candidateSkills]);

  const simulation = useMemo(
    () =>
      role
        ? simulateSkillAcquisition(
            candidateSkills.map((skill) => ({ ...skill })),
            role.roleSkills,
            selected,
            targetLevel,
          )
        : null,
    [role, candidateSkills, selected, targetLevel],
  );

  const candidateSkillOptions = useMemo(() => {
    if (!role) return [];
    return [...role.roleSkills]
      .map((roleSkill) => ({
        ...roleSkill,
        currentLevel: Math.round(levelBySkill.get(roleSkill.skillId) ?? 0),
      }))
      .filter((roleSkill) => roleSkill.currentLevel < roleSkill.requiredLevel)
      .sort((a, b) => {
        const order = { REQUIRED: 0, IMPORTANT: 1, OPTIONAL: 2 } as Record<string, number>;
        if (order[a.requirement] !== order[b.requirement]) {
          return order[a.requirement] - order[b.requirement];
        }
        return b.requiredLevel - a.requiredLevel;
      });
  }, [role, levelBySkill]);

  const toggleSkill = (skillId: string) => {
    setExplanation(null);
    setSelected((current) => {
      if (current.includes(skillId)) return current.filter((id) => id !== skillId);
      if (current.length >= 12) {
        toast.error("You can simulate up to 12 skills at once.");
        return current;
      }
      return [...current, skillId];
    });
  };

  const selectTopThree = () => {
    setExplanation(null);
    setSelected(candidateSkillOptions.slice(0, 3).map((skill) => skill.skillId));
  };

  const save = async () => {
    if (!role || selected.length === 0) return;
    setSaving(true);

    const result = await postJson<SimulateResponse>("/api/career/simulate", {
      careerRoleId: role.id,
      skillIds: selected,
      targetLevel,
      persist: true,
    });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setExplanation(result.data.explanation);
    toast.success(`Saved: ${result.data.delta >= 0 ? "+" : ""}${result.data.delta}% compatibility`);
    router.refresh();
  };

  if (!role || !simulation) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        No career roles are available to simulate.
      </Card>
    );
  }

  const deltaPositive = simulation.delta > 0;
  const selectedNames = role.roleSkills
    .filter((skill) => selected.includes(skill.skillId))
    .map((skill) => skill.skillName);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Choose what to learn</CardTitle>
          <CardDescription>
            Only skills where your recorded level sits below what the role expects are listed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="simulator-role">Target role</Label>
            <Select
              value={roleId}
              onValueChange={(value) => {
                setRoleId(value);
                setSelected([]);
                setExplanation(null);
              }}
            >
              <SelectTrigger id="simulator-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Level you plan to reach</Label>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => {
                    setTargetLevel(level.value);
                    setExplanation(null);
                  }}
                  aria-pressed={targetLevel === level.value}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    targetLevel === level.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label>Skills to acquire</Label>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={selectTopThree}>
                Top 3 gaps
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelected([]);
                  setExplanation(null);
                }}
                disabled={selected.length === 0}
              >
                <RotateCcw />
                Reset
              </Button>
            </div>
          </div>

          {candidateSkillOptions.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              You already meet every skill level this role expects.
            </p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
              {candidateSkillOptions.map((skill) => {
                const checked = selected.includes(skill.skillId);
                return (
                  <li key={skill.skillId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                        checked ? "border-primary bg-primary/5" : "hover:bg-muted",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSkill(skill.skillId)}
                        aria-label={`Simulate learning ${skill.skillName}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{skill.skillName}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {skill.currentLevel} → {Math.max(targetLevel, skill.requiredLevel)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {skill.requirement.toLowerCase()} · weight {skill.weight.toFixed(2)}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-3">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 glow-surface" aria-hidden="true" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What if you learned these skills?
            </CardTitle>
            <CardDescription>
              Recalculated instantly by the same deterministic engine that produced your baseline score.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <ScoreRing
                  value={simulation.baselineScore}
                  size={124}
                  label="Today"
                  tone={simulation.baselineScore >= 75 ? "success" : "warning"}
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <Badge
                  variant={deltaPositive ? "success" : "muted"}
                  className="gap-1 px-3 py-1 text-sm tabular-nums"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {deltaPositive ? "+" : ""}
                  {simulation.delta}%
                </Badge>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {selected.length} {selected.length === 1 ? "skill" : "skills"}
                </span>
              </div>

              <div className="text-center">
                <ScoreRing
                  value={simulation.projectedScore}
                  size={124}
                  label="After"
                  tone={simulation.projectedScore >= 75 ? "success" : "primary"}
                />
              </div>
            </div>

            {selectedNames.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {selectedNames.map((name) => (
                  <Badge key={name} variant="default">
                    {name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Select one or more skills on the left to see how your compatibility with{" "}
                {role.title} changes.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={save} disabled={selected.length === 0 || saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saving ? "Saving and explaining" : "Save simulation and explain"}
              </Button>
            </div>

            {explanation ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Why these skills matter
                </p>
                <p className="text-sm leading-relaxed text-pretty">{explanation}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining gaps after this change</CardTitle>
            <CardDescription>
              What would still stand between you and {role.title}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {simulation.remainingGaps.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No weighted gaps would remain for this role.
              </p>
            ) : (
              <ul className="space-y-3">
                {simulation.remainingGaps.slice(0, 8).map((gap) => (
                  <li key={gap.skillId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{gap.skillName}</span>
                        <PriorityBadge priority={gap.priority} />
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {gap.currentLevel} / {gap.requiredLevel}
                      </span>
                    </div>
                    <Progress value={(gap.currentLevel / gap.requiredLevel) * 100} className="h-1.5" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
