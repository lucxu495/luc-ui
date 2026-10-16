"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/heatmaps.tsx
const DEFINITIONS = {
	stock: tradingViewWidgetById("stock-heatmap"),
	crypto: tradingViewWidgetById("crypto-heatmap"),
	etf: tradingViewWidgetById("etf-heatmap"),
	forex: tradingViewWidgetById("forex-table")
};
function TradingViewStockHeatmap({ dataSource = "SPX500", grouping = "sector", blockSize = "market_cap_basic", blockColor = "change", exchanges, hasTopBar = false, isZoomEnabled = true, hasSymbolTooltip = true, transparent = false, symbolUrl, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
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
		isTransparent: false
	}, {
		locale: providerLocale(locale),
		dataSource,
		grouping,
		blockSize,
		blockColor,
		exchanges: exchanges ? [...exchanges] : void 0,
		hasTopBar,
		isZoomEnabled,
		hasSymbolTooltip,
		transparent,
		symbolUrl,
		colorTheme: resolvedTheme
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.stock,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/heatmap/stock/",
			label: "Stock Heatmap"
		}
	});
}
function TradingViewCryptoHeatmap({ dataSource = "Crypto", blockSize = "market_cap_calc", blockColor = "change", hasTopBar = false, isZoomEnabled = true, hasSymbolTooltip = true, transparent = false, symbolUrl, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
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
		isTransparent: false
	}, {
		locale: providerLocale(locale),
		dataSource,
		blockSize,
		blockColor,
		hasTopBar,
		isZoomEnabled,
		hasSymbolTooltip,
		transparent,
		symbolUrl,
		colorTheme: resolvedTheme
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.crypto,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/heatmap/crypto/",
			label: "Crypto Heatmap"
		}
	});
}
function TradingViewEtfHeatmap({ dataSource = "AllUSEtf", grouping = "asset_class", blockSize = "volume", blockColor = "change", hasTopBar = false, isZoomEnabled = true, hasSymbolTooltip = true, transparent = false, symbolUrl, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
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
		isTransparent: false
	}, {
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
		colorTheme: resolvedTheme
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: DEFINITIONS.etf,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/heatmap/etf/",
			label: "ETF Heatmap"
		}
	});
}
/** A currency cross-rate matrix, optionally heat-coloured. */
function TradingViewForexTable({ currencies, displayedValue, heatmap, symbolUrl, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.forex,
		settings: {
			currencies: currencies ? currencies.map((code) => code.trim().toUpperCase()).filter(Boolean) : void 0,
			displayedValue,
			heatmap
		},
		symbolUrl,
		theme
	});
}
//#endregion
export { TradingViewCryptoHeatmap, TradingViewEtfHeatmap, TradingViewForexTable, TradingViewStockHeatmap };

//# sourceMappingURL=heatmaps.js.map