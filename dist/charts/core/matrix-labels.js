//#region src/charts/core/matrix-labels.ts
/**
* The smallest cell that keeps a coefficient readable.
*
* `width` fits `-0.42` (five glyphs) at `--text-micro` in the mono face plus a
* little breathing room; `height` is the same text's line box. Below either
* number the label stops being information and becomes texture.
*/
const MATRIX_LABEL_MIN_CELL = {
	width: 44,
	height: 18
};
/**
* Should the coefficients be drawn?
*
* `always` trusts the caller; `never` is honoured unconditionally; `auto`
* requires a real measurement. An unmeasured chart (zero or non-finite size —
* before layout, or inside a hidden container) stays unlabelled rather than
* guessing, and ECharts re-asks on every resize.
*/
function shouldShowMatrixValues(policy) {
	if (policy.mode === "never") return false;
	if (policy.mode === "always") return true;
	const { rows, columns, plotWidth, plotHeight } = policy;
	if (!rows || !columns || rows < 1 || columns < 1) return false;
	if (!Number.isFinite(plotWidth) || !Number.isFinite(plotHeight)) return false;
	if (!plotWidth || !plotHeight || plotWidth <= 0 || plotHeight <= 0) return false;
	const minCellWidth = policy.minCellWidth ?? MATRIX_LABEL_MIN_CELL.width;
	const minCellHeight = policy.minCellHeight ?? MATRIX_LABEL_MIN_CELL.height;
	return plotWidth / columns >= minCellWidth && plotHeight / rows >= minCellHeight;
}
/**
* The axis gutter the correlation grid reserves, used to turn a chart size into
* a plot size. It mirrors `gridFragment({ top: 12, bottom: 40, left: 10, right: 14 })`
* plus the label extents `containLabel` adds (84px of y labels + 8px margin).
*/
const CORRELATION_PLOT_INSET = {
	left: 102,
	top: 12,
	right: 14,
	bottom: 48
};
/**
* The axis gutter the categorical heatmap reserves, mirroring
* `gridFragment({ top: 12, bottom: 56, left: 8, right: 12 })` plus the label
* extents `containLabel` adds (an 80px y band + 8px margin, and the category
* labels + legend beneath the grid).
*/
const HEATMAP_PLOT_INSET = {
	left: 96,
	top: 12,
	right: 12,
	bottom: 72
};
/** Turn a rendered chart box into a plot area for a given inset. */
function matrixPlotArea(width, height, rows, columns, inset) {
	return {
		rows,
		columns,
		plotWidth: width - inset.left - inset.right,
		plotHeight: height - inset.top - inset.bottom
	};
}
function correlationPlotArea(width, height, rows, columns) {
	return matrixPlotArea(width, height, rows, columns, CORRELATION_PLOT_INSET);
}
/** The plot area a categorical heatmap's rendered size implies. */
function heatmapPlotArea(width, height, rows, columns) {
	return matrixPlotArea(width, height, rows, columns, HEATMAP_PLOT_INSET);
}
//#endregion
export { CORRELATION_PLOT_INSET, HEATMAP_PLOT_INSET, MATRIX_LABEL_MIN_CELL, correlationPlotArea, heatmapPlotArea, matrixPlotArea, shouldShowMatrixValues };

//# sourceMappingURL=matrix-labels.js.map