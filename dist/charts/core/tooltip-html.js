import { formatChartValue } from "./formatters.js";
//#region src/charts/core/tooltip-html.ts
function escapeHtml(value) {
	return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function swatchHtml(color) {
	return `<span class="luc-chart-tooltip__swatch" style="background-color:${color}"></span>`;
}
function tooltipRowHtml(label, value, color) {
	return `<div class="luc-chart-tooltip__row"><span class="luc-chart-tooltip__label">${color ? swatchHtml(color) : ""}${escapeHtml(label)}</span><span class="luc-chart-tooltip__value">${escapeHtml(value)}</span></div>`;
}
function tooltipGridHtml(rows, tone) {
	return `<dl class="luc-chart-tooltip__grid">${rows.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd${tone ? ` style="color:${tone}"` : ""}>${escapeHtml(value)}</dd>`).join("")}</dl>`;
}
function tooltipShellHtml(title, body, subtitle) {
	return `<div class="luc-chart-tooltip">` + (title ? `<span class="luc-chart-tooltip__title">${escapeHtml(title)}</span>` : "") + (subtitle ? `<span class="luc-chart-tooltip__subtitle">${escapeHtml(subtitle)}</span>` : "") + body + `</div>`;
}
function tooltipRuleHtml() {
	return `<div class="luc-chart-tooltip__rule"></div>`;
}
function numericFromItem(item) {
	const value = item.value;
	if (Array.isArray(value)) {
		const candidate = value[1];
		return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
	}
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return null;
}
/**
* The standard time-series / multi-series tooltip: one date header, one row per
* visible series, values right-aligned in tabular figures.
*/
function axisTooltipFormatter(config) {
	return (params) => {
		const items = Array.isArray(params) ? params : [params];
		if (items.length === 0) return "";
		const first = items[0];
		const rawX = first.axisValue ?? (Array.isArray(first.value) ? first.value[0] : void 0);
		let title;
		if (typeof rawX === "number" && Number.isFinite(rawX)) title = config.xIsTime ? formatChartValue(rawX, config.xFormat ?? { kind: "date" }) : formatChartValue(rawX, config.xFormat ?? {});
		else if (rawX === void 0 || rawX === null) title = first.axisValueLabel ?? "";
		else title = first.axisValueLabel ?? String(rawX);
		const rows = items.map((item, index) => {
			const meta = (item.seriesId ? config.metaById.get(item.seriesId) : void 0) ?? (item.seriesName ? config.metaById.get(item.seriesName) : void 0);
			const value = numericFromItem(item);
			if (meta?.hideValue || value === null) return null;
			const formatter = meta?.format ?? ((v) => formatChartValue(v));
			return {
				label: meta?.label ?? item.seriesName ?? `Series ${index + 1}`,
				color: meta?.color ?? item.color ?? config.theme.accent,
				value,
				formatted: formatter(value)
			};
		}).filter((row) => row !== null);
		if (config.sort && config.sort !== "none") rows.sort((a, b) => config.sort === "asc" ? a.value - b.value : b.value - a.value);
		let body = `<div class="luc-chart-tooltip__rows">${rows.map((row) => tooltipRowHtml(row.label, row.formatted, row.color)).join("")}</div>`;
		if (config.total && rows.length > 1) {
			const total = rows.reduce((sum, row) => sum + row.value, 0);
			body += tooltipRuleHtml();
			body += `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Total", formatChartValue(total))}</div>`;
		}
		if (config.pointDetail) {
			const detail = config.pointDetail(first);
			if (detail && detail.length > 0) {
				body += tooltipRuleHtml();
				body += tooltipGridHtml(detail);
			}
		}
		if (config.footer) body += config.footer(params);
		return tooltipShellHtml(title, body);
	};
}
//#endregion
export { axisTooltipFormatter, escapeHtml, swatchHtml, tooltipGridHtml, tooltipRowHtml, tooltipRuleHtml, tooltipShellHtml };

//# sourceMappingURL=tooltip-html.js.map