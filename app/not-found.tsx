import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Compass className="h-5 w-5" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">This page does not exist</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The link you followed may be broken, or the page may have been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </main>
  );
}
