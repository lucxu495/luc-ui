"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { distance, duration, easing } from "./tokens";

/**
 * LUC FadeSwap — a crossfade between one of N mutually exclusive states.
 *
 * Use it when the *same slot* shows different content: a metric switching
 * aggregation, a chart switching dataset, an empty/loading/content swap. The
 * `slot` value is the identity; changing it fades the old out and the new in,
 * with a few px of travel so the change is legible as a change.
 *
 * Reduced motion renders the new state immediately with no travel.
 */
export interface FadeSwapProps extends Omit<React.ComponentPropsWithRef<"div">, "slot"> {
  /** Identity of the current content. Changing it triggers the swap. */
  slot: string | number;
  children: React.ReactNode;
  /** `outFirst` waits for the exit before entering (a true swap). */
  mode?: "sync" | "wait";
  distance?: number;
}

export function FadeSwap({
  className,
  slot,
  children,
  mode = "wait",
  distance: travel = distance.xs,
  ...props
}: FadeSwapProps) {
  const reduced = useReducedMotion();

  return (
    <div data-slot="fade-swap" data-slot-key={String(slot)} className={cn("relative min-w-0", className)} {...props}>
      <AnimatePresence mode={mode} initial={false}>
        <motion.div
          key={slot}
          initial={reduced ? false : { opacity: 0, y: travel }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -travel * 0.5 }}
          transition={reduced ? { duration: 0 } : { duration: duration.normal, ease: easing.enter }}
          className="min-w-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export interface PresenceProps extends React.ComponentPropsWithRef<"div"> {
  present: boolean;
  children: React.ReactNode;
}

/**
 * LUC Presence — mount/unmount with a fade instead of a hard cut.
 *
 * The primitive behind contextual panels (a filter bar that appears, a
 * footnote that only exists when a value is stale). It animates *presence*,
 * never layout of surrounding content beyond the flow change itself.
 */
export function Presence({ className, present, children, ...props }: PresenceProps) {
  const reduced = useReducedMotion();
  return (
    <div data-slot="presence" className={className} {...props}>
      <AnimatePresence initial={false}>
        {present ? (
          <motion.div
            key="present"
            initial={reduced ? false : { opacity: 0, y: distance.xs }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -distance.xs }}
            transition={reduced ? { duration: 0 } : { duration: duration.fast, ease: easing.enter }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
