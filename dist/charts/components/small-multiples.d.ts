//#region src/charts/components/small-multiples.d.ts
/**
 * LUC SmallMultiples — one grid of related charts that share an axis.
 *
 * The alternative to an overcrowded single plot. Four rolling-Sharpe windows,
 * five horizons, six cohorts: each gets its own panel, all panels share the same
 * x semantics so the eye compares shapes rather than legends.
 *
 * This is a **layout** primitive, not an engine: each `SmallMultiple` renders
 * whatever chart the caller puts inside it. That keeps the caller in control of
 * which engine is right per panel, and keeps this file free of chart logic.
 */
export interface SmallMultiplesProps extends React.ComponentPropsWithRef<"div"> {
  /** Panel count that forces a single column (useful on mobile). */
  columns?: 1 | 2 | 3 | 4;
  /** Shared caption above the grid, e.g. "Rolling Sharpe (annualised)". */
  label?: React.ReactNode;
  /** One shared legend, when every panel plots the same series. */
  legend?: React.ReactNode;
}
export declare function SmallMultiples({ className, children, columns, label, legend, ...props }: SmallMultiplesProps): import("react").JSX.Element;
export interface SmallMultipleProps extends Omit<React.ComponentPropsWithRef<"figure">, "title"> {
  /** Panel title, e.g. "30D". */
  title: React.ReactNode;
  /** Optional caption under the panel (a value, a footnote). */
  caption?: React.ReactNode;
  /** Right-aligned title slot (a value that changes per panel). */
  aside?: React.ReactNode;
}
export declare function SmallMultiple({ className, title, caption, aside, children, ...props }: SmallMultipleProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=small-multiples.d.ts.map