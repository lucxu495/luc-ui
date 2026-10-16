"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue, timeSpanMs } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import { formatRatio, type FamilyCommonProps } from "./chart-common";

/**
 * Workflow & operations charts — sequence, comparison and schedule.
 *
 * These are the shapes an operations product reaches for: which task ran when,
 * how two periods compare, what moved and by how much. They are deliberately
 * *not* statistical: every one of them shows a number the caller supplied at a
 * position the caller supplied, and none of them infers a state.
 */

/* -------------------------------------------------------------------------- */
/* Gantt                                                                       */
/* -------------------------------------------------------------------------- */

export interface GanttTask {
  id: string;
  name: string;
  /** Inclusive start and end, in ms since epoch. */
  start: number;
  end: number;
  /** 0–1 completion. Drawn as a lighter inner bar. */
  progress?: number;
  tone?: SeriesTone;
  /** Optional step/phase label. Rendered next to the name. */
  group?: string;
}

export interface GanttChartProps extends FamilyCommonProps {
  tasks: readonly GanttTask[];
  /** Time-axis format for the header labels. */
  timeFormat?: ChartFormat;
  /** Name the axis, e.g. "Scheduled" or "Actual". */
  axisLabel?: string;
  title?: string;
  description?: string;
}

/**
 * Gantt / schedule.
 *
 * One row per task on a time axis, drawn right-to-left in the task order given,
 * so the list reads top-to-bottom. `progress` is drawn *inside* the bar rather
 * than as a second series, which is what keeps a 200-task plan legible.
 */
export function GanttChart({
  tasks,
  timeFormat,
  axisLabel,
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
}: GanttChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const xSpan = timeSpanMs(tasks.flatMap((task) => [task.start, task.end]));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20, top: 12, bottom: 8 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; seriesIndex?: number };
          const task = tasks[item.dataIndex ?? 0];
          if (!task) return "";
          return tooltipShellHtml(
            task.name,
            tooltipGridHtml([
              ["Start", formatChartValue(task.start, timeFormat ?? { kind: "date" })],
              ["End", formatChartValue(task.end, timeFormat ?? { kind: "date" })],
              ["Duration", `${Math.max(0, Math.round((task.end - task.start) / 3_600_000))} h`],
              ...(task.progress !== undefined
                ? [["Progress", formatRatio(task.progress)] as const]
                : []),
            ]),
          );
        },
      }),
      xAxis: {
        ...axisFragment({
          type: "time",
          theme,
          format: timeFormat ?? { kind: "date" },
          max: "dataMax",
          ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
        }),
      },
      yAxis: {
        type: "category",
        data: tasks.map((task) => (task.group ? `${task.group} · ${task.name}` : task.name)),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: theme.grid } },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        {
          name: axisLabel ?? "Duration",
          type: "custom",
          z: 2,
          /*
           * The dimension mapping is **not** optional for a custom series.
           *
           * Without `encode`, ECharts binds dimension 0 to the x axis and
           * dimension 1 to y, so this series' timestamps (dimensions 1 and 2)
           * never reached the time axis: the domain was derived from the *task
           * index* — 0…3 ms — and the plot therefore labelled four ticks around
           * 1970-01-01 ("Jan 1", four times) while every bar was mapped to a
           * pixel far outside that domain and clipped away. The chart rendered a
           * y-axis, a grid and no data, which is exactly what the Phase 10A.1
           * report described.
           *
           * `x: [1, 2]` puts *both* ends of each bar into the domain, so the
           * axis covers the whole schedule rather than the start instants.
           */
          encode: { x: [1, 2], y: 0 },
          data: tasks.map((task, index) => [index, task.start, task.end, task.progress ?? null]),
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              value: (dimension: number) => number;
              size: (value: [number, number]) => [number, number];
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const index = helpers.value(0);
            const start = helpers.value(1);
            const end = helpers.value(2);
            const [x1, y] = helpers.coord([start, index]);
            const [x2] = helpers.coord([end, index]);
            const [, heightPx] = helpers.size([0, 1]);
            const barHeight = Math.max(6, Math.min(18, heightPx * 0.5));
            const task = tasks[Math.round(index)];
            const color = seriesColor(theme, task?.tone ?? task?.id ?? "task", Math.round(index));
            const children: unknown[] = [
              {
                type: "rect",
                shape: { x: x1, y: y - barHeight / 2, width: Math.max(2, x2 - x1), height: barHeight, r: 3 },
                style: { fill: color, opacity: 0.34 },
              },
            ];
            if (task?.progress !== undefined) {
              children.push({
                type: "rect",
                shape: {
                  x: x1,
                  y: y - barHeight / 2,
                  width: Math.max(2, (x2 - x1) * Math.min(1, Math.max(0, task.progress))),
                  height: barHeight,
                  r: 3,
                },
                style: { fill: color, opacity: 0.95 },
              });
            }
            return { type: "group", children };
          },
        },
      ],
    };
  }, [axisLabel, motion, tasks, theme, timeFormat]);

  return (
    <ChartSurface
      option={option}
      state={tasks.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Schedule"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing scheduled", emptyDescription: "No tasks were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Dumbbell / slope                                                            */
/* -------------------------------------------------------------------------- */

export interface DumbbellRow {
  label: string;
  /** Left-hand value of the pair. */
  from: number;
  /** Right-hand value of the pair. */
  to: number;
  tone?: SeriesTone;
}

export interface DumbbellChartProps extends FamilyCommonProps {
  rows: readonly DumbbellRow[];
  /** What the three marks mean. Default `["From", "To"]`. */
  labels?: readonly [string, string];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/** Dumbbell — a start and an end per row, with the change drawn as the connector. */
export function DumbbellChart({
  rows,
  labels = ["From", "To"],
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
}: DumbbellChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 24 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const row = rows[item.dataIndex ?? 0];
          if (!row) return "";
          const delta = row.to - row.from;
          return tooltipShellHtml(
            row.label,
            tooltipGridHtml([
              [labels[0], formatChartValue(row.from, format)],
              [labels[1], formatChartValue(row.to, format)],
              ["Change", `${delta >= 0 ? "+" : ""}${formatChartValue(delta, format)}`],
            ]),
          );
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format, scale: true }),
      yAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        {
          name: "Change",
          type: "custom",
          z: 1,
          data: rows.map((row, index) => [index, row.from, row.to]),
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              value: (dimension: number) => number;
            };
            const index = helpers.value(0);
            const from = helpers.value(1);
            const to = helpers.value(2);
            const [x1, y] = helpers.coord([from, index]);
            const [x2] = helpers.coord([to, index]);
            return {
              type: "line",
              shape: { x1, y1: y, x2, y2: y },
              style: { fill: "transparent", stroke: theme.gridStrong, lineWidth: 2, opacity: 0.9 },
            };
          },
        },
        {
          name: labels[0],
          type: "scatter",
          symbolSize: 9,
          z: 2,
          data: rows.map((row, index) => [row.from, index]),
          itemStyle: { color: theme.textMuted, borderColor: theme.surface, borderWidth: 1.5 },
        },
        {
          name: labels[1],
          type: "scatter",
          symbolSize: 9,
          z: 3,
          data: rows.map((row, index) => [row.to, index]),
          itemStyle: { color: theme.accent, borderColor: theme.surface, borderWidth: 1.5 },
        },
      ],
    };
  }, [format, labels, motion, rows, theme]);

  return (
    <ChartSurface
      option={option}
      state={rows.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Dumbbell chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No comparisons were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface SlopeChartProps extends FamilyCommonProps {
  rows: readonly { label: string; left: number; right: number; tone?: SeriesTone }[];
  /** The two period labels drawn under the two columns. */
  periods?: readonly [string, string];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Slope chart — how each member moved between exactly two points in time.
 *
 * The difference from a dumbbell is what is on the axis: a dumbbell measures a
 * quantity, a slope chart measures a *rank or index* at two moments, so the
 * lines are free to cross and the crossing is the message.
 */
export function SlopeChart({
  rows,
  periods = ["Before", "After"],
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
}: SlopeChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 12, right: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: [number, number]; color?: string };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.seriesName,
            tooltipGridHtml([
              [periods[Math.round(item.value[0])] ?? String(item.value[0]), formatChartValue(item.value[1], format)],
            ]),
          );
        },
      }),
      xAxis: {
        type: "value",
        min: 0,
        max: 1,
        interval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          formatter: (value: number) => periods[Math.round(value)] ?? "",
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontLabel,
        },
        splitLine: { show: false },
      },
      yAxis: { ...axisFragment({ type: "value", theme, format, scale: true }), splitLine: { show: false } },
      series: rows.map((row, index) => {
        const color = seriesColor(theme, row.tone ?? row.label, index);
        return {
          name: row.label,
          type: "line",
          showSymbol: true,
          symbolSize: 8,
          lineStyle: { width: 1.8, color, opacity: 0.9 },
          itemStyle: { color },
          data: [
            [0, row.left],
            [1, row.right],
          ],
          endLabel: {
            show: true,
            formatter: () => row.label,
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
          },
        };
      }),
    };
  }, [format, motion, periods, rows, theme]);

  return (
    <ChartSurface
      option={option}
      state={rows.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Slope chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No two-period rows were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Lollipop / bullet / bump                                                    */
/* -------------------------------------------------------------------------- */

export interface LollipopChartProps extends FamilyCommonProps {
  data: readonly { label: string; value: number; tone?: SeriesTone }[];
  format?: ChartFormat;
  /** Horizontal rows read better past ~12 categories. Default `true`. */
  horizontal?: boolean;
  title?: string;
  description?: string;
}

/** Lollipop — a bar reduced to a stem and a head, for a long ranked list. */
export function LollipopChart({
  data,
  format,
  horizontal = true,
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
}: LollipopChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const categoryAxis = {
      type: "category" as const,
      data: data.map((entry) => entry.label),
      inverse: true,
      axisLine: { lineStyle: { color: theme.axisLine } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
    };
    const valueAxis = { ...axisFragment({ type: "value" as const, theme, format }) };
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 24 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; color?: string };
          const entry = data[item.dataIndex ?? 0];
          if (!entry) return "";
          return tooltipShellHtml(entry.label, tooltipRowHtml(entry.label, formatChartValue(entry.value, format), item.color));
        },
      }),
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series: [
        {
          name: "Stem",
          type: "bar",
          silent: true,
          barWidth: 1.5,
          data: data.map((entry, index) => ({
            value: horizontal ? [entry.value, index] : [index, entry.value],
            itemStyle: { color: seriesColor(theme, entry.tone ?? entry.label, index), opacity: 0.45 },
          })),
        },
        {
          name: "Value",
          type: "scatter",
          symbolSize: 10,
          data: data.map((entry, index) => ({
            value: horizontal ? [entry.value, index] : [index, entry.value],
            itemStyle: {
              color: seriesColor(theme, entry.tone ?? entry.label, index),
              borderColor: theme.surface,
              borderWidth: 1.5,
            },
          })),
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
      ariaLabel={ariaLabel ?? title ?? "Lollipop chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No ranked rows were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface BulletRow {
  label: string;
  /** The measured value. */
  value: number;
  /** The target the value is judged against. */
  target: number;
  /** Qualitative ranges, widest first, e.g. `[40, 70, 100]`. */
  ranges?: readonly number[];
}

export interface BulletChartProps extends FamilyCommonProps {
  rows: readonly BulletRow[];
  format?: ChartFormat;
  valueLabel?: string;
  targetLabel?: string;
  title?: string;
  description?: string;
}

/** Bullet — a measured value, a target and the qualitative bands between them. */
export function BulletChart({
  rows,
  format,
  valueLabel = "Actual",
  targetLabel = "Target",
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
}: BulletChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const max = rows.reduce((peak, row) => Math.max(peak, row.value, row.target, ...(row.ranges ?? [])), 0);
    /* The qualitative bands are stacked first, so the measured bar and the
       target marker always sit on top of them. */
    const bandSeries = (rows[0]?.ranges ?? []).map((_, rangeIndex) => ({
      name: `Band ${rangeIndex + 1}`,
      type: "bar",
      silent: true,
      stack: "bands",
      barWidth: 18,
      z: 1,
      data: rows.map((row) => {
        const bands = row.ranges ?? [];
        const previous = rangeIndex === 0 ? 0 : (bands[rangeIndex - 1] ?? 0);
        return Math.max(0, (bands[rangeIndex] ?? 0) - previous);
      }),
      itemStyle: {
        color: theme.grid,
        /* A calm ladder: the bands are context, and the measured bar has to
           out-read them without shouting. */
        opacity: 0.14 + rangeIndex * 0.08,
        borderColor: theme.surface,
        borderWidth: 0.5,
      },
    }));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 24 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const row = rows[item.dataIndex ?? 0];
          if (!row) return "";
          return tooltipShellHtml(
            row.label,
            tooltipGridHtml([
              [valueLabel, formatChartValue(row.value, format)],
              [targetLabel, formatChartValue(row.target, format)],
            ]),
          );
        },
      }),
      /*
       * `min: 0` is the bullet chart's contract, not a default: the bands are
       * cumulative from zero, so a scaled axis would make them mean something
       * else. The 12% headroom is what gives the value label room to sit at the
       * end of the bar without leaving the plot.
       */
      xAxis: { ...axisFragment({ type: "value", theme, format, min: 0 }), max: max * 1.12 },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        ...bandSeries,
        {
          name: valueLabel,
          type: "bar",
          barWidth: 8,
          z: 3,
          data: rows.map((row) => row.value),
          itemStyle: { color: theme.accent, borderRadius: [2, 2, 2, 2] },
          /*
           * The reading, printed at the end of its own bar. A bullet chart's job
           * is to answer "where are we against the target" at a glance, and
           * making the reader hover for the number defeats that.
           */
          label: {
            show: true,
            position: "right",
            distance: 6,
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            formatter: (params: { value?: number }) =>
              formatChartValue(typeof params.value === "number" ? params.value : 0, format),
          },
        },
        {
          name: targetLabel,
          type: "scatter",
          symbol: "rect",
          symbolSize: [3, 18],
          z: 4,
          data: rows.map((row, index) => [row.target, index]),
          /* A hairline outline keeps the marker readable on a light surface and
             on top of a light band. */
          itemStyle: {
            color: theme.textPrimary,
            borderColor: theme.surface,
            borderWidth: 1,
          },
          /*
           * No text on the marker: the reading is already printed at the end of
           * the bar, and two numbers per row would flatten the hierarchy the
           * bands were just given. The target value stays in the tooltip.
           */
        },
      ],
    };
  }, [format, motion, rows, targetLabel, theme, valueLabel]);

  return (
    <ChartSurface
      option={option}
      state={rows.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Bullet chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No measurements were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface BumpChartProps extends FamilyCommonProps {
  /** Period labels along the horizontal axis. */
  periods: readonly string[];
  series: readonly {
    label: string;
    /** Rank per period, ascending from 1. `null` breaks the line. */
    ranks: readonly (number | null)[];
    tone?: SeriesTone;
  }[];
  /** Label the vertical axis, e.g. "Rank". */
  rankLabel?: string;
  title?: string;
  description?: string;
}

/**
 * Bump chart — rank over time, with the axis inverted so 1 is at the top.
 *
 * A `null` is a genuine gap (not ranked that period) and is drawn as a break,
 * never interpolated: joining across a missing period would invent a position
 * the data does not claim.
 */
export function BumpChart({
  periods,
  series,
  rankLabel = "Rank",
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
}: BumpChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 24 }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const rows = list
            .filter((entry) => (entry as { value?: unknown[] }).value?.[1] != null)
            .map((entry) => {
              const item = entry as { seriesName?: string; value?: [number, number]; color?: string };
              return tooltipRowHtml(item.seriesName ?? "", String(item.value?.[1] ?? ""), item.color);
            });
          const first = list[0] as { name?: string } | undefined;
          return tooltipShellHtml(first?.name, `<div>${rows.join("")}</div>`);
        },
      }),
      xAxis: {
        type: "category",
        data: [...periods],
        boundaryGap: false,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      yAxis: {
        /*
         * `nameLocation: "middle"` puts the axis name beside the ticks instead of
         * at the axis's end. At the end it landed in the top-left corner, on top of
         * the first period label — the renderer diagnostics measured "Rank" over
         * "Q1" — and the middle position is what a reader expects for a rank scale
         * anyway.
         */
        ...axisFragment({
          type: "value",
          theme,
          name: rankLabel,
          nameLocation: "middle",
          nameGap: 46,
          min: 1,
        }),
        /* Rank 1 belongs at the top: the axis is inverted, not the numbers. */
        inverse: true,
        splitLine: { lineStyle: { color: theme.grid } },
        minInterval: 1,
      },
      series: series.map((entry, index) => {
        const color = seriesColor(theme, entry.tone ?? entry.label, index);
        return {
          name: entry.label,
          type: "line",
          connectNulls: false,
          showSymbol: true,
          symbolSize: 8,
          lineStyle: { width: 2, color, opacity: 0.85 },
          itemStyle: { color },
          emphasis: { focus: "series" },
          data: [...entry.ranks],
        };
      }),
    };
  }, [motion, periods, rankLabel, series, theme]);

  return (
    <ChartSurface
      option={option}
      state={periods.length === 0 || series.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Bump chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to rank", emptyDescription: "No ranked periods were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Mekko / mosaic                                                              */
/* -------------------------------------------------------------------------- */

export interface MekkoColumn {
  label: string;
  /** Column width weight — usually the column's total. */
  weight: number;
  segments: readonly { name: string; value: number }[];
}

export interface MekkoChartProps extends FamilyCommonProps {
  columns: readonly MekkoColumn[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Mekko (mosaic) — a stacked bar whose *width* is the group size.
 *
 * This is the honest version of a stacked bar: it shows that a 12% share inside
 * a tiny column is not the same fact as a 12% share inside the biggest one, which
 * a fixed-width stack hides.
 */
export function MekkoChart({
  columns,
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
}: MekkoChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const segmentNames = Array.from(new Set(columns.flatMap((column) => column.segments.map((segment) => segment.name))));
    const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);
    const bounds: { start: number; end: number; column: MekkoColumn }[] = [];
    let cursor = 0;
    for (const column of columns) {
      const span = totalWeight > 0 ? column.weight / totalWeight : 1 / Math.max(1, columns.length);
      bounds.push({ start: cursor, end: cursor + span, column });
      cursor += span;
    }
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 12, top: 12, bottom: 8 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; seriesName?: string; value?: number; color?: string };
          const index = item.dataIndex ?? 0;
          const bound = bounds[index];
          const segment = bound?.column.segments.find((entry) => entry.name === item.seriesName);
          if (!bound || !segment) return "";
          const columnTotal = bound.column.segments.reduce((sum, entry) => sum + entry.value, 0);
          return tooltipShellHtml(
            bound.column.label,
            tooltipGridHtml([
              [segment.name, formatChartValue(segment.value, format)],
              ["Share", formatRatio(columnTotal > 0 ? segment.value / columnTotal : 0)],
              ["Weight", formatChartValue(bound.column.weight, format)],
            ]),
          );
        },
      }),
      xAxis: {
        type: "value",
        min: 0,
        max: 1,
        show: false,
      },
      yAxis: { type: "value", min: 0, max: 1, show: false },
      series: segmentNames.map((name, seriesIndex) => ({
        name,
        type: "custom",
        z: 2,
        data: bounds.map((bound, boundIndex) => {
          const columnTotal = bound.column.segments.reduce((sum, entry) => sum + entry.value, 0);
          let lower = 0;
          for (const segment of bound.column.segments) {
            const height = columnTotal > 0 ? segment.value / columnTotal : 0;
            if (segment.name === name) {
              return [boundIndex, bound.start, bound.end, lower, lower + height];
            }
            lower += height;
          }
          return [boundIndex, bound.start, bound.end, 0, 0];
        }),
        renderItem: (_params: unknown, api: unknown) => {
          const helpers = api as {
            coord: (value: [number, number]) => [number, number];
            value: (dimension: number) => number;
          };
          const start = helpers.value(1);
          const end = helpers.value(2);
          const lower = helpers.value(3);
          const upper = helpers.value(4);
          if (end - start <= 0 || upper - lower <= 0) return null;
          const [x1, yTop] = helpers.coord([start, upper]);
          const [x2, yBottom] = helpers.coord([end, lower]);
          const color = seriesColor(theme, name, seriesIndex);
          return {
            type: "rect",
            shape: {
              x: x1 + 0.5,
              y: yTop,
              width: Math.max(0, x2 - x1 - 1),
              height: Math.max(0, yBottom - yTop),
            },
            style: { fill: color, opacity: 0.9, stroke: theme.surface, lineWidth: 1 },
          };
        },
      })),
    };
  }, [columns, format, motion, theme]);

  return (
    <ChartSurface
      option={option}
      state={columns.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Mekko chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No weighted columns were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
