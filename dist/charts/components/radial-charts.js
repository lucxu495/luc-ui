"use client";
import { toneColor, withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { baseOption, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/radial-charts.tsx
/**
* Radar comparison.
*
* Two or three series, thin strokes, a low-alpha fill and no vertex symbols —
* the classic radar failure mode is five heavy overlapping shapes with dots.
*/
function RadarChart({ indicators, series, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const maxima = indicators.map((indicator, index) => {
			if (indicator.max !== void 0) return indicator.max;
			const values = series.map((entry) => entry.values[index] ?? 0);
			return Math.max(1, ...values);
		});
		return {
			...baseOption(theme, motion),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = Array.isArray(params) ? params[0] : params;
					const rows = indicators.map((indicator, index) => [indicator.name, formatChartValue((item.value ?? [])[index] ?? null, format)]);
					return tooltipShellHtml(item.name, tooltipGridHtml(rows));
				}
			}),
			radar: {
				indicator: indicators.map((indicator, index) => ({
					name: indicator.name,
					max: maxima[index]
				})),
				shape: "polygon",
				splitNumber: 4,
				radius: "82%",
				center: ["50%", "53%"],
				axisName: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				axisLine: { lineStyle: {
					color: theme.gridStrong,
					width: 1
				} },
				splitLine: { lineStyle: {
					color: theme.grid,
					width: 1
				} },
				splitArea: { show: false }
			},
			series: [{
				id: "radar",
				type: "radar",
				symbol: "none",
				emphasis: {
					focus: "series",
					areaStyle: { opacity: .22 }
				},
				data: series.map((entry, index) => {
					const color = entry.color ?? toneColor(theme, entry.tone, index);
					return {
						name: entry.name,
						value: [...entry.values],
						lineStyle: {
							width: 2,
							color
						},
						itemStyle: { color },
						areaStyle: { color: withAlpha(color, .13) }
					};
				})
			}]
		};
	}, [
		format,
		indicators,
		motion,
		series,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: series.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Radar comparison",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* Compact gauge.
*
* No pointer, no glossy arc, no purple gradient: a thin track, a single accent
* progress stroke and a large tabular readout. It reads as instrumentation, not
* as a car dashboard.
*/
function GaugeChart({ value, min = 0, max = 100, label, format, thresholds, variant = "ring", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const track = thresholds?.length ? thresholds.map((threshold, index) => {
			const previous = index === 0 ? min : thresholds[index - 1]?.value ?? min;
			const span = (threshold.value - previous) / (max - min);
			return [Math.max(0, span), withAlpha(toneColor(theme, threshold.tone, index), .28)];
		}) : [[1, withAlpha(theme.neutral, .2)]];
		const semi = variant === "semi";
		return {
			...baseOption(theme, motion),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: () => tooltipShellHtml(label ?? title, `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Value", formatChartValue(value, format))}${tooltipRowHtml("Of range", max > min ? formatChartValue((value - min) / (max - min) * 100, { kind: "percent" }) : "—")}</div>`)
			}),
			series: [{
				id: "gauge",
				type: "gauge",
				startAngle: semi ? 200 : 225,
				endAngle: semi ? -20 : -45,
				min,
				max,
				center: ["50%", "58%"],
				radius: semi ? "88%" : "84%",
				splitNumber: 5,
				progress: {
					show: true,
					width: 12,
					roundCap: true,
					itemStyle: { color: theme.accent }
				},
				axisLine: { lineStyle: {
					width: 12,
					color: track,
					shadowBlur: 0
				} },
				pointer: { show: false },
				anchor: { show: false },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: { show: false },
				title: {
					show: Boolean(label),
					offsetCenter: [0, "34%"],
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				detail: {
					valueAnimation: !motion.reduced,
					offsetCenter: [0, "2%"],
					color: theme.textPrimary,
					fontFamily: theme.fontFamily,
					fontSize: 24,
					fontWeight: 600,
					formatter: (input) => formatChartValue(input, format)
				},
				data: [{
					value,
					name: label ?? title ?? ""
				}]
			}]
		};
	}, [
		format,
		label,
		max,
		min,
		motion,
		theme,
		thresholds,
		title,
		value,
		variant
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: Number.isFinite(value) ? state : "empty",
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? label ?? "Gauge",
		ariaDescription: ariaDescription ?? (label ? `${label}: ${formatChartValue(value, format)}` : description),
		onReady,
		onEvent
	});
}
//#endregion
export { GaugeChart, RadarChart };

//# sourceMappingURL=radial-charts.js.map