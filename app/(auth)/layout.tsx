import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 grid-backdrop" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 glow-surface" aria-hidden="true" />

      <header className="relative border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main id="main" className="relative flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
