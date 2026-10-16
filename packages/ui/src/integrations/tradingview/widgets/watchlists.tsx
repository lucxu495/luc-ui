"use client";

import { tradingViewWidgetById } from "../core/catalog";
import { serializeSymbolSectors } from "../core/markup";
import type { TradingViewSymbolSector, TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewWebComponent } from "../web-components/web-component";

const DEFINITIONS = {
  marketSummary: tradingViewWidgetById("market-summary")!,
  marketOverview: tradingViewWidgetById("market-overview")!,
  marketData: tradingViewWidgetById("market-data")!,
  worldMarketSummary: tradingViewWidgetById("world-market-summary")!,
};

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
export function TradingViewMarketSummary({
  symbolSectors,
  exchange,
  mode,
  assetsType,
  itemSize,
  timeFrame,
  showTimeRange,
  direction,
  hideMarketStatus,
  layoutMode,
  symbolUrl,
  theme,
  ...base
}: TradingViewMarketSummaryProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.marketSummary}
      settings={{
        symbolSectors: serializeSymbolSectors(symbolSectors),
        exchange,
        mode,
        assetsType,
        itemSize,
        timeFrame,
        showTimeRange,
        direction,
        hideMarketStatus,
        layoutMode,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

export interface TradingViewMarketOverviewProps extends TradingViewWatchlistCommonProps {
  timeFrame?: string;
  hideMarketStatus?: boolean;
  chartSize?: "compact" | "normal" | "large";
}

/** A market sidebar with a chart for the selected instrument. */
export function TradingViewMarketOverview({
  symbolSectors,
  exchange,
  mode,
  assetsType,
  itemSize,
  chartSize,
  timeFrame,
  hideMarketStatus,
  symbolUrl,
  theme,
  ...base
}: TradingViewMarketOverviewProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.marketOverview}
      settings={{
        symbolSectors: serializeSymbolSectors(symbolSectors),
        exchange,
        mode,
        assetsType,
        itemSize,
        chartSize,
        timeFrame,
        hideMarketStatus,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

export interface TradingViewMarketDataProps extends TradingViewWatchlistCommonProps {
  view?: "overview" | "performance";
  heatmap?: boolean;
}

/** A quote table for global market sections. */
export function TradingViewMarketData({
  symbolSectors,
  view,
  heatmap,
  symbolUrl,
  theme,
  ...base
}: TradingViewMarketDataProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.marketData}
      settings={{ symbolSectors: serializeSymbolSectors(symbolSectors), view, heatmap }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

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
export function TradingViewWorldMarketSummary({
  view,
  sort,
  hoverType,
  hideLegend,
  hideViewToggle,
  countries,
  focusedCountries,
  symbolUrl,
  theme,
  ...base
}: TradingViewWorldMarketSummaryProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.worldMarketSummary}
      settings={{
        view,
        sort,
        hoverType,
        hideLegend,
        hideViewToggle,
        countries: countries ? [...countries] : undefined,
        focusedCountries: focusedCountries ? [...focusedCountries] : undefined,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}
