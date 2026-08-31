import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  BrainCircuit,
  FileSearch,
  GitBranch,
  Gauge,
  Layers,
  LineChart,
  MessagesSquare,
  Route,
  ScanSearch,
  ShieldCheck,
  Telescope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-3",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-backdrop" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] glow-surface" aria-hidden="true" />

      <div className="container relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6 gap-1.5 border-border/80 bg-background/60 py-1 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Resume analysis, skill gaps, and a plan that adapts
          </Badge>

          <h1 className="animate-fade-up text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Your Resume Knows Where You Are.
            <span className="block bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              AI CareerOS Shows You Where To Go.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            Upload your resume, discover your skill gaps, explore career paths, and get a personalized
            roadmap powered by AI.
          </p>

          <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={isAuthenticated ? "/resume" : "/register"}>
                Analyze My Resume
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login?demo=1">Explore Demo</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            PDF or DOCX · Text extracted on the server · Scores calculated deterministically
          </p>
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  {
    icon: ScanSearch,
    title: "Feedback is generic",
    body: "Most tools return a score and a keyword list. Neither tells you which skill to learn on Monday morning.",
  },
  {
    icon: Telescope,
    title: "The target is invisible",
    body: "You can read a hundred job descriptions and still not know how far you actually are from the role.",
  },
  {
    icon: GitBranch,
    title: "Learning has no sequence",
    body: "Course lists ignore dependencies. Learning a framework before the language underneath it wastes weeks.",
  },
];

export function Problem() {
  return (
    <section className="border-t bg-muted/25 py-20 sm:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="The problem"
          title="A resume tells you where you stand. Nothing tells you where to go."
          description="Candidates are told to upskill without being told which skill, in what order, or how much it would actually change their prospects."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <Card key={problem.title} className="p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <problem.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-base font-semibold tracking-tight">{problem.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{problem.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: "01",
    icon: FileSearch,
    title: "Parse and analyse",
    body: "Your PDF or DOCX is parsed server side. Gemini extracts a structured profile that is validated against a strict schema before it touches the database.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Build a skill graph",
    body: "Extracted skills are resolved against a curated catalogue, categorised, and scored with the evidence and confidence behind each estimate.",
  },
  {
    number: "03",
    icon: Gauge,
    title: "Score every career",
    body: "A deterministic weighted algorithm scores your profile against every role in the career database. No language model decides your percentage.",
  },
  {
    number: "04",
    icon: Route,
    title: "Sequence the work",
    body: "Gaps become a phased roadmap with real learning resources, practice tasks, and a project, ordered so prerequisites come first.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="How AI CareerOS works"
          title="Four steps from a PDF to a plan"
          description="AI handles language. The application handles arithmetic. Keeping those separate is what makes the output trustworthy."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <Card key={step.number} className="relative overflow-hidden p-6">
              <span className="absolute right-4 top-3 text-4xl font-semibold tabular-nums text-muted/70">
                {step.number}
              </span>
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Resume analysis engine",
    body: "Structured extraction of experience, projects, education, certifications, and skills, with every AI response validated before storage.",
  },
  {
    icon: Blocks,
    title: "Skill intelligence",
    body: "Every skill carries a category, an estimated level, the evidence behind it, and a confidence value. Estimates are labelled as estimates.",
  },
  {
    icon: Gauge,
    title: "Deterministic career matching",
    body: "Weighted matching across 14 roles and their required, important, and optional skills. Reproducible for the same inputs.",
  },
  {
    icon: LineChart,
    title: "Skill gap engine",
    body: "Current level against required level, prioritised by gap size, role importance, and the foundation you already have.",
  },
  {
    icon: Route,
    title: "Personalized roadmap",
    body: "30, 60, or 90 day plans with phases, weekly tasks, projects, and checkpoints. Progress persists and drives your dashboard.",
  },
  {
    icon: MessagesSquare,
    title: "Interview coach",
    body: "One question at a time, scored on five dimensions, with a follow-up that adapts to what you actually said.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t bg-muted/25 py-20 sm:py-24">
      <div className="container">
        <SectionHeading
          eyebrow="Core features"
          title="Everything between your resume and the offer"
          description="One coherent system rather than six disconnected tools. Each feature writes into the same skill graph."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="group p-6 transition-shadow hover:shadow-md">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <feature.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-base font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureSplit({
  id,
  eyebrow,
  title,
  description,
  bullets,
  preview,
  reverse = false,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  preview: React.ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <section id={id} className={cn("py-20 sm:py-24", className)}>
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className={cn("space-y-5", reverse && "lg:order-2")}>
            <SectionHeading eyebrow={eyebrow} title={title} description={description} align="left" />
            <ul className="space-y-2.5">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={cn(reverse && "lg:order-1")}>{preview}</div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="border-t py-20 sm:py-28">
      <div className="container">
        <Card className="relative overflow-hidden border-primary/20 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 glow-surface" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              Turn your resume into your career roadmap.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
              Upload once. Get a validated skill profile, scored career matches, a prioritised gap list,
              and a plan you can start this week.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={isAuthenticated ? "/resume" : "/register"}>
                  Analyze My Resume
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login?demo=1">Explore Demo</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Turn your resume into your career roadmap. Built for the ATH Hackathon 0.1 problem
              statement on AI-powered resume analysis and career recommendation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product
              </p>
              <ul className="space-y-2 text-sm">
                <li><a className="text-muted-foreground hover:text-foreground" href="#how-it-works">How it works</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#features">Features</a></li>
                <li><a className="text-muted-foreground hover:text-foreground" href="#simulator">Simulator</a></li>
              </ul>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              <ul className="space-y-2 text-sm">
                <li><Link className="text-muted-foreground hover:text-foreground" href="/register">Create account</Link></li>
                <li><Link className="text-muted-foreground hover:text-foreground" href="/login">Sign in</Link></li>
                <li><Link className="text-muted-foreground hover:text-foreground" href="/login?demo=1">Demo account</Link></li>
              </ul>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transparency
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Scores are deterministic</li>
                <li>Skill levels are AI estimates</li>
                <li>Assessments are not certifications</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          AI CareerOS provides career guidance based on the information you supply. It does not
          guarantee employment outcomes and is not affiliated with any applicant tracking system vendor.
        </div>
      </div>
    </footer>
  );
}
