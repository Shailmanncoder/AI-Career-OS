"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  BLOB_COUNT,
  DROPLET_COUNT,
  INK_DURATION_MS,
  INK_REVEAL_MS,
  INK_THEME_SWAP_AT,
  blobCenter,
  blobRadiusAt,
  clampOrigin,
  createInkPlan,
  dropletStateAt,
  mainRadiusAt,
  type InkOrigin,
  type InkPlan,
} from "@/lib/theme/ink";
import { paintTheme } from "@/lib/theme/apply";
import { registerInkRunner } from "@/lib/theme/ink-runner";
import type { ResolvedTheme } from "@/lib/theme/constants";

type Phase = "idle" | "expanding" | "covered" | "revealing";

function easedScale(progress: number) {
  return Math.min(1, progress / 0.7);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function backgroundForTheme(theme: ResolvedTheme) {
  const probe = document.createElement("div");
  probe.className = theme === "dark" ? "dark" : "";
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;";
  probe.setAttribute("data-theme", theme);
  document.body.appendChild(probe);

  const inner = document.createElement("div");
  inner.style.cssText = "background-color: hsl(var(--background));";
  probe.appendChild(inner);

  const color = getComputedStyle(inner).backgroundColor;
  probe.remove();
  return color || (theme === "dark" ? "#0b0e18" : "#ffffff");
}

export function InkThemeTransition() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mainRef = useRef<SVGCircleElement | null>(null);
  const blobRefs = useRef<Array<SVGCircleElement | null>>([]);
  const dropletRefs = useRef<Array<SVGCircleElement | null>>([]);
  const groupRef = useRef<SVGGElement | null>(null);
  const displaceRef = useRef<SVGFEDisplacementMapElement | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ theme: ResolvedTheme; origin: InkOrigin | null } | null>(null);

  const reset = useCallback(() => {
    const svg = svgRef.current;
    if (svg) svg.style.opacity = "0";
    phaseRef.current = "idle";
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const run = useCallback(
    (theme: ResolvedTheme, origin: InkOrigin | null) => {
      const svg = svgRef.current;
      const main = mainRef.current;
      const group = groupRef.current;

      const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
      if (current === theme) {
        paintTheme(theme);
        return;
      }

      if (!svg || !main || !group || prefersReducedMotion()) {
        paintTheme(theme);
        return;
      }

      if (phaseRef.current !== "idle") {
        pendingRef.current = { theme, origin };
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const start = clampOrigin(origin, width, height);
      const plan: InkPlan = createInkPlan(start, width, height);

      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      group.setAttribute("fill", backgroundForTheme(theme));
      svg.style.opacity = "1";
      phaseRef.current = "expanding";

      let swapped = false;
      const began = performance.now();

      const step = (now: number) => {
        const elapsed = now - began;
        const progress = Math.min(1, elapsed / INK_DURATION_MS);

        const displace = displaceRef.current;
        if (displace) {
          displace.setAttribute("scale", String(56 + easedScale(progress) * 258));
        }

        main.setAttribute("cx", String(plan.origin.x));
        main.setAttribute("cy", String(plan.origin.y));
        main.setAttribute("r", String(mainRadiusAt(progress, plan.radius)));

        plan.blobs.forEach((blob, index) => {
          const node = blobRefs.current[index];
          if (!node) return;
          const center = blobCenter(progress, plan, blob);
          node.setAttribute("cx", String(center.x));
          node.setAttribute("cy", String(center.y));
          node.setAttribute("r", String(blobRadiusAt(progress, plan, blob)));
        });

        plan.droplets.forEach((droplet, index) => {
          const node = dropletRefs.current[index];
          if (!node) return;
          const state = dropletStateAt(elapsed, plan, droplet);
          node.setAttribute("cx", String(state.x));
          node.setAttribute("cy", String(state.y));
          node.setAttribute("r", String(state.radius));
          node.setAttribute("opacity", String(state.opacity));
        });

        if (!swapped && progress >= INK_THEME_SWAP_AT) {
          swapped = true;
          paintTheme(theme);
        }

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        if (!swapped) paintTheme(theme);
        phaseRef.current = "covered";

        svg.style.transition = `opacity ${INK_REVEAL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        phaseRef.current = "revealing";
        requestAnimationFrame(() => {
          svg.style.opacity = "0";
        });

        window.setTimeout(() => {
          svg.style.transition = "";
          reset();
          const queued = pendingRef.current;
          pendingRef.current = null;
          if (queued) run(queued.theme, queued.origin);
        }, INK_REVEAL_MS + 20);
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [reset],
  );

  useEffect(() => {
    registerInkRunner(run);
    return () => {
      registerInkRunner(null);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [run]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      className="pointer-events-none fixed inset-0 z-[99999] h-screen w-screen opacity-0"
    >
      <defs>
        <filter
          id="inkDistortion"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" seed="7" result="large" />
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="3" seed="19" result="medium" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="41" result="fine" />
          <feComposite
            in="large"
            in2="medium"
            operator="arithmetic"
            k1="0"
            k2="0.62"
            k3="0.30"
            k4="0"
            result="coarse"
          />
          <feComposite
            in="coarse"
            in2="fine"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.14"
            k4="0"
            result="combined"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="combined"
            scale="60"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
            ref={displaceRef}
          />
          <feGaussianBlur in="rough" stdDeviation="2.2" result="bleed" />
          <feColorMatrix
            in="bleed"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 22 -8"
          />
        </filter>
      </defs>

      <g ref={groupRef} filter="url(#inkDistortion)">
        <circle ref={mainRef} cx="0" cy="0" r="0" />
        {Array.from({ length: BLOB_COUNT }, (_, index) => (
          <circle
            key={`blob-${index}`}
            ref={(node) => {
              blobRefs.current[index] = node;
            }}
            cx="0"
            cy="0"
            r="0"
          />
        ))}
        {Array.from({ length: DROPLET_COUNT }, (_, index) => (
          <circle
            key={`droplet-${index}`}
            ref={(node) => {
              dropletRefs.current[index] = node;
            }}
            cx="0"
            cy="0"
            r="0"
            opacity="0"
          />
        ))}
      </g>
    </svg>
  );
}
