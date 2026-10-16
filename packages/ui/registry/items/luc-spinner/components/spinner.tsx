"use client";

import { cn } from "@/components/luc-ui/utils/cn";
import { useReducedMotion } from "@/components/luc-ui/hooks/use-reduced-motion";

export type SpinnerSize = 14 | 16 | 18 | 20 | 24;

export interface SpinnerProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  size?: SpinnerSize;
  /** Screen-reader text. Set to `null` when an ancestor already announces. */
  label?: string | null;
}

/**
 * LUC Spinner — a single confident arc, no gimmicks.
 *
 * Under `prefers-reduced-motion` the rotation is replaced by a slow pulse, so
 * the indicator keeps meaning without travelling. See docs/MOTION_GUIDE.md.
 */
export function Spinner({ size = 16, label = "Loading", className, ...props }: SpinnerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span
      data-slot="spinner"
      role={label ? "status" : undefined}
      className={cn("inline-flex shrink-0 items-center justify-center text-fg-accent", className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className={cn(
          reducedMotion ? "animate-pulse-soft" : "animate-spin-soft",
          "will-change-transform",
        )}
        data-motion-essential
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.5" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
