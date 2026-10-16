"use client";

import { useMemo } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import type { FamilyCommonProps } from "./chart-common";

/**
 * Scientific charts — geometry, fields and spectra.
 *
 * These families exist because a scientific reader needs a shape that a
 * business chart cannot express: a phase portrait, a field of arrows, a
 * spectrogram, a ternary composition. Every one of them takes **prepared**
 * data. Where a transform is unavoidable (a streamgraph's own layout) it is
 * delegated to the engine and named in the contract, never invented here.
 *
 * Three of them are the "custom series" family: contour, ternary and hexbin.
 * They share one rendering discipline — a polygon per datum, tone from the
 * theme, no engine default that could drift from the rest of the system.
 */

/* -------------------------------------------------------------------------- */
/* Parallel coordinates                                                        */
/* -------------------------------------------------------------------------- */

export interface ParallelAxisSpec {
  /** Key into each row. */
  key: string;
  label: string;
  /** Optional fixed bounds; omit to let the engine use the data extent. */
  min?: number;
  max?: number;
  format?: ChartFormat;
  invert?: boolean;
}

export interface ParallelCoordinatesChartProps extends FamilyCommonProps {
  axes: readonly ParallelAxisSpec[];
  /** One entry per observation. Missing keys leave the polyline discontinuous. */
  rows: readonly Record<string, number>[];
  /** Optional per-row tone resolved by the caller (e.g. its cluster or class). */
  rowTone?: (row: Record<string, number>, index: number) => SeriesTone | undefined;
  /** Fade the polylines so overlapping observations stay readable. */
  opacity?: number;
  /** Colour lines by a numeric key instead of by a flat tone. */
  visualKey?: string;
  title?: string;
  description?: string;
}

/**
 * Parallel coordinates — the readable alternative to a scatterplot matrix past
 * four dimensions.
 *
 * Each axis is independent, so an observation is a polyline through its own
 * values. The component brushes nothing on its own: brushing is `onEvent`
 * territory in a caller that owns selection state, and pretending otherwise
 * would silently couple this chart to one interaction model.
 */
export function ParallelCoordinatesChart({
  axes,
  rows,
  rowTone,
  opacity = 0.45,
  visualKey,
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
}: ParallelCoordinatesChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      parallel: {
        left: 12,
        right: 24,
        top: 24,
        bottom: 16,
        parallelAxisDefault: {
          type: "value",
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisTick: { lineStyle: { color: theme.axisLine } },
          axisLabel: {
            color: theme.axisLabel,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontCaption,
          },
          nameTextStyle: {
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontCaption,
          },
          splitLine: { show: false },
        },
      },
      parallelAxis: axes.map((axis, index) => ({
        dim: index,
        name: axis.label,
        min: axis.min,
        max: axis.max,
        inverse: axis.invert,
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          formatter: (value: number) => formatChartValue(value, axis.format),
        },
      })),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { data?: number[]; dataIndex?: number };
          if (!item.data) return "";
          return tooltipShellHtml(
            `Observation ${(item.dataIndex ?? 0) + 1}`,
            tooltipGridHtml(
              axes.map((axis, index) => [axis.label, formatChartValue(item.data?.[index], axis.format)] as const),
            ),
          );
        },
      }),
      ...(visualKey
        ? {
            visualMap: {
              show: false,
              dimension: axes.findIndex((axis) => axis.key === visualKey),
              min: 0,
              max: 1,
              inRange: { color: [...theme.sequentialAnchors] },
            },
          }
        : {}),
      series: [
        {
          name: title ?? "Observations",
          type: "parallel",
          smooth: false,
          lineStyle: {
            width: 1.4,
            opacity,
            color: visualKey ? undefined : theme.accent,
          },
          emphasis: { lineStyle: { width: 3, opacity: 1 } },
          data: rows.map((row, index) => ({
            value: axes.map((axis) => row[axis.key]),
            lineStyle: rowTone
              ? { color: seriesColor(theme, rowTone(row, index) ?? "neutral", index), opacity }
              : undefined,
          })),
        },
      ],
    };
  }, [axes, motion, opacity, rows, rowTone, theme, title, visualKey]);

  return (
    <ChartSurface
      option={option}
      state={rows.length === 0 || axes.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Parallel coordinates"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No observations were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Polar rose / wind rose                                                      */
/* -------------------------------------------------------------------------- */

export interface PolarRoseChartProps extends FamilyCommonProps {
  data: readonly { name: string; value: number }[];
  /** `rose` (Nightingale) varies the radius; `radius` varies the radius too but
   *  keeps the slices even. `pie` is the flat composition for comparison. */
  variant?: "rose" | "pie" | "donut";
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/** Nightingale rose — a composition where the angle is not the measurement. */
export function PolarRoseChart({
  data,
  variant = "rose",
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
}: PolarRoseChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { name?: string; value?: number; percent?: number; color?: string };
          return tooltipShellHtml(
            item.name,
            tooltipRowHtml(item.name ?? "", formatChartValue(item.value, format), item.color),
          );
        },
      }),
      series: [
        {
          type: "pie",
          radius: variant === "donut" ? ["42%", "76%"] : "78%",
          center: ["50%", "52%"],
          roseType: variant === "rose" ? "radius" : undefined,
          itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 3 },
          label: {
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontCaption,
            formatter: "{b}",
          },
          labelLine: { lineStyle: { color: theme.axisLine } },
          emphasis: { scale: true, scaleSize: 6 },
          data: data.map((entry, index) => ({
            name: entry.name,
            value: entry.value,
            itemStyle: { color: seriesColor(theme, entry.name, index) },
          })),
        },
      ],
    };
  }, [data, format, motion, theme, variant]);

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Polar rose chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No categories were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface WindRoseChartProps extends FamilyCommonProps {
  /** Compass or sector labels, in order. */
  directions: readonly string[];
  series: readonly {
    label: string;
    /** One value per direction. */
    values: readonly number[];
    tone?: SeriesTone;
  }[];
  format?: ChartFormat;
  /** Start the first sector at the top rather than at 3 o'clock. Default `true`. */
  northUp?: boolean;
  title?: string;
  description?: string;
}

/** Wind rose — a stacked polar histogram of speed bins per direction. */
export function WindRoseChart({
  directions,
  series,
  format,
  northUp = true,
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
}: WindRoseChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const sectorAngle = directions.length > 0 ? 360 / directions.length : 30;
    return {
      ...baseOption(theme, motion),
      polar: { radius: ["10%", "78%"], center: ["50%", "52%"] },
      angleAxis: {
        type: "category",
        data: [...directions],
        startAngle: northUp ? 90 : 0,
        boundaryGap: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: theme.grid } },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          interval: Math.max(0, Math.ceil(directions.length / 12) - 1),
        },
      },
      radiusAxis: {
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          formatter: (value: number) => formatChartValue(value, format),
        },
        splitLine: { lineStyle: { color: theme.grid } },
      },
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { name?: string } | undefined;
          const rows = list.map((entry) => {
            const item = entry as { seriesName?: string; value?: number; color?: string };
            return tooltipRowHtml(item.seriesName ?? "", formatChartValue(item.value, format), item.color);
          });
          return tooltipShellHtml(first?.name, `<div>${rows.join("")}</div>`);
        },
      }),
      series: series.map((entry, index) => ({
        name: entry.label,
        type: "bar",
        coordinateSystem: "polar",
        stack: "rose",
        barCategoryGap: `${Math.max(0, (sectorAngle - 14) / 2)}%`,
        itemStyle: {
          color: seriesColor(theme, entry.tone ?? entry.label, index),
          borderColor: theme.surface,
          borderWidth: 1,
        },
        data: [...entry.values],
      })),
    };
  }, [directions, format, motion, northUp, series, theme]);

  return (
    <ChartSurface
      option={option}
      state={directions.length === 0 || series.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Wind rose"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No directional bins were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Ternary                                                                     */
/* -------------------------------------------------------------------------- */

export interface TernaryPoint {
  /** Share of the first vertex, 0–1. */
  a: number;
  /** Share of the second vertex, 0–1. */
  b: number;
  /** Share of the third vertex, 0–1. */
  c: number;
  label?: string;
}

export interface TernaryChartProps extends FamilyCommonProps {
  points: readonly TernaryPoint[];
  /** Vertex labels, anticlockwise from the top. */
  corners?: readonly [string, string, string];
  /** Draw the 10% grid. Default `true`. */
  grid?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Ternary (triangle) plot — a composition where the three shares sum to one.
 *
 * The mapping from barycentric coordinates to the plot is the only maths in the
 * component, and it is exact: `a` is the top vertex, `b` bottom-right, `c`
 * bottom-left. A point whose shares do not sum to 1 is drawn where its
 * *normalised* shares put it, and the tooltip reports the shares it was given —
 * the chart never rewrites a caller's data.
 */
export function TernaryChart({
  points,
  corners = ["A", "B", "C"],
  grid = true,
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
}: TernaryChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const SIZE = 100;
    const HEIGHT = (Math.sqrt(3) / 2) * SIZE;
    /** Barycentric → Cartesian, with `a` at the apex. */
    const project = (a: number, b: number, c: number): [number, number] => {
      const total = a + b + c;
      const [na, nb, nc] = total > 0 ? [a / total, b / total, c / total] : [1 / 3, 1 / 3, 1 / 3];
      const x = nc * 0 + nb * SIZE + na * (SIZE / 2);
      const y = nc * HEIGHT + nb * HEIGHT + na * 0;
      return [x, y];
    };
    const triangle = [
      project(1, 0, 0),
      project(0, 1, 0),
      project(0, 0, 1),
    ];
    const gridLines: { points: [number, number][] }[] = [];
    if (grid) {
      for (let step = 1; step < 10; step += 1) {
        const t = step / 10;
        gridLines.push({ points: [project(1 - t, t, 0), project(1 - t, 0, t)] });
        gridLines.push({ points: [project(t, 1 - t, 0), project(0, 1 - t, t)] });
        gridLines.push({ points: [project(t, 0, 1 - t), project(0, t, 1 - t)] });
      }
    }
    return {
      ...baseOption(theme, motion),
      grid: { left: 24, right: 24, top: 24, bottom: 24, containLabel: false },
      xAxis: { type: "value", min: -4, max: SIZE + 4, show: false },
      yAxis: { type: "value", min: -4, max: HEIGHT + 8, show: false, inverse: true },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const point = points[item.dataIndex ?? 0];
          if (!point) return "";
          return tooltipShellHtml(
            point.label ?? `Point ${(item.dataIndex ?? 0) + 1}`,
            tooltipGridHtml([
              [corners[0], formatChartValue(point.a, format)],
              [corners[1], formatChartValue(point.b, format)],
              [corners[2], formatChartValue(point.c, format)],
            ]),
          );
        },
      }),
      series: [
        {
          name: "Grid",
          type: "custom",
          silent: true,
          z: 1,
          data: [[0, 0]],
          /*
           * A `custom` series paints in **pixel** space: these shapes are in data
           * units, so every vertex goes through `api.coord`. Without it the
           * triangle lands in the top-left corner of the canvas and a reader sees
           * an empty box with six labels floating in it.
           */
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as { coord: (value: [number, number]) => [number, number] };
            const toPixel = (points: readonly (readonly [number, number])[]) =>
              points.map((point) => helpers.coord([point[0], point[1]])) as [number, number][];
            return {
              type: "group",
              children: [
                {
                  type: "polygon",
                  shape: { points: toPixel(triangle) },
                  style: { fill: "transparent", stroke: theme.axisLine, lineWidth: 1.2 },
                },
                ...gridLines.map((line) => ({
                  type: "polyline",
                  shape: { points: toPixel(line.points) },
                  style: { fill: "transparent", stroke: theme.grid, lineWidth: 1 },
                })),
              ],
            };
          },
        },
        {
          name: title ?? "Composition",
          type: "scatter",
          z: 3,
          symbolSize: 8,
          data: points.map((point) => ({
            value: project(point.a, point.b, point.c),
            name: point.label,
          })),
          itemStyle: { color: theme.accent, borderColor: theme.surface, borderWidth: 1.5 },
          label: {
            show: true,
            position: "top",
            formatter: (params: unknown) => (params as { name?: string }).name ?? "",
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
          },
        },
      ],
    };
  }, [corners, format, grid, motion, points, theme, title]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Ternary plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No compositions were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Vector field                                                                */
/* -------------------------------------------------------------------------- */

export interface VectorFieldChartProps extends FamilyCommonProps {
  /** One arrow per sample: a tail at `(x, y)` and a direction `(u, v)`. */
  vectors: readonly { x: number; y: number; u: number; v: number }[];
  /** Arrow length multiplier. 1 keeps the raw magnitude. */
  scale?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Vector field / quiver plot.
 *
 * Draws the arrows it is given, at the magnitude it is given — no
 * normalisation, no autoscaling that would hide a weak region. `scale` is the
 * caller's explicit choice and is reported in the tooltip so a reader is never
 * misled about magnitude.
 */
export function VectorFieldChart({
  vectors,
  scale = 1,
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
}: VectorFieldChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    /*
     * The domain must contain the *arrow tips*, not only the sample points.
     *
     * A vector field is drawn from each sample to sample + (u, v)·scale. When the
     * axes are left to infer their domain from the sample coordinates, every arrow
     * that leaves the sampling lattice is clipped by the plot box — which is what
     * the Phase 10A.1 report saw as "a few disconnected diagonal lines" with "large
     * empty plot regions": nine arrows became six fragments pinned to the edges.
     * Computing the bounds over tails *and* tips (with a small margin for the
     * arrowheads) is what makes the field readable.
     */
    const bounds = vectors.reduce(
      (acc, vector) => {
        const tipX = vector.x + vector.u * scale;
        const tipY = vector.y + vector.v * scale;
        return {
          xMin: Math.min(acc.xMin, vector.x, tipX),
          xMax: Math.max(acc.xMax, vector.x, tipX),
          yMin: Math.min(acc.yMin, vector.y, tipY),
          yMax: Math.max(acc.yMax, vector.y, tipY),
        };
      },
      {
        xMin: Number.POSITIVE_INFINITY,
        xMax: Number.NEGATIVE_INFINITY,
        yMin: Number.POSITIVE_INFINITY,
        yMax: Number.NEGATIVE_INFINITY,
      },
    );
    const finite = Number.isFinite(bounds.xMin) && Number.isFinite(bounds.yMin);
    const padX = finite ? (bounds.xMax - bounds.xMin || 1) * 0.08 : 1;
    const padY = finite ? (bounds.yMax - bounds.yMin || 1) * 0.08 : 1;
    const domain = finite
      ? {
          xMin: bounds.xMin - padX,
          xMax: bounds.xMax + padX,
          yMin: bounds.yMin - padY,
          yMax: bounds.yMax + padY,
        }
      : undefined;
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      xAxis: {
        ...axisFragment({
          type: "value",
          theme,
          format: xFormat,
          ...(domain ? { min: domain.xMin, max: domain.xMax } : { scale: true }),
        }),
      },
      yAxis: {
        ...axisFragment({
          type: "value",
          theme,
          format: yFormat,
          ...(domain ? { min: domain.yMin, max: domain.yMax } : { scale: true }),
        }),
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const vector = vectors[item.dataIndex ?? 0];
          if (!vector) return "";
          return tooltipShellHtml(
            "Vector",
            tooltipGridHtml([
              ["Magnitude", formatChartValue(Math.hypot(vector.u, vector.v), { kind: "number" })],
              ["Direction", `${formatChartValue(vector.u, xFormat)}, ${formatChartValue(vector.v, yFormat)}`],
              ["Scale", `${scale}×`],
            ]),
          );
        },
      }),
      series: [
        {
          name: "Field",
          /*
           * A `custom` series rather than `lines`. `lines` is built for a few
           * hundred routed paths and draws its head with a symbol; a quiver plot
           * is one shaft plus one head *per sample*, and at a few hundred samples
           * the engine's own path handling renders only a fraction of them. The
           * custom renderer is also the only way to make the head size constant
           * while the shaft grows with magnitude — which is what makes a vector
           * field readable.
           */
          type: "custom",
          z: 2,
          data: vectors.map((vector) => [vector.x, vector.y, vector.u * scale, vector.v * scale]),
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              value: (dimension: number) => number;
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const [tailX, tailY] = helpers.coord([helpers.value(0), helpers.value(1)]);
            const [headX, headY] = helpers.coord([
              helpers.value(0) + helpers.value(2),
              helpers.value(1) + helpers.value(3),
            ]);
            const dx = headX - tailX;
            const dy = headY - tailY;
            const length = Math.hypot(dx, dy);
            if (length < 1.5) return null;
            /* A floor on the head length: a short vector still has to look like a
               vector rather than like a dot with a tail. */
            const head = Math.min(10, Math.max(5, length * 0.4));
            const angle = Math.atan2(dy, dx);
            const wing = 0.42;
            return {
              type: "group",
              children: [
                {
                  type: "line",
                  shape: { x1: tailX, y1: tailY, x2: headX, y2: headY },
                  style: { ...helpers.style(), stroke: theme.accent, lineWidth: 1.3, opacity: 0.85 },
                },
                {
                  type: "polygon",
                  shape: {
                    points: [
                      [headX, headY],
                      [
                        headX - head * Math.cos(angle - wing),
                        headY - head * Math.sin(angle - wing),
                      ],
                      [
                        headX - head * Math.cos(angle + wing),
                        headY - head * Math.sin(angle + wing),
                      ],
                    ],
                  },
                  style: { ...helpers.style(), fill: theme.accent, opacity: 0.9 },
                },
              ],
            };
          },
        },
      ],
    };
  }, [motion, scale, theme, vectors, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={vectors.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Vector field"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No vectors were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Contour                                                                     */
/* -------------------------------------------------------------------------- */

export interface ContourLevel {
  /** The iso value this ring marks. Drawn in the label. */
  level: number;
  /** Closed rings at that level; each ring is a list of `[x, y]`. */
  rings: readonly (readonly [number, number][])[];
}

export interface ContourChartProps extends FamilyCommonProps {
  levels: readonly ContourLevel[];
  /** The sampled surface, drawn under the lines as a field. */
  surface?: readonly { x: number; y: number; z: number }[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  zFormat?: ChartFormat;
  /** Label the iso lines. Default `true`. */
  labels?: boolean;
  title?: string;
  description?: string;
}

/**
 * Contour / iso-line plot.
 *
 * The rings are supplied by the caller (a marching-squares pass in the analysis
 * layer). LUC draws them at the level they claim and can print that level on the
 * line, so a reader can tell two adjacent contours apart without a legend.
 */
export function ContourChart({
  levels,
  surface,
  xFormat,
  yFormat,
  zFormat,
  labels = true,
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
}: ContourChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const values = levels.flatMap((level) => level.rings.flatMap((ring) => ring.map((point) => point[1])));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      xAxis: { ...axisFragment({ type: "value", theme, format: xFormat, scale: true }) },
      yAxis: { ...axisFragment({ type: "value", theme, format: yFormat, scale: true }) },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: number[] };
          return tooltipShellHtml(
            item.seriesName,
            tooltipGridHtml([
              ["Level", item.seriesName ?? ""],
              ["Position", `${formatChartValue(item.value?.[0], xFormat)}, ${formatChartValue(item.value?.[1], yFormat)}`],
            ]),
          );
        },
      }),
      series: [
        ...(surface
          ? [
              {
                name: "Surface",
                type: "scatter",
                symbolSize: 4,
                silent: true,
                data: surface.map((point) => [point.x, point.y, point.z]),
                itemStyle: { color: theme.grid, opacity: 0.6 },
              },
            ]
          : []),
        ...levels.map((level) => ({
          name: `Level ${level.level}`,
          type: "custom",
          z: 3,
          data: [[0, 0]],
          /*
           * The same rule as the ternary grid: `custom` shapes are pixels, so a
           * ring drawn in data units lands off-canvas and the chart reads empty.
           */
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as { coord: (value: [number, number]) => [number, number] };
            return {
              type: "group",
              children: level.rings.map((ring) => ({
                type: "polyline",
                shape: {
                  points: ring.map((point) => helpers.coord([point[0], point[1]])) as [number, number][],
                },
                style: {
                  fill: "transparent",
                  stroke: theme.accent,
                  lineWidth: 1.4,
                  opacity: 0.9,
                },
              })),
            };
          },
          ...(labels
            ? {
                label: {
                  show: true,
                  position: "start",
                  formatter: () => formatChartValue(level.level, zFormat),
                  color: theme.textMuted,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontMicro,
                },
              }
            : {}),
        })),
      ],
      visualMap: surface
        ? {
            show: false,
            min,
            max,
            dimension: 2,
            inRange: { color: [...theme.sequentialAnchors] },
          }
        : undefined,
    };
  }, [labels, levels, motion, surface, theme, xFormat, yFormat, zFormat]);

  return (
    <ChartSurface
      option={option}
      state={levels.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Contour plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No contour levels were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Spectrogram                                                                 */
/* -------------------------------------------------------------------------- */

export interface SpectrogramChartProps extends FamilyCommonProps {
  /** Time or frame labels along the horizontal axis. */
  xValues: readonly (string | number)[];
  /** Frequency bins, low to high or high to low — drawn in the order given. */
  yValues: readonly (string | number)[];
  /** `magnitude[y][x]`, typically dB. */
  values: readonly (readonly number[])[];
  /** Decibel reference drawn in the tooltip, e.g. `"dBFS"`. */
  unit?: string;
  /** Fix the colour ramp. Omit to use the observed extent. */
  range?: { min: number; max: number };
  title?: string;
  description?: string;
}

/**
 * Spectrogram / scalogram — a time–frequency heatmap.
 *
 * It is a heatmap by construction, but its contract is a *spectrum*: two signed
 * axes in physical order, a fixed dB range so two spectrograms are comparable,
 * and a tooltip that names the unit. A generic heatmap cannot state any of that.
 */
export function SpectrogramChart({
  xValues,
  yValues,
  values,
  unit = "dB",
  range,
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
}: SpectrogramChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const flat = values.flatMap((row, y) => row.map((value, x) => [x, y, value] as [number, number, number]));
    const extent = flat.reduce(
      (acc, [, , value]) => ({ min: Math.min(acc.min, value), max: Math.max(acc.max, value) }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ left: 8, right: 12, top: 12, bottom: 20, containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number, number] };
          if (!item.value) return "";
          const [x, y, value] = item.value;
          return tooltipShellHtml(
            String(xValues[x] ?? x),
            tooltipGridHtml([
              ["Frequency", String(yValues[y] ?? y)],
              [unit, formatChartValue(value, { kind: "number" })],
            ]),
          );
        },
      }),
      xAxis: {
        type: "category",
        data: xValues.map((value) => String(value)),
        splitArea: { show: false },
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          interval: Math.max(0, Math.ceil(xValues.length / 10) - 1),
        },
      },
      yAxis: {
        type: "category",
        data: yValues.map((value) => String(value)),
        splitArea: { show: false },
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          interval: Math.max(0, Math.ceil(yValues.length / 10) - 1),
        },
      },
      visualMap: {
        show: true,
        min: range?.min ?? (Number.isFinite(extent.min) ? extent.min : 0),
        max: range?.max ?? (Number.isFinite(extent.max) ? extent.max : 1),
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 10,
        itemHeight: 80,
        textStyle: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontMicro },
        inRange: { color: [...theme.sequentialAnchors] },
      },
      series: [
        {
          name: unit,
          type: "heatmap",
          data: flat,
          progressive: 4000,
          progressiveThreshold: 3000,
          itemStyle: { borderWidth: 0 },
          emphasis: { itemStyle: { borderColor: theme.accent, borderWidth: 1 } },
        },
      ],
    };
  }, [motion, range, theme, unit, values, xValues, yValues]);

  return (
    <ChartSurface
      option={option}
      state={values.length === 0 || xValues.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Spectrogram"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No spectrum samples were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Theme river (stream)                                                        */
/* -------------------------------------------------------------------------- */

export interface ThemeRiverEvent {
  /** `YYYY-MM-DD` or any string the axis can order. */
  date: string;
  name: string;
  value: number;
}

export interface ThemeRiverChartProps extends FamilyCommonProps {
  events: readonly ThemeRiverEvent[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Theme river — a stacked stream over time.
 *
 * The band layout (a symmetric silhouette around a moving baseline) is the
 * engine's, because it is a *layout* algorithm rather than a statistic: the
 * areas are the caller's numbers, placed so the whole shape can be read at
 * once. That is exactly the line between "a chart may place data" and "a chart
 * must not estimate it".
 */
export function ThemeRiverChart({
  events,
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
}: ThemeRiverChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ left: 8, right: 12, top: 32, bottom: 8, containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [string, number, string] };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.value[0],
            tooltipRowHtml(item.value[2], formatChartValue(item.value[1], format), theme.accent),
          );
        },
      }),
      singleAxis: {
        type: "time",
        top: 44,
        bottom: 28,
        left: 24,
        right: 24,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: "themeRiver",
          singleAxisIndex: 0,
          label: { show: false },
          itemStyle: { borderColor: theme.surface, borderWidth: 0.5 },
          emphasis: { itemStyle: { shadowBlur: 12, shadowColor: theme.grid } },
          data: events.map((event) => [event.date, event.value, event.name]),
        },
      ],
      color: [...theme.palette],
    };
  }, [events, format, motion, theme]);

  return (
    <ChartSurface
      option={option}
      state={events.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Theme river"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No stream events were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Ridgeline                                                                   */
/* -------------------------------------------------------------------------- */

export interface RidgelineGroup {
  label: string;
  /** Position along the value axis. */
  x: number;
  /** Density or frequency at that position, supplied. */
  density: number;
  tone?: SeriesTone;
}

export interface RidgelineChartProps extends FamilyCommonProps {
  /** Groups drawn top to bottom, each one stepped down by `overlap`. */
  groups: readonly { label: string; points: readonly RidgelineGroup[]; tone?: SeriesTone }[];
  /** Vertical step as a fraction of a row. 0.5 is a classic joyplot. */
  overlap?: number;
  xFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Ridgeline (joyplot) — many distributions stacked along one axis.
 *
 * The vertical offset is a *drawing* transform (the same category as a log
 * scale): the heights inside each ridge are the caller's densities, and the
 * overlap never changes a value. Overlap is capped at 1 so one row can never
 * fully hide the one beneath it.
 */
export function RidgelineChart({
  groups,
  overlap = 0.5,
  xFormat,
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
}: RidgelineChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const step = Math.min(1, Math.max(0.1, overlap));
    const maxDensity = groups.reduce(
      (max, group) => Math.max(max, ...group.points.map((point) => point.density), 0),
      0,
    );
    const rowHeight = maxDensity > 0 ? maxDensity : 1;
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20, top: 16, bottom: 8 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: [number, number]; color?: string };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.seriesName,
            tooltipRowHtml(formatChartValue(item.value[0], xFormat), formatChartValue(item.value[1], { kind: "number" }), item.color),
          );
        },
      }),
      xAxis: { ...axisFragment({ type: "value", theme, format: xFormat, scale: true }) },
      yAxis: {
        type: "value",
        min: 0,
        max: (groups.length - 1) * step + 1,
        show: false,
      },
      series: groups.map((group, index) => {
        const offset = (groups.length - 1 - index) * step;
        const color = seriesColor(theme, group.tone ?? group.label, index);
        return {
          name: group.label,
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.4, color },
          itemStyle: { color },
          areaStyle: { opacity: 0.42, color },
          data: [
            [group.points[0]?.x ?? 0, offset],
            ...group.points.map((point) => [point.x, offset + (point.density / rowHeight) * (1 - step * 0.1)]),
            [group.points[group.points.length - 1]?.x ?? 0, offset],
          ],
        };
      }),
    };
  }, [groups, motion, overlap, theme, xFormat]);

  return (
    <ChartSurface
      option={option}
      state={groups.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Ridgeline plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No ridges were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Hexbin                                                                      */
/* -------------------------------------------------------------------------- */

export interface HexbinCell {
  /** Bin centre. */
  x: number;
  y: number;
  /** The aggregated value (count, mean, sum — whatever the caller binned). */
  value: number;
  /** Optional label for the tooltip. */
  label?: string;
}

export interface HexbinChartProps extends FamilyCommonProps {
  cells: readonly HexbinCell[];
  /** Hex radius in axis units (the smoothing is done by the caller). */
  radius: number;
  valueFormat?: ChartFormat;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  /** Semantic name for the aggregated value, e.g. "Samples". */
  valueLabel?: string;
  title?: string;
  description?: string;
}

/**
 * Hexbin — density over a plane without overplotting.
 *
 * The bins are the caller's: hexbinning is an aggregation, and an aggregation
 * changes the answer, so the caller owns it. LUC owns the geometry (a regular
 * hexagon at `radius`), the ramp and the tooltip.
 */
export function HexbinChart({
  cells,
  radius,
  valueFormat,
  xFormat,
  yFormat,
  valueLabel = "Value",
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
}: HexbinChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const values = cells.map((cell) => cell.value);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      xAxis: { ...axisFragment({ type: "value", theme, format: xFormat, scale: true }) },
      yAxis: { ...axisFragment({ type: "value", theme, format: yFormat, scale: true }) },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const cell = cells[item.dataIndex ?? 0];
          if (!cell) return "";
          return tooltipShellHtml(
            cell.label ?? "Bin",
            tooltipGridHtml([
              ["X", formatChartValue(cell.x, xFormat)],
              ["Y", formatChartValue(cell.y, yFormat)],
              [valueLabel, formatChartValue(cell.value, valueFormat)],
            ]),
          );
        },
      }),
      visualMap: {
        show: false,
        min: Math.min(0, ...values),
        max: Math.max(1, ...values),
        dimension: 2,
        inRange: { color: [...theme.sequentialAnchors] },
      },
      series: [
        {
          name: valueLabel,
          /*
           * A scatter cannot scale its symbol with the axes, so the hexagons
           * are drawn by a custom renderer at `radius` in data units: the
           * geometry matches the bin the caller used, at any zoom.
           */
          type: "custom",
          z: 2,
          data: cells.map((cell) => [cell.x, cell.y, cell.value]),
          renderItem: (_params: unknown, api: unknown) => {
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              value: (dimension: number) => number;
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
              visual: (key: string) => unknown;
            };
            const x = helpers.value(0);
            const y = helpers.value(1);
            const [cx, cy] = helpers.coord([x, y]);
            const [edgeX] = helpers.coord([x + radius, y]);
            const [topEdge] = helpers.coord([x, y + radius]);
            const rx = Math.abs(edgeX - cx);
            const ry = Math.abs(topEdge - cy);
            const points = Array.from({ length: 6 }, (_, index) => {
              const angle = (Math.PI / 3) * index - Math.PI / 6;
              return [cx + rx * Math.cos(angle), cy - ry * Math.sin(angle)];
            });
            return {
              type: "polygon",
              shape: { points },
              style: {
                ...helpers.style(),
                fill: (helpers.visual("color") as string) ?? theme.accent,
                opacity: 0.85,
                stroke: theme.surface,
                lineWidth: 1,
              },
              emphasis: { style: { opacity: 1, stroke: theme.accent, lineWidth: 2 } },
            };
          },
        },
      ],
    };
  }, [cells, motion, radius, theme, valueFormat, valueLabel, xFormat, yFormat]);

  return (
    <ChartSurface
      option={option}
      state={cells.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Hexbin plot"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No hex bins were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
