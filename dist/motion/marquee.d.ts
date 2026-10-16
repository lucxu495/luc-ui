//#region src/motion/marquee.d.ts
export type MarqueeDirection = "left" | "right" | "up" | "down";
export interface MarqueeProps extends React.ComponentPropsWithRef<"div"> {
  /** Seconds for one full copy to pass. Lower is faster. */
  speed?: number;
  direction?: MarqueeDirection;
  /** The gutter between items, and between the two copies. Any CSS length. */
  gap?: string;
  /** Stop while the pointer is over the strip, so people can actually read it. */
  pauseOnHover?: boolean;
  /** Feather the two ends so items dissolve instead of being cut. */
  fade?: boolean;
}
/**
 * LUC Marquee — a strip that never stops, used sparingly.
 *
 * A marquee is loud, so it is reserved for content that is genuinely a stream:
 * a logo wall, a ticker of live values, a wall of contributor names, a long
 * quote that will not fit. It is never a way to fit more cards on a page.
 *
 * Implementation notes that matter:
 *
 *  - The track is rendered **twice**: the first copy is the real content, the
 *    second is `aria-hidden`, so a screen reader hears the list once.
 *  - Each copy is shifted by exactly its own width, so the loop is seamless at
 *    any content length without measuring anything in JavaScript.
 *  - The trailing gutter is padding *inside* the copy rather than a flex `gap`
 *    on the parent — otherwise one gap's worth of drift accumulates per loop.
 *  - `pauseOnHover` is on by default: an unreadable strip is a usability defect,
 *    not a style choice.
 *  - Reduced motion and `functional` intensity stop the drift entirely, leaving
 *    a normal, scrollable row.
 */
export declare function Marquee({ className, children, speed, direction, gap, pauseOnHover, fade, style, ...props }: MarqueeProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=marquee.d.ts.map