"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/screeners.tsx
const SCREENER = tradingViewWidgetById("screener");
const CRYPTO = tradingViewWidgetById("crypto-mkt-screener");
/** The provider's attribution link differs per market; so does its label. */
const MARKET_ATTRIBUTION = {
	forex: {
		href: "https://www.tradingview.com/markets/currencies/",
		label: "Forex Screener"
	},
	america: {
		href: "https://www.tradingview.com/markets/stocks-usa/",
		label: "Stock Screener"
	},
	crypto: {
		href: "https://www.tradingview.com/markets/cryptocurrencies/prices-all/",
		label: "Crypto Screener"
	}
};
/**
* The market screener.
*
* A filterable table owned entirely by the provider: LUC passes the market and
* the presets, and gives the table a bounded box with its own scrolling.
*/
function TradingViewScreener({ market = "forex", defaultColumn = "overview", defaultScreen = "general", showToolbar = true, transparent = false, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
		width: "100%",
		height: 550,
		defaultColumn: "overview",
		defaultScreen: "general",
		market: "forex",
		showToolbar: true,
		colorTheme: "light",
		locale: "en",
		isTransparent: false
	}, {
		market,
		defaultColumn,
		defaultScreen,
		showToolbar,
		locale: providerLocale(locale),
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	const attribution = MARKET_ATTRIBUTION[market] ?? {
		href: "https://www.tradingview.com/markets/",
		label: "Screener"
	};
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: SCREENER,
		providerConfig: config,
		theme,
		attribution
	});
}
/** The cryptocurrency market table. */
function TradingViewCryptocurrencyMarket({ displayCurrency = "USD", defaultColumn = "overview", defaultScreen = "general", showToolbar = true, transparent = false, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
		width: "100%",
		height: 490,
		defaultColumn: "overview",
		market: "crypto",
		screener_type: "crypto_mkt",
		displayCurrency: "USD",
		isTransparent: false,
		colorTheme: "light",
		locale: "en",
		showToolbar: true
	}, {
		displayCurrency,
		defaultColumn,
		defaultScreen,
		showToolbar,
		locale: providerLocale(locale),
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: CRYPTO,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/markets/cryptocurrencies/prices-all/",
			label: "Crypto markets"
		}
	});
}
//#endregion
export { TradingViewCryptocurrencyMarket, TradingViewScreener };

//# sourceMappingURL=screeners.js.map