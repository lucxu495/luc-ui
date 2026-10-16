import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/news.d.ts
/**
 * Which feed the timeline shows.
 *
 * The provider's own enum (its embed script validates `feedMode` against
 * exactly these three values): a *mode* name, not a symbol. `symbol` mode shows
 * one instrument's stories and reads the instrument from the settings — passing
 * a symbol here is silently ignored and falls back to the global feed.
 */
export type TradingViewTopStoriesFeedMode = "all_symbols" | "market" | "symbol";
export interface TradingViewTopStoriesProps extends TradingViewWidgetBaseProps {
  /** Which timeline to show. Default `all_symbols` (the provider's global feed). */
  feedMode?: TradingViewTopStoriesFeedMode;
  /** The instrument whose feed is shown. Required by `feedMode="symbol"`. */
  symbol?: string;
  /** The market whose timeline is shown. Used by `feedMode="market"`. */
  market?: string;
  displayMode?: "regular" | "compact" | "adaptive";
  transparent?: boolean;
}
/**
 * The provider's market news timeline.
 *
 * LUC renders none of this content and stores none of it: the feed is the
 * provider's, and the wrapper only allocates the space and the theme.
 */
export declare function TradingViewTopStories({ feedMode, symbol, market, displayMode, transparent, locale, theme, ...base }: TradingViewTopStoriesProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=news.d.ts.map