/** A grid value: pixels as a number, or a percentage string of the host box. */
function toPixels(value, extent, fallback) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim().endsWith("%")) {
		const percent = Number.parseFloat(value);
		if (Number.isFinite(percent)) return extent * percent / 100;
	}
	return fallback;
}
/**
* The plot rectangle inside a host box, from an ECharts `grid` descriptor.
*
* The engine reports the grid as `left`/`right`/`top`/`bottom` distances, in
* pixels or percentages, so the rectangle the *reader* sees is the host box
* minus those four distances. Percentages are resolved against the host box
* because that is what the engine itself does.
*/
function plotRect(grid, size) {
	const left = toPixels(grid?.left, size.width, 0);
	const right = size.width - toPixels(grid?.right, size.width, 0);
	const top = toPixels(grid?.top, size.height, 0);
	const bottom = size.height - toPixels(grid?.bottom, size.height, 0);
	return {
		left,
		right: Math.max(left, right),
		top,
		bottom: Math.max(top, bottom)
	};
}
/**
* Resolve the exact Cartesian plate and axis under the pointer.
*
* A chart may put a different unit on each side of the same grid, and a
* multi-grid chart may reserve a gutter for more than one plot. Returning the
* axis index with the hit target is therefore mandatory: a left-axis drag must
* never edit `yAxisIndex: 0` just because that happens to be the first series.
*/
function axisTargetAt(point, grids, size, axes, options = {}) {
	const band = options.band ?? 34;
	let best = null;
	for (const grid of grids) {
		const { rect } = grid;
		if (point.y > rect.bottom && point.y <= Math.min(size.height, rect.bottom + band) && point.x >= rect.left - band && point.x <= rect.right + 2) {
			const distance = point.y - rect.bottom;
			if (!best || distance < best.distance) best = {
				target: {
					kind: "time",
					axisIndex: 0,
					gridIndex: grid.gridIndex,
					side: "bottom"
				},
				distance
			};
		}
		for (const axis of axes) {
			if (axis.gridIndex !== grid.gridIndex || point.y < rect.top - band || point.y > rect.bottom + 2) continue;
			if (!(axis.side === "right" ? point.x > rect.right && point.x <= rect.right + band : point.x < rect.left && point.x >= Math.max(0, rect.left - band))) continue;
			const distance = axis.side === "right" ? point.x - rect.right : rect.left - point.x;
			if (!best || distance < best.distance) best = {
				target: {
					kind: "value",
					axisIndex: axis.axisIndex,
					gridIndex: grid.gridIndex,
					side: axis.side
				},
				distance
			};
		}
	}
	return best?.target ?? null;
}
/**
* Scale a window around the pointer, in the engine's own percent space.
*
* `pointerFraction` is where along the plot the drag started (0 = left edge of
* the plot, 1 = right edge), and `anchorFraction` is the same point expressed in
* *window* space. The window stays anchored there while its span is multiplied
* by `1 / (1 + pixels / plotSize)`: dragging right (positive pixels) shrinks the
* span — the same direction Lightweight Charts' time-axis drag uses — and
* dragging left expands it.
*
* The result is clamped into `[0, 100]` and to a minimum span, so a drag can
* never invert or collapse the window.
*/
function scaleWindow(from, anchor, pixels, plotSize, options = {}) {
	const bounds = options.bounds ?? {
		start: 0,
		end: 100
	};
	const minSpan = options.minSpan ?? .5;
	const span = from.end - from.start;
	if (!(plotSize > 0) || !(span > 0)) return { ...from };
	const factor = 1 / (1 + pixels / plotSize);
	const anchored = Math.min(Math.max(anchor, from.start), from.end);
	const wantedSpan = Math.min(Math.max(span * factor, Math.min(minSpan, span)), bounds.end - bounds.start);
	const start = anchored - (anchored - from.start) * (wantedSpan / span);
	const clampedStart = Math.min(Math.max(start, bounds.start), bounds.end - wantedSpan);
	return {
		start: clampedStart,
		end: clampedStart + wantedSpan
	};
}
/** Where a pointer pixel sits: as a fraction of the plot, and inside the window. */
function windowFractions(from, pointerPixels, rect) {
	const size = rect.to - rect.from;
	const plotFraction = size > 0 ? Math.min(Math.max((pointerPixels - rect.from) / size, 0), 1) : .5;
	return {
		plotFraction,
		anchor: from.start + (from.end - from.start) * plotFraction
	};
}
/**
* Scale a value range around a pointer value.
*
* Same shape as `scaleWindow` but for the value axis: `pixels` is the vertical
* drag, and the range keeps its anchor value under the pointer. The floor is a
* fraction of the original span rather than an absolute number, because "how
* tight can this axis get" depends on the metric's units.
*/
function scaleValueRange(range, anchorValue, pixels, plotSize, options = {}) {
	const span = range.max - range.min;
	if (!(plotSize > 0) || !(span > 0) || !Number.isFinite(anchorValue)) return { ...range };
	const minSpan = span * (options.minSpanRatio ?? .02);
	const factor = 1 / (1 + pixels / plotSize);
	if (options.scaleMode === "log") {
		if (!(range.min > 0) || !(range.max > 0) || !(anchorValue > 0)) return { ...range };
		const logMin = Math.log10(range.min);
		const logMax = Math.log10(range.max);
		const logAnchor = Math.min(Math.max(Math.log10(anchorValue), logMin), logMax);
		const logSpan = logMax - logMin;
		const logMinSpan = logSpan * (options.minSpanRatio ?? .02);
		const wanted = Math.max(logSpan * factor, logMinSpan);
		const next = {
			min: 10 ** (logAnchor - (logAnchor - logMin) * (wanted / logSpan)),
			max: 10 ** (logAnchor + (logMax - logAnchor) * (wanted / logSpan))
		};
		return Number.isFinite(next.min) && Number.isFinite(next.max) && next.min < next.max ? next : { ...range };
	}
	const anchored = Math.min(Math.max(anchorValue, range.min), range.max);
	const wanted = Math.max(span * factor, minSpan);
	return {
		min: anchored - (anchored - range.min) * (wanted / span),
		max: anchored + (range.max - anchored) * (wanted / span)
	};
}
//#endregion
export { axisTargetAt, plotRect, scaleValueRange, scaleWindow, windowFractions };

//# sourceMappingURL=axis-drag.js.map