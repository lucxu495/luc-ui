import { formatChartValue } from "../core/formatters.js";
import { axisFragment } from "../adapters/echarts/option.js";
//#region src/charts/components/chart-common.ts
/**
* Format a 0–1 ratio as a percentage.
*
* `ChartFormat` deliberately expects an *already scaled* percentage (`42.5` →
* `"42.5%"`), because that is what a price or a return already is. A probability
* is the other convention: `0.425`. The renderer scales it, once, at the display
* boundary — the caller keeps its ratio, and no chart in the library ever
* silently multiplies a data value.
*/
function formatRatio(value, decimals = 1) {
	if (value === null || value === void 0 || Number.isNaN(value) || !Number.isFinite(value)) return "—";
	const percent = value * 100;
	const rounded = Math.abs(percent) < 5 * 10 ** -decimals ? 0 : percent;
	return `${Number(rounded.toFixed(decimals))}%`;
}
/** A 0–1 value axis whose ticks are percentages (see `formatRatio`). */
function ratioAxis(options) {
	const axis = axisFragment(options);
	const label = axis.axisLabel ?? {};
	return {
		...axis,
		axisLabel: {
			...label,
			formatter: (value) => formatRatio(value, Number.isInteger(value * 100) ? 0 : 1)
		}
	};
}
/** A 0–1 axis: percentage by default, the caller's own format when given. */
function ratioOrFormatAxis(format, options) {
	return format ? axisFragment({
		...options,
		format
	}) : ratioAxis(options);
}
/** A 0–1 value in a tooltip: percentage by default, the caller's format when given. */
function formatRatioOrValue(value, format) {
	return format ? formatChartValue(value, format) : formatRatio(value);
}
//#endregion
export { formatRatio, formatRatioOrValue, ratioAxis, ratioOrFormatAxis };

//# sourceMappingURL=chart-common.js.map