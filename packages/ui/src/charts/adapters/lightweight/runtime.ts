/**
 * Lightweight Charts runtime.
 *
 * Loaded through a dynamic import so nothing touches `window` during SSR, and
 * memoised so every financial chart on a page shares one download.
 *
 * TradingView Lightweight Charts is Apache-2.0 **with an attribution
 * requirement**. The adapter keeps `layout.attributionLogo` enabled; that logo
 * is the required notice and is never hidden. Do not disable it.
 */

import type * as LightweightCharts from "lightweight-charts";

export type LightweightModule = typeof LightweightCharts;
export type LightweightChart = ReturnType<LightweightModule["createChart"]>;
export type LightweightSeries = ReturnType<LightweightChart["addSeries"]>;
export type LightweightPane = ReturnType<LightweightChart["panes"]>[number];
export type LightweightPriceLine = ReturnType<LightweightSeries["createPriceLine"]>;
export type LightweightSeriesKind = "candlestick" | "line" | "area" | "histogram" | "baseline" | "bar";
export type LightweightTime = LightweightCharts.Time;
export type LightweightUTCTimestamp = LightweightCharts.UTCTimestamp;
export type LightweightSeriesData =
  | LightweightCharts.CandlestickData<LightweightCharts.Time>
  | LightweightCharts.LineData<LightweightCharts.Time>
  | LightweightCharts.AreaData<LightweightCharts.Time>
  | LightweightCharts.HistogramData<LightweightCharts.Time>
  | LightweightCharts.BaselineData<LightweightCharts.Time>
  | LightweightCharts.BarData<LightweightCharts.Time>
  | LightweightCharts.WhitespaceData<LightweightCharts.Time>;
export type LightweightMouseEvent = LightweightCharts.MouseEventParams<LightweightCharts.Time>;

export type {
  BusinessDay,
  CandlestickData,
  CustomData,
  CustomSeriesOptions,
  ICustomSeriesPaneView,
  IPaneApi,
  IPanePrimitive,
  IPriceLine,
  ISeriesApi,
  ISeriesPrimitive,
  LineData,
  MouseEventParams,
  SeriesMarker,
  SeriesMarkerPosition,
  SeriesMarkerShape,
  Time,
  UTCTimestamp,
} from "lightweight-charts";

let loading: Promise<LightweightModule> | null = null;

export function loadLightweightCharts(): Promise<LightweightModule> {
  if (!loading) loading = import("lightweight-charts");
  return loading;
}

/** Chart engines take seconds; Luc UI's canonical time unit is milliseconds. */
export function toChartTime(ms: number): LightweightCharts.UTCTimestamp {
  return Math.floor(ms / 1000) as LightweightCharts.UTCTimestamp;
}

export function fromChartTime(time: LightweightCharts.Time): number | null {
  if (typeof time === "number") return time * 1000;
  if (typeof time === "string") {
    const parsed = Date.parse(time);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (time && typeof time === "object" && "year" in time) {
    return Date.UTC(time.year, time.month - 1, time.day);
  }
  return null;
}
