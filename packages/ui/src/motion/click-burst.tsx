"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export interface ClickBurstProps extends React.ComponentPropsWithRef<"span"> {
  /** Number of rays. Keep it small — 6–8 reads as a spark, 30 reads as confetti. */
  count?: number;
  /** Ray colour. Defaults to the theme accent. */
  color?: string;
  /** Peak travel of each ray, in px. */
  spread?: number;
  /** Ray length, in px. */
  length?: number;
  /** Milliseconds the burst lives. */
  duration?: number;
  /** Suppress the effect (e.g. outside reduced motion contexts). */
  disabled?: boolean;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  rays: { angle: number; distance: number }[];
}

/**
 * LUC ClickBurst — a small, one-shot spark on a meaningful action.
 *
 * Not a confetti system and not a click effect for navigation: it is the
 * punctuation for *completion* (copy, save, publish, favourite, export). The
 * burst is spawned from the actual pointer position, lives for less than half a
 * second, and is never rendered under reduced motion.
 */
export function ClickBurst({
  className,
  children,
  count = 7,
  color = "var(--accent-default)",
  spread = 26,
  length = 8,
  duration = 420,
  disabled = false,
  ...props
}: ClickBurstProps) {
  const reduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const active = !reduced && !disabled;

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    },
    [],
  );

  const fire = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (!active) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const id = (nextId.current += 1);
      const rays = Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + Math.random() * 0.35;
        return { angle, distance: spread * (0.7 + Math.random() * 0.6) };
      });
      setBursts((current) => [...current.slice(-2), { id, x: event.clientX - rect.left, y: event.clientY - rect.top, rays }]);
      const timer = window.setTimeout(
        () => setBursts((current) => current.filter((burst) => burst.id !== id)),
        duration,
      );
      timers.current.push(timer);
    },
    [active, count, duration, spread],
  );

  return (
    <span
      data-slot="click-burst"
      className={cn("relative inline-flex min-w-0", className)}
      onPointerDown={fire}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
        <AnimatePresence>
          {bursts.map((burst) => (
            <span key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
              {burst.rays.map((ray, index) => (
                <motion.span
                  key={index}
                  className="absolute block rounded-full"
                  style={{ width: length, height: 2, background: color, transformOrigin: "0% 50%" }}
                  initial={{ opacity: 0.9, scaleX: 1, x: 0, y: 0, rotate: (ray.angle * 180) / Math.PI }}
                  animate={{
                    opacity: 0,
                    scaleX: 0.3,
                    x: Math.cos(ray.angle) * ray.distance,
                    y: Math.sin(ray.angle) * ray.distance,
                    rotate: (ray.angle * 180) / Math.PI,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration / 1000, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}
