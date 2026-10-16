import { ChartFormat } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/composition-charts.d.ts
export interface CompositionCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
export interface CategoryValue {
  name: string;
  value: number;
}
export interface PieChartProps extends CompositionCommonProps {
  data: readonly CategoryValue[];
  /** Donut by default: a ring reads better next to a metric than a solid disc. */
  variant?: "donut" | "pie";
  format?: ChartFormat;
  /** Optional value printed in the middle of a donut. */
  centerLabel?: string;
  centerValue?: string;
  title?: string;
  description?: string;
}
/**
 * Part-to-whole composition.
 *
 * Deliberately capped at six slices: past that a pie stops being readable, and
 * the Showcase's chart-selection guidance says so. Series beyond the cap stay in
 * the data and appear in the tooltip only through the legend/table the caller
 * renders.
 */
export declare function PieChart({ data, variant, format, centerLabel, centerValue, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: PieChartProps): import("react").JSX.Element;
export interface HierarchyNode {
  name: string;
  value?: number;
  children?: readonly HierarchyNode[];
}
export interface TreemapChartProps extends CompositionCommonProps {
  data: readonly HierarchyNode[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function TreemapChart({ data, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: TreemapChartProps): import("react").JSX.Element;
export interface SunburstChartProps extends CompositionCommonProps {
  data: readonly HierarchyNode[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function SunburstChart({ data, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: SunburstChartProps): import("react").JSX.Element;
export interface FunnelChartProps extends CompositionCommonProps {
  data: readonly CategoryValue[];
  format?: ChartFormat;
  /** Value printed next to each stage name inside the funnel. */
  showValues?: boolean;
  title?: string;
  description?: string;
}
export declare function FunnelChart({ data, format, showValues, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: FunnelChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=composition-charts.d.ts.map