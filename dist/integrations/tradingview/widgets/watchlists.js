"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { serializeSymbolSectors } from "../core/markup.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/watchlists.tsx
const DEFINITIONS = {
	marketSummary: tradingViewWidgetById("market-summary"),
	marketOverview: tradingViewWidgetById("market-overview"),
	marketData: tradingViewWidgetById("market-data"),
	worldMarketSummary: tradingViewWidgetById("world-market-summary")
};
/**
* A dense market row.
*
* `market-movers` follows the provider's own most-active / top-gainers lists;
* `custom` renders the caller's `symbolSectors`.
*/
function TradingViewMarketSummary({ symbolSectors, exchange, mode, assetsType, itemSize, timeFrame, showTimeRange, direction, hideMarketStatus, layoutMode, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.marketSummary,
		settings: {
			symbolSectors: serializeSymbolSectors(symbolSectors),
			exchange,
			mode,
			assetsType,
			itemSize,
			timeFrame,
			showTimeRange,
			direction,
			hideMarketStatus,
			layoutMode
		},
		symbolUrl,
		theme
	});
}
/** A market sidebar with a chart for the selected instrument. */
function TradingViewMarketOverview({ symbolSectors, exchange, mode, assetsType, itemSize, chartSize, timeFrame, hideMarketStatus, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.marketOverview,
		settings: {
			symbolSectors: serializeSymbolSectors(symbolSectors),
			exchange,
			mode,
			assetsType,
			itemSize,
			chartSize,
			timeFrame,
			hideMarketStatus
		},
		symbolUrl,
		theme
	});
}
/** A quote table for global market sections. */
function TradingViewMarketData({ symbolSectors, view, heatmap, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.marketData,
		settings: {
			symbolSectors: serializeSymbolSectors(symbolSectors),
			view,
			heatmap
		},
		symbolUrl,
		theme
	});
}
/** World equity performance as a map or a list, by country. */
function TradingViewWorldMarketSummary({ view, sort, hoverType, hideLegend, hideViewToggle, countries, focusedCountries, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.worldMarketSummary,
		settings: {
			view,
			sort,
			hoverType,
			hideLegend,
			hideViewToggle,
			countries: countries ? [...countries] : void 0,
			focusedCountries: focusedCountries ? [...focusedCountries] : void 0
		},
		symbolUrl,
		theme
	});
}
//#endregion
export { TradingViewMarketData, TradingViewMarketOverview, TradingViewMarketSummary, TradingViewWorldMarketSummary };

//# sourceMappingURL=watchlists.js.map