"use client";

import { tradingViewWidgetById } from "../core/catalog";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { providerConfig, providerLocale, useIframePalette } from "./helpers";

const SCREENER = tradingViewWidgetById("screener")!;
const CRYPTO = tradingViewWidgetById("crypto-mkt-screener")!;

/**
 * Markets the provider's screener accepts. Kept as an open union: TradingView
 * adds exchanges over time, and pretending to validate the full list offline
 * would be worse than documenting the common ones.
 */
export type TradingViewScreenerMarket =
  | "forex"
  | "america"
  | "crypto"
  | "india"
  | "uk"
  | "japan"
  | "australia"
  | "canada"
  | "germany"
  | "france"
  | "switzerland"
  | "italy"
  | "brazil"
  | "mexico"
  | "korea"
  | "singapore"
  | "taiwan"
  | "russia"
  | "china"
  | "hongkong"
  | "newzealand"
  | "spain"
  | "netherlands"
  | "sweden"
  | "norway"
  | "denmark"
  | "finland"
  | "poland"
  | "turkey"
  | "uae"
  | "saudi"
  | "southafrica"
  | (string & {});

/** The provider's attribution link differs per market; so does its label. */
const MARKET_ATTRIBUTION: Record<string, { href: string; label: string }> = {
  forex: { href: "https://www.tradingview.com/markets/currencies/", label: "Forex Screener" },
  america: { href: "https://www.tradingview.com/markets/stocks-usa/", label: "Stock Screener" },
  crypto: { href: "https://www.tradingview.com/markets/cryptocurrencies/prices-all/", label: "Crypto Screener" },
};

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
export function TradingViewScreener({
  market = "forex",
  defaultColumn = "overview",
  defaultScreen = "general",
  showToolbar = true,
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewScreenerProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      width: "100%",
      height: 550,
      defaultColumn: "overview",
      defaultScreen: "general",
      market: "forex",
      showToolbar: true,
      colorTheme: "light",
      locale: "en",
      isTransparent: false,
    },
    {
      market,
      defaultColumn,
      defaultScreen,
      showToolbar,
      locale: providerLocale(locale),
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  const attribution = MARKET_ATTRIBUTION[market] ?? {
    href: "https://www.tradingview.com/markets/",
    label: "Screener",
  };
  return (
    <TradingViewIframe
      {...base}
      definition={SCREENER}
      providerConfig={config}
      theme={theme}
      attribution={attribution}
    />
  );
}

export interface TradingViewCryptocurrencyMarketProps extends TradingViewWidgetBaseProps {
  /** `USD`, `EUR`… — the provider's display currency. */
  displayCurrency?: string;
  defaultColumn?: string;
  defaultScreen?: string;
  showToolbar?: boolean;
  transparent?: boolean;
}

/** The cryptocurrency market table. */
export function TradingViewCryptocurrencyMarket({
  displayCurrency = "USD",
  defaultColumn = "overview",
  defaultScreen = "general",
  showToolbar = true,
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewCryptocurrencyMarketProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      width: "100%",
      height: 490,
      defaultColumn: "overview",
      market: "crypto",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      isTransparent: false,
      colorTheme: "light",
      locale: "en",
      showToolbar: true,
    },
    {
      displayCurrency,
      defaultColumn,
      defaultScreen,
      showToolbar,
      locale: providerLocale(locale),
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={CRYPTO}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/markets/cryptocurrencies/prices-all/", label: "Crypto markets" }}
    />
  );
}
