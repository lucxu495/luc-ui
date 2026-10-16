import { ChartFormat, SeriesTone } from "../types.js";
import { FamilyCommonProps, XYPoint } from "./chart-common.js";
//#region src/charts/components/diagnostic-charts.d.ts
/**
 * Diagnostic charts — the figures that answer "is this model or process sane?".
 *
 * Same rule as every other family in `@luc/ui/charts`: **the library renders,
 * it does not estimate.** `AutocorrelationChart` receives lag correlations
 * *and* the significance band, `SurvivalCurveChart` receives the survival
 * estimates, `PrecisionRecallChart` receives the precision/recall pairs,
 * `FeatureImportanceChart` receives the importances and their intervals.
 * Nothing here runs a regression, a fit, a resample or a correction — a caller
 * that wants Newey–West bands or a bootstrap computes them where the data
 * lives, and the chart cannot quietly disagree with the numbers in the report.
 */
export interface AutocorrelationSeries {
  key: string;
  label: string;
  /** What the series *is*: an ACF, a PACF or a cross-correlation. */
  kind?: "acf" | "pacf" | "ccf";
  points: readonly XYPoint[];
  tone?: SeriesTone;
}
export interface AutocorrelationChartProps extends FamilyCommonProps {
  series: readonly AutocorrelationSeries[];
  /**
   * Half-width of the significance band, **supplied by the caller** — the usual
   * value is `z / sqrt(n)` with the caller's own `z` and sample size. Omit to
   * draw no band, which is the honest option when the caller has no basis for
   * one.
   */
  band?: number;
  /** Label used for the band in the tooltip and the legend, e.g. "±1.96/√n". */
  bandLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function AutocorrelationChart({ series, band, bandLabel, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: AutocorrelationChartProps): import("react").JSX.Element;
export interface SurvivalSeries {
  key: string;
  label: string;
  /** Supplied survival estimates: `x` is time, `y` is the survival share (0–1). */
  points: readonly XYPoint[];
  /** Supplied censoring marks, drawn as ticks on the step. */
  censored?: readonly XYPoint[];
  tone?: SeriesTone;
}
export interface SurvivalCurveChartProps extends FamilyCommonProps {
  series: readonly SurvivalSeries[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * A Kaplan–Meier style step curve.
 *
 * The step matters: survival is constant between events and drops at an event,
 * so interpolating between two estimates would invent a risk that the sample
 * does not have. Censoring marks are supplied points, never inferred from the
 * data.
 */
export declare function SurvivalCurveChart({ series, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: SurvivalCurveChartProps): import("react").JSX.Element;
export interface PrecisionRecallCurve {
  key: string;
  label: string;
  /** One entry per threshold: recall on `x`, precision on `y`, both 0–1. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
  /** Summary values the caller computed — printed in the tooltip, never derived here. */
  averagePrecision?: number;
}
export interface PrecisionRecallChartProps extends FamilyCommonProps {
  curves: readonly PrecisionRecallCurve[];
  /** Prevalence of the positive class, drawn as a dashed no-skill line. Supplied. */
  baseline?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function PrecisionRecallChart({ curves, baseline, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: PrecisionRecallChartProps): import("react").JSX.Element;
export interface FeatureImportance {
  key: string;
  label: string;
  value: number;
  /** Supplied interval bounds — omit when the caller has no uncertainty to show. */
  low?: number;
  high?: number;
}
export interface FeatureImportanceChartProps extends FamilyCommonProps {
  features: readonly FeatureImportance[];
  format?: ChartFormat;
  /** Name of the interval, e.g. "±1 s.e." or "90% CI". */
  intervalLabel?: string;
  /** Draw positive values in the positive tone and negative in the negative tone. */
  signed?: boolean;
  title?: string;
  description?: string;
}
/**
 * Horizontal importances, ranked, with the caller's own interval drawn over
 * each bar. `signed` colours by direction (a coefficient) instead of magnitude
 * (a tree importance) — the two mean different things and must not share one
 * colour rule.
 */
export declare function FeatureImportanceChart({ features, format, intervalLabel, signed, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: FeatureImportanceChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=diagnostic-charts.d.ts.map