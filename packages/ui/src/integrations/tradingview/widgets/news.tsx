"use client";

import { tradingViewWidgetById } from "../core/catalog";
import { isValidTradingViewSymbol } from "../core/markup";
import { TradingViewSymbolError } from "../core/surface";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { providerConfig, providerLocale, useIframePalette } from "./helpers";

const TOP_STORIES = tradingViewWidgetById("top-stories")!;

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
export function TradingViewTopStories({
  feedMode = "all_symbols",
  symbol,
  market,
  displayMode = "regular",
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewTopStoriesProps) {
  const trimmed = symbol?.trim() ?? "";
  const { theme: resolvedTheme } = useIframePalette({ theme });
  /*
   * A symbol feed without a usable symbol is not a smaller feed — it is the
   * global one. Refusing it is the only honest answer, and it stays bounded
   * (the caller sees the same provider-symbol error the other wrappers use).
   */
  if (feedMode === "symbol" && !isValidTradingViewSymbol(trimmed)) return <TradingViewSymbolError />;
  const config = providerConfig(
    {
      feedMode: "all_symbols",
      isTransparent: false,
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "light",
      locale: "en",
    },
    {
      feedMode,
      symbol: feedMode === "symbol" ? trimmed : undefined,
      market: feedMode === "market" ? market : undefined,
      locale: providerLocale(locale),
      displayMode,
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={TOP_STORIES}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/news/top-providers/tradingview/", label: "Top stories" }}
    />
  );
}
