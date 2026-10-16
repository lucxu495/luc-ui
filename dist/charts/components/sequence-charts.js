"use client";
import { cn } from "../../utils/cn.js";
import { RangeSelector } from "../chart-card.js";
import { toneColor, withAlpha } from "../core/theme.js";
import { formatChartValue, timeSpanMs } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/sequence-charts.tsx
/**
* RegimeStrip — a compact categorical timeline.
*
* Sits under a price or indicator chart and answers "in which regime was this
* observation?". It is deliberately *not* another time-series axis: the states
* are a fixed vocabulary with fixed colours, so the strip reads as annotation.
*
* A strip is *spans on a time axis*, which no built-in series type expresses:
* a bar's width comes from category spacing, and a line cannot carry two x
* values per point. So it uses ECharts' `custom` series — the engine's own
* supported extension point — with one rectangle per interval. Colours still
* come from the theme, the tooltip from the shared shell, and hover emphasis
* from the same `emphasis`/`blur` contract as every other chart.
*/
function RegimeStrip({ intervals, states, showLegend = true, title, description, state = "ready", height = 72, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "subtle");
	const colorFor = useMemo(() => {
		const explicit = /* @__PURE__ */ new Map();
		const order = [];
		for (const entry of states) {
			order.push(entry.state);
			explicit.set(entry.state, entry.color ?? toneColor(theme, entry.tone, entry.index ?? order.length - 1));
		}
		return {
			explicit,
			order
		};
	}, [states, theme]);
	const option = useMemo(() => {
		const ordered = [...intervals].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
		const stateNames = colorFor.order.length ? colorFor.order : Array.from(new Set(ordered.map((interval) => interval.state)));
		const xSpan = timeSpanMs(ordered.flatMap((interval) => [interval.start, interval.end]));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 4,
				right: 12,
				bottom: 4,
				left: 4
			}),
			xAxis: axisFragment({
				theme,
				type: "time",
				hidden: false,
				showGrid: false,
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}),
			yAxis: {
				type: "category",
				data: stateNames,
				show: showLegend,
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: (value) => states.find((entry) => entry.state === value)?.label ?? value
				},
				axisLine: { show: false },
				axisTick: { show: false },
				splitLine: { show: false }
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const entry = Array.isArray(params) ? params[0] : params;
					const interval = entry?.data?.intervalIndex !== void 0 ? ordered[entry.data.intervalIndex] : void 0;
					if (!interval) return "";
					return tooltipShellHtml(interval.label ?? interval.state, tooltipGridHtml([["From", new Date(interval.start).toISOString().slice(0, 10)], ["To", new Date(interval.end).toISOString().slice(0, 10)]]));
				}
			}),
			series: stateNames.map((stateName, rowIndex) => ({
				id: `regime-${stateName}`,
				name: states.find((entry) => entry.state === stateName)?.label ?? stateName,
				type: "custom",
				encode: {
					x: [0, 1],
					y: 2
				},
				data: ordered.map((interval, intervalIndex) => ({
					interval,
					intervalIndex
				})).filter(({ interval }) => interval.state === stateName).map(({ interval, intervalIndex }) => ({
					value: [
						new Date(interval.start).getTime(),
						Math.max(new Date(interval.end).getTime(), new Date(interval.start).getTime() + 864e5),
						rowIndex
					],
					intervalIndex
				})),
				renderItem: (params, api) => {
					const start = api.coord([api.value(0), api.value(2)]);
					const end = api.coord([api.value(1), api.value(2)]);
					const rowHeight = (params.coordSys?.height ?? 0) / Math.max(1, stateNames.length);
					const barHeight = Math.max(6, rowHeight * .62);
					const color = colorFor.explicit.get(stateName) ?? seriesColor(theme, stateName);
					const startX = start[0] ?? 0;
					const endX = end[0] ?? startX;
					return {
						type: "rect",
						shape: {
							x: startX,
							y: (start[1] ?? 0) - barHeight / 2,
							width: Math.max(1.5, endX - startX),
							height: barHeight,
							r: 2
						},
						style: api.style({
							fill: color,
							opacity: .9
						})
					};
				},
				emphasis: { focus: "series" },
				z: stateNames.length - rowIndex
			}))
		};
	}, [
		colorFor,
		intervals,
		motion,
		showLegend,
		states,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: intervals.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Regime strip",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent,
		eager
	});
}
/** Above this many events a shared time axis cannot carry per-marker labels. */
const SPARSE_EVENT_LIMIT = 12;
/**
* The **minimum share of the axis** that has to separate two events before a
* permanent label fits between them.
*
* A count alone is not enough: three Pi Cycle crossovers inside eighteen months
* are "sparse" by number and unreadable on a thirteen-year axis, while four
* halvings spread evenly across the same axis read perfectly. So the rule is
* about *spacing* — the tightest pair must have room for its own label, which
* on a report-width plate is roughly an eighth of the axis.
*/
const MIN_LABEL_GAP_SHARE = .12;
/**
* Whether a history can carry a permanent label on each marker.
*
* `never` is honoured; `auto` asks the geometry: few enough events, and no
* pile-up. A history that fails either test is drawn as markers only, and the
* name is read from the tooltip — which is the honest presentation of a dense or
* clustered event layer.
*/
function labelsFit(labelMode, events) {
	if (labelMode !== "auto" || events.length === 0 || events.length > SPARSE_EVENT_LIMIT) return false;
	const times = events.map((event) => new Date(event.at).getTime()).filter((time) => Number.isFinite(time)).sort((left, right) => left - right);
	if (times.length < 2) return true;
	const span = times[times.length - 1] - times[0];
	if (!(span > 0)) return false;
	let tightest = Number.POSITIVE_INFINITY;
	for (let index = 1; index < times.length; index += 1) tightest = Math.min(tightest, times[index] - times[index - 1]);
	return tightest >= span * MIN_LABEL_GAP_SHARE;
}
/**
* EventTimeline — dated events on a shared time axis.
*
* The companion to a financial series: halvings, FOMC dates, a Signal firing.
* Each event is one point plus an optional guide; the labels are the caller's
* (LUC UI has no idea what a halving is).
*
* Deliberately not a multi-series chart: events do not have a y value, so
* jittering them onto lanes would invent one. The axis is time, the marks are
* events, and the tooltip carries the detail.
*/
function EventTimeline({ events, guides = true, format, labelMode = "never", range = null, title, description, state = "ready", height = 120, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "subtle");
	const showLabels = useMemo(() => labelsFit(labelMode, events), [events, labelMode]);
	const option = useMemo(() => {
		const categories = Array.from(new Set(events.map((event) => event.category ?? "event")));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: showLabels ? 26 : 9,
				right: 14,
				bottom: 4
			}),
			xAxis: (() => {
				const times = events.map((event) => new Date(event.at).getTime()).filter((time) => Number.isFinite(time));
				const span = range?.window ? range.window.to - range.window.from : times.length > 1 ? Math.max(...times) - Math.min(...times) : void 0;
				return { ...axisFragment({
					theme,
					type: "time",
					showGrid: false,
					...span !== void 0 ? { spanMs: span } : {},
					...range?.window ? {
						min: range.window.from,
						max: range.window.to
					} : {}
				}) };
			})(),
			yAxis: {
				type: "value",
				show: false,
				min: 0,
				max: 1
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const entry = Array.isArray(params) ? params[0] : params;
					const event = entry?.data?.eventIndex !== void 0 ? events[entry.data.eventIndex] : void 0;
					if (!event) return "";
					const rows = [
						["Date", new Date(event.at).toISOString().slice(0, 10)],
						...event.category ? [["Category", event.category]] : [],
						...event.value !== void 0 ? [["Value", formatChartValue(event.value, event.valueFormat ?? format)]] : []
					];
					return tooltipShellHtml(event.label, tooltipGridHtml(rows));
				}
			}),
			series: categories.map((category, index) => ({
				id: `events-${category}`,
				name: category,
				type: "scatter",
				symbolSize: 9,
				itemStyle: { color: toneColor(theme, events.find((event) => event.category === category)?.tone, index) },
				emphasis: { focus: "series" },
				data: events.map((event, eventIndex) => ({
					event,
					eventIndex
				})).filter((entry) => (entry.event.category ?? "event") === category).map(({ event, eventIndex }) => ({
					value: [new Date(event.at).getTime(), .5],
					name: event.label,
					eventIndex,
					label: showLabels ? {
						show: true,
						position: "top",
						distance: 6,
						color: theme.textMuted,
						fontFamily: theme.fontFamily,
						fontSize: theme.fontMicro,
						formatter: event.label
					} : { show: false }
				})),
				...guides ? { markLine: {
					silent: true,
					symbol: "none",
					animation: false,
					lineStyle: {
						color: withAlpha(toneColor(theme, events.find((event) => event.category === category)?.tone, index), .35),
						width: 1,
						type: "dotted"
					},
					label: { show: false },
					data: events.filter((event) => (event.category ?? "event") === category).map((event) => ({ xAxis: new Date(event.at).getTime() }))
				} } : {}
			}))
		};
	}, [
		events,
		format,
		guides,
		motion,
		range,
		showLabels,
		theme
	]);
	const plate = /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: events.length === 0 ? "empty" : state,
		height,
		className: range ? void 0 : className,
		ariaLabel: ariaLabel ?? title ?? "Event timeline",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent,
		eager
	});
	if (!range) return plate;
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex w-full flex-col gap-2", className),
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex items-center justify-end",
			children: /* @__PURE__ */ jsx(RangeSelector, {
				ranges: range.ranges,
				value: range.value,
				onValueChange: range.onValueChange
			})
		}), plate]
	});
}
//#endregion
export { EventTimeline, RegimeStrip };

//# sourceMappingURL=sequence-charts.js.map