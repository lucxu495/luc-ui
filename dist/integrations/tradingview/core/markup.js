//#region src/integrations/tradingview/core/markup.ts
/**
* Convert one prop into the attribute value the provider expects.
*
* Returns `undefined` for "do not render this attribute" — an omitted prop must
* not become `attr=""`, which the provider reads as an explicit empty value.
*/
function serializeAttribute(spec, value) {
	if (value === void 0 || value === null) return void 0;
	switch (spec.encoding) {
		case "boolean": return value ? true : void 0;
		case "list": {
			if (!Array.isArray(value)) return void 0;
			const entries = value.map((entry) => String(entry).trim()).filter(Boolean);
			return entries.length > 0 ? entries.join(",") : void 0;
		}
		case "json":
			if (typeof value === "string") return value;
			if (Array.isArray(value) && value.length === 0) return void 0;
			if (typeof value === "object") return JSON.stringify(value);
			return String(value);
		case "upper": {
			const text = String(value).trim();
			return text ? text.toUpperCase() : void 0;
		}
		case "lower": {
			const text = String(value).trim();
			return text ? text.toLowerCase() : void 0;
		}
		default: {
			const text = String(value);
			return text.length > 0 ? text : void 0;
		}
	}
}
/**
* Build the full attribute map for a widget.
*
* Provider configuration from the `config` escape hatch is merged *under* the
* typed props: a caller cannot use it to overwrite a LUC-controlled attribute.
*/
function buildWebComponentAttributes(options) {
	const { definition, props, extras = {}, config } = options;
	const specs = definition.attributes ?? {};
	const out = {};
	if (config) {
		for (const [key, spec] of Object.entries(specs)) if (key in config) out[spec.attribute] = serializeAttribute(spec, config[key]);
	}
	for (const [key, value] of Object.entries({
		...extras,
		...props
	})) {
		const spec = specs[key];
		if (!spec) continue;
		out[spec.attribute] = serializeAttribute(spec, value);
	}
	return out;
}
/**
* Reject an obviously malformed symbol before it reaches the provider.
*
* LUC cannot validate the full symbol space offline (TradingView exposes tens of
* thousands), so this only catches the cases that would render an error inside
* the widget: empty values and values with characters that cannot appear in
* `EXCHANGE:TICKER`.
*/
function isValidTradingViewSymbol(symbol) {
	const trimmed = symbol.trim();
	if (!trimmed) return false;
	return /^[A-Za-z0-9._\-+:!]+$/.test(trimmed);
}
function assertTradingViewSymbol(symbol) {
	const trimmed = symbol.trim();
	if (!isValidTradingViewSymbol(trimmed)) throw new Error(`[luc-ui] "${symbol}" is not a valid TradingView symbol. Use the provider's EXCHANGE:TICKER form, e.g. "NASDAQ:AAPL".`);
	return trimmed;
}
/** Encode symbol sectors for the widgets whose sections arrive as an attribute. */
function serializeSymbolSectors(sectors) {
	if (!sectors || sectors.length === 0) return void 0;
	return sectors.map((sector) => ({
		sectionName: sector.sectionName,
		symbols: sector.symbols.map((symbol) => symbol.trim()).filter(Boolean)
	}));
}
/** The provider link for a symbol page, used by the attribution block. */
function tradingViewSymbolHref(symbol, suffix = "") {
	return `https://www.tradingview.com/symbols/${symbol.trim().replace(":", "-")}/${suffix}`;
}
function defaultLocale(locale) {
	return locale ?? "en";
}
//#endregion
export { assertTradingViewSymbol, buildWebComponentAttributes, defaultLocale, isValidTradingViewSymbol, serializeAttribute, serializeSymbolSectors, tradingViewSymbolHref };

//# sourceMappingURL=markup.js.map