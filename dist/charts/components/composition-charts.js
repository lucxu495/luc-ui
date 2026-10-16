"use client";
import { formatChartValue } from "../core/formatters.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { baseOption, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/composition-charts.tsx
const PIE_LIMIT = 6;
/**
* Part-to-whole composition.
*
* Deliberately capped at six slices: past that a pie stops being readable, and
* the Showcase's chart-selection guidance says so. Series beyond the cap stay in
* the data and appear in the tooltip only through the legend/table the caller
* renders.
*/
function PieChart({ data, variant = "donut", format, centerLabel, centerValue, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const total = data.reduce((sum, entry) => sum + entry.value, 0);
		const donut = variant === "donut";
		return {
			...baseOption(theme, motion),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = Array.isArray(params) ? params[0] : params;
					const value = item.value ?? 0;
					return tooltipShellHtml(item.name, tooltipGridHtml([["Value", formatChartValue(value, format)], ["Share", total > 0 ? formatChartValue(value / total * 100, { kind: "percent" }) : "—"]]));
				}
			}),
			graphic: donut && centerValue ? [{
				type: "text",
				left: "center",
				top: "45%",
				silent: true,
				style: {
					text: centerValue,
					fill: theme.textPrimary,
					font: `600 ${theme.fontLabel}px ${theme.fontFamily}`,
					textAlign: "center"
				}
			}, centerLabel ? {
				type: "text",
				left: "center",
				top: "54%",
				silent: true,
				style: {
					text: centerLabel,
					fill: theme.textMuted,
					font: `500 ${theme.fontMicro}px ${theme.fontFamily}`,
					textAlign: "center"
				}
			} : void 0].filter(Boolean) : void 0,
			series: [{
				id: "composition",
				type: "pie",
				radius: donut ? ["58%", "82%"] : ["0%", "76%"],
				center: ["50%", "52%"],
				minAngle: 3,
				padAngle: 1.5,
				itemStyle: {
					borderColor: theme.surfaceRaised,
					borderWidth: 2,
					borderRadius: 4
				},
				label: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: "{b}"
				},
				labelLine: {
					length: 8,
					length2: 8,
					lineStyle: { color: theme.border }
				},
				emphasis: {
					scale: true,
					scaleSize: 4,
					itemStyle: {
						borderColor: theme.accent,
						borderWidth: 2
					}
				},
				data: data.map((entry) => ({
					name: entry.name,
					value: entry.value
				}))
			}]
		};
	}, [
		centerLabel,
		centerValue,
		data,
		format,
		motion,
		theme,
		variant
	]);
	const tooMany = data.length > PIE_LIMIT;
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Composition chart",
		ariaDescription: ariaDescription ?? description ?? (tooMany ? "More than six categories: consider a bar chart for readability." : void 0),
		onReady,
		onEvent
	});
}
function TreemapChart({ data, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => ({
		...baseOption(theme, motion),
		tooltip: tooltipShell(theme, {
			mode: "item",
			formatter: (params) => {
				const item = Array.isArray(params) ? params[0] : params;
				return tooltipShellHtml(item.name, tooltipGridHtml([["Size", formatChartValue(item.value, format)]]));
			}
		}),
		series: [{
			id: "treemap",
			type: "treemap",
			roam: false,
			nodeClick: false,
			breadcrumb: { show: false },
			visibleMin: 300,
			top: 4,
			bottom: 4,
			left: 4,
			right: 4,
			itemStyle: {
				borderColor: theme.surfaceRaised,
				borderWidth: 2,
				gapWidth: 2,
				borderRadius: 4
			},
			label: {
				color: theme.textPrimary,
				fontFamily: theme.fontFamily,
				fontSize: theme.fontMicro,
				overflow: "truncate"
			},
			upperLabel: { show: false },
			emphasis: { itemStyle: {
				borderColor: theme.accent,
				borderWidth: 2
			} },
			data
		}]
	}), [
		data,
		format,
		motion,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Treemap",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
function SunburstChart({ data, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => ({
		...baseOption(theme, motion),
		tooltip: tooltipShell(theme, {
			mode: "item",
			formatter: (params) => {
				const item = Array.isArray(params) ? params[0] : params;
				return tooltipShellHtml(item.name, tooltipGridHtml([["Size", formatChartValue(item.value, format)]]));
			}
		}),
		series: [{
			id: "sunburst",
			type: "sunburst",
			radius: ["12%", "86%"],
			sort: "desc",
			nodeClick: false,
			emphasis: { focus: "ancestor" },
			itemStyle: {
				borderColor: theme.surfaceRaised,
				borderWidth: 2,
				borderRadius: 3
			},
			label: {
				color: theme.textPrimary,
				fontFamily: theme.fontFamily,
				fontSize: theme.fontMicro,
				rotate: "radial",
				minAngle: 8
			},
			labelLayout: { hideOverlap: true },
			levels: [
				{},
				{
					r0: "12%",
					r: "48%",
					itemStyle: { borderWidth: 2 },
					label: {
						rotate: 0,
						minAngle: 26,
						fontSize: theme.fontCaption,
						overflow: "truncate"
					}
				},
				{
					r0: "48%",
					r: "72%",
					label: {
						rotate: "tangential",
						minAngle: 10
					}
				},
				{
					r0: "72%",
					r: "86%",
					label: {
						position: "outside",
						padding: 2,
						silent: false
					}
				}
			],
			data
		}]
	}), [
		data,
		format,
		motion,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Sunburst",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
function FunnelChart({ data, format, showValues = true, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const top = data[0]?.value ?? 0;
		return {
			...baseOption(theme, motion),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = Array.isArray(params) ? params[0] : params;
					const value = item.value ?? 0;
					return tooltipShellHtml(item.name, `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Value", formatChartValue(value, format))}${tooltipRowHtml("Of first stage", top > 0 ? formatChartValue(value / top * 100, { kind: "percent" }) : "—")}</div>`);
				}
			}),
			series: [{
				id: "funnel",
				type: "funnel",
				left: "8%",
				right: "8%",
				top: 12,
				bottom: 12,
				minSize: "24%",
				maxSize: "100%",
				sort: "descending",
				gap: 3,
				funnelAlign: "center",
				itemStyle: {
					borderColor: theme.surfaceRaised,
					borderWidth: 2,
					borderRadius: 4,
					opacity: .92
				},
				label: {
					show: true,
					position: "inside",
					color: theme.textPrimary,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: (params) => showValues ? `${params.name ?? ""}  ${formatChartValue(params.value, format)}` : params.name ?? ""
				},
				labelLine: { show: false },
				emphasis: { label: { fontWeight: 600 } },
				data: data.map((entry) => ({
					name: entry.name,
					value: entry.value
				}))
			}]
		};
	}, [
		data,
		format,
		motion,
		showValues,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Funnel",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { FunnelChart, PieChart, SunburstChart, TreemapChart };

//# sourceMappingURL=composition-charts.js.map