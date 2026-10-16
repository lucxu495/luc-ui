"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { duration } from "./tokens";

export interface IconMorphProps extends React.ComponentPropsWithRef<"span"> {
  /** Identity of the active icon. Changing it swaps the glyph. */
  state: string;
  /** The glyph set, keyed by state. Two or three states is the sweet spot. */
  icons: Record<string, React.ReactNode>;
  /** Size of the glyph box. Keeps the layout from jumping between states. */
  size?: number | string;
}

/**
 * LUC IconMorph — one glyph dissolving into the next, in place.
 *
 * The state change is the *only* trigger, so this is exactly right for
 * copy→check, star outline→filled, expand→collapse, sun↔moon. The box is sized
 * by the caller's `size` (or inherits it), so swapping a 16px glyph for an 18px
 * one never nudges the row.
 *
 * Reduced motion swaps instantly — no scale, no fade.
 */
export function IconMorph({
  className,
  state,
  icons,
  size,
  style,
  ...props
}: IconMorphProps) {
  const reduced = useReducedMotion();
  const glyph = icons[state] ?? null;

  return (
    <span
      data-slot="icon-morph"
      data-state={state}
      className={cn("relative inline-grid place-items-center [&_svg]:size-full", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={state}
          className="inline-grid place-items-center [&_svg]:size-full"
          initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -22 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 22 }}
          transition={reduced ? { duration: 0 } : { duration: duration.fast, ease: [0.16, 1, 0.3, 1] }}
        >
          {glyph}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
