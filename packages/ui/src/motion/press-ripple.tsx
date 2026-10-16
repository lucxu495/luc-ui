"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export interface PressRippleRing {
  id: number;
  /** Centre of the press, in px, relative to the surface's padding box. */
  x: number;
  y: number;
  /** Ring diameter, in px. Already clamped by `maxScale`. */
  size: number;
}

export interface UsePressRippleOptions {
  /**
   * Rings emitted per press. One is a clean acknowledgement; two reads as a
   * deliberate, hand-made gesture — the house default for filled controls.
   */
  rings?: number;
  /**
   * How far the ring grows past the surface's long edge before it dies.
   * Below 1 the ripple never reaches the corners and reads as a dot.
   */
  maxScale?: number;
  /** Milliseconds a ring lives. Keep it inside `--motion-*`'s neighbourhood. */
  duration?: number;
  /** Suppress the effect entirely (a static or print surface). */
  disabled?: boolean;
}

export interface PressRippleApi {
  /** Live rings. Feed them to `RippleLayer`. */
  ripples: PressRippleRing[];
  /** Attach to the element that should emit rings. */
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}

/**
 * LUC PressRipple — tactile ink under the pointer.
 *
 * The Button family's second signature gesture (the first is the hover sheen).
 * It exists because a press is the single most repeated interaction in any
 * product, and a filled control that answers the finger reads as *material*
 * rather than as a rectangle whose colour changed.
 *
 * Three rules keep it from becoming noise:
 *
 *  1. **Only press spawns it.** Never hover, never focus, never mount.
 *  2. **It is derived from the pointer position**, so the ink originates where
 *     the user actually touched, which is what makes it feel physical.
 *  3. **Reduced motion removes it**, and `MotionIntensityProvider` can scope it
 *     down to `functional` (forms, dense tables) without touching the call site.
 *
 * The hook never re-renders on pointer *move*; only on press and on each ring's
 * expiry, so a button that is hovered 200 times per second costs nothing.
 */
export function usePressRipple({
  rings = 1,
  maxScale = 2.4,
  duration = 620,
  disabled = false,
}: UsePressRippleOptions = {}): PressRippleApi {
  const reduced = useReducedMotion();
  const [ripples, setRipples] = useState<PressRippleRing[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || reduced) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * maxScale;
      const ringCount = Math.max(1, Math.round(rings));
      const spawned: PressRippleRing[] = [];
      for (let index = 0; index < ringCount; index += 1) {
        nextId.current += 1;
        spawned.push({
          id: nextId.current,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          size: size * (1 - index * 0.22),
        });
      }
      setRipples((current) => [...current, ...spawned]);
      const ids = new Set(spawned.map((ring) => ring.id));
      const timer = window.setTimeout(() => {
        setRipples((current) => current.filter((ring) => !ids.has(ring.id)));
      }, duration + 60);
      timers.current.push(timer);
    },
    [disabled, duration, maxScale, reduced, rings],
  );

  return { ripples, onPointerDown };
}

export interface RippleLayerProps extends React.ComponentPropsWithRef<"span"> {
  ripples: readonly PressRippleRing[];
  /** Milliseconds a ring lives. Must match the hook's `duration`. */
  duration?: number;
  /** Ring pigment. `currentColor` reads on filled and quiet controls alike. */
  color?: string;
}

/**
 * The visual half of `usePressRipple`.
 *
 * Render it as a child of a `relative isolate` surface. It sits at `-z-10`,
 * which inside the surface's own stacking context paints *above* the surface
 * background and *below* every piece of content — so no label needs to know the
 * ripple exists, and no ripple can swallow a click.
 */
export function RippleLayer({
  ripples,
  duration = 620,
  color = "currentColor",
  className,
  style,
  ...props
}: RippleLayerProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="ripple-layer"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]",
        className,
      )}
      style={style}
      {...props}
    >
      {ripples.map((ring) => (
        <span
          key={ring.id}
          data-slot="ripple-ring"
          className="luc-ripple absolute block rounded-full"
          style={{
            left: `${ring.x}px`,
            top: `${ring.y}px`,
            width: `${ring.size}px`,
            height: `${ring.size}px`,
            animationDuration: `${duration}ms`,
            // The pigment is mixed here rather than in CSS so a consumer can
            // hand in `rgb(…)` from their own brand ramp if they want to.
            background: `radial-gradient(circle, color-mix(in oklab, ${color} 34%, transparent) 0%, color-mix(in oklab, ${color} 16%, transparent) 46%, transparent 72%)`,
          }}
        />
      ))}
    </span>
  );
}

export interface PressRippleProps extends React.ComponentPropsWithRef<"span"> {
  rings?: number;
  maxScale?: number;
  duration?: number;
  color?: string;
  disabled?: boolean;
}

/**
 * Convenience wrapper for surfaces that are not already a Button.
 *
 *   <PressRipple className="rounded-lg border p-4">…</PressRipple>
 *
 * Anything with a `border-radius` works: the layer inherits the radius, so a
 * pill and a square panel both clip correctly without extra props.
 */
export function PressRipple({
  children,
  className,
  rings,
  maxScale,
  duration,
  color,
  disabled,
  onPointerDown,
  ...props
}: PressRippleProps) {
  const ripple = usePressRipple({ rings, maxScale, duration, disabled });
  return (
    <span
      data-slot="press-ripple"
      className={cn("relative isolate inline-flex", className)}
      onPointerDown={(event) => {
        ripple.onPointerDown(event);
        onPointerDown?.(event);
      }}
      {...props}
    >
      {children}
      <RippleLayer ripples={ripple.ripples} duration={duration} color={color} />
    </span>
  );
}
