"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

export function ExplainMatchButton({ careerRoleId }: { careerRoleId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await postJson("/api/career/explain", { careerRoleId });
        setPending(false);

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success("Explanation generated");
        router.refresh();
      }}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {pending ? "Generating" : "Explain this match"}
    </Button>
  );
}
