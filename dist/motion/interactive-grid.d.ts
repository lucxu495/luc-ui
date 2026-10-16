//#region src/motion/interactive-grid.d.ts
export interface InteractiveGridProps extends React.ComponentPropsWithRef<"div"> {
  /** Cell size in px. */
  cell?: number;
  variant?: "lines" | "dots";
  /** Radius, in px, of the pointer-reactive highlight. */
  radius?: number;
  /** Let the grid drift slowly on its own. Off under `functional`/`none`. */
  drift?: boolean;
  /** Soft-edge the whole field so it never ends on a hard line. */
  fade?: boolean;
  /** Track the pointer. Turn off for print or a purely decorative field. */
  interactive?: boolean;
}
/**
 * LUC InteractiveGrid — the research-grid atmosphere.
 *
 * A technical grid at low contrast that lights up *near the pointer*. The base
 * grid and the reactive grid are the same CSS gradient twice; the top copy is
 * masked to a radius around the cursor, so activation costs one composited layer
 * and one rAF-throttled custom-property write — no React render, no canvas.
 *
 * Mount it as a background *behind* content (`absolute inset-0`, first child).
 * It is inert on coarse pointers and under reduced motion, where the calm base
 * grid simply stays put.
 */
export declare function InteractiveGrid({ className, cell, variant, radius, drift, fade, interactive, ...props }: InteractiveGridProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=interactive-grid.d.ts.map