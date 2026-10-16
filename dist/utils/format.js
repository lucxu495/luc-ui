//#region src/utils/format.ts
function resolveFractionDigits(value, options) {
	const { minimumFractionDigits, maximumFractionDigits, kind = "number" } = options;
	if (minimumFractionDigits !== void 0 || maximumFractionDigits !== void 0) return {
		minimumFractionDigits: minimumFractionDigits ?? 0,
		maximumFractionDigits: maximumFractionDigits ?? minimumFractionDigits ?? 0
	};
	if (kind === "percent") {
		const digits = value === 0 || Math.abs(value) >= .1 ? 1 : 2;
		return {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		};
	}
	if (kind === "decimal") {
		const digits = Math.abs(value) >= 100 ? 1 : 2;
		return {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		};
	}
	return {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	};
}
/**
* Deterministic numeric formatting. Never throws on `NaN`/`Infinity` — an
* unavailable metric renders as an em dash rather than "NaN" in a dashboard.
*/
function formatNumber(value, options = {}) {
	if (value === null || value === void 0 || Number.isNaN(value) || !Number.isFinite(value)) return "—";
	const { kind = "number", locale = "en-US", currency = "USD", suffix, signed } = options;
	const fraction = resolveFractionDigits(value, {
		...options,
		kind
	});
	const digits = fraction.maximumFractionDigits ?? 0;
	let display = Object.is(value, -0) ? 0 : value;
	if (display < 0 && Math.round(-display * 10 ** digits) === 0) display = 0;
	const intlOptions = {
		...fraction,
		useGrouping: true,
		signDisplay: signed ? "exceptZero" : "auto"
	};
	if (kind === "percent") intlOptions.style = "decimal";
	else if (kind === "currency") {
		intlOptions.style = "currency";
		intlOptions.currency = currency;
	} else if (kind === "compact") {
		intlOptions.notation = "compact";
		intlOptions.maximumFractionDigits = options.maximumFractionDigits ?? 1;
		if (options.currency !== void 0) {
			intlOptions.style = "currency";
			intlOptions.currency = currency;
		}
	}
	const formatted = new Intl.NumberFormat(locale, intlOptions).format(display);
	const withUnit = kind === "percent" ? `${formatted}%` : formatted;
	return suffix ? `${withUnit}${suffix}` : withUnit;
}
function splitNumberParts(value, options = {}) {
	const formatted = formatNumber(value, options);
	if (formatted === "—") return {
		sign: "",
		integer: "—",
		fraction: "",
		unit: "",
		formatted
	};
	const match = /^(?<sign>[-+])?(?<integer>[\d,]+)(?<fraction>\.\d+)?(?<unit>.*)$/.exec(formatted);
	if (!match?.groups) return {
		sign: "",
		integer: formatted,
		fraction: "",
		unit: "",
		formatted
	};
	return {
		sign: match.groups.sign ?? "",
		integer: match.groups.integer ?? "",
		fraction: match.groups.fraction ?? "",
		unit: match.groups.unit ?? "",
		formatted
	};
}
function resolveDeltaTone(value, invert = false) {
	if (value === null || value === void 0 || Number.isNaN(value) || value === 0) return "neutral";
	const isPositive = value > 0;
	if (invert) return isPositive ? "negative" : "positive";
	return isPositive ? "positive" : "negative";
}
function formatDelta(value, options = {}) {
	const { invert: _invert, ...formatOptions } = options;
	return formatNumber(value, {
		kind: "percent",
		signed: true,
		...formatOptions
	});
}
function formatCompact(value, options = {}) {
	return formatNumber(value, {
		kind: "compact",
		...options
	});
}
/**
* Byte size for file lists. Binary units (KiB steps) with the familiar short
* labels, because "1.4 MB" is what a person expects to read next to a file.
*/
function formatBytes(bytes, options = {}) {
	if (bytes === null || bytes === void 0 || !Number.isFinite(bytes) || bytes < 0) return "—";
	if (bytes < 1e3) return `${Math.round(bytes)} B`;
	const units = [
		"kB",
		"MB",
		"GB",
		"TB"
	];
	let value = bytes / 1e3;
	let unitIndex = 0;
	while (value >= 1e3 && unitIndex < units.length - 1) {
		value /= 1e3;
		unitIndex += 1;
	}
	const decimals = options.decimals ?? (value >= 100 ? 0 : 1);
	return `${new Intl.NumberFormat("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(value)} ${units[unitIndex]}`;
}
/** Clamp helper used by creative components; exported for consumers too. */
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
//#endregion
export { clamp, formatBytes, formatCompact, formatDelta, formatNumber, resolveDeltaTone, splitNumberParts };

//# sourceMappingURL=format.js.map