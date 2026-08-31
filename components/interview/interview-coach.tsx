"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessagesSquare,
  Play,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreRing } from "@/components/shared/score-ring";
import { ErrorPanel } from "@/components/shared/error-panel";
import { postJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export type InterviewRoleOption = { id: string; title: string; score: number | null };

type Turn =
  | { kind: "question"; content: string }
  | {
      kind: "answer";
      content: string;
      score: number;
      breakdown: Record<string, number>;
      feedback: string;
      strengths: string[];
      improvements: string[];
    };

type StartResponse = {
  sessionId: string;
  roleTitle: string;
  question: string;
  usedFallback: boolean;
};

type RespondResponse = {
  score: number;
  breakdown: {
    relevance: number;
    technicalAccuracy: number;
    structure: number;
    communication: number;
    completeness: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextQuestion: string | null;
  averageScore: number;
  completed: boolean;
  usedFallback: boolean;
};

const KINDS = [
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioural" },
  { value: "MIXED", label: "Mixed" },
];

const LEVELS = [
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
];

const BREAKDOWN_LABELS: Record<string, string> = {
  relevance: "Relevance",
  technicalAccuracy: "Technical accuracy",
  structure: "Structure",
  communication: "Communication",
  completeness: "Completeness",
};

export function InterviewCoach({
  roles,
  defaultRoleId,
}: {
  roles: InterviewRoleOption[];
  defaultRoleId: string;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [roleId, setRoleId] = useState(defaultRoleId);
  const [kind, setKind] = useState("MIXED");
  const [experience, setExperience] = useState("entry");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState<string>("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState("");
  const [averageScore, setAverageScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, sending]);

  const start = async () => {
    if (!roleId) {
      setError("Select a role to interview for.");
      return;
    }

    setStarting(true);
    setError(null);

    const result = await postJson<StartResponse>("/api/interview/start", {
      careerRoleId: roleId,
      kind,
      experience,
    });

    setStarting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSessionId(result.data.sessionId);
    setRoleTitle(result.data.roleTitle);
    setTurns([{ kind: "question", content: result.data.question }]);
    setAnswer("");
    setAverageScore(0);
    setCompleted(false);
    toast.success(`Interview started for ${result.data.roleTitle}`);
    router.refresh();
  };

  const send = async () => {
    if (!sessionId) return;

    const trimmed = answer.trim();
    if (trimmed.length < 10) {
      toast.error("Write at least 10 characters so the answer can be evaluated.");
      return;
    }

    setSending(true);
    setError(null);

    const result = await postJson<RespondResponse>("/api/interview/respond", {
      sessionId,
      answer: trimmed,
    });

    setSending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setTurns((current) => [
      ...current,
      {
        kind: "answer",
        content: trimmed,
        score: result.data.score,
        breakdown: result.data.breakdown,
        feedback: result.data.feedback,
        strengths: result.data.strengths,
        improvements: result.data.improvements,
      },
      ...(result.data.nextQuestion
        ? [{ kind: "question" as const, content: result.data.nextQuestion }]
        : []),
    ]);

    setAnswer("");
    setAverageScore(result.data.averageScore);
    setCompleted(result.data.completed);

    if (result.data.completed) {
      toast.success(`Interview complete. Average score ${result.data.averageScore}.`);
    }

    router.refresh();
  };

  const questionCount = turns.filter((turn) => turn.kind === "question").length;
  const answerCount = turns.filter((turn) => turn.kind === "answer").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
            {sessionId ? "Interview settings" : "Set up your practice interview"}
          </CardTitle>
          <CardDescription>
            Questions adapt to the role you choose and the skill gaps already recorded against it.
            Starting a new interview ends any session still in progress.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error ? <ErrorPanel message={error} onRetry={sessionId ? send : start} /> : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="interview-role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="interview-role">
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
              <Label>Interview type</Label>
              <div className="grid grid-cols-3 gap-2">
                {KINDS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setKind(option.value)}
                    aria-pressed={kind === option.value}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      kind === option.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Seniority</Label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExperience(option.value)}
                    aria-pressed={experience === option.value}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      experience === option.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={start} disabled={starting} className="w-full sm:w-auto">
            {starting ? <Loader2 className="animate-spin" /> : <Play />}
            {starting ? "Starting" : sessionId ? "Start a new interview" : "Start interview"}
          </Button>
        </CardContent>
      </Card>

      {sessionId ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{roleTitle}</CardTitle>
                <CardDescription>
                  Question {Math.min(questionCount, 8)} of 8 · {answerCount} answered
                </CardDescription>
              </div>
              {answerCount > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Average</span>
                  <Badge
                    variant={averageScore >= 70 ? "success" : averageScore >= 50 ? "warning" : "muted"}
                    className="tabular-nums"
                  >
                    {averageScore}
                  </Badge>
                </div>
              ) : null}
            </div>
            <Progress value={(answerCount / 8) * 100} className="mt-3 h-1.5" />
          </CardHeader>

          <CardContent className="space-y-4">
            {turns.map((turn, index) =>
              turn.kind === "question" ? (
                <div key={index} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg rounded-tl-none bg-muted/60 p-4">
                    <p className="text-sm leading-relaxed">{turn.content}</p>
                  </div>
                </div>
              ) : (
                <div key={index} className="space-y-3">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg rounded-tl-none border p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.content}</p>
                    </div>
                  </div>

                  <div className="ml-11 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <ScoreRing
                        value={turn.score}
                        size={72}
                        strokeWidth={6}
                        tone={turn.score >= 70 ? "success" : turn.score >= 50 ? "primary" : "warning"}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {Object.entries(turn.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-[11px] text-muted-foreground">
                              {BREAKDOWN_LABELS[key] ?? key}
                            </span>
                            <Progress value={value} className="h-1" />
                            <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">{turn.feedback}</p>

                    {turn.improvements.length > 0 ? (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Do this next time
                        </p>
                        <ul className="space-y-1">
                          {turn.improvements.map((item) => (
                            <li key={item} className="flex gap-2 text-sm leading-relaxed">
                              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}

            {sending ? (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                <div className="flex-1 rounded-lg rounded-tl-none bg-muted/60 p-4">
                  <p className="text-sm text-muted-foreground">Evaluating your answer…</p>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />

            {completed ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <div>
                  <p className="text-sm font-semibold">Interview complete</p>
                  <p className="text-sm text-muted-foreground">
                    Average score {averageScore} across {answerCount} answers. The session is saved to
                    your history.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={start}>
                  <Play />
                  Run another interview
                </Button>
              </div>
            ) : (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="interview-answer">Your answer</Label>
                <Textarea
                  id="interview-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Answer as you would out loud. Situation, what you did, and the result."
                  className="min-h-36"
                  disabled={sending}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words · aim for 90 to 180
                  </p>
                  <Button onClick={send} disabled={sending || answer.trim().length < 10}>
                    {sending ? <Loader2 className="animate-spin" /> : <Send />}
                    {sending ? "Evaluating" : "Submit answer"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
