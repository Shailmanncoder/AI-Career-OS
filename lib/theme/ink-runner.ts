import type { ResolvedTheme } from "./constants";

export type InkRunner = (theme: ResolvedTheme, origin: { x: number; y: number } | null) => void;

let runner: InkRunner | null = null;

export function registerInkRunner(next: InkRunner | null) {
  runner = next;
}

export function getInkRunner() {
  return runner;
}
