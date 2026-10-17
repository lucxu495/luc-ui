"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { toneColor, withAlpha } from "../core/theme";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface RelationshipCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  description?: string;
}

export interface Observation {
  x: number;
  y: number;
  /** Optional point label (an asset, a cohort, a date). */
  label?: string;
}

/** A prepared regression line: two endpoints are enough to draw it. */
export interface RegressionLine {
  slope: number;
  intercept: number;
  /** Domain over which to draw. Defaults to the observation extent. */
  from?: number;
  to?: number;
  label?: string;
}

export interface RegressionBand {
  /** Confidence band upper/lower at each x of `xValues`. */
  xValues: readonly number[];
  lower: readonly number[];
  upper: readonly number[];
  label?: string;
}

export interface ScatterRegressionChartProps extends RelationshipCommonProps {
  points: readonly Observation[];
  /** Pre-computed fit. Luc UI never regresses — the analytics layer does. */
  regression?: RegressionLine;
  band?: RegressionBand;
  /** Draw x = 0 and y = 0 guides (default: true when the extent crosses zero). */
  zeroLines?: boolean;
  /** Highlight these points (outliers, a named cohort). */
  emphasis?: readonly string[];
  pointLabel?: string;
  regressionLabel?: string;
}

/**
 * ScatterRegressionChart — observations plus a prepared fit.
 *
 * The one rule that matters: the fit is **input**, not output. LUC UI may not
 * compute a regression (that is a research calculation, §40), so the caller
 * passes slope/intercept and, optionally, a confidence band it already has.
 *
 * Points are drawn small and translucent so overlap reads as density — the
 * shape of the cloud is the finding; a scatter of opaque dots is a smudge.
 */
export function ScatterRegressionChart({
  points,
  regression,
  band,
  zeroLines,
  emphasis,
  pointLabel = "Observations",
  regressionLabel = "Fit",
  xFormat,
  yFormat,
  xLabel,
  yLabel,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: ScatterRegressionChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "standard", points.length);
  const pointColor = seriesColor(theme, "primary");
  const fitColor = toneColor(theme, "warning", 0);

  const option = useMemo<Option>(() => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const xMin = Math.min(...xs, regression?.from ?? Number.POSITIVE_INFINITY);
    const xMax = Math.max(...xs, regression?.to ?? Number.NEGATIVE_INFINITY);
    const emphasised = new Set(emphasis ?? []);
    const crossesZero = (values: readonly number[]) =>
      values.some((value) => value <= 0) && values.some((value) => value >= 0);
    // Zero guides only when the data actually crosses zero — a line at the edge
    // of the plot is chrome, not information.
    const showZero = zeroLines ?? (crossesZero(xs) || crossesZero(ys));

    const series: Option[] = [
      {
        id: "observations",
        name: pointLabel,
        type: "scatter",
        symbolSize: 7,
        itemStyle: { color: withAlpha(pointColor, 0.55) },
        emphasis: { focus: "series", itemStyle: { color: pointColor, borderColor: theme.surface, borderWidth: 1 } },
        // A named point is drawn a step larger so an outlier is findable.
        data: points.map((point) => ({
          value: [point.x, point.y],
          ...(point.label ? { name: point.label } : {}),
          itemStyle: emphasised.has(point.label ?? "")
            ? { color: fitColor, borderColor: theme.surface, borderWidth: 1 }
            : undefined,
        })),
        ...(showZero
          ? {
              markLine: {
                silent: true,
                symbol: "none",
                animation: false,
                lineStyle: { color: theme.reference, width: 1, type: "dotted" },
                label: { show: false },
                data: [{ xAxis: 0 }, { yAxis: 0 }],
              },
            }
          : {}),
      },
    ];

    if (band && band.xValues.length > 0) {
      series.push({
        id: "regression-band",
        name: band.label ?? "Confidence band",
        type: "line",
        stack: "band",
        silent: true,
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        data: band.xValues.map((x, index) => [x, band.lower[index] ?? null]),
      });
      series.push({
        id: "regression-band-fill",
        type: "line",
        stack: "band",
        silent: true,
        symbol: "none",
        lineStyle: { opacity: 0 },
        areaStyle: { color: withAlpha(fitColor, theme.mode === "dark" ? 0.16 : 0.12) },
        data: band.xValues.map((x, index) => {
          const low = band.lower[index];
          const high = band.upper[index];
          return [x, low === undefined || high === undefined ? null : Math.max(0, high - low)];
        }),
      });
    }

    if (regression) {
      const from = regression.from ?? xMin;
      const to = regression.to ?? xMax;
      series.push({
        id: "regression",
        name: regressionLabel,
        type: "line",
        symbol: "none",
        lineStyle: { color: fitColor, width: 2, type: "dashed" },
        data: [
          [from, regression.slope * from + regression.intercept],
          [to, regression.slope * to + regression.intercept],
        ],
      });
    }

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 16, bottom: 6 }),
      xAxis: axisFragment({ theme, type: "value", format: xFormat, name: xLabel, scale: true }),
      yAxis: axisFragment({ theme, type: "value", position: "right", format: yFormat, name: yLabel, scale: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const entry = (Array.isArray(params) ? params[0] : params) as
            | { name?: string; value?: [number, number]; seriesId?: string }
            | undefined;
          if (!entry?.value || entry.seriesId !== "observations") return "";
          const [x, y] = entry.value;
          return tooltipShellHtml(
            entry.name ?? undefined,
            tooltipGridHtml([
              [xLabel ?? "x", formatChartValue(x, xFormat)],
              [yLabel ?? "y", formatChartValue(y, yFormat)],
            ]),
          );
        },
      }),
      series,
    };
  }, [
    band,
    emphasis,
    fitColor,
    motion,
    pointColor,
    pointLabel,
    points,
    regression,
    regressionLabel,
    theme,
    xFormat,
    xLabel,
    yFormat,
    yLabel,
    zeroLines,
  ]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Scatter with regression"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

export interface QuadrantLabels {
  topRight?: string;
  topLeft?: string;
  bottomRight?: string;
  bottomLeft?: string;
}

export interface QuadrantScatterChartProps extends RelationshipCommonProps {
  points: readonly Observation[];
  /** Vertical and horizontal split values (e.g. 0, a mean, a target). */
  xReference: number;
  yReference: number;
  quadrantLabels?: QuadrantLabels;
  /** Optional per-point tone override; defaults to a stable categorical colour. */
  pointTone?: SeriesTone;
  pointLabel?: string;
}

/**
 * QuadrantScatterChart — a scatter split into four named regions.
 *
 * The reference lines and their labels are the chart: without them this is just
 * a scatter. Labels are positioned in the corner of each quadrant rather than on
 * the axis, so the reading ("above the benchmark *and* below zero") is stated
 * where the reader is looking.
 */
export function QuadrantScatterChart({
  points,
  xReference,
  yReference,
  quadrantLabels,
  pointTone,
  pointLabel = "Observations",
  xFormat,
  yFormat,
  xLabel,
  yLabel,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: QuadrantScatterChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "standard", points.length);
  const color = toneColor(theme, pointTone ?? "accent", 0);

  const option = useMemo<Option>(() => {
    const labels: Array<{ name: string; xAxis: number; yAxis: number }> = [];
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const xMin = Math.min(xReference, ...xs);
    const xMax = Math.max(xReference, ...xs);
    const yMin = Math.min(yReference, ...ys);
    const yMax = Math.max(yReference, ...ys);
    const insetX = (xMax - xMin) * 0.06;
    const insetY = (yMax - yMin) * 0.08;
    if (quadrantLabels?.topRight) labels.push({ name: quadrantLabels.topRight, xAxis: xMax - insetX, yAxis: yMax - insetY });
    if (quadrantLabels?.topLeft) labels.push({ name: quadrantLabels.topLeft, xAxis: xMin + insetX, yAxis: yMax - insetY });
    if (quadrantLabels?.bottomRight) labels.push({ name: quadrantLabels.bottomRight, xAxis: xMax - insetX, yAxis: yMin + insetY });
    if (quadrantLabels?.bottomLeft) labels.push({ name: quadrantLabels.bottomLeft, xAxis: xMin + insetX, yAxis: yMin + insetY });

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 16, bottom: 6 }),
      xAxis: axisFragment({ theme, type: "value", format: xFormat, name: xLabel, scale: true }),
      yAxis: axisFragment({ theme, type: "value", position: "right", format: yFormat, name: yLabel, scale: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const entry = (Array.isArray(params) ? params[0] : params) as
            | { name?: string; value?: [number, number] }
            | undefined;
          if (!entry?.value) return "";
          return tooltipShellHtml(
            entry.name ?? undefined,
            tooltipGridHtml([
              [xLabel ?? "x", formatChartValue(entry.value[0], xFormat)],
              [yLabel ?? "y", formatChartValue(entry.value[1], yFormat)],
            ]),
          );
        },
      }),
      series: [
        {
          id: "quadrant",
          name: pointLabel,
          type: "scatter",
          symbolSize: 9,
          itemStyle: { color: withAlpha(color, 0.6) },
          emphasis: { itemStyle: { color, borderColor: theme.surface, borderWidth: 1 } },
          data: points.map((point) => ({ value: [point.x, point.y], ...(point.label ? { name: point.label } : {}) })),
          markLine: {
            silent: true,
            symbol: "none",
            animation: false,
            lineStyle: { color: theme.reference, width: 1, type: "dashed" },
            label: { show: false },
            data: [{ xAxis: xReference }, { yAxis: yReference }],
          },
        },
        // Quadrant names are drawn as invisible anchor points at each corner: a
        // label is easier to place and to keep legible than a zero-size area.
        ...(labels.length
          ? [
              {
                id: "quadrant-labels",
                type: "scatter",
                silent: true,
                symbolSize: 0,
                label: {
                  show: true,
                  formatter: "{b}",
                  color: theme.textMuted,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontMicro,
                },
                data: labels.map((entry) => ({ value: [entry.xAxis, entry.yAxis], name: entry.name })),
              } as Option,
            ]
          : []),
      ],
    };
  }, [color, motion, pointLabel, points, quadrantLabels, theme, xFormat, xLabel, xReference, yFormat, yLabel, yReference]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Quadrant scatter"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
