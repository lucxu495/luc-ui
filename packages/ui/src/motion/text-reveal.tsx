"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { depth, duration, easing } from "./tokens";

export type TextRevealMode = "blur" | "mask" | "word" | "char";

export interface TextRevealProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  /** The text to reveal. A plain string so it can be split deterministically. */
  text: string;
  mode?: TextRevealMode;
  /** Seconds to wait before the first element enters. */
  delay?: number;
  /** Seconds between units, for `word`/`char`. */
  step?: number;
  /** Wait until the element scrolls into view instead of animating on mount. */
  whenVisible?: boolean;
  /** Element used for the wrapper. */
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}

type RevealState = "idle" | "hidden" | "shown";

/**
 * LUC TextReveal — premium entrance for a *headline*, never for body copy.
 *
 * Four modes, one axis of difference: how much of the text arrives at once.
 * `blur` and `mask` treat the line as one object; `word` and `char` stagger it.
 *
 * Fail-safe by construction, exactly like `Reveal`: the text is rendered
 * **visible** in the markup and is only hidden once JavaScript has confirmed it
 * should animate. So SSR, no-JS rendering, print, PDF export, headless
 * screenshots and reduced motion all show the headline, and the transition runs
 * in CSS — which means the global reduced-motion clamp applies without a second
 * code path.
 */
export function TextReveal({
  className,
  text,
  mode = "blur",
  delay = 0,
  step = 0.035,
  whenVisible = false,
  as = "span",
  style,
  ...props
}: TextRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<RevealState>("idle");
  const Tag = as as React.ElementType;

  const show = useCallback(() => setState((current) => (current === "shown" ? current : "shown")), []);

  useLayoutEffect(() => {
    /*
     * Measuring the DOM and mirroring the result into state is what a layout
     * effect is for: the text must not paint visible and then jump. The write is
     * deliberate and guarded, and reduced motion never leaves `idle`.
     */
    if (reduced) return;
    if (whenVisible) {
      const element = ref.current;
      // No element (or no observer support): stay `idle`, i.e. visible.
      if (!element || typeof IntersectionObserver === "undefined") return;
      if (element.getBoundingClientRect().top < window.innerHeight) {
        // Already on screen: show it rather than holding the headline back.
        return;
      }
      setState("hidden");
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            show();
            observer.disconnect();
          }
        },
        { rootMargin: "-8% 0px -8% 0px" },
      );
      observer.observe(element);
      const fallback = window.setTimeout(show, 2500);
      return () => {
        observer.disconnect();
        window.clearTimeout(fallback);
      };
    }

    // `immediate` entrance: hide for one frame, then transition in. The write
    // happens in a layout effect so the visible frame is never painted.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate one-frame arm
    setState("hidden");
    const frame = window.requestAnimationFrame(show);
    return () => window.cancelAnimationFrame(frame);
  }, [reduced, show, whenVisible]);

  const hidden = !reduced && state === "hidden";
  const transitionDuration =
    state === "shown" ? `${Math.round(duration.deliberate * 1000)}ms` : hidden ? "0ms" : "0ms";
  const blur = mode === "blur" ? `blur(${depth.enterBlur}px)` : "blur(0px)";

  const unitStyle = (index: number, isSpace: boolean): React.CSSProperties => ({
    display: "inline-block",
    whiteSpace: "pre",
    opacity: hidden ? 0 : 1,
    transform:
      hidden && mode === "mask"
        ? "translateY(0.9em)"
        : hidden
          ? "translateY(0.36em)"
          : "none",
    filter: hidden ? blur : "blur(0px)",
    transitionProperty: "opacity, transform, filter",
    transitionDuration,
    transitionTimingFunction: `cubic-bezier(${easing.enter.join(", ")})`,
    transitionDelay:
      state === "shown" ? `${delay + index * (isSpace ? step * 0.4 : step)}s` : "0s",
  });

  if (mode === "word" || mode === "char") {
    const units = mode === "word" ? text.split(/(\s+)/) : Array.from(text);
    return (
      <Tag
        ref={ref}
        data-slot="text-reveal"
        data-mode={mode}
        data-reveal-state={state}
        className={cn("inline-block", className)}
        style={style}
        {...props}
      >
        {units.map((unit, index) => {
          if (unit === "") return null;
          const isSpace = /^\s+$/.test(unit);
          return (
            <span key={`${unit}-${index}`} style={unitStyle(index, isSpace)} aria-hidden={isSpace ? "true" : undefined}>
              {isSpace ? "\u00A0" : unit}
            </span>
          );
        })}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      data-slot="text-reveal"
      data-mode={mode}
      data-reveal-state={state}
      className={cn("inline-block", className)}
      {...props}
    >
      <span
        style={{
          display: "inline-block",
          overflow: mode === "mask" ? "hidden" : undefined,
          verticalAlign: mode === "mask" ? "bottom" : undefined,
          ...unitStyle(0, false),
          transitionDelay: state === "shown" ? `${delay}s` : "0s",
        }}
      >
        {text}
      </span>
    </Tag>
  );
}

export interface ScrambleTextProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  text: string;
  /** Length of the decode, in ms. */
  duration?: number;
  /** Characters used while scrambling. */
  charset?: string;
}

/**
 * LUC ScrambleText — a short decode flourish for a *status*, not a paragraph.
 *
 * Right for "ANALYZING", "SIGNAL ACTIVE", a command result. The real text is in
 * the DOM the whole time as the accessible name, and the final frame is exactly
 * `text`, so a screen reader and a screenshot both read the settled value.
 * Reduced motion prints it immediately.
 */
export function ScrambleText({
  className,
  text,
  duration: total = 700,
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—",
  ...props
}: ScrambleTextProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / total);
      const revealed = Math.floor(progress * text.length);
      setDisplay(
        Array.from(text, (char, index) =>
          index < revealed || char === " " ? char : (charset[Math.floor(Math.random() * charset.length)] ?? char),
        ).join(""),
      );
      if (progress < 1) frame = window.requestAnimationFrame(tick);
      else setDisplay(text);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [charset, reduced, text, total]);

  const shown = reduced ? text : display;

  return (
    <span data-slot="scramble-text" aria-label={text} className={cn("luc-numeric", className)} {...props}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
