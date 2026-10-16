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
//#region src/charts/components/workflow-charts.tsx
/**
* Gantt / schedule.
*
* One row per task on a time axis, drawn right-to-left in the task order given,
* so the list reads top-to-bottom. `progress` is drawn *inside* the bar rather
* than as a second series, which is what keeps a 200-task plan legible.
*/
function GanttChart({ tasks, timeFormat, axisLabel, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const xSpan = timeSpanMs(tasks.flatMap((task) => [task.start, task.end]));
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 20,
				top: 12,
				bottom: 8
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const task = tasks[params.dataIndex ?? 0];
					if (!task) return "";
					return tooltipShellHtml(task.name, tooltipGridHtml([
						["Start", formatChartValue(task.start, timeFormat ?? { kind: "date" })],
						["End", formatChartValue(task.end, timeFormat ?? { kind: "date" })],
						["Duration", `${Math.max(0, Math.round((task.end - task.start) / 36e5))} h`],
						...task.progress !== void 0 ? [["Progress", formatRatio(task.progress)]] : []
					]));
				}
			}),
			xAxis: { ...axisFragment({
				type: "time",
				theme,
				format: timeFormat ?? { kind: "date" },
				max: "dataMax",
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}) },
			yAxis: {
				type: "category",
				data: tasks.map((task) => task.group ? `${task.group} · ${task.name}` : task.name),
				inverse: true,
				axisLine: { lineStyle: { color: theme.axisLine } },
				axisTick: { show: false },
				splitLine: {
					show: true,
					lineStyle: { color: theme.grid }
				},
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption
				}
			},
			series: [{
				name: axisLabel ?? "Duration",
				type: "custom",
				z: 2,
				encode: {
					x: [1, 2],
					y: 0
				},
				data: tasks.map((task, index) => [
					index,
					task.start,
					task.end,
					task.progress ?? null
				]),
				renderItem: (_params, api) => {
					const helpers = api;
					const index = helpers.value(0);
					const start = helpers.value(1);
					const end = helpers.value(2);
					const [x1, y] = helpers.coord([start, index]);
					const [x2] = helpers.coord([end, index]);
					const [, heightPx] = helpers.size([0, 1]);
					const barHeight = Math.max(6, Math.min(18, heightPx * .5));
					const task = tasks[Math.round(index)];
					const color = seriesColor(theme, task?.tone ?? task?.id ?? "task", Math.round(index));
					const children = [{
						type: "rect",
						shape: {
							x: x1,
							y: y - barHeight / 2,
							width: Math.max(2, x2 - x1),
							height: barHeight,
							r: 3
						},
						style: {
							fill: color,
							opacity: .34
						}
					}];
					if (task?.progress !== void 0) children.push({
						type: "rect",
						shape: {
							x: x1,
							y: y - barHeight / 2,
							width: Math.max(2, (x2 - x1) * Math.min(1, Math.max(0, task.progress))),
							height: barHeight,
							r: 3
						},
						style: {
							fill: color,
							opacity: .95
						}
					});
					return {
						type: "group",
						children
					};
				}
			}]
		};
	}, [
		axisLabel,
		motion,
		tasks,
		theme,
		timeFormat
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: tasks.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Schedule",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing scheduled",
			emptyDescription: "No tasks were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/** Dumbbell — a start and an end per row, with the change drawn as the connector. */
function DumbbellChart({ rows, labels = ["From", "To"], format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
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
					const row = rows[params.dataIndex ?? 0];
					if (!row) return "";
					const delta = row.to - row.from;
					return tooltipShellHtml(row.label, tooltipGridHtml([
						[labels[0], formatChartValue(row.from, format)],
						[labels[1], formatChartValue(row.to, format)],
						["Change", `${delta >= 0 ? "+" : ""}${formatChartValue(delta, format)}`]
					]));
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
				data: rows.map((row) => row.label),
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
			series: [
				{
					name: "Change",
					type: "custom",
					z: 1,
					data: rows.map((row, index) => [
						index,
						row.from,
						row.to
					]),
					renderItem: (_params, api) => {
						const helpers = api;
						const index = helpers.value(0);
						const from = helpers.value(1);
						const to = helpers.value(2);
						const [x1, y] = helpers.coord([from, index]);
						const [x2] = helpers.coord([to, index]);
						return {
							type: "line",
							shape: {
								x1,
								y1: y,
								x2,
								y2: y
							},
							style: {
								fill: "transparent",
								stroke: theme.gridStrong,
								lineWidth: 2,
								opacity: .9
							}
						};
					}
				},
				{
					name: labels[0],
					type: "scatter",
					symbolSize: 9,
					z: 2,
					data: rows.map((row, index) => [row.from, index]),
					itemStyle: {
						color: theme.textMuted,
						borderColor: theme.surface,
						borderWidth: 1.5
					}
				},
				{
					name: labels[1],
					type: "scatter",
					symbolSize: 9,
					z: 3,
					data: rows.map((row, index) => [row.to, index]),
					itemStyle: {
						color: theme.accent,
						borderColor: theme.surface,
						borderWidth: 1.5
					}
				}
			]
		};
	}, [
		format,
		labels,
		motion,
		rows,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: rows.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Dumbbell chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No comparisons were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Slope chart — how each member moved between exactly two points in time.
*
* The difference from a dumbbell is what is on the axis: a dumbbell measures a
* quantity, a slope chart measures a *rank or index* at two moments, so the
* lines are free to cross and the crossing is the message.
*/
function SlopeChart({ rows, periods = ["Before", "After"], format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 12,
				right: 12
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					if (!item.value) return "";
					return tooltipShellHtml(item.seriesName, tooltipGridHtml([[periods[Math.round(item.value[0])] ?? String(item.value[0]), formatChartValue(item.value[1], format)]]));
				}
			}),
			xAxis: {
				type: "value",
				min: 0,
				max: 1,
				interval: 1,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					formatter: (value) => periods[Math.round(value)] ?? "",
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontLabel
				},
				splitLine: { show: false }
			},
			yAxis: {
				...axisFragment({
					type: "value",
					theme,
					format,
					scale: true
				}),
				splitLine: { show: false }
			},
			series: rows.map((row, index) => {
				const color = seriesColor(theme, row.tone ?? row.label, index);
				return {
					name: row.label,
					type: "line",
					showSymbol: true,
					symbolSize: 8,
					lineStyle: {
						width: 1.8,
						color,
						opacity: .9
					},
					itemStyle: { color },
					data: [[0, row.left], [1, row.right]],
					endLabel: {
						show: true,
						formatter: () => row.label,
						color: theme.textMuted,
						fontFamily: theme.fontFamily,
						fontSize: theme.fontMicro
					}
				};
			})
		};
	}, [
		format,
		motion,
		periods,
		rows,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: rows.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Slope chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No two-period rows were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/** Lollipop — a bar reduced to a stem and a head, for a long ranked list. */
function LollipopChart({ data, format, horizontal = true, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const categoryAxis = {
			type: "category",
			data: data.map((entry) => entry.label),
			inverse: true,
			axisLine: { lineStyle: { color: theme.axisLine } },
			axisTick: { show: false },
			splitLine: { show: false },
			axisLabel: {
				color: theme.axisLabel,
				fontFamily: theme.fontFamily,
				fontSize: theme.fontCaption
			}
		};
		const valueAxis = { ...axisFragment({
			type: "value",
			theme,
			format
		}) };
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
					const item = params;
					const entry = data[item.dataIndex ?? 0];
					if (!entry) return "";
					return tooltipShellHtml(entry.label, tooltipRowHtml(entry.label, formatChartValue(entry.value, format), item.color));
				}
			}),
			xAxis: horizontal ? valueAxis : categoryAxis,
			yAxis: horizontal ? categoryAxis : valueAxis,
			series: [{
				name: "Stem",
				type: "bar",
				silent: true,
				barWidth: 1.5,
				data: data.map((entry, index) => ({
					value: horizontal ? [entry.value, index] : [index, entry.value],
					itemStyle: {
						color: seriesColor(theme, entry.tone ?? entry.label, index),
						opacity: .45
					}
				}))
			}, {
				name: "Value",
				type: "scatter",
				symbolSize: 10,
				data: data.map((entry, index) => ({
					value: horizontal ? [entry.value, index] : [index, entry.value],
					itemStyle: {
						color: seriesColor(theme, entry.tone ?? entry.label, index),
						borderColor: theme.surface,
						borderWidth: 1.5
					}
				}))
			}]
		};
	}, [
		data,
		format,
		horizontal,
		motion,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: data.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Lollipop chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No ranked rows were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/** Bullet — a measured value, a target and the qualitative bands between them. */
function BulletChart({ rows, format, valueLabel = "Actual", targetLabel = "Target", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const max = rows.reduce((peak, row) => Math.max(peak, row.value, row.target, ...row.ranges ?? []), 0);
		const bandSeries = (rows[0]?.ranges ?? []).map((_, rangeIndex) => ({
			name: `Band ${rangeIndex + 1}`,
			type: "bar",
			silent: true,
			stack: "bands",
			barWidth: 18,
			z: 1,
			data: rows.map((row) => {
				const bands = row.ranges ?? [];
				const previous = rangeIndex === 0 ? 0 : bands[rangeIndex - 1] ?? 0;
				return Math.max(0, (bands[rangeIndex] ?? 0) - previous);
			}),
			itemStyle: {
				color: theme.grid,
				opacity: .14 + rangeIndex * .08,
				borderColor: theme.surface,
				borderWidth: .5
			}
		}));
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
					const row = rows[params.dataIndex ?? 0];
					if (!row) return "";
					return tooltipShellHtml(row.label, tooltipGridHtml([[valueLabel, formatChartValue(row.value, format)], [targetLabel, formatChartValue(row.target, format)]]));
				}
			}),
			xAxis: {
				...axisFragment({
					type: "value",
					theme,
					format,
					min: 0
				}),
				max: max * 1.12
			},
			yAxis: {
				type: "category",
				data: rows.map((row) => row.label),
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
			series: [
				...bandSeries,
				{
					name: valueLabel,
					type: "bar",
					barWidth: 8,
					z: 3,
					data: rows.map((row) => row.value),
					itemStyle: {
						color: theme.accent,
						borderRadius: [
							2,
							2,
							2,
							2
						]
					},
					label: {
						show: true,
						position: "right",
						distance: 6,
						color: theme.textPrimary,
						fontFamily: theme.fontFamily,
						fontSize: theme.fontMicro,
						formatter: (params) => formatChartValue(typeof params.value === "number" ? params.value : 0, format)
					}
				},
				{
					name: targetLabel,
					type: "scatter",
					symbol: "rect",
					symbolSize: [3, 18],
					z: 4,
					data: rows.map((row, index) => [row.target, index]),
					itemStyle: {
						color: theme.textPrimary,
						borderColor: theme.surface,
						borderWidth: 1
					}
				}
			]
		};
	}, [
		format,
		motion,
		rows,
		targetLabel,
		theme,
		valueLabel
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: rows.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Bullet chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No measurements were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Bump chart — rank over time, with the axis inverted so 1 is at the top.
*
* A `null` is a genuine gap (not ranked that period) and is drawn as a break,
* never interpolated: joining across a missing period would invent a position
* the data does not claim.
*/
function BumpChart({ periods, series, rankLabel = "Rank", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 24
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const list = Array.isArray(params) ? params : [params];
					const rows = list.filter((entry) => entry.value?.[1] != null).map((entry) => {
						const item = entry;
						return tooltipRowHtml(item.seriesName ?? "", String(item.value?.[1] ?? ""), item.color);
					});
					const first = list[0];
					return tooltipShellHtml(first?.name, `<div>${rows.join("")}</div>`);
				}
			}),
			xAxis: {
				type: "category",
				data: [...periods],
				boundaryGap: false,
				axisLine: { lineStyle: { color: theme.axisLine } },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption
				}
			},
			yAxis: {
				...axisFragment({
					type: "value",
					theme,
					name: rankLabel,
					nameLocation: "middle",
					nameGap: 46,
					min: 1
				}),
				inverse: true,
				splitLine: { lineStyle: { color: theme.grid } },
				minInterval: 1
			},
			series: series.map((entry, index) => {
				const color = seriesColor(theme, entry.tone ?? entry.label, index);
				return {
					name: entry.label,
					type: "line",
					connectNulls: false,
					showSymbol: true,
					symbolSize: 8,
					lineStyle: {
						width: 2,
						color,
						opacity: .85
					},
					itemStyle: { color },
					emphasis: { focus: "series" },
					data: [...entry.ranks]
				};
			})
		};
	}, [
		motion,
		periods,
		rankLabel,
		series,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: periods.length === 0 || series.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Bump chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to rank",
			emptyDescription: "No ranked periods were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Mekko (mosaic) — a stacked bar whose *width* is the group size.
*
* This is the honest version of a stacked bar: it shows that a 12% share inside
* a tiny column is not the same fact as a 12% share inside the biggest one, which
* a fixed-width stack hides.
*/
function MekkoChart({ columns, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const segmentNames = Array.from(new Set(columns.flatMap((column) => column.segments.map((segment) => segment.name))));
		const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);
		const bounds = [];
		let cursor = 0;
		for (const column of columns) {
			const span = totalWeight > 0 ? column.weight / totalWeight : 1 / Math.max(1, columns.length);
			bounds.push({
				start: cursor,
				end: cursor + span,
				column
			});
			cursor += span;
		}
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				left: 8,
				right: 12,
				top: 12,
				bottom: 8
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					const index = item.dataIndex ?? 0;
					const bound = bounds[index];
					const segment = bound?.column.segments.find((entry) => entry.name === item.seriesName);
					if (!bound || !segment) return "";
					const columnTotal = bound.column.segments.reduce((sum, entry) => sum + entry.value, 0);
					return tooltipShellHtml(bound.column.label, tooltipGridHtml([
						[segment.name, formatChartValue(segment.value, format)],
						["Share", formatRatio(columnTotal > 0 ? segment.value / columnTotal : 0)],
						["Weight", formatChartValue(bound.column.weight, format)]
					]));
				}
			}),
			xAxis: {
				type: "value",
				min: 0,
				max: 1,
				show: false
			},
			yAxis: {
				type: "value",
				min: 0,
				max: 1,
				show: false
			},
			series: segmentNames.map((name, seriesIndex) => ({
				name,
				type: "custom",
				z: 2,
				data: bounds.map((bound, boundIndex) => {
					const columnTotal = bound.column.segments.reduce((sum, entry) => sum + entry.value, 0);
					let lower = 0;
					for (const segment of bound.column.segments) {
						const height = columnTotal > 0 ? segment.value / columnTotal : 0;
						if (segment.name === name) return [
							boundIndex,
							bound.start,
							bound.end,
							lower,
							lower + height
						];
						lower += height;
					}
					return [
						boundIndex,
						bound.start,
						bound.end,
						0,
						0
					];
				}),
				renderItem: (_params, api) => {
					const helpers = api;
					const start = helpers.value(1);
					const end = helpers.value(2);
					const lower = helpers.value(3);
					const upper = helpers.value(4);
					if (end - start <= 0 || upper - lower <= 0) return null;
					const [x1, yTop] = helpers.coord([start, upper]);
					const [x2, yBottom] = helpers.coord([end, lower]);
					const color = seriesColor(theme, name, seriesIndex);
					return {
						type: "rect",
						shape: {
							x: x1 + .5,
							y: yTop,
							width: Math.max(0, x2 - x1 - 1),
							height: Math.max(0, yBottom - yTop)
						},
						style: {
							fill: color,
							opacity: .9,
							stroke: theme.surface,
							lineWidth: 1
						}
					};
				}
			}))
		};
	}, [
		columns,
		format,
		motion,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: columns.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Mekko chart",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No weighted columns were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { BulletChart, BumpChart, DumbbellChart, GanttChart, LollipopChart, MekkoChart, SlopeChart };

//# sourceMappingURL=workflow-charts.js.map