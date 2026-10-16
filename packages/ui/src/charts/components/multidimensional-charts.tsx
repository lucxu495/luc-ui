"use client";

import { useMemo } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { baseOption, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import type { FamilyCommonProps } from "./chart-common";

/**
 * Multidimensional, hierarchical and geographic charts.
 *
 * The three here share a property the rest of the catalogue does not have: they
 * all need something *outside* the rows — a shared scale, a parent/child
 * relation, a map. Each one therefore states exactly what the caller must
 * supply, and refuses to guess.
 */

/* -------------------------------------------------------------------------- */
/* Scatterplot matrix                                                          */
/* -------------------------------------------------------------------------- */

export interface ScatterMatrixChartProps extends FamilyCommonProps {
  /** Variables in the order they should appear on both axes. */
  variables: readonly { key: string; label: string; format?: ChartFormat }[];
  /** One row per observation, keyed by variable. */
  rows: readonly Record<string, number>[];
  /** Point colour, resolved by the caller (e.g. its cluster). */
  pointTone?: (row: Record<string, number>, index: number) => string | undefined;
  /** Cell height in px. The grid grows to fit. Default 120. */
  cellSize?: number;
  title?: string;
  description?: string;
}

/**
 * Scatterplot matrix (SPLOM).
 *
 * `n × (n − 1)` grids for `n` variables — the pairs *without* the diagonal,
 * because a variable plotted against itself carries no information and a
 * diagonal of histograms would double the render cost for a decoration. Cells
 * share an axis per row and column, which is what makes a correlation visible
 * as a slope.
 *
 * Past roughly six variables a parallel-coordinates plot is the better tool;
 * the Showcase's chart guidance says so, and this component will still render
 * (it just gets small).
 */
export function ScatterMatrixChart({
  variables,
  rows,
  pointTone,
  cellSize = 120,
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
}: ScatterMatrixChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const pairs: { x: number; y: number }[] = [];
    for (let y = 0; y < variables.length; y += 1) {
      for (let x = 0; x < variables.length; x += 1) {
        if (x !== y) pairs.push({ x, y });
      }
    }
    /*
     * One cell is `100 / n` percent of the canvas — not `cellSize / 100` percent.
     *
     * The previous arithmetic treated a pixel size as a percentage, so with the
     * default `cellSize = 120` every cell was **1.2%** of the width: twelve
     * postage stamps floating in a 480px canvas. The Phase 10A.1 report ("points
     * compressed into small isolated groups … large canvas with little meaningful
     * readable data") is that arithmetic, seen from the outside.
     *
     * `cellSize` keeps its documented meaning — the cell *height* in pixels, which
     * sets the surface height through `height ?? variables.length * cellSize`.
     */
    const share = 100 / Math.max(1, variables.length);
    const size = `${share.toFixed(4)}%`;
    return {
      ...baseOption(theme, motion),
      /*
       * One grid per cell. Only the bottom row and the left column carry tick
       * labels, so `containLabel` reserves the margin inside those panels and the
       * interior panels keep their full box.
       */
      grid: pairs.map((pair) => ({
        left: `${(pair.x * share).toFixed(4)}%`,
        top: `${(pair.y * share).toFixed(4)}%`,
        width: size,
        height: size,
        containLabel: true,
      })),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { value?: [number, number]; seriesName?: string; color?: string };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.seriesName,
            tooltipGridHtml([
              ["X", formatChartValue(item.value[0], { kind: "number" })],
              ["Y", formatChartValue(item.value[1], { kind: "number" })],
            ]),
          );
        },
      }),
      xAxis: pairs.map((pair, index) => ({
        gridIndex: index,
        type: "value",
        scale: true,
        /*
         * Three splits, not the engine's default five.
         *
         * A cell is a third of the canvas wide, so five percentage labels per cell
         * ran into each other ("−1.0% −0.5% 0.0% …" as one unbroken string, which
         * the renderer diagnostics reported as overlapping text boxes). Four ticks
         * over a 287px panel keeps roughly 70px of air per label.
         */
        splitNumber: 3,
        axisLine: { show: pair.y === variables.length - 1, lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          show: pair.y === variables.length - 1,
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          formatter: (value: number) => formatChartValue(value, variables[pair.x]?.format),
        },
        splitLine: { show: true, lineStyle: { color: theme.grid, opacity: 0.45 } },
      })),
      yAxis: pairs.map((pair, index) => ({
        gridIndex: index,
        type: "value",
        scale: true,
        splitNumber: 3,
        axisLine: { show: pair.x === 0, lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        axisLabel: {
          show: pair.x === 0,
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          formatter: (value: number) => formatChartValue(value, variables[pair.y]?.format),
        },
        splitLine: { show: true, lineStyle: { color: theme.grid, opacity: 0.45 } },
      })),
      series: pairs.map((pair, index) => ({
        name: `${variables[pair.y]?.label} × ${variables[pair.x]?.label}`,
        type: "scatter",
        xAxisIndex: index,
        yAxisIndex: index,
        symbolSize: 5,
        data: rows.map((row, rowIndex) => ({
          value: [row[variables[pair.x]?.key ?? ""], row[variables[pair.y]?.key ?? ""]],
          itemStyle: pointTone
            ? { color: pointTone(row, rowIndex) ?? theme.accent, opacity: 0.7 }
            : { color: theme.accent, opacity: 0.6 },
        })),
      })),
    };
    /* `cellSize` is deliberately absent: it sizes the *surface* (`height ??
     * variables.length * cellSize`) and no longer the cell geometry. */
  }, [motion, pointTone, rows, theme, variables]);

  return (
    <ChartSurface
      option={option}
      state={rows.length === 0 || variables.length < 2 ? "empty" : state}
      height={height ?? variables.length * cellSize}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Scatterplot matrix"}
      ariaDescription={ariaDescription ?? description}
      copy={{
        emptyTitle: "Nothing to plot",
        emptyDescription: "A scatterplot matrix needs at least two variables and one observation.",
      }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Hierarchy / tree                                                            */
/* -------------------------------------------------------------------------- */

export interface HierarchyTreeNode {
  name: string;
  value?: number;
  children?: readonly HierarchyTreeNode[];
  /** Optional tone key; resolved through the theme's series palette. */
  tone?: string;
  /** Collapse this subtree on first render. */
  collapsed?: boolean;
}

export interface HierarchyTreeChartProps extends FamilyCommonProps {
  /** The root. A dendrogram of one leaf is a label, not a chart. */
  root: HierarchyTreeNode;
  /** `left-right` is a dendrogram; `radial` is an org chart. Default `left-right`. */
  orientation?: "left-right" | "right-left" | "top-bottom" | "bottom-top" | "radial";
  /** Path of labels drawn on the edges. */
  edgeShape?: "curve" | "polyline";
  /** Show the leaf labels. Default `true`. */
  labels?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Hierarchy tree — a dendrogram, a file tree or an org chart.
 *
 * ECharts' own `tree` series supplies the layout and the collapse interaction,
 * which is the right division: the layout is geometry, not a statistic. The
 * component's job is the label model and the tone contract — a leaf takes its
 * colour from its own `tone` so an editing tree and a JSON inspector can colour
 * the same shape differently without forking the component.
 */
export function HierarchyTreeChart({
  root,
  orientation = "left-right",
  edgeShape = "curve",
  labels = true,
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
}: HierarchyTreeChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    /*
     * Where a node's label goes, and how much room the layout leaves for it.
     *
     * ECharts' tree series defaults `label.position` to `"left"` whatever the
     * orientation, so an LR tree drew **every** label to the left of its node: the
     * root's label fell outside the 16px margin ("ortfolio" in the Phase 10A.1
     * screenshot) and the leaf labels ran off the right edge, where the longest one
     * was clipped ("Sovere…"). The padding is derived from the same decision, so
     * the side a label grows towards is the side that was reserved for it.
     */
    const radial = orientation === "radial";
    const labelPlacement = radial
      ? { position: "radial" as const, room: 24 }
      : {
          "left-right": { position: "right" as const, room: 132 },
          "right-left": { position: "left" as const, room: 132 },
          "top-bottom": { position: "bottom" as const, room: 44 },
          "bottom-top": { position: "top" as const, room: 44 },
        }[orientation];
    let toneIndex = 0;
    const toNode = (node: HierarchyTreeNode): Record<string, unknown> => {
      const color = node.tone ? seriesColor(theme, node.tone, toneIndex++) : theme.textMuted;
      return {
        name: node.name,
        value: node.value,
        collapsed: node.collapsed,
        itemStyle: { color },
        label: {
          color: labels ? theme.textPrimary : "transparent",
          fontFamily: theme.fontFamily,
          fontSize: theme.fontCaption,
          position: labelPlacement.position,
          /*
           * A label that is too long for the reserved margin is truncated rather
           * than clipped by the canvas — the reader sees that it was shortened
           * instead of seeing half a word and assuming the other half.
           */
          overflow: "truncate",
          ellipsis: "…",
          width: labelPlacement.room - 12,
        },
        children: node.children?.map(toNode),
        symbolSize: node.children?.length ? 8 : 6,
      };
    };
    /*
     * ECharts' `orient` is an enum of four two-letter values, not the words a
     * reader uses. Passing "left-right" leaves the layout without a direction,
     * which is a crash inside the engine's view-coordinate pass rather than a
     * fallback — so the mapping is explicit here and the public prop keeps the
     * readable names.
     */
    const orientByOrientation: Record<Exclude<typeof orientation, "radial">, string> = {
      "left-right": "LR",
      "right-left": "RL",
      "top-bottom": "TB",
      "bottom-top": "BT",
    };
    const orient = radial ? undefined : orientByOrientation[orientation];
    return {
      ...baseOption(theme, motion),
      series: [
        {
          type: "tree",
          data: [toNode(root)],
          left: radial ? "50%" : orientation === "right-left" ? labelPlacement.room : 24,
          right: radial ? undefined : orientation === "left-right" ? labelPlacement.room : 24,
          top: radial ? 16 : orientation === "bottom-top" ? labelPlacement.room : 24,
          bottom: radial ? 16 : orientation === "top-bottom" ? labelPlacement.room : 24,
          layout: radial ? "radial" : "orthogonal",
          ...(radial ? {} : { orient }),
          edgeShape,
          edgeForkPosition: "58%",
          roam: true,
          symbol: "circle",
          initialTreeDepth: 4,
          expandAndCollapse: true,
          lineStyle: { color: theme.gridStrong, width: 1.2, curveness: 0.4 },
          emphasis: { focus: "descendant" },
        },
      ],
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { name?: string; value?: number; color?: string };
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([["Value", formatChartValue(item.value, format)]]),
          );
        },
      }),
    };
  }, [edgeShape, format, labels, motion, orientation, root, theme]);

  const leafCount = useMemo(() => {
    const walk = (node: HierarchyTreeNode): number =>
      node.children?.length ? node.children.reduce((sum, child) => sum + walk(child), 0) : 1;
    return walk(root);
  }, [root]);

  return (
    <ChartSurface
      option={option}
      state={leafCount === 0 ? "empty" : state}
      height={height ?? 320}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Hierarchy"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "The tree has no leaves." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Geographic scatter                                                          */
/* -------------------------------------------------------------------------- */

export interface GeoPoint {
  name: string;
  /** `[longitude, latitude]` in WGS-84. */
  coordinates: readonly [number, number];
  value: number;
}

export interface GeoScatterChartProps extends FamilyCommonProps {
  /**
   * A map name registered with `registerEChartsMap`.
   *
   * LUC ships **no map data**: a world or country boundary file is tens to
   * hundreds of kilobytes, it has a licence, and bundling one would impose a
   * political boundary set on every consumer. Registration is therefore the
   * caller's explicit step.
   */
  mapName: string;
  points: readonly GeoPoint[];
  valueFormat?: ChartFormat;
  /** Symbol size in px for the largest value. Default 22. */
  maxSymbolSize?: number;
  /** Draw the map's own region fills under the points. Default `true`. */
  showRegions?: boolean;
  /**
   * Geographic bounds of the registered map, `[[west, north], [east, south]]`.
   *
   * ECharts normally derives the view rectangle from the registered regions. A
   * map whose GeoJSON carries no projection metadata (a hand-built fixture, a
   * grid, a synthetic test map) can leave that rectangle undefined, and the
   * engine then fails inside its own view-coordinate update. Passing the bounds
   * explicitly is the documented escape hatch.
   */
  boundingCoords?: readonly [readonly [number, number], readonly [number, number]];
  /** `scatter` over a map, or `effectScatter` for a live feed. */
  variant?: "scatter" | "effect";
  title?: string;
  description?: string;
}

/**
 * Geographic scatter — one point per location on a caller-registered map.
 *
 * This is the honest half of the geographic brief. A point map needs only a
 * base map for context, so it works the moment a consumer registers one; a
 * *choropleth* additionally needs a value per region, which is a different
 * contract (see the ecosystem roadmap — `MapChart` is blocked on shipping or
 * requiring region data, not on engine support).
 */
export function GeoScatterChart({
  mapName,
  points,
  valueFormat,
  maxSymbolSize = 22,
  showRegions = true,
  boundingCoords,
  variant = "scatter",
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
}: GeoScatterChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const values = points.map((point) => point.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    return {
      ...baseOption(theme, motion),
      geo: {
        map: mapName,
        roam: true,
        zoom: 1.1,
        ...(boundingCoords ? { boundingCoords: [boundingCoords[0], boundingCoords[1]] } : {}),
        itemStyle: {
          areaColor: showRegions ? theme.surfaceRaised : "transparent",
          borderColor: theme.gridStrong,
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: { areaColor: theme.surfaceOverlay },
          label: { show: false },
        },
        select: { disabled: true },
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { name?: string; value?: [number, number, number] };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.name,
            tooltipGridHtml([
              ["Value", formatChartValue(item.value[2], valueFormat)],
              [
                "Coordinates",
                `${item.value[0].toFixed(3)}, ${item.value[1].toFixed(3)}`,
              ],
            ]),
          );
        },
      }),
      visualMap: {
        show: true,
        min,
        max,
        left: 8,
        bottom: 8,
        itemWidth: 10,
        itemHeight: 70,
        calculable: false,
        textStyle: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontMicro },
        inRange: { color: [...theme.sequentialAnchors] },
        dimension: 2,
      },
      series: [
        {
          name: title ?? "Locations",
          type: variant === "effect" ? "effectScatter" : "scatter",
          coordinateSystem: "geo",
          ...(variant === "effect" ? { rippleEffect: { scale: 2.4, brushType: "stroke" } } : {}),
          symbolSize: (value: unknown) => {
            const point = value as [number, number, number];
            const span = max - min;
            const ratio = span > 0 ? (point[2] - min) / span : 0.5;
            return 6 + Math.sqrt(Math.max(0, ratio)) * (maxSymbolSize - 6);
          },
          itemStyle: { borderColor: theme.surface, borderWidth: 1 },
          emphasis: { label: { show: false }, itemStyle: { borderWidth: 2 } },
          data: points.map((point) => ({
            name: point.name,
            value: [point.coordinates[0], point.coordinates[1], point.value],
          })),
        },
      ],
    };
  }, [boundingCoords, mapName, maxSymbolSize, motion, points, showRegions, theme, title, valueFormat, variant]);

  return (
    <ChartSurface
      option={option}
      state={points.length === 0 || !mapName ? "empty" : state}
      height={height ?? 380}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Geographic scatter"}
      ariaDescription={ariaDescription ?? description}
      copy={{
        emptyTitle: "Nothing to plot",
        emptyDescription: "Register a map with registerEChartsMap, then supply points.",
      }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
