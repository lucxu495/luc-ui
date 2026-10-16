import { parseDate } from "@internationalized/date";
//#region src/url-state/codecs.ts
/**
* LUC URL codecs.
*
* A codec is the whole vocabulary a URL parameter needs: how to read a string
* from the address bar, how to write it back, and when two values are the same.
* The codecs are pure and framework-free on purpose — `@luc/ui` never imports a
* router, and the same codec is reused by the optional Next/nuqs adapter.
*
* Two rules keep a shared link honest:
*
*  1. **Invalid input is not an error.** A codec returns `undefined` for a
*     value it cannot read, and the caller falls back to the default. A URL is
*     user input; `?range=garbage` must render the default view, never crash.
*  2. **Every value is bounded.** Raw strings, lists and numbers are clamped,
*     so a pasted megabyte-long query string cannot reach a component.
*/
/** A pasted URL should never be able to move more than this much text. */
const MAX_RAW_LENGTH = 512;
function usable(raw, maxLength = MAX_RAW_LENGTH) {
	if (raw === null || raw === void 0) return void 0;
	if (raw.length === 0 || raw.length > maxLength) return void 0;
	return raw;
}
/** Structural equality for the object/array-shaped codecs below. */
function structuralEquals(a, b) {
	if (Object.is(a, b)) return true;
	if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => structuralEquals(item, b[index]));
	if (a && b && typeof a === "object" && typeof b === "object") {
		const left = a;
		const right = b;
		const keys = Object.keys(left);
		if (keys.length !== Object.keys(right).length) return false;
		return keys.every((key) => structuralEquals(left[key], right[key]));
	}
	return false;
}
function stringParam(options = {}) {
	return {
		decode: (raw) => usable(raw, options.maxLength),
		encode: (value) => value
	};
}
function booleanParam() {
	return {
		decode: (raw) => {
			if (raw === "1" || raw === "true") return true;
			if (raw === "0" || raw === "false") return false;
		},
		encode: (value) => value ? "1" : "0"
	};
}
function numberParam(options = {}) {
	const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, integer = false } = options;
	return {
		decode: (raw) => {
			if (!usable(raw, 48)) return void 0;
			const value = Number(raw);
			if (!Number.isFinite(value)) return void 0;
			if (integer && !Number.isInteger(value)) return void 0;
			if (value < min || value > max) return void 0;
			return value;
		},
		encode: (value) => String(value)
	};
}
/** A closed set of strings — a view mode, a range preset, a sort key. */
function enumParam(values) {
	const allowed = new Set(values);
	return {
		decode: (raw) => {
			const value = usable(raw, 64);
			return value !== void 0 && allowed.has(value) ? value : void 0;
		},
		encode: (value) => value
	};
}
/**
* A compact list — `series=close,sma50,sma200`.
*
* Order is preserved (a table's column order is meaningful) and duplicates are
* dropped so a link with the same series twice cannot render it twice.
*/
function listParam(item, options = {}) {
	const { separator = ",", maxItems = 24, itemMaxLength = 64 } = options;
	return {
		decode: (raw) => {
			const value = usable(raw);
			if (value === void 0) return void 0;
			const parts = value.split(separator).slice(0, maxItems).map((part) => item.decode(part.slice(0, itemMaxLength))).filter((entry) => entry !== void 0);
			return parts.length > 0 ? dedupe(parts, item.equals) : void 0;
		},
		encode: (value) => value.slice(0, maxItems).map((entry) => item.encode(entry)).join(separator),
		equals: (a, b) => structuralEquals(a, b)
	};
}
function dedupe(values, equals) {
	const seen = [];
	for (const value of values) if (!seen.some((entry) => equals ? equals(entry, value) : Object.is(entry, value))) seen.push(value);
	return seen;
}
/**
* A date-only value.
*
* `CalendarDate` in, `YYYY-MM-DD` out — never through a JavaScript `Date`. That
* is what stops `2026-09-27` from becoming the 26th west of Greenwich. See
* `docs/DATE_TIME_GUIDE.md`.
*/
function dateOnlyParam() {
	return {
		decode: (raw) => {
			const value = usable(raw, 10);
			if (value === void 0 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return void 0;
			try {
				return parseDate(value);
			} catch {
				return;
			}
		},
		encode: (value) => value.toString(),
		equals: (a, b) => a.compare(b) === 0
	};
}
/**
* An absolute instant, serialized as ISO-8601 UTC and kept as epoch
* milliseconds in state. Use it for a zoned/datetime cursor; a daily chart
* wants `dateOnlyParam()`.
*/
function instantParam() {
	return {
		decode: (raw) => {
			const value = usable(raw, 40);
			if (value === void 0) return void 0;
			const ms = Date.parse(value);
			return Number.isFinite(ms) ? ms : void 0;
		},
		encode: (value) => new Date(value).toISOString()
	};
}
/**
* One sort definition in the conventional compact form: `sharpe` ascending,
* `-sharpe` descending.
*/
function sortParam() {
	const idPattern = /^[A-Za-z0-9_.:-]{1,64}$/;
	return {
		decode: (raw) => {
			const value = usable(raw, 96);
			if (value === void 0) return void 0;
			const desc = value.startsWith("-");
			const id = desc ? value.slice(1) : value;
			if (!idPattern.test(id)) return void 0;
			return {
				id,
				desc
			};
		},
		encode: (value) => `${value.desc ? "-" : ""}${value.id}`,
		equals: (a, b) => a.id === b.id && a.desc === b.desc
	};
}
/** Multi-column sorting, most significant first: `-sharpe,symbol`. */
function sortListParam(options = {}) {
	return listParam(sortParam(), options);
}
/** ISO-8601 currency/region code — a currency selector. */
function currencyParam() {
	return {
		decode: (raw) => {
			const value = usable(raw, 3);
			return value !== void 0 && /^[A-Za-z]{3}$/.test(value) ? value.toUpperCase() : void 0;
		},
		encode: (value) => value.toUpperCase()
	};
}
/**
* Make a value optional.
*
* A missing parameter reads as `null` rather than as "invalid", which is what
* an optional filter needs: `?cursor=` and no `cursor` both mean "nothing
* pinned". `null` serializes to the empty string, and the encoder drops empty
* values, so an unset optional never leaves a stub in the URL.
*/
function nullableParam(codec) {
	return {
		decode: (raw) => {
			if (raw === null || raw === void 0 || raw.length === 0) return null;
			return codec.decode(raw) ?? null;
		},
		encode: (value) => value === null ? "" : codec.encode(value),
		equals: (a, b) => {
			if (a === null || b === null) return a === b;
			return codec.equals ? codec.equals(a, b) : Object.is(a, b);
		}
	};
}
//#endregion
export { booleanParam, currencyParam, dateOnlyParam, enumParam, instantParam, listParam, nullableParam, numberParam, sortListParam, sortParam, stringParam, structuralEquals };

//# sourceMappingURL=codecs.js.map