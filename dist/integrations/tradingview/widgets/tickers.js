"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { assertTradingViewSymbol, isValidTradingViewSymbol } from "../core/markup.js";
import { TradingViewSymbolError } from "../core/surface.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/tickers.tsx
const DEFINITIONS = {
	tickerTape: tradingViewWidgetById("ticker-tape"),
	tickers: tradingViewWidgetById("tickers"),
	singleTicker: tradingViewWidgetById("single-ticker"),
	tickerTag: tradingViewWidgetById("ticker-tag")
};
/**
* The scrolling ticker strip.
*
* A horizontal tape defines its own height, so give the box the provider's own
* measurement rather than stretching it. The scroll motion is the provider's;
* TradingView exposes no reduced-motion switch for it, and LUC does not fake one
* by freezing a live widget.
*/
function TradingViewTickerTape({ symbols, direction, itemSize, hideChart, lineChartType, showHover, hoverType, hideLogo, noLinks, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.tickerTape,
		settings: {
			symbols: symbols.map((entry) => entry.trim()).filter(Boolean),
			direction,
			itemSize,
			hideChart,
			lineChartType,
			showHover,
			hoverType,
			hideLogo,
			noLinks
		},
		symbolUrl,
		theme
	});
}
/** A ticker strip with price, change and an optional inline chart. */
function TradingViewTickers({ symbols, theme, symbolUrl, ...rest }) {
	const { direction, itemSize, hideChart, lineChartType, showHover, hoverType, hideLogo, noLinks, ...base } = rest;
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.tickers,
		settings: {
			symbols: symbols.map((entry) => entry.trim()).filter(Boolean),
			direction,
			itemSize,
			hideChart,
			lineChartType,
			showHover,
			hoverType,
			hideLogo,
			noLinks
		},
		symbolUrl,
		theme
	});
}
/** One instrument: name, price and change. */
function TradingViewSingleTicker({ symbol, hideMarketStatus, symbolUrl, theme, ...base }) {
	if (!isValidTradingViewSymbol(symbol)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.singleTicker,
		settings: {
			symbol: symbol.trim(),
			hideMarketStatus
		},
		symbolUrl,
		theme
	});
}
/**
* The inline market chip.
*
* Sized for prose, tables and metadata rows: it inherits the surrounding line
* height, so it composes inside a sentence without breaking the baseline.
*/
function TradingViewTickerTag({ symbol, size, hideChange, hideBackground, preserveText, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.tickerTag,
		settings: {
			symbol: assertTradingViewSymbol(symbol),
			size,
			hideChange,
			hideBackground,
			preserveText
		},
		placeholder: /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "inline-block h-4 w-16 rounded-xs bg-surface-interactive align-middle"
		}),
		symbolUrl,
		theme
	});
}
//#endregion
export { TradingViewSingleTicker, TradingViewTickerTag, TradingViewTickerTape, TradingViewTickers };

//# sourceMappingURL=tickers.js.map