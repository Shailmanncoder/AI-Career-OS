"use client";

import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startedRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || durationMs <= 0) {
      setValue(target);
      return;
    }

    fromRef.current = value;
    startedRef.current = null;

    const step = (timestamp: number) => {
      if (startedRef.current === null) startedRef.current = timestamp;
      const elapsed = timestamp - startedRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = EASE_OUT_EXPO(progress);
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}
