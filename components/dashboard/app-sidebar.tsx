"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { NAV_GROUPS, NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6" aria-label="Application">
      {NAV_GROUPS.map((group) => (
        <div key={group} className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group}
          </p>
          {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r lg:block">
      <div className="sticky top-0 flex h-screen flex-col gap-6 overflow-y-auto px-3 py-5 scrollbar-thin">
        <div className="px-2">
          <Logo href="/dashboard" />
        </div>
        <NavLinks />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Close navigation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-fade-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-background shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <Logo href="/dashboard" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      {mounted && open ? createPortal(drawer, document.body) : null}
    </div>
  );
}
