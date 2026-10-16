import { TradingViewRawConfig, TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/charts.d.ts
export type TradingViewChartInterval = "1" | "3" | "5" | "15" | "30" | "45" | "60" | "120" | "180" | "240" | "D" | "W" | "M";
/** TradingView's documented `style` values. */
export type TradingViewChartStyle = "0" | "1" | "2" | "3" | "8" | "9" | "10";
export interface TradingViewCompareSymbol {
  symbol: string;
  position?: "SameScale" | "NewPriceScale" | "NewPane";
}
/**
 * How much chart chrome LUC asks for.
 *
 * `minimal` is a candles-and-volume reading surface; `standard` adds the top
 * toolbar; `analysis` opens the drawing tooling. The booleans below stay
 * available for callers who need something the presets do not cover.
 */
export type TradingViewChartPreset = "minimal" | "standard" | "analysis";
export interface TradingViewAdvancedChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  interval?: TradingViewChartInterval;
  timezone?: string;
  style?: TradingViewChartStyle;
  preset?: TradingViewChartPreset;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  hideLegend?: boolean;
  hideVolume?: boolean;
  allowSymbolChange?: boolean;
  saveImage?: boolean;
  withDateRanges?: boolean;
  details?: boolean;
  hotlist?: boolean;
  watchlist?: readonly string[];
  compareSymbols?: readonly TradingViewCompareSymbol[];
  studies?: readonly string[];
  transparent?: boolean;
}
/**
 * The full TradingView chart.
 *
 * iframe-based, so the inside is the provider's: LUC controls the theme colours
 * it passes and the space it gives the chart, and nothing else. Attribution is
 * the provider's own copyright block, rendered under the chart and never
 * overlapped.
 */
export declare function TradingViewAdvancedChart({ symbol, interval, timezone, style, preset, hideTopToolbar, hideSideToolbar, hideLegend, hideVolume, allowSymbolChange, saveImage, withDateRanges, details, hotlist, watchlist, compareSymbols, studies, transparent, locale, config, theme, ...base }: TradingViewAdvancedChartProps): import("react").JSX.Element;
export interface TradingViewSymbolOverviewEntry {
  /** Display name used by the provider's attribution line. */
  title: string;
  /** `TICKER|INTERVAL`, e.g. `AAPL|1D`. */
  symbol: string;
}
export interface TradingViewSymbolOverviewProps extends TradingViewWidgetBaseProps {
  symbols: readonly TradingViewSymbolOverviewEntry[];
  chartType?: "area" | "line" | "candlesticks" | "bars" | "heikin-ashi" | "hollow-candles" | "baseline";
  showVolume?: boolean;
  showMA?: boolean;
  hideDateRanges?: boolean;
  hideMarketStatus?: boolean;
  hideSymbolLogo?: boolean;
  noTimeScale?: boolean;
  transparent?: boolean;
}
/**
 * A compact multi-symbol chart.
 *
 * The provider's attribution for this widget is one link per symbol, which is
 * why the wrapper passes the symbol list through rather than a single href.
 */
export declare function TradingViewSymbolOverview({ symbols, chartType, showVolume, showMA, hideDateRanges, hideMarketStatus, hideSymbolLogo, noTimeScale, transparent, locale, config, theme, ...base }: TradingViewSymbolOverviewProps): import("react").JSX.Element;
export interface TradingViewMiniChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  timeFrame?: string;
  lineChartType?: "Area" | "Line" | "Baseline";
  showTimeRange?: boolean;
  showTimeScale?: boolean;
  hideMarketStatus?: boolean;
  chartOnly?: boolean;
  symbolUrl?: string;
}
/** Price, change and a sparkline. The default card-sized market widget. */
export declare function TradingViewMiniChart({ symbol, timeFrame, lineChartType, showTimeRange, showTimeScale, hideMarketStatus, chartOnly, symbolUrl, theme, ...base }: TradingViewMiniChartProps): import("react").JSX.Element;
export interface TradingViewSeasonalChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  showAverage?: boolean;
  hidePriceScale?: boolean;
  showSeriesLabels?: boolean;
  hideHeader?: boolean;
  symbolUrl?: string;
}
/** Multi-year seasonal pattern. A research view rather than a quote view. */
export declare function TradingViewSeasonalChart({ symbol, symbolUrl, theme, ...rest }: TradingViewSeasonalChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=charts.d.ts.map