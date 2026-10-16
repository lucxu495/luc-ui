"use client";

import { useMemo } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { withAlpha } from "../core/theme";
import {
  axisFragment,
  baseOption,
  dataZoomFragment,
  gridFragment,
  tooltipShell,
  type Option,
} from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface WaterfallItem {
  label: string;
  value: number;
  /** A subtotal bar: drawn from zero and coloured as a total. */
  total?: boolean;
}

export interface WaterfallChartProps {
  data: readonly WaterfallItem[];
  format?: ChartFormat;
  /** Horizontal waterfalls are the readable choice past ~10 steps. */
  orientation?: "vertical" | "horizontal";
  title?: string;
  description?: string;
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

/**
 * Waterfall.
 *
 * Two stacked series: an invisible base that positions each bar, and the visible
 * delta. Connector lines join consecutive levels, which is what makes a
 * waterfall readable at all. Increases use `positive`, decreases `negative`, and
 * subtotals use the accent — semantic colour, never the categorical palette.
 */
export function WaterfallChart({
  data,
  format,
  orientation = "vertical",
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: WaterfallChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);
  const horizontal = orientation === "horizontal";

  const option = useMemo<Option>(() => {
    const labels: string[] = [];
    const bases: number[] = [];
    const deltas: number[] = [];
    const colors: string[] = [];
    const levels: number[] = [];
    const connectors: Array<Array<{ coord: [string, number] }>> = [];
    let running = 0;

    data.forEach((item, index) => {
      labels.push(item.label);
      const previous = running;
      if (item.total) {
        bases.push(0);
        deltas.push(item.value);
        running = item.value;
        colors.push(theme.palette[0] ?? theme.accent);
      } else {
        const next = running + item.value;
        bases.push(Math.min(previous, next));
        deltas.push(Math.abs(item.value));
        running = next;
        colors.push(item.value >= 0 ? theme.positive : theme.negative);
      }
      levels.push(running);
      const nextItem = data[index + 1];
      if (nextItem) {
        connectors.push([
          { coord: [item.label, running] },
          { coord: [nextItem.label, running] },
        ]);
      }
    });

    const categoryAxis = {
      ...axisFragment({ theme, type: "category", baseline: true, showGrid: false }),
      data: labels,
      axisLabel: {
        color: theme.axisLabel,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontMicro,
        interval: 0,
        width: 76,
        overflow: "truncate",
        hideOverlap: true,
        margin: 8,
      },
    };
    const valueAxis = axisFragment({
      theme,
      type: "value",
      format,
      showGrid: true,
      // A vertical waterfall's value plate goes on the right like every other
      // single-axis LUC chart; a horizontal one has no Y value axis to move.
      ...(horizontal ? {} : { position: "right" as const }),
    });

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 14, bottom: 6, left: 6 }),
      ...(horizontal ? { xAxis: valueAxis, yAxis: { ...categoryAxis, inverse: true } } : { xAxis: categoryAxis, yAxis: valueAxis }),
      dataZoom: dataZoomFragment({ theme, interaction: { zoom: "inside" }, axisIndices: [0] }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number }>;
          const index = items[0]?.dataIndex ?? -1;
          const item = data[index];
          if (!item) return "";
          const signedOptions: ChartFormat = { ...format, signed: true };
          return tooltipShellHtml(
            item.label,
            tooltipGridHtml([
              ["Change", formatChartValue(item.value, signedOptions)],
              ["Running", formatChartValue(levels[index] ?? null, format)],
            ]),
          );
        },
      }),
      series: [
        {
          id: "wf-base",
          name: "Base",
          type: "bar",
          stack: "waterfall",
          silent: true,
          itemStyle: { color: "transparent" },
          emphasis: { disabled: true },
          data: bases,
        },
        {
          id: "wf-delta",
          name: "Delta",
          type: "bar",
          stack: "waterfall",
          barMaxWidth: 40,
          data: deltas.map((value, index) => ({
            value,
            itemStyle: {
              color: withAlpha(colors[index] ?? theme.accent, 0.82),
              borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0],
            },
          })),
          emphasis: { itemStyle: { opacity: 1 } },
          markLine: {
            silent: true,
            symbol: "none",
            animation: false,
            lineStyle: { color: theme.reference, width: 1, type: "dashed" },
            label: { show: false },
            data: connectors,
          },
        },
      ],
    };
  }, [data, format, horizontal, motion, theme]);

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Waterfall"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
