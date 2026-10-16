"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import { formatRatioOrValue, ratioOrFormatAxis, type FamilyCommonProps, type XYPoint } from "./chart-common";

/**
 * Diagnostic charts — the figures that answer "is this model or process sane?".
 *
 * Same rule as every other family in `@luc/ui/charts`: **the library renders,
 * it does not estimate.** `AutocorrelationChart` receives lag correlations
 * *and* the significance band, `SurvivalCurveChart` receives the survival
 * estimates, `PrecisionRecallChart` receives the precision/recall pairs,
 * `FeatureImportanceChart` receives the importances and their intervals.
 * Nothing here runs a regression, a fit, a resample or a correction — a caller
 * that wants Newey–West bands or a bootstrap computes them where the data
 * lives, and the chart cannot quietly disagree with the numbers in the report.
 */

/* -------------------------------------------------------------------------- */
/* Autocorrelation / partial autocorrelation                                    */
/* -------------------------------------------------------------------------- */

export interface AutocorrelationSeries {
  key: string;
  label: string;
  /** What the series *is*: an ACF, a PACF or a cross-correlation. */
  kind?: "acf" | "pacf" | "ccf";
  points: readonly XYPoint[];
  tone?: SeriesTone;
}

export interface AutocorrelationChartProps extends FamilyCommonProps {
  series: readonly AutocorrelationSeries[];
  /**
   * Half-width of the significance band, **supplied by the caller** — the usual
   * value is `z / sqrt(n)` with the caller's own `z` and sample size. Omit to
   * draw no band, which is the honest option when the caller has no basis for
   * one.
   */
  band?: number;
  /** Label used for the band in the tooltip and the legend, e.g. "±1.96/√n". */
  bandLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

export function AutocorrelationChart({
  series,
  band,
  bandLabel = "Significance band",
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
}: AutocorrelationChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const lags = useMemo(
    () => [...new Set(series.flatMap((entry) => entry.points.map((point) => point.x)))].sort((a, b) => a - b),
    [series],
  );

  const option = useMemo<Option>(() => {
    const stems = series.map((entry, index) => ({
      name: entry.label,
      type: "custom",
      z: 3,
      data: entry.points.map((point) => [lags.indexOf(point.x), point.y, index]),
      renderItem: (params: unknown, api: unknown) => {
        const p = params as { dataIndex: number };
        const helpers = api as {
          coord: (value: [number, number]) => [number, number];
          value: (index: number) => number;
          style: (extra?: Record<string, unknown>) => Record<string, unknown>;
        };
        const value = helpers.value(1);
        const offset = (index - (series.length - 1) / 2) * 7;
        const [x, y] = helpers.coord([p.dataIndex, value]);
        const [, baseY] = helpers.coord([p.dataIndex, 0]);
        const color = seriesColor(theme, entry.key, index);
        return {
          type: "group",
          children: [
            {
              type: "line",
              shape: { x1: x + offset, y1: baseY, x2: x + offset, y2: y },
              style: { ...helpers.style(), stroke: color, lineWidth: 1.6 },
            },
            {
              type: "circle",
              shape: { cx: x + offset, cy: y, r: 3.2 },
              style: { ...helpers.style(), fill: color, stroke: theme.surface, lineWidth: 1 },
            },
          ],
        };
      },
    }));

    const lastLagIndex = Math.max(lags.length - 1, 0);
    const bandSeries =
      band === undefined
        ? []
        : [
            {
              name: bandLabel,
              type: "custom",
              z: 1,
              silent: true,
              tooltip: { show: false },
              /*
               * One item, one rect: the band spans the whole lag axis, and it is
               * drawn in *pixel* space off `api.coord` — the mistake that made
               * three Phase 4 charts render blank was trusting data units here.
               */
              data: [[0, -band, band]],
              renderItem: (_params: unknown, api: unknown) => {
                const helpers = api as {
                  coord: (value: [number, number]) => [number, number];
                  value: (index: number) => number;
                  style: (extra?: Record<string, unknown>) => Record<string, unknown>;
                };
                const [left, yUpper] = helpers.coord([0, helpers.value(2)]);
                const [right, yLower] = helpers.coord([lastLagIndex, helpers.value(1)]);
                const pad = lags.length > 1 ? Math.abs(right - left) / (lags.length * 2) : 12;
                return {
                  type: "rect",
                  shape: { x: left - pad, y: yUpper, width: right - left + pad * 2, height: yLower - yUpper },
                  style: { ...helpers.style(), fill: theme.band, stroke: "none" },
                };
              },
            },
          ];

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { dataIndex?: number } | undefined;
          const lag = lags[first?.dataIndex ?? 0];
          const rows = series
            .map((entry) => {
              const point = entry.points.find((candidate) => candidate.x === lag);
              if (!point) return null;
              return tooltipGridHtml([["Lag", formatChartValue(lag, undefined)], [entry.label, formatChartValue(point.y, format)]]);
            })
            .filter((row): row is string => row !== null);
          return tooltipShellHtml(`Lag ${formatChartValue(lag, undefined)}`, rows.join(""));
        },
      }),
      xAxis: {
        type: "category",
        data: lags.map((lag) => formatChartValue(lag, undefined)),
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      yAxis: axisFragment({ type: "value", theme, format, min: -1, max: 1, scale: true }),
      series: [...bandSeries, ...stems],
    };
  }, [band, bandLabel, format, lags, motion, series, theme]);

  const empty = series.every((entry) => entry.points.length === 0);

  return (
    <ChartSurface
      option={option}
      state={empty ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Autocorrelation"}
      ariaDescription={
        ariaDescription ??
        description ??
        (band === undefined ? "Lag correlations without a significance band." : `${bandLabel} shown as a shaded band.`)
      }
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No lag correlations were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Survival curve                                                              */
/* -------------------------------------------------------------------------- */

export interface SurvivalSeries {
  key: string;
  label: string;
  /** Supplied survival estimates: `x` is time, `y` is the survival share (0–1). */
  points: readonly XYPoint[];
  /** Supplied censoring marks, drawn as ticks on the step. */
  censored?: readonly XYPoint[];
  tone?: SeriesTone;
}

export interface SurvivalCurveChartProps extends FamilyCommonProps {
  series: readonly SurvivalSeries[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * A Kaplan–Meier style step curve.
 *
 * The step matters: survival is constant between events and drops at an event,
 * so interpolating between two estimates would invent a risk that the sample
 * does not have. Censoring marks are supplied points, never inferred from the
 * data.
 */
export function SurvivalCurveChart({
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
}: SurvivalCurveChartProps) {
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
          const point = (list[0] as { value?: [number, number] } | undefined)?.value;
          if (!point) return "";
          const rows = list
            .map((entry) => {
              const item = entry as { seriesName?: string; value?: [number, number]; color?: string };
              if (!item.value) return "";
              return tooltipGridHtml([[item.seriesName ?? "", formatChartValue(item.value[1], yFormat)]]);
            })
            .join("");
          return tooltipShellHtml(formatChartValue(point[0], xFormat), rows);
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format: xFormat, min: 0 }),
      yAxis: ratioOrFormatAxis(yFormat, { type: "value", theme, min: 0, max: 1 }),
      series: [
        ...series.map((entry, index) => ({
          name: entry.label,
          type: "line" as const,
          step: "end" as const,
          showSymbol: false,
          lineStyle: { width: 1.9, color: seriesColor(theme, entry.key, index) },
          itemStyle: { color: seriesColor(theme, entry.key, index) },
          data: entry.points.map((point) => [point.x, point.y]),
          emphasis: { focus: "series" as const },
        })),
        ...series
          .filter((entry) => (entry.censored?.length ?? 0) > 0)
          .map((entry, index) => ({
            name: `${entry.label} (censored)`,
            type: "scatter" as const,
            symbol: "rect" as const,
            symbolSize: [1.6, 9],
            silent: true,
            tooltip: { show: false },
            itemStyle: { color: seriesColor(theme, entry.key, series.indexOf(entry) + index) },
            data: (entry.censored ?? []).map((point) => [point.x, point.y]),
          })),
      ],
    };
  }, [motion, series, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={series.every((entry) => entry.points.length === 0) ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Survival curve"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No survival estimates were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Precision–recall                                                            */
/* -------------------------------------------------------------------------- */

export interface PrecisionRecallCurve {
  key: string;
  label: string;
  /** One entry per threshold: recall on `x`, precision on `y`, both 0–1. */
  points: readonly XYPoint[];
  tone?: SeriesTone;
  /** Summary values the caller computed — printed in the tooltip, never derived here. */
  averagePrecision?: number;
}

export interface PrecisionRecallChartProps extends FamilyCommonProps {
  curves: readonly PrecisionRecallCurve[];
  /** Prevalence of the positive class, drawn as a dashed no-skill line. Supplied. */
  baseline?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

export function PrecisionRecallChart({
  curves,
  baseline,
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
}: PrecisionRecallChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: [number, number]; seriesIndex?: number };
          if (!item.value) return "";
          const curve = curves[item.seriesIndex ?? 0];
          const rows = [
            tooltipGridHtml([
              ["Recall", formatRatioOrValue(item.value[0], xFormat)],
              ["Precision", formatRatioOrValue(item.value[1], yFormat)],
            ]),
          ];
          if (curve?.averagePrecision !== undefined) {
            rows.push(tooltipGridHtml([["Average precision", formatRatioOrValue(curve.averagePrecision, yFormat)]]));
          }
          return tooltipShellHtml(item.seriesName ?? "Curve", rows.join(""));
        },
      }),
      xAxis: ratioOrFormatAxis(xFormat, { type: "value", theme, min: 0, max: 1 }),
      yAxis: ratioOrFormatAxis(yFormat, { type: "value", theme, min: 0, max: 1, position: "right" }),
      series: [
        ...curves.map((curve, index) => ({
          name: curve.label,
          type: "line" as const,
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.9, color: seriesColor(theme, curve.key, index) },
          itemStyle: { color: seriesColor(theme, curve.key, index) },
          data: curve.points.map((point) => [point.x, point.y]),
          emphasis: { focus: "series" as const },
        })),
        ...(baseline === undefined
          ? []
          : [
              {
                name: "No-skill",
                type: "line" as const,
                showSymbol: false,
                silent: true,
                tooltip: { show: false },
                lineStyle: { width: 1.4, type: "dashed" as const, color: theme.textMuted },
                data: [
                  [0, baseline],
                  [1, baseline],
                ],
              },
            ]),
      ],
    };
  }, [baseline, curves, motion, theme, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={curves.every((curve) => curve.points.length === 0) ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Precision–recall curve"}
      ariaDescription={
        ariaDescription ??
        description ??
        (baseline === undefined ? undefined : "A dashed line marks the no-skill prevalence.")
      }
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No precision/recall pairs were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Feature importance                                                          */
/* -------------------------------------------------------------------------- */

export interface FeatureImportance {
  key: string;
  label: string;
  value: number;
  /** Supplied interval bounds — omit when the caller has no uncertainty to show. */
  low?: number;
  high?: number;
}

export interface FeatureImportanceChartProps extends FamilyCommonProps {
  features: readonly FeatureImportance[];
  format?: ChartFormat;
  /** Name of the interval, e.g. "±1 s.e." or "90% CI". */
  intervalLabel?: string;
  /** Draw positive values in the positive tone and negative in the negative tone. */
  signed?: boolean;
  title?: string;
  description?: string;
}

/**
 * Horizontal importances, ranked, with the caller's own interval drawn over
 * each bar. `signed` colours by direction (a coefficient) instead of magnitude
 * (a tree importance) — the two mean different things and must not share one
 * colour rule.
 */
export function FeatureImportanceChart({
  features,
  format,
  intervalLabel = "Interval",
  signed = false,
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
}: FeatureImportanceChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const hasInterval = features.some((feature) => feature.low !== undefined && feature.high !== undefined);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 24 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const feature = features[item.dataIndex ?? 0];
          if (!feature) return "";
          const rows: [string, string][] = [["Importance", formatChartValue(feature.value, format)]];
          if (feature.low !== undefined && feature.high !== undefined) {
            rows.push([
              intervalLabel,
              `${formatChartValue(feature.low, format)} – ${formatChartValue(feature.high, format)}`,
            ]);
          }
          return tooltipShellHtml(feature.label, tooltipGridHtml(rows));
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format, scale: true, baseline: true }),
      yAxis: {
        type: "category",
        data: features.map((feature) => feature.label),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        {
          name: "Importance",
          type: "bar",
          barWidth: 12,
          data: features.map((feature, index) => ({
            value: feature.value,
            itemStyle: {
              color: signed
                ? feature.value >= 0
                  ? theme.positive
                  : theme.negative
                : seriesColor(theme, feature.key, index),
              borderRadius: 2,
            },
          })),
        },
        ...(hasInterval
          ? [
              {
                name: intervalLabel,
                type: "custom" as const,
                z: 3,
                silent: true,
                tooltip: { show: false },
                data: features.map((feature, index) => [index, feature.low ?? feature.value, feature.high ?? feature.value]),
                renderItem: (params: unknown, api: unknown) => {
                  const p = params as { dataIndex: number };
                  const helpers = api as {
                    coord: (value: [number, number]) => [number, number];
                    value: (index: number) => number;
                    style: (extra?: Record<string, unknown>) => Record<string, unknown>;
                  };
                  const [x1, y] = helpers.coord([helpers.value(1), p.dataIndex]);
                  const [x2] = helpers.coord([helpers.value(2), p.dataIndex]);
                  const cap = 4;
                  return {
                    type: "group",
                    children: [
                      {
                        type: "line",
                        shape: { x1, y1: y, x2: x2, y2: y },
                        style: { ...helpers.style(), stroke: theme.textPrimary, lineWidth: 1.4 },
                      },
                      {
                        type: "line",
                        shape: { x1, y1: y - cap, x2: x1, y2: y + cap },
                        style: { ...helpers.style(), stroke: theme.textPrimary, lineWidth: 1.4 },
                      },
                      {
                        type: "line",
                        shape: { x1: x2, y1: y - cap, x2, y2: y + cap },
                        style: { ...helpers.style(), stroke: theme.textPrimary, lineWidth: 1.4 },
                      },
                    ],
                  };
                },
              },
            ]
          : []),
      ],
    };
  }, [features, format, intervalLabel, motion, signed, theme]);

  return (
    <ChartSurface
      option={option}
      state={features.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Feature importance"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No importances were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
