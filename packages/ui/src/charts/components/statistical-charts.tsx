"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import {
  formatRatioOrValue,
  ratioOrFormatAxis,
  type FamilyCommonProps,
  type XYPoint,
} from "./chart-common";

/**
 * Statistical charts — distributions, agreement and uncertainty.
 *
 * One rule governs every component in this file: **the library renders, it does
 * not estimate.** None of these charts bins, smooths, simulates or fits
 * anything. `EcdfChart` receives the cumulative values, `QqPlotChart` receives
 * the quantiles, `ViolinChart` receives the densities, `ResidualChart` receives
 * the residuals. A caller that wants a fit or a kernel computes it where the
 * data lives and passes it in — which keeps the numbers in a chart answerable to
 * one place, and keeps LUC out of the business of silently inventing statistics.
 */

/* -------------------------------------------------------------------------- */
/* ECDF                                                                        */
/* -------------------------------------------------------------------------- */

export interface EcdfSeries {
  key: string;
  label: string;
  /** Cumulative probability per order statistic, ascending in `x`. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
}

export interface EcdfChartProps extends FamilyCommonProps {
  series: readonly EcdfSeries[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Empirical cumulative distribution.
 *
 * Drawn as a step (`smooth: false` + explicit duplicate points) because a CDF is
 * a step function: interpolating between two order statistics invents mass that
 * the sample does not have.
 */
export function EcdfChart({
  series,
  xFormat,
  yFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: EcdfChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { value?: [number, number] } | undefined;
          if (!first?.value) return "";
          const rows = list
            .map((entry) => {
              const item = entry as { seriesName?: string; value?: [number, number]; color?: string };
              return [item.seriesName ?? "", formatRatioOrValue(item.value?.[1], yFormat), item.color ?? ""] as const;
            })
            .map(([label, value, color]) => tooltipRowHtml(label, value, color));
          return tooltipShellHtml(formatChartValue(first.value[0], xFormat), `<div>${rows.join("")}</div>`);
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format: xFormat }),
      yAxis: ratioOrFormatAxis(yFormat, { type: "value", theme, min: 0, max: 1 }),
      series: series.map((entry, index) => ({
        name: entry.label,
        type: "line",
        step: "end",
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.8, color: seriesColor(theme, entry.key, index) },
        itemStyle: { color: seriesColor(theme, entry.key, index) },
        data: entry.points.map((point) => [point.x, point.y]),
        emphasis: { focus: "series" },
      })),
    };
  }, [motion, series, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={series.every((entry) => entry.points.length === 0) ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Empirical cumulative distribution"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No cumulative values were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Q–Q plot                                                                    */
/* -------------------------------------------------------------------------- */

export interface QqPlotChartProps extends FamilyCommonProps {
  /** Theoretical quantile against the sample quantile, paired. */
  points: readonly XYPoint[];
  labels?: { x?: string; y?: string };
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Quantile–quantile plot.
 *
 * The 45° reference line is the whole point: a sample drawn from the reference
 * distribution lies on it. The line is derived from the *data extent* (it is a
 * drawing aid, not a fitted regression) unless the caller passes explicit
 * points, which is why the component never claims to have fitted anything.
 */
export function QqPlotChart({
  points,
  labels,
  xFormat,
  yFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: QqPlotChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const extent = points.reduce(
      (acc, point) => ({
        min: Math.min(acc.min, point.x, point.y),
        max: Math.max(acc.max, point.x, point.y),
      }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );
    const lo = Number.isFinite(extent.min) ? extent.min : 0;
    const hi = Number.isFinite(extent.max) ? extent.max : 1;
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number] };
          if (!item.value) return "";
          return tooltipShellHtml(
            "Quantile",
            tooltipGridHtml([
              [labels?.x ?? "Theoretical", formatChartValue(item.value[0], xFormat)],
              [labels?.y ?? "Sample", formatChartValue(item.value[1], yFormat)],
            ]),
          );
        },
      }),
      xAxis: { ...axisFragment({ type: "value", theme, format: xFormat }), name: undefined },
      yAxis: { ...axisFragment({ type: "value", theme, format: yFormat }), name: undefined },
      series: [
        {
          name: "Quantiles",
          type: "scatter",
          symbolSize: 7,
          data: points.map((point) => [point.x, point.y]),
          itemStyle: { color: theme.accent, opacity: 0.85 },
        },
        {
          name: "45°",
          type: "line",
          showSymbol: false,
          silent: true,
          lineStyle: { color: theme.reference, width: 1, type: "dashed" },
          data: [
            [lo, lo],
            [hi, hi],
          ],
        },
      ],
    };
  }, [labels?.x, labels?.y, motion, points, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Quantile-quantile plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No quantile pairs were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Violin                                                                      */
/* -------------------------------------------------------------------------- */

export interface ViolinDensity {
  /** Position on the value axis. */
  value: number;
  /** Density at that position, in any consistent unit. */
  density: number;
}

export interface ViolinGroup {
  label: string;
  /** The distribution outline. Density is a supplied estimate, never fitted here. */
  bins: readonly ViolinDensity[];
  tone?: SeriesTone;
  /** Optional marker: a median or a mean the caller has already computed. */
  marker?: { value: number; label?: string };
}

export interface ViolinChartProps extends FamilyCommonProps {
  groups: readonly ViolinGroup[];
  valueFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Violin plot — a distribution per category.
 *
 * Drawn from a pre-computed density outline (the caller's KDE, histogram or
 * bootstrap), mirrored around the category axis. LUC does not fit the kernel:
 * the bandwidth is a modelling decision, and a chart library that picks one
 * silently is a chart library that lies quietly.
 */
export function ViolinChart({
  groups,
  valueFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: ViolinChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const maxDensity = groups.reduce(
      (max, group) => Math.max(max, ...group.bins.map((bin) => bin.density), 0),
      0,
    );
    const halfWidth = 0.42;
    const shapes = groups.map((group, index) => {
      const scale = maxDensity > 0 ? halfWidth / maxDensity : 0;
      const outline = group.bins.map((bin) => [bin.density * scale, bin.value] as [number, number]);
      const mirrored = [...outline].reverse().map(([width, value]) => [-width, value] as [number, number]);
      const color = seriesColor(theme, group.label, index);
      return {
        name: group.label,
        type: "custom",
        clip: false,
        silent: false,
        z: 2,
        data: [[index, 0]],
        renderItem: (_params: unknown, api: unknown) => {
          const helpers = api as {
            coord: (value: [number, number]) => [number, number];
            value: (index: number) => number;
            style: (extra?: Record<string, unknown>) => Record<string, unknown>;
          };
          const category = helpers.value(0);
          const points = [...outline, ...mirrored].map(([width, value]) =>
            helpers.coord([category + width, value]),
          );
          if (points.length < 3) return null;
          return {
            type: "polygon",
            shape: { points },
            style: { ...helpers.style(), fill: color, opacity: 0.36, stroke: color, lineWidth: 1.2 },
          };
        },
      };
    });

    const markers = groups
      .map((group, index) =>
        group.marker
          ? {
              name: `${group.label} ${group.marker.label ?? "marker"}`,
              type: "scatter",
              symbolSize: 9,
              z: 3,
              data: [[index, group.marker.value]],
              itemStyle: { color: theme.textPrimary, borderColor: theme.surface, borderWidth: 1.5 },
            }
          : null,
      )
      .filter(Boolean);

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: [number, number] };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.seriesName,
            tooltipGridHtml([["Value", formatChartValue(item.value[1], valueFormat)]]),
          );
        },
      }),
      xAxis: {
        type: "category",
        data: groups.map((group) => group.label),
        boundaryGap: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
        splitLine: { show: false },
      },
      yAxis: axisFragment({ type: "value", theme, format: valueFormat }),
      series: [...shapes, ...markers],
    };
  }, [groups, motion, theme, valueFormat]);

  return (
    <ChartSurface
      option={option}
      state={groups.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Violin plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No density outlines were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* ROC / calibration                                                           */
/* -------------------------------------------------------------------------- */

export interface RocCurve {
  label: string;
  /** Area under the curve. Supplied by the caller — never integrated here. */
  auc?: number;
  /** False-positive rate and true-positive rate pairs, ascending in `x`. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
}

export interface RocCurveChartProps extends FamilyCommonProps {
  curves: readonly RocCurve[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/** Receiver operating characteristic — one line per model, with the chance diagonal. */
export function RocCurveChart({
  curves,
  xFormat,
  yFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: RocCurveChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { value?: [number, number] } | undefined;
          if (!first?.value) return "";
          const rows = list.map((entry) => {
            const item = entry as { seriesName?: string; value?: [number, number]; color?: string };
            return tooltipRowHtml(item.seriesName ?? "", formatRatioOrValue(item.value?.[1], yFormat), item.color);
          });
          return tooltipShellHtml(formatChartValue(first.value[0], xFormat), `<div>${rows.join("")}</div>`);
        },
      }),
      xAxis: ratioOrFormatAxis(xFormat, { type: "value", theme, min: 0, max: 1 }),
      yAxis: ratioOrFormatAxis(yFormat, { type: "value", theme, min: 0, max: 1 }),
      series: [
        {
          name: "Chance",
          type: "line",
          showSymbol: false,
          silent: true,
          lineStyle: { color: theme.reference, width: 1, type: "dashed" },
          data: [
            [0, 0],
            [1, 1],
          ],
        },
        ...curves.map((curve, index) => ({
          name: curve.auc === undefined ? curve.label : `${curve.label} · AUC ${curve.auc.toFixed(3)}`,
          type: "line",
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.8, color: seriesColor(theme, curve.label, index) },
          itemStyle: { color: seriesColor(theme, curve.label, index) },
          data: curve.points.map((point) => [point.x, point.y]),
        })),
      ],
    };
  }, [curves, motion, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={curves.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "ROC curves"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No ROC points were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface CalibrationBin {
  /** Mean predicted probability in the bin. */
  predicted: number;
  /** Observed frequency in the same bin. */
  observed: number;
  /** Bin size. Drawn as the bubble area, so a sparse bin cannot masquerade. */
  count?: number;
}

export interface CalibrationChartProps extends FamilyCommonProps {
  bins: readonly CalibrationBin[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/** Reliability diagram — observed frequency against predicted probability. */
export function CalibrationChart({
  bins,
  xFormat,
  yFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: CalibrationChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const counts = bins.map((bin) => bin.count ?? 1);
    const maxCount = Math.max(1, ...counts);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number]; dataIndex?: number };
          if (!item.value) return "";
          const bin = bins[item.dataIndex ?? 0];
          return tooltipShellHtml(
            "Bin",
            tooltipGridHtml([
              ["Predicted", formatRatioOrValue(bin?.predicted, xFormat)],
              ["Observed", formatRatioOrValue(bin?.observed, yFormat)],
              ...(bin?.count !== undefined ? [["Count", formatChartValue(bin.count, { kind: "integer" })] as const] : []),
            ]),
          );
        },
      }),
      xAxis: ratioOrFormatAxis(xFormat, { type: "value", theme, min: 0, max: 1 }),
      yAxis: ratioOrFormatAxis(yFormat, { type: "value", theme, min: 0, max: 1 }),
      series: [
        {
          name: "Perfect",
          type: "line",
          showSymbol: false,
          silent: true,
          lineStyle: { color: theme.reference, width: 1, type: "dashed" },
          data: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          name: "Observed",
          type: "line",
          showSymbol: true,
          symbolSize: (value: unknown) => {
            const point = value as [number, number];
            const index = bins.findIndex((bin) => bin.predicted === point[0]);
            const count = counts[index] ?? 1;
            return 8 + 16 * Math.sqrt(count / maxCount);
          },
          lineStyle: { width: 1.6, color: theme.accent },
          itemStyle: { color: theme.accent, opacity: 0.85 },
          data: bins.map((bin) => [bin.predicted, bin.observed]),
        },
      ],
    };
  }, [bins, motion, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={bins.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Calibration curve"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No calibration bins were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Confusion matrix                                                            */
/* -------------------------------------------------------------------------- */

export interface ConfusionMatrixChartProps extends FamilyCommonProps {
  /** Row and column labels, in the same order. */
  labels: readonly string[];
  /** `matrix[actual][predicted]`. */
  matrix: readonly (readonly number[])[];
  /** Divide each row by its total, so classes of different size are comparable. */
  normalized?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Confusion matrix — a heatmap with matrix semantics.
 *
 * The difference from `HeatmapChart` is the contract: this one knows its axes
 * are the same set of classes and that a cell is a count, so it can offer row
 * normalisation (the only way a 900-sample class and a 40-sample class are
 * comparable) and format a cell as a count or a rate without the caller wiring a
 * visual map.
 */
export function ConfusionMatrixChart({
  labels,
  matrix,
  normalized = false,
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: ConfusionMatrixChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);
  const resolvedFormat = useMemo<ChartFormat>(
    () => format ?? { kind: "integer" },
    [format],
  );

  const option = useMemo<Option>(() => {
    const rows = matrix.map((row, rowIndex) => {
      const total = row.reduce((sum, cell) => sum + cell, 0);
      return row.map((cell, columnIndex) => [
        columnIndex,
        rowIndex,
        normalized && total > 0 ? cell / total : cell,
      ]);
    });
    const flat = rows.flat() as [number, number, number][];
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ left: 8, right: 12, top: 12, bottom: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number, number] };
          if (!item.value) return "";
          const [column, row] = item.value;
          return tooltipShellHtml(
            `${labels[row] ?? row} → ${labels[column] ?? column}`,
            tooltipGridHtml([
              ["Actual", labels[row] ?? String(row)],
              ["Predicted", labels[column] ?? String(column)],
              ["Value", formatChartValue(item.value[2], resolvedFormat)],
            ]),
          );
        },
      }),
      xAxis: {
        type: "category",
        data: [...labels],
        name: undefined,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitArea: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      yAxis: {
        type: "category",
        data: [...labels],
        boundaryGap: true,
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitArea: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      visualMap: {
        show: false,
        min: Math.min(0, ...flat.map((entry) => entry[2])),
        max: Math.max(1, ...flat.map((entry) => entry[2])),
        inRange: { color: [...theme.sequentialAnchors] },
      },
      series: [
        {
          name: "Confusion",
          type: "heatmap",
          data: flat,
          label: {
            show: true,
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontCaption,
            formatter: (params: unknown) => formatChartValue((params as { value: number[] }).value[2], resolvedFormat),
          },
          itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: theme.accent, borderWidth: 2 } },
        },
      ],
    };
  }, [labels, matrix, motion, normalized, resolvedFormat, theme]);

  return (
    <ChartSurface
      option={option}
      state={labels.length === 0 || matrix.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Confusion matrix"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "This matrix has no classes." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Error bars / residuals                                                      */
/* -------------------------------------------------------------------------- */

export interface ErrorBarPoint {
  label: string;
  /** Point estimate. */
  value: number;
  /** Lower bound of the supplied interval. */
  lower: number;
  /** Upper bound of the supplied interval. */
  upper: number;
  tone?: SeriesTone;
}

export interface ErrorBarChartProps extends FamilyCommonProps {
  points: readonly ErrorBarPoint[];
  /** Name of the interval, e.g. "95% CI" or "±1 s.e.". */
  intervalLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Point estimates with a supplied interval.
 *
 * The interval is *given*, never derived: the component draws exactly the
 * `lower`/`upper` it receives, so it cannot disagree with the statistics it is
 * illustrating.
 */
export function ErrorBarChart({
  points,
  intervalLabel = "Interval",
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: ErrorBarChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; value?: number[] };
          const point = points[item.dataIndex ?? 0];
          if (!point) return "";
          return tooltipShellHtml(
            point.label,
            tooltipGridHtml([
              ["Estimate", formatChartValue(point.value, format)],
              [intervalLabel, `${formatChartValue(point.lower, format)} – ${formatChartValue(point.upper, format)}`],
            ]),
          );
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format }),
      yAxis: {
        type: "category",
        data: points.map((point) => point.label),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        {
          name: intervalLabel,
          type: "custom",
          z: 1,
          data: points.map((point, index) => [index, point.lower, point.upper, point.value]),
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              value: (index: number) => number;
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const index = p.dataIndex;
            const lower = helpers.value(1);
            const upper = helpers.value(2);
            const [x1, y] = helpers.coord([lower, index]);
            const [x2] = helpers.coord([upper, index]);
            const cap = 4;
            return {
              type: "group",
              children: [
                {
                  type: "line",
                  shape: { x1, y1: y, x2, y2: y },
                  style: { ...helpers.style(), stroke: theme.textMuted, lineWidth: 1.5 },
                },
                {
                  type: "line",
                  shape: { x1, y1: y - cap, x2: x1, y2: y + cap },
                  style: { ...helpers.style(), stroke: theme.textMuted, lineWidth: 1.5 },
                },
                {
                  type: "line",
                  shape: { x1: x2, y1: y - cap, x2, y2: y + cap },
                  style: { ...helpers.style(), stroke: theme.textMuted, lineWidth: 1.5 },
                },
              ],
            };
          },
        },
        {
          name: "Estimate",
          type: "scatter",
          z: 3,
          symbolSize: 9,
          data: points.map((point, index) => [point.value, index]),
          itemStyle: { color: theme.accent, borderColor: theme.surface, borderWidth: 1.5 },
        },
      ],
    };
  }, [format, intervalLabel, motion, points, theme]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Point estimates with intervals"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No estimates were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface ResidualPoint {
  /** Fitted value on the model's scale. */
  fitted: number;
  /** Residual (observed − fitted), supplied. */
  residual: number;
}

export interface ResidualChartProps extends FamilyCommonProps {
  points: readonly ResidualPoint[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/** Residuals against fitted values, with the zero line a well-behaved model sits around. */
export function ResidualChart({
  points,
  xFormat,
  yFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: ResidualChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number] };
          if (!item.value) return "";
          return tooltipShellHtml(
            "Residual",
            tooltipGridHtml([
              ["Fitted", formatChartValue(item.value[0], xFormat)],
              ["Residual", formatChartValue(item.value[1], yFormat)],
            ]),
          );
        },
      }),
      xAxis: { ...axisFragment({ type: "value", theme, format: xFormat }), name: undefined },
      yAxis: { ...axisFragment({ type: "value", theme, format: yFormat }), name: undefined },
      series: [
        {
          name: "Residuals",
          type: "scatter",
          symbolSize: 6,
          data: points.map((point) => [point.fitted, point.residual]),
          itemStyle: { color: theme.accent, opacity: 0.8 },
        },
        {
          name: "Zero",
          type: "line",
          showSymbol: false,
          silent: true,
          lineStyle: { color: theme.reference, width: 1, type: "dashed" },
          data: [
            [Number.NEGATIVE_INFINITY, 0],
            [Number.POSITIVE_INFINITY, 0],
          ],
        },
      ],
    };
  }, [motion, points, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Residual plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No residuals were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
