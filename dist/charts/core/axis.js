//#region src/charts/core/axis.ts
/**
* The default for an ordinary single-Y-axis LUC chart.
*
* Percentages are not a reason to move to the left: a drawdown, a funding rate
* and a moving average all read better with the plate on the right, matching the
* financial lane. A left axis means "this is a second, genuinely different
* unit" (or the chart's own documented convention).
*/
const DEFAULT_Y_AXIS_SIDE = "right";
const LINEAR_ONLY = ["linear"];
/** The capability of a chart that never leaves a linear axis. */
const LINEAR_SCALE_CAPABILITY = {
	allowedScaleModes: LINEAR_ONLY,
	defaultScaleMode: "linear"
};
/**
* Normalise a declared capability.
*
* An empty allow-list, a duplicate, or a default outside the allow-list are all
* caller mistakes that must not produce a broken axis: they collapse to the
* safe linear-only capability.
*/
function normalizeScaleCapability(input) {
	if (!input) return LINEAR_SCALE_CAPABILITY;
	const allowed = [];
	for (const mode of input.allowed ?? LINEAR_ONLY) {
		if (mode !== "linear" && mode !== "log") continue;
		if (!allowed.includes(mode)) allowed.push(mode);
	}
	if (allowed.length === 0) return LINEAR_SCALE_CAPABILITY;
	const fallback = allowed.includes("linear") ? "linear" : allowed[0];
	const preferred = input.default;
	return {
		allowedScaleModes: allowed,
		defaultScaleMode: preferred && allowed.includes(preferred) ? preferred : fallback
	};
}
/** True when every finite value is strictly positive — the only valid log domain. */
function isLogEligible(values) {
	let seen = false;
	for (const value of values) {
		if (typeof value !== "number" || !Number.isFinite(value)) continue;
		seen = true;
		if (value <= 0) return false;
	}
	return seen;
}
/**
* Resolve the mode a chart will actually render.
*
* A requested mode that is not allowed, or whose data contains a zero or a
* negative value, resolves to linear. The caller gets the reason so a
* development warning can name it; production simply draws the linear chart
* instead of an axis pinned to `[1, 10]`.
*/
function resolveScaleMode(options) {
	const capability = options.capability ?? LINEAR_SCALE_CAPABILITY;
	if ((options.requested ?? capability.defaultScaleMode) !== "log") return {
		mode: "linear",
		fallback: null
	};
	if (!capability.allowedScaleModes.includes("log")) return {
		mode: "linear",
		fallback: "not-allowed"
	};
	if (options.values && !isLogEligible(options.values)) return {
		mode: "linear",
		fallback: "non-positive-data"
	};
	return {
		mode: "log",
		fallback: null
	};
}
/** Headroom for a plain line/area edge, as a fraction of the span. */
const DEFAULT_AXIS_PADDING = .1;
/** Headroom when a symbol, halo or glow is drawn on the extreme value. */
const MARKER_AXIS_PADDING = .16;
/** Headroom for a log edge, as a fraction of the log span. */
const LOG_AXIS_PADDING = .05;
/** Below this share of the centre value a span is treated as flat. */
const MIN_SPAN_RATIO = .002;
const NICE_STEPS = [
	1,
	2,
	2.5,
	5,
	10
];
/**
* The 1 / 2 / 2.5 / 5 / 10 step at or above `raw`. Exported because a
* domain-aware custom axis may want the same tick rhythm.
*/
function niceStep(raw) {
	if (!Number.isFinite(raw) || raw <= 0) return 1;
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const normalized = raw / magnitude;
	return (NICE_STEPS.find((candidate) => normalized <= candidate + 1e-9) ?? 10) * magnitude;
}
/** Kill floating-point dust without losing a real magnitude. */
function tidy(value) {
	if (!Number.isFinite(value) || value === 0) return value;
	return Number(value.toPrecision(12));
}
function finiteExtent(extent) {
	return Number.isFinite(extent.min) && Number.isFinite(extent.max) && extent.max >= extent.min;
}
/**
* Give an extent its display headroom and readable bounds.
*
* Rules, in order:
*
* - **A zero edge is a boundary.** If the data is non-negative the low edge
*   stays at the data minimum (never padded below zero); if the data is
*   non-positive the high edge stays at the data maximum. A drawdown can
*   therefore never show a positive tick, and volatility can never show a
*   negative one.
* - **Every other edge gets proportional headroom**, so the extreme value, its
*   stroke and any marker are drawn inside the plot rather than on its border.
* - **Flat and near-flat series** get a minimum visual span instead of a
*   zero-height domain.
* - **The interior ticks stay round** because the engine computes its own tick
*   interval from the extent; the padded edges are *headroom* and are marked as
*   such (`minHeadroom` / `maxHeadroom`) so no axis labels them.
*/
function resolveAxisBounds(input) {
	const include = input.include?.filter((value) => Number.isFinite(value)) ?? [];
	const raw = include.length ? {
		min: Math.min(input.extent.min, ...include),
		max: Math.max(input.extent.max, ...include)
	} : input.extent;
	if (!finiteExtent(raw)) return {
		...raw,
		minHeadroom: false,
		maxHeadroom: false
	};
	const scaleMode = input.scaleMode ?? "linear";
	const padding = input.padding ?? (input.marker ? .16 : .1);
	if (scaleMode === "log") {
		const low = raw.min > 0 ? raw.min : Number.MIN_VALUE;
		const high = raw.max > 0 ? Math.max(raw.max, low * 1.000001) : low * 10;
		const logLow = Math.log10(low);
		const logHigh = Math.log10(high);
		const pad = (logHigh - logLow) * (input.padding ?? .05);
		return {
			min: tidy(10 ** (logLow - pad)),
			max: tidy(10 ** (logHigh + pad)),
			minHeadroom: pad > 0,
			maxHeadroom: pad > 0
		};
	}
	let low = raw.min;
	let high = raw.max;
	const span = high - low;
	if (!(span > 0)) {
		const half = niceStep(Math.abs(low) * .05 || 1);
		low -= half;
		high += half;
	} else {
		const centre = (low + high) / 2;
		const minimumSpan = niceStep(Math.abs(centre) * MIN_SPAN_RATIO);
		if (span < minimumSpan) {
			low = centre - minimumSpan / 2;
			high = centre + minimumSpan / 2;
		}
	}
	const pad = (high - low) * padding;
	let padLow = pad;
	let padHigh = pad;
	if (input.zeroBaseline && raw.min >= 0) {
		low = 0;
		padLow = 0;
	}
	if (input.zeroBaseline && raw.max <= 0) {
		high = 0;
		padHigh = 0;
	}
	let min = low - padLow;
	let max = high + padHigh;
	let minIsFloor = false;
	let maxIsCeiling = false;
	if (raw.min > 0 && min < 0) {
		min = 0;
		minIsFloor = true;
	}
	if (raw.max < 0 && max > 0) {
		max = 0;
		maxIsCeiling = true;
	}
	const semanticMin = input.zeroBaseline && raw.min >= 0 ? 0 : raw.min;
	const semanticMax = input.zeroBaseline && raw.max <= 0 ? 0 : raw.max;
	return {
		min: tidy(min),
		max: tidy(max),
		minHeadroom: !minIsFloor && min < semanticMin,
		maxHeadroom: !maxIsCeiling && max > semanticMax
	};
}
/** `resolveAxisBounds` over a value list, or `null` when nothing is plottable. */
function resolveAxisDomain(values, options = {}) {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const value of values) {
		if (typeof value !== "number" || !Number.isFinite(value)) continue;
		if (value < min) min = value;
		if (value > max) max = value;
	}
	if (min === Number.POSITIVE_INFINITY) return null;
	return resolveAxisBounds({
		...options,
		extent: {
			min,
			max
		}
	});
}
function axisBoundFn(edge, options = {}) {
	return (extent) => {
		if (!Number.isFinite(extent.min) || !Number.isFinite(extent.max)) return extent[edge];
		const bounds = resolveAxisBounds({
			...options,
			extent
		});
		return edge === "min" ? bounds.min : bounds.max;
	};
}
const CHART_PLOT_LAYOUT = {
	edgeInset: 6,
	axisGutter: 60,
	topInset: 16,
	bottomInset: 12
};
/**
* Resolve the ECharts `grid` rectangle for a set of axis sides.
*
* `containLabel` stays **off**: letting ECharts grow the grid to fit whatever
* labels a chart happens to render is exactly what made two stacked charts share
* a crosshair but not a plot width.
*/
function resolveChartPlotRect(yAxisSides, layout = CHART_PLOT_LAYOUT) {
	const hasLeft = yAxisSides.includes("left");
	const hasRight = yAxisSides.includes("right");
	return {
		left: hasLeft ? layout.axisGutter : layout.edgeInset,
		right: hasRight ? layout.axisGutter : layout.edgeInset,
		top: layout.topInset,
		bottom: layout.bottomInset,
		containLabel: false
	};
}
/** The label margin inside a reserved gutter, in px. */
const AXIS_LABEL_MARGIN = 8;
//#endregion
export { AXIS_LABEL_MARGIN, CHART_PLOT_LAYOUT, DEFAULT_AXIS_PADDING, DEFAULT_Y_AXIS_SIDE, LINEAR_SCALE_CAPABILITY, LOG_AXIS_PADDING, MARKER_AXIS_PADDING, axisBoundFn, isLogEligible, niceStep, normalizeScaleCapability, resolveAxisBounds, resolveAxisDomain, resolveChartPlotRect, resolveScaleMode };

//# sourceMappingURL=axis.js.map