"use client";
import { formatChartValue, timeSpanMs } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { formatRatio } from "./chart-common.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/quantitative-charts.tsx
/**
* A candle time, as epoch milliseconds.
*
* `Candle.time` accepts a number, a `Date` or an ISO string (it is shared with
* the Lightweight Charts surface). ECharts wants a number, so the conversion
* happens once, here, rather than in every accessor.
*/
function candleTime(time) {
	if (typeof time === "number") return time;
	if (time instanceof Date) return time.getTime();
	const parsed = Date.parse(time);
	return Number.isNaN(parsed) ? 0 : parsed;
}
/**
* Candlestick — the ECharts rendition, alongside the Lightweight Charts one.
*
* Two engines, two jobs. `@luc/ui/financial-chart` is the interactive trading
* surface (pan, zoom, real-time updates, the provider's own scales). This one
* exists so a candle chart can live *inside* an analytics composition — a grid,
* a dashboard, a print view — where the Lightweight surface's own scroll model
* and mandatory attribution logo are the wrong shape. Neither computes
* anything; both take the same OHLC rows.
*/
function CandlestickChart({ candles, overlays, priceFormat, timeFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const xSpan = timeSpanMs(candles.map((candle) => candle.time));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 16,
				top: 16,
				bottom: 12
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const candleEntry = (Array.isArray(params) ? params : [params]).find((entry) => entry.seriesType === "candlestick");
					if (!candleEntry?.value) return "";
					const [, open = 0, close = 0, low = 0, high = 0] = candleEntry.value;
					const change = close - open;
					return tooltipShellHtml(formatChartValue(candleEntry.axisValue, {
						kind: "date",
						...timeFormat
					}), tooltipGridHtml([
						["Open", formatChartValue(open, priceFormat)],
						["High", formatChartValue(high, priceFormat)],
						["Low", formatChartValue(low, priceFormat)],
						["Close", formatChartValue(close, priceFormat)],
						["Change", `${change >= 0 ? "+" : ""}${formatChartValue(change, priceFormat)}`]
					]));
				}
			}),
			xAxis: axisFragment({
				type: "time",
				theme,
				format: timeFormat ?? { kind: "date" },
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}),
			yAxis: axisFragment({
				type: "value",
				theme,
				format: priceFormat,
				scale: true,
				position: "right"
			}),
			series: [{
				name: "Price",
				type: "candlestick",
				itemStyle: {
					color: theme.positive,
					color0: theme.negative,
					borderColor: theme.positive,
					borderColor0: theme.negative
				},
				data: candles.map((candle) => [
					candleTime(candle.time),
					candle.open,
					candle.close,
					candle.low,
					candle.high
				]),
				emphasis: { itemStyle: { borderWidth: 2 } }
			}, ...(overlays ?? []).map((overlay, index) => ({
				name: overlay.label,
				type: "line",
				showSymbol: false,
				smooth: false,
				connectNulls: false,
				lineStyle: {
					width: 1.4,
					color: seriesColor(theme, overlay.label, index),
					opacity: .9
				},
				itemStyle: { color: seriesColor(theme, overlay.label, index) },
				data: overlay.values.map((value, position) => [candles[position] ? candleTime(candles[position].time) : position, value])
			}))]
		};
	}, [
		candles,
		motion,
		overlays,
		priceFormat,
		theme,
		timeFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		xValues: candles.map((candle) => candleTime(candle.time)),
		state: candles.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Candlestick chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "No candles",
			emptyDescription: "No OHLC rows were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Underwater (drawdown) curve.
*
* The values are the caller's — this component does not difference a price
* series to find the running peak. The area is anchored at zero and the axis
* never pads above it, because a percentage *gain* in a drawdown chart is a
* number that does not exist (see V1.3's headroom rule).
*/
function DrawdownChart({ points, format, timeFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const worst = points.reduce((min, point) => Math.min(min, point.value), 0);
		const depth = Math.abs(worst);
		const axisDecimals = depth < .01 ? 2 : depth < .2 ? 1 : 0;
		const xSpan = timeSpanMs(points.map((point) => point.time));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 18,
				top: 16,
				bottom: 12
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const first = (Array.isArray(params) ? params : [params])[0];
					if (!first?.value) return "";
					return tooltipShellHtml(formatChartValue(first.axisValue ?? first.value[0], {
						kind: "date",
						...timeFormat
					}), tooltipGridHtml([["Drawdown", format ? formatChartValue(first.value[1], format) : formatRatio(first.value[1])], ["Trough", format ? formatChartValue(worst, format) : formatRatio(worst)]]));
				}
			}),
			xAxis: axisFragment({
				type: "time",
				theme,
				format: timeFormat ?? { kind: "date" },
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}),
			yAxis: {
				...axisFragment({
					type: "value",
					theme,
					format,
					max: 0,
					min: worst * 1.08,
					position: "right"
				}),
				...format ? {} : { axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption,
					formatter: (value) => formatRatio(value, axisDecimals)
				} }
			},
			series: [{
				name: "Drawdown",
				type: "line",
				showSymbol: false,
				smooth: false,
				lineStyle: {
					width: 1.6,
					color: theme.negative
				},
				itemStyle: { color: theme.negative },
				areaStyle: {
					color: theme.negative,
					opacity: .16,
					origin: "start"
				},
				data: points.map((point) => [point.time, point.value])
			}]
		};
	}, [
		format,
		motion,
		points,
		theme,
		timeFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		xValues: points.map((point) => point.time),
		state: points.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Drawdown",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "No drawdown",
			emptyDescription: "No drawdown points were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Volatility smile — implied volatility against strike, one curve per expiry.
*
* The smile shape is whatever the market supplied; nothing is interpolated or
* extrapolated between strikes. An empty window simply has fewer points, which
* is the honest picture a recalibrating surface should give.
*/
function VolatilitySmileChart({ slices, strikeFormat, volFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 20,
				top: 16,
				bottom: 12
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const list = Array.isArray(params) ? params : [params];
					const first = list[0];
					if (!first?.value) return "";
					const rows = list.map((entry) => {
						const item = entry;
						return tooltipRowHtml(item.seriesName ?? "", formatChartValue(item.value?.[1], volFormat), item.color);
					});
					return tooltipShellHtml(`Strike ${formatChartValue(first.value[0], strikeFormat)}`, `<div>${rows.join("")}</div>`);
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				format: strikeFormat,
				scale: true
			}),
			yAxis: axisFragment({
				type: "value",
				theme,
				format: volFormat,
				scale: true,
				position: "right"
			}),
			series: slices.map((slice, index) => ({
				name: slice.expiry,
				type: "line",
				showSymbol: true,
				symbolSize: 6,
				smooth: false,
				connectNulls: false,
				lineStyle: {
					width: 1.8,
					color: seriesColor(theme, slice.expiry, index)
				},
				itemStyle: { color: seriesColor(theme, slice.expiry, index) },
				emphasis: { focus: "series" },
				data: slice.points.map((point) => [point.strike, point.impliedVol])
			}))
		};
	}, [
		motion,
		slices,
		strikeFormat,
		theme,
		volFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: slices.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Volatility smile",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "No surface",
			emptyDescription: "No implied-volatility slices were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Risk/return map with an efficient frontier.
*
* LUC does not solve the optimisation: the frontier is supplied as ordered
* points, so the caller can state the constraints it used. The current
* portfolio is a marker rather than a second chart, which is what makes "where
* am I relative to the frontier" a glance instead of an analysis.
*/
function EfficientFrontierChart({ assets, frontier, current, riskFormat, returnFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 20,
				top: 16,
				bottom: 12
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					if (!item.value) return "";
					return tooltipShellHtml(item.seriesName, tooltipGridHtml([["Risk", formatChartValue(item.value[0], riskFormat)], ["Return", formatChartValue(item.value[1], returnFormat)]]));
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				format: riskFormat,
				scale: true
			}),
			yAxis: axisFragment({
				type: "value",
				theme,
				format: returnFormat,
				scale: true,
				position: "right"
			}),
			series: [
				...frontier ? [{
					name: "Efficient frontier",
					type: "line",
					showSymbol: false,
					smooth: true,
					lineStyle: {
						width: 2,
						color: theme.accent
					},
					itemStyle: { color: theme.accent },
					data: frontier.map((point) => [point.risk, point.expectedReturn])
				}] : [],
				{
					name: "Assets",
					type: "scatter",
					symbolSize: 9,
					data: assets.map((asset, index) => ({
						name: asset.label,
						value: [asset.risk, asset.expectedReturn],
						itemStyle: {
							color: seriesColor(theme, asset.label ?? "asset", index),
							opacity: .85
						}
					})),
					label: {
						show: true,
						position: "top",
						formatter: (params) => params.name ?? "",
						color: theme.textMuted,
						fontFamily: theme.fontFamily,
						fontSize: theme.fontMicro
					}
				},
				...current ? [{
					name: current.label ?? "Current portfolio",
					type: "effectScatter",
					rippleEffect: {
						scale: 2.6,
						brushType: "stroke"
					},
					symbolSize: 13,
					data: [[current.risk, current.expectedReturn]],
					itemStyle: {
						color: theme.marker,
						borderColor: theme.surface,
						borderWidth: 1.5
					}
				}] : []
			]
		};
	}, [
		assets,
		current,
		frontier,
		motion,
		returnFormat,
		riskFormat,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: assets.length === 0 && !frontier ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Risk and return",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No portfolios were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/** Factor exposure — a zero-centred bar per factor, coloured by sign. */
function FactorExposureChart({ factors, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 20
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const factor = factors[params.dataIndex ?? 0];
					if (!factor) return "";
					return tooltipShellHtml(factor.label, tooltipGridHtml([["Exposure", formatChartValue(factor.value, format)]]));
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				format,
				scale: true
			}),
			yAxis: {
				type: "category",
				data: factors.map((factor) => factor.label),
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
				name: "Exposure",
				type: "bar",
				barWidth: 14,
				data: factors.map((factor) => ({
					value: factor.value,
					itemStyle: {
						color: factor.value >= 0 ? theme.positive : theme.negative,
						opacity: .85,
						borderRadius: factor.value >= 0 ? [
							0,
							3,
							3,
							0
						] : [
							3,
							0,
							0,
							3
						]
					}
				})),
				markLine: {
					silent: true,
					symbol: "none",
					lineStyle: {
						color: theme.axisLine,
						width: 1
					},
					label: { show: false },
					data: [{ xAxis: 0 }]
				}
			}]
		};
	}, [
		factors,
		format,
		motion,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: factors.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Factor exposure",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No factor loadings were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* P&L attribution — signed contributions by source over time.
*
* Because a contribution can be negative, a stacked variant uses ECharts'
* signed stacking, so a losing factor visibly *subtracts* from the column
* instead of being drawn on top of the winners.
*/
function PnlAttributionChart({ periods, series, variant = "stacked", format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 16
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const list = Array.isArray(params) ? params : [params];
					const first = list[0];
					const rows = list.map((entry) => {
						const item = entry;
						return [
							item.seriesName ?? "",
							`${(item.value ?? 0) >= 0 ? "+" : ""}${formatChartValue(item.value, format)}`,
							item.color ?? ""
						];
					});
					const total = list.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);
					return tooltipShellHtml(first?.name, `<div>${rows.map(([label, value, color]) => tooltipRowHtml(label, value, color)).join("")}${tooltipRowHtml("Total", `${total >= 0 ? "+" : ""}${formatChartValue(total, format)}`)}</div>`);
				}
			}),
			xAxis: {
				type: "category",
				data: [...periods],
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
				scale: true
			}),
			series: series.map((entry, index) => ({
				name: entry.label,
				type: "bar",
				stack: variant === "stacked" ? "pnl" : void 0,
				barMaxWidth: 34,
				itemStyle: {
					color: seriesColor(theme, entry.label, index),
					borderRadius: variant === "grouped" ? [
						2,
						2,
						0,
						0
					] : 0
				},
				emphasis: { focus: "series" },
				data: [...entry.values]
			}))
		};
	}, [
		format,
		motion,
		periods,
		series,
		theme,
		variant
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: periods.length === 0 || series.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "P&L attribution",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to attribute",
			emptyDescription: "No contributions were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { CandlestickChart, DrawdownChart, EfficientFrontierChart, FactorExposureChart, PnlAttributionChart, VolatilitySmileChart };

//# sourceMappingURL=quantitative-charts.js.map