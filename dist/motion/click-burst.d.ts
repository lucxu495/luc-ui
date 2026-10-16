//#region src/motion/click-burst.d.ts
export interface ClickBurstProps extends React.ComponentPropsWithRef<"span"> {
  /** Number of rays. Keep it small — 6–8 reads as a spark, 30 reads as confetti. */
  count?: number;
  /** Ray colour. Defaults to the theme accent. */
  color?: string;
  /** Peak travel of each ray, in px. */
  spread?: number;
  /** Ray length, in px. */
  length?: number;
  /** Milliseconds the burst lives. */
  duration?: number;
  /** Suppress the effect (e.g. outside reduced motion contexts). */
  disabled?: boolean;
}
/**
 * LUC ClickBurst — a small, one-shot spark on a meaningful action.
 *
 * Not a confetti system and not a click effect for navigation: it is the
 * punctuation for *completion* (copy, save, publish, favourite, export). The
 * burst is spawned from the actual pointer position, lives for less than half a
 * second, and is never rendered under reduced motion.
 */
export declare function ClickBurst({ className, children, count, color, spread, length, duration, disabled, ...props }: ClickBurstProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=click-burst.d.ts.map