"use client";

import {
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "./use-media-query";
import { useReducedMotion } from "./use-reduced-motion";
import { spring, type SpringPresetName } from "../motion/tokens";

export interface PointerMotionState {
  /** Signed offset from the element centre, in px. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** The same offset normalised to roughly -0.5..0.5. */
  px: MotionValue<number>;
  py: MotionValue<number>;
  /** 0 when idle, 1 while the pointer is over the element. */
  active: MotionValue<number>;
}

export interface UsePointerMotionOptions {
  /** Turn the effect off (a static context, or an ancestor that knows better). */
  disabled?: boolean;
  /** Which spring governs the follow. `responsive` is the house default. */
  preset?: SpringPresetName;
}

export interface UsePointerMotionResult<T extends HTMLElement = HTMLDivElement>
  extends PointerMotionState {
  ref: React.RefObject<T | null>;
  enabled: boolean;
  /** True while the pointer is over the element — for CSS/QA, not for layout. */
  isActive: boolean;
  handlers: {
    onPointerMove: (event: React.PointerEvent<T>) => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
}

/**
 * One pointer tracker for every cursor-reactive primitive.
 *
 * `Magnetic`, `TiltSurface`, `GlareSurface` and `CursorSpotlight` all need the
 * same three things: the pointer position relative to the element, a spring so
 * the response has weight, and a hard "off" switch on touch and under reduced
 * motion. Duplicating that four times is how a system drifts, so it lives here.
 *
 * The loop never touches React state: positions are MotionValues, updated on
 * `pointermove` and smoothed by the motion engine. The only React state is the
 * boolean "is the pointer over me", which changes twice per interaction.
 */
export function usePointerMotion<T extends HTMLElement = HTMLDivElement>({
  disabled = false,
  preset = "responsive",
}: UsePointerMotionOptions = {}): UsePointerMotionResult<T> {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useMediaQuery("(pointer: coarse)", true);
  const enabled = !disabled && !reducedMotion && !coarsePointer;

  const ref = useRef<T | null>(null);
  const [isActive, setIsActive] = useState(false);

  const config = spring[preset];
  const springOptions = { stiffness: config.stiffness, damping: config.damping };

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const height = useMotionValue(0);
  const width = useMotionValue(0);
  const active = useMotionValue(0);

  const x = useSpring(rawX, springOptions);
  const y = useSpring(rawY, springOptions);
  // `px`/`py` are derived from x/y and the live element size, so they stay
  // correct across a resize without re-measuring on every frame.
  const px = useTransform(() => (width.get() > 0 ? x.get() / width.get() : 0));
  const py = useTransform(() => (height.get() > 0 ? y.get() / height.get() : 0));

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    width.set(rect.width || 1);
    height.set(rect.height || 1);
  }, [height, width]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof ResizeObserver === "undefined") return;
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, measure]);

  // Reset to rest the moment the effect is switched off, so a reviewer flipping
  // reduced motion never leaves a card frozen mid-lean.
  useEffect(() => {
    if (enabled) return;
    rawX.set(0);
    rawY.set(0);
    active.set(0);
    // `isActive` is returned as `state && enabled`, so switching the effect off
    // already reports idle without a second render here.
  }, [active, enabled, rawX, rawY]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      if (!enabled) return;
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      width.set(rect.width || 1);
      height.set(rect.height || 1);
      rawX.set(event.clientX - rect.left - rect.width / 2);
      rawY.set(event.clientY - rect.top - rect.height / 2);
    },
    [enabled, height, rawX, rawY, width],
  );

  const handlePointerEnter = useCallback(() => {
    if (!enabled) return;
    measure();
    active.set(1);
    setIsActive(true);
  }, [active, enabled, measure]);

  const handlePointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    active.set(0);
    setIsActive(false);
  }, [active, rawX, rawY]);

  return {
    ref,
    enabled,
    isActive: isActive && enabled,
    x,
    y,
    px,
    py,
    active,
    handlers: { onPointerMove: handlePointerMove, onPointerEnter: handlePointerEnter, onPointerLeave: handlePointerLeave },
  };
}
