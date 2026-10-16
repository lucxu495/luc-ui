//#region src/motion/border-trail.d.ts
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
export declare function BorderTrail({ className, children, variant, speed, length, radius, color, track, thickness, ...props }: BorderTrailProps): import("react").JSX.Element;
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
export declare function BorderTrailLayer({ variant, speed, length, radius, color, track, thickness, groupName, active }: BorderTrailLayerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=border-trail.d.ts.map