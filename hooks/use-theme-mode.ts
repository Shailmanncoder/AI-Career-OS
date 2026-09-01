"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DAYLIGHT_REFRESH_MS,
  THEME_STORAGE_KEY,
  isThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme/constants";
import {
  daylightFromClock,
  readCachedDaylight,
  resolveDaylight,
  themeFromReading,
  type DaylightReading,
} from "@/lib/theme/daylight";
import { applyThemeAnimated, type TransitionOrigin } from "@/lib/theme/apply";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [daylight, setDaylight] = useState<DaylightReading | null>(null);
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modeRef = useRef<ThemeMode>("system");

  const paint = useCallback((next: ResolvedTheme, origin: TransitionOrigin = null) => {
    applyThemeAnimated(next, origin);
    setResolved(next);
  }, []);

  useEffect(() => {
    const stored = readStoredMode();
    modeRef.current = stored;
    setMode(stored);
    setDaylight(readCachedDaylight());
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setMounted(true);
  }, []);

  const syncDaylight = useCallback(
    async (allowLocation: boolean, origin: TransitionOrigin = null) => {
      setChecking(true);
      const reading = await resolveDaylight(allowLocation);
      setDaylight(reading);
      setChecking(false);
      if (modeRef.current === "daylight") paint(themeFromReading(reading), origin);
      return reading;
    },
    [paint],
  );

  useEffect(() => {
    if (!mounted || mode !== "daylight") return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const reading = readCachedDaylight() ?? daylightFromClock();
      setDaylight(reading);
      if (modeRef.current === "daylight") paint(themeFromReading(reading));
    };

    const interval = window.setInterval(() => {
      void resolveDaylight(true).then((reading) => {
        if (cancelled) return;
        setDaylight(reading);
        if (modeRef.current === "daylight") paint(themeFromReading(reading));
      });
    }, DAYLIGHT_REFRESH_MS);

    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [mounted, mode, paint]);

  useEffect(() => {
    if (!mounted || mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paint(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mounted, mode, paint]);

  const selectMode = useCallback(
    async (next: ThemeMode, origin: TransitionOrigin = null) => {
      modeRef.current = next;
      setMode(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        void 0;
      }

      if (next === "light" || next === "dark") {
        paint(next, origin);
        return;
      }
      if (next === "system") {
        paint(systemTheme(), origin);
        return;
      }

      const cached = readCachedDaylight();
      if (cached) {
        setDaylight(cached);
        paint(themeFromReading(cached), origin);
        void resolveDaylight(true).then((reading) => {
          setDaylight(reading);
          if (modeRef.current === "daylight") paint(themeFromReading(reading));
        });
        return;
      }
      await syncDaylight(true, origin);
    },
    [paint, syncDaylight],
  );

  return { mode, resolved, daylight, checking, mounted, selectMode, refreshDaylight: syncDaylight };
}
