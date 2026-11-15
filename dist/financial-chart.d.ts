import { AxisSide, YScaleMode } from "./charts/core/axis.js";
import { ChartFormat } from "./charts/types.js";
import { ChartTheme } from "./charts/core/theme-tokens.js";
import { LightweightChart } from "./charts/adapters/lightweight/runtime.js";
import { LightweightController } from "./charts/adapters/lightweight/chart-controller.js";
import "./charts/adapters/lightweight/lightweight-surface.js";
import { Candle, FinancialDataError, FinancialOverlay, IndicatorPane, IndicatorSeries, OverlayPoint, PriceSeriesData, PriceSeriesPoint, VolumePoint } from "./charts/financial/financial-data.js";
//#region src/charts/financial/financial-chart.d.ts
interface FinancialChartBaseProps {
  volume?: readonly VolumePoint[];
  overlays?: readonly FinancialOverlay[];
  indicators?: readonly IndicatorPane[];
  /** Price mark used when the source is OHLC. */
  mode?: "candlestick" | "line" | "area";
  /**
   * Controlled viewport in epoch milliseconds. `undefined` preserves reader
   * zoom after the first frame; `null` explicitly fits all loaded data.
   */
  range?: {
    from: number;
    to: number;
  } | null;
  priceFormat?: ChartFormat;
  volumeFormat?: ChartFormat;
  visibleOverlays?: readonly string[];
  showVolume?: boolean;
  /** Show the engine's last-price line and label in the primary price pane. */
  showPriceLine?: boolean;
  syncGroup?: string | null;
  priceScale?: {
    side?: AxisSide;
    mode?: YScaleMode;
  };
  state?: "ready" | "loading" | "empty" | "error";
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  showLegend?: boolean;
  /** Human-readable field names for the crosshair tooltip. */
  tooltipLabels?: Partial<{
    open: string;
    high: string;
    low: string;
    close: string;
    change: string;
    volume: string;
  }>;
  /**
   * Resolved chart theme for notebook/embedded hosts. The normal Light/Dark
   * path should omit this and inherit the design-system tokens.
   */
  themeOverride?: ChartTheme;
  onReady?: (chart: LightweightChart) => void;
  /**
   * Optional thin-controller escape hatch. `updateSeries` is the official
   * Lightweight `update()` path for high-frequency latest-point changes;
   * `setSeriesData` remains full-history replacement.
   */
  onControllerReady?: (controller: FinancialChartController) => void;
}
export type FinancialChartProps = FinancialChartBaseProps & ({
  candles: readonly Candle[];
  series?: undefined;
} | {
  candles?: undefined;
  /** Clean close/time series. No synthetic OHLC is created. */
  series: readonly PriceSeriesData[];
});
export interface FinancialChartController {
  readonly chart: LightweightChart | null;
  readonly controller: LightweightController | null;
  /** Append/update one OHLC candle or one primary close-only point. */
  updatePrice: (point: Candle | PriceSeriesPoint) => void;
  updateVolume: (point: VolumePoint) => void;
  updateOverlay: (id: string, point: OverlayPoint) => void;
  updateIndicator: (paneId: string, seriesId: string, point: OverlayPoint) => void;
  /** Official engine `update()` for a series key already known to the caller. */
  updateSeries: (id: string, item: Parameters<LightweightController["updateSeries"]>[1]) => void;
  /** Full-history replacement through the official `setData()` path. */
  setSeriesData: (id: string, data: Parameters<LightweightController["setSeriesData"]>[1]) => void;
  fit: () => void;
}
/**
 * Financial price chart for OHLC candles or clean close/time series.
 *
 * The component owns no indicator maths: overlays and pane series are
 * prepared by the caller. Data is validated, never repaired by interpolation
 * or gap filling. Chart creation, dynamic import, attribution, sync and range
 * application live in `LightweightSurface`.
 */
export declare function FinancialChart(props: FinancialChartProps): import("react").JSX.Element;
//#endregion
export { type Candle, FinancialDataError, type FinancialOverlay, type IndicatorPane, type IndicatorSeries, type OverlayPoint, type PriceSeriesData, type PriceSeriesPoint, type VolumePoint };
//# sourceMappingURL=financial-chart.d.ts.map