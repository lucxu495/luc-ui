"use client";

import { cn } from "../utils/cn";
import { useMotionProfile } from "./intensity";
import { ambient as ambientTokens } from "./tokens";

export type BorderTrailVariant = "hover" | "active" | "ambient" | "processing";

export interface BorderTrailProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * When the beam runs:
   *   `hover`      only while the group is hovered/focused
   *   `active`     a persistent accent (an active signal, a selected card)
   *   `ambient`    a slow, ongoing sweep (a featured CTA)
   *   `processing` a fast sweep for a working state
   */
  variant?: BorderTrailVariant;
  /** Seconds for one full loop. Overrides the variant's default. */
  speed?: number;
  /** Length of the travelling segment, as a percentage of the perimeter. */
  length?: number;
  /** Corner radius. Must match the wrapped surface. */
  radius?: "sm" | "md" | "lg" | "xl" | "full";
  /** Ring colour. Defaults to the theme accent. */
  color?: string;
  /** Draw a faint resting hairline around the whole perimeter. */
  track?: boolean;
  thickness?: number;
}

const radiusValue: Record<NonNullable<BorderTrailProps["radius"]>, number> = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 999,
};

const defaultSpeed: Record<BorderTrailVariant, number> = {
  hover: ambientTokens.trail,
  active: ambientTokens.trail * 1.2,
  ambient: ambientTokens.slowLoop,
  processing: 1.6,
};

/**
 * LUC BorderTrail — a bright segment travelling the perimeter of a surface.
 *
 * The mechanism is an SVG rounded rectangle with a normalised `pathLength`, so
 * the dash geometry is correct for *any* size or radius the surface happens to
 * have — no measuring, no re-layout, and no canvas. The loop is pure CSS, which
 * means the global reduced-motion clamp freezes it into a static accent rather
 * than leaving a beam stuck mid-sweep.
 *
 * Use it for one thing at a time: a primary CTA, an active signal, a featured
 * research card, a processing state. An ambient trail on every card is noise.
 */
export function BorderTrail({
  className,
  children,
  variant = "hover",
  speed,
  length = 18,
  radius = "lg",
  color = "var(--accent-default)",
  track = false,
  thickness = 1.5,
  ...props
}: BorderTrailProps) {
  return (
    <div
      data-slot="border-trail"
      data-variant={variant}
      className={cn("group/trail relative isolate min-w-0", className)}
      {...props}
    >
      <BorderTrailLayer
        variant={variant}
        speed={speed}
        length={length}
        radius={radius}
        color={color}
        track={track}
        thickness={thickness}
        groupName="trail"
      />
      {/*
       * `display: contents` is deliberate: the beam must never change the layout
       * of what it decorates, so the child stays the direct (layout) child of the
       * relatively-positioned root and a full-width or flex-item button keeps its
       * exact box. The SVG carries its own `z-10` so the beam still paints above
       * the surface it outlines.
       */}
      <div className="contents">{children}</div>
    </div>
  );
}

export interface BorderTrailLayerProps {
  variant?: BorderTrailVariant;
  speed?: number;
  length?: number;
  radius?: NonNullable<BorderTrailProps["radius"]>;
  color?: string;
  track?: boolean;
  thickness?: number;
  /**
   * Tailwind group name for the hover variant (`group/<name>` must exist on an
   * ancestor). Pass `null` to drive the beam from a state prop instead.
   */
  groupName?: string | null;
  /** Force the beam on/off, ignoring hover. Used by inline controls. */
  active?: boolean;
}

/**
 * The SVG half of BorderTrail, exported so a component that *is* the surface
 * (Button, IconButton) can render the beam inside its own box instead of
 * wrapping itself in an extra element.
 */
export function BorderTrailLayer({
  variant = "hover",
  speed,
  length = 18,
  radius = "lg",
  color = "var(--accent-default)",
  track = false,
  thickness = 1.5,
  groupName = "trail",
  active,
}: BorderTrailLayerProps) {
  const profile = useMotionProfile();
  const looping = profile.ambient;
  const duration = speed ?? defaultSpeed[variant];
  const hoverDriven = variant === "hover" && active === undefined && groupName !== null;
  const shown = active ?? !hoverDriven;

  return (
    <svg
      aria-hidden="true"
      data-slot="border-trail-svg"
      data-active={shown ? "true" : undefined}
      className={cn(
        "pointer-events-none absolute z-10 size-full overflow-visible",
        hoverDriven && "opacity-0 [transition:opacity_var(--motion-normal)_var(--ease-standard)]",
        hoverDriven && groupName && `group-hover/${groupName}:opacity-100 group-focus-within/${groupName}:opacity-100`,
      )}
      style={{ inset: thickness / 2 }}
    >
      <rect
        width="100%"
        height="100%"
        rx={radiusValue[radius]}
        fill="none"
        stroke={track ? "color-mix(in oklab, var(--line-default) 70%, transparent)" : "transparent"}
        strokeWidth={thickness}
      />
      <rect
        data-slot="border-trail-segment"
        width="100%"
        height="100%"
        rx={radiusValue[radius]}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${length} ${100 - length}`}
        className={cn(
          hoverDriven &&
            looping &&
            groupName &&
            `motion-safe:group-hover/${groupName}:[animation:luc-border-trail_var(--trail-duration)_linear_infinite] motion-safe:group-focus-within/${groupName}:[animation:luc-border-trail_var(--trail-duration)_linear_infinite]`,
        )}
        style={
          {
            ["--trail-duration" as string]: `${duration}s`,
            animation: looping && !hoverDriven ? `luc-border-trail ${duration}s linear infinite` : undefined,
          } as React.CSSProperties
        }
      />
    </svg>
  );
}
