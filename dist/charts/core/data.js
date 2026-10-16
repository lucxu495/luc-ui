//#region src/charts/core/data.ts
/** Default windows for the conventional range tokens, in milliseconds. */
const DEFAULT_RANGE_DURATIONS = {
	"1h": 36e5,
	"6h": 216e5,
	"1d": 864e5,
	"1w": 6048e5,
	"1m": 2592e6,
	"3m": 78624e5,
	"6m": 157248e5,
	ytd: -1,
	"1y": 31536e6,
	"3y": 94608e6,
	"5y": 15768e7,
	all: -1
};
const MS_THRESHOLD = 1e11;
/** Read a cell from a row of any shape. The one place the loose typing lands. */
function cell(row, key) {
	return row[key];
}
function isFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}
/** Coerce a raw cell into an engine-safe number, or `null` for a gap. */
function toNumber(value) {
	if (isFiniteNumber(value)) return value;
	if (value instanceof Date) return value.getTime();
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) && value.trim() !== "" ? parsed : null;
	}
	return null;
}
function toTime(value) {
	if (value instanceof Date) {
		const time = value.getTime();
		return Number.isNaN(time) ? null : time;
	}
	if (isFiniteNumber(value)) return value;
	if (typeof value === "string") {
		const parsed = Date.parse(value);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
}
function inferKind(values, spec) {
	if (spec?.type === "time") return "time";
	if (spec?.type === "category") return "category";
	if (spec?.type === "value" || spec?.type === "log") return "value";
	if (values.some((value) => value instanceof Date)) return "time";
	if (values.every((value) => isFiniteNumber(value))) return values.some((value) => Math.abs(value) >= MS_THRESHOLD) ? "time" : "value";
	return "category";
}
/**
* Normalise rows against an x field. Time axes become millisecond numbers so
* every adapter — and the sync bus — speaks one currency.
*/
function normalizeTabular(rows, xKey, spec) {
	const key = xKey ?? "x";
	const raw = rows.map((row) => cell(row, key));
	const kind = inferKind(raw, spec);
	const x = [];
	const numericX = [];
	for (const value of raw) if (kind === "time") {
		const time = toTime(value);
		x.push(time ?? NaN);
		numericX.push(time ?? NaN);
	} else if (kind === "value") {
		const num = toNumber(value);
		x.push(num ?? NaN);
		numericX.push(num ?? NaN);
	} else {
		x.push(typeof value === "string" ? value : String(value ?? ""));
		numericX.push(NaN);
	}
	return {
		rows,
		x,
		kind,
		numericX
	};
}
/** Values for one series, aligned to the row order, gaps preserved as null. */
function seriesValues(series, rows) {
	if (series.data) return series.data.map((entry) => {
		if (Array.isArray(entry)) return toNumber(entry[1]);
		return toNumber(entry);
	});
	return rows.map((row) => toNumber(cell(row, series.key)));
}
/** `[x, y]` pairs, dropping rows whose x could not be parsed. */
function seriesPairs(series, normalized) {
	const values = seriesValues(series, normalized.rows);
	const pairs = [];
	for (let index = 0; index < normalized.x.length; index += 1) {
		const x = normalized.x[index];
		if (x === void 0) continue;
		if (typeof x === "number" && Number.isNaN(x)) continue;
		pairs.push([x, values[index] ?? null]);
	}
	return pairs;
}
function extent(values) {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const value of values) {
		if (!isFiniteNumber(value)) continue;
		if (value < min) min = value;
		if (value > max) max = value;
	}
	if (min === Number.POSITIVE_INFINITY) return null;
	return [min, max];
}
/**
* The trailing window for a range token, anchored to the newest data point
* rather than wall-clock time so a demo with fixed data never renders empty.
*/
function resolveRangeWindow(numericX, range, ranges) {
	const duration = (ranges?.durations ?? DEFAULT_RANGE_DURATIONS)[range];
	if (duration === void 0 || duration <= 0) return null;
	let to = Number.NEGATIVE_INFINITY;
	for (const value of numericX) if (Number.isFinite(value) && value > to) to = value;
	if (!Number.isFinite(to)) return null;
	return {
		from: to - duration,
		to
	};
}
function sliceWindow(rows, numericX, window) {
	if (!window) return [...rows];
	const result = [];
	for (let index = 0; index < rows.length; index += 1) {
		const x = numericX[index];
		if (x === void 0 || !Number.isFinite(x)) continue;
		if (x >= window.from && x <= window.to) result.push(rows[index]);
	}
	return result;
}
/** Nearest x value to a target — the shared-cursor lookup for sync groups. */
function nearestIndex(x, target) {
	if (x.length === 0) return -1;
	let best = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (let index = 0; index < x.length; index += 1) {
		const value = x[index];
		if (value === void 0 || !Number.isFinite(value)) continue;
		const distance = Math.abs(value - target);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = index;
		}
	}
	return best;
}
/** True when every series is empty — the chart should render the empty state. */
function isSeriesEmpty(series, rows) {
	if (rows.length === 0) return true;
	return series.every((item) => extent(seriesValues(item, rows)) === null);
}
//#endregion
export { DEFAULT_RANGE_DURATIONS, cell, extent, isFiniteNumber, isSeriesEmpty, nearestIndex, normalizeTabular, resolveRangeWindow, seriesPairs, seriesValues, sliceWindow, toNumber };

//# sourceMappingURL=data.js.map