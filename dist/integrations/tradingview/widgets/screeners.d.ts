import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/screeners.d.ts
/**
 * Markets the provider's screener accepts. Kept as an open union: TradingView
 * adds exchanges over time, and pretending to validate the full list offline
 * would be worse than documenting the common ones.
 */
export type TradingViewScreenerMarket = "forex" | "america" | "crypto" | "india" | "uk" | "japan" | "australia" | "canada" | "germany" | "france" | "switzerland" | "italy" | "brazil" | "mexico" | "korea" | "singapore" | "taiwan" | "russia" | "china" | "hongkong" | "newzealand" | "spain" | "netherlands" | "sweden" | "norway" | "denmark" | "finland" | "poland" | "turkey" | "uae" | "saudi" | "southafrica" | (string & {});
export interface TradingViewScreenerProps extends TradingViewWidgetBaseProps {
  market?: TradingViewScreenerMarket;
  /** Provider column preset. */
  defaultColumn?: string;
  /** Provider screen preset, e.g. `general`, `top_gainers`. */
  defaultScreen?: string;
  showToolbar?: boolean;
  transparent?: boolean;
}
/**
 * The market screener.
 *
 * A filterable table owned entirely by the provider: LUC passes the market and
 * the presets, and gives the table a bounded box with its own scrolling.
 */
export declare function TradingViewScreener({ market, defaultColumn, defaultScreen, showToolbar, transparent, locale, theme, ...base }: TradingViewScreenerProps): import("react").JSX.Element;
export interface TradingViewCryptocurrencyMarketProps extends TradingViewWidgetBaseProps {
  /** `USD`, `EUR`… — the provider's display currency. */
  displayCurrency?: string;
  defaultColumn?: string;
  defaultScreen?: string;
  showToolbar?: boolean;
  transparent?: boolean;
}
/** The cryptocurrency market table. */
export declare function TradingViewCryptocurrencyMarket({ displayCurrency, defaultColumn, defaultScreen, showToolbar, transparent, locale, theme, ...base }: TradingViewCryptocurrencyMarketProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=screeners.d.ts.map