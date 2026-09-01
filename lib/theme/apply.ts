import type { ResolvedTheme } from "./constants";
import { coverageRadius, INK_DURATION_MS } from "./ink";

export type TransitionOrigin = { x: number; y: number } | null;

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};

type DocumentWithTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

export function paintTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.dataset.theme = theme;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function restartInkAnimations() {
  document.querySelectorAll<SVGAnimateElement>("svg .ink-anim").forEach((node) => {
    try {
      node.beginElement();
    } catch {
      return;
    }
  });
}

function fadeSwap(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.add("theme-fade");
  paintTheme(theme);
  window.setTimeout(() => root.classList.remove("theme-fade"), 620);
}

export function applyThemeAnimated(theme: ResolvedTheme, origin: TransitionOrigin = null) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const current = root.classList.contains("dark") ? "dark" : "light";
  if (current === theme) {
    paintTheme(theme);
    return;
  }

  const doc = document as DocumentWithTransition;

  if (prefersReducedMotion() || typeof doc.startViewTransition !== "function") {
    fadeSwap(theme);
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = origin?.x ?? width / 2;
  const y = 0;
  const radius = coverageRadius({ x, y }, width, height);

  root.style.setProperty("--ink-x", `${x}px`);
  root.style.setProperty("--ink-y", `${y}px`);
  root.style.setProperty("--ink-r", `${radius}px`);
  root.dataset.themeTransition = "active";
  restartInkAnimations();

  const transition = doc.startViewTransition(() => paintTheme(theme));

  transition.ready.catch(() => undefined);
  transition.updateCallbackDone.catch(() => undefined);

  transition.finished
    .catch(() => undefined)
    .finally(() => {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--ink-x");
      root.style.removeProperty("--ink-y");
      root.style.removeProperty("--ink-r");
    });

  window.setTimeout(() => {
    delete root.dataset.themeTransition;
  }, INK_DURATION_MS + 400);
}
