import { AnnotationSpec, ChartFormat, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/distribution-charts.d.ts
export interface DistributionCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  /**
   * Display name of the value axis ("Return", "Observations").
   *
   * An unlabelled pair of numbers leaves the reader to guess which axis is the
   * bin and which is the count. The name is presentation chrome — it never
   * changes a value — so it is passed straight to the engine's own axis title.
   */
  xLabel?: string;
  yLabel?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
export interface HistogramBin {
  from: number;
  to: number;
  count: number;
  /**
   * The caller's own share for this bin (e.g. a served `frequency`), when it has
   * one. LUC UI computes no share: without it the tooltip falls back to the
   * bin's own share of the peak, clearly labelled as such.
   */
  share?: number | null;
}
export interface HistogramChartProps extends DistributionCommonProps {
  /** Pre-binned data. Binning is the caller's job — see docs/CHART_GUIDE.md. */
  bins: readonly HistogramBin[];
  /** Format for the bin edges on the x axis. */
  xFormat?: ChartFormat;
  /** Format for the count axis. */
  format?: ChartFormat;
  tone?: SeriesTone;
  annotations?: AnnotationSpec;
  title?: string;
  description?: string;
}
/**
 * Distribution of a prepared, pre-binned sample.
 *
 * The bars are unstacked, unbordered and separated by the plot background, so
 * the shape of the distribution is the only thing the eye has to read.
 */
export declare function HistogramChart({ bins, xFormat, format, tone, annotations, title, description, state, height, className, ariaLabel, ariaDescription, xLabel, yLabel, onReady, onEvent }: HistogramChartProps): import("react").JSX.Element;
/** `[min, Q1, median, Q3, max]`, computed by the caller. */
export type BoxPlotSummary = readonly [number, number, number, number, number];
/** A prepared density curve over the same domain as the bins. */
export interface DensityCurve {
  /** x at each sample, in the bins' own units. */
  x: readonly number[];
  /** Density (or any smoothed magnitude); the chart rescales for display. */
  y: readonly number[];
  label?: string;
}
/** A prepared reference level drawn as a labelled vertical rule. */
export interface DistributionReference {
  value: number;
  label: string;
  /** `median` / `mean` / `percentile` / `threshold` — presentation only. */
  kind?: "median" | "mean" | "percentile" | "threshold";
}
export interface DistributionChartProps extends DistributionCommonProps {
  /** Pre-binned sample. Binning is the analytics layer's job. */
  bins: readonly HistogramBin[];
  /** Optional prepared density curve (a kernel estimate the caller computed). */
  density?: DensityCurve;
  /** Median / mean / percentile markers, already computed. */
  references?: readonly DistributionReference[];
  /**
   * Split the bars by sign (returns above/below zero, PnL, surprise). Bars take
   * the semantic positive/negative colours; a single-signed sample stays one
   * colour rather than pretending to have two regimes.
   */
  signed?: boolean;
  xFormat?: ChartFormat;
  format?: ChartFormat;
  tone?: SeriesTone;
  annotations?: AnnotationSpec;
  title?: string;
  description?: string;
}
/**
 * DistributionChart — the research-grade histogram.
 *
 * A histogram answers "what shape is this sample?". Two things make it
 * research-grade rather than decorative: a **density overlay** (so the shape is
 * not read off bar heights alone) and **reference markers** for the median and
 * mean, which is where a distribution's asymmetry becomes visible.
 *
 * Everything statistical arrives prepared. LUC UI bins nothing, fits nothing and
 * computes no percentile (§40) — it draws the caller's numbers.
 */
export declare function DistributionChart({ bins, density, references, signed, xFormat, format, tone, annotations, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: DistributionChartProps): import("react").JSX.Element;
export interface BoxPlotOutlier {
  /** Index into `categories`. */
  category: number;
  value: number;
}
export interface BoxPlotChartProps extends DistributionCommonProps {
  categories: readonly string[];
  data: ReadonlyArray<BoxPlotSummary | null>;
  outliers?: readonly BoxPlotOutlier[];
  format?: ChartFormat;
  tone?: SeriesTone;
  title?: string;
  description?: string;
}
/**
 * Box plot with optional prepared outliers.
 *
 * Every mark — body, median, whiskers, caps — is drawn at rest. Hover changes
 * the emphasis, never the presence: a reader who never touches the chart must
 * still see the distribution. Outliers arrive pre-computed — LUC UI never
 * decides what an outlier is.
 */
export declare function BoxPlotChart({ categories, data, outliers, format, tone, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: BoxPlotChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=distribution-charts.d.ts.map