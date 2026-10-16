//#region src/motion/kinetic-headline.d.ts
export type KineticHeadlineMode = "reveal" | "swap";
export type KineticHeadlineTag = "h1" | "h2" | "h3" | "p" | "span" | "div";
export interface KineticHeadlineProps extends Omit<React.ComponentPropsWithRef<"h2">, "children"> {
  /** The headline. Changing it animates the change; it is the only content. */
  text: string;
  /** How the words arrive. `reveal` assembles, `swap` replaces in place. */
  mode?: KineticHeadlineMode;
  /** Seconds between consecutive words. */
  stagger?: number;
  /** Announce the new text politely when it changes (a live headline). */
  live?: boolean;
  /** Element to render. Defaults to `h2`; the caller owns the type scale. */
  as?: KineticHeadlineTag;
}
/**
 * LUC `KineticHeadline` — typography that acknowledges a change instead of
 * snapping to it.
 *
 * Its reason to exist is *layout-aware text transitions*: a headline that
 * swaps from one sentence to another with a direction, a stagger and a shared
 * reading rhythm, rather than a hard cut. Real uses are a rotating value
 * proposition, a step title in a wizard, a live status line, a chart caption
 * that follows the selected series.
 *
 * The rules it follows:
 *
 *  1. **The accessible text is one string.** The animated layer is
 *     `aria-hidden`, and a visually-hidden copy carries the text, so a screen
 *     reader never hears "Revenue" spelled across nine spans.
 *  2. **Text stays text.** Words are real text nodes — selectable, searchable,
 *     and translatable — not images or per-character canvases.
 *  3. **It is a headline, not a toy.** Word granularity keeps the element count
 *     sane, and the whole animation is `transform` + `opacity` on the compositor.
 *     "Word" is decided by `Intl.Segmenter`, so it means the language's words: a
 *     Latin sentence is a handful of units, and a Chinese one is more, because
 *     Chinese writes no spaces and its words are shorter. That is the honest cost
 *     of animating the same sentence in two writing systems; a space-only split
 *     made Chinese an unbreakable 500px span instead.
 *  4. **Reduced motion renders the plain string**, because the meaning of a
 *     headline is the words, not the paragraph of motion around them.
 */
export declare function KineticHeadline({ text, mode, stagger, live, as: Tag, className, ...props }: KineticHeadlineProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=kinetic-headline.d.ts.map