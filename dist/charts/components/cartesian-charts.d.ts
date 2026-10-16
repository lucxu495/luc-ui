import { ChartFamily, ChartSpec } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/cartesian-charts.d.ts
export interface CartesianChartProps<TRow extends object = Record<string, unknown>> extends Omit<ChartSpec<TRow>, "family"> {
  /** Override the family the wrapper defaults to. Advanced. */
  family?: ChartFamily;
  state?: ChartState;
  height?: number | string;
  className?: string;
  visibleSeries?: readonly string[];
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
/**
 * Line chart. `series[].smooth` gives the smooth variant, `series[].step` the
 * step variant, and a series with `area: true` the area variant — all from the
 * same component so a "line family" page cannot drift into three styles.
 */
export declare const LineChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
/** Same engine path as `LineChart` with area fills on by default. */
export declare const AreaChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
/**
 * Bar chart. `orientation="horizontal"` swaps the axes; `series[].stack` groups
 * bars, and `series[].stackMode="percent"` normalises them to 100%.
 */
export declare const BarChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
/** Scatter plot. Data comes from `xKey` plus one numeric key per series. */
export declare const ScatterChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
/** Bubble chart — the same as scatter with a larger, emphasis-friendly symbol. */
export declare const BubbleChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
/** Line + bar + area + dual axis, in one plot. Axis ids make the split explicit. */
export declare const ComposedChart: <TRow extends object = Record<string, unknown>>({ family, state, height, className, visibleSeries, ariaLabel, ariaDescription, onReady, onEvent, ...spec }: CartesianChartProps<TRow>) => import("react").JSX.Element;
//#endregion
export type { ChartSpec };
//# sourceMappingURL=cartesian-charts.d.ts.map