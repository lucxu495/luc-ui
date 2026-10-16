"use client";

import { cn } from "../utils/cn";

export interface ShimmerProps extends React.ComponentPropsWithRef<"span"> {
  /** Pause the sweep without unmounting the layer. */
  active?: boolean;
  /** Seconds per sweep. */
  speed?: number;
}

// LUC Shimmer — a single soft highlight sweeping across its parent.
//
// Drop it inside any `relative overflow-hidden` surface. Decorative only
// (always `aria-hidden`) and it stops entirely under reduced motion.
export function Shimmer({ className, active = true, speed = 1.9, ...props }: ShimmerProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="shimmer"
      className={cn(
        "pointer-events-none absolute inset-0 -translate-x-full overflow-hidden",
        "bg-linear-to-r from-transparent via-line-default to-transparent",
        "motion-safe:animate-shimmer",
        !active && "hidden",
        className,
      )}
      style={{ animationDuration: `${speed}s` }}
      {...props}
    />
  );
}

export interface ShimmerTextProps extends React.ComponentPropsWithRef<"span"> {
  /** Sweep the highlight, or hold a steady gradient. */
  animate?: boolean;
  speed?: number;
}

// Text whose fill carries a moving highlight. Implemented with
// `background-clip: text`, so it never adds a layer above the glyphs and never
// blurs them.
export function ShimmerText({ className, children, animate = true, speed = 2.6, ...props }: ShimmerTextProps) {
  return (
    <span
      data-slot="shimmer-text"
      className={cn(
        "inline-block bg-[length:200%_100%] bg-clip-text text-transparent",
        "bg-[linear-gradient(100deg,var(--fg-muted)_0%,var(--fg-muted)_38%,var(--fg-primary)_50%,var(--fg-muted)_62%,var(--fg-muted)_100%)]",
        animate && "motion-safe:animate-[luc-sheen_var(--shimmer-speed)_linear_infinite]",
        className,
      )}
      style={{ ["--shimmer-speed" as string]: `${speed}s` }}
      {...props}
    >
      {children}
    </span>
  );
}
