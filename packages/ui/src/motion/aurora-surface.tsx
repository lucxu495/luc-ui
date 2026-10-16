"use client";

import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";

export type AuroraDensity = "quiet" | "normal" | "rich";

export interface AuroraSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * `brand` uses the live accent; `duotone` adds a hue-rotated second field
   * (still the same accent family, so it follows every palette); `neutral`
   * stays monochrome for content-first surfaces.
   */
  tone?: "brand" | "duotone" | "neutral";
  /** How many light fields drift across the surface. */
  density?: AuroraDensity;
  /** Seconds per drift cycle. Slower reads as more expensive. */
  speed?: number;
  /** A faint technical grid behind the light. */
  grid?: boolean;
  /** Darken the corners so foreground text keeps its contrast. */
  vignette?: boolean;
  /** Floor on the surface's own colour. */
  surface?: "canvas" | "default" | "raised" | "transparent";
  /** Freeze the drift without removing the composition. */
  static?: boolean;
}

const densityFields: Record<AuroraDensity, number> = {
  quiet: 2,
  normal: 3,
  rich: 5,
};

const surfaceClass = {
  canvas: "bg-surface-canvas",
  default: "bg-surface-default",
  raised: "bg-surface-raised",
  transparent: "bg-transparent",
} as const;

/**
 * LUC AuroraSurface — a living background for the one moment that should be
 * remembered.
 *
 * A hero, an auth page, an empty state, a marketing header: places where the
 * product is allowed to make an entrance. It is a *surface*, not a component
 * library of its own — you put real content on top of it, and it gets out of
 * the way.
 *
 * Design rules, learnt the hard way:
 *
 *  1. **The light is derived, never literal.** Every field is mixed from
 *     `--accent-default` (plus one fixed hue rotation), so switching palette
 *     re-tints the whole atmosphere instead of leaving a stranded cyan blob.
 *  2. **Nothing above it is dimmed.** The fields are blurred *and* masked, and
 *     each one peaks at low double-digit alpha, so a heading on top keeps
 *     ≥ 4.5:1 in both themes.
 *  3. **It is at most one gesture per page.** The drift is slow (≥ 14s), never
 *     pulses, and never uses `filter` animation — only `transform`, which the
 *     compositor can run off the main thread.
 *  4. **Reduced motion keeps the composition and drops the drift**, so the page
 *     looks designed rather than broken.
 */
export function AuroraSurface({
  className,
  children,
  tone = "duotone",
  density = "normal",
  speed = 22,
  grid = false,
  vignette = true,
  surface = "default",
  static: isStatic = false,
  ...props
}: AuroraSurfaceProps) {
  const profile = useMotionProfile();
  const fields = Math.max(1, densityFields[density]);
  const drifting = !isStatic && profile.ambient;

  return (
    <div
      data-slot="aurora-surface"
      data-density={density}
      className={cn(
        "relative isolate overflow-hidden",
        surfaceClass[surface],
        className,
      )}
      {...props}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: fields }, (_, index) => {
          const rotate = index % 2 === 1 && tone === "duotone" ? 48 : 0;
          const pigment =
            tone === "neutral" ? "var(--fg-muted)" : "var(--accent-default)";
          return (
            <span
              key={index}
              data-slot="aurora-field"
              className={cn("absolute block rounded-full", drifting && "luc-aurora-drift")}
              style={{
                // Deterministic placement: a fixed table, not Math.random(), so
                // the server and the client agree and screenshots are stable.
                top: `${[-18, 42, -30, 66, 8][index % 5]}%`,
                left: `${[-12, 58, 30, -20, 74][index % 5]}%`,
                width: `${[46, 38, 54, 34, 42][index % 5]}%`,
                height: `${[58, 46, 40, 62, 50][index % 5]}%`,
                background: `radial-gradient(closest-side, color-mix(in oklab, ${pigment} ${tone === "neutral" ? 12 : 26}%, transparent), transparent)`,
                filter: `blur(${54 + index * 12}px) hue-rotate(${rotate}deg)`,
                opacity: drifting ? 0.9 : 0.75,
                animationDuration: `${speed + index * 3.5}s`,
                animationDelay: `${index * -4.5}s`,
                ...(index % 2 === 1 ? { animationDirection: "reverse" as const } : null),
              }}
            />
          );
        })}

        {grid ? (
          <span
            data-slot="aurora-grid"
            className="absolute inset-0 opacity-[0.055] [mask-image:radial-gradient(120%_90%_at_50%_0%,black,transparent)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--line-strong) 1px, transparent 1px)",
              backgroundSize: "var(--grid-cell, 32px) var(--grid-cell, 32px)",
            }}
          />
        ) : null}

        {vignette ? (
          <span
            data-slot="aurora-vignette"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(130% 100% at 50% 0%, transparent 30%, color-mix(in oklab, var(--surface-canvas) 88%, transparent) 100%)",
            }}
          />
        ) : null}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
