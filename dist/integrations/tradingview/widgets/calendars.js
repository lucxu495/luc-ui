"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { TradingViewIframe } from "../iframe/iframe-embed.js";
import { providerConfig, providerLocale, useIframePalette } from "./helpers.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/calendars.tsx
const ECONOMIC_CALENDAR = tradingViewWidgetById("economic-calendar");
/**
* The macro event calendar.
*
* Named for the provider on purpose: this is not LUC's `Calendar`, and the two
* must never be confused. One shows a date grid the product controls; this one
* shows TradingView's event data.
*/
function TradingViewEconomicCalendar({ importanceFilter = "-1,0,1", countryFilter = "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu", transparent = false, locale, theme, ...base }) {
	const { theme: resolvedTheme } = useIframePalette({ theme });
	const config = providerConfig({
		colorTheme: "light",
		isTransparent: false,
		width: "100%",
		height: "100%",
		locale: "en",
		importanceFilter: "-1,0,1",
		countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu"
	}, {
		importanceFilter,
		countryFilter,
		locale: providerLocale(locale),
		colorTheme: resolvedTheme,
		isTransparent: transparent
	});
	return /* @__PURE__ */ jsx(TradingViewIframe, {
		...base,
		definition: ECONOMIC_CALENDAR,
		providerConfig: config,
		theme,
		attribution: {
			href: "https://www.tradingview.com/economic-calendar/",
			label: "Economic Calendar"
		}
	});
}
//#endregion
export { TradingViewEconomicCalendar };

//# sourceMappingURL=calendars.js.map