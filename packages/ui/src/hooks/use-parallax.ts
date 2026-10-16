"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionProfile } from "../motion/intensity";
import { pointer as pointerTokens } from "../motion/tokens";

export interface UseParallaxOptions {
  /** Furthest layer's travel, in px. Larger means the scene has more depth. */
  depth?: number;
  /** Lean of the whole scene, in degrees. `0` keeps it flat. */
  tilt?: number;
  /** Turn the tracker off (static surfaces, print, reduced motion scope). */
  disabled?: boolean;
}

export interface UseParallaxResult<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>;
  enabled: boolean;
  handlers: {
    onPointerMove: (event: React.PointerEvent<T>) => void;
    onPointerEnter: (event: React.PointerEvent<T>) => void;
    onPointerLeave: () => void;
  };
}

/**
 * LUC `useParallax` — the depth bus behind `ParallaxScene`.
 *
 * The interesting decision is *where the value lives*. A parallax scene needs
 * one number per axis that every layer multiplies by its own depth. Passing
 * that number through React state would re-render the subtree on every pointer
 * frame; passing it as a MotionValue would force each layer to be a motion
 * component owning its own subscription.
 *
 * Instead the hook writes four custom properties onto the scene element:
 *
 *   --luc-parallax-x / --luc-parallax-y   travel, in px, at depth 1
 *   --luc-parallax-rx / --luc-parallax-ry lean, in deg
 *
 * Custom properties inherit, so a layer is a plain `<div>` whose transform is
 * `calc(var(--luc-parallax-x) * depth)`. Zero React renders per frame, one rAF
 * loop for the whole scene, and a layer that is not present costs nothing.
 *
 * The loop only runs while there is something to animate: it starts on pointer
 * enter, keeps running while the pointer moves and while the scene settles back
 * to rest, then stops itself. Touch and reduced motion never start it, and the
 * layer transforms resolve to `0` — a flat but still correctly arranged scene
 * rather than a broken one.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  depth = pointerTokens.parallaxDepth,
  tilt = 0,
  disabled = false,
}: UseParallaxOptions = {}): UseParallaxResult<T> {
  const profile = useMotionProfile();
  const ref = useRef<T | null>(null);
  const frame = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const enabled = !disabled && profile.pointer;

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const schedule = useCallback(() => {
    if (frame.current !== null) return;
    const scale = depth * Math.max(profile.depth, 0.4);

    const step = () => {
      frame.current = null;
      const node = ref.current;
      if (!node) return;
      const rest = target.current.x === 0 && target.current.y === 0;
      const state = current.current;
      // Fast enough that the scene reads as "follows the pointer", with a short
      // enough tail that leaving the surface does not feel sticky.
      const ease = rest ? 0.16 : 0.12;
      state.x += (target.current.x - state.x) * ease;
      state.y += (target.current.y - state.y) * ease;

      if (rest && Math.abs(state.x) < 0.05 && Math.abs(state.y) < 0.05) {
        state.x = 0;
        state.y = 0;
      }

      node.style.setProperty("--luc-parallax-x", `${(state.x * scale).toFixed(3)}px`);
      node.style.setProperty("--luc-parallax-y", `${(state.y * scale).toFixed(3)}px`);
      node.style.setProperty("--luc-parallax-rx", `${(-state.y * tilt).toFixed(3)}deg`);
      node.style.setProperty("--luc-parallax-ry", `${(state.x * tilt).toFixed(3)}deg`);

      if (state.x === 0 && state.y === 0 && rest) return;
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
  }, [depth, profile.depth, tilt]);

  useEffect(() => stop, [stop]);

  // Switching the effect off mid-motion has to reset the scene, or a reviewer
  // flipping reduced motion would leave every layer parked off-centre.
  useEffect(() => {
    if (enabled) return;
    stop();
    current.current = { x: 0, y: 0 };
    target.current = { x: 0, y: 0 };
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--luc-parallax-x", "0px");
    node.style.setProperty("--luc-parallax-y", "0px");
    node.style.setProperty("--luc-parallax-rx", "0deg");
    node.style.setProperty("--luc-parallax-ry", "0deg");
  }, [enabled, stop]);

  const setTarget = useCallback((event: React.PointerEvent<T>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    target.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    };
  }, []);

  const handlers = {
    onPointerMove: (event: React.PointerEvent<T>) => {
      if (!enabled) return;
      setTarget(event);
      schedule();
    },
    onPointerEnter: (event: React.PointerEvent<T>) => {
      if (!enabled) return;
      setTarget(event);
      schedule();
    },
    onPointerLeave: () => {
      if (!enabled) return;
      target.current = { x: 0, y: 0 };
      schedule();
    },
  };

  return { ref, enabled, handlers };
}
