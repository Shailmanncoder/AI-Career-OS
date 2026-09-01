import {
  ArrowUpRight,
  BadgeCheck,
  CircleDot,
  FileText,
  MessageSquareQuote,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/shared/score-ring";
import type { LandingPreviewData } from "@/lib/services/landing-service";
import { cn } from "@/lib/utils";

function PreviewFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("overflow-hidden border-border/70 p-0", className)}>
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Live demo data
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}

function Unavailable({ label }: { label: string }) {
  return (
    <PreviewFrame>
      <p className="py-10 text-center text-sm text-muted-foreground">
        {label} becomes available once the demo account is seeded.
      </p>
    </PreviewFrame>
  );
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= 0.55) return "Moderate confidence";
  return "Low evidence";
}

export function SkillIntelligencePreview({ data }: { data: LandingPreviewData | null }) {
  if (!data || data.skills.length === 0) return <Unavailable label="Skill intelligence" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Skill Intelligence</p>
          <p className="text-xs text-muted-foreground">
            {data.skillCount} skills extracted with evidence
          </p>
        </div>
        <Badge variant="muted" className="gap-1 font-normal">
          <Sparkles className="h-3 w-3" />
          AI estimated
        </Badge>
      </div>

      <ul className="space-y-3.5">
        {data.skills.map((skill) => (
          <li key={skill.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{skill.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {skill.level}
              </span>
            </div>
            <Progress value={skill.level} className="h-1.5" />
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{skill.category}</span>
              <span>{confidenceLabel(skill.confidence)}</span>
            </div>
          </li>
        ))}
      </ul>
    </PreviewFrame>
  );
}

export function CareerSimulatorPreview({ data }: { data: LandingPreviewData | null }) {
  const simulation = data?.simulation;
  if (!simulation) return <Unavailable label="The career simulator" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Career Simulator</p>
          <p className="text-xs text-muted-foreground">{simulation.roleTitle}</p>
        </div>
        <Badge variant={simulation.delta > 0 ? "success" : "muted"} className="gap-1 tabular-nums">
          <ArrowUpRight className="h-3 w-3" />
          {simulation.delta > 0 ? "+" : ""}
          {simulation.delta}%
        </Badge>
      </div>

      <div className="flex items-center justify-center gap-5 sm:gap-8">
        <ScoreRing value={simulation.baselineScore} size={92} strokeWidth={7} label="Now" tone="warning" />
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">adds</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <ScoreRing value={simulation.projectedScore} size={92} strokeWidth={7} label="After" tone="success" />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {simulation.addedSkills.map((skill) => (
          <Badge key={skill} variant="default" className="gap-1">
            <CircleDot className="h-3 w-3" />
            {skill}
          </Badge>
        ))}
      </div>

      {simulation.explanation ? (
        <p className="mt-5 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          {simulation.explanation}
        </p>
      ) : null}
    </PreviewFrame>
  );
}

export function RoadmapPreview({ data }: { data: LandingPreviewData | null }) {
  const roadmap = data?.roadmap;
  if (!roadmap) return <Unavailable label="The roadmap" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{roadmap.title}</p>
          <p className="text-xs text-muted-foreground">
            {roadmap.weeklyHours} hours per week · {roadmap.taskCount} tasks
          </p>
        </div>
        <Badge variant="muted" className="shrink-0 tabular-nums">
          {roadmap.percentage}% complete
        </Badge>
      </div>

      <ol className="relative space-y-4 border-l border-border pl-5">
        {roadmap.phases.map((phase) => {
          const complete = phase.total > 0 && phase.done === phase.total;
          const active = phase.done > 0 && !complete;
          return (
            <li key={phase.title} className="relative">
              <span
                className={cn(
                  "absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background",
                  complete ? "bg-success" : active ? "bg-primary" : "bg-border",
                )}
              />
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn("truncate text-sm font-medium", !complete && !active && "text-muted-foreground")}>
                  {phase.title}
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {phase.done}/{phase.total}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Weeks {phase.weekStart}–{phase.weekEnd}
              </p>
            </li>
          );
        })}
      </ol>
    </PreviewFrame>
  );
}

export function ResumeOptimizerPreview({ data }: { data: LandingPreviewData | null }) {
  const resume = data?.resume;
  if (!resume) return <Unavailable label="The resume optimizer" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Resume Optimizer</p>
          <p className="truncate text-xs text-muted-foreground">Target: {resume.roleTitle}</p>
        </div>
        <Badge variant={resume.atsScore >= 70 ? "success" : "warning"} className="shrink-0 tabular-nums">
          ATS readiness {resume.atsScore}
        </Badge>
      </div>

      <div className="space-y-3">
        {resume.bullet ? (
          <div className="rounded-lg border border-success/25 bg-success/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-success">
              <BadgeCheck className="h-3 w-3" />
              A bullet that already works
            </p>
            <p className="text-xs leading-relaxed">{resume.bullet}</p>
          </div>
        ) : null}

        <div className="rounded-lg border p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3 w-3" />
            Resume score
          </p>
          <div className="flex items-center gap-3">
            <Progress value={resume.overallScore} className="h-1.5" />
            <span className="shrink-0 text-xs font-medium tabular-nums">{resume.overallScore}</span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Rewrites only rephrase content already in your resume. Missing metrics are marked as
          placeholders for you to fill in, never invented.
        </p>
      </div>
    </PreviewFrame>
  );
}

export function InterviewCoachPreview({ data }: { data: LandingPreviewData | null }) {
  const interview = data?.interview;
  if (!interview) return <Unavailable label="The interview coach" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Interview Coach</p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {interview.kind.toLowerCase()} · {interview.experience} level
          </p>
        </div>
        <Badge
          variant={interview.score >= 70 ? "success" : "warning"}
          className="shrink-0 tabular-nums"
        >
          Answer score {interview.score}
        </Badge>
      </div>

      <div className="mb-4 flex gap-3 rounded-lg bg-muted/60 p-3">
        <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed">{interview.question}</p>
      </div>

      {interview.improvements.length > 0 ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Do this next time
          </p>
          <ul className="space-y-1">
            {interview.improvements.map((item) => (
              <li key={item} className="text-xs leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </PreviewFrame>
  );
}

export function CareerMatchPreview({ data }: { data: LandingPreviewData | null }) {
  if (!data || data.matches.length === 0) return <Unavailable label="Career matching" />;

  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Top Career Matches</p>
          <p className="text-xs text-muted-foreground">
            Weighted skill matching · {data.roleCount} roles scored
          </p>
        </div>
        <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <ul className="space-y-3.5">
        {data.matches.map((match, index) => (
          <li key={match.role} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn("truncate text-sm", index === 0 ? "font-semibold" : "font-medium")}>
                {match.role}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{match.score}%</span>
            </div>
            <Progress
              value={match.score}
              className="h-2"
              indicatorClassName={index === 0 ? "bg-primary" : "bg-primary/40"}
            />
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
        Percentages come from a deterministic weighted algorithm, not from a language model.
      </p>
    </PreviewFrame>
  );
}
