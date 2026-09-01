"use client";

import { Loader2, Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeMode } from "@/hooks/use-theme-mode";
import type { ThemeMode } from "@/lib/theme/constants";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof Sun; hint: string }> = [
  { value: "light", label: "Light", icon: Sun, hint: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Always dark" },
  { value: "daylight", label: "Day / night", icon: SunMoon, hint: "Follows the sun where you are" },
  { value: "system", label: "System", icon: Monitor, hint: "Follows your device" },
];

const SOURCE_LABEL: Record<string, string> = {
  "weather-api": "from your location",
  "local-clock": "from your device clock",
  cache: "recently checked",
};

export function ThemeToggle() {
  const { mode, resolved, daylight, checking, mounted, selectMode } = useThemeMode();

  const active = OPTIONS.find((option) => option.value === mode) ?? OPTIONS[3];
  const Icon = mode === "daylight" ? (resolved === "dark" ? Moon : Sun) : active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${active.label}. Change theme`}
          className="relative"
        >
          {!mounted ? (
            <Monitor className="h-4 w-4" />
          ) : checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {mounted && mode === "daylight" ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Appearance
        </DropdownMenuLabel>

        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
              void selectMode(option.value, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            }}
            className={cn(
              "flex-col items-start gap-0.5 py-2",
              mode === option.value && "bg-accent text-accent-foreground",
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <option.icon className="h-4 w-4" />
              {option.label}
            </span>
            <span className="pl-6 text-[11px] text-muted-foreground">{option.hint}</span>
          </DropdownMenuItem>
        ))}

        {mounted && mode === "daylight" && daylight ? (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
              It is currently {daylight.isDay ? "daytime" : "night"}{" "}
              {SOURCE_LABEL[daylight.source] ?? ""}. Rechecked every 15 minutes.
            </p>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
