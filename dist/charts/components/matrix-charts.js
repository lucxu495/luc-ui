"use client";
import { contrastRatio, flattenColor, mixColor, parseColor, readableInk, toneColor, withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { correlationPlotArea, heatmapPlotArea, shouldShowMatrixValues } from "../core/matrix-labels.js";
import { correlationPalette, divergingPalette, rampFromAnchors, robustSymmetricDomain } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo, useRef } from "react";
//#region src/charts/components/matrix-charts.tsx
/**
* Categorical heatmap / intensity grid.
*
* Sequential palette, generous cell separation and a bottom legend. The default
* grid deliberately leaves the cells square-ish rather than stretching them to
* fill a tall container — a stretched heatmap misreads as a time series.
*/
function HeatmapChart({ xLabels, yLabels, values, min, max, format, showCellValues, palette = "sequential", midpoint, ramp, labelMode, robustDomain, highlight, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const chartRef = useRef(null);
	const resolvedMode = labelMode ?? (showCellValues === void 0 ? showCellValues ? "auto" : "never" : showCellValues ? "auto" : "never");
	const robustPercentile = typeof robustDomain === "number" ? robustDomain : .95;
	const useRobust = Boolean(robustDomain);
	const highlighted = useMemo(() => new Set((highlight ?? []).map(([x, y]) => `${x}|${y}`)), [highlight]);
	const { bounds, data, stops } = useMemo(() => {
		const flat = [];
		const grid = [];
		values.forEach((row, y) => {
			xLabels.forEach((_, x) => {
				const value = row[x];
				if (typeof value === "number" && Number.isFinite(value)) {
					flat.push(value);
					grid.push([
						x,
						y,
						value
					]);
				} else grid.push([
					x,
					y,
					"-"
				]);
			});
		});
		const mid = midpoint ?? 0;
		let minValue = min ?? (flat.length ? Math.min(...flat) : 0);
		let maxValue = max ?? (flat.length ? Math.max(...flat) : 1);
		if (useRobust && min === void 0 && max === void 0) {
			const robust = robustSymmetricDomain(flat, {
				midpoint: mid,
				percentile: robustPercentile
			});
			if (robust) {
				minValue = robust.min;
				maxValue = robust.max;
			}
		}
		if (palette === "diverging" || palette === "correlation") {
			const span = Math.max(Math.abs(minValue - mid), Math.abs(maxValue - mid)) || 1;
			minValue = mid - span;
			maxValue = mid + span;
		}
		const base = theme.palette[0] ?? theme.accent;
		const rampStops = ramp && palette === "diverging" ? rampFromAnchors(ramp, 7) : palette === "correlation" ? correlationPalette(theme, 7) : palette === "diverging" ? divergingPalette(theme, 7) : [
			withAlpha(base, .07),
			withAlpha(base, .42),
			base
		];
		const data = grid.map((triple) => {
			const value = triple[2];
			const mark = highlighted.has(`${triple[0]}|${triple[1]}`) ? { itemStyle: {
				borderColor: theme.accent,
				borderWidth: 2.5
			} } : {};
			if (typeof value !== "number") return {
				value: triple,
				...mark
			};
			const color = rampColor(rampStops, value, minValue, maxValue);
			const ink = readableInk(color, {
				dark: theme.inkDark,
				light: theme.inkLight,
				surface: theme.surfaceRaised
			});
			const resolvedCell = flattenColor(color, theme.surfaceRaised);
			const resolvedInk = parseColor(ink);
			const ratio = resolvedCell && resolvedInk ? contrastRatio(resolvedCell, resolvedInk) : 21;
			return {
				value: triple,
				...mark,
				label: {
					color: ink,
					...ratio < 4.5 ? {
						textBorderColor: theme.surfaceRaised,
						textBorderWidth: 2
					} : {}
				}
			};
		});
		return {
			bounds: {
				min: minValue,
				max: maxValue
			},
			data,
			stops: rampStops
		};
	}, [
		max,
		min,
		values,
		xLabels,
		useRobust,
		robustPercentile,
		midpoint,
		palette,
		ramp,
		theme,
		highlighted
	]);
	const option = useMemo(() => {
		const dense = xLabels.length > 14 || yLabels.length > 14;
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 12,
				bottom: 56,
				left: 8,
				right: 12
			}),
			xAxis: {
				...axisFragment({
					theme,
					type: "category",
					showGrid: false
				}),
				data: [...xLabels],
				splitArea: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					interval: dense ? "auto" : 0,
					rotate: 0,
					width: 64,
					overflow: "truncate",
					hideOverlap: true,
					margin: 8
				}
			},
			yAxis: {
				...axisFragment({
					theme,
					type: "category",
					showGrid: false
				}),
				inverse: true,
				data: [...yLabels],
				splitArea: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					interval: dense ? "auto" : 0,
					width: 80,
					overflow: "truncate",
					hideOverlap: true,
					margin: 8
				}
			},
			visualMap: {
				type: "continuous",
				min: bounds.min,
				max: bounds.max,
				calculable: false,
				orient: "horizontal",
				left: "center",
				bottom: 4,
				itemWidth: 10,
				itemHeight: 96,
				itemGap: 6,
				precision: 2,
				text: [`${useRobust ? "≥ " : ""}${formatChartValue(bounds.max, format ?? {
					kind: "decimal",
					decimals: 2
				})}`, `${useRobust ? "≤ " : ""}${formatChartValue(bounds.min, format ?? {
					kind: "decimal",
					decimals: 2
				})}`],
				textStyle: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				inRange: { color: stops.slice() }
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const triple = (Array.isArray(params) ? params[0] : params).value;
					if (!triple) return "";
					const [x, y, value] = triple;
					const header = `${yLabels[y] ?? ""} · ${xLabels[x] ?? ""}`;
					const rows = [["Value", typeof value === "number" ? formatChartValue(value, format) : "—"]];
					return tooltipShellHtml(header, tooltipGridHtml(rows));
				}
			}),
			series: [{
				id: "heatmap",
				type: "heatmap",
				data,
				progressive: 2e3,
				label: {
					show: resolvedMode !== "never",
					color: theme.textPrimary,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: (params) => {
						const value = params.value?.[2];
						if (typeof value !== "number") return "";
						if (resolvedMode === "auto") {
							const chart = chartRef.current;
							const area = heatmapPlotArea(chart?.getWidth() ?? 0, chart?.getHeight() ?? 0, yLabels.length, xLabels.length);
							if (!shouldShowMatrixValues({
								mode: "auto",
								...area
							})) return "";
						}
						return typeof value === "number" ? formatChartValue(value, format) : "";
					}
				},
				itemStyle: {
					borderColor: theme.surfaceRaised,
					borderWidth: 2,
					borderRadius: 3
				},
				emphasis: {
					itemStyle: {
						borderColor: theme.accent,
						borderWidth: 2.5,
						shadowBlur: 14,
						shadowColor: theme.accent,
						opacity: 1
					},
					label: {
						show: true,
						fontWeight: "bold"
					}
				}
			}]
		};
	}, [
		bounds.max,
		bounds.min,
		data,
		format,
		motion,
		resolvedMode,
		stops,
		theme,
		useRobust,
		xLabels,
		yLabels
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: xLabels.length === 0 || yLabels.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Heatmap",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "This matrix has no rows or columns."
		},
		onReady: (chart) => {
			chartRef.current = chart;
			onReady?.(chart);
		},
		onEvent,
		eager
	});
}
/**
* The diverging ramp, in the same three stops the `visualMap` uses. Cell ink is
* derived from the *same* stops rather than a second palette, so a colour tweak
* cannot desynchronise the label from the cell it sits on.
*
* A correlation matrix uses the domain's own correlation anchors — sapphire for
* a negative relationship, a near-neutral centre for zero, mauve for a positive
* one — because a correlation encodes a *sign*, not investment goodness.
*/
function correlationRamp(theme) {
	return correlationPalette(theme, 3);
}
/** The colour ECharts paints for `value` on a ramp whose stops span `min`..`max`. */
function rampColor(stops, value, min, max) {
	if (stops.length === 0) return "transparent";
	if (stops.length === 1) return stops[0];
	const span = max - min;
	const scaled = (span === 0 ? 0 : (Math.max(min, Math.min(max, value)) - min) / span) * (stops.length - 1);
	const index = Math.min(stops.length - 2, Math.floor(scaled));
	const from = parseColor(stops[index]);
	const to = parseColor(stops[index + 1]);
	if (!from || !to) return stops[index];
	const mixed = mixColor(from, to, scaled - index);
	const alpha = Number.isInteger(mixed.a) ? String(mixed.a) : String(Math.round(mixed.a * 1e3) / 1e3);
	return `rgba(${Math.round(mixed.r)}, ${Math.round(mixed.g)}, ${Math.round(mixed.b)}, ${alpha})`;
}
/** Default coefficient format: fixed two decimals, sign preserved. */
function formatCoefficient(value) {
	return value.toFixed(2);
}
/**
* Correlation matrix.
*
* A diverging palette anchored at zero, a symmetric grid, and hover that names
* both variable pairs. This chart is about *reading* clusters, so the cells stay
* square-ish and the diagonal is de-emphasised rather than highlighted.
*/
function CorrelationMatrix({ labels, values, title, description, labelMode, showValues, formatValue, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const chartRef = useRef(null);
	const resolvedMode = labelMode ?? (showValues === void 0 ? "auto" : showValues ? "always" : "never");
	const format = formatValue ?? formatCoefficient;
	const data = useMemo(() => {
		const stops = correlationRamp(theme);
		const points = [];
		values.forEach((row, y) => {
			row.forEach((value, x) => {
				if (typeof value !== "number" || !Number.isFinite(value)) return;
				const cellColor = rampColor(stops, value, -1, 1);
				const ink = readableInk(cellColor, {
					dark: theme.inkDark,
					light: theme.inkLight,
					surface: theme.surfaceRaised
				});
				const resolvedCell = flattenColor(cellColor, theme.surfaceRaised);
				const resolvedInk = parseColor(ink);
				const ratio = resolvedCell && resolvedInk ? contrastRatio(resolvedCell, resolvedInk) : 21;
				points.push({
					value: [
						x,
						y,
						value
					],
					label: {
						color: ink,
						...ratio < 4.5 ? {
							textBorderColor: theme.surfaceRaised,
							textBorderWidth: 2
						} : {}
					}
				});
			});
		});
		return points;
	}, [theme, values]);
	const option = useMemo(() => {
		const dense = labels.length > 12;
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 12,
				bottom: 40,
				left: 10,
				right: 14
			}),
			xAxis: {
				...axisFragment({
					theme,
					type: "category",
					showGrid: false
				}),
				data: [...labels],
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					interval: 0,
					rotate: dense ? 38 : 0,
					width: 72,
					overflow: "truncate",
					hideOverlap: false,
					margin: 8
				}
			},
			yAxis: {
				...axisFragment({
					theme,
					type: "category",
					showGrid: false
				}),
				inverse: true,
				data: [...labels],
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					interval: 0,
					width: 84,
					overflow: "truncate",
					margin: 8
				}
			},
			visualMap: {
				type: "continuous",
				min: -1,
				max: 1,
				calculable: false,
				orient: "horizontal",
				left: "center",
				bottom: 6,
				itemWidth: 10,
				itemHeight: 110,
				itemGap: 6,
				precision: 2,
				text: ["+1", "−1"],
				textStyle: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				inRange: { color: [...correlationRamp(theme)] }
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const triple = (Array.isArray(params) ? params[0] : params).value;
					if (!triple) return "";
					const [x, y, value] = triple;
					return tooltipShellHtml(`${labels[y] ?? ""} ↔ ${labels[x] ?? ""}`, tooltipGridHtml([["Correlation", formatChartValue(value, {
						kind: "decimal",
						decimals: 2,
						signed: true
					})]]));
				}
			}),
			series: [{
				id: "correlation",
				type: "heatmap",
				data,
				label: {
					show: resolvedMode !== "never",
					color: theme.textPrimary,
					fontFamily: theme.monoFamily,
					fontSize: theme.fontMicro,
					fontWeight: 500,
					formatter: (params) => {
						const triple = params.value;
						if (!triple || !Number.isFinite(triple[2])) return "";
						if (resolvedMode === "auto") {
							const chart = chartRef.current;
							const area = correlationPlotArea(chart?.getWidth() ?? 0, chart?.getHeight() ?? 0, labels.length, labels.length);
							if (!shouldShowMatrixValues({
								mode: "auto",
								...area
							})) return "";
						}
						return format(triple[2]);
					}
				},
				itemStyle: {
					borderColor: theme.surfaceRaised,
					borderWidth: 2,
					borderRadius: 3
				},
				emphasis: { itemStyle: {
					borderColor: theme.accent,
					borderWidth: 2
				} }
			}]
		};
	}, [
		data,
		format,
		labels,
		motion,
		resolvedMode,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: labels.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Correlation matrix",
		ariaDescription: ariaDescription ?? description,
		onReady: (chart) => {
			chartRef.current = chart;
			onReady?.(chart);
		},
		onEvent,
		eager
	});
}
/** Calendar heatmap — one cell per day, intensity from the caller's values. */
function CalendarHeatmap({ year, data, format, tone, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const values = data.map((entry) => entry[1]).filter((value) => Number.isFinite(value));
		const min = values.length ? Math.min(...values) : 0;
		const max = values.length ? Math.max(...values) : 1;
		const base = toneColor(theme, tone, 0);
		return {
			...baseOption(theme, motion),
			calendar: {
				top: 34,
				left: 34,
				right: 18,
				bottom: 34,
				range: String(year),
				cellSize: ["auto", 15],
				splitLine: {
					show: false,
					lineStyle: {
						color: theme.grid,
						width: 1
					}
				},
				itemStyle: {
					color: "transparent",
					borderWidth: 0,
					borderRadius: 3
				},
				yearLabel: { show: false },
				monthLabel: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					margin: 8
				},
				dayLabel: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					nameMap: "en",
					margin: 6
				}
			},
			visualMap: {
				type: "continuous",
				min,
				max,
				calculable: false,
				orient: "horizontal",
				left: "center",
				bottom: 2,
				itemWidth: 10,
				itemHeight: 110,
				itemGap: 6,
				precision: 2,
				text: [formatChartValue(max, format), formatChartValue(min, format)],
				textStyle: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				inRange: { color: [
					withAlpha(base, .08),
					withAlpha(base, .5),
					base
				] }
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const pair = (Array.isArray(params) ? params[0] : params).value;
					if (!pair) return "";
					return tooltipShellHtml(pair[0], tooltipGridHtml([["Value", formatChartValue(pair[1], format)]]));
				}
			}),
			series: [{
				id: "calendar",
				type: "heatmap",
				coordinateSystem: "calendar",
				data: data.map((entry) => [entry[0], entry[1]]),
				itemStyle: { borderRadius: 3 },
				emphasis: { itemStyle: {
					borderColor: theme.accent,
					borderWidth: 2
				} }
			}]
		};
	}, [
		data,
		format,
		motion,
		theme,
		tone,
		year
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? `Calendar heatmap ${year}`,
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { CalendarHeatmap, CorrelationMatrix, HeatmapChart };

//# sourceMappingURL=matrix-charts.js.map