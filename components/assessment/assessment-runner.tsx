"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export type AssessmentSkillOption = {
  id: string;
  name: string;
  level: number;
  verified: boolean;
};

type GeneratedAssessment = {
  assessment: {
    id: string;
    title: string;
    skillName: string;
    difficulty: string;
    questions: Array<{
      id: string;
      order: number;
      kind: string;
      prompt: string;
      options: string[];
    }>;
  };
  usedFallback: boolean;
};

type SubmitResponse = {
  attemptId: string;
  score: number;
  earnedPoints: number;
  totalPoints: number;
  feedback: string;
  verifiedLevel: number;
  usedFallback: boolean;
  results: Array<{
    questionId: string;
    prompt: string;
    kind: string;
    isCorrect: boolean;
    earnedPoints: number;
    points: number;
    feedback: string;
    correctOption: number | null;
    options: string[];
  }>;
};

const DIFFICULTIES = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function AssessmentRunner({ skills }: { skills: AssessmentSkillOption[] }) {
  const router = useRouter();
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<GeneratedAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, { option?: number; text?: string }>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const generate = async () => {
    if (!skillId) {
      setError("Select a skill to assess.");
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setAnswers({});

    const response = await postJson<GeneratedAssessment>("/api/assessment/generate", {
      skillId,
      difficulty,
      questionCount,
    });

    setGenerating(false);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    setAssessment(response.data);
    toast.success(
      response.data.usedFallback
        ? "Assessment built by the offline engine"
        : `${response.data.assessment.questions.length} questions generated`,
    );
  };

  const submit = async () => {
    if (!assessment) return;

    const unanswered = assessment.assessment.questions.filter((question) => {
      const answer = answers[question.id];
      if (question.kind === "MULTIPLE_CHOICE") return answer?.option === undefined;
      return !answer?.text || answer.text.trim().length < 10;
    });

    if (unanswered.length > 0) {
      toast.error(
        `${unanswered.length} ${unanswered.length === 1 ? "question is" : "questions are"} still incomplete.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await postJson<SubmitResponse>("/api/assessment/submit", {
      assessmentId: assessment.assessment.id,
      answers: assessment.assessment.questions.map((question) => ({
        questionId: question.id,
        selectedOption: answers[question.id]?.option,
        responseText: answers[question.id]?.text,
      })),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    setResult(response.data);
    toast.success(`Scored ${response.data.score}`);
    router.refresh();
  };

  const answeredCount = assessment
    ? assessment.assessment.questions.filter((question) => {
        const answer = answers[question.id];
        if (question.kind === "MULTIPLE_CHOICE") return answer?.option !== undefined;
        return Boolean(answer?.text && answer.text.trim().length >= 10);
      }).length
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Generate an assessment
          </CardTitle>
          <CardDescription>
            A practice assessment that produces recorded evidence for a skill, replacing its AI
            estimate. This is not a certification and is not issued by any certifying body.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error ? <ErrorPanel message={error} onRetry={generate} /> : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="assessment-skill">Skill</Label>
              <Select value={skillId} onValueChange={setSkillId}>
                <SelectTrigger id="assessment-skill">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name} — level {skill.level}
                      {skill.verified ? " (verified)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="assessment-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Questions</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 6, 8].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    aria-pressed={questionCount === count}
                    className={cn(
                      "rounded-lg border py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      questionCount === count
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={generate} disabled={generating} className="w-full sm:w-auto">
            {generating ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
            {generating ? "Generating questions" : "Generate assessment"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Your result</CardTitle>
            <CardDescription>{result.feedback}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <ScoreRing
                value={result.score}
                size={124}
                label="Score"
                tone={result.score >= 70 ? "success" : result.score >= 45 ? "primary" : "warning"}
              />
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-success" />
                  Skill level updated to{" "}
                  <span className="font-semibold tabular-nums">{result.verifiedLevel}</span> and marked
                  verified
                </p>
                <p className="text-muted-foreground">
                  {result.earnedPoints} of {result.totalPoints} points
                </p>
                {result.usedFallback ? (
                  <p className="text-xs text-muted-foreground">
                    Open answers were graded by the offline engine because live AI was unavailable.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              {result.results.map((entry, index) => (
                <div
                  key={entry.questionId}
                  className={cn(
                    "rounded-lg border p-4",
                    entry.isCorrect ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {entry.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-medium">
                        {index + 1}. {entry.prompt}
                      </p>
                      {entry.kind === "MULTIPLE_CHOICE" && entry.correctOption !== null ? (
                        <p className="text-sm text-muted-foreground">
                          Expected answer: {entry.options[entry.correctOption]}
                        </p>
                      ) : null}
                      <p className="text-sm leading-relaxed text-muted-foreground">{entry.feedback}</p>
                      <Badge variant="muted" className="tabular-nums">
                        {entry.earnedPoints}/{entry.points} points
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setAssessment(null);
                setAnswers({});
              }}
            >
              <RotateCcw />
              Assess another skill
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {assessment && !result ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{assessment.assessment.title}</CardTitle>
                <CardDescription>
                  {assessment.assessment.skillName} · {assessment.assessment.difficulty.toLowerCase()}
                </CardDescription>
              </div>
              <Badge variant="muted" className="tabular-nums">
                {answeredCount}/{assessment.assessment.questions.length} answered
              </Badge>
            </div>
            <Progress
              value={(answeredCount / assessment.assessment.questions.length) * 100}
              className="mt-3 h-1.5"
            />
          </CardHeader>

          <CardContent className="space-y-6">
            {assessment.usedFallback ? (
              <Alert variant="warning">
                <ClipboardCheck />
                <AlertTitle>Offline question set</AlertTitle>
                <AlertDescription>
                  Live AI was unavailable, so these questions come from the offline engine and are
                  graded on how well your answer covers the expected points.
                </AlertDescription>
              </Alert>
            ) : null}

            {assessment.assessment.questions.map((question, index) => (
              <fieldset key={question.id} className="space-y-3">
                <legend className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </legend>

                {question.kind === "MULTIPLE_CHOICE" ? (
                  <RadioGroup
                    value={answers[question.id]?.option?.toString() ?? ""}
                    onValueChange={(value) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: { option: Number(value) },
                      }))
                    }
                  >
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                          answers[question.id]?.option === optionIndex
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted",
                        )}
                      >
                        <RadioGroupItem value={optionIndex.toString()} />
                        {option}
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-1.5">
                    <Textarea
                      value={answers[question.id]?.text ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: { text: event.target.value },
                        }))
                      }
                      placeholder="Write your answer. Specific examples score higher than general statements."
                      className="min-h-32"
                      aria-label={`Answer for question ${index + 1}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(answers[question.id]?.text ?? "").trim().split(/\s+/).filter(Boolean).length}{" "}
                      words · at least 10 characters required
                    </p>
                  </div>
                )}
              </fieldset>
            ))}

            <Button onClick={submit} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}
              {submitting ? "Grading answers" : "Submit assessment"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
