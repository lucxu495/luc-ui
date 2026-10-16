"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";

export type FlashTone = "positive" | "negative" | "neutral";

/**
 * LUC DataChangeFlash — a short, one-shot emphasis when a value *actually*
 * changed.
 *
 * It is not a live-price effect: nothing flashes on a timer, and nothing
 * flashes on the first paint (there is no previous value to compare against —
 * flashing everything on load is noise, and worse, it implies a change that did
 * not happen). The tint is drawn as a composited background and fades out; the
 * value itself is never recoloured, so a flash can never be mistaken for a
 * semantic state.
 *
 * Reduced motion keeps the wrapper but never flashes.
 */
export interface DataChangeFlashProps extends React.ComponentPropsWithRef<"div"> {
  /** The value being watched. A change (by `!==`, with NaN treated as equal) flashes. */
  value: number | string | null | undefined;
  /** Semantic tint. Defaults to `neutral` — a change is not automatically good. */
  tone?: FlashTone;
  /** How long the tint lasts, in ms. */
  duration?: number;
  children: React.ReactNode;
}

const TONE_CLASS: Record<FlashTone, string> = {
  positive: "bg-[color-mix(in_oklab,var(--positive)_16%,transparent)]",
  negative: "bg-[color-mix(in_oklab,var(--negative)_16%,transparent)]",
  neutral: "bg-[color-mix(in_oklab,var(--accent-default)_14%,transparent)]",
};

export function DataChangeFlash({
  className,
  value,
  tone = "neutral",
  duration = 720,
  children,
  ...props
}: DataChangeFlashProps) {
  const reduced = useReducedMotion();
  const previous = useRef<number | string | null | undefined>(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    // First observation is not a change.
    if (before === undefined || reduced) return;
    const same = before === value || (typeof before === "number" && typeof value === "number" && Number.isNaN(before) && Number.isNaN(value));
    if (same) return;
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), duration);
    return () => window.clearTimeout(timer);
  }, [value, duration, reduced]);

  return (
    <div data-slot="data-change-flash" data-tone={tone} data-flashing={flashing ? "true" : undefined} className={cn("relative min-w-0", className)} {...props}>
      <span
        aria-hidden="true"
        data-slot="data-change-flash-tint"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity",
          TONE_CLASS[tone],
          flashing && "opacity-100 duration-150",
          !flashing && "duration-[600ms]",
        )}
      />
      <span className="relative">{children}</span>
    </div>
  );
}
