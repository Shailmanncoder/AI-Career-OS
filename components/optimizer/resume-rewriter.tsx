"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy, Download, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScoreRing } from "@/components/shared/score-ring";
import { ErrorPanel } from "@/components/shared/error-panel";
import { postJson } from "@/lib/api/client";

type Score = {
  overallScore: number;
  atsScore: number;
  keywordCoverage: number;
  quantifiedCount: number;
  bulletCount: number;
  wordCount: number;
};

type RewriteResponse = {
  roleTitle: string;
  improvedText: string;
  before: Score;
  after: Score;
  projected: Score;
  placeholders: string[];
  guidance: string[];
  keywordsAdded: string[];
  changeNotes: string[];
};

export function ResumeRewriter({ careerRoleId }: { careerRoleId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!careerRoleId) {
      setError("Select a target role first.");
      return;
    }
    setPending(true);
    setError(null);

    const response = await postJson<RewriteResponse>("/api/resume/improve", { careerRoleId });
    setPending(false);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    setResult(response.data);
    toast.success(`Improved resume generated — ATS readiness ${response.data.after.atsScore}`);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.improvedText);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Your browser blocked clipboard access. Select the text and copy manually.");
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.improvedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "improved-resume.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const delta = result ? result.after.atsScore - result.before.atsScore : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Generate an improved resume
        </CardTitle>
        <CardDescription>
          Rewrites your resume end to end for the target role, then scores the result with the same
          ATS readiness engine. Every employer, title, date and technology is carried over from your
          existing resume; nothing is invented.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error ? <ErrorPanel message={error} onRetry={generate} /> : null}

        <Button onClick={generate} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {pending ? "Rewriting your resume" : "Generate improved resume"}
        </Button>

        {result ? (
          <>
            <div className="grid gap-4 rounded-lg border p-5 sm:grid-cols-[auto_auto_1fr]">
              <div className="flex flex-col items-center gap-1">
                <ScoreRing value={result.before.atsScore} size={92} label="Before" tone="warning" />
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant={delta > 0 ? "success" : "muted"} className="tabular-nums">
                  {delta > 0 ? "+" : ""}
                  {delta}
                </Badge>
              </div>
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <ScoreRing
                  value={result.after.atsScore}
                  size={92}
                  label="After"
                  tone={result.after.atsScore >= 80 ? "success" : "primary"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.after.bulletCount} bullets · {result.after.quantifiedCount} measurable
                  results · {result.after.keywordCoverage}% keyword coverage
                </p>
              </div>
            </div>

            {result.placeholders.length > 0 ? (
              <Alert variant="warning">
                <TriangleAlert />
                <AlertTitle>
                  {result.placeholders.length} number{result.placeholders.length === 1 ? "" : "s"} still
                  needed from you
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Your resume described these outcomes without a figure. They are left as
                    placeholders because inventing them would be dishonest, and a reviewer can
                    usually tell.
                  </p>
                  <p className="font-medium text-foreground">
                    Filling all of them takes ATS readiness from {result.after.atsScore} to{" "}
                    {result.projected.atsScore}.
                  </p>
                  <ul className="space-y-1">
                    {result.placeholders.slice(0, 6).map((item, index) => (
                      <li key={index} className="font-mono text-xs">
                        {item}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {result.guidance.length > 0 ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  To score higher
                </p>
                <ul className="space-y-1.5">
                  {result.guidance.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.changeNotes.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What changed
                </p>
                <ul className="space-y-1.5">
                  {result.changeNotes.map((note) => (
                    <li key={note} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Improved resume</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? <Check /> : <Copy />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={download}>
                    <Download />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed scrollbar-thin">
                {result.improvedText}
              </pre>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
