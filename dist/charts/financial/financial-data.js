import { toChartTime } from "../adapters/lightweight/runtime.js";
//#region src/charts/financial/financial-data.ts
var FinancialDataError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "FinancialDataError";
		this.code = code;
	}
};
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})$/;
function validCalendarDate(year, month, day) {
	if (month < 1 || month > 12 || day < 1) return false;
	return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function parseIsoTime(value, context) {
	const dateOnly = ISO_DATE.exec(value);
	if (dateOnly) {
		const year = Number(dateOnly[1]);
		const month = Number(dateOnly[2]);
		const day = Number(dateOnly[3]);
		if (!validCalendarDate(year, month, day)) throw new FinancialDataError("time", `${context}: invalid ISO date "${value}"`);
		return Date.UTC(year, month - 1, day);
	}
	const dateTime = ISO_DATE_TIME.exec(value);
	if (!dateTime) throw new FinancialDataError("time", `${context}: use epoch milliseconds, a Date, an ISO date, or an ISO datetime with Z/offset`);
	const year = Number(dateTime[1]);
	const month = Number(dateTime[2]);
	const day = Number(dateTime[3]);
	const hour = Number(dateTime[4]);
	const minute = Number(dateTime[5]);
	const second = Number(dateTime[6] ?? "0");
	if (!validCalendarDate(year, month, day) || hour > 23 || minute > 59 || second > 59) throw new FinancialDataError("time", `${context}: invalid ISO datetime "${value}"`);
	const parsed = Date.parse(value);
	if (!Number.isFinite(parsed)) throw new FinancialDataError("time", `${context}: invalid ISO datetime "${value}"`);
	return parsed;
}
/**
* Parse one chart time as epoch milliseconds.
*
* Numeric inputs are epoch milliseconds by contract. ISO datetimes without a
* timezone are rejected because `Date.parse` would otherwise make the result
* depend on the host timezone. Date-only strings are UTC calendar days.
*/
function financialTimeToMs(value, context = "time") {
	if (value instanceof Date) {
		const time = value.getTime();
		if (!Number.isFinite(time)) throw new FinancialDataError("time", `${context}: received an invalid Date`);
		return time;
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new FinancialDataError("time", `${context}: epoch milliseconds must be finite`);
		return value;
	}
	return parseIsoTime(value, context);
}
function assertFinite(value, context) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new FinancialDataError("value", `${context}: value must be a finite number`);
}
function assertNonNegativeInteger(value, context, fallback = 0) {
	if (value === void 0) return fallback;
	if (!Number.isSafeInteger(value) || value < 0) throw new FinancialDataError("identity", `${context}: paneIndex must be a non-negative integer`);
	return value;
}
function validateReferenceLines(levels, context) {
	const seen = /* @__PURE__ */ new Set();
	for (const [index, level] of (levels ?? []).entries()) {
		if (!Number.isFinite(level)) throw new FinancialDataError("reference", `${context}.referenceLines[${index}]: level must be finite`);
		if (seen.has(level)) throw new FinancialDataError("reference", `${context}.referenceLines[${index}]: duplicate level ${level}`);
		seen.add(level);
	}
}
function nextChartTime(time, previous, context) {
	if (previous !== null && time < previous) throw new FinancialDataError("order", `${context}: time must be ordered from earliest to latest`);
	if (previous !== null && time === previous) throw new FinancialDataError("duplicate-time", `${context}: two rows resolve to the same second after Lightweight Charts truncation`);
	return time;
}
function prepareCandles(candles) {
	const rows = [];
	const data = [];
	let previousSecond = null;
	candles.forEach((candle, index) => {
		const context = `candles[${index}]`;
		const ms = financialTimeToMs(candle.time, `${context}.time`);
		const time = toChartTime(ms);
		previousSecond = nextChartTime(time, previousSecond, context);
		assertFinite(candle.open, `${context}.open`);
		assertFinite(candle.high, `${context}.high`);
		assertFinite(candle.low, `${context}.low`);
		assertFinite(candle.close, `${context}.close`);
		if (candle.high < candle.low || candle.high < candle.open || candle.high < candle.close || candle.low > candle.open || candle.low > candle.close) throw new FinancialDataError("ohlc", `${context}: require low <= open/close <= high`);
		rows.push({
			...candle,
			ms
		});
		data.push({
			time,
			open: candle.open,
			high: candle.high,
			low: candle.low,
			close: candle.close
		});
	});
	return {
		rows,
		data
	};
}
function prepareValues(points, context) {
	const data = [];
	let previousSecond = null;
	points.forEach((point, index) => {
		const rowContext = `${context}[${index}]`;
		const time = toChartTime(financialTimeToMs(point.time, `${rowContext}.time`));
		previousSecond = nextChartTime(time, previousSecond, rowContext);
		if (point.value !== null) assertFinite(point.value, `${rowContext}.value`);
		data.push(point.value === null ? { time } : {
			time,
			value: point.value
		});
	});
	return {
		source: points,
		data
	};
}
function prepareVolume(volume) {
	const data = [];
	let previousSecond = null;
	(volume ?? []).forEach((point, index) => {
		const context = `volume[${index}]`;
		const time = toChartTime(financialTimeToMs(point.time, `${context}.time`));
		previousSecond = nextChartTime(time, previousSecond, context);
		assertFinite(point.value, `${context}.value`);
		if (point.value < 0) throw new FinancialDataError("value", `${context}.value: volume cannot be negative`);
		data.push({
			time,
			value: point.value,
			colorDirection: point.direction
		});
	});
	return {
		source: volume ?? [],
		data
	};
}
function prepareOverlay(overlay, index) {
	if (!overlay.id.trim()) throw new FinancialDataError("identity", `overlays[${index}].id: id must not be empty`);
	validateReferenceLines(overlay.referenceLines, `overlays[${index}]`);
	assertNonNegativeInteger(overlay.paneIndex, `overlays[${index}]`);
	return {
		source: overlay,
		data: prepareValues(overlay.data, `overlays[${index}].data`).data
	};
}
function prepareIndicatorSeries(series, context) {
	if (!series.id.trim()) throw new FinancialDataError("identity", `${context}.id: id must not be empty`);
	return {
		source: series,
		data: prepareValues(series.data, `${context}.data`).data
	};
}
function preparePriceSeries(series, index) {
	const context = `series[${index}]`;
	const data = [];
	let previousSecond = null;
	series.data.forEach((point, pointIndex) => {
		const rowContext = `${context}.data[${pointIndex}]`;
		const time = toChartTime(financialTimeToMs(point.time, `${rowContext}.time`));
		previousSecond = nextChartTime(time, previousSecond, rowContext);
		if (point.close !== null) assertFinite(point.close, `${rowContext}.close`);
		data.push(point.close === null ? { time } : {
			time,
			value: point.close
		});
	});
	validateReferenceLines(series.referenceLines, context);
	assertNonNegativeInteger(series.paneIndex, context);
	const id = series.id ?? `price-${index}`;
	if (!id.trim()) throw new FinancialDataError("identity", `${context}.id: id must not be empty`);
	return {
		source: series,
		id,
		label: series.label ?? id,
		kind: series.kind ?? "line",
		data
	};
}
function validateFinancialRange(range) {
	if (range === void 0 || range === null) return;
	assertFinite(range.from, "range.from");
	assertFinite(range.to, "range.to");
	if (range.to <= range.from) throw new FinancialDataError("range", "range: require finite epoch milliseconds with to > from");
}
//#endregion
export { FinancialDataError, financialTimeToMs, prepareCandles, prepareIndicatorSeries, prepareOverlay, preparePriceSeries, prepareVolume, validateFinancialRange, validateReferenceLines };

//# sourceMappingURL=financial-data.js.map