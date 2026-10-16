import { ChartFormat } from "../types.js";
import { Candle } from "../../financial-chart.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/quantitative-charts.d.ts
/**
 * Quantitative finance charts.
 *
 * The rule from `docs/CHART_GUIDE.md` applies with extra force here: **LUC UI
 * never computes a financial metric.** A drawdown is supplied, an implied
 * volatility is supplied, a factor exposure is supplied. Nothing in this file
 * differences a price series, fits a smile or solves an optimisation — those
 * belong to the analysis layer, where they can be reviewed, versioned and tied
 * to a data version. The charts exist to *present* those outputs faithfully.
 */
export interface CandleOverlay {
  label: string;
  /** One value per candle; `null` leaves a gap (never interpolated). */
  values: readonly (number | null)[];
}
export interface CandlestickChartProps extends FamilyCommonProps {
  candles: readonly Candle[];
  /** Overlaid lines (moving averages, bands) — supplied, not computed. */
  overlays?: readonly CandleOverlay[];
  priceFormat?: ChartFormat;
  timeFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Candlestick — the ECharts rendition, alongside the Lightweight Charts one.
 *
 * Two engines, two jobs. `@luc/ui/financial-chart` is the interactive trading
 * surface (pan, zoom, real-time updates, the provider's own scales). This one
 * exists so a candle chart can live *inside* an analytics composition — a grid,
 * a dashboard, a print view — where the Lightweight surface's own scroll model
 * and mandatory attribution logo are the wrong shape. Neither computes
 * anything; both take the same OHLC rows.
 */
export declare function CandlestickChart({ candles, overlays, priceFormat, timeFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: CandlestickChartProps): import("react").JSX.Element;
export interface DrawdownChartProps extends FamilyCommonProps {
  /** `value` is the supplied drawdown: negative for a loss, 0 at a high. */
  points: readonly {
    time: number;
    value: number;
  }[];
  /** Format of an *already ratio-scaled* value. Defaults to percent from ratio. */
  format?: ChartFormat;
  timeFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Underwater (drawdown) curve.
 *
 * The values are the caller's — this component does not difference a price
 * series to find the running peak. The area is anchored at zero and the axis
 * never pads above it, because a percentage *gain* in a drawdown chart is a
 * number that does not exist (see V1.3's headroom rule).
 */
export declare function DrawdownChart({ points, format, timeFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: DrawdownChartProps): import("react").JSX.Element;
export interface VolatilitySlice {
  /** Label drawn in the legend — an expiry, a tenor, a date. */
  expiry: string;
  points: readonly {
    strike: number;
    impliedVol: number;
  }[];
}
export interface VolatilitySmileChartProps extends FamilyCommonProps {
  slices: readonly VolatilitySlice[];
  strikeFormat?: ChartFormat;
  /** Implied volatility, already in the caller's units (e.g. 0.42 or 42). */
  volFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Volatility smile — implied volatility against strike, one curve per expiry.
 *
 * The smile shape is whatever the market supplied; nothing is interpolated or
 * extrapolated between strikes. An empty window simply has fewer points, which
 * is the honest picture a recalibrating surface should give.
 */
export declare function VolatilitySmileChart({ slices, strikeFormat, volFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: VolatilitySmileChartProps): import("react").JSX.Element;
export interface FrontierPoint {
  label?: string;
  /** Expected risk (standard deviation or any supplied unit). */
  risk: number;
  /** Expected return, in the same units as the axis format. */
  expectedReturn: number;
}
export interface EfficientFrontierChartProps extends FamilyCommonProps {
  /** Individual assets or portfolios. */
  assets: readonly FrontierPoint[];
  /** The efficient frontier itself, ordered by risk. */
  frontier?: readonly FrontierPoint[];
  /** The currently held portfolio. */
  current?: FrontierPoint;
  riskFormat?: ChartFormat;
  returnFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Risk/return map with an efficient frontier.
 *
 * LUC does not solve the optimisation: the frontier is supplied as ordered
 * points, so the caller can state the constraints it used. The current
 * portfolio is a marker rather than a second chart, which is what makes "where
 * am I relative to the frontier" a glance instead of an analysis.
 */
export declare function EfficientFrontierChart({ assets, frontier, current, riskFormat, returnFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: EfficientFrontierChartProps): import("react").JSX.Element;
export interface FactorExposureChartProps extends FamilyCommonProps {
  factors: readonly {
    label: string;
    value: number;
  }[];
  /** Zero-centred by default: an exposure is a signed quantity. */
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/** Factor exposure — a zero-centred bar per factor, coloured by sign. */
export declare function FactorExposureChart({ factors, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: FactorExposureChartProps): import("react").JSX.Element;
export interface PnlAttributionChartProps extends FamilyCommonProps {
  /** Periods along the axis, e.g. months. */
  periods: readonly string[];
  series: readonly {
    label: string;
    /** One signed contribution per period. */
    values: readonly number[];
  }[];
  /** `stacked` (default) shows the total per period; `grouped` compares them. */
  variant?: "stacked" | "grouped";
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * P&L attribution — signed contributions by source over time.
 *
 * Because a contribution can be negative, a stacked variant uses ECharts'
 * signed stacking, so a losing factor visibly *subtracts* from the column
 * instead of being drawn on top of the winners.
 */
export declare function PnlAttributionChart({ periods, series, variant, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: PnlAttributionChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=quantitative-charts.d.ts.map