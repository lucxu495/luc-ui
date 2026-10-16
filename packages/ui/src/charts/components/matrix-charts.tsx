"use client";

import { useMemo, useRef } from "react";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue } from "../core/formatters";
import {
  contrastRatio,
  flattenColor,
  mixColor,
  parseColor,
  readableInk,
  toneColor,
  withAlpha,
  type ChartTheme,
} from "../core/theme";
import {
  correlationPalette,
  divergingPalette,
  rampFromAnchors,
  robustSymmetricDomain,
} from "../core/palette";
import {
  correlationPlotArea,
  heatmapPlotArea,
  shouldShowMatrixValues,
  type MatrixLabelMode,
} from "../core/matrix-labels";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface MatrixChartCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Heatmap                                                                     */
/* -------------------------------------------------------------------------- */

export interface HeatmapChartProps extends MatrixChartCommonProps {
  xLabels: readonly string[];
  yLabels: readonly string[];
  /** Row-major values: `values[y][x]`. `null` renders an empty cell. */
  values: ReadonlyArray<readonly (number | null)[]>;
  min?: number;
  max?: number;
  format?: ChartFormat;
  /** Cell labels are shown when the grid is small enough to stay readable. */
  showCellValues?: boolean;
  /**
   * `sequential` answers "how much" (an intensity ramp); `diverging` answers
   * "which side of a midpoint" and uses `midpoint`. A correlation matrix is
   * always diverging — a sequential ramp would make every correlation look
   * positive.
   *
   * `correlation` is the diverging case for a **correlation sign**: the same
   * centred domain, but the sapphire→mauve correlation ramp instead of the
   * general cool→warm one, so "moves against" never reads as "bad".
   */
  palette?: "sequential" | "diverging" | "correlation";
  /** The midpoint for a diverging ramp (0 for correlations, a mean, a target). */
  midpoint?: number;
  /**
   * An explicit low → mid → high ramp that overrides the theme's diverging
   * anchors (a product's own loss → flat → gain ramp, passed to `palette:
   * "diverging"`). `palette` still decides the *semantics* — symmetric domain
   * around `midpoint` — only the colours come from here.
   */
  ramp?: readonly [string, string, string];
  /**
   * When to print the value inside each cell.
   *
   * `"auto"` (the default once labelling is requested) decides per *rendered*
   * cell: the value appears when a cell is at least 44×18 CSS px and disappears
   * when it would become texture. ECharts re-asks on resize, so a matrix that
   * grows into a wider card gains its values without a remount. `"always"` trusts
   * the caller; `"never"` is honoured unconditionally.
   *
   * This supersedes the legacy `showCellValues` boolean, which is still honoured
   * (`true` → `"auto"`, `false` → `"never"`).
   */
  labelMode?: MatrixLabelMode;
  /**
   * Use a **robust, symmetric, zero-centred colour domain** instead of min/max.
   *
   * `true` caps the domain at the 95th percentile of |value − midpoint| (the top
   * 5% of magnitudes saturate at the endpoint colour); a number in `(0, 1)` sets
   * that quantile explicitly. The *values* are never touched — only which part
   * of the ramp is stretched across the common range — so a single extreme cell
   * no longer neutralises every ordinary one.
   */
  robustDomain?: boolean | number;
  /**
   * Cells to mark as the **current** one, as `[x, y]` index pairs.
   *
   * A period matrix has a newest cell and a reader needs to find it without
   * counting columns: the marked cells keep the same fill (the value's own
   * colour is never overridden) and gain an accent edge. That makes "this is
   * where the series currently is" a property of the matrix rather than a
   * separate card above it. Nothing about the values or the domain changes.
   */
  highlight?: readonly (readonly [number, number])[];
  title?: string;
  description?: string;
}

/**
 * Categorical heatmap / intensity grid.
 *
 * Sequential palette, generous cell separation and a bottom legend. The default
 * grid deliberately leaves the cells square-ish rather than stretching them to
 * fill a tall container — a stretched heatmap misreads as a time series.
 */
export function HeatmapChart({
  xLabels,
  yLabels,
  values,
  min,
  max,
  format,
  showCellValues,
  palette = "sequential",
  midpoint,
  ramp,
  labelMode,
  robustDomain,
  highlight,
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
}: HeatmapChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);
  const chartRef = useRef<EChartsInstance | null>(null);
  /*
   * `showCellValues` is the V0.5 name; it stays because consumers exist, but the
   * policy is now measured rather than grid-count gated, so a 12-month × N-year
   * calendar prints its numbers when the cells are large enough.
   */
  const resolvedMode: MatrixLabelMode =
    labelMode ?? (showCellValues === undefined ? (showCellValues ? "auto" : "never") : showCellValues ? "auto" : "never");
  const robustPercentile = typeof robustDomain === "number" ? robustDomain : 0.95;
  const useRobust = Boolean(robustDomain);
  const highlighted = useMemo(
    () => new Set((highlight ?? []).map(([x, y]) => `${x}|${y}`)),
    [highlight],
  );

  const { bounds, data, stops } = useMemo(() => {
    const flat: number[] = [];
    const grid: Array<[number, number, number | "-"]> = [];
    values.forEach((row, y) => {
      xLabels.forEach((_, x) => {
        const value = row[x];
        if (typeof value === "number" && Number.isFinite(value)) {
          flat.push(value);
          grid.push([x, y, value]);
        } else {
          grid.push([x, y, "-"]);
        }
      });
    });
    const mid = midpoint ?? 0;
    let minValue = min ?? (flat.length ? Math.min(...flat) : 0);
    let maxValue = max ?? (flat.length ? Math.max(...flat) : 1);
    if (useRobust && min === undefined && max === undefined) {
      const robust = robustSymmetricDomain(flat, { midpoint: mid, percentile: robustPercentile });
      if (robust) {
        minValue = robust.min;
        maxValue = robust.max;
      }
    }
    // A diverging matrix is centred on `midpoint`: the ramp's neutral colour
    // must land exactly on "no signal", and equal magnitudes either side must
    // read at equal intensity. That needs a symmetric domain, so the range is
    // widened around the midpoint rather than clamped.
    if (palette === "diverging" || palette === "correlation") {
      const span = Math.max(Math.abs(minValue - mid), Math.abs(maxValue - mid)) || 1;
      minValue = mid - span;
      maxValue = mid + span;
    }
    const base = theme.palette[0] ?? theme.accent;
    const rampStops: readonly string[] =
      ramp && palette === "diverging"
        ? rampFromAnchors(ramp, 7)
        : palette === "correlation"
          ? correlationPalette(theme, 7)
        : palette === "diverging"
          ? divergingPalette(theme, 7)
          : [withAlpha(base, 0.07), withAlpha(base, 0.42), base];
    /*
     * Ink is chosen per cell from the colour the reader actually sees. The
     * diverging ramp crosses mid-lightness, where neither a dark nor a light ink
     * clears 4.5:1, so a hairline outline in the card colour is the backstop
     * rather than the mechanism — exactly the policy the correlation matrix
     * already uses.
     */
    const data = grid.map((triple) => {
      const value = triple[2];
      const marked = highlighted.has(`${triple[0]}|${triple[1]}`);
      const mark = marked
        ? { itemStyle: { borderColor: theme.accent, borderWidth: 2.5 } }
        : {};
      if (typeof value !== "number") return { value: triple, ...mark };
      const color = rampColor(rampStops, value, minValue, maxValue);
      const ink = readableInk(color, { dark: theme.inkDark, light: theme.inkLight, surface: theme.surfaceRaised });
      const resolvedCell = flattenColor(color, theme.surfaceRaised);
      const resolvedInk = parseColor(ink);
      const ratio = resolvedCell && resolvedInk ? contrastRatio(resolvedCell, resolvedInk) : 21;
      return {
        value: triple,
        ...mark,
        label: { color: ink, ...(ratio < 4.5 ? { textBorderColor: theme.surfaceRaised, textBorderWidth: 2 } : {}) },
      };
    });
    return {
      bounds: { min: minValue, max: maxValue },
      data,
      stops: rampStops,
    };
  }, [max, min, values, xLabels, useRobust, robustPercentile, midpoint, palette, ramp, theme, highlighted]);

  const option = useMemo<Option>(() => {
    const dense = xLabels.length > 14 || yLabels.length > 14;
    return {
      ...baseOption(theme, motion),
      // The bottom band carries two stacked rows — the category labels and the
      // colour legend beneath them — so they never overlap on a matrix that has
      // both (a 12-month calendar hides "Apr" otherwise).
      grid: gridFragment({ top: 12, bottom: 56, left: 8, right: 12 }),
      xAxis: {
        ...axisFragment({ theme, type: "category", showGrid: false }),
        data: [...xLabels],
        splitArea: { show: false },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          interval: dense ? "auto" : 0,
          rotate: 0,
          width: 64,
          overflow: "truncate",
          hideOverlap: true,
          margin: 8,
        },
      },
      yAxis: {
        ...axisFragment({ theme, type: "category", showGrid: false }),
        // Categories read top-down in a matrix: the first label belongs at the top.
        inverse: true,
        data: [...yLabels],
        splitArea: { show: false },
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          interval: dense ? "auto" : 0,
          width: 80,
          overflow: "truncate",
          hideOverlap: true,
          margin: 8,
        },
      },
      visualMap: {
        type: "continuous",
        min: bounds.min,
        max: bounds.max,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemWidth: 10,
        itemHeight: 96,
        itemGap: 6,
        precision: 2,
        // A robust domain caps the ramp at a high quantile, so the legend says
        // so: the ends read `≥ cap` / `≤ cap`, which is how a saturated cell
        // stays honest about an outlier the colour can no longer distinguish.
        text: [
          `${useRobust ? "≥ " : ""}${formatChartValue(bounds.max, format ?? { kind: "decimal", decimals: 2 })}`,
          `${useRobust ? "≤ " : ""}${formatChartValue(bounds.min, format ?? { kind: "decimal", decimals: 2 })}`,
        ],
        textStyle: { color: theme.textMuted, fontFamily: theme.fontFamily, fontSize: theme.fontMicro },
        inRange: { color: stops.slice() },
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { value?: unknown };
          const triple = item.value as [number, number, number | "-"] | undefined;
          if (!triple) return "";
          const [x, y, value] = triple;
          const header = `${yLabels[y] ?? ""} · ${xLabels[x] ?? ""}`;
          const rows: Array<[string, string]> = [
            ["Value", typeof value === "number" ? formatChartValue(value, format) : "—"],
          ];
          return tooltipShellHtml(header, tooltipGridHtml(rows));
        },
      }),
      series: [
        {
          id: "heatmap",
          type: "heatmap",
          data,
          progressive: 2000,
          label: {
            // `show` stays on and the decision lives in the formatter, because
            // the decision needs the *rendered* cell size and ECharts calls the
            // formatter on every draw — including the draw after a resize. That
            // is what lets a calendar gain its numbers when the card is wide
            // enough, without rebuilding the option or the engine.
            show: resolvedMode !== "never",
            color: theme.textPrimary,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
            formatter: (params: { value?: unknown }) => {
              const triple = params.value as [number, number, number | "-"] | undefined;
              const value = triple?.[2];
              if (typeof value !== "number") return "";
              if (resolvedMode === "auto") {
                const chart = chartRef.current;
                const area = heatmapPlotArea(
                  chart?.getWidth() ?? 0,
                  chart?.getHeight() ?? 0,
                  yLabels.length,
                  xLabels.length,
                );
                if (!shouldShowMatrixValues({ mode: "auto", ...area })) return "";
              }
              return typeof value === "number" ? formatChartValue(value, format) : "";
            },
          },
          itemStyle: {
            borderColor: theme.surfaceRaised,
            borderWidth: 2,
            borderRadius: 3,
          },
          emphasis: {
            itemStyle: {
              borderColor: theme.accent,
              borderWidth: 2.5,
              /*
               * V1.2 heatmap focus: the hovered cell lights its own edge, lifts
               * with a soft glow and prints its value even when cell labels are
               * off — the matrix geometry never moves, so the grid stays
               * comparable while the reader inspects one cell.
               */
              shadowBlur: 14,
              shadowColor: theme.accent,
              opacity: 1,
            },
            // Inherit the per-cell ink so a hovered value never flips to a tone
            // that the cell fill makes unreadable.
            label: { show: true, fontWeight: "bold" },
          },
        },
      ],
    };
  }, [bounds.max, bounds.min, data, format, motion, resolvedMode, stops, theme, useRobust, xLabels, yLabels]);

  return (
    <ChartSurface
      option={option}
      state={xLabels.length === 0 || yLabels.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Heatmap"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "This matrix has no rows or columns." }}
      onReady={(chart) => {
        chartRef.current = chart;
        onReady?.(chart);
      }}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Correlation matrix                                                          */
/* -------------------------------------------------------------------------- */

export interface CorrelationMatrixProps extends MatrixChartCommonProps {
  labels: readonly string[];
  /** Square matrix, `values[row][col]`, already computed by the caller. */
  values: ReadonlyArray<readonly number[]>;
  title?: string;
  description?: string;
  /**
   * When to print the coefficient inside each cell.
   *
   * `"auto"` (the default) decides per *rendered cell*, not per row count: the
   * values appear when a cell is at least 44×18 CSS px and disappear when they
   * would become texture. ECharts re-asks on resize, so a matrix that grows
   * into a wider card gains its values without a remount.
   */
  labelMode?: MatrixLabelMode;
  /** @deprecated Use `labelMode`. `true` → `"always"`, `false` → `"never"`. */
  showValues?: boolean;
  /**
   * Formats a printed coefficient. Default: two decimals with the sign kept
   * (`1.00`, `0.78`, `-0.42`). The diagonal is printed as `1.00`.
   */
  formatValue?: (value: number) => string;
}

/**
 * The diverging ramp, in the same three stops the `visualMap` uses. Cell ink is
 * derived from the *same* stops rather than a second palette, so a colour tweak
 * cannot desynchronise the label from the cell it sits on.
 *
 * A correlation matrix uses the domain's own correlation anchors — sapphire for
 * a negative relationship, a near-neutral centre for zero, mauve for a positive
 * one — because a correlation encodes a *sign*, not investment goodness.
 */
function correlationRamp(theme: ChartTheme): readonly string[] {
  /*
   * The stops are interpolated into concrete RGB like every other ramp in the
   * system: the canvas colour parser is handed a colour it can resolve, rather
   * than a raw `oklch()` token. The zero centre stays the theme's own neutral
   * anchor, so "no correlation" reads as nothing on both themes.
   */
  return correlationPalette(theme, 3);
}

/** The colour ECharts paints for `value` on a ramp whose stops span `min`..`max`. */
function rampColor(stops: readonly string[], value: number, min: number, max: number): string {
  if (stops.length === 0) return "transparent";
  if (stops.length === 1) return stops[0]!;
  const span = max - min;
  const t = span === 0 ? 0 : (Math.max(min, Math.min(max, value)) - min) / span;
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const from = parseColor(stops[index]!);
  const to = parseColor(stops[index + 1]!);
  if (!from || !to) return stops[index]!;
  const mixed = mixColor(from, to, scaled - index);
  const alpha = Number.isInteger(mixed.a) ? String(mixed.a) : String(Math.round(mixed.a * 1000) / 1000);
  return `rgba(${Math.round(mixed.r)}, ${Math.round(mixed.g)}, ${Math.round(mixed.b)}, ${alpha})`;
}

/** Default coefficient format: fixed two decimals, sign preserved. */
function formatCoefficient(value: number): string {
  return value.toFixed(2);
}

/**
 * Correlation matrix.
 *
 * A diverging palette anchored at zero, a symmetric grid, and hover that names
 * both variable pairs. This chart is about *reading* clusters, so the cells stay
 * square-ish and the diagonal is de-emphasised rather than highlighted.
 */
export function CorrelationMatrix({
  labels,
  values,
  title,
  description,
  labelMode,
  showValues,
  formatValue,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: CorrelationMatrixProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);
  const chartRef = useRef<EChartsInstance | null>(null);

  /*
   * `showValues` is the V0.5 name. It stays because consumers exist, but the
   * policy is now three-valued: an explicit `labelMode` wins, then the legacy
   * boolean, then `"auto"`.
   */
  const resolvedMode: MatrixLabelMode = labelMode ?? (showValues === undefined ? "auto" : showValues ? "always" : "never");
  const format = formatValue ?? formatCoefficient;

  const data = useMemo(() => {
    const stops = correlationRamp(theme);
    const points: Array<{ value: [number, number, number]; label: Record<string, unknown> }> = [];
    values.forEach((row, y) => {
      row.forEach((value, x) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return;
        /*
         * Ink is chosen per cell from the colour the reader actually sees. A
         * fixed ink cannot work here: the diverging ramp crosses mid-lightness,
         * where neither a dark nor a light ink clears 4.5:1 — the light-theme
         * saturation end measured 3.0:1 against `--fg-primary`. Where even the
         * better ink falls short, a hairline outline in the card colour closes
         * the gap; it is a backstop, not the mechanism.
         */
        const cellColor = rampColor(stops, value, -1, 1);
        const ink = readableInk(cellColor, {
          dark: theme.inkDark,
          light: theme.inkLight,
          surface: theme.surfaceRaised,
        });
        const resolvedCell = flattenColor(cellColor, theme.surfaceRaised);
        const resolvedInk = parseColor(ink);
        const ratio = resolvedCell && resolvedInk ? contrastRatio(resolvedCell, resolvedInk) : 21;
        points.push({
          value: [x, y, value],
          label: {
            color: ink,
            ...(ratio < 4.5 ? { textBorderColor: theme.surfaceRaised, textBorderWidth: 2 } : {}),
          },
        });
      });
    });
    return points;
  }, [theme, values]);

  const option = useMemo<Option>(() => {
    const dense = labels.length > 12;
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 12, bottom: 40, left: 10, right: 14 }),
      xAxis: {
        ...axisFragment({ theme, type: "category", showGrid: false }),
        data: [...labels],
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          interval: 0,
          rotate: dense ? 38 : 0,
          width: 72,
          overflow: "truncate",
          hideOverlap: false,
          margin: 8,
        },
      },
      yAxis: {
        ...axisFragment({ theme, type: "category", showGrid: false }),
        inverse: true,
        data: [...labels],
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          interval: 0,
          width: 84,
          overflow: "truncate",
          margin: 8,
        },
      },
      visualMap: {
        type: "continuous",
        min: -1,
        max: 1,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 6,
        itemWidth: 10,
        itemHeight: 110,
        itemGap: 6,
        precision: 2,
        // Continuous visualMaps read `text` as [high, low]: with a horizontal
        // bar the high end sits on the right. The V0.5 array put the low label
        // in slot 3, so "−1" never rendered and the legend read one-sided.
        text: ["+1", "−1"],
        textStyle: { color: theme.textMuted, fontFamily: theme.fontFamily, fontSize: theme.fontMicro },
        inRange: {
          color: [...correlationRamp(theme)],
        },
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { value?: unknown };
          const triple = item.value as [number, number, number] | undefined;
          if (!triple) return "";
          const [x, y, value] = triple;
          return tooltipShellHtml(
            `${labels[y] ?? ""} ↔ ${labels[x] ?? ""}`,
            tooltipGridHtml([
              ["Correlation", formatChartValue(value, { kind: "decimal", decimals: 2, signed: true })],
            ]),
          );
        },
      }),
      series: [
        {
          id: "correlation",
          type: "heatmap",
          data,
          label: {
            // `show` stays on and the decision lives in the formatter, because
            // the decision needs the *rendered* cell size and ECharts calls the
            // formatter on every draw — including the draw after a resize. That
            // is what lets a matrix gain its values when a Workspace pane is
            // dragged wider without rebuilding the option or the engine.
            show: resolvedMode !== "never",
            color: theme.textPrimary,
            fontFamily: theme.monoFamily,
            fontSize: theme.fontMicro,
            fontWeight: 500,
            formatter: (params: { value?: unknown }) => {
              const triple = params.value as [number, number, number] | undefined;
              if (!triple || !Number.isFinite(triple[2])) return "";
              if (resolvedMode === "auto") {
                const chart = chartRef.current;
                const area = correlationPlotArea(
                  chart?.getWidth() ?? 0,
                  chart?.getHeight() ?? 0,
                  labels.length,
                  labels.length,
                );
                if (!shouldShowMatrixValues({ mode: "auto", ...area })) return "";
              }
              return format(triple[2]);
            },
          },
          itemStyle: { borderColor: theme.surfaceRaised, borderWidth: 2, borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: theme.accent, borderWidth: 2 } },
        },
      ],
    };
  }, [data, format, labels, motion, resolvedMode, theme]);

  return (
    <ChartSurface
      option={option}
      state={labels.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Correlation matrix"}
      ariaDescription={ariaDescription ?? description}
      onReady={(chart) => {
        chartRef.current = chart;
        onReady?.(chart);
      }}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar heatmap                                                            */
/* -------------------------------------------------------------------------- */

export interface CalendarHeatmapProps extends MatrixChartCommonProps {
  year: number;
  /** `[YYYY-MM-DD, value]` pairs. The x axis is the calendar, not a data field. */
  data: ReadonlyArray<readonly [string, number]>;
  format?: ChartFormat;
  tone?: SeriesTone;
  title?: string;
  description?: string;
}

/** Calendar heatmap — one cell per day, intensity from the caller's values. */
export function CalendarHeatmap({
  year,
  data,
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
  eager,
}: CalendarHeatmapProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const values = data.map((entry) => entry[1]).filter((value) => Number.isFinite(value));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const base = toneColor(theme, tone, 0);
    return {
      ...baseOption(theme, motion),
      calendar: {
        /* Room for the month labels above and the colour legend below. */
        top: 34,
        left: 34,
        right: 18,
        bottom: 34,
        range: String(year),
        cellSize: ["auto", 15],
        splitLine: { show: false, lineStyle: { color: theme.grid, width: 1 } },
        /*
         * No border on the day cells.
         *
         * A 2px border on every one of 365 cells draws a grid that dominates the
         * handful of days that actually carry a value — the Phase 10A.1 report
         * ("empty-day styling dominated the visual field"). Empty days are now
         * invisible and the filled ones read as chips; `borderRadius` stays for
         * the cells that do have data.
         */
        itemStyle: { color: "transparent", borderWidth: 0, borderRadius: 3 },
        yearLabel: { show: false },
        monthLabel: {
          color: theme.textMuted,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          margin: 8,
        },
        dayLabel: {
          color: theme.textMuted,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          nameMap: "en",
          margin: 6,
        },
      },
      visualMap: {
        type: "continuous",
        min,
        max,
        calculable: false,
        orient: "horizontal",
        left: "center",
        /*
         * The legend belongs at the bottom.
         *
         * It was placed at `top: 4`, which is the band the month labels occupy,
         * so "Jan Mar May …" and the colour ramp were drawn through each other.
         * The min/max read out too, so the ramp is legible as a scale rather than
         * as a decorative stripe.
         */
        bottom: 2,
        itemWidth: 10,
        itemHeight: 110,
        itemGap: 6,
        precision: 2,
        text: [formatChartValue(max, format), formatChartValue(min, format)],
        textStyle: { color: theme.textMuted, fontFamily: theme.fontFamily, fontSize: theme.fontMicro },
        inRange: { color: [withAlpha(base, 0.08), withAlpha(base, 0.5), base] },
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = (Array.isArray(params) ? params[0] : params) as { value?: unknown };
          const pair = item.value as [string, number] | undefined;
          if (!pair) return "";
          return tooltipShellHtml(
            pair[0],
            tooltipGridHtml([["Value", formatChartValue(pair[1], format)]]),
          );
        },
      }),
      series: [
        {
          id: "calendar",
          type: "heatmap",
          coordinateSystem: "calendar",
          data: data.map((entry) => [entry[0], entry[1]]),
          itemStyle: { borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: theme.accent, borderWidth: 2 } },
        },
      ],
    };
  }, [data, format, motion, theme, tone, year]);

  return (
    <ChartSurface
      option={option}
      state={data.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? `Calendar heatmap ${year}`}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
