"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { toneColor, withAlpha } from "../core/theme";
import { baseOption, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface RadialCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

export interface RadarIndicator {
  name: string;
  /** Upper bound for the spoke. Defaults to the series maximum. */
  max?: number;
}

export interface RadarSeries {
  name: string;
  values: readonly number[];
  tone?: SeriesTone;
  color?: string;
}

export interface RadarChartProps extends RadialCommonProps {
  indicators: readonly RadarIndicator[];
  series: readonly RadarSeries[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Radar comparison.
 *
 * Two or three series, thin strokes, a low-alpha fill and no vertex symbols —
 * the classic radar failure mode is five heavy overlapping shapes with dots.
 */
export function RadarChart({
  indicators,
  series,
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
}: RadarChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const maxima = indicators.map((indicator, index) => {
      if (indicator.max !== undefined) return indicator.max;
      const values = series.map((entry) => entry.values[index] ?? 0);
      return Math.max(1, ...values);
    });
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number[] };
          const rows = indicators.map((indicator, index) => [
            indicator.name,
            formatChartValue((item.value ?? [])[index] ?? null, format),
          ]) as Array<[string, string]>;
          return tooltipShellHtml(item.name, tooltipGridHtml(rows));
        },
      }),
      radar: {
        indicator: indicators.map((indicator, index) => ({
          name: indicator.name,
          max: maxima[index]!,
        })),
        shape: "polygon",
        splitNumber: 4,
        radius: "82%",
        center: ["50%", "53%"],
        axisName: {
          color: theme.textMuted,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
        },
        axisLine: { lineStyle: { color: theme.gridStrong, width: 1 } },
        splitLine: { lineStyle: { color: theme.grid, width: 1 } },
        splitArea: { show: false },
      },
      series: [
        {
          id: "radar",
          type: "radar",
          symbol: "none",
          emphasis: { focus: "series", areaStyle: { opacity: 0.22 } },
          data: series.map((entry, index) => {
            const color = entry.color ?? toneColor(theme, entry.tone, index);
            return {
              name: entry.name,
              value: [...entry.values],
              lineStyle: { width: 2, color },
              itemStyle: { color },
              areaStyle: { color: withAlpha(color, 0.13) },
            };
          }),
        },
      ],
    };
  }, [format, indicators, motion, series, theme]);

  return (
    <ChartSurface
      option={option}
      state={series.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Radar comparison"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

export interface GaugeThreshold {
  /** Upper bound of this zone. */
  value: number;
  tone?: SeriesTone;
  color?: string;
}

export interface GaugeChartProps extends RadialCommonProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  format?: ChartFormat;
  /** Ordered zones drawn along the track, lowest bound first. */
  thresholds?: readonly GaugeThreshold[];
  /** `semi` is a 200° arc; `ring` is a full 270° arc. */
  variant?: "semi" | "ring";
  title?: string;
  description?: string;
}

/**
 * Compact gauge.
 *
 * No pointer, no glossy arc, no purple gradient: a thin track, a single accent
 * progress stroke and a large tabular readout. It reads as instrumentation, not
 * as a car dashboard.
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  format,
  thresholds,
  variant = "ring",
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: GaugeChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const track = thresholds?.length
      ? thresholds.map((threshold, index) => {
          const previous = index === 0 ? min : (thresholds[index - 1]?.value ?? min);
          const span = (threshold.value - previous) / (max - min);
          return [Math.max(0, span), withAlpha(toneColor(theme, threshold.tone, index), 0.28)] as [
            number,
            string,
          ];
        })
      : ([[1, withAlpha(theme.neutral, 0.2)]] as Array<[number, string]>);

    const semi = variant === "semi";
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: () =>
          tooltipShellHtml(
            label ?? title,
            `<div class="luc-chart-tooltip__rows">${tooltipRowHtml(
              "Value",
              formatChartValue(value, format),
            )}${tooltipRowHtml(
              "Of range",
              max > min ? formatChartValue(((value - min) / (max - min)) * 100, { kind: "percent" }) : "—",
            )}</div>`,
          ),
      }),
      series: [
        {
          id: "gauge",
          type: "gauge",
          startAngle: semi ? 200 : 225,
          endAngle: semi ? -20 : -45,
          min,
          max,
          center: ["50%", "58%"],
          radius: semi ? "88%" : "84%",
          splitNumber: 5,
          progress: {
            show: true,
            width: 12,
            roundCap: true,
            itemStyle: { color: theme.accent },
          },
          axisLine: { lineStyle: { width: 12, color: track, shadowBlur: 0 } },
          pointer: { show: false },
          anchor: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: Boolean(label),
            offsetCenter: [0, "34%"],
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
          },
          detail: {
            valueAnimation: !motion.reduced,
            offsetCenter: [0, "2%"],
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: 24,
            fontWeight: 600,
            formatter: (input: number) => formatChartValue(input, format),
          },
          data: [{ value, name: label ?? title ?? "" }],
        },
      ],
    };
  }, [format, label, max, min, motion, theme, thresholds, title, value, variant]);

  return (
    <ChartSurface
      option={option}
      state={Number.isFinite(value) ? state : "empty"}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? label ?? "Gauge"}
      ariaDescription={
        ariaDescription ??
        (label ? `${label}: ${formatChartValue(value, format)}` : description)
      }
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
