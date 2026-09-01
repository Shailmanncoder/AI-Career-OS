import type { ResolvedTheme } from "./constants";

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

  const doc = document as DocumentWithTransition;

  if (prefersReducedMotion() || typeof doc.startViewTransition !== "function") {
    root.classList.add("theme-fade");
    paintTheme(theme);
    window.setTimeout(() => root.classList.remove("theme-fade"), 420);
    return;
  }

  const x = origin?.x ?? window.innerWidth - 56;
  const y = origin?.y ?? 40;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.style.setProperty("--theme-origin-x", `${x}px`);
  root.style.setProperty("--theme-origin-y", `${y}px`);
  root.style.setProperty("--theme-radius", `${radius}px`);
  root.dataset.themeTransition = "active";
  restartInkAnimations();

  const transition = doc.startViewTransition(() => paintTheme(theme));

  transition.ready.catch(() => undefined);
  transition.updateCallbackDone.catch(() => undefined);

  transition.finished
    .catch(() => undefined)
    .finally(() => {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--theme-origin-x");
      root.style.removeProperty("--theme-origin-y");
      root.style.removeProperty("--theme-radius");
    });
}
