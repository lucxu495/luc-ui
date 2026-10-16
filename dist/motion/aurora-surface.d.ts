//#region src/motion/aurora-surface.d.ts
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
export declare function AuroraSurface({ className, children, tone, density, speed, grid, vignette, surface, static: isStatic, ...props }: AuroraSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=aurora-surface.d.ts.map