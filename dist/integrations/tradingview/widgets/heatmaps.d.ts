import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/heatmaps.d.ts
/**
 * A financial heatmap keeps the provider's red/green semantics.
 *
 * This is the one place LUC deliberately does *not* impose its own palette: the
 * colour **is** the data. Only the surrounding chrome (theme, surface, locale)
 * is mapped.
 */
export interface TradingViewHeatmapCommonProps extends TradingViewWidgetBaseProps {
  transparent?: boolean;
  /** Redirect symbol clicks to your own site. */
  symbolUrl?: string;
  /** Zoombar, tooltips and top bar, all provider features. */
  hasTopBar?: boolean;
  isZoomEnabled?: boolean;
  hasSymbolTooltip?: boolean;
}
export interface TradingViewStockHeatmapProps extends TradingViewHeatmapCommonProps {
  dataSource?: string;
  grouping?: "sector" | "no_group";
  blockSize?: "market_cap_basic" | "volume";
  blockColor?: "change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.YTD" | "Perf.Y";
  exchanges?: readonly string[];
}
export declare function TradingViewStockHeatmap({ dataSource, grouping, blockSize, blockColor, exchanges, hasTopBar, isZoomEnabled, hasSymbolTooltip, transparent, symbolUrl, locale, theme, ...base }: TradingViewStockHeatmapProps): import("react").JSX.Element;
export interface TradingViewCryptoHeatmapProps extends TradingViewHeatmapCommonProps {
  dataSource?: string;
  blockSize?: "market_cap_calc" | "volume" | "24h_vol_cmc";
  blockColor?: "change" | "24h_close_change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.YTD" | "Perf.Y";
}
export declare function TradingViewCryptoHeatmap({ dataSource, blockSize, blockColor, hasTopBar, isZoomEnabled, hasSymbolTooltip, transparent, symbolUrl, locale, theme, ...base }: TradingViewCryptoHeatmapProps): import("react").JSX.Element;
export interface TradingViewEtfHeatmapProps extends TradingViewHeatmapCommonProps {
  dataSource?: string;
  grouping?: "asset_class" | "no_group";
  blockSize?: "volume" | "AUM" | "market_cap_calc";
  blockColor?: "change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.YTD" | "Perf.Y";
}
export declare function TradingViewEtfHeatmap({ dataSource, grouping, blockSize, blockColor, hasTopBar, isZoomEnabled, hasSymbolTooltip, transparent, symbolUrl, locale, theme, ...base }: TradingViewEtfHeatmapProps): import("react").JSX.Element;
export interface TradingViewForexTableProps extends TradingViewWidgetBaseProps {
  /** Currency codes shown in the matrix. The provider requires at least two. */
  currencies?: readonly string[];
  displayedValue?: "rate" | "dailyChange";
  heatmap?: boolean;
  symbolUrl?: string;
}
/** A currency cross-rate matrix, optionally heat-coloured. */
export declare function TradingViewForexTable({ currencies, displayedValue, heatmap, symbolUrl, theme, ...base }: TradingViewForexTableProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=heatmaps.d.ts.map