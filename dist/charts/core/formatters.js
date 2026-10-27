import { formatNumber } from "../../utils/format.js";
//#region src/charts/core/formatters.ts
/**
* Chart formatters.
*
* One place decides how a number, a percentage or a timestamp is rendered.
* Components never call `toFixed` or build their own `Intl.NumberFormat`; they
* describe a `ChartFormat` and this module does the rest. Every formatter is
* total — `null`, `NaN` and `Infinity` render an em dash rather than "NaN" in a
* tooltip.
*/
const DASH = "—";
function numericOptions(format) {
	const decimals = format.decimals;
	const options = {
		locale: format.locale ?? "en-US",
		signed: format.signed
	};
	if (format.currency) options.currency = format.currency;
	if (decimals !== void 0) {
		options.minimumFractionDigits = decimals;
		options.maximumFractionDigits = decimals;
	}
	if (format.suffix) options.suffix = format.suffix;
	return options;
}
function withPrefix(value, prefix) {
	return prefix ? `${prefix}${value}` : value;
}
/** Duration in milliseconds rendered as a short, readable span. */
function formatDuration(ms) {
	if (ms === null || ms === void 0 || !Number.isFinite(ms)) return DASH;
	const abs = Math.abs(ms);
	if (abs < 1e3) return `${Math.round(ms)}ms`;
	const seconds = ms / 1e3;
	if (Math.abs(seconds) < 60) return `${seconds.toFixed(abs < 1e4 ? 2 : 0)}s`;
	const minutes = seconds / 60;
	if (Math.abs(minutes) < 60) return `${minutes.toFixed(1)}m`;
	const hours = minutes / 60;
	if (Math.abs(hours) < 24) return `${hours.toFixed(1)}h`;
	return `${(hours / 24).toFixed(1)}d`;
}
function dateFormatter(kind, timeZone = "UTC") {
	const dateStyle = kind === "date" ? {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone
	} : {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone
	};
	const formatter = new Intl.DateTimeFormat("en-US", dateStyle);
	return (value) => formatter.format(new Date(value));
}
/**
* Render a value according to a `ChartFormat`. Units are never converted — a
* percentage arrives already scaled, a basis-point figure already in bps.
*/
function formatChartValue(value, format = {}) {
	if (value === null || value === void 0 || Number.isNaN(value) || !Number.isFinite(value)) return DASH;
	switch (format.kind ?? "number") {
		case "date": return dateFormatter("date", format.timeZone)(value);
		case "datetime": return dateFormatter("datetime", format.timeZone)(value);
		case "duration": return withPrefix(formatDuration(value), format.prefix);
		case "bps": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "decimal",
			minimumFractionDigits: format.decimals ?? 1,
			maximumFractionDigits: format.decimals ?? 1,
			suffix: format.suffix ?? " bps"
		}), format.prefix);
		case "ratio": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "decimal",
			minimumFractionDigits: format.decimals ?? 2,
			maximumFractionDigits: format.decimals ?? 2,
			suffix: format.suffix ?? "×"
		}), format.prefix);
		case "integer": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "number",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}), format.prefix);
		case "percent": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "percent"
		}), format.prefix);
		case "currency": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "currency"
		}), format.prefix);
		case "compact": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "compact"
		}), format.prefix);
		case "decimal": return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "decimal",
			minimumFractionDigits: format.decimals ?? 2,
			maximumFractionDigits: format.decimals ?? 2
		}), format.prefix);
		default: return withPrefix(formatNumber(value, {
			...numericOptions(format),
			kind: "number"
		}), format.prefix);
	}
}
/** Build a reusable formatter closure from a format description. */
function createFormatter(format = {}) {
	return (value) => formatChartValue(value, format);
}
/**
* A series' own formatter wins; otherwise its `format`; otherwise the chart
* fallback. This is the order consumers expect, and the only one implemented.
*/
function resolveFormatter(series, fallback) {
	if (series.formatter) {
		const fn = series.formatter;
		return (value) => value === null || value === void 0 ? DASH : fn(value);
	}
	const format = series.format ?? fallback;
	if (!format) return (value) => formatChartValue(value, {});
	return (value) => formatChartValue(value, format);
}
/**
* Time-axis tick label for the span currently on screen. Short spans get
* clock time, long spans get years — the same rule a research terminal uses.
*
* The span must be the span that is **on screen**, not the span that was
* loaded: a two-year window of a fifteen-year history labelled from the loaded
* extent repeats the year on every tick ("2025 2025 2025"), which is a date
* axis that lost its dates. `timeAxisLabelScale` is the pure decision, and the
* chart surfaces feed the live visible span into it.
*/
function timeAxisFormatter(spanMs) {
	const options = TIME_AXIS_LABEL_OPTIONS[timeAxisLabelScale(spanMs)];
	const formatter = new Intl.DateTimeFormat("en-US", options);
	return (value) => Number.isFinite(value) ? formatter.format(new Date(value)) : "";
}
const DAY_MS = 864e5;
function timeAxisLabelScale(spanMs) {
	if (spanMs > DAY_MS * 400 * 3) return "year";
	if (spanMs > DAY_MS * 330) return "month-year";
	if (spanMs > DAY_MS * 60) return "month";
	if (spanMs > DAY_MS) return "day";
	return "time";
}
const TIME_AXIS_LABEL_OPTIONS = {
	time: {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "UTC"
	},
	day: {
		month: "short",
		day: "numeric",
		timeZone: "UTC"
	},
	month: {
		month: "short",
		timeZone: "UTC"
	},
	"month-year": {
		month: "short",
		year: "2-digit",
		timeZone: "UTC"
	},
	year: {
		year: "numeric",
		timeZone: "UTC"
	}
};
/**
* The shortest span two *adjacent* ticks of a scale may carry, in ms.
*
* This is the invariant the whole time axis hangs on: a label may only repeat
* when the two ticks carrying it are a full label unit apart. `time` labels
* carry minutes, so their ticks have to be at least a minute apart; `day`
* labels carry a date, so their ticks have to be at least a day apart; `month`
* labels carry a month name, and ECharts aligns month ticks to month *starts*,
* so a 31-day spacing guarantees a different month.
*/
const TIME_AXIS_LABEL_UNIT_MS = {
	time: 6e4,
	day: DAY_MS,
	month: 31 * DAY_MS,
	"month-year": 31 * DAY_MS,
	year: 365 * DAY_MS
};
/**
* The most ticks a scale may ask for.
*
* ECharts computes a time axis's `interval` from the axis length and the
* `splitNumber` it is given, then snaps that interval *up* to its own ladder
* (day → week → month → quarter → half-year → year). Asking for one tick per
* label unit and letting the snapped interval be coarser is what keeps the
* labels unique; asking for more only invites the snap to stay at a finer unit
* than the label can express.
*/
const TIME_AXIS_MAX_SPLIT = {
	time: 13,
	day: 13,
	month: 13,
	"month-year": 14,
	year: 10
};
/**
* Pair a time axis's label granularity with its tick spacing.
*
* The defect this exists to prevent: `timeAxisFormatter(span)` alone decides
* *how much of a date to print* and says nothing about *how many ticks to
* draw*, so ECharts — which sizes a time axis from the canvas width — drew
* twelve ticks across a four-month series while the formatter printed bare
* month names. The axis read `Jan Jan Feb Feb Feb Mar Mar Mar Apr Apr Apr May`:
* present, styled, axe-clean, and a date axis that had lost its dates.
*
* The span is still the input, because the span is what the reader is looking
* at; the fix is that the same span now also decides the tick count, so the two
* decisions cannot disagree. See `axis-time.test.ts`, which renders every scale
* through the real engine and fails if two adjacent ticks print the same label.
*/
function timeAxisTickPlan(spanMs) {
	const scale = timeAxisLabelScale(spanMs);
	const units = spanMs / TIME_AXIS_LABEL_UNIT_MS[scale];
	return {
		scale,
		splitNumber: Math.max(2, Math.min(TIME_AXIS_MAX_SPLIT[scale], Math.round(units)))
	};
}
/**
* The span a set of x values covers, in ms — what `axisFragment` wants.
*
* A time axis with no span falls back to a year, which is a reasonable guess
* and a bad fact: a family component that has the caller's timestamps in hand
* should say what they cover rather than let the engine assume. Non-finite
* entries are skipped (a chart may legitimately carry a gap), and a set with
* fewer than two usable timestamps has no span at all.
*/
function timeSpanMs(values) {
	let min = Infinity;
	let max = -Infinity;
	for (const value of values) {
		const time = value instanceof Date ? value.getTime() : typeof value === "number" ? value : value === null || value === void 0 ? NaN : new Date(value).getTime();
		if (!Number.isFinite(time)) continue;
		if (time < min) min = time;
		if (time > max) max = time;
	}
	return Number.isFinite(min) && Number.isFinite(max) && max > min ? max - min : void 0;
}
/**
* Compact tick label for a numeric axis: 1.2M, 38%, $109.1K …
*
* An axis has one job — be readable in the gutter it was given. Large values are
* abbreviated from ten thousand up (a full `$124,658` label is 8 characters of
* pure noise next to `$124.7K`), and a compacted currency keeps its unit so the
* plate never loses the "these are dollars" information. Tooltips keep full
* precision; only the ticks are abbreviated.
*/
function numericAxisFormatter(format) {
	if (format?.kind === "date" || format?.kind === "datetime") return (value) => formatChartValue(value, format);
	return (value) => {
		const abs = Math.abs(value);
		if (abs >= 1e4 || abs > 0 && abs < .01) return formatChartValue(value, {
			...format,
			kind: "compact",
			decimals: void 0
		});
		return formatChartValue(value, format);
	};
}
/** Full precision, used by tooltips where space is not the constraint. */
function preciseFormatter(format) {
	return (value) => formatChartValue(value, format);
}
//#endregion
export { createFormatter, formatChartValue, formatDuration, numericAxisFormatter, preciseFormatter, resolveFormatter, timeAxisFormatter, timeAxisLabelScale, timeAxisTickPlan, timeSpanMs };

//# sourceMappingURL=formatters.js.map