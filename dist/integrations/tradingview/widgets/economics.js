"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/economics.tsx
const ECONOMIC_MAP = tradingViewWidgetById("economic-map");
const TRADINGVIEW_ECONOMIC_METRIC_LABELS = {
	gdp: "GDP",
	ur: "Unemployment Rate",
	gdg: "Government Debt to GDP",
	intr: "Interest Rate",
	iryy: "Inflation Rate"
};
/**
* A world map of macro indicators.
*
* The geography and the indicator data are the provider's; LUC does not draw its
* own map and does not model macro series.
*/
function TradingViewEconomicMap({ region, metric, metrics, hideLegend, hideSelection, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: ECONOMIC_MAP,
		settings: {
			region,
			metric,
			metrics: metrics ? [...metrics] : void 0,
			hideLegend,
			hideSelection
		},
		symbolUrl,
		theme
	});
}
//#endregion
export { TRADINGVIEW_ECONOMIC_METRIC_LABELS, TradingViewEconomicMap };

//# sourceMappingURL=economics.js.map