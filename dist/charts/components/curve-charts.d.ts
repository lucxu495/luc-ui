import { YScaleMode } from "../core/axis.js";
import { AnnotationSpec, ChartFormat, ChartInteractionSpec, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/curve-charts.d.ts
export interface CurveDefinition {
  name: string;
  values: readonly (number | null)[];
  tone?: SeriesTone;
  /**
   * Pinned palette slot (1-based). A series that keeps one identity across
   * several charts — an era, a benchmark, a historical cycle — takes the same
   * slot everywhere, so colour stays a name rather than an accident of order.
   */
  palette?: number;
  /** The curve to emphasise: thicker stroke, full opacity. */
  emphasis?: boolean;
  lineType?: "solid" | "dashed" | "dotted";
}
export interface CurveComparisonChartProps {
  xLabels: readonly (string | number)[];
  curves: readonly CurveDefinition[];
  xLabel?: string;
  yLabel?: string;
  format?: ChartFormat;
  /**
   * The format of a **numeric** x axis, when it is not the value format.
   *
   * A term structure's tenor is a count of years and a cycle path's x is a count
   * of days: both are numbers, and neither should inherit the y axis' percent or
   * currency format. Absent, the numeric x keeps the value format (a curve whose
   * two axes are the same measure).
   */
  xFormat?: ChartFormat;
  annotations?: AnnotationSpec;
  interaction?: ChartInteractionSpec;
  syncGroup?: string;
  visibleSeries?: readonly string[];
  /**
   * The **presentation** scale of the shared y axis.
   *
   * A multi-cycle indexed price path, a growth curve and a long-horizon price
   * model are read across orders of magnitude, where a linear axis flattens
   * everything before the latest move. Switching the scale re-maps the same
   * served values; nothing upstream is transformed, and a window holding a
   * non-positive value falls back to linear rather than dropping it.
   */
  scaleMode?: YScaleMode;
  /**
   * Which scale modes the caller may offer. Absent with no `scaleMode` keeps the
   * chart linear-only (the historical behaviour).
   */
  allowedScaleModes?: readonly YScaleMode[];
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
 * Curves that share an ordered x axis.
 *
 * Deliberately generic: an interest-rate curve, a volatility smile, a yield
 * curve and a factor profile are the same visual problem. Consumers pass
 * prepared values; LUC UI never derives a curve.
 */
export declare function CurveComparisonChart({ xLabels, curves, xLabel, yLabel, format, xFormat, annotations, interaction, syncGroup, visibleSeries, scaleMode, allowedScaleModes, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: CurveComparisonChartProps): import("react").JSX.Element;
export interface TermStructureChartProps extends Omit<CurveComparisonChartProps, "xLabels"> {
  /** Tenors: years, month counts or expiry labels. Sorted ascending internally. */
  tenors: readonly (string | number)[];
}
/**
 * Term structure (rates, futures, volatility by expiry).
 *
 * A thin specialisation of the curve chart: the tenor axis is ordered and the
 * tooltip names the tenor rather than an index.
 */
export declare function TermStructureChart({ tenors, ...props }: TermStructureChartProps): import("react").JSX.Element;
export interface DepthPoint {
  price: number;
  /** Cumulative size available at or better than this price. */
  size: number;
}
export interface DepthChartProps {
  bids: readonly DepthPoint[];
  asks: readonly DepthPoint[];
  mid?: number;
  priceFormat?: ChartFormat;
  sizeFormat?: ChartFormat;
  title?: string;
  description?: string;
  state?: ChartState;
  height?: number | string;
  className?: string;
  syncGroup?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
/**
 * Market-depth / order-book depth.
 *
 * Two prepared cumulative curves around a mid price. Both sides are area series
 * on a shared price axis, so the crossing point reads as the spread.
 */
export declare function DepthChart({ bids, asks, mid, priceFormat, sizeFormat, title, description, state, height, className, syncGroup, ariaLabel, ariaDescription, onReady, onEvent }: DepthChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=curve-charts.d.ts.map