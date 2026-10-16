import { ChartFormat } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/waterfall-chart.d.ts
export interface WaterfallItem {
  label: string;
  value: number;
  /** A subtotal bar: drawn from zero and coloured as a total. */
  total?: boolean;
}
export interface WaterfallChartProps {
  data: readonly WaterfallItem[];
  format?: ChartFormat;
  /** Horizontal waterfalls are the readable choice past ~10 steps. */
  orientation?: "vertical" | "horizontal";
  title?: string;
  description?: string;
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
/**
 * Waterfall.
 *
 * Two stacked series: an invisible base that positions each bar, and the visible
 * delta. Connector lines join consecutive levels, which is what makes a
 * waterfall readable at all. Increases use `positive`, decreases `negative`, and
 * subtotals use the accent — semantic colour, never the categorical palette.
 */
export declare function WaterfallChart({ data, format, orientation, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: WaterfallChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=waterfall-chart.d.ts.map