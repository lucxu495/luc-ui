import { SpringPresetName } from "./tokens.js";
//#region src/motion/tilt-surface.d.ts
export interface TiltSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Maximum lean, in degrees, at the edge of the surface. */
  max?: number;
  /** `perspective()` distance, in px. Smaller = more dramatic. */
  perspective?: number;
  /** Render a pointer-following sheen across the surface. */
  glare?: boolean;
  /** Glare tone. */
  glareTone?: "light" | "accent";
  preset?: SpringPresetName;
  disabled?: boolean;
  /**
   * Surface treatment. `solid` leaves the caller's own background alone;
   * `glass` applies the translucent LUC material (thinned `surface-overlay`,
   * hairline, backdrop blur) so a leaning surface also reads as *physical*
   * rather than as a rectangle that happens to be rotated.
   */
  material?: "solid" | "glass";
}
/**
 * LUC TiltSurface — a surface that leans toward the pointer in 3D.
 *
 * Tilt is the loudest of the pointer effects, so it is never the default on a
 * serious full-width chart; it belongs on research/asset/feature cards where a
 * small lean adds depth without moving any data.
 *
 * Only `transform` is animated, the release is a spring back to rest, and the
 * whole thing is silent on touch and under reduced motion — where the surface
 * renders flat with no listeners at all.
 */
export declare function TiltSurface({ className, children, max, perspective, glare, glareTone, preset, disabled, material, ...props }: TiltSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=tilt-surface.d.ts.map