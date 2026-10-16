import { AnnotationSpec, ChartFormat, ChartInteractionSpec } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/band-charts.d.ts
export interface BandChartCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  annotations?: AnnotationSpec;
  interaction?: ChartInteractionSpec;
  syncGroup?: string;
  title?: string;
  description?: string;
}
/** One time point of a band: a centre and its low/high edges. */
export interface BandPoint {
  t: string | number | Date;
  center: number;
  lower: number;
  upper: number;
}
export interface RangeBandChartProps extends BandChartCommonProps {
  points: readonly BandPoint[];
  format?: ChartFormat;
  /** Label for the band in the tooltip, e.g. "90% interval". */
  bandLabel?: string;
}
/**
 * RangeBandChart — a line with an interval around it.
 *
 * The honest picture of an estimate with uncertainty: the centre is a line, the
 * interval is one translucent band (never two more lines, which reads as four
 * series). Consumers pass prepared bounds; LUC UI never computes an interval.
 */
export declare function RangeBandChart({ points, format, bandLabel, annotations, interaction, syncGroup, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: RangeBandChartProps): import("react").JSX.Element;
/** One quantile band of a fan: an explicit low and high at each time point. */
export interface FanBand {
  /** e.g. "P5–P95". Shown in the tooltip and the legend. */
  label: string;
  lower: readonly number[];
  upper: readonly number[];
}
export interface FanChartProps extends BandChartCommonProps {
  /** Shared time axis, one entry per array element of every band and the median. */
  x: readonly (string | number | Date)[];
  /** Bands ordered widest → narrowest, which is also the draw order. */
  bands: readonly FanBand[];
  median: readonly number[];
  format?: ChartFormat;
  /** Draw the median as a line (default) or as a filled area. */
  medianMode?: "line" | "area";
}
/**
 * FanChart — nested quantile bands around a median.
 *
 * The canonical uncertainty visualisation: a Monte-Carlo path cloud, a bootstrap
 * interval, a forecast cone. Bands are one hue at layered opacity (see
 * `fanPalette`), because five hues would read as five unrelated series; the
 * shared hue says "this is all the same estimate".
 *
 * Every quantile arrives prepared. LUC UI does not simulate.
 */
export declare function FanChart({ x, bands, median, format, medianMode, annotations, syncGroup, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: FanChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=band-charts.d.ts.map