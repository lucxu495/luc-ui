import { ChartFormat, SeriesTone } from "../types.js";
import { MatrixLabelMode } from "../core/matrix-labels.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/matrix-charts.d.ts
export interface MatrixChartCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
}
export interface HeatmapChartProps extends MatrixChartCommonProps {
  xLabels: readonly string[];
  yLabels: readonly string[];
  /** Row-major values: `values[y][x]`. `null` renders an empty cell. */
  values: ReadonlyArray<readonly (number | null)[]>;
  min?: number;
  max?: number;
  format?: ChartFormat;
  /** Cell labels are shown when the grid is small enough to stay readable. */
  showCellValues?: boolean;
  /**
   * `sequential` answers "how much" (an intensity ramp); `diverging` answers
   * "which side of a midpoint" and uses `midpoint`. A correlation matrix is
   * always diverging — a sequential ramp would make every correlation look
   * positive.
   *
   * `correlation` is the diverging case for a **correlation sign**: the same
   * centred domain, but the sapphire→mauve correlation ramp instead of the
   * general cool→warm one, so "moves against" never reads as "bad".
   */
  palette?: "sequential" | "diverging" | "correlation";
  /** The midpoint for a diverging ramp (0 for correlations, a mean, a target). */
  midpoint?: number;
  /**
   * An explicit low → mid → high ramp that overrides the theme's diverging
   * anchors (a product's own loss → flat → gain ramp, passed to `palette:
   * "diverging"`). `palette` still decides the *semantics* — symmetric domain
   * around `midpoint` — only the colours come from here.
   */
  ramp?: readonly [string, string, string];
  /**
   * When to print the value inside each cell.
   *
   * `"auto"` (the default once labelling is requested) decides per *rendered*
   * cell: the value appears when a cell is at least 44×18 CSS px and disappears
   * when it would become texture. ECharts re-asks on resize, so a matrix that
   * grows into a wider card gains its values without a remount. `"always"` trusts
   * the caller; `"never"` is honoured unconditionally.
   *
   * This supersedes the legacy `showCellValues` boolean, which is still honoured
   * (`true` → `"auto"`, `false` → `"never"`).
   */
  labelMode?: MatrixLabelMode;
  /**
   * Use a **robust, symmetric, zero-centred colour domain** instead of min/max.
   *
   * `true` caps the domain at the 95th percentile of |value − midpoint| (the top
   * 5% of magnitudes saturate at the endpoint colour); a number in `(0, 1)` sets
   * that quantile explicitly. The *values* are never touched — only which part
   * of the ramp is stretched across the common range — so a single extreme cell
   * no longer neutralises every ordinary one.
   */
  robustDomain?: boolean | number;
  /**
   * Cells to mark as the **current** one, as `[x, y]` index pairs.
   *
   * A period matrix has a newest cell and a reader needs to find it without
   * counting columns: the marked cells keep the same fill (the value's own
   * colour is never overridden) and gain an accent edge. That makes "this is
   * where the series currently is" a property of the matrix rather than a
   * separate card above it. Nothing about the values or the domain changes.
   */
  highlight?: readonly (readonly [number, number])[];
  title?: string;
  description?: string;
}
/**
 * Categorical heatmap / intensity grid.
 *
 * Sequential palette, generous cell separation and a bottom legend. The default
 * grid deliberately leaves the cells square-ish rather than stretching them to
 * fill a tall container — a stretched heatmap misreads as a time series.
 */
export declare function HeatmapChart({ xLabels, yLabels, values, min, max, format, showCellValues, palette, midpoint, ramp, labelMode, robustDomain, highlight, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: HeatmapChartProps): import("react").JSX.Element;
export interface CorrelationMatrixProps extends MatrixChartCommonProps {
  labels: readonly string[];
  /** Square matrix, `values[row][col]`, already computed by the caller. */
  values: ReadonlyArray<readonly number[]>;
  title?: string;
  description?: string;
  /**
   * When to print the coefficient inside each cell.
   *
   * `"auto"` (the default) decides per *rendered cell*, not per row count: the
   * values appear when a cell is at least 44×18 CSS px and disappear when they
   * would become texture. ECharts re-asks on resize, so a matrix that grows
   * into a wider card gains its values without a remount.
   */
  labelMode?: MatrixLabelMode;
  /** @deprecated Use `labelMode`. `true` → `"always"`, `false` → `"never"`. */
  showValues?: boolean;
  /**
   * Formats a printed coefficient. Default: two decimals with the sign kept
   * (`1.00`, `0.78`, `-0.42`). The diagonal is printed as `1.00`.
   */
  formatValue?: (value: number) => string;
}
/**
 * Correlation matrix.
 *
 * A diverging palette anchored at zero, a symmetric grid, and hover that names
 * both variable pairs. This chart is about *reading* clusters, so the cells stay
 * square-ish and the diagonal is de-emphasised rather than highlighted.
 */
export declare function CorrelationMatrix({ labels, values, title, description, labelMode, showValues, formatValue, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: CorrelationMatrixProps): import("react").JSX.Element;
export interface CalendarHeatmapProps extends MatrixChartCommonProps {
  year: number;
  /** `[YYYY-MM-DD, value]` pairs. The x axis is the calendar, not a data field. */
  data: ReadonlyArray<readonly [string, number]>;
  format?: ChartFormat;
  tone?: SeriesTone;
  title?: string;
  description?: string;
}
/** Calendar heatmap — one cell per day, intensity from the caller's values. */
export declare function CalendarHeatmap({ year, data, format, tone, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: CalendarHeatmapProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=matrix-charts.d.ts.map