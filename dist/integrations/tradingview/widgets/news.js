"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { isValidTradingViewSymbol } from "../core/markup.js";
import { TradingViewSymbolError } from "../core/surface.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/news.tsx
const TOP_STORIES = tradingViewWidgetById("top-stories");
/**
* The provider's market news timeline.
*
* LUC renders none of this content and stores none of it: the feed is the
* provider's, and the wrapper only allocates the space and the theme.
*/
function TradingViewTopStories({ feedMode = "all_symbols", symbol, market, displayMode = "regular", transparent = false, locale, theme, ...base }) {
	const trimmed = symbol?.trim() ?? "";
	const { theme: resolvedTheme } = useIframePalette({ theme });
	if (feedMode === "symbol" && !isValidTradingViewSymbol(trimmed)) return /* @__PURE__ */ jsx(TradingViewSymbolError, {});
	const config = providerConfig({
		feedMode: "all_symbols",
		isTransparent: false,
		displayMode: "regular",
		width: "100%",
		height: "100%",
		colorTheme: "light",
		locale: "en"
	}, {
		feedMode,
		symbol: feedMode === "symbol" ? trimmed : void 0,
		market: feedMode === "market" ? market : void 0,
		locale: providerLocale(locale),
		displayMode,
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: TOP_STORIES,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/news/top-providers/tradingview/",
			label: "Top stories"
		}
	});
}
//#endregion
export { TradingViewTopStories };

//# sourceMappingURL=news.js.map