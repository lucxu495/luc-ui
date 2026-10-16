"use client";
import { getLucTokenSnapshot, parseLucTokenSnapshot, subscribeLucTokens } from "../core/tokens.js";
import { useTradingViewTheme } from "../core/use-tradingview.js";
import { useMemo, useSyncExternalStore } from "react";
//#region src/integrations/tradingview/widgets/helpers.ts
/** Drop `undefined` entries so a provider config never carries an explicit null. */
function clean(value) {
	const out = {};
	for (const [key, entry] of Object.entries(value)) if (entry !== void 0) out[key] = entry;
	return out;
}
/** Merge provider defaults with caller overrides, dropping undefined. */
function providerConfig(defaults, overrides) {
	return {
		...defaults,
		...clean(overrides)
	};
}
/**
* The provider locale an iframe widget should render in.
*
* An iframe embed receives its language as a **config value**, not through the
* module URL (that is the Web-Component path), so every iframe wrapper has to
* pass the caller's locale explicitly. The provider falls back to English, which
* is also what an unmapped Luc locale gets: a Chinese page must never render an
* English widget because the mapping was forgotten.
*/
function providerLocale(locale) {
	return locale ?? "en";
}
/**
* Resolve LUC's surface colours for an iframe config.
*
* Read through `useSyncExternalStore`, so nothing is measured during a server
* render and the first client render still matches the server markup. A theme
* flip re-resolves once and the wrapper rebuilds the embed with the new colours.
*/
function useIframePalette({ theme: themeProp = "auto", withSurface = false } = {}) {
	const theme = useTradingViewTheme(themeProp);
	const snapshot = useSyncExternalStore(subscribeLucTokens, getLucTokenSnapshot, () => "");
	return {
		theme,
		palette: useMemo(() => withSurface ? parseLucTokenSnapshot(snapshot) : null, [snapshot, withSurface])
	};
}
//#endregion
export { clean, providerConfig, providerLocale, useIframePalette };

//# sourceMappingURL=helpers.js.map