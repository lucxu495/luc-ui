import { ChartFormat, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/relationship-charts.d.ts
export interface RelationshipCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  description?: string;
}
export interface Observation {
  x: number;
  y: number;
  /** Optional point label (an asset, a cohort, a date). */
  label?: string;
}
/** A prepared regression line: two endpoints are enough to draw it. */
export interface RegressionLine {
  slope: number;
  intercept: number;
  /** Domain over which to draw. Defaults to the observation extent. */
  from?: number;
  to?: number;
  label?: string;
}
export interface RegressionBand {
  /** Confidence band upper/lower at each x of `xValues`. */
  xValues: readonly number[];
  lower: readonly number[];
  upper: readonly number[];
  label?: string;
}
export interface ScatterRegressionChartProps extends RelationshipCommonProps {
  points: readonly Observation[];
  /** Pre-computed fit. Luc UI never regresses — the analytics layer does. */
  regression?: RegressionLine;
  band?: RegressionBand;
  /** Draw x = 0 and y = 0 guides (default: true when the extent crosses zero). */
  zeroLines?: boolean;
  /** Highlight these points (outliers, a named cohort). */
  emphasis?: readonly string[];
  pointLabel?: string;
  regressionLabel?: string;
}
/**
 * ScatterRegressionChart — observations plus a prepared fit.
 *
 * The one rule that matters: the fit is **input**, not output. LUC UI may not
 * compute a regression (that is a research calculation, §40), so the caller
 * passes slope/intercept and, optionally, a confidence band it already has.
 *
 * Points are drawn small and translucent so overlap reads as density — the
 * shape of the cloud is the finding; a scatter of opaque dots is a smudge.
 */
export declare function ScatterRegressionChart({ points, regression, band, zeroLines, emphasis, pointLabel, regressionLabel, xFormat, yFormat, xLabel, yLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: ScatterRegressionChartProps): import("react").JSX.Element;
export interface QuadrantLabels {
  topRight?: string;
  topLeft?: string;
  bottomRight?: string;
  bottomLeft?: string;
}
export interface QuadrantScatterChartProps extends RelationshipCommonProps {
  points: readonly Observation[];
  /** Vertical and horizontal split values (e.g. 0, a mean, a target). */
  xReference: number;
  yReference: number;
  quadrantLabels?: QuadrantLabels;
  /** Optional per-point tone override; defaults to a stable categorical colour. */
  pointTone?: SeriesTone;
  pointLabel?: string;
}
/**
 * QuadrantScatterChart — a scatter split into four named regions.
 *
 * The reference lines and their labels are the chart: without them this is just
 * a scatter. Labels are positioned in the corner of each quadrant rather than on
 * the axis, so the reading ("above the benchmark *and* below zero") is stated
 * where the reader is looking.
 */
export declare function QuadrantScatterChart({ points, xReference, yReference, quadrantLabels, pointTone, pointLabel, xFormat, yFormat, xLabel, yLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: QuadrantScatterChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=relationship-charts.d.ts.map