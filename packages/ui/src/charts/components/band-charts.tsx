"use client";

import { useMemo } from "react";
import type { AnnotationSpec, ChartFormat, ChartInteractionSpec } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue, timeSpanMs } from "../core/formatters";
import { fanPalette, seriesColor } from "../core/palette";
import { withAlpha } from "../core/theme";
import { axisFragment, baseOption, dataZoomFragment, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { annotationMarks } from "../adapters/echarts/marks";
import { tooltipGridHtml, tooltipRuleHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface BandChartCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  annotations?: AnnotationSpec;
  interaction?: ChartInteractionSpec;
  syncGroup?: string;
  title?: string;
  description?: string;
}

/** One time point of a band: a centre and its low/high edges. */
export interface BandPoint {
  t: string | number | Date;
  center: number;
  lower: number;
  upper: number;
}

export interface RangeBandChartProps extends BandChartCommonProps {
  points: readonly BandPoint[];
  format?: ChartFormat;
  /** Label for the band in the tooltip, e.g. "90% interval". */
  bandLabel?: string;
}

/**
 * RangeBandChart — a line with an interval around it.
 *
 * The honest picture of an estimate with uncertainty: the centre is a line, the
 * interval is one translucent band (never two more lines, which reads as four
 * series). Consumers pass prepared bounds; LUC UI never computes an interval.
 */
export function RangeBandChart({
  points,
  format,
  bandLabel = "Range",
  annotations,
  interaction,
  syncGroup,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: RangeBandChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "standard", points.length);
  const center = seriesColor(theme, "primary");

  const option = useMemo<Option>(() => {
    // Stacked-band trick: a transparent low base plus the band height. ECharts
    // has no native interval mark, and two stacked lines is the standard
    // formulation that keeps the band a *fill*, not another series.
    //
    // On a `time` axis every point must be an `[x, y]` pair — a bare number is
    // read as an x index, which silently draws the band in the wrong place.
    const times = points.map((point) => new Date(point.t).getTime());
    const xSpan = timeSpanMs(times);
    const base = times.map((time, index) => [time, points[index]!.lower]);
    const height = times.map((time, index) => [
      time,
      Math.max(0, points[index]!.upper - points[index]!.lower),
    ]);
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 14, bottom: 6 }),
      xAxis: axisFragment({
        theme,
        type: "time",
        showGrid: false,
        ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
      }),
      yAxis: axisFragment({ theme, type: "value", position: "right", format, scale: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number }>;
          const index = items[0]?.dataIndex ?? -1;
          const point = points[index];
          if (!point) return "";
          return tooltipShellHtml(
            new Date(point.t).toISOString().slice(0, 10),
            tooltipGridHtml([
              ["Center", formatChartValue(point.center, format)],
              [bandLabel, `${formatChartValue(point.lower, format)} – ${formatChartValue(point.upper, format)}`],
              ["Width", formatChartValue(point.upper - point.lower, format)],
            ]),
            tooltipRuleHtml(),
          );
        },
      }),
      series: [
        {
          id: "band-base",
          type: "line",
          stack: "band",
          silent: true,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          data: base,
        },
        {
          id: "band",
          name: bandLabel,
          type: "line",
          stack: "band",
          silent: true,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { color: withAlpha(center, theme.mode === "dark" ? 0.24 : 0.18) },
          data: height,
        },
        {
          id: "center",
          name: "Center",
          type: "line",
          symbol: "none",
          smooth: false,
          lineStyle: { color: center, width: 2 },
          emphasis: { focus: "series" },
          data: times.map((time, index) => [time, points[index]!.center]),
          ...annotationMarks(theme, annotations),
        },
      ],
      ...(dataZoomFragment({ theme, interaction }).length
        ? { dataZoom: dataZoomFragment({ theme, interaction }) }
        : {}),
    };
  }, [annotations, bandLabel, center, format, interaction, motion, points, theme]);

  return (
    <ChartSurface
      option={option}
      xValues={points.map((point) => new Date(point.t).getTime())}
      syncGroup={syncGroup}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Range band chart"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

/** One quantile band of a fan: an explicit low and high at each time point. */
export interface FanBand {
  /** e.g. "P5–P95". Shown in the tooltip and the legend. */
  label: string;
  lower: readonly number[];
  upper: readonly number[];
}

export interface FanChartProps extends BandChartCommonProps {
  /** Shared time axis, one entry per array element of every band and the median. */
  x: readonly (string | number | Date)[];
  /** Bands ordered widest → narrowest, which is also the draw order. */
  bands: readonly FanBand[];
  median: readonly number[];
  format?: ChartFormat;
  /** Draw the median as a line (default) or as a filled area. */
  medianMode?: "line" | "area";
}

/**
 * FanChart — nested quantile bands around a median.
 *
 * The canonical uncertainty visualisation: a Monte-Carlo path cloud, a bootstrap
 * interval, a forecast cone. Bands are one hue at layered opacity (see
 * `fanPalette`), because five hues would read as five unrelated series; the
 * shared hue says "this is all the same estimate".
 *
 * Every quantile arrives prepared. LUC UI does not simulate.
 */
export function FanChart({
  x,
  bands,
  median,
  format,
  medianMode = "line",
  annotations,
  syncGroup,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: FanChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "standard", x.length);
  const ramp = useMemo(() => fanPalette(theme, bands.length), [theme, bands.length]);
  const medianColor = seriesColor(theme, "primary");

  const option = useMemo<Option>(() => {
    // Each band is a stacked pair: an invisible base at `lower` and a fill of
    // `upper - lower`. Widest first so narrower bands sit on top. As with the
    // range band, a time axis needs `[x, y]` pairs on every series — the stack
    // is matched by x, not by array position.
    const times = x.map((value) => new Date(value).getTime());
    const xSpan = timeSpanMs(times);
    const bandSeries = bands.flatMap((band, index) => {
      const fill = ramp[index] ?? withAlpha(medianColor, 0.2);
      const base = times.map((time, pointIndex) => [time, band.lower[pointIndex] ?? null]);
      const span = times.map((time, pointIndex) => {
        const low = band.lower[pointIndex];
        const high = band.upper[pointIndex];
        return [time, low === undefined || high === undefined ? null : Math.max(0, high - low)];
      });
      return [
        {
          id: `fan-base-${index}`,
          type: "line" as const,
          stack: `fan-${index}`,
          silent: true,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          data: base,
        },
        {
          id: `fan-band-${index}`,
          name: band.label,
          type: "line" as const,
          stack: `fan-${index}`,
          silent: true,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { color: fill },
          data: span,
        },
      ];
    });

    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 18, right: 14, bottom: 6 }),
      legend: {
        show: false,
      },
      xAxis: axisFragment({
        theme,
        type: "time",
        showGrid: false,
        ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
      }),
      yAxis: axisFragment({ theme, type: "value", position: "right", format, scale: true }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number }>;
          const index = items[0]?.dataIndex ?? -1;
          if (index < 0) return "";
          const rows: Array<readonly [string, string]> = [];
          const medianValue = median[index];
          if (medianValue !== undefined) rows.push(["Median", formatChartValue(medianValue, format)]);
          for (const band of bands) {
            const low = band.lower[index];
            const high = band.upper[index];
            if (low === undefined || high === undefined) continue;
            rows.push([band.label, `${formatChartValue(low, format)} – ${formatChartValue(high, format)}`]);
          }
          const stamp = x[index];
          return tooltipShellHtml(
            stamp === undefined ? "" : new Date(stamp).toISOString().slice(0, 10),
            tooltipGridHtml(rows),
          );
        },
      }),
      series: [
        ...bandSeries,
        {
          id: "fan-median",
          name: "Median",
          type: "line",
          symbol: "none",
          lineStyle: { color: medianColor, width: 2.25 },
          ...(medianMode === "area"
            ? { areaStyle: { color: withAlpha(medianColor, theme.mode === "dark" ? 0.16 : 0.12) } }
            : {}),
          data: times.map((time, index) => [time, median[index] ?? null]),
          ...annotationMarks(theme, annotations),
        },
      ],
    };
  }, [annotations, bands, format, median, medianColor, medianMode, motion, ramp, theme, x]);

  return (
    <ChartSurface
      option={option}
      xValues={x.map((value) => new Date(value).getTime())}
      syncGroup={syncGroup}
      state={x.length === 0 || bands.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Fan chart"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
