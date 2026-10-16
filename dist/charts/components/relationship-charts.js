"use client";
import { toneColor, withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/relationship-charts.tsx
/**
* ScatterRegressionChart — observations plus a prepared fit.
*
* The one rule that matters: the fit is **input**, not output. LUC UI may not
* compute a regression (that is a research calculation, §40), so the caller
* passes slope/intercept and, optionally, a confidence band it already has.
*
* Points are drawn small and translucent so overlap reads as density — the
* shape of the cloud is the finding; a scatter of opaque dots is a smudge.
*/
function ScatterRegressionChart({ points, regression, band, zeroLines, emphasis, pointLabel = "Observations", regressionLabel = "Fit", xFormat, yFormat, xLabel, yLabel, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "standard", points.length);
	const pointColor = seriesColor(theme, "primary");
	const fitColor = toneColor(theme, "warning", 0);
	const option = useMemo(() => {
		const xs = points.map((point) => point.x);
		const ys = points.map((point) => point.y);
		const xMin = Math.min(...xs, regression?.from ?? Number.POSITIVE_INFINITY);
		const xMax = Math.max(...xs, regression?.to ?? Number.NEGATIVE_INFINITY);
		const emphasised = new Set(emphasis ?? []);
		const crossesZero = (values) => values.some((value) => value <= 0) && values.some((value) => value >= 0);
		const showZero = zeroLines ?? (crossesZero(xs) || crossesZero(ys));
		const series = [{
			id: "observations",
			name: pointLabel,
			type: "scatter",
			symbolSize: 7,
			itemStyle: { color: withAlpha(pointColor, .55) },
			emphasis: {
				focus: "series",
				itemStyle: {
					color: pointColor,
					borderColor: theme.surface,
					borderWidth: 1
				}
			},
			data: points.map((point) => ({
				value: [point.x, point.y],
				...point.label ? { name: point.label } : {},
				itemStyle: emphasised.has(point.label ?? "") ? {
					color: fitColor,
					borderColor: theme.surface,
					borderWidth: 1
				} : void 0
			})),
			...showZero ? { markLine: {
				silent: true,
				symbol: "none",
				animation: false,
				lineStyle: {
					color: theme.reference,
					width: 1,
					type: "dotted"
				},
				label: { show: false },
				data: [{ xAxis: 0 }, { yAxis: 0 }]
			} } : {}
		}];
		if (band && band.xValues.length > 0) {
			series.push({
				id: "regression-band",
				name: band.label ?? "Confidence band",
				type: "line",
				stack: "band",
				silent: true,
				symbol: "none",
				lineStyle: { opacity: 0 },
				areaStyle: { opacity: 0 },
				data: band.xValues.map((x, index) => [x, band.lower[index] ?? null])
			});
			series.push({
				id: "regression-band-fill",
				type: "line",
				stack: "band",
				silent: true,
				symbol: "none",
				lineStyle: { opacity: 0 },
				areaStyle: { color: withAlpha(fitColor, theme.mode === "dark" ? .16 : .12) },
				data: band.xValues.map((x, index) => {
					const low = band.lower[index];
					const high = band.upper[index];
					return [x, low === void 0 || high === void 0 ? null : Math.max(0, high - low)];
				})
			});
		}
		if (regression) {
			const from = regression.from ?? xMin;
			const to = regression.to ?? xMax;
			series.push({
				id: "regression",
				name: regressionLabel,
				type: "line",
				symbol: "none",
				lineStyle: {
					color: fitColor,
					width: 2,
					type: "dashed"
				},
				data: [[from, regression.slope * from + regression.intercept], [to, regression.slope * to + regression.intercept]]
			});
		}
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 16,
				bottom: 6
			}),
			xAxis: axisFragment({
				theme,
				type: "value",
				format: xFormat,
				name: xLabel,
				scale: true
			}),
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format: yFormat,
				name: yLabel,
				scale: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const entry = Array.isArray(params) ? params[0] : params;
					if (!entry?.value || entry.seriesId !== "observations") return "";
					const [x, y] = entry.value;
					return tooltipShellHtml(entry.name ?? void 0, tooltipGridHtml([[xLabel ?? "x", formatChartValue(x, xFormat)], [yLabel ?? "y", formatChartValue(y, yFormat)]]));
				}
			}),
			series
		};
	}, [
		band,
		emphasis,
		fitColor,
		motion,
		pointColor,
		pointLabel,
		points,
		regression,
		regressionLabel,
		theme,
		xFormat,
		xLabel,
		yFormat,
		yLabel,
		zeroLines
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: points.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Scatter with regression",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* QuadrantScatterChart — a scatter split into four named regions.
*
* The reference lines and their labels are the chart: without them this is just
* a scatter. Labels are positioned in the corner of each quadrant rather than on
* the axis, so the reading ("above the benchmark *and* below zero") is stated
* where the reader is looking.
*/
function QuadrantScatterChart({ points, xReference, yReference, quadrantLabels, pointTone, pointLabel = "Observations", xFormat, yFormat, xLabel, yLabel, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "standard", points.length);
	const color = toneColor(theme, pointTone ?? "accent", 0);
	const option = useMemo(() => {
		const labels = [];
		const xs = points.map((point) => point.x);
		const ys = points.map((point) => point.y);
		const xMin = Math.min(xReference, ...xs);
		const xMax = Math.max(xReference, ...xs);
		const yMin = Math.min(yReference, ...ys);
		const yMax = Math.max(yReference, ...ys);
		const insetX = (xMax - xMin) * .06;
		const insetY = (yMax - yMin) * .08;
		if (quadrantLabels?.topRight) labels.push({
			name: quadrantLabels.topRight,
			xAxis: xMax - insetX,
			yAxis: yMax - insetY
		});
		if (quadrantLabels?.topLeft) labels.push({
			name: quadrantLabels.topLeft,
			xAxis: xMin + insetX,
			yAxis: yMax - insetY
		});
		if (quadrantLabels?.bottomRight) labels.push({
			name: quadrantLabels.bottomRight,
			xAxis: xMax - insetX,
			yAxis: yMin + insetY
		});
		if (quadrantLabels?.bottomLeft) labels.push({
			name: quadrantLabels.bottomLeft,
			xAxis: xMin + insetX,
			yAxis: yMin + insetY
		});
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 16,
				bottom: 6
			}),
			xAxis: axisFragment({
				theme,
				type: "value",
				format: xFormat,
				name: xLabel,
				scale: true
			}),
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format: yFormat,
				name: yLabel,
				scale: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const entry = Array.isArray(params) ? params[0] : params;
					if (!entry?.value) return "";
					return tooltipShellHtml(entry.name ?? void 0, tooltipGridHtml([[xLabel ?? "x", formatChartValue(entry.value[0], xFormat)], [yLabel ?? "y", formatChartValue(entry.value[1], yFormat)]]));
				}
			}),
			series: [{
				id: "quadrant",
				name: pointLabel,
				type: "scatter",
				symbolSize: 9,
				itemStyle: { color: withAlpha(color, .6) },
				emphasis: { itemStyle: {
					color,
					borderColor: theme.surface,
					borderWidth: 1
				} },
				data: points.map((point) => ({
					value: [point.x, point.y],
					...point.label ? { name: point.label } : {}
				})),
				markLine: {
					silent: true,
					symbol: "none",
					animation: false,
					lineStyle: {
						color: theme.reference,
						width: 1,
						type: "dashed"
					},
					label: { show: false },
					data: [{ xAxis: xReference }, { yAxis: yReference }]
				}
			}, ...labels.length ? [{
				id: "quadrant-labels",
				type: "scatter",
				silent: true,
				symbolSize: 0,
				label: {
					show: true,
					formatter: "{b}",
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				data: labels.map((entry) => ({
					value: [entry.xAxis, entry.yAxis],
					name: entry.name
				}))
			}] : []]
		};
	}, [
		color,
		motion,
		pointLabel,
		points,
		quadrantLabels,
		theme,
		xFormat,
		xLabel,
		xReference,
		yFormat,
		yLabel,
		yReference
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: points.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Quadrant scatter",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { QuadrantScatterChart, ScatterRegressionChart };

//# sourceMappingURL=relationship-charts.js.map