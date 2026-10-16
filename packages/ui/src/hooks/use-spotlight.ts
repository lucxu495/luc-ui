"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";
import { useMediaQuery } from "./use-media-query";

export interface SpotlightState {
  /** Pointer position in element-local pixels. */
  x: number;
  y: number;
  /** Normalised 0..1 proximity weight — 0 when the pointer is outside. */
  active: number;
}

export interface UseSpotlightOptions {
  /** Ignore pointer tracking entirely (e.g. static surfaces). */
  disabled?: boolean;
  /** CSS custom property prefix. Defaults to `spotlight`. */
  prefix?: string;
  /** Called on every animation frame while the pointer is over the element. */
  onFrame?: (state: SpotlightState) => void;
}

/**
 * Shared pointer-proximity tracker for gentle surface lighting.
 *
 * Design constraints (see DESIGN_SYSTEM.md):
 *  - rAF-throttled: at most one style write per frame.
 *  - Never active on coarse pointers or under prefers-reduced-motion.
 *  - Writes CSS custom properties, so no React re-render per mouse move.
 */
export function useSpotlight<T extends HTMLElement>({
  disabled,
  prefix = "spotlight",
  onFrame,
}: UseSpotlightOptions = {}) {
  const ref = useRef<T | null>(null);
  const frame = useRef<number | null>(null);
  const pointer = useRef<SpotlightState>({ x: 0, y: 0, active: 0 });
  const onFrameRef = useRef(onFrame);
  const reducedMotion = useReducedMotion();
  const coarsePointer = useMediaQuery("(pointer: coarse)", true);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const enabled = !disabled && !reducedMotion && !coarsePointer;

  const commit = useCallback(() => {
    frame.current = null;
    const element = ref.current;
    if (!element) return;
    element.style.setProperty(`--${prefix}-x`, `${pointer.current.x}px`);
    element.style.setProperty(`--${prefix}-y`, `${pointer.current.y}px`);
    element.style.setProperty(`--${prefix}-active`, `${pointer.current.active}`);
    onFrameRef.current?.(pointer.current);
  }, [prefix]);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = window.requestAnimationFrame(commit);
  }, [commit]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      if (!enabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointer.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: 1,
      };
      schedule();
    },
    [enabled, schedule],
  );

  const handlePointerEnter = useCallback(() => {
    if (!enabled) return;
    setIsActive(true);
  }, [enabled]);

  const handlePointerLeave = useCallback(() => {
    if (!enabled) return;
    pointer.current = { ...pointer.current, active: 0 };
    setIsActive(false);
    schedule();
  }, [enabled, schedule]);

  useEffect(
    () => () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  return {
    ref,
    isActive: isActive && enabled,
    enabled,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
  };
}
