import { ChartFormat, SeriesTone } from "../types.js";
import { FamilyCommonProps, XYPoint } from "./chart-common.js";
//#region src/charts/components/statistical-charts.d.ts
/**
 * Statistical charts — distributions, agreement and uncertainty.
 *
 * One rule governs every component in this file: **the library renders, it does
 * not estimate.** None of these charts bins, smooths, simulates or fits
 * anything. `EcdfChart` receives the cumulative values, `QqPlotChart` receives
 * the quantiles, `ViolinChart` receives the densities, `ResidualChart` receives
 * the residuals. A caller that wants a fit or a kernel computes it where the
 * data lives and passes it in — which keeps the numbers in a chart answerable to
 * one place, and keeps LUC out of the business of silently inventing statistics.
 */
export interface EcdfSeries {
  key: string;
  label: string;
  /** Cumulative probability per order statistic, ascending in `x`. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
}
export interface EcdfChartProps extends FamilyCommonProps {
  series: readonly EcdfSeries[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Empirical cumulative distribution.
 *
 * Drawn as a step (`smooth: false` + explicit duplicate points) because a CDF is
 * a step function: interpolating between two order statistics invents mass that
 * the sample does not have.
 */
export declare function EcdfChart({ series, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: EcdfChartProps): import("react").JSX.Element;
export interface QqPlotChartProps extends FamilyCommonProps {
  /** Theoretical quantile against the sample quantile, paired. */
  points: readonly XYPoint[];
  labels?: {
    x?: string;
    y?: string;
  };
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Quantile–quantile plot.
 *
 * The 45° reference line is the whole point: a sample drawn from the reference
 * distribution lies on it. The line is derived from the *data extent* (it is a
 * drawing aid, not a fitted regression) unless the caller passes explicit
 * points, which is why the component never claims to have fitted anything.
 */
export declare function QqPlotChart({ points, labels, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: QqPlotChartProps): import("react").JSX.Element;
export interface ViolinDensity {
  /** Position on the value axis. */
  value: number;
  /** Density at that position, in any consistent unit. */
  density: number;
}
export interface ViolinGroup {
  label: string;
  /** The distribution outline. Density is a supplied estimate, never fitted here. */
  bins: readonly ViolinDensity[];
  tone?: SeriesTone;
  /** Optional marker: a median or a mean the caller has already computed. */
  marker?: {
    value: number;
    label?: string;
  };
}
export interface ViolinChartProps extends FamilyCommonProps {
  groups: readonly ViolinGroup[];
  valueFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Violin plot — a distribution per category.
 *
 * Drawn from a pre-computed density outline (the caller's KDE, histogram or
 * bootstrap), mirrored around the category axis. LUC does not fit the kernel:
 * the bandwidth is a modelling decision, and a chart library that picks one
 * silently is a chart library that lies quietly.
 */
export declare function ViolinChart({ groups, valueFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ViolinChartProps): import("react").JSX.Element;
export interface RocCurve {
  label: string;
  /** Area under the curve. Supplied by the caller — never integrated here. */
  auc?: number;
  /** False-positive rate and true-positive rate pairs, ascending in `x`. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
}
export interface RocCurveChartProps extends FamilyCommonProps {
  curves: readonly RocCurve[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/** Receiver operating characteristic — one line per model, with the chance diagonal. */
export declare function RocCurveChart({ curves, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: RocCurveChartProps): import("react").JSX.Element;
export interface CalibrationBin {
  /** Mean predicted probability in the bin. */
  predicted: number;
  /** Observed frequency in the same bin. */
  observed: number;
  /** Bin size. Drawn as the bubble area, so a sparse bin cannot masquerade. */
  count?: number;
}
export interface CalibrationChartProps extends FamilyCommonProps {
  bins: readonly CalibrationBin[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/** Reliability diagram — observed frequency against predicted probability. */
export declare function CalibrationChart({ bins, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: CalibrationChartProps): import("react").JSX.Element;
export interface ConfusionMatrixChartProps extends FamilyCommonProps {
  /** Row and column labels, in the same order. */
  labels: readonly string[];
  /** `matrix[actual][predicted]`. */
  matrix: readonly (readonly number[])[];
  /** Divide each row by its total, so classes of different size are comparable. */
  normalized?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Confusion matrix — a heatmap with matrix semantics.
 *
 * The difference from `HeatmapChart` is the contract: this one knows its axes
 * are the same set of classes and that a cell is a count, so it can offer row
 * normalisation (the only way a 900-sample class and a 40-sample class are
 * comparable) and format a cell as a count or a rate without the caller wiring a
 * visual map.
 */
export declare function ConfusionMatrixChart({ labels, matrix, normalized, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ConfusionMatrixChartProps): import("react").JSX.Element;
export interface ErrorBarPoint {
  label: string;
  /** Point estimate. */
  value: number;
  /** Lower bound of the supplied interval. */
  lower: number;
  /** Upper bound of the supplied interval. */
  upper: number;
  tone?: SeriesTone;
}
export interface ErrorBarChartProps extends FamilyCommonProps {
  points: readonly ErrorBarPoint[];
  /** Name of the interval, e.g. "95% CI" or "±1 s.e.". */
  intervalLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Point estimates with a supplied interval.
 *
 * The interval is *given*, never derived: the component draws exactly the
 * `lower`/`upper` it receives, so it cannot disagree with the statistics it is
 * illustrating.
 */
export declare function ErrorBarChart({ points, intervalLabel, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ErrorBarChartProps): import("react").JSX.Element;
export interface ResidualPoint {
  /** Fitted value on the model's scale. */
  fitted: number;
  /** Residual (observed − fitted), supplied. */
  residual: number;
}
export interface ResidualChartProps extends FamilyCommonProps {
  points: readonly ResidualPoint[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/** Residuals against fitted values, with the zero line a well-behaved model sits around. */
export declare function ResidualChart({ points, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ResidualChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=statistical-charts.d.ts.map