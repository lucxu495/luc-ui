"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionProfile } from "../motion/intensity";

export interface UsePointerGlowOptions {
  /** Turn the tracker off for static surfaces (print, export, `none` intensity). */
  disabled?: boolean;
  /** Peak opacity written to `--luc-glow-opacity`. */
  opacity?: number;
}

export interface PointerGlowApi {
  ref: React.RefObject<HTMLElement | null>;
  handlers: {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  };
  /** Whether the tracker is actually live (never true under reduced motion). */
  enabled: boolean;
}

/**
 * LUC `usePointerGlow` — the shared cursor tracker behind `luc-cursor-light`.
 *
 * A filled control should light where the finger is, not uniformly. This hook
 * converts the pointer position into two percentages plus an opacity, and
 * writes them onto the element as custom properties.
 *
 * It exists as a hook rather than a component so any surface can adopt the
 * behaviour without buying another wrapper `<div>`: the Button family, a Card,
 * a toolbar, a chart frame. It is rAF-throttled, it never re-renders, it
 * detaches its rAF on unmount, and it is inert on coarse pointers and under
 * reduced motion — where it still returns the same API, so a call site never
 * branches on the environment.
 */
export function usePointerGlow({
  disabled = false,
  opacity = 0.5,
}: UsePointerGlowOptions = {}): PointerGlowApi {
  const profile = useMotionProfile();
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const point = useRef<{ x: number; y: number } | null>(null);
  const enabled = !disabled && profile.pointer;

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
    [],
  );

  const paint = useCallback(() => {
    frame.current = null;
    const node = ref.current;
    const next = point.current;
    if (!node || !next) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((next.x - rect.left) / rect.width) * 100;
    const y = ((next.y - rect.top) / rect.height) * 100;
    node.style.setProperty("--luc-px", `${x.toFixed(2)}%`);
    node.style.setProperty("--luc-py", `${y.toFixed(2)}%`);
  }, []);

  const schedule = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(paint);
  }, [paint]);

  const handlers = {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      point.current = { x: event.clientX, y: event.clientY };
      schedule();
    },
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const node = event.currentTarget;
      // Seed from the entry point so the light never jumps in from a corner.
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--luc-px", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      node.style.setProperty("--luc-py", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      node.style.setProperty("--luc-glow-opacity", String(opacity));
      point.current = { x: event.clientX, y: event.clientY };
    },
    onPointerLeave: () => {
      if (!enabled) return;
      ref.current?.style.setProperty("--luc-glow-opacity", "0");
      point.current = null;
    },
  };

  return { ref, handlers, enabled };
}
