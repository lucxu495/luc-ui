"use client";

import { tradingViewWidgetById } from "../core/catalog";
import { assertTradingViewSymbol, isValidTradingViewSymbol } from "../core/markup";
import { TradingViewSymbolError } from "../core/surface";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewWebComponent } from "../web-components/web-component";
import type { TradingViewDirection, TradingViewItemSize } from "./watchlists";

const DEFINITIONS = {
  tickerTape: tradingViewWidgetById("ticker-tape")!,
  tickers: tradingViewWidgetById("tickers")!,
  singleTicker: tradingViewWidgetById("single-ticker")!,
  tickerTag: tradingViewWidgetById("ticker-tag")!,
};

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
export function TradingViewTickerTape({
  symbols,
  direction,
  itemSize,
  hideChart,
  lineChartType,
  showHover,
  hoverType,
  hideLogo,
  noLinks,
  symbolUrl,
  theme,
  ...base
}: TradingViewTickerTapeProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.tickerTape}
      settings={{
        symbols: symbols.map((entry) => entry.trim()).filter(Boolean),
        direction,
        itemSize,
        hideChart,
        lineChartType,
        showHover,
        hoverType,
        hideLogo,
        noLinks,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

/** Same contract as the tape — the provider ships both from one schema. */
export type TradingViewTickersProps = TradingViewTickerTapeProps;

/** A ticker strip with price, change and an optional inline chart. */
export function TradingViewTickers({ symbols, theme, symbolUrl, ...rest }: TradingViewTickersProps) {
  const { direction, itemSize, hideChart, lineChartType, showHover, hoverType, hideLogo, noLinks, ...base } = rest;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.tickers}
      settings={{
        symbols: symbols.map((entry) => entry.trim()).filter(Boolean),
        direction,
        itemSize,
        hideChart,
        lineChartType,
        showHover,
        hoverType,
        hideLogo,
        noLinks,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

export interface TradingViewSingleTickerProps extends TradingViewWidgetBaseProps {
  symbol: string;
  hideMarketStatus?: boolean;
  symbolUrl?: string;
}

/** One instrument: name, price and change. */
export function TradingViewSingleTicker({
  symbol,
  hideMarketStatus,
  symbolUrl,
  theme,
  ...base
}: TradingViewSingleTickerProps) {
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.singleTicker}
      settings={{ symbol: symbol.trim(), hideMarketStatus }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

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
export function TradingViewTickerTag({
  symbol,
  size,
  hideChange,
  hideBackground,
  preserveText,
  symbolUrl,
  theme,
  ...base
}: TradingViewTickerTagProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.tickerTag}
      settings={{
        symbol: assertTradingViewSymbol(symbol),
        size,
        hideChange,
        hideBackground,
        preserveText,
      }}
      /*
       * An inline widget: the placeholder is a chip-shaped span so the tag stays
       * valid inside a paragraph. A block-level skeleton — a `div` — would be
       * re-parented by the HTML parser and break hydration. It carries the
       * skeleton's surface without the shimmer sweep, which is noise at chip
       * size and inside prose.
       */
      placeholder={
        <span
          aria-hidden="true"
          className="inline-block h-4 w-16 rounded-xs bg-surface-interactive align-middle"
        />
      }
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}
