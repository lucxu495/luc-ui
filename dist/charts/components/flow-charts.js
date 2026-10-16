"use client";
import { withAlpha } from "../core/theme.js";
import { formatChartValue } from "../core/formatters.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { baseOption, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/flow-charts.tsx
/**
* Flow between named stages.
*
* Links are deliberately quiet — low opacity, no gradient — so the nodes, which
* carry the meaning, stay visually dominant. A bright sankey is a decoration.
*/
function SankeyChart({ nodes, links, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => ({
		...baseOption(theme, motion),
		tooltip: tooltipShell(theme, {
			mode: "item",
			formatter: (params) => {
				const item = Array.isArray(params) ? params[0] : params;
				if (item.dataType === "edge") {
					const link = item.data ?? {};
					return tooltipShellHtml(`${link.source ?? ""} to ${link.target ?? ""}`, tooltipGridHtml([["Flow", formatChartValue(link.value ?? null, format)]]));
				}
				const outflow = links.filter((link) => link.source === item.name).reduce((sum, link) => sum + link.value, 0);
				return tooltipShellHtml(item.name, tooltipGridHtml([["Outflow", formatChartValue(outflow || null, format)]]));
			}
		}),
		series: [{
			id: "sankey",
			type: "sankey",
			left: 4,
			right: 12,
			top: 12,
			bottom: 12,
			nodeWidth: 11,
			nodeGap: 10,
			draggable: false,
			emphasis: { focus: "adjacency" },
			lineStyle: {
				color: withAlpha(theme.neutral, .34),
				curveness: .5,
				opacity: .55
			},
			itemStyle: {
				borderWidth: 0,
				borderRadius: 3
			},
			label: {
				color: theme.textMuted,
				fontFamily: theme.fontFamily,
				fontSize: theme.fontMicro
			},
			data: nodes.map((node) => ({ name: node.name })),
			links: links.map((link) => ({
				source: link.source,
				target: link.target,
				value: link.value
			}))
		}]
	}), [
		format,
		links,
		motion,
		nodes,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: nodes.length === 0 || links.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Sankey flow",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* Network graph.
*
* Force layout by default with a restrained repulsion, so the labels stay
* legible instead of collapsing into a hairball.
*/
function GraphChart({ nodes, links, groups, layout = "force", format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const maxValue = Math.max(1, ...nodes.map((node) => node.value ?? 1));
		return {
			...baseOption(theme, motion),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = Array.isArray(params) ? params[0] : params;
					if (item.dataType === "edge") {
						const link = item.data ?? {};
						return tooltipShellHtml(`${link.source ?? ""} to ${link.target ?? ""}`, tooltipGridHtml([["Weight", formatChartValue(link.value ?? null, format)]]));
					}
					const node = nodes.find((entry) => (entry.name ?? entry.id) === item.name);
					const rows = [["Weight", formatChartValue(node?.value ?? null, format)]];
					if (node?.group) rows.push(["Group", node.group]);
					return tooltipShellHtml(item.name, tooltipGridHtml(rows));
				}
			}),
			series: [{
				id: "graph",
				type: "graph",
				layout,
				roam: false,
				draggable: false,
				top: 12,
				bottom: 12,
				left: 12,
				right: 12,
				...layout === "force" ? { force: {
					repulsion: 240,
					edgeLength: [40, 110],
					gravity: .12,
					friction: .5
				} } : { circular: { rotateLabel: false } },
				lineStyle: {
					color: withAlpha(theme.neutral, .28),
					width: 1,
					curveness: .12
				},
				label: {
					show: true,
					position: "right",
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: "{b}"
				},
				itemStyle: { borderWidth: 0 },
				emphasis: {
					focus: "adjacency",
					scale: 1.1,
					label: { color: theme.textPrimary }
				},
				data: nodes.map((node) => ({
					id: node.id,
					name: node.name ?? node.id,
					value: node.value ?? 1,
					symbolSize: 8 + Math.sqrt((node.value ?? 1) / maxValue) * 16,
					...node.group ? { category: groups?.indexOf(node.group) ?? 0 } : {}
				})),
				links: links.map((link) => ({
					source: link.source,
					target: link.target,
					value: link.value ?? 1
				})),
				...groups?.length ? { categories: groups.map((name) => ({ name })) } : {}
			}]
		};
	}, [
		format,
		groups,
		layout,
		links,
		motion,
		nodes,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: nodes.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Network graph",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { GraphChart, SankeyChart };

//# sourceMappingURL=flow-charts.js.map