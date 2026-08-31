"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

type MatchResponse = {
  matches: Array<{ careerRoleId: string; title: string; score: number; rank: number }>;
  gapCount: number;
};

export function RecalculateMatchesButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await postJson<MatchResponse>("/api/career/match", {});
        setPending(false);

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        const top = result.data.matches[0];
        toast.success(
          top
            ? `Top match: ${top.title} at ${top.score}%`
            : "Matches recalculated",
        );
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {pending ? "Recalculating" : "Recalculate matches"}
    </Button>
  );
}
