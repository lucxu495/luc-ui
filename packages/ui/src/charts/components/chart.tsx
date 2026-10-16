"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { ChartEmptyState, ChartErrorState, ChartSkeleton, ChartPlot } from "../chart-card";
import { EChartSurface, type EChartEvent } from "../adapters/echarts/echart-surface";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import { buildChartOption } from "../adapters/echarts/build";
import { extent, isSeriesEmpty, normalizeTabular } from "../core/data";
import { timeAxisLabelScale, type TimeAxisLabelScale } from "../core/formatters";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import type { ChartRenderer, ChartSpec, SeriesSpec } from "../types";

/**
 * A representative span for each label bucket.
 *
 * Only the *bucket* matters to the axis formatter, and a bucket changes a
 * handful of times across a full zoom — so quantising the reported span keeps a
 * pan or a pinch from rebuilding the option on every frame.
 */
const AXIS_SPAN_BY_SCALE: Record<TimeAxisLabelScale, number> = {
  time: 6 * 60 * 60 * 1000,
  day: 5 * 86_400_000,
  month: 90 * 86_400_000,
  "month-year": 2 * 365 * 86_400_000,
  year: 15 * 365 * 86_400_000,
};

export type ChartState = "ready" | "loading" | "empty" | "error";

const FAMILY_LABEL: Record<string, string> = {
  line: "Line chart",
  area: "Area chart",
  bar: "Bar chart",
  waterfall: "Waterfall chart",
  scatter: "Scatter plot",
  bubble: "Bubble chart",
  composed: "Composed chart",
  depth: "Depth chart",
  curve: "Curve chart",
};

/**
 * A chart always has an accessible name.
 *
 * An unlabelled `role="img"` is a serious accessibility defect, and "the canvas
 * right there" is not a name. When a caller supplies neither a label nor a
 * title, we describe the chart from its family and its visible series.
 */
function fallbackChartLabel(family: string, series: readonly SeriesSpec[]): string {
  const base = FAMILY_LABEL[family] ?? "Chart";
  const names = series
    .slice(0, 4)
    .map((item) => item.label ?? item.key)
    .filter(Boolean);
  return names.length ? `${base}: ${names.join(", ")}` : base;
}

export interface ChartStateCopy {
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  errorAction?: ReactNode;
}

export interface ChartSurfaceProps {
  option: Record<string, unknown>;
  xValues?: readonly number[];
  syncGroup?: string | null;
  state?: ChartState;
  /** Box height. Omit to fill the parent (`ChartPlot` supplies one). */
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  copy?: ChartStateCopy;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
  /** Drawing layer. Defaults to `canvas`; `svg` is for capture pipelines. */
  renderer?: ChartRenderer;
  /**
   * The span the engine currently shows, in ms (`null` before it is known).
   *
   * A time axis has to label the window the reader is looking at, not the whole
   * loaded history — the surface reports the applied window here so the caller
   * can re-choose the label granularity when it materially changes.
   */
  onVisibleSpan?: (spanMs: number | null) => void;
}

/**
 * The engine boundary.
 *
 * Nothing below this point knows about loading, empty or error — and, more
 * importantly, a chart in one of those states never initialises an engine at
 * all. That is why the states take precedence over the surface rather than
 * rendering on top of it.
 */
export function ChartSurface({
  option,
  xValues,
  syncGroup,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  copy,
  onReady,
  onEvent,
  eager,
  onVisibleSpan,
  renderer,
}: ChartSurfaceProps) {
  // A bounded plot for a real chart; a content-sized one for a state with
  // nothing to draw in it (see `ChartStateProps.compact`).
  const box = (node: ReactNode, compact = false) => (
    <div
      className={cn("relative w-full min-h-0", className)}
      style={compact ? undefined : { height: height ?? "100%" }}
    >
      {node}
    </div>
  );

  if (state === "loading") return box(<ChartSkeleton height="100%" />);
  if (state === "empty") {
    return box(
      <ChartEmptyState
        compact
        title={copy?.emptyTitle ?? "No data"}
        description={copy?.emptyDescription}
        action={copy?.emptyAction}
      />,
      true,
    );
  }
  if (state === "error") {
    return box(
      <ChartErrorState
        compact
        title={copy?.errorTitle ?? "Chart unavailable"}
        description={copy?.errorDescription}
        action={copy?.errorAction}
      />,
      true,
    );
  }

  return box(
    <EChartSurface
      option={option}
      xValues={xValues}
      syncGroup={syncGroup}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
      onVisibleSpan={onVisibleSpan}
      renderer={renderer}
    />,
  );
}

export interface ChartProps extends ChartStateCopy {
  spec: ChartSpec<object>;
  state?: ChartState;
  height?: number | string;
  className?: string;
  /** Restrict which series are drawn. Toggling this must not refetch data. */
  visibleSeries?: readonly string[];
  ariaLabel?: string;
  ariaDescription?: string;
  emptyWhenNoData?: boolean;
  /**
   * Create the engine on mount rather than when the plot approaches the
   * viewport. Set this in a capture pipeline — an off-screen chart never arms
   * on its own, and a deferred surface captures an empty box.
   */
  eager?: boolean;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

/**
 * Declarative chart. Given a `ChartSpec`, it normalises data, applies the series
 * selection, builds the engine option and renders the right state.
 */
export function Chart({
  spec,
  state = "ready",
  height,
  className,
  visibleSeries,
  ariaLabel,
  ariaDescription,
  emptyWhenNoData = true,
  eager,
  onReady,
  onEvent,
  ...copy
}: ChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, spec.animation, spec.pointCount);

  const normalized = useMemo(
    () => normalizeTabular(spec.data ?? [], spec.xKey, spec.x),
    [spec.data, spec.xKey, spec.x],
  );

  const xSpanMs = useMemo(() => {
    if (normalized.kind !== "time") return undefined;
    const range = extent(normalized.numericX);
    return range ? range[1] - range[0] : undefined;
  }, [normalized]);

  /*
   * The label bucket of the window actually on screen.
   *
   * `xSpanMs` is the loaded extent, which is the right answer for MAX and the
   * wrong answer for a two-year view of a fifteen-year series. The surface
   * reports what it shows; only a *bucket* change re-renders, so hovering,
   * panning within a bucket and resizing stay render-free.
   */
  const [visibleScale, setVisibleScale] = useState<TimeAxisLabelScale | null>(null);
  const handleVisibleSpan = useCallback((spanMs: number | null) => {
    const scale = spanMs && spanMs > 0 ? timeAxisLabelScale(spanMs) : null;
    setVisibleScale((previous) => (previous === scale ? previous : scale));
  }, []);
  const axisSpanMs = visibleScale ? AXIS_SPAN_BY_SCALE[visibleScale] : xSpanMs;

  const selectedSeries = useMemo<readonly SeriesSpec[]>(() => {
    if (!visibleSeries) return spec.series;
    return spec.series.filter((series) => visibleSeries.includes(series.key));
  }, [spec.series, visibleSeries]);

  const resolvedState: ChartState =
    state !== "ready"
      ? state
      : emptyWhenNoData && isSeriesEmpty(selectedSeries, normalized.rows)
        ? "empty"
        : "ready";

  const option = useMemo(() => {
    if (resolvedState !== "ready") return {};
    return buildChartOption({
      spec: { ...spec, series: selectedSeries },
      theme,
      motion,
      normalized,
      xSpanMs,
      xLabelSpanMs: axisSpanMs,
    });
  }, [resolvedState, spec, selectedSeries, theme, motion, normalized, xSpanMs, axisSpanMs]);

  return (
    <ChartSurface
      option={option}
      xValues={normalized.kind === "time" ? normalized.numericX : undefined}
      syncGroup={spec.syncGroup}
      state={resolvedState}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? spec.title ?? fallbackChartLabel(spec.family, selectedSeries)}
      ariaDescription={ariaDescription ?? spec.description}
      copy={copy}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
      onVisibleSpan={normalized.kind === "time" ? handleVisibleSpan : undefined}
      renderer={spec.renderer}
    />
  );
}

/** Standalone plot box for charts that compose their own chrome. */
export function ChartBox({
  height,
  className,
  children,
}: {
  height?: number | string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ChartPlot
      className={cn("overflow-hidden", className)}
      style={height ? { ["--chart-height" as string]: typeof height === "number" ? `${height}px` : height } : undefined}
    >
      <div className="relative h-full w-full min-h-0">{children}</div>
    </ChartPlot>
  );
}

/**
 * Local series-visibility state for chart toolbars. Presentation state stays in
 * the component that owns it; nothing here reaches a global store.
 */
export function useSeriesVisibility(series: readonly SeriesSpec[], initial?: readonly string[]) {
  const [visible, setVisible] = useState<string[]>(
    () => [...(initial ?? series.filter((item) => item.visibleByDefault !== false).map((item) => item.key))],
  );

  const toggle = useCallback((key: string) => {
    setVisible((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }, []);

  const setOnly = useCallback((keys: readonly string[]) => setVisible([...keys]), []);

  return { visible, toggle, setOnly, setVisible };
}

/** Local range state for a `ChartSpec.ranges` definition. */
export function useChartRange(spec: Pick<ChartSpec, "ranges">, initial?: string) {
  const [range, setRange] = useState(initial ?? spec.ranges?.default ?? "all");
  return { range, setRange, ranges: spec.ranges?.ranges ?? [] };
}
