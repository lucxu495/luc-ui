import { DEFAULT_Y_AXIS_SIDE, axisBoundFn, normalizeScaleCapability, resolveAxisBounds, resolveScaleMode } from "../../core/axis.js";
import { cell, extent, seriesValues, toNumber } from "../../core/data.js";
import { paletteColor, toneColor, withAlpha } from "../../core/theme.js";
import { resolveFormatter } from "../../core/formatters.js";
import { axisFragment, baseOption, buildCartesianCrosshairOptions, dataZoomFragment, gridForSides, tooltipShell } from "./option.js";
import { annotationMarks } from "./marks.js";
import { axisTooltipFormatter, escapeHtml, tooltipGridHtml, tooltipRuleHtml, tooltipShellHtml } from "../../core/tooltip-html.js";
//#region src/charts/adapters/echarts/cartesian.ts
/**
* The vertical band a bottom series legend occupies, in plot pixels.
*
* One row of swatches plus the axis labels beneath it. Enumerated here so the
* grid and the legend cannot disagree about how much room the control has.
*/
const LEGEND_BAND_PX = 48;
/**
* Value-axis padding for a **horizontal** ranked bar that prints its numbers.
*
* The printed value sits just past the bar's outer end, so the outermost bar
* needs room for a label, not just for its stroke — otherwise the number lands
* on top of the category labels in the left gutter. Wide enough for a signed
* percent at the caption size, and it moves one axis edge only (the zero edge of
* a one-signed family is still pinned, because a baseline mark must keep its
* baseline).
*/
const VALUE_LABEL_AXIS_PADDING = .18;
function axisIdOf(series) {
	return series.axis ?? "primary";
}
function findAxis(axes, id) {
	return axes?.find((axis) => (axis.id ?? "primary") === id) ?? {};
}
/**
* The key a point's caller-supplied metadata is stored under.
*
* A time axis holds millisecond numbers while the caller keys by the ISO date it
* reads in the payload, so both resolve to the same `YYYY-MM-DD`; a category or
* value axis keeps its own string form.
*/
function pointKeyOf(value) {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? String(value) : value.toISOString().slice(0, 10);
	if (typeof value === "number" && Number.isFinite(value)) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
	}
	return String(value ?? "");
}
/**
* The declared scale capability for a chart.
*
* An axis-level `scaleMode` is the older, single-axis spelling: a chart that
* declares only a default (no allow-list) is linear-only, exactly as before, and
* `spec.scale` is what turns the reader's Linear/Log control on. Signed and
* percentage analytics therefore stay linear unless the product says otherwise.
*/
function scaleCapabilityOf(spec) {
	if (spec.scale) {
		const declared = normalizeScaleCapability(spec.scale);
		if (!spec.scale.allowed) return {
			allowedScaleModes: ["linear", "log"],
			defaultScaleMode: declared.defaultScaleMode
		};
		return declared;
	}
	const axisMode = spec.axes?.find((axis) => axis.scaleMode)?.scaleMode;
	return normalizeScaleCapability(axisMode ? {
		allowed: [axisMode],
		default: axisMode
	} : null);
}
function axisSideOf(axis, index) {
	if (axis.position) return axis.position;
	return index === 0 ? DEFAULT_Y_AXIS_SIDE : "left";
}
/** Should this axis keep zero as a fixed baseline edge? */
function needsZeroBaseline(spec, family, axisId) {
	const declared = findAxis(spec.axes, axisId).zeroBaseline;
	if (declared !== void 0) return declared;
	if (family === "histogram" || family === "waterfall") return true;
	return spec.series.some((series) => {
		if (axisIdOf(series) !== axisId) return false;
		const type = series.type ?? (family === "area" ? "area" : family === "bar" ? "bar" : "line");
		return type === "bar" || type === "area" || type === "boxplot";
	});
}
/**
* A bound for one edge of one axis.
*
* Explicit `min`/`max` win. Otherwise the edge gets the shared domain policy:
* proportional headroom that follows the *visible* extent (so a zoom keeps its
* padding instead of freezing the full-history domain), a fixed zero baseline
* where the marks are measured from zero, and a bounded snap to readable ticks.
*/
function axisBound(declared, edge, options) {
	if (declared !== void 0) return declared;
	const zeroBaseline = options.scaleMode === "log" ? false : options.zeroBaseline;
	return axisBoundFn(edge, {
		scaleMode: options.scaleMode,
		zeroBaseline,
		marker: options.marker,
		padding: options.padding,
		include: options.include
	});
}
/**
* The declared levels that belong on one axis.
*
* Reference lines and y-bands are part of what a chart says, so the domain
* grows to include them; a threshold that fell outside the axis would silently
* disappear. A log axis can only carry positive levels.
*/
function declaredLevels(spec, axisId, scaleMode) {
	const target = (candidate) => (candidate ?? "primary") === axisId;
	const levels = [];
	for (const line of spec.annotations?.referenceLines ?? []) {
		if (line.axis === "x" || !target(line.targetAxis)) continue;
		if (typeof line.value === "number" && Number.isFinite(line.value)) levels.push(line.value);
	}
	for (const band of spec.annotations?.referenceBands ?? []) {
		if (band.axis === "x" || !target(band.targetAxis)) continue;
		for (const bound of [band.from, band.to]) if (typeof bound === "number" && Number.isFinite(bound)) levels.push(bound);
	}
	return scaleMode === "log" ? levels.filter((value) => value > 0) : levels;
}
function seriesColor(theme, series, index) {
	if (series.color) return series.color;
	if (series.palette) return paletteColor(theme, series.palette - 1);
	return toneColor(theme, series.tone, index);
}
/** Presentation-only percentage normalisation for `stackMode: "percent"`. */
function percentStacks(spec, normalized) {
	const groups = /* @__PURE__ */ new Map();
	for (const series of spec.series) {
		if (series.stackMode !== "percent") continue;
		const key = series.stack ?? "default";
		const list = groups.get(key);
		if (list) list.push(series);
		else groups.set(key, [series]);
	}
	const result = /* @__PURE__ */ new Map();
	for (const group of groups.values()) {
		const values = group.map((series) => seriesValues(series, normalized.rows));
		const totals = normalized.rows.map((_, index) => values.reduce((sum, seriesValuesList) => sum + (seriesValuesList[index] ?? 0), 0));
		group.forEach((series, seriesIndex) => {
			result.set(series.key, values[seriesIndex].map((value, index) => {
				const total = totals[index];
				if (value === null || !total) return null;
				return value / total * 100;
			}));
		});
	}
	return result;
}
function lineTypeOf(series) {
	switch (series.lineType) {
		case "dashed": return "dashed";
		case "dotted": return "dotted";
		default: return "solid";
	}
}
function symbolOf(series, pointCount) {
	if (series.symbol === false || series.symbol === "none") return false;
	if (typeof series.symbol === "string") return series.symbol;
	return series.symbol === true || pointCount <= 60 ? "circle" : false;
}
function seriesFragment(series, index, input, overrides) {
	const { theme, normalized } = input;
	const color = seriesColor(theme, series, index);
	const values = overrides.values ?? seriesValues(series, normalized.rows);
	const type = series.type ?? (input.spec.family === "area" ? "area" : "line");
	const data = overrides.categoryX || overrides.swap ? values : values.map((value, rowIndex) => [normalized.x[rowIndex], value]);
	const base = {
		id: series.key,
		name: series.label ?? series.key,
		color,
		data,
		emphasis: { focus: "series" },
		...series.opacity !== void 0 ? { opacity: series.opacity } : {},
		...series.z !== void 0 ? { z: series.z } : {}
	};
	if (type === "bar") {
		const barMax = 26;
		const horizontal = input.spec.orientation === "horizontal";
		const valueFormatter = series.valueLabels ? resolveFormatter(series) : null;
		return {
			...base,
			type: "bar",
			...valueFormatter ? { data: data.map((entry) => {
				const raw = Array.isArray(entry) ? entry[1] : entry;
				const numeric = typeof raw === "number" ? raw : Number(raw);
				return {
					value: entry,
					label: { position: horizontal ? Number.isFinite(numeric) && numeric < 0 ? "left" : "right" : "top" }
				};
			}) } : {},
			barMaxWidth: barMax,
			barCategoryGap: "38%",
			itemStyle: {
				color,
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
			},
			...valueFormatter ? { label: {
				show: true,
				position: horizontal ? "right" : "top",
				distance: 4,
				color: theme.textMuted,
				fontFamily: theme.monoFamily,
				fontSize: theme.fontMicro,
				formatter: (params) => {
					const raw = Array.isArray(params.value) ? params.value[1] : params.value;
					const numeric = typeof raw === "number" ? raw : Number(raw);
					return Number.isFinite(numeric) ? valueFormatter(numeric) : "";
				}
			} } : {},
			...series.stack ? { stack: series.stack } : {}
		};
	}
	if (type === "scatter") {
		const bubble = input.spec.family === "bubble";
		const sizes = series.sizeKey ? normalized.rows.map((row) => toNumber(cell(row, series.sizeKey))) : null;
		const maxSize = sizes ? Math.max(1, ...sizes.filter((value) => value !== null)) : 1;
		const sizedData = sizes ? values.map((value, rowIndex) => [
			normalized.x[rowIndex],
			value,
			sizes[rowIndex] ?? 0
		]) : data;
		return {
			...base,
			type: "scatter",
			data: sizedData,
			symbolSize: sizes ? (value) => {
				const size = Array.isArray(value) ? Number(value[2]) : 0;
				return 5 + Math.sqrt(Math.max(0, size)) / Math.sqrt(maxSize) * 20;
			} : bubble ? 14 : 9,
			itemStyle: {
				color,
				opacity: .85,
				borderColor: withAlpha(color, .35),
				borderWidth: 1
			},
			emphasis: {
				focus: "series",
				scale: 1.6,
				itemStyle: {
					opacity: 1,
					borderColor: theme.surface,
					borderWidth: 1.5,
					shadowBlur: 16,
					shadowColor: withAlpha(color, .55)
				}
			}
		};
	}
	const area = type === "area" || series.area === true;
	const width = series.lineWidth ?? (area ? 1.75 : 2);
	return {
		...base,
		type: "line",
		smooth: series.smooth ?? false,
		clip: false,
		...series.step ? { step: series.step === true ? "end" : series.step } : {},
		showSymbol: symbolOf(series, values.length),
		symbolSize: 6,
		connectNulls: false,
		lineStyle: {
			color,
			width,
			type: lineTypeOf(series),
			cap: "round",
			join: "round"
		},
		itemStyle: {
			color,
			borderWidth: 0
		},
		...series.stack ? {
			stack: series.stack,
			areaStyle: void 0
		} : {},
		...area ? {
			areaStyle: series.areaGradient === false ? { color: withAlpha(color, .16) } : { color: {
				type: "linear",
				x: 0,
				y: 0,
				x2: 0,
				y2: 1,
				colorStops: [{
					offset: 0,
					color: withAlpha(color, .26)
				}, {
					offset: 1,
					color: withAlpha(color, .01)
				}]
			} },
			lineStyle: {
				color,
				width: series.lineWidth ?? 1.75,
				type: lineTypeOf(series)
			}
		} : {},
		emphasis: {
			focus: "series",
			lineStyle: {
				width: width + 1.25,
				shadowBlur: 14,
				shadowColor: withAlpha(color, .5)
			},
			itemStyle: {
				borderColor: theme.surface,
				borderWidth: 1.5
			},
			...area ? { areaStyle: { opacity: .34 } } : {}
		}
	};
}
function annotationFragment(input) {
	const primary = input.spec.series[0];
	const primaryValues = primary ? seriesValues(primary, input.normalized.rows) : [];
	const markerY = extent(primaryValues)?.[1] ?? 0;
	const xExtent = extent(input.normalized.numericX);
	return annotationMarks(input.theme, input.spec.annotations, markerY, xExtent);
}
/** The numeric x an annotation marker sits on, whatever type its `at` is. */
function markerX(value) {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "number") return value;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : null;
}
/**
* The tooltip block an event annotation contributes at its own date.
*
* A compact marker (one that carries `detail`) draws no permanent label, so the
* exact event has to be readable somewhere. It belongs in the chart's existing
* tooltip: hovering the date of a halving, a cycle high or a cycle low appends
* that event's own served fields under the series rows. Nothing is derived — the
* chart formats the caller's rows — and an ordinary date contributes nothing.
*/
function eventDetailFooter(markers) {
	const detailed = markers.filter((marker) => (marker.detail?.length ?? 0) > 0);
	if (detailed.length === 0) return void 0;
	const positioned = detailed.map((marker) => ({
		marker,
		x: markerX(marker.at)
	})).filter((entry) => entry.x !== null).sort((left, right) => left.x - right.x);
	if (positioned.length === 0) return void 0;
	return (params) => {
		const raw = (Array.isArray(params) ? params : [params])[0]?.axisValue;
		const x = raw instanceof Date ? raw.getTime() : typeof raw === "number" ? raw : NaN;
		if (!Number.isFinite(x)) return "";
		const nearest = positioned.reduce((best, entry) => {
			const distance = Math.abs(entry.x - x);
			if (distance > EVENT_DETAIL_TOLERANCE_MS) return best;
			if (best && best.distance <= distance) return best;
			return {
				...entry,
				distance
			};
		}, null);
		if (!nearest) return "";
		return [nearest.marker].map((marker) => tooltipRuleHtml() + `<span class="luc-chart-tooltip__subtitle">${escapeHtml(marker.label)}</span>` + tooltipGridHtml(marker.detail ?? [])).join("");
	};
}
/**
* How far, in milliseconds, an event may sit from the hovered observation.
*
* Three days covers the neighbouring bars of a daily or weekly chronology
* without reaching the next event on the same axis (a halving and a cycle
* extreme are never that close).
*/
const EVENT_DETAIL_TOLERANCE_MS = 2592e5;
function buildCartesianOption(input) {
	const { spec, theme, motion, normalized } = input;
	const family = spec.family;
	const swap = family === "bar" && spec.orientation === "horizontal";
	const axisIds = [...new Set(spec.series.map(axisIdOf))];
	const percent = percentStacks(spec, normalized);
	const stackedPercent = percent.size > 0;
	const xKind = normalized.kind;
	const categoryX = !(xKind === "time" || xKind === "value" && spec.x?.type === "value" || family === "scatter" || family === "bubble");
	const xAxisType = xKind === "time" ? "time" : categoryX && !swap ? "category" : "value";
	const pointMeta = spec.points;
	const metaFor = (value) => pointMeta ? pointMeta[pointKeyOf(value)] : void 0;
	const categoryLabels = normalized.x.map((value) => metaFor(value)?.label ?? (value instanceof Date ? value.toISOString().slice(0, 10) : String(value)));
	const hasCategoryAxis = categoryX || swap;
	const xAxisBase = {
		...axisFragment({
			theme,
			type: xAxisType,
			format: input.xFormat,
			spanMs: input.xSpanMs,
			labelSpanMs: input.xLabelSpanMs,
			baseline: family === "bar" || family === "waterfall",
			showGrid: family === "scatter" || family === "bubble",
			pointLabel: pointMeta ? (value) => metaFor(value)?.label : void 0
		}),
		...hasCategoryAxis ? { data: categoryLabels } : {}
	};
	const capability = scaleCapabilityOf(spec);
	const axisValues = spec.series.flatMap((series) => percent.get(series.key) ?? seriesValues(series, normalized.rows));
	const declaredLog = Boolean(spec.axes?.some((axis) => axis.type === "log" || axis.scaleMode === "log"));
	const requested = spec.scale?.mode ?? spec.scale?.default ?? (declaredLog ? "log" : null);
	const resolvedScale = resolveScaleMode({
		requested,
		capability,
		values: axisValues
	});
	if (resolvedScale.fallback === "non-positive-data" && true) console.warn(`[luc-ui] chart "${spec.id ?? spec.family}" requested a log scale over data that is not strictly positive; falling back to linear. Log is only valid for positive levels.`);
	const yAxes = axisIds.map((id, index) => {
		const axisSpec = findAxis(spec.axes, id);
		const firstSeries = spec.series.find((series) => axisIdOf(series) === id);
		const zeroBaseline = needsZeroBaseline(spec, family, id);
		const axisScaleMode = resolvedScale.mode === "log" && (axisIds.length === 1 || axisSpec.type === "log" || axisSpec.scaleMode === "log") ? "log" : "linear";
		const boundOptions = {
			scaleMode: axisScaleMode,
			zeroBaseline,
			marker: spec.series.some((series) => axisIdOf(series) === id && series.currentPoint === true),
			padding: axisSpec.padding ?? (spec.orientation === "horizontal" && spec.series.some((series) => series.valueLabels) ? VALUE_LABEL_AXIS_PADDING : void 0),
			include: declaredLevels(spec, id, axisScaleMode)
		};
		const axisValuesForAxis = spec.series.filter((series) => axisIdOf(series) === id).flatMap((series) => percent.get(series.key) ?? seriesValues(series, normalized.rows));
		const dataExtent = extent(axisValuesForAxis);
		const labels = dataExtent ? resolveAxisBounds({
			...boundOptions,
			extent: {
				min: Math.min(dataExtent[0], ...boundOptions.include),
				max: Math.max(dataExtent[1], ...boundOptions.include)
			}
		}) : null;
		return {
			...axisFragment({
				theme,
				type: axisScaleMode === "log" ? "log" : "value",
				name: axisSpec.label,
				position: axisSideOf(axisSpec, index),
				format: axisSpec.format ?? (stackedPercent ? { kind: "percent" } : firstSeries?.format),
				min: stackedPercent ? axisSpec.min ?? 0 : axisBound(axisSpec.min, "min", boundOptions),
				max: stackedPercent ? axisSpec.max ?? 100 : axisBound(axisSpec.max, "max", boundOptions),
				hideMinLabel: !stackedPercent && axisSpec.min === void 0 && (labels?.minHeadroom ?? false),
				hideMaxLabel: !stackedPercent && axisSpec.max === void 0 && (labels?.maxHeadroom ?? false),
				hidden: axisSpec.hidden
			}),
			...index > 0 ? { splitLine: { show: false } } : {}
		};
	});
	const categoryAxisFragment = {
		...axisFragment({
			theme,
			type: "category",
			position: "left",
			baseline: true,
			showGrid: false
		}),
		data: categoryLabels
	};
	const xAxes = swap ? [{ ...yAxes[0] }] : [xAxisBase];
	const finalYAxes = swap ? [categoryAxisFragment, ...yAxes.slice(1)] : yAxes.length ? yAxes : [axisFragment({
		theme,
		type: "value",
		position: DEFAULT_Y_AXIS_SIDE,
		format: spec.series[0]?.format
	})];
	const crosshair = buildCartesianCrosshairOptions(theme, spec.interaction?.crosshair);
	const withAxisPointer = (axis, pointer, labelVisible) => {
		const current = axis.axisPointer ?? {};
		const currentLabel = current.label ?? {};
		const pointerLabel = pointer.label ?? {};
		return {
			...axis,
			axisPointer: {
				...current,
				...pointer,
				label: {
					...currentLabel,
					...pointerLabel,
					show: labelVisible
				}
			}
		};
	};
	const crosshairXAxes = xAxes.map((axis) => withAxisPointer(axis, crosshair.xAxisPointer, (crosshair.xAxisPointer.label ?? {}).show ?? true));
	const crosshairYAxes = finalYAxes.map((axis) => withAxisPointer(axis, crosshair.yAxisPointer, false));
	const metaById = /* @__PURE__ */ new Map();
	spec.series.forEach((series, index) => {
		const axisFormat = findAxis(spec.axes, axisIdOf(series)).format;
		metaById.set(series.key, {
			id: series.key,
			label: series.label ?? series.key,
			color: seriesColor(theme, series, index),
			format: resolveFormatter(series, axisFormat ?? spec.series[0]?.format)
		});
	});
	const targetAxisIndex = (series) => {
		const id = axisIdOf(series);
		const index = axisIds.indexOf(id);
		if (swap) return 0;
		return index < 0 ? 0 : index;
	};
	const seriesOptions = spec.series.map((series, index) => {
		const fragment = seriesFragment(series, index, input, {
			values: percent.get(series.key),
			categoryX: categoryX && !swap,
			swap
		});
		const annotation = index === 0 ? annotationFragment(input) : {};
		return {
			...fragment,
			xAxisIndex: 0,
			yAxisIndex: targetAxisIndex(series),
			...annotation
		};
	});
	const currentPointSeries = spec.series.flatMap((series, index) => {
		if (!series.currentPoint) return [];
		const values = percent.get(series.key) ?? seriesValues(series, normalized.rows);
		let lastIndex = -1;
		for (let cursor = values.length - 1; cursor >= 0; cursor -= 1) if (values[cursor] !== null && Number.isFinite(values[cursor])) {
			lastIndex = cursor;
			break;
		}
		if (lastIndex < 0) return [];
		const color = seriesColor(theme, series, index);
		const point = [categoryX && !swap ? categoryLabels[lastIndex] : normalized.x[lastIndex], values[lastIndex]];
		return [{
			id: `${series.key}__current`,
			type: "effectScatter",
			name: `${series.label ?? series.key} (current)`,
			color,
			data: [point],
			xAxisIndex: 0,
			yAxisIndex: targetAxisIndex(series),
			symbolSize: 9,
			itemStyle: {
				color,
				borderColor: theme.surface,
				borderWidth: 2
			},
			rippleEffect: {
				scale: 3.2,
				brushType: "stroke",
				period: 2.6,
				color
			},
			showEffectOn: (motion.emphasis ?? 0) > 0 ? "render" : "emphasis",
			silent: true,
			z: 8,
			tooltip: { show: false },
			emphasis: { disabled: true }
		}];
	});
	const tooltip = spec.tooltip?.mode === "none" ? tooltipShell(theme, {
		formatter: () => "",
		mode: "none"
	}) : tooltipShell(theme, {
		mode: spec.tooltip?.mode ?? (family === "scatter" || family === "bubble" ? "item" : "axis"),
		crosshair: spec.interaction?.crosshair ?? true,
		formatter: family === "scatter" || family === "bubble" ? itemScatterFormatter(input) : axisTooltipFormatter({
			theme,
			metaById,
			xFormat: input.xFormat,
			xIsTime: normalized.kind === "time",
			spanMs: input.xSpanMs,
			sort: spec.tooltip?.sort,
			total: spec.tooltip?.total,
			pointDetail: pointMeta ? (item) => {
				const index = item.dataIndex;
				if (typeof index !== "number") return void 0;
				return metaFor(normalized.x[index])?.detail;
			} : void 0,
			footer: eventDetailFooter(spec.annotations?.markers ?? [])
		})
	});
	const zoom = dataZoomFragment({
		theme,
		interaction: spec.interaction,
		axisIndices: categoryX ? [0] : [0],
		dragOnly: spec.interaction?.axisDrag ?? true
	});
	const legendNames = spec.series.filter((series) => series.legend !== false).map((series) => series.label ?? series.key).filter((name, index, names) => names.indexOf(name) === index);
	const showLegend = spec.legend === true && legendNames.length >= 2;
	const legendFragment = showLegend ? { legend: {
		show: true,
		data: legendNames,
		type: "scroll",
		bottom: 0,
		left: "center",
		padding: [
			6,
			0,
			0,
			0
		],
		itemGap: 14,
		itemWidth: 10,
		itemHeight: 10,
		icon: "roundRect",
		inactiveColor: theme.textMuted,
		textStyle: {
			color: theme.textMuted,
			fontSize: theme.fontCaption,
			fontFamily: theme.fontFamily
		},
		pageTextStyle: { color: theme.textMuted },
		pageIconColor: theme.accent,
		pageIconInactiveColor: theme.textMuted,
		selectedMode: "multiple"
	} } : {};
	const option = {
		...baseOption(theme, motion, {
			universal: spec.universalTransition,
			threshold: spec.pointCount !== void 0 && spec.pointCount > 4e3 ? 1 : void 0
		}),
		grid: gridForSides(finalYAxes.map((axis) => axis.position ?? "right"), showLegend ? { bottom: LEGEND_BAND_PX + (spec.interaction?.zoom === "slider" ? 28 : 0) } : spec.interaction?.zoom === "slider" ? { bottom: 44 } : {}),
		xAxis: crosshairXAxes,
		yAxis: crosshairYAxes,
		series: [...seriesOptions, ...currentPointSeries],
		tooltip,
		...legendFragment,
		...zoom.length ? { dataZoom: zoom } : {},
		...spec.interaction?.brush ? { brush: {
			toolbox: ["rect", "clear"],
			xAxisIndex: 0,
			brushStyle: {
				borderWidth: 1,
				color: theme.band,
				borderColor: theme.accent
			}
		} } : {}
	};
	spec.extendOption?.(option);
	return option;
}
/** Scatter/bubble tooltip: x, y and (for bubbles) the third dimension. */
function itemScatterFormatter(input) {
	const { spec } = input;
	const formats = spec.series.map((series) => resolveFormatter(series, spec.series[0]?.format));
	return (params) => {
		const item = Array.isArray(params) ? params[0] : params;
		const value = item.value;
		const seriesIndex = spec.series.findIndex((series) => series.key === item.seriesId);
		const format = formats[seriesIndex >= 0 ? seriesIndex : 0] ?? formats[0];
		const rows = [];
		if (Array.isArray(value)) {
			rows.push(["X", String(value[0])]);
			rows.push(["Y", format?.(Number(value[1])) ?? String(value[1])]);
			if (value.length > 2) rows.push(["Size", String(value[2])]);
		} else rows.push(["Value", format?.(Number(value)) ?? String(value)]);
		const label = spec.series[seriesIndex]?.label ?? item.seriesName;
		return tooltipShellHtml(label, tooltipGridHtml(rows));
	};
}
//#endregion
export { buildCartesianOption, seriesColor };

//# sourceMappingURL=cartesian.js.map