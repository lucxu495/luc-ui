"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export interface RevealProps extends React.ComponentPropsWithRef<"div"> {
  /** Seconds to wait before entering. */
  delay?: number;
  /** Travel distance in px. Keep it small — 6–10 reads as refined. */
  distance?: number;
  /** Animate every time it scrolls into view instead of once. */
  repeat?: boolean;
  /** Start immediately on mount instead of waiting for the viewport. */
  immediate?: boolean;
}

/**
 * LUC Reveal — content entering with intent.
 *
 * A short fade plus a few px of travel, once, on first view.
 *
 * Fail-safe by design: the element renders **visible** and is only hidden once
 * JavaScript confirms it starts below the fold. So print, PDF export, no-JS
 * rendering, reduced motion, and headless screenshots all show the content.
 * The transition itself is CSS, which means the reduced-motion clamp in
 * `base.css` applies without a second code path.
 */
export function Reveal({
  className,
  children,
  delay = 0,
  distance = 8,
  repeat = false,
  immediate = false,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  const show = useCallback(() => setState((current) => (current === "shown" ? current : "shown")), []);

  useLayoutEffect(() => {
    /*
     * Measuring the DOM and mirroring the result into state is exactly what a
     * layout effect is for: the element must not paint visible and then jump.
     * The alternative (writing inline styles imperatively) would fight React
     * on the next render, so the state write is deliberate.
     */
    if (reducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a DOM measurement
      setState("idle");
      return;
    }
    if (immediate) {
      setState("hidden");
      const frame = window.requestAnimationFrame(show);
      return () => window.cancelAnimationFrame(frame);
    }
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setState("idle");
      return;
    }
    // Already on screen at mount: show it without animating, so nothing that is
    // meant to be read immediately is ever held back.
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setState("idle");
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show();
          if (!repeat) observer.disconnect();
        }
      },
      { rootMargin: "-8% 0px -8% 0px" },
    );
    observer.observe(element);
    // Safety net: never leave content invisible because an observer misbehaved.
    const fallback = window.setTimeout(show, 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [immediate, repeat, reducedMotion, show]);

  const isHidden = state === "hidden";

  return (
    <div
      ref={ref}
      data-slot="reveal"
      data-reveal-state={state}
      className={cn("motion-safe:transition-[opacity,transform]", className)}
      style={{
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? `translateY(${distance}px)` : "none",
        transitionDuration: isHidden || state === "shown" ? "420ms" : "0ms",
        transitionDelay: isHidden ? "0ms" : `${delay}s`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
