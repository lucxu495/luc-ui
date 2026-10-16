"use client";

import { tradingViewWidgetById } from "../core/catalog";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { TradingViewWebComponent } from "../web-components/web-component";
import { providerConfig, providerLocale, useIframePalette } from "./helpers";

const DEFINITIONS = {
  stock: tradingViewWidgetById("stock-heatmap")!,
  crypto: tradingViewWidgetById("crypto-heatmap")!,
  etf: tradingViewWidgetById("etf-heatmap")!,
  forex: tradingViewWidgetById("forex-table")!,
};

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

export function TradingViewStockHeatmap({
  dataSource = "SPX500",
  grouping = "sector",
  blockSize = "market_cap_basic",
  blockColor = "change",
  exchanges,
  hasTopBar = false,
  isZoomEnabled = true,
  hasSymbolTooltip = true,
  transparent = false,
  symbolUrl,
  locale,
  theme,
  ...base
}: TradingViewStockHeatmapProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
      isTransparent: false,
    },
    {
      locale: providerLocale(locale),
      dataSource,
      grouping,
      blockSize,
      blockColor,
      exchanges: exchanges ? [...exchanges] : undefined,
      hasTopBar,
      isZoomEnabled,
      hasSymbolTooltip,
      transparent,
      symbolUrl,
      colorTheme: resolvedTheme,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.stock}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/heatmap/stock/", label: "Stock Heatmap" }}
    />
  );
}

export interface TradingViewCryptoHeatmapProps extends TradingViewHeatmapCommonProps {
  dataSource?: string;
  blockSize?: "market_cap_calc" | "volume" | "24h_vol_cmc";
  blockColor?: "change" | "24h_close_change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.YTD" | "Perf.Y";
}

export function TradingViewCryptoHeatmap({
  dataSource = "Crypto",
  blockSize = "market_cap_calc",
  blockColor = "change",
  hasTopBar = false,
  isZoomEnabled = true,
  hasSymbolTooltip = true,
  transparent = false,
  symbolUrl,
  locale,
  theme,
  ...base
}: TradingViewCryptoHeatmapProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      dataSource: "Crypto",
      blockSize: "market_cap_calc",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
      isTransparent: false,
    },
    {
      locale: providerLocale(locale),
      dataSource,
      blockSize,
      blockColor,
      hasTopBar,
      isZoomEnabled,
      hasSymbolTooltip,
      transparent,
      symbolUrl,
      colorTheme: resolvedTheme,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.crypto}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/heatmap/crypto/", label: "Crypto Heatmap" }}
    />
  );
}

export interface TradingViewEtfHeatmapProps extends TradingViewHeatmapCommonProps {
  dataSource?: string;
  grouping?: "asset_class" | "no_group";
  blockSize?: "volume" | "AUM" | "market_cap_calc";
  blockColor?: "change" | "Perf.W" | "Perf.1M" | "Perf.3M" | "Perf.6M" | "Perf.YTD" | "Perf.Y";
}

export function TradingViewEtfHeatmap({
  dataSource = "AllUSEtf",
  grouping = "asset_class",
  blockSize = "volume",
  blockColor = "change",
  hasTopBar = false,
  isZoomEnabled = true,
  hasSymbolTooltip = true,
  transparent = false,
  symbolUrl,
  locale,
  theme,
  ...base
}: TradingViewEtfHeatmapProps) {
  const { theme: resolvedTheme } = useIframePalette({ theme });
  const config = providerConfig(
    {
      dataSource: "AllUSEtf",
      blockSize: "volume",
      blockColor: "change",
      grouping: "asset_class",
      locale: "en",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "100%",
      isTransparent: false,
    },
    {
      locale: providerLocale(locale),
      dataSource,
      grouping,
      blockSize,
      blockColor,
      hasTopBar,
      isZoomEnabled,
      hasSymbolTooltip,
      transparent,
      symbolUrl,
      colorTheme: resolvedTheme,
    },
  );
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.etf}
      providerConfig={config}
      theme={theme}
      attribution={{ href: "https://www.tradingview.com/heatmap/etf/", label: "ETF Heatmap" }}
    />
  );
}

export interface TradingViewForexTableProps extends TradingViewWidgetBaseProps {
  /** Currency codes shown in the matrix. The provider requires at least two. */
  currencies?: readonly string[];
  displayedValue?: "rate" | "dailyChange";
  heatmap?: boolean;
  symbolUrl?: string;
}

/** A currency cross-rate matrix, optionally heat-coloured. */
export function TradingViewForexTable({
  currencies,
  displayedValue,
  heatmap,
  symbolUrl,
  theme,
  ...base
}: TradingViewForexTableProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.forex}
      settings={{
        currencies: currencies ? currencies.map((code) => code.trim().toUpperCase()).filter(Boolean) : undefined,
        displayedValue,
        heatmap,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}
