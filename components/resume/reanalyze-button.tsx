"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

type AnalyzeResponse = { skillCount: number; overallScore: number; usedFallback: boolean };

export function ReanalyzeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await postJson<AnalyzeResponse>("/api/resume/analyze", { resumeId });
        setPending(false);

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(
          result.data.usedFallback
            ? "Re-analyzed with the offline engine"
            : `Re-analyzed: ${result.data.skillCount} skills extracted`,
        );
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {pending ? "Re-analyzing" : "Re-analyze"}
    </Button>
  );
}
