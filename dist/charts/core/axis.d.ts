//#region src/charts/core/axis.d.ts
/**
 * Axis, scale and domain.
 *
 * This module is the **one** contract for three things that used to be decided
 * by whichever engine happened to draw the pixels:
 *
 *  1. **Axis side** — an ordinary single-axis LUC chart puts its Y axis on the
 *     **right** (`DEFAULT_Y_AXIS_SIDE`). A left axis is a deliberate exception
 *     (a genuine second unit, or a chart whose plate convention is left). It is
 *     never an engine default: ECharts' own default is `left`, which is why
 *     charts used to disagree with the Lightweight lane for no reason a reader
 *     could see.
 *  2. **Scale mode** — `linear` or `log`. A presentation concern: the data is
 *     never transformed upstream. Log is only valid for strictly positive
 *     values, so a requested log mode that the data cannot support falls back
 *     to linear instead of drawing a broken axis.
 *  3. **Display domain** — the numeric range the plot actually covers, with
 *     semantic headroom so an extremum, a stroke or a marker never rides the
 *     plot boundary, and so a flat series still has a readable range.
 *
 * Everything here is pure: values in, numbers out. Nothing computes analytics.
 */
/**
 * How a value axis maps data to pixels. Deliberately small: `symlog`, `power`
 * and `sqrt` are not part of the LUC contract.
 */
export type YScaleMode = "linear" | "log";
/** The side a Y axis is drawn on. */
export type AxisSide = "left" | "right";
/**
 * The default for an ordinary single-Y-axis LUC chart.
 *
 * Percentages are not a reason to move to the left: a drawdown, a funding rate
 * and a moving average all read better with the plate on the right, matching the
 * financial lane. A left axis means "this is a second, genuinely different
 * unit" (or the chart's own documented convention).
 */
export declare const DEFAULT_Y_AXIS_SIDE: AxisSide;
/** What a chart is allowed to do, and what it does by default. */
export interface ChartScaleCapability {
  allowedScaleModes: readonly YScaleMode[];
  defaultScaleMode: YScaleMode;
}
/** The capability of a chart that never leaves a linear axis. */
export declare const LINEAR_SCALE_CAPABILITY: ChartScaleCapability;
/**
 * Normalise a declared capability.
 *
 * An empty allow-list, a duplicate, or a default outside the allow-list are all
 * caller mistakes that must not produce a broken axis: they collapse to the
 * safe linear-only capability.
 */
export declare function normalizeScaleCapability(input?: {
  allowed?: readonly YScaleMode[];
  default?: YScaleMode;
} | null): ChartScaleCapability;
/** True when every finite value is strictly positive — the only valid log domain. */
export declare function isLogEligible(values: readonly (number | null | undefined)[]): boolean;
export type ScaleFallbackReason = "not-allowed" | "non-positive-data";
export interface ResolvedScaleMode {
  mode: YScaleMode;
  /** Set when the requested mode could not be honoured. */
  fallback: ScaleFallbackReason | null;
}
/**
 * Resolve the mode a chart will actually render.
 *
 * A requested mode that is not allowed, or whose data contains a zero or a
 * negative value, resolves to linear. The caller gets the reason so a
 * development warning can name it; production simply draws the linear chart
 * instead of an axis pinned to `[1, 10]`.
 */
export declare function resolveScaleMode(options: {
  requested?: YScaleMode | null;
  capability?: ChartScaleCapability;
  values?: readonly (number | null | undefined)[];
}): ResolvedScaleMode;
export type AxisDomainPolicy = "auto" | "include-zero" | "fixed";
export interface AxisBounds {
  min: number;
  max: number;
  /**
   * The edge is **display headroom**, not a value the chart reports: it exists so
   * an extreme stroke, halo or glow is drawn inside the plot. An axis must not
   * label it — a `+8.5%` tick on a drawdown would imply positive drawdown data.
   */
  minHeadroom?: boolean;
  maxHeadroom?: boolean;
}
export interface AxisBoundsInput {
  /** The raw data extent — already the *visible* extent when a window applies. */
  extent: AxisBounds;
  /**
   * Values that must stay inside the domain even though they are not data: a
   * reference line (a threshold, a benchmark level) the chart communicates. A
   * declared level that fell outside the axis would be invisible, which reads as
   * "the threshold does not exist".
   */
  include?: readonly number[];
  scaleMode?: YScaleMode;
  /**
   * Keep zero as the fixed baseline edge. Bars, areas and box plots are
   * measured from zero, so their baseline must not float.
   */
  zeroBaseline?: boolean;
  /** Override the headroom, as a fraction of the span (log: of the log span). */
  padding?: number;
  /** A marker (current point, emphasis halo) sits on the extremes. */
  marker?: boolean;
  /** Target number of axis intervals when snapping to readable bounds. */
  splitTarget?: number;
}
/** Headroom for a plain line/area edge, as a fraction of the span. */
export declare const DEFAULT_AXIS_PADDING = 0.1;
/** Headroom when a symbol, halo or glow is drawn on the extreme value. */
export declare const MARKER_AXIS_PADDING = 0.16;
/** Headroom for a log edge, as a fraction of the log span. */
export declare const LOG_AXIS_PADDING = 0.05;
/**
 * The 1 / 2 / 2.5 / 5 / 10 step at or above `raw`. Exported because a
 * domain-aware custom axis may want the same tick rhythm.
 */
export declare function niceStep(raw: number): number;
/**
 * Give an extent its display headroom and readable bounds.
 *
 * Rules, in order:
 *
 * - **A zero edge is a boundary.** If the data is non-negative the low edge
 *   stays at the data minimum (never padded below zero); if the data is
 *   non-positive the high edge stays at the data maximum. A drawdown can
 *   therefore never show a positive tick, and volatility can never show a
 *   negative one.
 * - **Every other edge gets proportional headroom**, so the extreme value, its
 *   stroke and any marker are drawn inside the plot rather than on its border.
 * - **Flat and near-flat series** get a minimum visual span instead of a
 *   zero-height domain.
 * - **The interior ticks stay round** because the engine computes its own tick
 *   interval from the extent; the padded edges are *headroom* and are marked as
 *   such (`minHeadroom` / `maxHeadroom`) so no axis labels them.
 */
export declare function resolveAxisBounds(input: AxisBoundsInput): AxisBounds;
/** `resolveAxisBounds` over a value list, or `null` when nothing is plottable. */
export declare function resolveAxisDomain(values: readonly (number | null | undefined)[], options?: Omit<AxisBoundsInput, "extent">): AxisBounds | null;
/**
 * A bound function shaped for ECharts' `axis.min` / `axis.max`.
 *
 * ECharts calls it with the extent of the **currently visible** data, so the
 * headroom survives a zoom or a range change instead of freezing the axis at the
 * full-history domain.
 */
export type AxisBoundFn = (extent: {
  min: number;
  max: number;
}) => number;
export declare function axisBoundFn(edge: "min" | "max", options?: Omit<AxisBoundsInput, "extent">): AxisBoundFn;
/**
 * The plot rectangle every LUC chart shares.
 *
 * The point is that a stacked research stack shares one X domain: the data area
 * starts at the same inset on both sides whether the axis carries `$124.7K`,
 * `-33.1%` or nothing at all. The formatter classes therefore change *nothing*
 * about the geometry — the axis gutter is reserved, not measured per chart.
 *
 * The financial lane (Lightweight Charts) reaches the same geometry with
 * `minimumWidth` on its price scale; its own `scaleMargins` are the equivalent
 * of the value headroom `resolveAxisBounds` adds.
 */
export interface ChartPlotLayout {
  /** Distance from the canvas to the data area on a side without an axis. */
  edgeInset: number;
  /** Reserved width for a Y axis and its labels. */
  axisGutter: number;
  /** Headroom above the plot: room for an extreme tick, a halo or a glow. */
  topInset: number;
  /** Footroom below the plot: room for the axis line and the last tick. */
  bottomInset: number;
}
export declare const CHART_PLOT_LAYOUT: ChartPlotLayout;
export interface ChartPlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  containLabel: false;
}
/**
 * Resolve the ECharts `grid` rectangle for a set of axis sides.
 *
 * `containLabel` stays **off**: letting ECharts grow the grid to fit whatever
 * labels a chart happens to render is exactly what made two stacked charts share
 * a crosshair but not a plot width.
 */
export declare function resolveChartPlotRect(yAxisSides: readonly AxisSide[], layout?: ChartPlotLayout): ChartPlotRect;
/** The label margin inside a reserved gutter, in px. */
export declare const AXIS_LABEL_MARGIN = 8;
//#endregion
//# sourceMappingURL=axis.d.ts.map