import { AxisSide, YScaleMode } from "./charts/core/axis.js";
import { ChartFormat, SeriesTone } from "./charts/types.js";
import { LightweightSeriesKind } from "./charts/adapters/lightweight/lightweight-surface.js";
//#region src/charts/financial/financial-chart.d.ts
export interface Candle {
  /** Epoch milliseconds, a `Date`, or an ISO date string. */
  time: number | string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface VolumePoint {
  time: number | string | Date;
  value: number;
  direction?: "up" | "down" | "neutral";
}
export interface OverlayPoint {
  time: number | string | Date;
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
  /** Draw the same scale as price (default) or its own overlay scale. */
  paneIndex?: number;
}
export interface IndicatorSeries {
  id: string;
  label?: string;
  kind: Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "bar">;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
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
export interface FinancialChartProps {
  candles: readonly Candle[];
  volume?: readonly VolumePoint[];
  overlays?: readonly FinancialOverlay[];
  indicators?: readonly IndicatorPane[];
  mode?: "candlestick" | "line" | "area";
  /** Trailing window. `null` fits all data; changing it never refetches. */
  range?: {
    from: number;
    to: number;
  } | null;
  priceFormat?: ChartFormat;
  volumeFormat?: ChartFormat;
  visibleOverlays?: readonly string[];
  showVolume?: boolean;
  syncGroup?: string | null;
  /**
   * Which plate the price uses and how it maps values. `linear` / `log` is the
   * same presentation contract as the analytical lane: the same real candles are
   * mapped either way, and nothing is transformed upstream.
   */
  priceScale?: {
    side?: AxisSide;
    mode?: YScaleMode;
  };
  state?: "ready" | "loading" | "empty" | "error";
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: unknown) => void;
}
/**
 * Financial price chart.
 *
 * Candles (or a price line/area), an optional volume pane and any number of
 * prepared indicator panes, behind one adapter that owns creation, resize,
 * theme, range and crosshair synchronisation. The consumer never sees
 * `createChart`.
 *
 * Calculations are the caller's responsibility: SMA, RSI, MACD and volatility
 * arrive as prepared series. This component draws what it is given.
 */
export declare function FinancialChart({ candles, volume, overlays, indicators, mode, range, priceFormat, volumeFormat, visibleOverlays, showVolume, syncGroup, priceScale, state, height, className, ariaLabel, ariaDescription, onReady }: FinancialChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=financial-chart.d.ts.map