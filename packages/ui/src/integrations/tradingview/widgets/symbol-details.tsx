"use client";

import { tradingViewWidgetById } from "../core/catalog";
import { isValidTradingViewSymbol, tradingViewSymbolHref } from "../core/markup";
import { TradingViewSymbolError } from "../core/surface";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { TradingViewWebComponent } from "../web-components/web-component";
import { providerConfig, providerLocale, useIframePalette } from "./helpers";

const DEFINITIONS = {
  symbolInfo: tradingViewWidgetById("symbol-info")!,
  technicalAnalysis: tradingViewWidgetById("technical-analysis")!,
  fundamentalData: tradingViewWidgetById("fundamental-data")!,
  companyProfile: tradingViewWidgetById("company-profile")!,
};

function tickerOf(symbol: string) {
  return symbol.includes(":") ? symbol.split(":")[1]! : symbol;
}

export interface TradingViewSymbolInfoProps extends TradingViewWidgetBaseProps {
  symbol: string;
  transparent?: boolean;
}

/** Key facts for one symbol. */
export function TradingViewSymbolInfo({
  symbol,
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewSymbolInfoProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  const checked = symbol.trim();
  const config = providerConfig(
    { symbol: "NASDAQ:AAPL", width: "100%", height: "100%", locale: "en", colorTheme: "light", isTransparent: false },
    {
      symbol: checked,
      locale: providerLocale(locale),
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.symbolInfo}
      providerConfig={config}
      theme={theme}
      attribution={{ href: tradingViewSymbolHref(checked), label: `${tickerOf(checked)} performance` }}
    />
  );
}

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
export function TradingViewTechnicalAnalysis({
  symbol,
  interval,
  ratingsMode,
  ratingsDisplayMode,
  hideLogoAndName,
  hideIntervals,
  noLinks,
  symbolUrl,
  theme,
  ...base
}: TradingViewTechnicalAnalysisProps) {
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.technicalAnalysis}
      settings={{
        symbol: symbol.trim(),
        interval,
        ratingsMode,
        ratingsDisplayMode,
        hideLogoAndName,
        hideIntervals,
        noLinks,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

export interface TradingViewFundamentalDataProps extends TradingViewWidgetBaseProps {
  symbol: string;
  displayMode?: "regular" | "compact" | "adaptive";
  transparent?: boolean;
}

/** Income statement, balance sheet and cash-flow figures. */
export function TradingViewFundamentalData({
  symbol,
  displayMode = "regular",
  transparent = false,
  locale,
  theme,
  ...base
}: TradingViewFundamentalDataProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  const checked = symbol.trim();
  const config = providerConfig(
    {
      isTransparent: false,
      largeChartUrl: "",
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "light",
      symbol: "NASDAQ:AAPL",
      locale: "en",
    },
    {
      symbol: checked,
      displayMode,
      locale: providerLocale(locale),
      colorTheme: resolvedTheme,
      isTransparent: transparent,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.fundamentalData}
      providerConfig={config}
      theme={theme}
      attribution={{
        href: tradingViewSymbolHref(checked, "financials-overview/"),
        label: `${tickerOf(checked)} fundamentals`,
      }}
    />
  );
}

export interface TradingViewCompanyProfileProps extends TradingViewWidgetBaseProps {
  symbol: string;
  symbolUrl?: string;
}

/** Company description, sector and key figures. */
export function TradingViewCompanyProfile({
  symbol,
  symbolUrl,
  theme,
  ...base
}: TradingViewCompanyProfileProps) {
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.companyProfile}
      settings={{ symbol: symbol.trim() }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}
