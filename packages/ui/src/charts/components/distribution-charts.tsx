"use client";

import { useMemo } from "react";
import type { AnnotationSpec, ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { toneColor, withAlpha, type ChartTheme } from "../core/theme";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { annotationMarks } from "../adapters/echarts/marks";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface DistributionCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  /**
   * Display name of the value axis ("Return", "Observations").
   *
   * An unlabelled pair of numbers leaves the reader to guess which axis is the
   * bin and which is the count. The name is presentation chrome — it never
   * changes a value — so it is passed straight to the engine's own axis title.
   */
  xLabel?: string;
  yLabel?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
  /**
   * The caller's own share for this bin (e.g. a served `frequency`), when it has
   * one. LUC UI computes no share: without it the tooltip falls back to the
   * bin's own share of the peak, clearly labelled as such.
   */
  share?: number | null;
}

/** The engine's own axis title, styled to the plate's micro typography. */
function axisTitle(name: string | undefined, theme: ChartTheme) {
  if (!name) return {};
  return {
    name,
    nameLocation: "middle" as const,
    nameGap: 30,
    nameTextStyle: {
      color: theme.axisLabel,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontMicro,
    },
  };
}

export interface HistogramChartProps extends DistributionCommonProps {
  /** Pre-binned data. Binning is the caller's job — see docs/CHART_GUIDE.md. */
  bins: readonly HistogramBin[];
  /** Format for the bin edges on the x axis. */
  xFormat?: ChartFormat;
  /** Format for the count axis. */
  format?: ChartFormat;
  tone?: SeriesTone;
  annotations?: AnnotationSpec;
  title?: string;
  description?: string;
}

/**
 * Distribution of a prepared, pre-binned sample.
 *
 * The bars are unstacked, unbordered and separated by the plot background, so
 * the shape of the distribution is the only thing the eye has to read.
 */
export function HistogramChart({
  bins,
  xFormat,
  format,
  tone,
  annotations,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  xLabel,
  yLabel,
  onReady,
  onEvent,
}: HistogramChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const color = toneColor(theme, tone ?? "accent", 0);
    const maxCount = Math.max(0, ...bins.map((bin) => bin.count));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 16, right: 12, bottom: xLabel ? 26 : 6 }),
      xAxis: {
        ...axisFragment({ theme, type: "category", baseline: true, showGrid: false }),
        ...axisTitle(xLabel, theme),
        data: bins.map((bin) => formatChartValue(bin.from, xFormat)),
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          hideOverlap: true,
          margin: 8,
        },
      },
      yAxis: {
        ...axisFragment({ theme, type: "value", position: "right", format, min: 0, showGrid: true }),
        ...(yLabel
          ? { name: yLabel, nameLocation: "end" as const, nameGap: 12, nameTextStyle: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontMicro } }
          : {}),
      },
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number }>;
          const bin = bins[items[0]?.dataIndex ?? -1];
          if (!bin) return "";
          const span = `${formatChartValue(bin.from, xFormat)} – ${formatChartValue(bin.to, xFormat)}`;
          /*
           * The share is printed only when the caller has one (a served
           * `frequency`). Inventing a share from the bins would be a chart
           * making up a statistic, so a distribution without one shows its count
           * and nothing more.
           */
          const servedShare = bin.share;
          const rows: Array<readonly [string, string]> = [["Count", formatChartValue(bin.count, format)]];
          if (typeof servedShare === "number" && Number.isFinite(servedShare)) {
            rows.push(["Share", formatChartValue(servedShare * 100, { kind: "percent", decimals: 2 })]);
          }
          return tooltipShellHtml(
            span,
            tooltipGridHtml(rows),
          );
        },
      }),
      series: [
        {
          id: "histogram",
          type: "bar",
          barCategoryGap: "12%",
          barMaxWidth: 40,
          itemStyle: { color: withAlpha(color, 0.72), borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color, opacity: 1 } },
          data: bins.map((bin) => bin.count),
          ...annotationMarks(theme, annotations, maxCount),
        },
      ],
    };
  }, [annotations, bins, format, motion, theme, tone, xFormat, xLabel, yLabel]);

  return (
    <ChartSurface
      option={option}
      state={bins.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Histogram"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

/** `[min, Q1, median, Q3, max]`, computed by the caller. */
export type BoxPlotSummary = readonly [number, number, number, number, number];

/** A prepared density curve over the same domain as the bins. */
export interface DensityCurve {
  /** x at each sample, in the bins' own units. */
  x: readonly number[];
  /** Density (or any smoothed magnitude); the chart rescales for display. */
  y: readonly number[];
  label?: string;
}

/** A prepared reference level drawn as a labelled vertical rule. */
export interface DistributionReference {
  value: number;
  label: string;
  /** `median` / `mean` / `percentile` / `threshold` — presentation only. */
  kind?: "median" | "mean" | "percentile" | "threshold";
}

export interface DistributionChartProps extends DistributionCommonProps {
  /** Pre-binned sample. Binning is the analytics layer's job. */
  bins: readonly HistogramBin[];
  /** Optional prepared density curve (a kernel estimate the caller computed). */
  density?: DensityCurve;
  /** Median / mean / percentile markers, already computed. */
  references?: readonly DistributionReference[];
  /**
   * Split the bars by sign (returns above/below zero, PnL, surprise). Bars take
   * the semantic positive/negative colours; a single-signed sample stays one
   * colour rather than pretending to have two regimes.
   */
  signed?: boolean;
  xFormat?: ChartFormat;
  format?: ChartFormat;
  tone?: SeriesTone;
  annotations?: AnnotationSpec;
  title?: string;
  description?: string;
}

/**
 * DistributionChart — the research-grade histogram.
 *
 * A histogram answers "what shape is this sample?". Two things make it
 * research-grade rather than decorative: a **density overlay** (so the shape is
 * not read off bar heights alone) and **reference markers** for the median and
 * mean, which is where a distribution's asymmetry becomes visible.
 *
 * Everything statistical arrives prepared. LUC UI bins nothing, fits nothing and
 * computes no percentile (§40) — it draws the caller's numbers.
 */
export function DistributionChart({
  bins,
  density,
  references,
  signed = false,
  xFormat,
  format,
  tone,
  annotations,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: DistributionChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "standard", bins.length);

  const option = useMemo<Option>(() => {
    const accent = toneColor(theme, tone ?? "accent", 0);
    const labels = bins.map((bin) => formatChartValue(bin.from, xFormat));
    const maxCount = Math.max(0, ...bins.map((bin) => bin.count));
    const maxDensity = density ? Math.max(...density.y.map((value) => Math.abs(value)), 0) : 0;
    const hasNegative = bins.some((bin) => bin.from < 0 || bin.to < 0);
    const useSign = signed && hasNegative;

    const markerStyles: Record<string, string> = {
      median: seriesColor(theme, "primary"),
      mean: toneColor(theme, "warning", 0),
      percentile: theme.reference,
      threshold: toneColor(theme, "negative", 0),
    };

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 14, bottom: 6 }),
      xAxis: {
        ...axisFragment({ theme, type: "category", baseline: true, showGrid: false }),
        data: labels,
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          hideOverlap: true,
          margin: 8,
        },
      },
      yAxis: axisFragment({ theme, type: "value", position: "right", format, min: 0, showGrid: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number; seriesId?: string }>;
          const source = items.find((item) => item.seriesId === "distribution") ?? items[0];
          const bin = source?.dataIndex !== undefined ? bins[source.dataIndex] : undefined;
          if (!bin) return "";
          const rows: Array<readonly [string, string]> = [["Count", formatChartValue(bin.count, format)]];
          if (maxCount > 0) rows.push(["Share of peak", formatChartValue((bin.count / maxCount) * 100, { kind: "percent" })]);
          const densityPoint = density && source?.dataIndex !== undefined ? density.y[source.dataIndex] : undefined;
          if (densityPoint !== undefined) rows.push([density?.label ?? "Density", formatChartValue(densityPoint, format)]);
          return tooltipShellHtml(
            `${formatChartValue(bin.from, xFormat)} – ${formatChartValue(bin.to, xFormat)}`,
            tooltipGridHtml(rows),
          );
        },
      }),
      series: [
        {
          id: "distribution",
          type: "bar",
          barCategoryGap: "10%",
          barMaxWidth: 46,
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              if (!useSign) return withAlpha(accent, 0.75);
              const bin = bins[params.dataIndex];
              if (!bin) return withAlpha(accent, 0.75);
              const centre = (bin.from + bin.to) / 2;
              return withAlpha(centre >= 0 ? theme.positive : theme.negative, 0.72);
            },
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: { itemStyle: { opacity: 1 } },
          data: bins.map((bin) => bin.count),
          ...annotationMarks(theme, annotations, maxCount),
          ...(references && references.length
            ? {
                markLine: {
                  silent: true,
                  symbol: "none",
                  animation: false,
                  data: references.map((reference) => ({
                    xAxis: nearestBinLabel(bins, reference.value, xFormat),
                    lineStyle: {
                      color: markerStyles[reference.kind ?? "median"] ?? theme.reference,
                      width: reference.kind === "median" ? 1.6 : 1,
                      type: reference.kind === "threshold" ? "dashed" : "solid",
                    },
                    label: {
                      show: true,
                      formatter: reference.label,
                      position: "insideEndTop",
                      color: theme.textMuted,
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontMicro,
                    },
                  })),
                },
              }
            : {}),
        },
        ...(density && maxDensity > 0
          ? [
              {
                id: "density",
                name: density.label ?? "Density",
                type: "line" as const,
                smooth: true,
                symbol: "none",
                z: 3,
                lineStyle: { color: seriesColor(theme, "benchmark"), width: 2 },
                // The density lives on its own scale (a kernel estimate carries a
                // different unit than a count), so it is normalised to the bars'
                // peak for display only — the tooltip still shows the real value.
                data: density.y.map((value) => (Math.abs(value) / maxDensity) * maxCount),
              },
            ]
          : []),
      ],
    };
  }, [annotations, bins, density, format, motion, references, signed, theme, tone, xFormat]);

  return (
    <ChartSurface
      option={option}
      state={bins.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Distribution"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

/** The formatted bin label a value falls into (category axis coordinates). */
function nearestBinLabel(
  bins: readonly HistogramBin[],
  value: number,
  xFormat: ChartFormat | undefined,
): string | number {
  let best = bins[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const bin of bins) {
    const centre = (bin.from + bin.to) / 2;
    const distance = Math.abs(centre - value);
    if (distance < bestDistance) {
      best = bin;
      bestDistance = distance;
    }
  }
  return best ? formatChartValue(best.from, xFormat) : value;
}

export interface BoxPlotOutlier {
  /** Index into `categories`. */
  category: number;
  value: number;
}

export interface BoxPlotChartProps extends DistributionCommonProps {
  categories: readonly string[];
  data: ReadonlyArray<BoxPlotSummary | null>;
  outliers?: readonly BoxPlotOutlier[];
  format?: ChartFormat;
  tone?: SeriesTone;
  title?: string;
  description?: string;
}

/**
 * Box plot with optional prepared outliers.
 *
 * Every mark — body, median, whiskers, caps — is drawn at rest. Hover changes
 * the emphasis, never the presence: a reader who never touches the chart must
 * still see the distribution. Outliers arrive pre-computed — LUC UI never
 * decides what an outlier is.
 */
export function BoxPlotChart({
  categories,
  data,
  outliers,
  format,
  tone,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: BoxPlotChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const color = toneColor(theme, tone ?? "accent", 0);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 16, right: 12, bottom: 6 }),
      xAxis: {
        ...axisFragment({ theme, type: "category", baseline: true, showGrid: false }),
        data: [...categories],
      },
      yAxis: axisFragment({ theme, type: "value", position: "right", format, showGrid: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as {
            seriesType?: string;
            dataIndex?: number;
            value?: unknown;
          };
          if (item.seriesType === "scatter") {
            const pair = item.value as [number, number] | undefined;
            if (!pair) return "";
            return tooltipShellHtml(
              categories[pair[0]] ?? "Outlier",
              tooltipGridHtml([["Outlier", formatChartValue(pair[1], format)]]),
            );
          }
          const summary = data[item.dataIndex ?? -1];
          if (!summary) return "";
          return tooltipShellHtml(
            categories[item.dataIndex ?? 0],
            tooltipGridHtml([
              ["Max", formatChartValue(summary[4], format)],
              ["Q3", formatChartValue(summary[3], format)],
              ["Median", formatChartValue(summary[2], format)],
              ["Q1", formatChartValue(summary[1], format)],
              ["Min", formatChartValue(summary[0], format)],
            ]),
          );
        },
      }),
      series: [
        {
          id: "boxplot",
          type: "boxplot",
          boxWidth: ["22%", "46%"],
          itemStyle: {
            /*
             * The resting mark has to read on its own. As shipped in V0.5 the
             * body was a 16% tint — effectively invisible on the card surface —
             * and the whole mark depended on a 1.4px border at 85% alpha, while
             * hover jumped to a 28% body and a full-strength 1.8px border. That
             * made hover look like it *revealed* the box rather than emphasising
             * it. Rest is now a solid accent stroke with a visible body, and
             * hover only deepens the same three values.
             */
            color: withAlpha(color, 0.24),
            borderColor: color,
            borderWidth: 1.5,
          },
          emphasis: {
            itemStyle: { color: withAlpha(color, 0.4), borderColor: color, borderWidth: 2 },
          },
          data: data.map((entry) => (entry ? [...entry] : null)),
        },
        ...(outliers?.length
          ? [
              {
                id: "outliers",
                type: "scatter" as const,
                symbolSize: 5,
                itemStyle: {
                  color: theme.surfaceRaised,
                  borderColor: withAlpha(theme.neutral, 0.9),
                  borderWidth: 1.2,
                },
                data: outliers.map((outlier) => [outlier.category, outlier.value]),
                tooltip: { show: true },
              },
            ]
          : []),
      ],
    };
  }, [categories, data, format, motion, outliers, theme, tone]);

  return (
    <ChartSurface
      option={option}
      state={categories.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Box plot"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
