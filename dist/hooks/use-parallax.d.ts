//#region src/hooks/use-parallax.d.ts
export interface UseParallaxOptions {
  /** Furthest layer's travel, in px. Larger means the scene has more depth. */
  depth?: number;
  /** Lean of the whole scene, in degrees. `0` keeps it flat. */
  tilt?: number;
  /** Turn the tracker off (static surfaces, print, reduced motion scope). */
  disabled?: boolean;
}
export interface UseParallaxResult<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>;
  enabled: boolean;
  handlers: {
    onPointerMove: (event: React.PointerEvent<T>) => void;
    onPointerEnter: (event: React.PointerEvent<T>) => void;
    onPointerLeave: () => void;
  };
}
/**
 * LUC `useParallax` — the depth bus behind `ParallaxScene`.
 *
 * The interesting decision is *where the value lives*. A parallax scene needs
 * one number per axis that every layer multiplies by its own depth. Passing
 * that number through React state would re-render the subtree on every pointer
 * frame; passing it as a MotionValue would force each layer to be a motion
 * component owning its own subscription.
 *
 * Instead the hook writes four custom properties onto the scene element:
 *
 *   --luc-parallax-x / --luc-parallax-y   travel, in px, at depth 1
 *   --luc-parallax-rx / --luc-parallax-ry lean, in deg
 *
 * Custom properties inherit, so a layer is a plain `<div>` whose transform is
 * `calc(var(--luc-parallax-x) * depth)`. Zero React renders per frame, one rAF
 * loop for the whole scene, and a layer that is not present costs nothing.
 *
 * The loop only runs while there is something to animate: it starts on pointer
 * enter, keeps running while the pointer moves and while the scene settles back
 * to rest, then stops itself. Touch and reduced motion never start it, and the
 * layer transforms resolve to `0` — a flat but still correctly arranged scene
 * rather than a broken one.
 */
export declare function useParallax<T extends HTMLElement = HTMLDivElement>({ depth, tilt, disabled }?: UseParallaxOptions): UseParallaxResult<T>;
//#endregion
//# sourceMappingURL=use-parallax.d.ts.map