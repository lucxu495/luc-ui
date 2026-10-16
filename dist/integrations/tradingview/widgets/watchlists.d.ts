import { TradingViewSymbolSector, TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/watchlists.d.ts
export type TradingViewMarketMode = "custom" | "market-movers";
export type TradingViewAssetType = "stocks" | "crypto";
export type TradingViewItemSize = "normal" | "compact";
export type TradingViewDirection = "horizontal" | "vertical";
/** Applies to every watchlist widget. */
export interface TradingViewWatchlistCommonProps extends TradingViewWidgetBaseProps {
  /** Symbol groups rendered as provider tabs. */
  symbolSectors?: readonly TradingViewSymbolSector[];
  /** Provider exchange filter, used by the market-movers mode. */
  exchange?: string;
  mode?: TradingViewMarketMode;
  assetsType?: TradingViewAssetType;
  itemSize?: TradingViewItemSize;
  symbolUrl?: string;
}
export interface TradingViewMarketSummaryProps extends TradingViewWatchlistCommonProps {
  timeFrame?: string;
  showTimeRange?: boolean;
  direction?: TradingViewDirection;
  hideMarketStatus?: boolean;
  layoutMode?: "flow" | "grid";
}
/**
 * A dense market row.
 *
 * `market-movers` follows the provider's own most-active / top-gainers lists;
 * `custom` renders the caller's `symbolSectors`.
 */
export declare function TradingViewMarketSummary({ symbolSectors, exchange, mode, assetsType, itemSize, timeFrame, showTimeRange, direction, hideMarketStatus, layoutMode, symbolUrl, theme, ...base }: TradingViewMarketSummaryProps): import("react").JSX.Element;
export interface TradingViewMarketOverviewProps extends TradingViewWatchlistCommonProps {
  timeFrame?: string;
  hideMarketStatus?: boolean;
  chartSize?: "compact" | "normal" | "large";
}
/** A market sidebar with a chart for the selected instrument. */
export declare function TradingViewMarketOverview({ symbolSectors, exchange, mode, assetsType, itemSize, chartSize, timeFrame, hideMarketStatus, symbolUrl, theme, ...base }: TradingViewMarketOverviewProps): import("react").JSX.Element;
export interface TradingViewMarketDataProps extends TradingViewWatchlistCommonProps {
  view?: "overview" | "performance";
  heatmap?: boolean;
}
/** A quote table for global market sections. */
export declare function TradingViewMarketData({ symbolSectors, view, heatmap, symbolUrl, theme, ...base }: TradingViewMarketDataProps): import("react").JSX.Element;
export interface TradingViewWorldMarketSummaryProps extends TradingViewWidgetBaseProps {
  view?: "map" | "list";
  sort?: "performance" | "alphabetical";
  hoverType?: "chart" | "performance-grid" | "chart-performance-grid";
  hideLegend?: boolean;
  hideViewToggle?: boolean;
  countries?: readonly string[];
  focusedCountries?: readonly string[];
  symbolUrl?: string;
}
/** World equity performance as a map or a list, by country. */
export declare function TradingViewWorldMarketSummary({ view, sort, hoverType, hideLegend, hideViewToggle, countries, focusedCountries, symbolUrl, theme, ...base }: TradingViewWorldMarketSummaryProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=watchlists.d.ts.map