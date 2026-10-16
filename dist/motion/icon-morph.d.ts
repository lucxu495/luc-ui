//#region src/motion/icon-morph.d.ts
export interface IconMorphProps extends React.ComponentPropsWithRef<"span"> {
  /** Identity of the active icon. Changing it swaps the glyph. */
  state: string;
  /** The glyph set, keyed by state. Two or three states is the sweet spot. */
  icons: Record<string, React.ReactNode>;
  /** Size of the glyph box. Keeps the layout from jumping between states. */
  size?: number | string;
}
/**
 * LUC IconMorph — one glyph dissolving into the next, in place.
 *
 * The state change is the *only* trigger, so this is exactly right for
 * copy→check, star outline→filled, expand→collapse, sun↔moon. The box is sized
 * by the caller's `size` (or inherits it), so swapping a 16px glyph for an 18px
 * one never nudges the row.
 *
 * Reduced motion swaps instantly — no scale, no fade.
 */
export declare function IconMorph({ className, state, icons, size, style, ...props }: IconMorphProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=icon-morph.d.ts.map