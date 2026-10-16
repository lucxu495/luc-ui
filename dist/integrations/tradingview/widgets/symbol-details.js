"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { isValidTradingViewSymbol, tradingViewSymbolHref } from "../core/markup.js";
import { TradingViewSymbolError } from "../core/surface.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/symbol-details.tsx
const DEFINITIONS = {
	symbolInfo: tradingViewWidgetById("symbol-info"),
	technicalAnalysis: tradingViewWidgetById("technical-analysis"),
	fundamentalData: tradingViewWidgetById("fundamental-data"),
	companyProfile: tradingViewWidgetById("company-profile")
};
function tickerOf(symbol) {
	return symbol.includes(":") ? symbol.split(":")[1] : symbol;
}
/** Key facts for one symbol. */
function TradingViewSymbolInfo({ symbol, transparent = false, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	const checked = symbol.trim();
	const config = providerConfig({
		symbol: "NASDAQ:AAPL",
		width: "100%",
		height: "100%",
		locale: "en",
		colorTheme: "light",
		isTransparent: false
	}, {
		symbol: checked,
		locale: providerLocale(locale),
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.symbolInfo,
		providerConfig: config,
		theme,
		attribution: {
			href: tradingViewSymbolHref(checked),
			label: `${tickerOf(checked)} performance`
		}
	});
}
/**
* Provider-computed technical ratings.
*
* LUC does not compute the rating and does not receive it — this is TradingView's
* own summary, shown as an embed.
*/
function TradingViewTechnicalAnalysis({ symbol, interval, ratingsMode, ratingsDisplayMode, hideLogoAndName, hideIntervals, noLinks, symbolUrl, theme, ...base }) {
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.technicalAnalysis,
		settings: {
			symbol: symbol.trim(),
			interval,
			ratingsMode,
			ratingsDisplayMode,
			hideLogoAndName,
			hideIntervals,
			noLinks
		},
		symbolUrl,
		theme
	});
}
/** Income statement, balance sheet and cash-flow figures. */
function TradingViewFundamentalData({ symbol, displayMode = "regular", transparent = false, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	const checked = symbol.trim();
	const config = providerConfig({
		isTransparent: false,
		largeChartUrl: "",
		displayMode: "regular",
		width: "100%",
		height: "100%",
		colorTheme: "light",
		symbol: "NASDAQ:AAPL",
		locale: "en"
	}, {
		symbol: checked,
		displayMode,
		locale: providerLocale(locale),
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.fundamentalData,
		providerConfig: config,
		theme,
		attribution: {
			href: tradingViewSymbolHref(checked, "financials-overview/"),
			label: `${tickerOf(checked)} fundamentals`
		}
	});
}
/** Company description, sector and key figures. */
function TradingViewCompanyProfile({ symbol, symbolUrl, theme, ...base }) {
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.companyProfile,
		settings: { symbol: symbol.trim() },
		symbolUrl,
		theme
	});
}
//#endregion
export { TradingViewCompanyProfile, TradingViewFundamentalData, TradingViewSymbolInfo, TradingViewTechnicalAnalysis };

//# sourceMappingURL=symbol-details.js.map