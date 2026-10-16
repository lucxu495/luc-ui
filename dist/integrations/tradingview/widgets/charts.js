"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { isValidTradingViewSymbol, tradingViewSymbolHref } from "../core/markup.js";
import { TradingViewSymbolError } from "../core/surface.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { clean, providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/charts.tsx
const DEFINITIONS = {
	advancedChart: tradingViewWidgetById("advanced-chart"),
	symbolOverview: tradingViewWidgetById("symbol-overview"),
	miniChart: tradingViewWidgetById("mini-chart"),
	seasonalChart: tradingViewWidgetById("seasonal-chart")
};
const PRESETS = {
	minimal: {
		hide_top_toolbar: true,
		hide_side_toolbar: true,
		hide_legend: true,
		details: false,
		hotlist: false
	},
	standard: { hide_side_toolbar: true },
	analysis: {
		hide_side_toolbar: false,
		details: true,
		hotlist: true,
		save_image: true,
		withdateranges: true
	}
};
/**
* The full TradingView chart.
*
* iframe-based, so the inside is the provider's: LUC controls the theme colours
* it passes and the space it gives the chart, and nothing else. Attribution is
* the provider's own copyright block, rendered under the chart and never
* overlapped.
*/
function TradingViewAdvancedChart({ symbol, interval = "D", timezone = "Etc/UTC", style = "1", preset = "standard", hideTopToolbar, hideSideToolbar, hideLegend, hideVolume, allowSymbolChange = true, saveImage, withDateRanges, details, hotlist, watchlist, compareSymbols, studies, transparent = false, locale, config, theme, ...base }) {
	const { theme: resolvedTheme, palette } = useIframePalette({
		theme,
		withSurface: true
	});
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	const checked = symbol.trim();
	const ticker = checked.includes(":") ? checked.split(":")[1] : checked;
	const providerSettings = providerConfig({
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
		support_host: "https://www.tradingview.com"
	}, {
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
		watchlist: watchlist ? [...watchlist] : void 0,
		compareSymbols: compareSymbols ? compareSymbols.map((entry) => clean({ ...entry })) : void 0,
		studies: studies ? [...studies] : void 0,
		backgroundColor: palette?.background,
		gridColor: palette?.grid,
		...config
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.advancedChart,
		providerConfig: providerSettings,
		attribution: {
			href: tradingViewSymbolHref(checked),
			label: `${ticker} stock chart`
		},
		theme
	});
}
/**
* A compact multi-symbol chart.
*
* The provider's attribution for this widget is one link per symbol, which is
* why the wrapper passes the symbol list through rather than a single href.
*/
function TradingViewSymbolOverview({ symbols, chartType = "area", showVolume = false, showMA = false, hideDateRanges = false, hideMarketStatus = false, hideSymbolLogo = false, noTimeScale = false, transparent = false, locale, config, theme, ...base }) {
	const { theme: resolvedTheme, palette } = useIframePalette({
		theme,
		withSurface: true
	});
	const entries = symbols.map((entry) => ({
		...entry,
		ticker: entry.symbol.split("|")[0] ?? entry.symbol
	}));
	const providerSettings = providerConfig({
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
		dateRanges: [
			"1d|1",
			"1m|30",
			"3m|60",
			"12m|1D",
			"60m|1W",
			"all|1M"
		]
	}, {
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
		...config
	});
	const [first, ...rest] = entries;
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.symbolOverview,
		providerConfig: providerSettings,
		attribution: {
			href: first ? tradingViewSymbolHref(first.ticker) : "",
			label: first?.title ?? "Symbols",
			trailing: rest.map((entry) => ({
				href: tradingViewSymbolHref(entry.ticker),
				label: entry.title
			}))
		},
		theme
	});
}
/** Price, change and a sparkline. The default card-sized market widget. */
function TradingViewMiniChart({ symbol, timeFrame = "1D", lineChartType = "Area", showTimeRange, showTimeScale, hideMarketStatus, chartOnly, symbolUrl, theme, ...base }) {
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.miniChart,
		settings: {
			symbol: symbol.trim(),
			timeFrame,
			lineChartType,
			showTimeRange,
			showTimeScale,
			hideMarketStatus,
			chartOnly
		},
		symbolUrl,
		theme
	});
}
/** Multi-year seasonal pattern. A research view rather than a quote view. */
function TradingViewSeasonalChart({ symbol, symbolUrl, theme, ...rest }) {
	const { showAverage, hidePriceScale, showSeriesLabels, hideHeader, ...base } = rest;
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.seasonalChart,
		settings: {
			symbol: symbol.trim(),
			showAverage,
			hidePriceScale,
			showSeriesLabels,
			hideHeader
		},
		symbolUrl,
		theme
	});
}
//#endregion
export { TradingViewAdvancedChart, TradingViewMiniChart, TradingViewSeasonalChart, TradingViewSymbolOverview };

//# sourceMappingURL=charts.js.map