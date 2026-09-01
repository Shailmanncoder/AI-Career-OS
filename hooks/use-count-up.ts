"use client";

import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const cancel = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      frameRef.current = null;
      timeoutRef.current = null;
    };

    const settle = () => {
      cancel();
      setValue(target);
    };

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || durationMs <= 0 || typeof window === "undefined") {
      setValue(target);
      return;
    }

    if (document.visibilityState === "hidden") {
      setValue(target);
      return;
    }

    const from = valueRef.current;
    if (from === target) return;

    setValue(from);
    let started: number | null = null;

    const step = (timestamp: number) => {
      if (started === null) started = timestamp;
      const progress = Math.min(1, (timestamp - started) / durationMs);
      setValue(Math.round(from + (target - from) * EASE_OUT_EXPO(progress)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        cancel();
      }
    };

    frameRef.current = requestAnimationFrame(step);
    timeoutRef.current = setTimeout(settle, durationMs + 400);
    document.addEventListener("visibilitychange", settle);

    return () => {
      cancel();
      document.removeEventListener("visibilitychange", settle);
    };
  }, [target, durationMs]);

  return value;
}
