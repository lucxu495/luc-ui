"use client";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/network-charts.tsx
/**
* Turn a square matrix into chord geometry.
*
* The convention is the standard one and is worth stating because a chord
* diagram is easy to misread: group `i` occupies an arc proportional to its
* *row sum plus column sum* (what it sends plus what it receives), the first
* part of that arc is its outgoing side and the rest is its incoming side. So
* the matrix must already mean something — flows, transitions, co-occurrence —
* and the caller's row/column order is preserved exactly.
*
* Pure, total and exported: the geometry is testable without a browser, and a
* consumer can build its own rendering from the same numbers.
*/
function chordLayout(values, options = {}) {
	const size = values.length;
	if (size === 0) return {
		arcs: [],
		ribbons: [],
		total: 0
	};
	const gap = options.gapAngle ?? .022;
	const matrix = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => {
		const value = values[row]?.[column];
		return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
	}));
	const outgoing = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
	const incoming = Array.from({ length: size }, (_, column) => matrix.reduce((sum, row) => sum + (row[column] ?? 0), 0));
	const total = outgoing.reduce((sum, value) => sum + value, 0);
	if (total <= 0) return {
		arcs: [],
		ribbons: [],
		total: 0
	};
	const usable = Math.PI * 2 - gap * size;
	const weights = outgoing.map((value, index) => value + (incoming[index] ?? 0));
	const weightTotal = weights.reduce((sum, value) => sum + value, 0);
	let cursor = options.startAngle ?? -Math.PI / 2;
	const arcs = weights.map((weight, index) => {
		const span = weight / weightTotal * usable;
		const start = cursor;
		const sourceEnd = start + span * (weight > 0 ? (outgoing[index] ?? 0) / weight : 0);
		const end = start + span;
		cursor = end + gap;
		return {
			index,
			label: String(index),
			start,
			end,
			sourceStart: start,
			sourceEnd,
			targetStart: sourceEnd,
			targetEnd: end,
			total: weight
		};
	});
	const sourceCursor = arcs.map((arc) => arc.sourceStart);
	const targetCursor = arcs.map((arc) => arc.targetStart);
	const ribbons = [];
	for (let row = 0; row < size; row += 1) for (let column = 0; column < size; column += 1) {
		const value = matrix[row]?.[column] ?? 0;
		if (value <= 0) continue;
		const sourceArc = arcs[row];
		const targetArc = arcs[column];
		if (!sourceArc || !targetArc) continue;
		const outgoingTotal = outgoing[row] ?? 0;
		const incomingTotal = incoming[column] ?? 0;
		const sourceSpan = outgoingTotal ? (sourceArc.sourceEnd - sourceArc.sourceStart) * (value / outgoingTotal) : 0;
		const targetSpan = incomingTotal ? (targetArc.targetEnd - targetArc.targetStart) * (value / incomingTotal) : 0;
		const sourceStart = sourceCursor[row] ?? sourceArc.sourceStart;
		const targetStart = targetCursor[column] ?? targetArc.targetStart;
		sourceCursor[row] = sourceStart + sourceSpan;
		targetCursor[column] = targetStart + targetSpan;
		ribbons.push({
			source: row,
			target: column,
			value,
			sourceStart,
			sourceEnd: sourceStart + sourceSpan,
			targetStart,
			targetEnd: targetStart + targetSpan
		});
	}
	return {
		arcs,
		ribbons,
		total
	};
}
function polar(centerX, centerY, radius, angle) {
	return [centerX + radius * Math.cos(angle), centerY - radius * Math.sin(angle)];
}
/**
* The points along one arc, as `[x, y]` pairs.
*
* It returns *points* rather than a path string on purpose. The previous version
* returned a complete `M…L…` path and was concatenated twice per shape, so every
* ribbon and every ring band was built from **two unconnected subpaths** — the
* renderer filled each one separately and a chord diagram came out as a set of
* thin crescents hugging the circle instead of ribbons across the disc. The
* Phase 10A.1 report described exactly that ("suspiciously shaped ribbons"), and
* the cause was one `M` in the wrong place.
*/
function arcPoints(centerX, centerY, radius, from, to, steps) {
	return Array.from({ length: steps + 1 }, (_, index) => {
		return polar(centerX, centerY, radius, from + (to - from) * index / steps);
	});
}
/** Continue an existing path with a polyline through `points`. */
function lineTo(points) {
	return points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}
/** Start a path at a point. */
function moveTo([x, y]) {
	return `M${x.toFixed(2)},${y.toFixed(2)}`;
}
function ChordChart({ labels, values, gapAngle = .022, innerRatio = .72, ribbonOpacity = .42, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const layout = useMemo(() => chordLayout(values, { gapAngle }), [gapAngle, values]);
	const arcs = useMemo(() => layout.arcs.map((arc, index) => ({
		...arc,
		label: labels[index] ?? String(index)
	})), [labels, layout.arcs]);
	const option = useMemo(() => {
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				left: 4,
				right: 4,
				top: 4,
				bottom: 4,
				containLabel: false
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					const ribbon = layout.ribbons[item.dataIndex ?? 0];
					if (!ribbon) return "";
					const from = arcs[ribbon.source]?.label ?? String(ribbon.source);
					const to = arcs[ribbon.target]?.label ?? String(ribbon.target);
					return tooltipShellHtml(`${from} → ${to}`, tooltipGridHtml([["Value", formatChartValue(ribbon.value, format)]]));
				}
			}),
			xAxis: {
				type: "value",
				min: -1,
				max: 1,
				show: false
			},
			yAxis: {
				type: "value",
				min: -1,
				max: 1,
				show: false
			},
			series: [
				{
					name: "Relationships",
					type: "custom",
					z: 1,
					data: layout.ribbons.map((_ribbon, index) => [index]),
					renderItem: (params, api) => {
						const p = params;
						const helpers = api;
						const ribbon = layout.ribbons[p.dataIndex];
						if (!ribbon) return {
							type: "group",
							children: []
						};
						const width = helpers.getWidth();
						const heightPx = helpers.getHeight();
						const centerX = width / 2;
						const centerY = heightPx / 2;
						const radius = Math.min(width, heightPx) / 2 * .9;
						const color = seriesColor(theme, arcs[ribbon.source]?.label ?? String(ribbon.source), ribbon.source);
						const sourceArc = arcPoints(centerX, centerY, radius, ribbon.sourceStart, ribbon.sourceEnd, 16);
						const targetArc = arcPoints(centerX, centerY, radius, ribbon.targetEnd, ribbon.targetStart, 16);
						const first = sourceArc[0] ?? [centerX, centerY];
						const second = targetArc[0] ?? [centerX, centerY];
						return {
							type: "path",
							shape: { pathData: `${moveTo(first)} ${lineTo(sourceArc.slice(1))} Q ${centerX.toFixed(2)},${centerY.toFixed(2)} ${second[0].toFixed(2)},${second[1].toFixed(2)} ${lineTo(targetArc.slice(1))} Z` },
							style: {
								...helpers.style(),
								fill: color,
								opacity: ribbonOpacity,
								stroke: "none"
							},
							emphasis: { style: { opacity: Math.min(ribbonOpacity + .32, .95) } }
						};
					}
				},
				{
					name: "Groups",
					type: "custom",
					z: 2,
					silent: true,
					tooltip: { show: false },
					data: arcs.map((_arc, index) => [index]),
					renderItem: (params, api) => {
						const p = params;
						const helpers = api;
						const arc = arcs[p.dataIndex];
						if (!arc) return {
							type: "group",
							children: []
						};
						const width = helpers.getWidth();
						const heightPx = helpers.getHeight();
						const centerX = width / 2;
						const centerY = heightPx / 2;
						const radius = Math.min(width, heightPx) / 2 * .9;
						const inner = radius * innerRatio;
						const outerArc = arcPoints(centerX, centerY, radius, arc.start, arc.end, 24);
						const innerArc = arcPoints(centerX, centerY, inner, arc.end, arc.start, 24);
						return {
							type: "path",
							shape: { pathData: `${moveTo(outerArc[0] ?? [centerX, centerY])} ${lineTo(outerArc.slice(1))} ${lineTo(innerArc)} Z` },
							style: {
								...helpers.style(),
								fill: seriesColor(theme, arc.label, arc.index),
								stroke: theme.surface,
								lineWidth: 1
							}
						};
					}
				},
				{
					name: "Labels",
					type: "custom",
					z: 3,
					silent: true,
					tooltip: { show: false },
					data: arcs.map((_arc, index) => [index]),
					renderItem: (params, api) => {
						const p = params;
						const helpers = api;
						const arc = arcs[p.dataIndex];
						if (!arc) return {
							type: "group",
							children: []
						};
						const width = helpers.getWidth();
						const heightPx = helpers.getHeight();
						const centerX = width / 2;
						const centerY = heightPx / 2;
						const radius = Math.min(width, heightPx) / 2 * .9;
						const mid = (arc.start + arc.end) / 2;
						const [x, y] = polar(centerX, centerY, radius * 1.06, mid);
						const align = Math.cos(mid) >= 0 ? "left" : "right";
						return {
							type: "text",
							x: x + Math.cos(mid) * 4,
							y,
							style: {
								...helpers.style(),
								text: arc.label,
								fill: theme.textPrimary,
								align,
								verticalAlign: "middle",
								font: `${theme.fontCaption}px ${theme.fontFamily}`
							}
						};
					}
				}
			]
		};
	}, [
		arcs,
		format,
		innerRatio,
		layout.ribbons,
		motion,
		ribbonOpacity,
		theme
	]);
	const empty = layout.total <= 0 || labels.length === 0;
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: empty ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Chord diagram",
		ariaDescription: ariaDescription ?? description ?? "Arc length is the row plus column total for each group; each ribbon is one supplied matrix cell.",
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No matrix values were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
/**
* A hierarchical clustering tree.
*
* LUC draws the tree; it does not cluster. `merges` is the linkage the caller
* computed — the id, the two children and the join height — which means the
* picture cannot disagree with the analysis, and a different linkage method is
* a different set of merges rather than a hidden option here.
*/
function DendrogramChart({ leaves, merges, format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const { segments, maxHeight } = useMemo(() => {
		const positions = /* @__PURE__ */ new Map();
		leaves.forEach((label, index) => positions.set(label, {
			x: index,
			height: 0
		}));
		const out = [];
		let highest = 0;
		for (const merge of merges) {
			const left = positions.get(merge.left);
			const right = positions.get(merge.right);
			if (!left || !right) continue;
			const joinHeight = Number.isFinite(merge.height) ? merge.height : 0;
			positions.set(merge.id, {
				x: (left.x + right.x) / 2,
				height: joinHeight
			});
			out.push({
				leftX: left.x,
				leftHeight: left.height,
				rightX: right.x,
				rightHeight: right.height,
				height: joinHeight
			});
			highest = Math.max(highest, joinHeight);
		}
		return {
			segments: out,
			maxHeight: highest
		};
	}, [leaves, merges]);
	const option = useMemo(() => {
		const lastIndex = Math.max(leaves.length - 1, 0);
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: true,
				bottom: 4,
				top: 16
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const segment = segments[params.dataIndex ?? 0];
					if (!segment) return "";
					return tooltipShellHtml("Merge", tooltipGridHtml([["Height", formatChartValue(segment.height, format)], ["Branches", `${leaves[segment.leftX] ?? "?"} + ${leaves[segment.rightX] ?? "?"}`]]));
				}
			}),
			xAxis: {
				type: "value",
				min: 0,
				max: lastIndex,
				interval: 1,
				axisLine: { lineStyle: { color: theme.axisLine } },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: {
					color: theme.axisLabel,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption,
					hideOverlap: false,
					formatter: (value) => leaves[Math.round(value)] ?? ""
				}
			},
			yAxis: axisFragment({
				type: "value",
				theme,
				format,
				min: 0,
				max: maxHeight || void 0,
				scale: true
			}),
			series: [{
				name: "Merges",
				type: "custom",
				data: segments.map((_segment, index) => [index]),
				renderItem: (params, api) => {
					const segment = segments[params.dataIndex];
					if (!segment) return {
						type: "group",
						children: []
					};
					const helpers = api;
					const [leftX, joinY] = helpers.coord([segment.leftX, segment.height]);
					const [rightX] = helpers.coord([segment.rightX, segment.height]);
					const [, leftTop] = helpers.coord([segment.leftX, segment.leftHeight]);
					const [, rightTop] = helpers.coord([segment.rightX, segment.rightHeight]);
					const stroke = {
						...helpers.style(),
						stroke: theme.accent,
						lineWidth: 1.6,
						fill: "none"
					};
					return {
						type: "group",
						children: [
							{
								type: "line",
								shape: {
									x1: leftX,
									y1: leftTop,
									x2: leftX,
									y2: joinY
								},
								style: stroke
							},
							{
								type: "line",
								shape: {
									x1: leftX,
									y1: joinY,
									x2: rightX,
									y2: joinY
								},
								style: stroke
							},
							{
								type: "line",
								shape: {
									x1: rightX,
									y1: joinY,
									x2: rightX,
									y2: rightTop
								},
								style: stroke
							}
						]
					};
				}
			}]
		};
	}, [
		format,
		leaves,
		maxHeight,
		motion,
		segments,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: segments.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Dendrogram",
		ariaDescription: ariaDescription ?? description ?? "Branch height is the join height supplied by the caller's clustering.",
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "No merges were supplied."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { ChordChart, DendrogramChart, chordLayout };

//# sourceMappingURL=network-charts.js.map