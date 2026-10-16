"use client";

import { useMemo } from "react";
import { cn } from "../../utils/cn";
import type { ChartFormat, SeriesTone } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue, timeSpanMs } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { toneColor, withAlpha } from "../core/theme";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface, type ChartState } from "./chart";
import { RangeSelector } from "../chart-card";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface SequenceCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  title?: string;
  description?: string;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
}

/** One contiguous interval in a categorical state series. */
export interface RegimeInterval {
  start: string | number | Date;
  end: string | number | Date;
  /** The state token, e.g. `risk-on`, `high-vol`, `signal.active`. */
  state: string;
  /** Optional human label for the tooltip; falls back to `state`. */
  label?: string;
}

/** A palette entry: which state token, and how it should read. */
export interface RegimeStateStyle {
  state: string;
  label?: string;
  /** A semantic tone, or `categorical` to take a stable palette slot. */
  tone?: SeriesTone;
  /** Explicit slot when several states share a family. */
  index?: number;
  color?: string;
}

export interface RegimeStripProps extends SequenceCommonProps {
  intervals: readonly RegimeInterval[];
  /** Deterministic state → colour mapping. A state with no style gets a slot. */
  states: readonly RegimeStateStyle[];
  /** Draw a thin legend above the strip. */
  showLegend?: boolean;
}

/**
 * RegimeStrip — a compact categorical timeline.
 *
 * Sits under a price or indicator chart and answers "in which regime was this
 * observation?". It is deliberately *not* another time-series axis: the states
 * are a fixed vocabulary with fixed colours, so the strip reads as annotation.
 *
 * A strip is *spans on a time axis*, which no built-in series type expresses:
 * a bar's width comes from category spacing, and a line cannot carry two x
 * values per point. So it uses ECharts' `custom` series — the engine's own
 * supported extension point — with one rectangle per interval. Colours still
 * come from the theme, the tooltip from the shared shell, and hover emphasis
 * from the same `emphasis`/`blur` contract as every other chart.
 */
export function RegimeStrip({
  intervals,
  states,
  showLegend = true,
  title,
  description,
  state = "ready",
  height = 72,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: RegimeStripProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "subtle");

  const colorFor = useMemo(() => {
    const explicit = new Map<string, string>();
    const order: string[] = [];
    for (const entry of states) {
      order.push(entry.state);
      explicit.set(entry.state, entry.color ?? toneColor(theme, entry.tone, entry.index ?? order.length - 1));
    }
    return { explicit, order };
  }, [states, theme]);

  const option = useMemo<Option>(() => {
    const ordered = [...intervals].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const stateNames = colorFor.order.length
      ? colorFor.order
      : Array.from(new Set(ordered.map((interval) => interval.state)));

    const xSpan = timeSpanMs(ordered.flatMap((interval) => [interval.start, interval.end]));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: 4, right: 12, bottom: 4, left: 4 }),
      xAxis: axisFragment({
        theme,
        type: "time",
        hidden: false,
        showGrid: false,
        ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
      }),
      yAxis: {
        type: "category",
        data: stateNames,
        show: showLegend,
        axisLabel: {
          color: theme.axisLabel,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontMicro,
          formatter: (value: string) => states.find((entry) => entry.state === value)?.label ?? value,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const entry = (Array.isArray(params) ? params[0] : params) as
            | { data?: { value?: [number, number]; intervalIndex?: number } }
            | undefined;
          const interval = entry?.data?.intervalIndex !== undefined ? ordered[entry.data.intervalIndex] : undefined;
          if (!interval) return "";
          return tooltipShellHtml(
            interval.label ?? interval.state,
            tooltipGridHtml([
              ["From", new Date(interval.start).toISOString().slice(0, 10)],
              ["To", new Date(interval.end).toISOString().slice(0, 10)],
            ]),
          );
        },
      }),
      // A `bar` per interval on the state row: the bar's category is the state,
      // its x span is the interval. `custom` would be needed for true spans, so
      // intervals are drawn as a dense run of thin bars between their bounds.
      series: stateNames.map((stateName, rowIndex) => ({
        id: `regime-${stateName}`,
        name: states.find((entry) => entry.state === stateName)?.label ?? stateName,
        type: "custom",
        // `[startMs, endMs, rowIndex]` — one row per state keeps the strip flat.
        encode: { x: [0, 1], y: 2 },
        data: ordered
          .map((interval, intervalIndex) => ({ interval, intervalIndex }))
          .filter(({ interval }) => interval.state === stateName)
          .map(({ interval, intervalIndex }) => ({
            value: [
              new Date(interval.start).getTime(),
              Math.max(new Date(interval.end).getTime(), new Date(interval.start).getTime() + 86_400_000),
              rowIndex,
            ],
            intervalIndex,
          })),
        renderItem: (params: { coordSys?: { x: number; y: number; width: number; height: number } }, api: {
          value: (index: number) => number;
          coord: (value: number[]) => number[];
          size: (value: number[]) => number[];
          style: (extra?: Record<string, unknown>) => Record<string, unknown>;
        }) => {
          const start = api.coord([api.value(0), api.value(2)]);
          const end = api.coord([api.value(1), api.value(2)]);
          const rowHeight = (params.coordSys?.height ?? 0) / Math.max(1, stateNames.length);
          const barHeight = Math.max(6, rowHeight * 0.62);
          const color = colorFor.explicit.get(stateName) ?? seriesColor(theme, stateName);
          const startX = start[0] ?? 0;
          const endX = end[0] ?? startX;
          const centerY = start[1] ?? 0;
          return {
            type: "rect",
            shape: {
              x: startX,
              y: centerY - barHeight / 2,
              width: Math.max(1.5, endX - startX),
              height: barHeight,
              r: 2,
            },
            style: api.style({ fill: color, opacity: 0.9 }),
          };
        },
        emphasis: { focus: "series" },
        // A custom series needs its own hover rule; the shared `blur` state in
        // `baseOption` still dims the peers.
        z: stateNames.length - rowIndex,
      })),
    };
  }, [colorFor, intervals, motion, showLegend, states, theme]);

  return (
    <ChartSurface
      option={option}
      state={intervals.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Regime strip"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

export interface TimelineEvent {
  at: string | number | Date;
  label: string;
  /** Grouping category; drives the colour and the legend. */
  category?: string;
  tone?: SeriesTone;
  /** Optional formatted value shown in the tooltip. */
  value?: number;
  valueFormat?: ChartFormat;
}

export interface EventTimelineProps extends SequenceCommonProps {
  events: readonly TimelineEvent[];
  /** Draw vertical guides from the axis to each marker. */
  guides?: boolean;
  format?: ChartFormat;
  /**
   * A presentation window over the events the caller already holds.
   *
   * A fifteen-year transition history is unreadable on one axis, so the plate
   * offers the same lookback presets every other historical chart does. The
   * caller owns the vocabulary and resolves the window (it knows the asset's own
   * clock); the chart only narrows the axis, which is why nothing here refetches
   * or recomputes anything. `null` means "the whole domain" — MAX.
   */
  range?: {
    ranges: readonly string[];
    value: string;
    onValueChange: (value: string) => void;
    window: { from: number; to: number } | null;
  } | null;
  /**
   * When to print each event's own label beside its marker.
   *
   * A sparse history (a handful of halvings, the Pi Cycle crossovers) reads
   * better with the label on the marker: the reader should not have to hover
   * each dot, or map a detached list of names back onto a date. A dense history
   * (hundreds of regime transitions) is markers only — the tooltip carries the
   * name, and printing hundreds of labels would be texture, not information.
   * `"auto"` decides from the event count; `"never"` is honoured always.
   */
  labelMode?: "auto" | "never";
}

/** Above this many events a shared time axis cannot carry per-marker labels. */
const SPARSE_EVENT_LIMIT = 12;

/**
 * The **minimum share of the axis** that has to separate two events before a
 * permanent label fits between them.
 *
 * A count alone is not enough: three Pi Cycle crossovers inside eighteen months
 * are "sparse" by number and unreadable on a thirteen-year axis, while four
 * halvings spread evenly across the same axis read perfectly. So the rule is
 * about *spacing* — the tightest pair must have room for its own label, which
 * on a report-width plate is roughly an eighth of the axis.
 */
const MIN_LABEL_GAP_SHARE = 0.12;

/**
 * Whether a history can carry a permanent label on each marker.
 *
 * `never` is honoured; `auto` asks the geometry: few enough events, and no
 * pile-up. A history that fails either test is drawn as markers only, and the
 * name is read from the tooltip — which is the honest presentation of a dense or
 * clustered event layer.
 */
function labelsFit(labelMode: "auto" | "never", events: readonly TimelineEvent[]): boolean {
  if (labelMode !== "auto" || events.length === 0 || events.length > SPARSE_EVENT_LIMIT) return false;
  const times = events
    .map((event) => new Date(event.at).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => left - right);
  if (times.length < 2) return true;
  const span = times[times.length - 1]! - times[0]!;
  if (!(span > 0)) return false;
  let tightest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < times.length; index += 1) {
    tightest = Math.min(tightest, times[index]! - times[index - 1]!);
  }
  return tightest >= span * MIN_LABEL_GAP_SHARE;
}

/**
 * EventTimeline — dated events on a shared time axis.
 *
 * The companion to a financial series: halvings, FOMC dates, a Signal firing.
 * Each event is one point plus an optional guide; the labels are the caller's
 * (LUC UI has no idea what a halving is).
 *
 * Deliberately not a multi-series chart: events do not have a y value, so
 * jittering them onto lanes would invent one. The axis is time, the marks are
 * events, and the tooltip carries the detail.
 */
export function EventTimeline({
  events,
  guides = true,
  format,
  labelMode = "never",
  range = null,
  title,
  description,
  state = "ready",
  height = 120,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: EventTimelineProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme, "subtle");
  /*
   * A sparse history prints its labels on the markers themselves; a dense one
   * stays markers-only and lets the tooltip carry the name. The threshold is
   * about legibility, not importance: past a dozen rows on one axis the labels
   * would collide into texture.
   */
  const showLabels = useMemo(
    () => labelsFit(labelMode, events),
    [events, labelMode],
  );

  const option = useMemo<Option>(() => {
    const categories = Array.from(new Set(events.map((event) => event.category ?? "event")));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ top: showLabels ? 26 : 9, right: 14, bottom: 4 }),
      xAxis: (() => {
        /*
         * The tick vocabulary follows the span the axis actually covers.
         * `timeAxisFormatter` is given the window rather than a fixed year: a
         * decade of transitions labelled "Jan Jan Jan" is a date axis that has
         * lost its dates.
         */
        const times = events
          .map((event) => new Date(event.at).getTime())
          .filter((time) => Number.isFinite(time));
        const span =
          range?.window
            ? range.window.to - range.window.from
            : times.length > 1
              ? Math.max(...times) - Math.min(...times)
              : undefined;
        return {
          ...axisFragment({
            theme,
            type: "time",
            showGrid: false,
            ...(span !== undefined ? { spanMs: span } : {}),
            ...(range?.window ? { min: range.window.from, max: range.window.to } : {}),
          }),
        };
      })(),
      yAxis: { type: "value", show: false, min: 0, max: 1 },
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const entry = (Array.isArray(params) ? params[0] : params) as
            | { data?: { eventIndex?: number } }
            | undefined;
          const event = entry?.data?.eventIndex !== undefined ? events[entry.data.eventIndex] : undefined;
          if (!event) return "";
          const rows: Array<readonly [string, string]> = [
            ["Date", new Date(event.at).toISOString().slice(0, 10)],
            ...(event.category ? ([["Category", event.category]] as Array<readonly [string, string]>) : []),
            ...(event.value !== undefined
              ? ([["Value", formatChartValue(event.value, event.valueFormat ?? format)]] as Array<readonly [string, string]>)
              : []),
          ];
          return tooltipShellHtml(event.label, tooltipGridHtml(rows));
        },
      }),
      series: categories.map((category, index) => ({
        id: `events-${category}`,
        name: category,
        type: "scatter",
        symbolSize: 9,
        itemStyle: {
          color:
            toneColor(
              theme,
              events.find((event) => event.category === category)?.tone,
              index,
            ),
        },
        emphasis: { focus: "series" },
        data: events
          .map((event, eventIndex) => ({ event, eventIndex }))
          .filter((entry) => (entry.event.category ?? "event") === category)
          .map(({ event, eventIndex }) => ({
            value: [new Date(event.at).getTime(), 0.5],
            name: event.label,
            eventIndex,
            label: showLabels
              ? {
                  show: true,
                  position: "top" as const,
                  distance: 6,
                  color: theme.textMuted,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontMicro,
                  formatter: event.label,
                }
              : { show: false },
          })),
        ...(guides
          ? {
              markLine: {
                silent: true,
                symbol: "none",
                animation: false,
                lineStyle: {
                  color: withAlpha(toneColor(theme, events.find((event) => event.category === category)?.tone, index), 0.35),
                  width: 1,
                  type: "dotted",
                },
                label: { show: false },
                data: events
                  .filter((event) => (event.category ?? "event") === category)
                  .map((event) => ({ xAxis: new Date(event.at).getTime() })),
              },
            }
          : {}),
      })),
    };
  }, [events, format, guides, motion, range, showLabels, theme]);

  const plate = (
    <ChartSurface
      option={option}
      state={events.length === 0 ? "empty" : state}
      height={height}
      className={range ? undefined : className}
      ariaLabel={ariaLabel ?? title ?? "Event timeline"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
  if (!range) return plate;
  /*
   * The control sits above the plate, right-aligned, exactly like the range
   * control on every other historical chart.
   */
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div className="flex items-center justify-end">
        <RangeSelector
          ranges={range.ranges}
          value={range.value}
          onValueChange={range.onValueChange}
        />
      </div>
      {plate}
    </div>
  );
}
