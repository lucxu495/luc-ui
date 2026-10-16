import { ChartFormat } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
import { AxisFragmentOptions, Option } from "../adapters/echarts/option.js";
//#region src/charts/components/chart-common.d.ts
export interface FamilyCommonProps {
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
/** A point in a two-dimensional series. */
export interface XYPoint {
  x: number;
  y: number;
}
/** Anything with a label and a value. */
export interface LabelledValue {
  label: string;
  value: number;
}
/**
 * Format a 0–1 ratio as a percentage.
 *
 * `ChartFormat` deliberately expects an *already scaled* percentage (`42.5` →
 * `"42.5%"`), because that is what a price or a return already is. A probability
 * is the other convention: `0.425`. The renderer scales it, once, at the display
 * boundary — the caller keeps its ratio, and no chart in the library ever
 * silently multiplies a data value.
 */
export declare function formatRatio(value: number | null | undefined, decimals?: number): string;
/** A 0–1 value axis whose ticks are percentages (see `formatRatio`). */
export declare function ratioAxis(options: AxisFragmentOptions): Option;
/** A 0–1 axis: percentage by default, the caller's own format when given. */
export declare function ratioOrFormatAxis(format: ChartFormat | undefined, options: AxisFragmentOptions): Option;
/** A 0–1 value in a tooltip: percentage by default, the caller's format when given. */
export declare function formatRatioOrValue(value: number | null | undefined, format: ChartFormat | undefined): string;
//#endregion
export type { ChartFormat };
//# sourceMappingURL=chart-common.d.ts.map