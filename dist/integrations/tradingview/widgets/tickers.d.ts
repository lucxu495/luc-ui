import { TradingViewWidgetBaseProps } from "../core/types.js";
import { TradingViewDirection, TradingViewItemSize } from "./watchlists.js";
//#region src/integrations/tradingview/widgets/tickers.d.ts
export type TradingViewHoverType = "chart" | "performance-grid" | "chart-performance-grid";
export interface TradingViewTickerTapeProps extends TradingViewWidgetBaseProps {
  symbols: readonly string[];
  direction?: TradingViewDirection;
  itemSize?: TradingViewItemSize;
  hideChart?: boolean;
  lineChartType?: "Area" | "Line" | "Baseline";
  showHover?: boolean;
  hoverType?: TradingViewHoverType;
  /** Removes the provider's own logo mark. Attribution links stay. */
  hideLogo?: boolean;
  /** Disables symbol links entirely. Attribution links stay. */
  noLinks?: boolean;
  symbolUrl?: string;
}
/**
 * The scrolling ticker strip.
 *
 * A horizontal tape defines its own height, so give the box the provider's own
 * measurement rather than stretching it. The scroll motion is the provider's;
 * TradingView exposes no reduced-motion switch for it, and LUC does not fake one
 * by freezing a live widget.
 */
export declare function TradingViewTickerTape({ symbols, direction, itemSize, hideChart, lineChartType, showHover, hoverType, hideLogo, noLinks, symbolUrl, theme, ...base }: TradingViewTickerTapeProps): import("react").JSX.Element;
/** Same contract as the tape — the provider ships both from one schema. */
export type TradingViewTickersProps = TradingViewTickerTapeProps;
/** A ticker strip with price, change and an optional inline chart. */
export declare function TradingViewTickers({ symbols, theme, symbolUrl, ...rest }: TradingViewTickersProps): import("react").JSX.Element;
export interface TradingViewSingleTickerProps extends TradingViewWidgetBaseProps {
  symbol: string;
  hideMarketStatus?: boolean;
  symbolUrl?: string;
}
/** One instrument: name, price and change. */
export declare function TradingViewSingleTicker({ symbol, hideMarketStatus, symbolUrl, theme, ...base }: TradingViewSingleTickerProps): import("react").JSX.Element;
export interface TradingViewTickerTagProps extends TradingViewWidgetBaseProps {
  symbol: string;
  size?: "small" | "medium" | "large";
  hideChange?: boolean;
  hideBackground?: boolean;
  /**
   * When a `symbol` is set, use the element's own text as the display name.
   * Pass the label through `children`.
   */
  preserveText?: boolean;
  symbolUrl?: string;
  children?: React.ReactNode;
}
/**
 * The inline market chip.
 *
 * Sized for prose, tables and metadata rows: it inherits the surrounding line
 * height, so it composes inside a sentence without breaking the baseline.
 */
export declare function TradingViewTickerTag({ symbol, size, hideChange, hideBackground, preserveText, symbolUrl, theme, ...base }: TradingViewTickerTagProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=tickers.d.ts.map