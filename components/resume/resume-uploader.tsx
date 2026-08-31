"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CloudUpload,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { postJson } from "@/lib/api/client";
import { formatBytes, cn } from "@/lib/utils";
import { MAX_RESUME_BYTES } from "@/lib/validation/forms";

type Stage = "idle" | "uploading" | "analyzing" | "done" | "error";

type UploadResponse = { resume: { id: string; fileName: string; charCount: number } };

type AnalyzeResponse = {
  resumeId: string;
  usedFallback: boolean;
  aiErrorCode?: string;
  skillCount: number;
  overallScore: number;
  atsScore: number;
};

const STAGE_PROGRESS: Record<Stage, number> = {
  idle: 0,
  uploading: 35,
  analyzing: 75,
  done: 100,
  error: 100,
};

export function ResumeUploader({ hasExistingResume }: { hasExistingResume: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const process = useCallback(
    async (file: File) => {
      setLastFile(file);
      setFileName(file.name);
      setError(null);
      setResult(null);

      if (file.size > MAX_RESUME_BYTES) {
        setStage("error");
        setError(`That file is ${formatBytes(file.size)}. The limit is 5 MB.`);
        return;
      }

      const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
      const isDocx =
        file.name.toLowerCase().endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPdf && !isDocx) {
        setStage("error");
        setError("Only PDF and DOCX resumes are supported.");
        return;
      }

      setStage("uploading");

      const formData = new FormData();
      formData.append("file", file);

      let uploadPayload: { ok: boolean; data?: UploadResponse; error?: { message: string } } | null = null;

      try {
        const response = await fetch("/api/resume/upload", { method: "POST", body: formData });
        uploadPayload = await response.json().catch(() => null);
        if (!response.ok || !uploadPayload?.ok) {
          setStage("error");
          setError(uploadPayload?.error?.message ?? "The upload failed. Please try again.");
          return;
        }
      } catch {
        setStage("error");
        setError("Could not reach the server. Check your connection and retry.");
        return;
      }

      setStage("analyzing");

      const analyzed = await postJson<AnalyzeResponse>("/api/resume/analyze", {
        resumeId: uploadPayload.data?.resume.id,
      });

      if (!analyzed.ok) {
        setStage("error");
        setError(analyzed.message);
        return;
      }

      setResult(analyzed.data);
      setStage("done");
      toast.success(`Analysis complete: ${analyzed.data.skillCount} skills extracted`);
      router.refresh();
    },
    [router],
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void process(file);
  };

  const busy = stage === "uploading" || stage === "analyzing";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasExistingResume ? "Replace your resume" : "Upload your resume"}</CardTitle>
        <CardDescription>
          PDF or DOCX, up to 5 MB. Text is extracted on the server; the original file is not stored.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12",
            dragActive ? "border-primary bg-primary/5" : "border-border",
            busy && "opacity-70",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            id="resume-file"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void process(file);
              event.target.value = "";
            }}
          />

          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudUpload className="h-5 w-5" />}
          </span>

          <p className="text-sm font-medium">
            {busy ? "Working on it…" : "Drag and drop your resume here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {busy ? "This usually takes 10 to 30 seconds." : "or choose a file from your computer"}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            Choose file
          </Button>
        </div>

        {stage !== "idle" ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{fileName}</span>
              </span>
              <Badge
                variant={
                  stage === "done" ? "success" : stage === "error" ? "destructive" : "muted"
                }
              >
                {stage === "uploading"
                  ? "Extracting text"
                  : stage === "analyzing"
                    ? "Analyzing with AI"
                    : stage === "done"
                      ? "Complete"
                      : "Failed"}
              </Badge>
            </div>
            <Progress
              value={STAGE_PROGRESS[stage]}
              indicatorClassName={stage === "error" ? "bg-destructive" : undefined}
            />
          </div>
        ) : null}

        {stage === "error" && error ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{error}</p>
              <div className="flex flex-wrap gap-2">
                {lastFile ? (
                  <Button size="sm" variant="outline" onClick={() => void process(lastFile)}>
                    <RotateCcw />
                    Retry
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
                  Choose a different file
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {stage === "done" && result ? (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Analysis complete</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {result.skillCount} skills extracted. Resume score {result.overallScore}, ATS readiness{" "}
                {result.atsScore}.
                {result.usedFallback
                  ? " Live AI was unavailable, so the deterministic offline parser produced this analysis."
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push("/careers")}>
                  <Sparkles />
                  See career matches
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push("/skills")}>
                  Review skills
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
