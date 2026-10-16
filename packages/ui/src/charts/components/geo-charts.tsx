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
 * Geographic charts.
 *
 * LUC ships **no map data**: a boundary file is large, licensed and makes a
 * political statement on every consumer's behalf. A choropleth therefore takes
 * the *name* of a map the application registered with `registerEChartsMap`, and
 * the region identifiers it wants coloured. Everything else — the projection,
 * the simplification, the disputed names — stays the application's decision.
 */

export interface ChoroplethRegion {
  /** The value of `nameProperty` for this region in the registered GeoJSON. */
  id: string;
  /** `null` marks "no data" and is drawn in the missing colour, never as zero. */
  value: number | null;
}

export interface ChoroplethChartProps extends FamilyCommonProps {
  /** The name passed to `registerEChartsMap`. */
  mapName: string;
  regions: readonly ChoroplethRegion[];
  /** GeoJSON property that carries the region id. Default `"name"`. */
  nameProperty?: string;
  format?: ChartFormat;
  /** Legend caption, e.g. "Population per km²". */
  valueLabel?: string;
  /** Which ramp encodes the value. */
  ramp?: "sequential" | "diverging";
  title?: string;
  description?: string;
}

export function ChoroplethChart({
  mapName,
  regions,
  nameProperty = "name",
  format,
  valueLabel = "Value",
  ramp = "sequential",
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
}: ChoroplethChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const values = regions.map((region) => region.value).filter((value): value is number => typeof value === "number");
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 1;
    const anchors = ramp === "diverging" ? theme.divergingAnchors : theme.sequentialAnchors;
    const bound = Math.max(Math.abs(min), Math.abs(max));
    const rampMin = ramp === "diverging" ? -bound : min;
    const rampMax = ramp === "diverging" ? bound : max;

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: false, left: 0, right: 0, top: 0, bottom: 0 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { name?: string; value?: number | string };
          const supplied = regions.find((region) => region.id === item.name);
          const value = supplied?.value ?? null;
          return tooltipShellHtml(
            item.name ?? "Region",
            tooltipGridHtml([[valueLabel, value === null ? "No data" : formatChartValue(value, format)]]),
          );
        },
      }),
      visualMap: {
        type: "continuous",
        min: rampMin,
        max: rampMax,
        inRange: { color: [...anchors] },
        outOfRange: { color: [theme.borderSubtle] },
        text: [formatChartValue(rampMax, format), formatChartValue(rampMin, format)],
        textStyle: { color: theme.textMuted, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
        left: 8,
        bottom: 8,
        itemWidth: 10,
        itemHeight: 90,
        calculable: false,
        formatter: (value: number) => formatChartValue(value, format),
      },
      series: [
        {
          name: valueLabel,
          type: "map",
          map: mapName,
          nameProperty,
          roam: true,
          scaleLimit: { min: 1, max: 8 },
          selectedMode: false,
          /*
           * `NaN` for a region the caller did not supply is intentional: it is
           * what routes the shape through `outOfRange`, so "no data" is drawn
           * differently from a real zero.
           */
          data: regions.map((region) => ({ name: region.id, value: region.value ?? Number.NaN })),
          itemStyle: { borderColor: theme.surface, borderWidth: 0.6, areaColor: theme.borderSubtle },
          emphasis: {
            label: { show: true, color: theme.textPrimary, fontSize: theme.fontCaption },
            itemStyle: { areaColor: theme.accent },
          },
          select: { disabled: true },
        },
      ],
    };
  }, [format, mapName, motion, nameProperty, ramp, regions, theme, valueLabel]);

  return (
    <ChartSurface
      option={option}
      state={regions.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Choropleth map"}
      ariaDescription={
        ariaDescription ??
        description ??
        `Regions come from the "${mapName}" map the application registered; regions without a value are drawn as no-data.`
      }
      copy={{
        emptyTitle: "Nothing to plot",
        emptyDescription: `No regions were supplied for the "${mapName}" map.`,
      }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Geographic trajectories                                                     */
/* -------------------------------------------------------------------------- */

export interface GeoTrajectoryPoint {
  /** Longitude in degrees. */
  x: number;
  /** Latitude in degrees. */
  y: number;
  /** Optional timestamp or step index, shown in the tooltip. */
  t?: number;
}

export interface GeoTrajectory {
  id: string;
  label: string;
  points: readonly GeoTrajectoryPoint[];
  /** Draw with an animated emphasis — useful for a single highlighted route. */
  highlight?: boolean;
}

export interface GeoTrajectoryChartProps extends FamilyCommonProps {
  trajectories: readonly GeoTrajectory[];
  /**
   * Unwrap paths that cross the ±180° meridian by shifting a segment by a full
   * turn, so a route from 179°E to 179°W is drawn as a short hop instead of a
   * line across the whole chart. A display transform only: tooltips still
   * report the longitude the caller supplied.
   */
  unwrap?: boolean;
  xLabel?: string;
  yLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/** Shift a longitude sequence so a meridian crossing becomes a small step. */
export function unwrapLongitudes(points: readonly GeoTrajectoryPoint[]): GeoTrajectoryPoint[] {
  let offset = 0;
  let previousX: number | null = null;
  return points.map((point, index) => {
    if (index > 0 && previousX !== null) {
      const delta = point.x + offset - previousX;
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    const x = point.x + offset;
    previousX = x;
    return { ...point, x };
  });
}

export function GeoTrajectoryChart({
  trajectories,
  unwrap = true,
  xLabel = "Longitude",
  yLabel = "Latitude",
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
}: GeoTrajectoryChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const prepared = useMemo(
    () =>
      trajectories.map((trajectory) => ({
        ...trajectory,
        points: unwrap ? unwrapLongitudes(trajectory.points) : [...trajectory.points],
      })),
    [trajectories, unwrap],
  );

  const option = useMemo<Option>(() => {
    /*
     * The axes carry the domain, because the series carries no data.
     *
     * A `custom` series draws geometry, not values, so it contributes nothing to
     * the engine's data extent — leave the axes to the engine and the grid is
     * empty. The bounds are computed from the supplied coordinates with a small
     * margin, which is a *display* mapping exactly like the log axis: the
     * numbers themselves are the caller's.
     */
    const lons = prepared.flatMap((trajectory) => trajectory.points.map((point) => point.x));
    const lats = prepared.flatMap((trajectory) => trajectory.points.map((point) => point.y));
    const bounds = (values: number[]): [number, number] => {
      if (values.length === 0) return [0, 1];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const pad = (max - min || 1) * 0.08;
      return [min - pad, max + pad];
    };
    const [xMin, xMax] = bounds(lons);
    const [yMin, yMax] = bounds(lats);

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          // The route is identified by *series*, not by data index: every route
          // is one series with a single placeholder item, so `dataIndex` is
          // always 0 for all of them.
          const item = params as { seriesIndex?: number };
          const route = prepared[item.seriesIndex ?? 0];
          const first = route?.points[0];
          if (!route || !first) return "";
          return tooltipShellHtml(
            route.label,
            tooltipGridHtml([
              [xLabel, formatChartValue(first.x, format)],
              [yLabel, formatChartValue(first.y, format)],
              ["Points", String(route.points.length)],
            ]),
          );
        },
      }),
      /*
       * No axis `name`s. ECharts draws an axis name at the axis end, where it
       * collides with the opposite axis's tick labels on a full-width plot —
       * the captions would then be half-hidden, which is worse than absent. The
       * units are stated where a value is actually read: the tooltip rows and
       * the accessible description.
       */
      xAxis: axisFragment({ type: "value", theme, min: xMin, max: xMax, scale: true }),
      yAxis: axisFragment({ type: "value", theme, position: "right", min: yMin, max: yMax, scale: true }),
      series: prepared.map((trajectory, index) => ({
        name: trajectory.label,
        /*
         * A `custom` series, not `lines`.
         *
         * The engine's `lines` series wants each data item to be a coordinate
         * array and its polyline layout threw on a single-item object payload —
         * which left the whole chart blank *and* raised an uncaught error from
         * the effect that called `setOption`. Projecting the path ourselves is
         * both deterministic and the pattern the rest of this library already
         * uses for geometry the engine does not own: every point goes through
         * `api.coord`, so a data coordinate can never be mistaken for a pixel.
         */
        type: "custom",
        z: trajectory.highlight ? 3 : 2,
        /* One item per route; the geometry comes from the closure, not from a
           data value the engine would try to interpret as dimensions. */
        data: [[index]],
        renderItem: (params: unknown, api: unknown) => {
          const helpers = api as {
            coord: (value: [number, number]) => [number, number];
            style: (extra?: Record<string, unknown>) => Record<string, unknown>;
          };
          void params;
          // Bound to the route this series draws — `dataIndex` is 0 for each of
          // them, so reading through it would make every series draw route one.
          const raw = trajectory.points;
          if (raw.length < 2) return { type: "group", children: [] };
          const segments = raw.map((point) => helpers.coord([point.x, point.y]));
          const pathData = segments
            .map(([x, y], position) => `${position === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
            .join(" ");
          const color = seriesColor(theme, trajectory.id, index);
          return {
            type: "path",
            shape: { pathData },
            style: {
              ...helpers.style(),
              fill: "none",
              stroke: color,
              lineWidth: trajectory.highlight ? 2.4 : 1.6,
              opacity: trajectory.highlight ? 1 : 0.72,
            },
            emphasis: { style: { lineWidth: 3, opacity: 1 } },
          };
        },
      })),
    };
  }, [format, motion, prepared, theme, xLabel, yLabel]);

  const empty = prepared.every((trajectory) => trajectory.points.length < 2);

  return (
    <ChartSurface
      option={option}
      state={empty ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Geographic trajectories"}
      ariaDescription={
        ariaDescription ??
        description ??
        `${yLabel} against ${xLabel}${
          unwrap ? "; paths crossing the antimeridian are unwrapped for display" : ""
        }.`
      }
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "Every route needs at least two coordinates." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
