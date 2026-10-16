//#region src/motion/parallax-scene.d.ts
export interface ParallaxSceneProps extends Omit<React.ComponentPropsWithRef<"div">, "onPointerMove"> {
  /**
   * Travel, in px, of a layer at depth `1`. The whole vocabulary of the scene:
   * `12` is a restrained product surface, `40` is a hero.
   */
  depth?: number;
  /** `perspective()` distance, in px. Smaller makes the depth more dramatic. */
  perspective?: number;
  /** Lean of the whole scene, in degrees. `0` keeps it flat. */
  tilt?: number;
  /** Freeze the scene at rest but keep the composition. */
  disabled?: boolean;
}
/**
 * LUC `ParallaxScene` — a container that gives its children real depth.
 *
 * Depth here is a *coordinate system*, not an effect: the scene publishes one
 * pointer offset as custom properties, and each `ParallaxLayer` inside decides
 * how much of it to take. A background washes slowly, a mid-ground panel moves
 * a little, a foreground badge moves against the pointer — all from one rAF
 * loop and zero React renders (see `useParallax`).
 *
 * Rules that keep it honest:
 *
 *  1. **Content does not move.** Text sits in a layer at depth `0` (or outside
 *     the scene) so nothing readable ever shifts under a pointer.
 *  2. **The scene still composes at rest.** Layers are separated by `translateZ`
 *     as well as by travel, so the flat frame is deliberate, not degenerate —
 *     which is exactly what touch devices, reduced motion and print receive.
 *  3. **Nothing listens on touch.** The tracker is off on coarse pointers, so a
 *     phone pays for one gradient and no event handlers.
 */
export declare function ParallaxScene({ className, children, depth, perspective, tilt, disabled, style, ...props }: ParallaxSceneProps): import("react").JSX.Element;
export interface ParallaxLayerProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * How much of the scene's travel this layer takes. `0` is fixed, `1` is the
   * scene's nominal depth, negative values move *against* the pointer (the
   * classic foreground read) and values above `1` exaggerate the background.
   */
  depth?: number;
  /** Position along the z axis, in px. Negative pushes a layer behind the plane. */
  z?: number;
  /** Which axis the layer answers. Useful for a strictly horizontal sweep. */
  axis?: "both" | "x" | "y";
}
/**
 * One plane inside a `ParallaxScene`.
 *
 * The transform is `translate3d` only — a compositor property — and the two
 * custom properties come from the scene above, so a layer never re-renders when
 * the pointer moves. Without a scene the variables are undefined, the `calc`
 * resolves to `0px` and the layer simply sits at its `z`, which makes the
 * component safe to render outside one.
 */
export declare function ParallaxLayer({ className, children, depth, z, axis, style, ...props }: ParallaxLayerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=parallax-scene.d.ts.map