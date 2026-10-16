"use client";
import { withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, dataZoomFragment, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/waterfall-chart.tsx
/**
* Waterfall.
*
* Two stacked series: an invisible base that positions each bar, and the visible
* delta. Connector lines join consecutive levels, which is what makes a
* waterfall readable at all. Increases use `positive`, decreases `negative`, and
* subtotals use the accent — semantic colour, never the categorical palette.
*/
function WaterfallChart({ data, format, orientation = "vertical", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const horizontal = orientation === "horizontal";
	const option = useMemo(() => {
		const labels = [];
		const bases = [];
		const deltas = [];
		const colors = [];
		const levels = [];
		const connectors = [];
		let running = 0;
		data.forEach((item, index) => {
			labels.push(item.label);
			const previous = running;
			if (item.total) {
				bases.push(0);
				deltas.push(item.value);
				running = item.value;
				colors.push(theme.palette[0] ?? theme.accent);
			} else {
				const next = running + item.value;
				bases.push(Math.min(previous, next));
				deltas.push(Math.abs(item.value));
				running = next;
				colors.push(item.value >= 0 ? theme.positive : theme.negative);
			}
			levels.push(running);
			const nextItem = data[index + 1];
			if (nextItem) connectors.push([{ coord: [item.label, running] }, { coord: [nextItem.label, running] }]);
		});
		const categoryAxis = {
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
				interval: 0,
				width: 76,
				overflow: "truncate",
				hideOverlap: true,
				margin: 8
			}
		};
		const valueAxis = axisFragment({
			theme,
			type: "value",
			format,
			showGrid: true,
			...horizontal ? {} : { position: "right" }
		});
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 14,
				bottom: 6,
				left: 6
			}),
			...horizontal ? {
				xAxis: valueAxis,
				yAxis: {
					...categoryAxis,
					inverse: true
				}
			} : {
				xAxis: categoryAxis,
				yAxis: valueAxis
			},
			dataZoom: dataZoomFragment({
				theme,
				interaction: { zoom: "inside" },
				axisIndices: [0]
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const index = (Array.isArray(params) ? params : [params])[0]?.dataIndex ?? -1;
					const item = data[index];
					if (!item) return "";
					const signedOptions = {
						...format,
						signed: true
					};
					return tooltipShellHtml(item.label, tooltipGridHtml([["Change", formatChartValue(item.value, signedOptions)], ["Running", formatChartValue(levels[index] ?? null, format)]]));
				}
			}),
			series: [{
				id: "wf-base",
				name: "Base",
				type: "bar",
				stack: "waterfall",
				silent: true,
				itemStyle: { color: "transparent" },
				emphasis: { disabled: true },
				data: bases
			}, {
				id: "wf-delta",
				name: "Delta",
				type: "bar",
				stack: "waterfall",
				barMaxWidth: 40,
				data: deltas.map((value, index) => ({
					value,
					itemStyle: {
						color: withAlpha(colors[index] ?? theme.accent, .82),
						borderRadius: horizontal ? [
							0,
							3,
							3,
							0
						] : [
							3,
							3,
							0,
							0
						]
					}
				})),
				emphasis: { itemStyle: { opacity: 1 } },
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
					data: connectors
				}
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
		ariaLabel: ariaLabel ?? title ?? "Waterfall",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { WaterfallChart };

//# sourceMappingURL=waterfall-chart.js.map