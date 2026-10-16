"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { depth, duration, easing } from "./tokens";

export interface TransitionPanelProps extends React.ComponentPropsWithRef<"div"> {
  /** Identity of the showing panel. Changing it animates the swap. */
  activeIndex: string | number;
  /** `1` for forward, `-1` for back. Drives the travel direction. */
  direction?: 1 | -1;
  children: React.ReactNode;
  /**
   * `overlay` (default) crossfades with the outgoing panel lifted out of flow,
   * so the slot never collapses mid-swap. `swap` waits for the exit instead —
   * use it when two panels must never be visible at once.
   */
  mode?: "swap" | "overlay";
  /** Add a small blur so the swap reads as depth rather than a hard cut. */
  blur?: boolean;
}

/**
 * LUC TransitionPanel — a directional swap inside one fixed slot.
 *
 * `FadeSwap` is for a value that changed; `TransitionPanel` is for *navigating*
 * between sibling views (a metric switching breakdown, a chart switching mode,
 * a tab panel inside a card). The direction is explicit because only the caller
 * knows whether the reader moved forward or back — guessing from index order
 * breaks the moment panels are added or reordered.
 */
export function TransitionPanel({
  className,
  activeIndex,
  direction = 1,
  mode = "overlay",
  blur = true,
  children,
  ...props
}: TransitionPanelProps) {
  const reduced = useReducedMotion();
  const travel = 14 * direction;

  return (
    <div data-slot="transition-panel" className={cn("relative min-w-0", className)} {...props}>
      <AnimatePresence mode={mode === "swap" ? "wait" : "popLayout"} initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          className="min-w-0"
          custom={direction}
          initial={
            reduced
              ? false
              : { opacity: 0, x: travel, filter: blur ? `blur(${depth.enterBlur}px)` : "none" }
          }
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, x: -travel * 0.6, filter: blur ? `blur(${depth.exitBlur}px)` : "none" }
          }
          transition={reduced ? { duration: 0 } : { duration: duration.slow, ease: easing.emphasized }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
