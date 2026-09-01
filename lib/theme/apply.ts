import type { ResolvedTheme } from "./constants";
import { createTransitionQueue } from "./transition-queue";
import {
  blobCenter,
  blobRadiusAt,
  clampOrigin,
  createInkPlan,
  INK_DURATION_MS,
  mainRadiusAt,
  type InkPlan,
} from "./ink";

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

function fadeSwap(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.add("theme-fade");
  paintTheme(theme);
  window.setTimeout(() => root.classList.remove("theme-fade"), 620);
}

function paintMaskFrame(plan: InkPlan, progress: number) {
  const main = document.getElementById("inkMain");
  const blobs = document.querySelectorAll<SVGCircleElement>(".ink-blob");
  const displace = document.getElementById("inkDisplace");

  if (displace) {
    const ramp = Math.min(1, progress / 0.65);
    displace.setAttribute("scale", String(70 + ramp * 250));
  }

  if (main) {
    main.setAttribute("cx", String(plan.origin.x));
    main.setAttribute("cy", String(plan.origin.y));
    main.setAttribute("r", String(mainRadiusAt(progress, plan.radius)));
  }

  plan.blobs.forEach((blob, index) => {
    const node = blobs[index];
    if (!node) return;
    const center = blobCenter(progress, plan, blob);
    node.setAttribute("cx", String(center.x));
    node.setAttribute("cy", String(center.y));
    node.setAttribute("r", String(blobRadiusAt(progress, plan, blob)));
  });
}

function resetMask() {
  const main = document.getElementById("inkMain");
  if (main) main.setAttribute("r", "0");
  document.querySelectorAll<SVGCircleElement>(".ink-blob").forEach((node) => {
    node.setAttribute("r", "0");
  });
}

const queue = createTransitionQueue<{ theme: ResolvedTheme; origin: TransitionOrigin }>();

function releaseTransition() {
  const queued = queue.release();
  if (queued) applyThemeAnimated(queued.theme, queued.origin);
}

export function applyThemeAnimated(theme: ResolvedTheme, origin: TransitionOrigin = null) {
  if (typeof document === "undefined") return;

  if (queue.isRunning()) {
    queue.begin({ theme, origin });
    return;
  }

  const root = document.documentElement;
  const current = root.classList.contains("dark") ? "dark" : "light";
  if (current === theme) {
    paintTheme(theme);
    return;
  }

  const doc = document as DocumentWithTransition;

  if (
    prefersReducedMotion() ||
    typeof doc.startViewTransition !== "function" ||
    !document.getElementById("inkMask")
  ) {
    fadeSwap(theme);
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const clamped = clampOrigin(origin, width, height);
  const plan = createInkPlan({ x: clamped.x, y: 0 }, width, height);

  paintMaskFrame(plan, 0);
  root.dataset.themeTransition = "active";
  queue.begin({ theme, origin });

  const transition = doc.startViewTransition(() => paintTheme(theme));
  transition.ready.catch(() => undefined);
  transition.updateCallbackDone.catch(() => undefined);

  let frame = 0;
  const began = performance.now();

  const step = (now: number) => {
    const progress = Math.min(1, (now - began) / INK_DURATION_MS);
    paintMaskFrame(plan, progress);
    if (progress < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    cancelAnimationFrame(frame);
  };

  transition.ready
    .then(() => {
      frame = requestAnimationFrame(step);
    })
    .catch(() => {
      paintMaskFrame(plan, 1);
    });

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    cancelAnimationFrame(frame);
    delete root.dataset.themeTransition;
    resetMask();
    releaseTransition();
  };

  transition.finished.catch(() => undefined).finally(settle);
  window.setTimeout(settle, INK_DURATION_MS + 600);
}
