//#region src/motion/reveal.d.ts
export interface RevealProps extends React.ComponentPropsWithRef<"div"> {
  /** Seconds to wait before entering. */
  delay?: number;
  /** Travel distance in px. Keep it small — 6–10 reads as refined. */
  distance?: number;
  /** Animate every time it scrolls into view instead of once. */
  repeat?: boolean;
  /** Start immediately on mount instead of waiting for the viewport. */
  immediate?: boolean;
}
/**
 * LUC Reveal — content entering with intent.
 *
 * A short fade plus a few px of travel, once, on first view.
 *
 * Fail-safe by design: the element renders **visible** and is only hidden once
 * JavaScript confirms it starts below the fold. So print, PDF export, no-JS
 * rendering, reduced motion, and headless screenshots all show the content.
 * The transition itself is CSS, which means the reduced-motion clamp in
 * `base.css` applies without a second code path.
 */
export declare function Reveal({ className, children, delay, distance, repeat, immediate, style, ...props }: RevealProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=reveal.d.ts.map