"use client";

import { useMemo } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import type { FamilyCommonProps } from "./chart-common";

/**
 * Network and hierarchy charts.
 *
 * Both components here do exactly one thing the engine cannot: they compute a
 * **layout** from numbers the caller already owns. A chord layout turns a
 * supplied square matrix into angles; a dendrogram turns supplied merges into a
 * tree. Neither invents a statistic — there is no clustering, no correlation,
 * no linkage and no thresholding anywhere in this file.
 */

/* -------------------------------------------------------------------------- */
/* Chord                                                                       */
/* -------------------------------------------------------------------------- */

export interface ChordArc {
  index: number;
  label: string;
  /** Full angular span of the group, radians, counter-clockwise from 3 o'clock. */
  start: number;
  end: number;
  /** The sub-arc this group *sends* from. */
  sourceStart: number;
  sourceEnd: number;
  /** The sub-arc this group *receives* on. */
  targetStart: number;
  targetEnd: number;
  /** `outgoing + incoming` for this group. */
  total: number;
}

export interface ChordRibbon {
  source: number;
  target: number;
  value: number;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
}

export interface ChordLayout {
  arcs: ChordArc[];
  ribbons: ChordRibbon[];
  /** Sum of every cell. `0` when the matrix is empty. */
  total: number;
}

/**
 * Turn a square matrix into chord geometry.
 *
 * The convention is the standard one and is worth stating because a chord
 * diagram is easy to misread: group `i` occupies an arc proportional to its
 * *row sum plus column sum* (what it sends plus what it receives), the first
 * part of that arc is its outgoing side and the rest is its incoming side. So
 * the matrix must already mean something — flows, transitions, co-occurrence —
 * and the caller's row/column order is preserved exactly.
 *
 * Pure, total and exported: the geometry is testable without a browser, and a
 * consumer can build its own rendering from the same numbers.
 */
export function chordLayout(
  values: readonly (readonly number[])[],
  options: { gapAngle?: number; startAngle?: number } = {},
): ChordLayout {
  const size = values.length;
  if (size === 0) return { arcs: [], ribbons: [], total: 0 };
  const gap = options.gapAngle ?? 0.022;
  const matrix = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      const value = values[row]?.[column];
      return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
    }),
  );
  const outgoing = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const incoming = Array.from({ length: size }, (_, column) =>
    matrix.reduce((sum, row) => sum + (row[column] ?? 0), 0),
  );
  const total = outgoing.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { arcs: [], ribbons: [], total: 0 };

  const usable = Math.PI * 2 - gap * size;
  const weights = outgoing.map((value, index) => value + (incoming[index] ?? 0));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let cursor = options.startAngle ?? -Math.PI / 2;

  const arcs: ChordArc[] = weights.map((weight, index) => {
    const span = (weight / weightTotal) * usable;
    const start = cursor;
    const outgoingShare = weight > 0 ? (outgoing[index] ?? 0) / weight : 0;
    const sourceEnd = start + span * outgoingShare;
    const end = start + span;
    cursor = end + gap;
    return {
      index,
      label: String(index),
      start,
      end,
      sourceStart: start,
      sourceEnd,
      targetStart: sourceEnd,
      targetEnd: end,
      total: weight,
    };
  });

  // Allocate the source and target sub-arcs in ascending partner order, which is
  // what makes the ribbons cross predictably instead of at random.
  const sourceCursor = arcs.map((arc) => arc.sourceStart);
  const targetCursor = arcs.map((arc) => arc.targetStart);
  const ribbons: ChordRibbon[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const value = matrix[row]?.[column] ?? 0;
      if (value <= 0) continue;
      const sourceArc = arcs[row];
      const targetArc = arcs[column];
      if (!sourceArc || !targetArc) continue;
      const outgoingTotal = outgoing[row] ?? 0;
      const incomingTotal = incoming[column] ?? 0;
      const sourceSpan = outgoingTotal
        ? (sourceArc.sourceEnd - sourceArc.sourceStart) * (value / outgoingTotal)
        : 0;
      const targetSpan = incomingTotal
        ? (targetArc.targetEnd - targetArc.targetStart) * (value / incomingTotal)
        : 0;
      const sourceStart = sourceCursor[row] ?? sourceArc.sourceStart;
      const targetStart = targetCursor[column] ?? targetArc.targetStart;
      sourceCursor[row] = sourceStart + sourceSpan;
      targetCursor[column] = targetStart + targetSpan;
      ribbons.push({
        source: row,
        target: column,
        value,
        sourceStart,
        sourceEnd: sourceStart + sourceSpan,
        targetStart,
        targetEnd: targetStart + targetSpan,
      });
    }
  }

  return { arcs, ribbons, total };
}

export interface ChordChartProps extends FamilyCommonProps {
  /** Group names. The order is the matrix order. */
  labels: readonly string[];
  /** Square matrix: `values[source][target]`. Non-finite and negative cells are ignored. */
  values: readonly (readonly number[])[];
  /** Radial gap between groups, radians. Default 0.022. */
  gapAngle?: number;
  /** Inner radius as a share of the outer radius. Default 0.72. */
  innerRatio?: number;
  /** Ribbon opacity. Default 0.42. */
  ribbonOpacity?: number;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

interface CustomApi {
  getWidth: () => number;
  getHeight: () => number;
  style: (extra?: Record<string, unknown>) => Record<string, unknown>;
}

function polar(centerX: number, centerY: number, radius: number, angle: number): [number, number] {
  return [centerX + radius * Math.cos(angle), centerY - radius * Math.sin(angle)];
}

/**
 * The points along one arc, as `[x, y]` pairs.
 *
 * It returns *points* rather than a path string on purpose. The previous version
 * returned a complete `M…L…` path and was concatenated twice per shape, so every
 * ribbon and every ring band was built from **two unconnected subpaths** — the
 * renderer filled each one separately and a chord diagram came out as a set of
 * thin crescents hugging the circle instead of ribbons across the disc. The
 * Phase 10A.1 report described exactly that ("suspiciously shaped ribbons"), and
 * the cause was one `M` in the wrong place.
 */
function arcPoints(
  centerX: number,
  centerY: number,
  radius: number,
  from: number,
  to: number,
  steps: number,
): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return polar(centerX, centerY, radius, angle);
  });
}

/** Continue an existing path with a polyline through `points`. */
function lineTo(points: readonly [number, number][]): string {
  return points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

/** Start a path at a point. */
function moveTo([x, y]: [number, number]): string {
  return `M${x.toFixed(2)},${y.toFixed(2)}`;
}

export function ChordChart({
  labels,
  values,
  gapAngle = 0.022,
  innerRatio = 0.72,
  ribbonOpacity = 0.42,
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
}: ChordChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const layout = useMemo(() => chordLayout(values, { gapAngle }), [gapAngle, values]);
  const arcs = useMemo(
    () => layout.arcs.map((arc, index) => ({ ...arc, label: labels[index] ?? String(index) })),
    [labels, layout.arcs],
  );

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ left: 4, right: 4, top: 4, bottom: 4, containLabel: false }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const ribbon = layout.ribbons[item.dataIndex ?? 0];
          if (!ribbon) return "";
          const from = arcs[ribbon.source]?.label ?? String(ribbon.source);
          const to = arcs[ribbon.target]?.label ?? String(ribbon.target);
          return tooltipShellHtml(`${from} → ${to}`, tooltipGridHtml([["Value", formatChartValue(ribbon.value, format)]]));
        },
      }),
      xAxis: { type: "value", min: -1, max: 1, show: false },
      yAxis: { type: "value", min: -1, max: 1, show: false },
      series: [
        {
          name: "Relationships",
          type: "custom",
          z: 1,
          data: layout.ribbons.map((_ribbon, index) => [index]),
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const helpers = api as CustomApi;
            const ribbon = layout.ribbons[p.dataIndex];
            if (!ribbon) return { type: "group", children: [] };
            const width = helpers.getWidth();
            const heightPx = helpers.getHeight();
            const centerX = width / 2;
            const centerY = heightPx / 2;
            const radius = (Math.min(width, heightPx) / 2) * 0.9;
            const color = seriesColor(theme, arcs[ribbon.source]?.label ?? String(ribbon.source), ribbon.source);
            /*
             * One closed outline: the source arc, a curve through the centre to the
             * target arc, the target arc back, and the path closes. The two curves
             * are what make a ribbon read as a flow rather than as a slice, and they
             * are quadratic with the disc's centre as the control point — the
             * standard chord construction.
             */
            const sourceArc = arcPoints(centerX, centerY, radius, ribbon.sourceStart, ribbon.sourceEnd, 16);
            const targetArc = arcPoints(centerX, centerY, radius, ribbon.targetEnd, ribbon.targetStart, 16);
            const first = sourceArc[0] ?? [centerX, centerY];
            const second = targetArc[0] ?? [centerX, centerY];
            const path =
              `${moveTo(first)} ${lineTo(sourceArc.slice(1))} ` +
              `Q ${centerX.toFixed(2)},${centerY.toFixed(2)} ${second[0].toFixed(2)},${second[1].toFixed(2)} ` +
              `${lineTo(targetArc.slice(1))} Z`;
            return {
              type: "path",
              shape: { pathData: path },
              style: { ...helpers.style(), fill: color, opacity: ribbonOpacity, stroke: "none" },
              emphasis: { style: { opacity: Math.min(ribbonOpacity + 0.32, 0.95) } },
            };
          },
        },
        {
          name: "Groups",
          type: "custom",
          z: 2,
          silent: true,
          tooltip: { show: false },
          data: arcs.map((_arc, index) => [index]),
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const helpers = api as CustomApi;
            const arc = arcs[p.dataIndex];
            if (!arc) return { type: "group", children: [] };
            const width = helpers.getWidth();
            const heightPx = helpers.getHeight();
            const centerX = width / 2;
            const centerY = heightPx / 2;
            const radius = (Math.min(width, heightPx) / 2) * 0.9;
            const inner = radius * innerRatio;
            /*
             * An annulus is one outline too: outer arc, in to the inner radius,
             * inner arc back, close. Two subpaths drew two crescents, which is why
             * the ring band in the Phase 10A.1 screenshot had a hole through it.
             */
            const outerArc = arcPoints(centerX, centerY, radius, arc.start, arc.end, 24);
            const innerArc = arcPoints(centerX, centerY, inner, arc.end, arc.start, 24);
            const path = `${moveTo(outerArc[0] ?? [centerX, centerY])} ${lineTo(outerArc.slice(1))} ${lineTo(innerArc)} Z`;
            return {
              type: "path",
              shape: { pathData: path },
              style: {
                ...helpers.style(),
                fill: seriesColor(theme, arc.label, arc.index),
                stroke: theme.surface,
                lineWidth: 1,
              },
            };
          },
        },
        {
          name: "Labels",
          type: "custom",
          z: 3,
          silent: true,
          tooltip: { show: false },
          data: arcs.map((_arc, index) => [index]),
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const helpers = api as CustomApi;
            const arc = arcs[p.dataIndex];
            if (!arc) return { type: "group", children: [] };
            const width = helpers.getWidth();
            const heightPx = helpers.getHeight();
            const centerX = width / 2;
            const centerY = heightPx / 2;
            const radius = (Math.min(width, heightPx) / 2) * 0.9;
            const mid = (arc.start + arc.end) / 2;
            const [x, y] = polar(centerX, centerY, radius * 1.06, mid);
            const align = Math.cos(mid) >= 0 ? "left" : "right";
            return {
              type: "text",
              x: x + Math.cos(mid) * 4,
              y,
              style: {
                ...helpers.style(),
                text: arc.label,
                fill: theme.textPrimary,
                align,
                verticalAlign: "middle",
                font: `${theme.fontCaption}px ${theme.fontFamily}`,
              },
            };
          },
        },
      ],
    };
  }, [arcs, format, innerRatio, layout.ribbons, motion, ribbonOpacity, theme]);

  const empty = layout.total <= 0 || labels.length === 0;

  return (
    <ChartSurface
      option={option}
      state={empty ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Chord diagram"}
      ariaDescription={
        ariaDescription ??
        description ??
        "Arc length is the row plus column total for each group; each ribbon is one supplied matrix cell."
      }
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No matrix values were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Dendrogram                                                                  */
/* -------------------------------------------------------------------------- */

export interface DendrogramMerge {
  /** Identifies this internal node; must not collide with a leaf label. */
  id: string;
  left: string;
  right: string;
  /** The height the two branches join at — supplied, never derived. */
  height: number;
}

export interface DendrogramChartProps extends FamilyCommonProps {
  /** Leaf labels, left to right. */
  leaves: readonly string[];
  /** Merges in increasing height order, as the caller's own clustering produced them. */
  merges: readonly DendrogramMerge[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}

interface DendrogramSegment {
  leftX: number;
  rightX: number;
  leftHeight: number;
  rightHeight: number;
  height: number;
}

/**
 * A hierarchical clustering tree.
 *
 * LUC draws the tree; it does not cluster. `merges` is the linkage the caller
 * computed — the id, the two children and the join height — which means the
 * picture cannot disagree with the analysis, and a different linkage method is
 * a different set of merges rather than a hidden option here.
 */
export function DendrogramChart({
  leaves,
  merges,
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
}: DendrogramChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const { segments, maxHeight } = useMemo(() => {
    const positions = new Map<string, { x: number; height: number }>();
    leaves.forEach((label, index) => positions.set(label, { x: index, height: 0 }));
    const out: DendrogramSegment[] = [];
    let highest = 0;
    for (const merge of merges) {
      const left = positions.get(merge.left);
      const right = positions.get(merge.right);
      if (!left || !right) continue;
      const joinHeight = Number.isFinite(merge.height) ? merge.height : 0;
      positions.set(merge.id, { x: (left.x + right.x) / 2, height: joinHeight });
      out.push({
        leftX: left.x,
        leftHeight: left.height,
        rightX: right.x,
        rightHeight: right.height,
        height: joinHeight,
      });
      highest = Math.max(highest, joinHeight);
    }
    return { segments: out, maxHeight: highest };
  }, [leaves, merges]);

  const option = useMemo<Option>(() => {
    const lastIndex = Math.max(leaves.length - 1, 0);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, bottom: 4, top: 16 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number };
          const segment = segments[item.dataIndex ?? 0];
          if (!segment) return "";
          return tooltipShellHtml(
            "Merge",
            tooltipGridHtml([
              ["Height", formatChartValue(segment.height, format)],
              ["Branches", `${leaves[segment.leftX] ?? "?"} + ${leaves[segment.rightX] ?? "?"}`],
            ]),
          );
        },
      }),
      xAxis: {
        type: "value",
        min: 0,
        max: lastIndex,
        interval: 1,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          hideOverlap: false,
          formatter: (value: number) => leaves[Math.round(value)] ?? "",
        },
      },
      yAxis: axisFragment({ type: "value", theme, format, min: 0, max: maxHeight || undefined, scale: true }),
      series: [
        {
          name: "Merges",
          type: "custom",
          data: segments.map((_segment, index) => [index]),
          renderItem: (params: unknown, api: unknown) => {
            const p = params as { dataIndex: number };
            const segment = segments[p.dataIndex];
            if (!segment) return { type: "group", children: [] };
            const helpers = api as {
              coord: (value: [number, number]) => [number, number];
              style: (extra?: Record<string, unknown>) => Record<string, unknown>;
            };
            const [leftX, joinY] = helpers.coord([segment.leftX, segment.height]);
            const [rightX] = helpers.coord([segment.rightX, segment.height]);
            const [, leftTop] = helpers.coord([segment.leftX, segment.leftHeight]);
            const [, rightTop] = helpers.coord([segment.rightX, segment.rightHeight]);
            const stroke = { ...helpers.style(), stroke: theme.accent, lineWidth: 1.6, fill: "none" as const };
            return {
              type: "group",
              children: [
                { type: "line", shape: { x1: leftX, y1: leftTop, x2: leftX, y2: joinY }, style: stroke },
                { type: "line", shape: { x1: leftX, y1: joinY, x2: rightX, y2: joinY }, style: stroke },
                { type: "line", shape: { x1: rightX, y1: joinY, x2: rightX, y2: rightTop }, style: stroke },
              ],
            };
          },
        },
      ],
    };
  }, [format, leaves, maxHeight, motion, segments, theme]);

  return (
    <ChartSurface
      option={option}
      state={segments.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Dendrogram"}
      ariaDescription={
        ariaDescription ?? description ?? "Branch height is the join height supplied by the caller's clustering."
      }
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No merges were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
