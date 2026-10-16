"use client";
import { tradingViewWidgetById } from "../core/catalog.js";
import { TradingViewWebComponent } from "../web-components/web-component.js";
import { jsx } from "react/jsx-runtime";
//#region src/integrations/tradingview/widgets/brokers.tsx
const DEFINITIONS = {
	rating: tradingViewWidgetById("broker-rating"),
	reviews: tradingViewWidgetById("broker-reviews")
};
/**
* A broker partner's TradingView rating.
*
* The broker slug is part of the provider's *script URL*, which is why this
* wrapper resolves a per-broker module address instead of sharing one: two
* brokers on one page really are two modules.
*/
function TradingViewBrokerRating({ broker, showBrokerName, showReviews, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.rating,
		urlParams: { broker },
		settings: {
			broker,
			showBrokerName,
			showReviews
		},
		theme
	});
}
/** A broker partner's rating plus recent reviews. */
function TradingViewBrokerReviews({ broker, showBrokerName, showReviews, theme, ...base }) {
	return /* @__PURE__ */ jsx(TradingViewWebComponent, {
		...base,
		definition: DEFINITIONS.reviews,
		urlParams: { broker },
		settings: {
			broker,
			showBrokerName,
			showReviews
		},
		theme
	});
}
//#endregion
export { TradingViewBrokerRating, TradingViewBrokerReviews };

//# sourceMappingURL=brokers.js.map