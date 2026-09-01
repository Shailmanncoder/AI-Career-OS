import type { ResolvedTheme } from "./constants";
import { getInkRunner } from "./ink-runner";

export type TransitionOrigin = { x: number; y: number } | null;

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};

type DocumentWithTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

function restartInkAnimations() {
  const nodes = document.querySelectorAll<SVGAnimateElement>("svg .ink-anim");
  nodes.forEach((node) => {
    try {
      node.beginElement();
    } catch {
      return;
    }
  });
}

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

export function applyThemeAnimated(theme: ResolvedTheme, origin: TransitionOrigin = null) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const current = root.classList.contains("dark") ? "dark" : "light";
  if (current === theme) {
    paintTheme(theme);
    return;
  }

  if (prefersReducedMotion()) {
    paintTheme(theme);
    return;
  }

  const ink = getInkRunner();
  if (ink) {
    ink(theme, origin);
    return;
  }

  root.classList.add("theme-fade");
  paintTheme(theme);
  window.setTimeout(() => root.classList.remove("theme-fade"), 420);
}
