"use client";
import { cn } from "../../utils/cn.js";
import { ChartEmptyState, ChartErrorState, ChartPlot, ChartSkeleton } from "../chart-card.js";
import { extent, isSeriesEmpty, normalizeTabular } from "../core/data.js";
import { timeAxisLabelScale } from "../core/formatters.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { EChartSurface } from "../adapters/echarts/echart-surface.js";
import { buildChartOption } from "../adapters/echarts/build.js";
import { jsx } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
//#region src/charts/components/chart.tsx
/**
* A representative span for each label bucket.
*
* Only the *bucket* matters to the axis formatter, and a bucket changes a
* handful of times across a full zoom — so quantising the reported span keeps a
* pan or a pinch from rebuilding the option on every frame.
*/
const AXIS_SPAN_BY_SCALE = {
	time: 216e5,
	day: 432e6,
	month: 7776e6,
	"month-year": 63072e6,
	year: 47304e7
};
const FAMILY_LABEL = {
	line: "Line chart",
	area: "Area chart",
	bar: "Bar chart",
	waterfall: "Waterfall chart",
	scatter: "Scatter plot",
	bubble: "Bubble chart",
	composed: "Composed chart",
	depth: "Depth chart",
	curve: "Curve chart"
};
/**
* A chart always has an accessible name.
*
* An unlabelled `role="img"` is a serious accessibility defect, and "the canvas
* right there" is not a name. When a caller supplies neither a label nor a
* title, we describe the chart from its family and its visible series.
*/
function fallbackChartLabel(family, series) {
	const base = FAMILY_LABEL[family] ?? "Chart";
	const names = series.slice(0, 4).map((item) => item.label ?? item.key).filter(Boolean);
	return names.length ? `${base}: ${names.join(", ")}` : base;
}
/**
* The engine boundary.
*
* Nothing below this point knows about loading, empty or error — and, more
* importantly, a chart in one of those states never initialises an engine at
* all. That is why the states take precedence over the surface rather than
* rendering on top of it.
*/
function ChartSurface({ option, xValues, syncGroup, state = "ready", height, className, ariaLabel, ariaDescription, copy, onReady, onEvent, eager, onVisibleSpan, renderer, axisDrag }) {
	const box = (node, compact = false) => /* @__PURE__ */ jsx("div", {
		className: cn("relative w-full min-h-0", className),
		style: compact ? void 0 : { height: height ?? "100%" },
		children: node
	});
	if (state === "loading") return box(/* @__PURE__ */ jsx(ChartSkeleton, { height: "100%" }));
	if (state === "empty") return box(/* @__PURE__ */ jsx(ChartEmptyState, {
		compact: true,
		title: copy?.emptyTitle ?? "No data",
		description: copy?.emptyDescription,
		action: copy?.emptyAction
	}), true);
	if (state === "error") return box(/* @__PURE__ */ jsx(ChartErrorState, {
		compact: true,
		title: copy?.errorTitle ?? "Chart unavailable",
		description: copy?.errorDescription,
		action: copy?.errorAction
	}), true);
	return box(/* @__PURE__ */ jsx(EChartSurface, {
		option,
		xValues,
		syncGroup,
		ariaLabel,
		ariaDescription,
		onReady,
		onEvent,
		eager,
		onVisibleSpan,
		renderer,
		axisDrag
	}));
}
/**
* Declarative chart. Given a `ChartSpec`, it normalises data, applies the series
* selection, builds the engine option and renders the right state.
*/
function Chart({ spec, state = "ready", height, className, visibleSeries, ariaLabel, ariaDescription, emptyWhenNoData = true, eager, onReady, onEvent, ...copy }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, spec.animation, spec.pointCount);
	const normalized = useMemo(() => normalizeTabular(spec.data ?? [], spec.xKey, spec.x), [
		spec.data,
		spec.xKey,
		spec.x
	]);
	const xSpanMs = useMemo(() => {
		if (normalized.kind !== "time") return void 0;
		const range = extent(normalized.numericX);
		return range ? range[1] - range[0] : void 0;
	}, [normalized]);
	const [visibleScale, setVisibleScale] = useState(null);
	const handleVisibleSpan = useCallback((spanMs) => {
		const scale = spanMs && spanMs > 0 ? timeAxisLabelScale(spanMs) : null;
		setVisibleScale((previous) => previous === scale ? previous : scale);
	}, []);
	const axisSpanMs = visibleScale ? AXIS_SPAN_BY_SCALE[visibleScale] : xSpanMs;
	const selectedSeries = useMemo(() => {
		if (!visibleSeries) return spec.series;
		return spec.series.filter((series) => visibleSeries.includes(series.key));
	}, [spec.series, visibleSeries]);
	const resolvedState = state !== "ready" ? state : emptyWhenNoData && isSeriesEmpty(selectedSeries, normalized.rows) ? "empty" : "ready";
	const option = useMemo(() => {
		if (resolvedState !== "ready") return {};
		return buildChartOption({
			spec: {
				...spec,
				series: selectedSeries
			},
			theme,
			motion,
			normalized,
			xSpanMs,
			xLabelSpanMs: axisSpanMs
		});
	}, [
		resolvedState,
		spec,
		selectedSeries,
		theme,
		motion,
		normalized,
		xSpanMs,
		axisSpanMs
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		xValues: normalized.kind === "time" ? normalized.numericX : void 0,
		syncGroup: spec.syncGroup,
		state: resolvedState,
		height,
		className,
		ariaLabel: ariaLabel ?? spec.title ?? fallbackChartLabel(spec.family, selectedSeries),
		ariaDescription: ariaDescription ?? spec.description,
		copy,
		onReady,
		onEvent,
		eager,
		onVisibleSpan: normalized.kind === "time" ? handleVisibleSpan : void 0,
		renderer: spec.renderer,
		axisDrag: spec.interaction?.axisDrag ?? true
	});
}
/** Standalone plot box for charts that compose their own chrome. */
function ChartBox({ height, className, children }) {
	return /* @__PURE__ */ jsx(ChartPlot, {
		className: cn("overflow-hidden", className),
		style: height ? { ["--chart-height"]: typeof height === "number" ? `${height}px` : height } : void 0,
		children: /* @__PURE__ */ jsx("div", {
			className: "relative h-full w-full min-h-0",
			children
		})
	});
}
/**
* Local series-visibility state for chart toolbars. Presentation state stays in
* the component that owns it; nothing here reaches a global store.
*/
function useSeriesVisibility(series, initial) {
	const [visible, setVisible] = useState(() => [...initial ?? series.filter((item) => item.visibleByDefault !== false).map((item) => item.key)]);
	return {
		visible,
		toggle: useCallback((key) => {
			setVisible((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
		}, []),
		setOnly: useCallback((keys) => setVisible([...keys]), []),
		setVisible
	};
}
/** Local range state for a `ChartSpec.ranges` definition. */
function useChartRange(spec, initial) {
	const [range, setRange] = useState(initial ?? spec.ranges?.default ?? "all");
	return {
		range,
		setRange,
		ranges: spec.ranges?.ranges ?? []
	};
}
//#endregion
export { Chart, ChartBox, ChartSurface, useChartRange, useSeriesVisibility };

//# sourceMappingURL=chart.js.map