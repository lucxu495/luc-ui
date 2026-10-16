import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/symbol-details.d.ts
export interface TradingViewSymbolInfoProps extends TradingViewWidgetBaseProps {
  symbol: string;
  transparent?: boolean;
}
/** Key facts for one symbol. */
export declare function TradingViewSymbolInfo({ symbol, transparent, locale, theme, ...base }: TradingViewSymbolInfoProps): import("react").JSX.Element;
export interface TradingViewTechnicalAnalysisProps extends TradingViewWidgetBaseProps {
  symbol: string;
  interval?: string;
  ratingsMode?: "single" | "multiple";
  ratingsDisplayMode?: "gauge" | "gauge-and-breakdown" | "breakdown";
  hideLogoAndName?: boolean;
  hideIntervals?: boolean;
  noLinks?: boolean;
  symbolUrl?: string;
}
/**
 * Provider-computed technical ratings.
 *
 * LUC does not compute the rating and does not receive it — this is TradingView's
 * own summary, shown as an embed.
 */
export declare function TradingViewTechnicalAnalysis({ symbol, interval, ratingsMode, ratingsDisplayMode, hideLogoAndName, hideIntervals, noLinks, symbolUrl, theme, ...base }: TradingViewTechnicalAnalysisProps): import("react").JSX.Element;
export interface TradingViewFundamentalDataProps extends TradingViewWidgetBaseProps {
  symbol: string;
  displayMode?: "regular" | "compact" | "adaptive";
  transparent?: boolean;
}
/** Income statement, balance sheet and cash-flow figures. */
export declare function TradingViewFundamentalData({ symbol, displayMode, transparent, locale, theme, ...base }: TradingViewFundamentalDataProps): import("react").JSX.Element;
export interface TradingViewCompanyProfileProps extends TradingViewWidgetBaseProps {
  symbol: string;
  symbolUrl?: string;
}
/** Company description, sector and key figures. */
export declare function TradingViewCompanyProfile({ symbol, symbolUrl, theme, ...base }: TradingViewCompanyProfileProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=symbol-details.d.ts.map