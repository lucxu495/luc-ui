"use client";

import { tradingViewWidgetById } from "../core/catalog";
import { isValidTradingViewSymbol, tradingViewSymbolHref } from "../core/markup";
import { TradingViewSymbolError } from "../core/surface";
import type { TradingViewRawConfig, TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewIframe } from "../iframe/iframe-embed";
import { TradingViewWebComponent } from "../web-components/web-component";
import { clean, providerConfig, providerLocale, useIframePalette } from "./helpers";

const DEFINITIONS = {
  advancedChart: tradingViewWidgetById("advanced-chart")!,
  symbolOverview: tradingViewWidgetById("symbol-overview")!,
  miniChart: tradingViewWidgetById("mini-chart")!,
  seasonalChart: tradingViewWidgetById("seasonal-chart")!,
};

/* -------------------------------------------------------------------------- */
/* Advanced Chart (iframe)                                                    */
/* -------------------------------------------------------------------------- */

export type TradingViewChartInterval =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "45"
  | "60"
  | "120"
  | "180"
  | "240"
  | "D"
  | "W"
  | "M";

/** TradingView's documented `style` values. */
export type TradingViewChartStyle =
  | "0" // bars
  | "1" // candles
  | "2" // line
  | "3" // area
  | "8" // heikin ashi
  | "9" // hollow candles
  | "10"; // baseline

export interface TradingViewCompareSymbol {
  symbol: string;
  position?: "SameScale" | "NewPriceScale" | "NewPane";
}

/**
 * How much chart chrome LUC asks for.
 *
 * `minimal` is a candles-and-volume reading surface; `standard` adds the top
 * toolbar; `analysis` opens the drawing tooling. The booleans below stay
 * available for callers who need something the presets do not cover.
 */
export type TradingViewChartPreset = "minimal" | "standard" | "analysis";

export interface TradingViewAdvancedChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  interval?: TradingViewChartInterval;
  timezone?: string;
  style?: TradingViewChartStyle;
  preset?: TradingViewChartPreset;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  hideLegend?: boolean;
  hideVolume?: boolean;
  allowSymbolChange?: boolean;
  saveImage?: boolean;
  withDateRanges?: boolean;
  details?: boolean;
  hotlist?: boolean;
  watchlist?: readonly string[];
  compareSymbols?: readonly TradingViewCompareSymbol[];
  studies?: readonly string[];
  transparent?: boolean;
}

const PRESETS: Record<TradingViewChartPreset, Record<string, unknown>> = {
  minimal: { hide_top_toolbar: true, hide_side_toolbar: true, hide_legend: true, details: false, hotlist: false },
  standard: { hide_side_toolbar: true },
  analysis: { hide_side_toolbar: false, details: true, hotlist: true, save_image: true, withdateranges: true },
};

/**
 * The full TradingView chart.
 *
 * iframe-based, so the inside is the provider's: LUC controls the theme colours
 * it passes and the space it gives the chart, and nothing else. Attribution is
 * the provider's own copyright block, rendered under the chart and never
 * overlapped.
 */
export function TradingViewAdvancedChart({
  symbol,
  interval = "D",
  timezone = "Etc/UTC",
  style = "1",
  preset = "standard",
  hideTopToolbar,
  hideSideToolbar,
  hideLegend,
  hideVolume,
  allowSymbolChange = true,
  saveImage,
  withDateRanges,
  details,
  hotlist,
  watchlist,
  compareSymbols,
  studies,
  transparent = false,
  locale,
  config,
  theme,
  ...base
}: TradingViewAdvancedChartProps) {
  const { theme: resolvedTheme, palette } = useIframePalette({ theme, withSurface: true });
  // A symbol the provider cannot accept is a bounded construction failure, not
  // a render crash: `TradingViewSymbolError` is what the caller sees instead.
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  const checked = symbol.trim();
  const ticker = checked.includes(":") ? checked.split(":")[1]! : checked;

  const providerSettings = providerConfig(
    {
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: "D",
      locale: "en",
      save_image: true,
      style: "1",
      symbol: "NASDAQ:AAPL",
      theme: "light",
      timezone: "Etc/UTC",
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true,
      isTransparent: false,
      support_host: "https://www.tradingview.com",
    },
    {
      ...PRESETS[preset],
      symbol: checked,
      interval,
      timezone,
      style,
      locale: providerLocale(locale),
      theme: resolvedTheme,
      isTransparent: transparent,
      hide_top_toolbar: hideTopToolbar ?? PRESETS[preset].hide_top_toolbar,
      hide_side_toolbar: hideSideToolbar ?? PRESETS[preset].hide_side_toolbar,
      hide_legend: hideLegend ?? PRESETS[preset].hide_legend,
      hide_volume: hideVolume,
      allow_symbol_change: allowSymbolChange,
      save_image: saveImage ?? PRESETS[preset].save_image,
      withdateranges: withDateRanges ?? PRESETS[preset].withdateranges,
      details: details ?? PRESETS[preset].details,
      hotlist: hotlist ?? PRESETS[preset].hotlist,
      watchlist: watchlist ? [...watchlist] : undefined,
      compareSymbols: compareSymbols ? compareSymbols.map((entry) => clean({ ...entry })) : undefined,
      studies: studies ? [...studies] : undefined,
      // LUC surfaces, so the chart sits inside a card instead of on top of it.
      backgroundColor: palette?.background,
      gridColor: palette?.grid,
      ...config,
    },
  );

  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.advancedChart}
      providerConfig={providerSettings}
      attribution={{ href: tradingViewSymbolHref(checked), label: `${ticker} stock chart` }}
      theme={theme}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Symbol Overview (iframe)                                                   */
/* -------------------------------------------------------------------------- */

export interface TradingViewSymbolOverviewEntry {
  /** Display name used by the provider's attribution line. */
  title: string;
  /** `TICKER|INTERVAL`, e.g. `AAPL|1D`. */
  symbol: string;
}

export interface TradingViewSymbolOverviewProps extends TradingViewWidgetBaseProps {
  symbols: readonly TradingViewSymbolOverviewEntry[];
  chartType?: "area" | "line" | "candlesticks" | "bars" | "heikin-ashi" | "hollow-candles" | "baseline";
  showVolume?: boolean;
  showMA?: boolean;
  hideDateRanges?: boolean;
  hideMarketStatus?: boolean;
  hideSymbolLogo?: boolean;
  noTimeScale?: boolean;
  transparent?: boolean;
}

/**
 * A compact multi-symbol chart.
 *
 * The provider's attribution for this widget is one link per symbol, which is
 * why the wrapper passes the symbol list through rather than a single href.
 */
export function TradingViewSymbolOverview({
  symbols,
  chartType = "area",
  showVolume = false,
  showMA = false,
  hideDateRanges = false,
  hideMarketStatus = false,
  hideSymbolLogo = false,
  noTimeScale = false,
  transparent = false,
  locale,
  config,
  theme,
  ...base
}: TradingViewSymbolOverviewProps) {
  const { theme: resolvedTheme, palette } = useIframePalette({ theme, withSurface: true });
  const entries = symbols.map((entry) => ({
    ...entry,
    ticker: entry.symbol.split("|")[0] ?? entry.symbol,
  }));

  const providerSettings = providerConfig(
    {
      symbols: [],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "light",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      headerFontSize: "medium",
      lineWidth: 2,
      lineType: 0,
      isTransparent: false,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    },
    {
      symbols: entries.map((entry) => [entry.title, entry.symbol]),
      locale: providerLocale(locale),
      chartType,
      showVolume,
      showMA,
      hideDateRanges,
      hideMarketStatus,
      hideSymbolLogo,
      noTimeScale,
      colorTheme: resolvedTheme,
      isTransparent: transparent,
      backgroundColor: palette?.background,
      gridLineColor: palette?.grid,
      fontColor: palette?.muted,
      widgetFontColor: palette?.foreground,
      ...config,
    },
  );

  const [first, ...rest] = entries;
  return (
    <TradingViewIframe
      {...base}
      definition={DEFINITIONS.symbolOverview}
      providerConfig={providerSettings}
      attribution={{
        href: first ? tradingViewSymbolHref(first.ticker) : "",
        label: first?.title ?? "Symbols",
        trailing: rest.map((entry) => ({ href: tradingViewSymbolHref(entry.ticker), label: entry.title })),
      }}
      theme={theme}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Mini Chart (Web Component)                                                 */
/* -------------------------------------------------------------------------- */

export interface TradingViewMiniChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  timeFrame?: string;
  lineChartType?: "Area" | "Line" | "Baseline";
  showTimeRange?: boolean;
  showTimeScale?: boolean;
  hideMarketStatus?: boolean;
  chartOnly?: boolean;
  symbolUrl?: string;
}

/** Price, change and a sparkline. The default card-sized market widget. */
export function TradingViewMiniChart({
  symbol,
  timeFrame = "1D",
  lineChartType = "Area",
  showTimeRange,
  showTimeScale,
  hideMarketStatus,
  chartOnly,
  symbolUrl,
  theme,
  ...base
}: TradingViewMiniChartProps) {
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.miniChart}
      settings={{
        symbol: symbol.trim(),
        timeFrame,
        lineChartType,
        showTimeRange,
        showTimeScale,
        hideMarketStatus,
        chartOnly,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Seasonal Chart (Web Component)                                             */
/* -------------------------------------------------------------------------- */

export interface TradingViewSeasonalChartProps extends TradingViewWidgetBaseProps {
  symbol: string;
  showAverage?: boolean;
  hidePriceScale?: boolean;
  showSeriesLabels?: boolean;
  hideHeader?: boolean;
  symbolUrl?: string;
}

/** Multi-year seasonal pattern. A research view rather than a quote view. */
export function TradingViewSeasonalChart({ symbol, symbolUrl, theme, ...rest }: TradingViewSeasonalChartProps) {
  const { showAverage, hidePriceScale, showSeriesLabels, hideHeader, ...base } = rest;
  if (!isValidTradingViewSymbol(symbol)) return <TradingViewSymbolError />;
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.seasonalChart}
      settings={{
        symbol: symbol.trim(),
        showAverage,
        hidePriceScale,
        showSeriesLabels,
        hideHeader,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}

export type { TradingViewRawConfig };
