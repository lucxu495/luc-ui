//#region src/motion/press-ripple.d.ts
export interface PressRippleRing {
  id: number;
  /** Centre of the press, in px, relative to the surface's padding box. */
  x: number;
  y: number;
  /** Ring diameter, in px. Already clamped by `maxScale`. */
  size: number;
}
export interface UsePressRippleOptions {
  /**
   * Rings emitted per press. One is a clean acknowledgement; two reads as a
   * deliberate, hand-made gesture — the house default for filled controls.
   */
  rings?: number;
  /**
   * How far the ring grows past the surface's long edge before it dies.
   * Below 1 the ripple never reaches the corners and reads as a dot.
   */
  maxScale?: number;
  /** Milliseconds a ring lives. Keep it inside `--motion-*`'s neighbourhood. */
  duration?: number;
  /** Suppress the effect entirely (a static or print surface). */
  disabled?: boolean;
}
export interface PressRippleApi {
  /** Live rings. Feed them to `RippleLayer`. */
  ripples: PressRippleRing[];
  /** Attach to the element that should emit rings. */
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}
/**
 * LUC PressRipple — tactile ink under the pointer.
 *
 * The Button family's second signature gesture (the first is the hover sheen).
 * It exists because a press is the single most repeated interaction in any
 * product, and a filled control that answers the finger reads as *material*
 * rather than as a rectangle whose colour changed.
 *
 * Three rules keep it from becoming noise:
 *
 *  1. **Only press spawns it.** Never hover, never focus, never mount.
 *  2. **It is derived from the pointer position**, so the ink originates where
 *     the user actually touched, which is what makes it feel physical.
 *  3. **Reduced motion removes it**, and `MotionIntensityProvider` can scope it
 *     down to `functional` (forms, dense tables) without touching the call site.
 *
 * The hook never re-renders on pointer *move*; only on press and on each ring's
 * expiry, so a button that is hovered 200 times per second costs nothing.
 */
export declare function usePressRipple({ rings, maxScale, duration, disabled }?: UsePressRippleOptions): PressRippleApi;
export interface RippleLayerProps extends React.ComponentPropsWithRef<"span"> {
  ripples: readonly PressRippleRing[];
  /** Milliseconds a ring lives. Must match the hook's `duration`. */
  duration?: number;
  /** Ring pigment. `currentColor` reads on filled and quiet controls alike. */
  color?: string;
}
/**
 * The visual half of `usePressRipple`.
 *
 * Render it as a child of a `relative isolate` surface. It sits at `-z-10`,
 * which inside the surface's own stacking context paints *above* the surface
 * background and *below* every piece of content — so no label needs to know the
 * ripple exists, and no ripple can swallow a click.
 */
export declare function RippleLayer({ ripples, duration, color, className, style, ...props }: RippleLayerProps): import("react").JSX.Element;
export interface PressRippleProps extends React.ComponentPropsWithRef<"span"> {
  rings?: number;
  maxScale?: number;
  duration?: number;
  color?: string;
  disabled?: boolean;
}
/**
 * Convenience wrapper for surfaces that are not already a Button.
 *
 *   <PressRipple className="rounded-lg border p-4">…</PressRipple>
 *
 * Anything with a `border-radius` works: the layer inherits the radius, so a
 * pill and a square panel both clip correctly without extra props.
 */
export declare function PressRipple({ children, className, rings, maxScale, duration, color, disabled, onPointerDown, ...props }: PressRippleProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=press-ripple.d.ts.map