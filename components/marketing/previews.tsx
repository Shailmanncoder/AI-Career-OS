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
import { cn } from "@/lib/utils";

function PreviewFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("overflow-hidden border-border/70 p-0", className)}>
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}

const SKILL_ROWS = [
  { name: "React", category: "Frameworks", level: 80, confidence: "High confidence" },
  { name: "TypeScript", category: "Programming", level: 68, confidence: "High confidence" },
  { name: "Web Performance", category: "Tools", level: 66, confidence: "Evidenced by metrics" },
  { name: "Node.js", category: "Frameworks", level: 34, confidence: "Low evidence" },
  { name: "PostgreSQL", category: "Databases", level: 30, confidence: "Project only" },
];

export function SkillIntelligencePreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Skill Intelligence</p>
          <p className="text-xs text-muted-foreground">19 skills extracted with evidence</p>
        </div>
        <Badge variant="muted" className="gap-1 font-normal">
          <Sparkles className="h-3 w-3" />
          AI estimated
        </Badge>
      </div>

      <ul className="space-y-3.5">
        {SKILL_ROWS.map((skill) => (
          <li key={skill.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{skill.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{skill.level}</span>
            </div>
            <Progress value={skill.level} className="h-1.5" />
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{skill.category}</span>
              <span>{skill.confidence}</span>
            </div>
          </li>
        ))}
      </ul>
    </PreviewFrame>
  );
}

export function CareerSimulatorPreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Career Simulator</p>
          <p className="text-xs text-muted-foreground">Full Stack Developer</p>
        </div>
        <Badge variant="success" className="gap-1">
          <ArrowUpRight className="h-3 w-3" />
          +13%
        </Badge>
      </div>

      <div className="flex items-center justify-center gap-5 sm:gap-8">
        <div className="text-center">
          <ScoreRing value={78} size={92} strokeWidth={7} label="Now" tone="warning" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wider">adds</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <div className="text-center">
          <ScoreRing value={91} size={92} strokeWidth={7} label="After" tone="success" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {["Node.js", "PostgreSQL", "REST APIs"].map((skill) => (
          <Badge key={skill} variant="default" className="gap-1">
            <CircleDot className="h-3 w-3" />
            {skill}
          </Badge>
        ))}
      </div>

      <p className="mt-5 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        Server side ownership is the largest weighted deduction on this role. These three skills convert
        three separate required-skill gaps into met requirements at once.
      </p>
    </PreviewFrame>
  );
}

const PHASES = [
  { title: "Foundations", weeks: "Weeks 1–2", tasks: 4, done: 4 },
  { title: "Core Skill Build", weeks: "Weeks 3–5", tasks: 4, done: 2 },
  { title: "Applied Practice", weeks: "Weeks 6–8", tasks: 4, done: 0 },
  { title: "Integration Project", weeks: "Weeks 9–11", tasks: 3, done: 0 },
  { title: "Portfolio & Interview Prep", weeks: "Week 12", tasks: 3, done: 0 },
];

export function RoadmapPreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">90-Day Roadmap</p>
          <p className="text-xs text-muted-foreground">8 hours per week · 18 tasks</p>
        </div>
        <Badge variant="muted">33% complete</Badge>
      </div>

      <ol className="relative space-y-4 border-l border-border pl-5">
        {PHASES.map((phase) => {
          const complete = phase.done === phase.tasks;
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
                <p className={cn("text-sm font-medium", !complete && !active && "text-muted-foreground")}>
                  {phase.title}
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {phase.done}/{phase.tasks}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{phase.weeks}</p>
            </li>
          );
        })}
      </ol>
    </PreviewFrame>
  );
}

export function ResumeOptimizerPreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Resume Optimizer</p>
          <p className="text-xs text-muted-foreground">Target: Full Stack Developer</p>
        </div>
        <Badge variant="warning">ATS readiness 71</Badge>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-destructive">
            <FileText className="h-3 w-3" />
            Original
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Worked on the shipment tracking dashboard and improved its performance.
          </p>
        </div>

        <div className="rounded-lg border border-success/25 bg-success/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-success">
            <BadgeCheck className="h-3 w-3" />
            Improved
          </p>
          <p className="text-xs leading-relaxed">
            Rebuilt the shipment tracking dashboard in React and TypeScript, cutting first contentful
            paint from 3.4s to 1.2s.
          </p>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Rewrites only rephrase content already in your resume. Missing metrics are marked as
          placeholders for you to fill in, never invented.
        </p>
      </div>
    </PreviewFrame>
  );
}

const INTERVIEW_SCORES = [
  { label: "Relevance", value: 88 },
  { label: "Technical accuracy", value: 79 },
  { label: "Structure", value: 84 },
  { label: "Communication", value: 81 },
  { label: "Completeness", value: 78 },
];

export function InterviewCoachPreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Interview Coach</p>
          <p className="text-xs text-muted-foreground">Mixed · Mid level</p>
        </div>
        <Badge variant="success">Answer score 82</Badge>
      </div>

      <div className="mb-4 flex gap-3 rounded-lg bg-muted/60 p-3">
        <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed">
          Tell me about a project you are proud of, and walk me through one technical decision you made
          in it.
        </p>
      </div>

      <ul className="space-y-2.5">
        {INTERVIEW_SCORES.map((score) => (
          <li key={score.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[11px] text-muted-foreground">{score.label}</span>
            <Progress value={score.value} className="h-1.5" />
            <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {score.value}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
        <span className="font-medium">Next: </span>
        State what you measured with, so the numbers are traceable.
      </p>
    </PreviewFrame>
  );
}

const MATCHES = [
  { role: "Full Stack Developer", score: 87 },
  { role: "Frontend Developer", score: 84 },
  { role: "Backend Developer", score: 76 },
  { role: "Data Analyst", score: 62 },
];

export function CareerMatchPreview() {
  return (
    <PreviewFrame>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Top Career Matches</p>
          <p className="text-xs text-muted-foreground">Weighted skill matching · 14 roles scored</p>
        </div>
        <Target className="h-4 w-4 text-muted-foreground" />
      </div>

      <ul className="space-y-3.5">
        {MATCHES.map((match, index) => (
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
