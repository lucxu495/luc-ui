//#region src/charts/core/sizing.ts
/**
* The default pixel heights for the named sizes.
*
* These sit beside the pre-existing 160/240/320/440 chart presets but express a
* different thing: a *shape* (a strip, an oscillator, a hero comparison) rather
* than an arbitrary configuration step. `compact` is a readout/strip height, not
* a squeezed chart; `large` is a focal, multi-series surface.
*/
const DEFAULT_CHART_SIZE_SCALE = {
	compact: 132,
	medium: 240,
	large: 340
};
/** Resolve a named size to pixels, with an optional scale override. */
function chartSizeHeight(size, scale = DEFAULT_CHART_SIZE_SCALE) {
	if (size === "compact") return scale.compact;
	if (size === "large") return scale.large;
	return scale.medium;
}
/** Default per-row height for a matrix (heatmap / calendar) row. */
const DEFAULT_MATRIX_ROW_HEIGHT = 26;
/** Default per-row height for a horizontal bar row (a year of returns). */
const DEFAULT_BAR_ROW_HEIGHT = 24;
/** Default header/footer bands for row-derived charts. */
const DEFAULT_ROW_HEADER = 24;
const DEFAULT_ROW_FOOTER = 48;
const DEFAULT_ROW_MIN = 140;
const DEFAULT_ROW_MAX = 960;
/**
* A height that grows with the number of rows.
*
* `rows` is clamped to at least one so an empty grid still reserves a readable
* band. The result is clamped to `[min, max]`; the caller can tighten either
* end. The arithmetic is intentionally simple and stable — no measurement, no
* DOM — so SSR and the client agree on the box before the engine measures.
*/
function rowsHeight(options) {
	const rows = Math.max(1, Math.floor(Number.isFinite(options.rows) ? options.rows : 1));
	const rowHeight = options.rowHeight ?? 26;
	const header = options.header ?? 24;
	const footer = options.footer ?? 48;
	const min = options.min ?? 140;
	const max = options.max ?? 960;
	const height = header + rows * rowHeight + footer;
	return Math.max(min, Math.min(max, Math.round(height)));
}
/** A matrix/heatmap height derived from the number of rows. */
function matrixHeight(rows, options = {}) {
	return rowsHeight({
		rows,
		rowHeight: 26,
		...options
	});
}
/** A horizontal bar height derived from the number of category rows. */
function horizontalBarHeight(rows, options = {}) {
	return rowsHeight({
		rows,
		rowHeight: 24,
		...options
	});
}
/**
* The smallest number of rows a matrix may show before it is asked to scroll
* rather than shrink — a companion to {@link matrixHeight} for the responsive
* rule that a dense matrix keeps legible cells and scrolls instead of becoming
* illegible text.
*/
function matrixMinReadableRows(availableHeight, minRowHeight = 26) {
	if (!Number.isFinite(availableHeight) || availableHeight <= 0) return 1;
	return Math.max(1, Math.floor((availableHeight - 24 - 48) / minRowHeight));
}
//#endregion
export { DEFAULT_BAR_ROW_HEIGHT, DEFAULT_CHART_SIZE_SCALE, DEFAULT_MATRIX_ROW_HEIGHT, DEFAULT_ROW_FOOTER, DEFAULT_ROW_HEADER, DEFAULT_ROW_MAX, DEFAULT_ROW_MIN, chartSizeHeight, horizontalBarHeight, matrixHeight, matrixMinReadableRows, rowsHeight };

//# sourceMappingURL=sizing.js.map