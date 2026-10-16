"use client";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { baseOption, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/multidimensional-charts.tsx
/**
* Scatterplot matrix (SPLOM).
*
* `n × (n − 1)` grids for `n` variables — the pairs *without* the diagonal,
* because a variable plotted against itself carries no information and a
* diagonal of histograms would double the render cost for a decoration. Cells
* share an axis per row and column, which is what makes a correlation visible
* as a slope.
*
* Past roughly six variables a parallel-coordinates plot is the better tool;
* the Showcase's chart guidance says so, and this component will still render
* (it just gets small).
*/
function ScatterMatrixChart({ variables, rows, pointTone, cellSize = 120, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const pairs = [];
		for (let y = 0; y < variables.length; y += 1) for (let x = 0; x < variables.length; x += 1) if (x !== y) pairs.push({
			x,
			y
		});
		const share = 100 / Math.max(1, variables.length);
		const size = `${share.toFixed(4)}%`;
		return {
			...baseOption(theme, motion),
			grid: pairs.map((pair) => ({
				left: `${(pair.x * share).toFixed(4)}%`,
				top: `${(pair.y * share).toFixed(4)}%`,
				width: size,
				height: size,
				containLabel: true
			})),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					if (!item.value) return "";
					return tooltipShellHtml(item.seriesName, tooltipGridHtml([["X", formatChartValue(item.value[0], { kind: "number" })], ["Y", formatChartValue(item.value[1], { kind: "number" })]]));
				}
			}),
			xAxis: pairs.map((pair, index) => ({
				gridIndex: index,
				type: "value",
				scale: true,
				splitNumber: 3,
				axisLine: {
					show: pair.y === variables.length - 1,
					lineStyle: { color: theme.axisLine }
				},
				axisTick: { show: false },
				axisLabel: {
					show: pair.y === variables.length - 1,
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: (value) => formatChartValue(value, variables[pair.x]?.format)
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: theme.grid,
						opacity: .45
					}
				}
			})),
			yAxis: pairs.map((pair, index) => ({
				gridIndex: index,
				type: "value",
				scale: true,
				splitNumber: 3,
				axisLine: {
					show: pair.x === 0,
					lineStyle: { color: theme.axisLine }
				},
				axisTick: { show: false },
				axisLabel: {
					show: pair.x === 0,
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro,
					formatter: (value) => formatChartValue(value, variables[pair.y]?.format)
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: theme.grid,
						opacity: .45
					}
				}
			})),
			series: pairs.map((pair, index) => ({
				name: `${variables[pair.y]?.label} × ${variables[pair.x]?.label}`,
				type: "scatter",
				xAxisIndex: index,
				yAxisIndex: index,
				symbolSize: 5,
				data: rows.map((row, rowIndex) => ({
					value: [row[variables[pair.x]?.key ?? ""], row[variables[pair.y]?.key ?? ""]],
					itemStyle: pointTone ? {
						color: pointTone(row, rowIndex) ?? theme.accent,
						opacity: .7
					} : {
						color: theme.accent,
						opacity: .6
					}
				}))
			}))
		};
	}, [
		motion,
		pointTone,
		rows,
		theme,
		variables
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: rows.length === 0 || variables.length < 2 ? "empty" : state,
		height: height ?? variables.length * cellSize,
		className,
		ariaLabel: ariaLabel ?? title ?? "Scatterplot matrix",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "A scatterplot matrix needs at least two variables and one observation."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Hierarchy tree — a dendrogram, a file tree or an org chart.
*
* ECharts' own `tree` series supplies the layout and the collapse interaction,
* which is the right division: the layout is geometry, not a statistic. The
* component's job is the label model and the tone contract — a leaf takes its
* colour from its own `tone` so an editing tree and a JSON inspector can colour
* the same shape differently without forking the component.
*/
function HierarchyTreeChart({ root, orientation = "left-right", edgeShape = "curve", labels = true, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const radial = orientation === "radial";
		const labelPlacement = radial ? {
			position: "radial",
			room: 24
		} : {
			"left-right": {
				position: "right",
				room: 132
			},
			"right-left": {
				position: "left",
				room: 132
			},
			"top-bottom": {
				position: "bottom",
				room: 44
			},
			"bottom-top": {
				position: "top",
				room: 44
			}
		}[orientation];
		let toneIndex = 0;
		const toNode = (node) => {
			const color = node.tone ? seriesColor(theme, node.tone, toneIndex++) : theme.textMuted;
			return {
				name: node.name,
				value: node.value,
				collapsed: node.collapsed,
				itemStyle: { color },
				label: {
					color: labels ? theme.textPrimary : "transparent",
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption,
					position: labelPlacement.position,
					overflow: "truncate",
					ellipsis: "…",
					width: labelPlacement.room - 12
				},
				children: node.children?.map(toNode),
				symbolSize: node.children?.length ? 8 : 6
			};
		};
		const orient = radial ? void 0 : {
			"left-right": "LR",
			"right-left": "RL",
			"top-bottom": "TB",
			"bottom-top": "BT"
		}[orientation];
		return {
			...baseOption(theme, motion),
			series: [{
				type: "tree",
				data: [toNode(root)],
				left: radial ? "50%" : orientation === "right-left" ? labelPlacement.room : 24,
				right: radial ? void 0 : orientation === "left-right" ? labelPlacement.room : 24,
				top: radial ? 16 : orientation === "bottom-top" ? labelPlacement.room : 24,
				bottom: radial ? 16 : orientation === "top-bottom" ? labelPlacement.room : 24,
				layout: radial ? "radial" : "orthogonal",
				...radial ? {} : { orient },
				edgeShape,
				edgeForkPosition: "58%",
				roam: true,
				symbol: "circle",
				initialTreeDepth: 4,
				expandAndCollapse: true,
				lineStyle: {
					color: theme.gridStrong,
					width: 1.2,
					curveness: .4
				},
				emphasis: { focus: "descendant" }
			}],
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					return tooltipShellHtml(item.name, tooltipGridHtml([["Value", formatChartValue(item.value, format)]]));
				}
			})
		};
	}, [
		edgeShape,
		format,
		labels,
		motion,
		orientation,
		root,
		theme
	]);
	const leafCount = useMemo(() => {
		const walk = (node) => node.children?.length ? node.children.reduce((sum, child) => sum + walk(child), 0) : 1;
		return walk(root);
	}, [root]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: leafCount === 0 ? "empty" : state,
		height: height ?? 320,
		className,
		ariaLabel: ariaLabel ?? title ?? "Hierarchy",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "The tree has no leaves."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* Geographic scatter — one point per location on a caller-registered map.
*
* This is the honest half of the geographic brief. A point map needs only a
* base map for context, so it works the moment a consumer registers one; a
* *choropleth* additionally needs a value per region, which is a different
* contract (see the ecosystem roadmap — `MapChart` is blocked on shipping or
* requiring region data, not on engine support).
*/
function GeoScatterChart({ mapName, points, valueFormat, maxSymbolSize = 22, showRegions = true, boundingCoords, variant = "scatter", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const values = points.map((point) => point.value);
		const min = values.length ? Math.min(...values) : 0;
		const max = values.length ? Math.max(...values) : 1;
		return {
			...baseOption(theme, motion),
			geo: {
				map: mapName,
				roam: true,
				zoom: 1.1,
				...boundingCoords ? { boundingCoords: [boundingCoords[0], boundingCoords[1]] } : {},
				itemStyle: {
					areaColor: showRegions ? theme.surfaceRaised : "transparent",
					borderColor: theme.gridStrong,
					borderWidth: .8
				},
				emphasis: {
					itemStyle: { areaColor: theme.surfaceOverlay },
					label: { show: false }
				},
				select: { disabled: true }
			},
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					if (!item.value) return "";
					return tooltipShellHtml(item.name, tooltipGridHtml([["Value", formatChartValue(item.value[2], valueFormat)], ["Coordinates", `${item.value[0].toFixed(3)}, ${item.value[1].toFixed(3)}`]]));
				}
			}),
			visualMap: {
				show: true,
				min,
				max,
				left: 8,
				bottom: 8,
				itemWidth: 10,
				itemHeight: 70,
				calculable: false,
				textStyle: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontMicro
				},
				inRange: { color: [...theme.sequentialAnchors] },
				dimension: 2
			},
			series: [{
				name: title ?? "Locations",
				type: variant === "effect" ? "effectScatter" : "scatter",
				coordinateSystem: "geo",
				...variant === "effect" ? { rippleEffect: {
					scale: 2.4,
					brushType: "stroke"
				} } : {},
				symbolSize: (value) => {
					const point = value;
					const span = max - min;
					const ratio = span > 0 ? (point[2] - min) / span : .5;
					return 6 + Math.sqrt(Math.max(0, ratio)) * (maxSymbolSize - 6);
				},
				itemStyle: {
					borderColor: theme.surface,
					borderWidth: 1
				},
				emphasis: {
					label: { show: false },
					itemStyle: { borderWidth: 2 }
				},
				data: points.map((point) => ({
					name: point.name,
					value: [
						point.coordinates[0],
						point.coordinates[1],
						point.value
					]
				}))
			}]
		};
	}, [
		boundingCoords,
		mapName,
		maxSymbolSize,
		motion,
		points,
		showRegions,
		theme,
		title,
		valueFormat,
		variant
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: points.length === 0 || !mapName ? "empty" : state,
		height: height ?? 380,
		className,
		ariaLabel: ariaLabel ?? title ?? "Geographic scatter",
		ariaDescription: ariaDescription ?? description,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "Register a map with registerEChartsMap, then supply points."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { GeoScatterChart, HierarchyTreeChart, ScatterMatrixChart };

//# sourceMappingURL=multidimensional-charts.js.map