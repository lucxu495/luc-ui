import { ChartFormat, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/radial-charts.d.ts
export interface RadialCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
export interface RadarIndicator {
  name: string;
  /** Upper bound for the spoke. Defaults to the series maximum. */
  max?: number;
}
export interface RadarSeries {
  name: string;
  values: readonly number[];
  tone?: SeriesTone;
  color?: string;
}
export interface RadarChartProps extends RadialCommonProps {
  indicators: readonly RadarIndicator[];
  series: readonly RadarSeries[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Radar comparison.
 *
 * Two or three series, thin strokes, a low-alpha fill and no vertex symbols —
 * the classic radar failure mode is five heavy overlapping shapes with dots.
 */
export declare function RadarChart({ indicators, series, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: RadarChartProps): import("react").JSX.Element;
export interface GaugeThreshold {
  /** Upper bound of this zone. */
  value: number;
  tone?: SeriesTone;
  color?: string;
}
export interface GaugeChartProps extends RadialCommonProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  format?: ChartFormat;
  /** Ordered zones drawn along the track, lowest bound first. */
  thresholds?: readonly GaugeThreshold[];
  /** `semi` is a 200° arc; `ring` is a full 270° arc. */
  variant?: "semi" | "ring";
  title?: string;
  description?: string;
}
/**
 * Compact gauge.
 *
 * No pointer, no glossy arc, no purple gradient: a thin track, a single accent
 * progress stroke and a large tabular readout. It reads as instrumentation, not
 * as a car dashboard.
 */
export declare function GaugeChart({ value, min, max, label, format, thresholds, variant, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: GaugeChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=radial-charts.d.ts.map