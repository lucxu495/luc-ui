import { ChartFormat, SeriesTone } from "../types.js";
import { LightweightSeriesKind } from "../adapters/lightweight/runtime.js";
//#region src/charts/financial/financial-data.d.ts
export type FinancialTime = number | string | Date;
export interface Candle {
  /** Epoch milliseconds, a `Date`, or an ISO-8601 string. */
  time: FinancialTime;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface VolumePoint {
  time: FinancialTime;
  value: number;
  direction?: "up" | "down" | "neutral";
}
export interface OverlayPoint {
  time: FinancialTime;
  /**
   * `null` is explicit whitespace. It becomes a time-only item for Lightweight
   * Charts; it is never interpolated or replaced with a nearby value.
   */
  value: number | null;
}
export interface FinancialOverlay {
  id: string;
  label: string;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  lineType?: "solid" | "dashed" | "dotted";
  /**
   * `0` shares the price pane. A positive value selects an additional pane
   * lane after the optional volume pane; lanes are packed continuously.
   */
  paneIndex?: number;
  referenceLines?: readonly number[];
}
export interface IndicatorSeries {
  id: string;
  label?: string;
  kind: Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "baseline">;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  /** Format only the values this pane series contributes to the tooltip. */
  format?: ChartFormat;
}
export interface IndicatorPane {
  id: string;
  label: string;
  series: readonly IndicatorSeries[];
  /** Horizontal guides, e.g. 30/70 for an oscillator. */
  referenceLines?: readonly number[];
  /** Share of the chart height. Price pane defaults to 3. */
  stretch?: number;
}
/**
 * These native series consume one close value per time. Bar and candlestick
 * remain available through the typed `onReady`/`LightweightSurface` escape
 * hatch when the caller actually has OHLC rows.
 */
export type PriceSeriesKind = Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "baseline">;
export interface PriceSeriesPoint {
  time: FinancialTime;
  /** `null` is whitespace, exactly as in an overlay series. */
  close: number | null;
}
/**
 * A clean close-only price series for comparison charts and notebook output.
 *
 * A financial chart takes either `candles` or `series`, not both. Indicators
 * remain separate prepared panes, so the price input never has to pretend to be
 * OHLC data merely to get a lower Sharpe pane.
 */
export interface PriceSeriesData {
  /** Stable across renders. Defaults to `price-${index}` when omitted. */
  id?: string;
  label?: string;
  kind?: PriceSeriesKind;
  data: readonly PriceSeriesPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  /** `0` is the price pane; positive values choose a packed additional lane. */
  paneIndex?: number;
  referenceLines?: readonly number[];
}
export declare class FinancialDataError extends Error {
  readonly code: "time" | "order" | "duplicate-time" | "value" | "ohlc" | "range" | "reference" | "identity";
  constructor(code: FinancialDataError["code"], message: string);
}
//#endregion
//# sourceMappingURL=financial-data.d.ts.map