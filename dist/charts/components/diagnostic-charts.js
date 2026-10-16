"use client";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { formatRatioOrValue, ratioOrFormatAxis } from "./chart-common.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/diagnostic-charts.tsx
function AutocorrelationChart({ series, band, bandLabel = "Significance band", format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const lags = useMemo(() => [...new Set(series.flatMap((entry) => entry.points.map((point) => point.x)))].sort((a, b) => a - b), [series]);
	const option = useMemo(() => {
		const stems = series.map((entry, index) => ({
			name: entry.label,
			type: "custom",
			z: 3,
			data: entry.points.map((point) => [
				lags.indexOf(point.x),
				point.y,
				index
			]),
			renderItem: (params, api) => {
				const p = params;
				const helpers = api;
				const value = helpers.value(1);
				const offset = (index - (series.length - 1) / 2) * 7;
				const [x, y] = helpers.coord([p.dataIndex, value]);
				const [, baseY] = helpers.coord([p.dataIndex, 0]);
				const color = seriesColor(theme, entry.key, index);
				return {
					type: "group",
					children: [{
						type: "line",
						shape: {
							x1: x + offset,
							y1: baseY,
							x2: x + offset,
							y2: y
						},
						style: {
							...helpers.style(),
							stroke: color,
							lineWidth: 1.6
						}
					}, {
						type: "circle",
						shape: {
							cx: x + offset,
							cy: y,
							r: 3.2
						},
						style: {
							...helpers.style(),
							fill: color,
							stroke: theme.surface,
							lineWidth: 1
						}
					}]
				};
			}
		}));
		const lastLagIndex = Math.max(lags.length - 1, 0);
		const bandSeries = band === void 0 ? [] : [{
			name: bandLabel,
			type: "custom",
			z: 1,
			silent: true,
			tooltip: { show: false },
			data: [[
				0,
				-band,
				band
			]],
			renderItem: (_params, api) => {
				const helpers = api;
				const [left, yUpper] = helpers.coord([0, helpers.value(2)]);
				const [right, yLower] = helpers.coord([lastLagIndex, helpers.value(1)]);
				const pad = lags.length > 1 ? Math.abs(right - left) / (lags.length * 2) : 12;
				return {
					type: "rect",
					shape: {
						x: left - pad,
						y: yUpper,
						width: right - left + pad * 2,
						height: yLower - yUpper
					},
					style: {
						...helpers.style(),
						fill: theme.band,
						stroke: "none"
					}
				};
			}
		}];
		return {
			...baseOption(theme, motion),
			grid: gridFragment({ containLabel: true }),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const first = (Array.isArray(params) ? params : [params])[0];
					const lag = lags[first?.dataIndex ?? 0];
					const rows = series.map((entry) => {
						const point = entry.points.find((candidate) => candidate.x === lag);
						if (!point) return null;
						return tooltipGridHtml([["Lag", formatChartValue(lag, void 0)], [entry.label, formatChartValue(point.y, format)]]);
					}).filter((row) => row !== null);
					return tooltipShellHtml(`Lag ${formatChartValue(lag, void 0)}`, rows.join(""));
				}
			}),
			xAxis: {
				type: "category",
				data: lags.map((lag) => formatChartValue(lag, void 0)),
				axisLine: { lineStyle: { color: theme.axisLine } },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption
				}
			},
			yAxis: axisFragment({
				type: "value",
				theme,
				format,
				min: -1,
				max: 1,
				scale: true
			}),
			series: [...bandSeries, ...stems]
		};
	}, [
		band,
		bandLabel,
		format,
		lags,
		motion,
		series,
		theme
	]);
	const empty = series.every((entry) => entry.points.length === 0);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: empty ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Autocorrelation",
		ariaDescription: ariaDescription ?? description ?? (band === void 0 ? "Lag correlations without a significance band." : `${bandLabel} shown as a shaded band.`),
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No lag correlations were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* A Kaplan–Meier style step curve.
*
* The step matters: survival is constant between events and drops at an event,
* so interpolating between two estimates would invent a risk that the sample
* does not have. Censoring marks are supplied points, never inferred from the
* data.
*/
function SurvivalCurveChart({ series, xFormat, yFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({ containLabel: true }),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const list = Array.isArray(params) ? params : [params];
					const point = list[0]?.value;
					if (!point) return "";
					const rows = list.map((entry) => {
						const item = entry;
						if (!item.value) return "";
						return tooltipGridHtml([[item.seriesName ?? "", formatChartValue(item.value[1], yFormat)]]);
					}).join("");
					return tooltipShellHtml(formatChartValue(point[0], xFormat), rows);
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				format: xFormat,
				min: 0
			}),
			yAxis: ratioOrFormatAxis(yFormat, {
				type: "value",
				theme,
				min: 0,
				max: 1
			}),
			series: [...series.map((entry, index) => ({
				name: entry.label,
				type: "line",
				step: "end",
				showSymbol: false,
				lineStyle: {
					width: 1.9,
					color: seriesColor(theme, entry.key, index)
				},
				itemStyle: { color: seriesColor(theme, entry.key, index) },
				data: entry.points.map((point) => [point.x, point.y]),
				emphasis: { focus: "series" }
			})), ...series.filter((entry) => (entry.censored?.length ?? 0) > 0).map((entry, index) => ({
				name: `${entry.label} (censored)`,
				type: "scatter",
				symbol: "rect",
				symbolSize: [1.6, 9],
				silent: true,
				tooltip: { show: false },
				itemStyle: { color: seriesColor(theme, entry.key, series.indexOf(entry) + index) },
				data: (entry.censored ?? []).map((point) => [point.x, point.y])
			}))]
		};
	}, [
		motion,
		series,
		theme,
		xFormat,
		yFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: series.every((entry) => entry.points.length === 0) ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Survival curve",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No survival estimates were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
function PrecisionRecallChart({ curves, baseline, xFormat, yFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({ containLabel: true }),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					if (!item.value) return "";
					const curve = curves[item.seriesIndex ?? 0];
					const rows = [tooltipGridHtml([["Recall", formatRatioOrValue(item.value[0], xFormat)], ["Precision", formatRatioOrValue(item.value[1], yFormat)]])];
					if (curve?.averagePrecision !== void 0) rows.push(tooltipGridHtml([["Average precision", formatRatioOrValue(curve.averagePrecision, yFormat)]]));
					return tooltipShellHtml(item.seriesName ?? "Curve", rows.join(""));
				}
			}),
			xAxis: ratioOrFormatAxis(xFormat, {
				type: "value",
				theme,
				min: 0,
				max: 1
			}),
			yAxis: ratioOrFormatAxis(yFormat, {
				type: "value",
				theme,
				min: 0,
				max: 1,
				position: "right"
			}),
			series: [...curves.map((curve, index) => ({
				name: curve.label,
				type: "line",
				showSymbol: false,
				smooth: false,
				lineStyle: {
					width: 1.9,
					color: seriesColor(theme, curve.key, index)
				},
				itemStyle: { color: seriesColor(theme, curve.key, index) },
				data: curve.points.map((point) => [point.x, point.y]),
				emphasis: { focus: "series" }
			})), ...baseline === void 0 ? [] : [{
				name: "No-skill",
				type: "line",
				showSymbol: false,
				silent: true,
				tooltip: { show: false },
				lineStyle: {
					width: 1.4,
					type: "dashed",
					color: theme.textMuted
				},
				data: [[0, baseline], [1, baseline]]
			}]]
		};
	}, [
		baseline,
		curves,
		motion,
		theme,
		xFormat,
		yFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: curves.every((curve) => curve.points.length === 0) ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Precision–recall curve",
		ariaDescription: ariaDescription ?? description ?? (baseline === void 0 ? void 0 : "A dashed line marks the no-skill prevalence."),
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No precision/recall pairs were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Horizontal importances, ranked, with the caller's own interval drawn over
* each bar. `signed` colours by direction (a coefficient) instead of magnitude
* (a tree importance) — the two mean different things and must not share one
* colour rule.
*/
function FeatureImportanceChart({ features, format, intervalLabel = "Interval", signed = false, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const hasInterval = features.some((feature) => feature.low !== void 0 && feature.high !== void 0);
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 24
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const feature = features[params.dataIndex ?? 0];
					if (!feature) return "";
					const rows = [["Importance", formatChartValue(feature.value, format)]];
					if (feature.low !== void 0 && feature.high !== void 0) rows.push([intervalLabel, `${formatChartValue(feature.low, format)} – ${formatChartValue(feature.high, format)}`]);
					return tooltipShellHtml(feature.label, tooltipGridHtml(rows));
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				format,
				scale: true,
				baseline: true
			}),
			yAxis: {
				type: "category",
				data: features.map((feature) => feature.label),
				inverse: true,
				axisLine: { lineStyle: { color: theme.axisLine } },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption
				}
			},
			series: [{
				name: "Importance",
				type: "bar",
				barWidth: 12,
				data: features.map((feature, index) => ({
					value: feature.value,
					itemStyle: {
						color: signed ? feature.value >= 0 ? theme.positive : theme.negative : seriesColor(theme, feature.key, index),
						borderRadius: 2
					}
				}))
			}, ...hasInterval ? [{
				name: intervalLabel,
				type: "custom",
				z: 3,
				silent: true,
				tooltip: { show: false },
				data: features.map((feature, index) => [
					index,
					feature.low ?? feature.value,
					feature.high ?? feature.value
				]),
				renderItem: (params, api) => {
					const p = params;
					const helpers = api;
					const [x1, y] = helpers.coord([helpers.value(1), p.dataIndex]);
					const [x2] = helpers.coord([helpers.value(2), p.dataIndex]);
					const cap = 4;
					return {
						type: "group",
						children: [
							{
								type: "line",
								shape: {
									x1,
									y1: y,
									x2,
									y2: y
								},
								style: {
									...helpers.style(),
									stroke: theme.textPrimary,
									lineWidth: 1.4
								}
							},
							{
								type: "line",
								shape: {
									x1,
									y1: y - cap,
									x2: x1,
									y2: y + cap
								},
								style: {
									...helpers.style(),
									stroke: theme.textPrimary,
									lineWidth: 1.4
								}
							},
							{
								type: "line",
								shape: {
									x1: x2,
									y1: y - cap,
									x2,
									y2: y + cap
								},
								style: {
									...helpers.style(),
									stroke: theme.textPrimary,
									lineWidth: 1.4
								}
							}
						]
					};
				}
			}] : []]
		};
	}, [
		features,
		format,
		intervalLabel,
		motion,
		signed,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: features.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Feature importance",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No importances were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { AutocorrelationChart, FeatureImportanceChart, PrecisionRecallChart, SurvivalCurveChart };

//# sourceMappingURL=diagnostic-charts.js.map