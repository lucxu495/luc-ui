//#region src/motion/text-reveal.d.ts
export type TextRevealMode = "blur" | "mask" | "word" | "char";
export interface TextRevealProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  /** The text to reveal. A plain string so it can be split deterministically. */
  text: string;
  mode?: TextRevealMode;
  /** Seconds to wait before the first element enters. */
  delay?: number;
  /** Seconds between units, for `word`/`char`. */
  step?: number;
  /** Wait until the element scrolls into view instead of animating on mount. */
  whenVisible?: boolean;
  /** Element used for the wrapper. */
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}
/**
 * LUC TextReveal — premium entrance for a *headline*, never for body copy.
 *
 * Four modes, one axis of difference: how much of the text arrives at once.
 * `blur` and `mask` treat the line as one object; `word` and `char` stagger it.
 *
 * Fail-safe by construction, exactly like `Reveal`: the text is rendered
 * **visible** in the markup and is only hidden once JavaScript has confirmed it
 * should animate. So SSR, no-JS rendering, print, PDF export, headless
 * screenshots and reduced motion all show the headline, and the transition runs
 * in CSS — which means the global reduced-motion clamp applies without a second
 * code path.
 */
export declare function TextReveal({ className, text, mode, delay, step, whenVisible, as, style, ...props }: TextRevealProps): import("react").JSX.Element;
export interface ScrambleTextProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  text: string;
  /** Length of the decode, in ms. */
  duration?: number;
  /** Characters used while scrambling. */
  charset?: string;
}
/**
 * LUC ScrambleText — a short decode flourish for a *status*, not a paragraph.
 *
 * Right for "ANALYZING", "SIGNAL ACTIVE", a command result. The real text is in
 * the DOM the whole time as the accessible name, and the final frame is exactly
 * `text`, so a screen reader and a screenshot both read the settled value.
 * Reduced motion prints it immediately.
 */
export declare function ScrambleText({ className, text, duration: total, charset, ...props }: ScrambleTextProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=text-reveal.d.ts.map