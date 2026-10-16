"use client";

import { useMemo } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { baseOption, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface CompositionCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

export interface CategoryValue {
  name: string;
  value: number;
}

/* -------------------------------------------------------------------------- */
/* Pie / donut                                                                 */
/* -------------------------------------------------------------------------- */

export interface PieChartProps extends CompositionCommonProps {
  data: readonly CategoryValue[];
  /** Donut by default: a ring reads better next to a metric than a solid disc. */
  variant?: "donut" | "pie";
  format?: ChartFormat;
  /** Optional value printed in the middle of a donut. */
  centerLabel?: string;
  centerValue?: string;
  title?: string;
  description?: string;
}

const PIE_LIMIT = 6;

/**
 * Part-to-whole composition.
 *
 * Deliberately capped at six slices: past that a pie stops being readable, and
 * the Showcase's chart-selection guidance says so. Series beyond the cap stay in
 * the data and appear in the tooltip only through the legend/table the caller
 * renders.
 */
export function PieChart({
  data,
  variant = "donut",
  format,
  centerLabel,
  centerValue,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: PieChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const donut = variant === "donut";
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number };
          const value = item.value ?? 0;
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([
              ["Value", formatChartValue(value, format)],
              ["Share", total > 0 ? formatChartValue((value / total) * 100, { kind: "percent" }) : "—"],
            ]),
          );
        },
      }),
      graphic: donut && centerValue
        ? [
            {
              type: "text",
              left: "center",
              top: "45%",
              silent: true,
              style: {
                text: centerValue,
                fill: theme.textPrimary,
                font: `600 ${theme.fontLabel}px ${theme.fontFamily}`,
                textAlign: "center",
              },
            },
            centerLabel
              ? {
                  type: "text",
                  left: "center",
                  top: "54%",
                  silent: true,
                  style: {
                    text: centerLabel,
                    fill: theme.textMuted,
                    font: `500 ${theme.fontMicro}px ${theme.fontFamily}`,
                    textAlign: "center",
                  },
                }
              : undefined,
          ].filter(Boolean)
        : undefined,
      series: [
        {
          id: "composition",
          type: "pie",
          radius: donut ? ["58%", "82%"] : ["0%", "76%"],
          center: ["50%", "52%"],
          minAngle: 3,
          padAngle: 1.5,
          itemStyle: {
            borderColor: theme.surfaceRaised,
            borderWidth: 2,
            borderRadius: 4,
          },
          label: {
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            formatter: "{b}",
          },
          labelLine: {
            length: 8,
            length2: 8,
            lineStyle: { color: theme.border },
          },
          emphasis: {
            scale: true,
            scaleSize: 4,
            itemStyle: { borderColor: theme.accent, borderWidth: 2 },
          },
          data: data.map((entry) => ({ name: entry.name, value: entry.value })),
        },
      ],
    };
  }, [centerLabel, centerValue, data, format, motion, theme, variant]);

  const tooMany = data.length > PIE_LIMIT;
  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Composition chart"}
      ariaDescription={
        ariaDescription ??
        description ??
        (tooMany
          ? "More than six categories: consider a bar chart for readability."
          : undefined)
      }
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Treemap / sunburst                                                          */
/* -------------------------------------------------------------------------- */

export interface HierarchyNode {
  name: string;
  value?: number;
  children?: readonly HierarchyNode[];
}

export interface TreemapChartProps extends CompositionCommonProps {
  data: readonly HierarchyNode[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

export function TreemapChart({
  data,
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
}: TreemapChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(
    () => ({
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number };
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([["Size", formatChartValue(item.value, format)]]),
          );
        },
      }),
      series: [
        {
          id: "treemap",
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          visibleMin: 300,
          top: 4,
          bottom: 4,
          left: 4,
          right: 4,
          itemStyle: {
            borderColor: theme.surfaceRaised,
            borderWidth: 2,
            gapWidth: 2,
            borderRadius: 4,
          },
          label: {
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            overflow: "truncate",
          },
          upperLabel: { show: false },
          emphasis: { itemStyle: { borderColor: theme.accent, borderWidth: 2 } },
          data: data as unknown[],
        },
      ],
    }),
    [data, format, motion, theme],
  );

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Treemap"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

export interface SunburstChartProps extends CompositionCommonProps {
  data: readonly HierarchyNode[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

export function SunburstChart({
  data,
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
}: SunburstChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(
    () => ({
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number };
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([["Size", formatChartValue(item.value, format)]]),
          );
        },
      }),
      series: [
        {
          id: "sunburst",
          type: "sunburst",
          radius: ["12%", "86%"],
          sort: "desc",
          nodeClick: false,
          emphasis: { focus: "ancestor" },
          itemStyle: { borderColor: theme.surfaceRaised, borderWidth: 2, borderRadius: 3 },
          label: {
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            rotate: "radial",
            minAngle: 8,
          },
          /*
           * The universal label layout pass.
           *
           * A sunburst packs fifteen to fifty labels into a disc, and the inner
           * rings are the worst case: a label that is wider than its sector's chord
           * runs across the neighbouring sectors, which is exactly what the Phase
           * 10A.1 screenshot showed ("Fixed income" printed across two groups).
           * `hideOverlap` drops the labels that cannot be placed without a
           * collision. The sector, its colour and its tooltip all remain, so nothing
           * is lost from the *data* — only text that could not be read anyway.
           */
          labelLayout: { hideOverlap: true },
          levels: [
            {},
            {
              r0: "12%",
              r: "48%",
              itemStyle: { borderWidth: 2 },
              /*
               * The primary ring keeps horizontal labels — they are the most
               * readable — but only where the sector is wide enough to hold one:
               * 26° is roughly the angle a two-word label needs at this radius.
               * Narrower sectors keep their colour and tooltip and lose their text,
               * which is the honest trade rather than a label drawn through its
               * neighbour.
               */
              label: { rotate: 0, minAngle: 26, fontSize: theme.fontCaption, overflow: "truncate" },
            },
            { r0: "48%", r: "72%", label: { rotate: "tangential", minAngle: 10 } },
            { r0: "72%", r: "86%", label: { position: "outside", padding: 2, silent: false } },
          ],
          data: data as unknown[],
        },
      ],
    }),
    [data, format, motion, theme],
  );

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Sunburst"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Funnel                                                                      */
/* -------------------------------------------------------------------------- */

export interface FunnelChartProps extends CompositionCommonProps {
  data: readonly CategoryValue[];
  format?: ChartFormat;
  /** Value printed next to each stage name inside the funnel. */
  showValues?: boolean;
  title?: string;
  description?: string;
}

export function FunnelChart({
  data,
  format,
  showValues = true,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: FunnelChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const top = data[0]?.value ?? 0;
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { name?: string; value?: number };
          const value = item.value ?? 0;
          return tooltipShellHtml(
            item.name,
            `<div class="luc-chart-tooltip__rows">${tooltipRowHtml(
              "Value",
              formatChartValue(value, format),
            )}${tooltipRowHtml(
              "Of first stage",
              top > 0 ? formatChartValue((value / top) * 100, { kind: "percent" }) : "—",
            )}</div>`,
          );
        },
      }),
      series: [
        {
          id: "funnel",
          type: "funnel",
          left: "8%",
          right: "8%",
          top: 12,
          bottom: 12,
          minSize: "24%",
          maxSize: "100%",
          sort: "descending",
          gap: 3,
          funnelAlign: "center",
          itemStyle: {
            borderColor: theme.surfaceRaised,
            borderWidth: 2,
            borderRadius: 4,
            opacity: 0.92,
          },
          label: {
            show: true,
            position: "inside",
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            formatter: (params: { name?: string; value?: number }) =>
              showValues
                ? `${params.name ?? ""}  ${formatChartValue(params.value, format)}`
                : (params.name ?? ""),
          },
          labelLine: { show: false },
          emphasis: { label: { fontWeight: 600 } },
          data: data.map((entry) => ({ name: entry.name, value: entry.value })),
        },
      ],
    };
  }, [data, format, motion, showValues, theme]);

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Funnel"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
