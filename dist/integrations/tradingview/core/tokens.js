"use client";
//#region src/integrations/tradingview/core/tokens.ts
/**
* Resolve LUC semantic tokens to concrete colours for provider configs.
*
* iframe widgets accept colours as *values* (`backgroundColor`, `gridColor`),
* not as CSS custom properties, so the token has to be resolved in the page
* before it is handed over. Canvas is the only converter that reliably lands on
* a form an external document accepts for every colour space LUC uses — the same
* technique the chart layer uses, kept local so the TradingView integration does
* not depend on the chart subsystem.
*/
const cache = /* @__PURE__ */ new Map();
let probe;
function context() {
	if (probe !== void 0) return probe;
	if (typeof document === "undefined") {
		probe = null;
		return probe;
	}
	probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
	if (probe) {
		probe.canvas.width = 1;
		probe.canvas.height = 1;
	}
	return probe;
}
/** Convert any CSS colour to `rgb()`/`rgba()`. Returns `undefined` off-DOM. */
function normalizeColor(value) {
	if (!value) return void 0;
	const ctx = context();
	if (!ctx) return void 0;
	try {
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = "#000000";
		ctx.fillStyle = value;
		ctx.fillRect(0, 0, 1, 1);
		const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
		if (a === 0) return "rgba(0, 0, 0, 0)";
		if (a === 255) return `rgb(${r}, ${g}, ${b})`;
		return `rgba(${r}, ${g}, ${b}, ${Math.round(a / 255 * 1e3) / 1e3})`;
	} catch {
		return;
	}
}
/**
* Read one LUC token and resolve it. Cached per token; the caller flushes the
* cache when the theme changes.
*/
function resolveLucToken(token) {
	if (typeof window === "undefined") return void 0;
	const cached = cache.get(token);
	if (cached) return cached;
	const resolved = normalizeColor(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
	if (resolved) cache.set(token, resolved);
	return resolved;
}
function flushLucTokenCache() {
	cache.clear();
}
const TOKENS = [
	"--surface-raised",
	"--chart-grid",
	"--fg-primary",
	"--fg-muted"
];
const storeListeners = /* @__PURE__ */ new Set();
let observing = false;
let cachedSnapshot = null;
let cachedBridgeSnapshot = null;
function notify() {
	flushLucTokenCache();
	cachedSnapshot = null;
	cachedBridgeSnapshot = null;
	for (const listener of storeListeners) listener();
}
function startObserving() {
	if (observing || typeof window === "undefined") return;
	observing = true;
	new MutationObserver(notify).observe(document.documentElement, {
		attributes: true,
		attributeFilter: [
			"class",
			"data-theme",
			"style"
		]
	});
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", notify);
}
/**
* Subscribe to theme changes and read the resolved provider palette.
*
* Exposed as an external store so a component can read the tokens through
* `useSyncExternalStore`: resolution happens after hydration (never during a
* server render), and a theme flip re-resolves exactly once.
*/
function subscribeLucTokens(listener) {
	storeListeners.add(listener);
	startObserving();
	return () => {
		storeListeners.delete(listener);
	};
}
/** A stable string of the resolved colours, or `""` before the DOM is ready. */
function getLucTokenSnapshot() {
	if (typeof document === "undefined") return "";
	if (cachedSnapshot !== null) return cachedSnapshot;
	const values = TOKENS.map((token) => resolveLucToken(token) ?? "");
	cachedSnapshot = values.some((value) => !value) ? "" : values.join("|");
	return cachedSnapshot;
}
function parseLucTokenSnapshot(snapshot) {
	if (!snapshot) return null;
	const [background, grid, foreground, muted] = snapshot.split("|");
	if (!background || !grid || !foreground || !muted) return null;
	return {
		background,
		grid,
		foreground,
		muted
	};
}
/**
* The LUC colour tokens the **Web-Component** token bridge maps onto
* `--tv-widget-*`.
*
* Provider elements read those properties as *values*, and their own colour
* parser only understands the classic notations: a LUC token resolved to
* `lab(…)` (Tailwind v4's palette) made the widget throw
* "Failed to parse color" during construction. So the bridge has to hand over
* resolved `rgb()` — the same conversion the iframe palette already uses —
* rather than a `var(…)` reference.
*/
const TRADINGVIEW_BRIDGE_TOKENS = [
	"--surface-raised",
	"--fg-primary",
	"--accent-default",
	"--fg-muted",
	"--surface-overlay",
	"--chart-tooltip-surface",
	"--chart-positive",
	"--chart-negative"
];
/** A stable `token=value` snapshot of every bridged colour, or `""` before the DOM is ready. */
function getLucBridgeColorSnapshot() {
	if (typeof document === "undefined") return "";
	if (cachedBridgeSnapshot !== null) return cachedBridgeSnapshot;
	const pairs = [];
	for (const token of TRADINGVIEW_BRIDGE_TOKENS) {
		const value = resolveLucToken(token);
		if (!value) return "";
		pairs.push(`${token}=${value}`);
	}
	cachedBridgeSnapshot = pairs.join("|");
	return cachedBridgeSnapshot;
}
/** Parse {@link getLucBridgeColorSnapshot} into a lookup keyed by LUC token. */
function parseLucBridgeColorSnapshot(snapshot) {
	if (!snapshot) return null;
	const out = {};
	for (const pair of snapshot.split("|")) {
		const index = pair.indexOf("=");
		if (index <= 0) continue;
		out[pair.slice(0, index)] = pair.slice(index + 1);
	}
	return Object.keys(out).length > 0 ? out : null;
}
//#endregion
export { TRADINGVIEW_BRIDGE_TOKENS, flushLucTokenCache, getLucBridgeColorSnapshot, getLucTokenSnapshot, normalizeColor, parseLucBridgeColorSnapshot, parseLucTokenSnapshot, resolveLucToken, subscribeLucTokens };

//# sourceMappingURL=tokens.js.map