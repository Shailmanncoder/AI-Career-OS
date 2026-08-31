"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorPanel } from "@/components/shared/error-panel";
import { patchJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type CareerOption = { id: string; title: string; category: string };

const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Self taught",
];

const LEARNING_STYLES = [
  { value: "PROJECTS", label: "Building projects" },
  { value: "VIDEO", label: "Video courses" },
  { value: "READING", label: "Reading documentation" },
  { value: "INTERACTIVE", label: "Interactive exercises" },
  { value: "MIXED", label: "A mix of everything" },
];

const WEEKLY_HOURS = [2, 4, 6, 8, 12, 20];

const STEPS = [
  { title: "Where you are", description: "Your current position and background." },
  { title: "Where you want to go", description: "The role you are aiming for." },
  { title: "How you learn", description: "So the roadmap fits your actual week." },
  { title: "What you know", description: "Add skills the resume might miss." },
];

type FormState = {
  educationLevel: string;
  currentRole: string;
  yearsExperience: string;
  targetCareerId: string;
  learningStyle: string;
  weeklyLearningHrs: string;
  skills: string[];
};

export function OnboardingForm({
  careers,
  initial,
}: {
  careers: CareerOption[];
  initial: Partial<FormState>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [skillDraft, setSkillDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    educationLevel: initial.educationLevel ?? "",
    currentRole: initial.currentRole ?? "",
    yearsExperience: initial.yearsExperience ?? "",
    targetCareerId: initial.targetCareerId ?? "",
    learningStyle: initial.learningStyle ?? "MIXED",
    weeklyLearningHrs: initial.weeklyLearningHrs ?? "6",
    skills: initial.skills ?? [],
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const addSkill = () => {
    const value = skillDraft.trim();
    if (!value) return;
    if (form.skills.length >= 40) {
      toast.error("You can add up to 40 skills here.");
      return;
    }
    if (form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    update("skills", [...form.skills, value.slice(0, 60)]);
    setSkillDraft("");
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const result = await patchJson("/api/profile", {
      educationLevel: form.educationLevel || undefined,
      currentRole: form.currentRole || undefined,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
      targetCareerId: form.targetCareerId || undefined,
      learningStyle: form.learningStyle || undefined,
      weeklyLearningHrs: form.weeklyLearningHrs ? Number(form.weeklyLearningHrs) : undefined,
      skills: form.skills,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    toast.success("Profile saved");
    router.push("/resume");
    router.refresh();
  };

  const isLastStep = step === STEPS.length - 1;
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? <ErrorPanel message={error} onRetry={submit} /> : null}

        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="educationLevel">Education level</Label>
              <Select
                value={form.educationLevel}
                onValueChange={(value) => update("educationLevel", value)}
              >
                <SelectTrigger id="educationLevel">
                  <SelectValue placeholder="Select your highest level" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRole">Current role</Label>
              <Input
                id="currentRole"
                placeholder="Frontend Developer, student, career changer…"
                value={form.currentRole}
                onChange={(event) => update("currentRole", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                max={50}
                step="0.5"
                placeholder="0"
                value={form.yearsExperience}
                onChange={(event) => update("yearsExperience", event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <Label>Target career</Label>
            <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2">
              {careers.map((career) => {
                const selected = form.targetCareerId === career.id;
                return (
                  <button
                    key={career.id}
                    type="button"
                    onClick={() => update("targetCareerId", selected ? "" : career.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary/5" : "hover:bg-muted",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{career.title}</span>
                      <span className="block text-xs text-muted-foreground">{career.category}</span>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. If you skip this, your top scored match becomes the focus role.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learningStyle">Preferred learning style</Label>
              <Select
                value={form.learningStyle}
                onValueChange={(value) => update("learningStyle", value)}
              >
                <SelectTrigger id="learningStyle">
                  <SelectValue placeholder="How do you learn best?" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weekly learning time</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {WEEKLY_HOURS.map((hours) => {
                  const selected = form.weeklyLearningHrs === String(hours);
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => update("weeklyLearningHrs", String(hours))}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-lg border py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted",
                      )}
                    >
                      {hours}h
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Roadmap phases and task estimates are sized against this budget.
              </p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skillDraft">Current skills</Label>
              <div className="flex gap-2">
                <Input
                  id="skillDraft"
                  placeholder="React, SQL, Docker…"
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSkill}>
                  <Plus />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Skills you add here are matched against the catalogue and recorded as self declared at a
                lower confidence than resume evidence.
              </p>
            </div>

            {form.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => update("skills", form.skills.filter((entry) => entry !== skill))}
                      className="rounded-full p-0.5 hover:bg-background"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No skills added. Your resume upload will populate this automatically.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || submitting}
          >
            <ChevronLeft />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <Button type="button" variant="ghost" onClick={() => setStep(STEPS.length - 1)}>
                Skip ahead
              </Button>
            ) : null}

            {isLastStep ? (
              <Button type="button" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Check />}
                {submitting ? "Saving" : "Save and continue"}
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep((value) => value + 1)}>
                Next
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
