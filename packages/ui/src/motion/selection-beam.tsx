"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

function readBox(node: Element | null): Box | null {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

export interface SelectionBeamProps {
  /** The element the selection starts from — a table row, a list item, a chip. */
  from: React.RefObject<Element | null>;
  /** The element the selection lands on — a chart marker, a detail panel. */
  to: React.RefObject<Element | null>;
  /** Whether the link is live. Inactive keeps the rail and drops the packet. */
  active?: boolean;
  /** `accent` for the live link, `muted` for a structural hint. */
  tone?: "accent" | "muted";
  /** Base stroke width, in px. */
  width?: number;
  /** Seconds for the packet to cross the full path. */
  speed?: number;
  /** How far the curve bulges sideways, as a fraction of the run. */
  bow?: number;
  /**
   * Change this whenever the anchored elements move for a reason the observer
   * cannot see. Selecting a different row is the canonical case: the refs stay
   * the same objects, the two boxes are the same size, and only the caller knows
   * that the anchor moved.
   */
  revision?: unknown;
  /** Accessible name. Omit it and the beam is decorative to a screen reader. */
  label?: string;
  className?: string;
}

/**
 * LUC `SelectionBeam` — the line that connects two things that are actually
 * connected.
 *
 * Table selection → chart marker → inspector is the interaction LUC UI is best
 * at, and the missing piece was always the *visible* link: the user selects a
 * row, a marker highlights, a panel fills in, and nothing says those three are
 * one gesture. `SelectionBeam` measures the two live DOM nodes and draws a
 * travelling packet between them, so the connection is legible without the
 * product hard-coding an arrow.
 *
 * It is deliberately provider-agnostic: it takes two refs and knows nothing
 * about tables or charts. Any pair of elements can be linked — a metric card and
 * its breakdown, a step and the state it produced, an image thumbnail and the
 * canvas that owns it.
 *
 * Performance and safety:
 *
 *  - The overlay is `position: fixed`, so it needs no positioned ancestor and
 *    cannot be clipped by one; it simply follows the viewport.
 *  - Measurement is rAF-coalesced and driven by `ResizeObserver` plus a passive
 *    capture-phase scroll listener, so a beam attached inside a scrolling pane
 *    stays attached.
 *  - It renders nothing until the first measurement, so SSR output is empty and
 *    there is no hydration mismatch.
 *  - Both geometry and the travelling packet are disabled under reduced motion;
 *    the rail remains, because the *relationship* is information.
 */
export function SelectionBeam({
  from,
  to,
  active = true,
  tone = "accent",
  width = 1.5,
  speed = 3.6,
  bow = 0.32,
  revision,
  label,
  className,
}: SelectionBeamProps) {
  const profile = useMotionProfile();
  const [boxes, setBoxes] = useState<{ from: Box; to: Box } | null>(null);
  const frame = useRef<number | null>(null);

  const measure = useCallback(() => {
    frame.current = null;
    const nextFrom = readBox(from.current);
    const nextTo = readBox(to.current);
    if (!nextFrom || !nextTo) {
      setBoxes((previous) => (previous === null ? previous : null));
      return;
    }
    setBoxes((previous) =>
      previous && sameBox(previous.from, nextFrom) && sameBox(previous.to, nextTo)
        ? previous
        : { from: nextFrom, to: nextTo },
    );
  }, [from, to]);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => schedule());
    if (observer) {
      if (from.current) observer.observe(from.current);
      if (to.current) observer.observe(to.current);
    }
    return () => {
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
      observer?.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
    // `revision` is intentionally part of the dependency list: it is the only
    // signal that an anchor changed identity rather than size.
  }, [from, revision, schedule, to]);

  if (!boxes) return null;

  const { from: a, to: b } = boxes;
  const forwards = b.left + b.width / 2 >= a.left + a.width / 2;
  const start = { x: forwards ? a.right : a.left, y: a.top + a.height / 2 };
  const end = { x: forwards ? b.left : b.right, y: b.top + b.height / 2 };
  const run = end.x - start.x;
  const control = { x: start.x + run * (0.5 + bow * 0.5), y: start.y };
  const control2 = { x: end.x - run * (0.5 + bow * 0.5), y: end.y };
  const path = `M ${start.x} ${start.y} C ${control.x} ${control.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;

  const stroke = tone === "accent" ? "var(--accent-default)" : "var(--line-strong)";
  const travelling = active && profile.ambient;

  return (
    <div
      data-slot="selection-beam"
      data-active={active ? "true" : "false"}
      className={cn("pointer-events-none fixed inset-0 z-[var(--z-raised)]", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <svg width="100%" height="100%" className="size-full overflow-visible">
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={active ? undefined : "2 4"}
          opacity={active ? 0.42 : 0.3}
        />
        {travelling ? (
          <>
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={width + 1.4}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="8 92"
              className="luc-beam-dash"
              style={{ animationDuration: `${speed}s` }}
            />
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={width + 4}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="3 97"
              className="luc-beam-dash"
              opacity={0.15}
              style={{ animationDuration: `${speed * 1.5}s` }}
            />
          </>
        ) : null}
        {[start, end].map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={travelling ? 3 : 2.2}
            fill={stroke}
            opacity={active ? 0.9 : 0.5}
          />
        ))}
      </svg>
    </div>
  );
}
