"use client";
import { toneColor, withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { annotationMarks } from "../adapters/echarts/marks.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/distribution-charts.tsx
/** The engine's own axis title, styled to the plate's micro typography. */
function axisTitle(name, theme) {
	if (!name) return {};
	return {
		name,
		nameLocation: "middle",
		nameGap: 30,
		nameTextStyle: {
			color: theme.axisLabel,
			fontFamily: theme.fontFamily,
			fontSize: theme.fontMicro
		}
	};
}
/**
* Distribution of a prepared, pre-binned sample.
*
* The bars are unstacked, unbordered and separated by the plot background, so
* the shape of the distribution is the only thing the eye has to read.
*/
function HistogramChart({ bins, xFormat, format, tone, annotations, title, description, state = "ready", height, className, ariaLabel, ariaDescription, xLabel, yLabel, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const color = toneColor(theme, tone ?? "accent", 0);
		const maxCount = Math.max(0, ...bins.map((bin) => bin.count));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 16,
				right: 12,
				bottom: xLabel ? 26 : 6
			}),
			xAxis: {
				...axisFragment({
					theme,
					type: "category",
					baseline: true,
					showGrid: false
				}),
				...axisTitle(xLabel, theme),
				data: bins.map((bin) => formatChartValue(bin.from, xFormat)),
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					hideOverlap: true,
					margin: 8
				}
			},
			yAxis: {
				...axisFragment({
					theme,
					type: "value",
					position: "right",
					format,
					min: 0,
					showGrid: true
				}),
				...yLabel ? {
					name: yLabel,
					nameLocation: "end",
					nameGap: 12,
					nameTextStyle: {
						color: theme.axisLabel,
						fontFamily: theme.fontFamily,
						fontSize: theme.fontMicro
					}
				} : {}
			},
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const bin = bins[(Array.isArray(params) ? params : [params])[0]?.dataIndex ?? -1];
					if (!bin) return "";
					const span = `${formatChartValue(bin.from, xFormat)} – ${formatChartValue(bin.to, xFormat)}`;
					const servedShare = bin.share;
					const rows = [["Count", formatChartValue(bin.count, format)]];
					if (typeof servedShare === "number" && Number.isFinite(servedShare)) rows.push(["Share", formatChartValue(servedShare * 100, {
						kind: "percent",
						decimals: 2
					})]);
					return tooltipShellHtml(span, tooltipGridHtml(rows));
				}
			}),
			series: [{
				id: "histogram",
				type: "bar",
				barCategoryGap: "12%",
				barMaxWidth: 40,
				itemStyle: {
					color: withAlpha(color, .72),
					borderRadius: [
						3,
						3,
						0,
						0
					]
				},
				emphasis: { itemStyle: {
					color,
					opacity: 1
				} },
				data: bins.map((bin) => bin.count),
				...annotationMarks(theme, annotations, maxCount)
			}]
		};
	}, [
		annotations,
		bins,
		format,
		motion,
		theme,
		tone,
		xFormat,
		xLabel,
		yLabel
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: bins.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Histogram",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* DistributionChart — the research-grade histogram.
*
* A histogram answers "what shape is this sample?". Two things make it
* research-grade rather than decorative: a **density overlay** (so the shape is
* not read off bar heights alone) and **reference markers** for the median and
* mean, which is where a distribution's asymmetry becomes visible.
*
* Everything statistical arrives prepared. LUC UI bins nothing, fits nothing and
* computes no percentile (§40) — it draws the caller's numbers.
*/
function DistributionChart({ bins, density, references, signed = false, xFormat, format, tone, annotations, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "standard", bins.length);
	const option = useMemo(() => {
		const accent = toneColor(theme, tone ?? "accent", 0);
		const labels = bins.map((bin) => formatChartValue(bin.from, xFormat));
		const maxCount = Math.max(0, ...bins.map((bin) => bin.count));
		const maxDensity = density ? Math.max(...density.y.map((value) => Math.abs(value)), 0) : 0;
		const hasNegative = bins.some((bin) => bin.from < 0 || bin.to < 0);
		const useSign = signed && hasNegative;
		const markerStyles = {
			median: seriesColor(theme, "primary"),
			mean: toneColor(theme, "warning", 0),
			percentile: theme.reference,
			threshold: toneColor(theme, "negative", 0)
		};
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 14,
				bottom: 6
			}),
			xAxis: {
				...axisFragment({
					theme,
					type: "category",
					baseline: true,
					showGrid: false
				}),
				data: labels,
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					hideOverlap: true,
					margin: 8
				}
			},
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format,
				min: 0,
				showGrid: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const items = Array.isArray(params) ? params : [params];
					const source = items.find((item) => item.seriesId === "distribution") ?? items[0];
					const bin = source?.dataIndex !== void 0 ? bins[source.dataIndex] : void 0;
					if (!bin) return "";
					const rows = [["Count", formatChartValue(bin.count, format)]];
					if (maxCount > 0) rows.push(["Share of peak", formatChartValue(bin.count / maxCount * 100, { kind: "percent" })]);
					const densityPoint = density && source?.dataIndex !== void 0 ? density.y[source.dataIndex] : void 0;
					if (densityPoint !== void 0) rows.push([density?.label ?? "Density", formatChartValue(densityPoint, format)]);
					return tooltipShellHtml(`${formatChartValue(bin.from, xFormat)} – ${formatChartValue(bin.to, xFormat)}`, tooltipGridHtml(rows));
				}
			}),
			series: [{
				id: "distribution",
				type: "bar",
				barCategoryGap: "10%",
				barMaxWidth: 46,
				itemStyle: {
					color: (params) => {
						if (!useSign) return withAlpha(accent, .75);
						const bin = bins[params.dataIndex];
						if (!bin) return withAlpha(accent, .75);
						const centre = (bin.from + bin.to) / 2;
						return withAlpha(centre >= 0 ? theme.positive : theme.negative, .72);
					},
					borderRadius: [
						3,
						3,
						0,
						0
					]
				},
				emphasis: { itemStyle: { opacity: 1 } },
				data: bins.map((bin) => bin.count),
				...annotationMarks(theme, annotations, maxCount),
				...references && references.length ? { markLine: {
					silent: true,
					symbol: "none",
					animation: false,
					data: references.map((reference) => ({
						xAxis: nearestBinLabel(bins, reference.value, xFormat),
						lineStyle: {
							color: markerStyles[reference.kind ?? "median"] ?? theme.reference,
							width: reference.kind === "median" ? 1.6 : 1,
							type: reference.kind === "threshold" ? "dashed" : "solid"
						},
						label: {
							show: true,
							formatter: reference.label,
							position: "insideEndTop",
							color: theme.textMuted,
							fontFamily: theme.fontFamily,
							fontSize: theme.fontMicro
						}
					}))
				} } : {}
			}, ...density && maxDensity > 0 ? [{
				id: "density",
				name: density.label ?? "Density",
				type: "line",
				smooth: true,
				symbol: "none",
				z: 3,
				lineStyle: {
					color: seriesColor(theme, "benchmark"),
					width: 2
				},
				data: density.y.map((value) => Math.abs(value) / maxDensity * maxCount)
			}] : []]
		};
	}, [
		annotations,
		bins,
		density,
		format,
		motion,
		references,
		signed,
		theme,
		tone,
		xFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: bins.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Distribution",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/** The formatted bin label a value falls into (category axis coordinates). */
function nearestBinLabel(bins, value, xFormat) {
	let best = bins[0];
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const bin of bins) {
		const centre = (bin.from + bin.to) / 2;
		const distance = Math.abs(centre - value);
		if (distance < bestDistance) {
			best = bin;
			bestDistance = distance;
		}
	}
	return best ? formatChartValue(best.from, xFormat) : value;
}
/**
* Box plot with optional prepared outliers.
*
* Every mark — body, median, whiskers, caps — is drawn at rest. Hover changes
* the emphasis, never the presence: a reader who never touches the chart must
* still see the distribution. Outliers arrive pre-computed — LUC UI never
* decides what an outlier is.
*/
function BoxPlotChart({ categories, data, outliers, format, tone, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const color = toneColor(theme, tone ?? "accent", 0);
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 16,
				right: 12,
				bottom: 6
			}),
			xAxis: {
				...axisFragment({
					theme,
					type: "category",
					baseline: true,
					showGrid: false
				}),
				data: [...categories]
			},
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format,
				showGrid: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = Array.isArray(params) ? params[0] : params;
					if (item.seriesType === "scatter") {
						const pair = item.value;
						if (!pair) return "";
						return tooltipShellHtml(categories[pair[0]] ?? "Outlier", tooltipGridHtml([["Outlier", formatChartValue(pair[1], format)]]));
					}
					const summary = data[item.dataIndex ?? -1];
					if (!summary) return "";
					return tooltipShellHtml(categories[item.dataIndex ?? 0], tooltipGridHtml([
						["Max", formatChartValue(summary[4], format)],
						["Q3", formatChartValue(summary[3], format)],
						["Median", formatChartValue(summary[2], format)],
						["Q1", formatChartValue(summary[1], format)],
						["Min", formatChartValue(summary[0], format)]
					]));
				}
			}),
			series: [{
				id: "boxplot",
				type: "boxplot",
				boxWidth: ["22%", "46%"],
				itemStyle: {
					color: withAlpha(color, .24),
					borderColor: color,
					borderWidth: 1.5
				},
				emphasis: { itemStyle: {
					color: withAlpha(color, .4),
					borderColor: color,
					borderWidth: 2
				} },
				data: data.map((entry) => entry ? [...entry] : null)
			}, ...outliers?.length ? [{
				id: "outliers",
				type: "scatter",
				symbolSize: 5,
				itemStyle: {
					color: theme.surfaceRaised,
					borderColor: withAlpha(theme.neutral, .9),
					borderWidth: 1.2
				},
				data: outliers.map((outlier) => [outlier.category, outlier.value]),
				tooltip: { show: true }
			}] : []]
		};
	}, [
		categories,
		data,
		format,
		motion,
		outliers,
		theme,
		tone
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: categories.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Box plot",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { BoxPlotChart, DistributionChart, HistogramChart };

//# sourceMappingURL=distribution-charts.js.map