//#region src/integrations/tradingview/core/theme.ts
/**
* Public TradingView CSS custom properties → LUC semantic tokens.
*
* Only tokens with a clear semantic counterpart are mapped. TradingView's
* market-status chips and its positive/negative *areas* are left alone: the
* provider keeps its own design there, and Luc UI's up/down axis is expressed
* through `--chart-positive` / `--chart-negative` only.
*/
const TRADINGVIEW_TOKEN_BRIDGE = {
	"--tv-widget-background-color": "var(--surface-raised)",
	"--tv-widget-text-color": "var(--fg-primary)",
	"--tv-widget-font-family": "var(--font-sans)",
	"--tv-widget-accent-color": "var(--accent-default)",
	"--tv-widget-price-text-color": "var(--fg-primary)",
	"--tv-widget-scales-font-color": "var(--fg-muted)",
	"--tv-widget-popup-background-color": "var(--surface-overlay)",
	"--tv-widget-tooltip-background-color": "var(--chart-tooltip-surface)",
	"--tv-widget-tooltip-text-color": "var(--fg-primary)",
	"--tv-widget-positive-color": "var(--chart-positive)",
	"--tv-widget-negative-color": "var(--chart-negative)"
};
/** The LUC token inside a `var(--token)` reference, or `null` for a literal. */
function bridgedLucToken(reference) {
	return /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/.exec(reference.trim())?.[1] ?? null;
}
/**
* The bridged entries that are **colours**.
*
* Only these are resolved before they reach the provider; everything else (the
* font family) is a reference the provider resolves itself.
*/
const BRIDGED_COLOR_TOKENS = /* @__PURE__ */ new Set([
	"--surface-raised",
	"--fg-primary",
	"--accent-default",
	"--fg-muted",
	"--surface-overlay",
	"--chart-tooltip-surface",
	"--chart-positive",
	"--chart-negative"
]);
/**
* Inline style that hands the mapped tokens to a widget subtree.
*
* `transparent` is a documented provider option rather than a token override,
* so it is applied at the token that controls the widget's own surface.
*/
function tradingViewTokenStyle(options) {
	const { inheritTheme, transparent, colors } = options;
	if (!inheritTheme && !transparent) return void 0;
	const style = {};
	if (inheritTheme && colors) for (const [property, reference] of Object.entries(TRADINGVIEW_TOKEN_BRIDGE)) {
		const token = bridgedLucToken(reference);
		const value = token && BRIDGED_COLOR_TOKENS.has(token) ? colors[token] : reference;
		if (value) style[property] = value;
	}
	if (transparent) style["--tv-widget-background-color"] = "transparent";
	return Object.keys(style).length > 0 ? style : void 0;
}
/** Resolve the provider theme from Luc UI's resolved theme. */
function resolveTradingViewTheme(theme, lucTheme) {
	return theme === "auto" ? lucTheme : theme;
}
//#endregion
export { TRADINGVIEW_TOKEN_BRIDGE, bridgedLucToken, resolveTradingViewTheme, tradingViewTokenStyle };

//# sourceMappingURL=theme.js.map