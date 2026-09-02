"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

type Hit = { label: string; href: string; hint: string };

const EXTRA: Hit[] = [
  { label: "Upload a resume", href: "/resume", hint: "Resume" },
  { label: "Recalculate career matches", href: "/careers", hint: "Career Matches" },
  { label: "Run a what-if simulation", href: "/simulator", hint: "Simulator" },
  { label: "Generate a roadmap", href: "/roadmap", hint: "Roadmap" },
  { label: "Take a skill assessment", href: "/assessments", hint: "Assessments" },
  { label: "Practice an interview", href: "/interview", hint: "Interview Coach" },
  { label: "Check ATS readiness", href: "/optimizer", hint: "Resume Optimizer" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalogue = useMemo<Hit[]>(
    () => [
      ...NAV_ITEMS.map((item) => ({ label: item.label, href: item.href, hint: item.group })),
      ...EXTRA,
    ],
    [],
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return catalogue
      .filter((hit) => `${hit.label} ${hit.hint}`.toLowerCase().includes(term))
      .slice(0, 6);
  }, [query, catalogue]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (hit: Hit) => {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  };

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-md md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (results.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % results.length);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index - 1 + results.length) % results.length);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            go(results[active]);
          }
        }}
        placeholder="Search careers, skills, resources…"
        aria-label="Search"
        className="h-10 w-full rounded-lg border bg-muted/40 pl-9 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:block">
        ⌘K
      </kbd>

      {open && results.length > 0 ? (
        <ul className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
          {results.map((hit, index) => (
            <li key={hit.href + hit.label}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => go(hit)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm",
                  index === active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                )}
              >
                <span className="truncate">{hit.label}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{hit.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
