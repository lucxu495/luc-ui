//#region src/motion/motion-surface.d.ts
/**
 * LUC MotionSurface — the interactive shell for a card, panel or chart block.
 *
 * V1.1 kept this to a 1px lift. V1.2 makes it the composition point: an
 * `expressive` surface lifts, steps its border, and lights under the pointer;
 * a `functional` surface (a dense grid, a form) keeps just the border step; and
 * under reduced motion everything settles into the calm static surface.
 *
 * It is the shell, not the content: a chart, a research block or a metric can
 * be wrapped without the surface prescribing any layout of its own.
 */
export interface MotionSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Lift the surface on hover. Off for dense grids where it reads as jitter. */
  hover?: boolean;
  /** Persistent selected treatment (an accent ring + tinted surface). */
  selected?: boolean;
  /** Show a stronger accent on hover/focus (a focal chart panel). */
  highlight?: boolean;
  /** Let the pointer light the surface. The premium card default. */
  spotlight?: boolean;
  /** Corner radius. Must match the content's own radius. */
  radius?: "md" | "lg" | "xl";
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
}
export declare function MotionSurface({ className, children, hover, selected, highlight, spotlight, radius, as, interactive, style, ...props }: MotionSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=motion-surface.d.ts.map