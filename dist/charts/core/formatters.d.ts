import { ChartFormat, SeriesSpec } from "../types.js";
//#region src/charts/core/formatters.d.ts
/** Duration in milliseconds rendered as a short, readable span. */
export declare function formatDuration(ms: number | null | undefined): string;
/**
 * Render a value according to a `ChartFormat`. Units are never converted — a
 * percentage arrives already scaled, a basis-point figure already in bps.
 */
export declare function formatChartValue(value: number | null | undefined, format?: ChartFormat): string;
export type ChartFormatter = (value: number | null | undefined) => string;
/** Build a reusable formatter closure from a format description. */
export declare function createFormatter(format?: ChartFormat): ChartFormatter;
/**
 * A series' own formatter wins; otherwise its `format`; otherwise the chart
 * fallback. This is the order consumers expect, and the only one implemented.
 */
export declare function resolveFormatter(series: Pick<SeriesSpec, "format" | "formatter">, fallback?: ChartFormat): ChartFormatter;
/**
 * Time-axis tick label for the span currently on screen. Short spans get
 * clock time, long spans get years — the same rule a research terminal uses.
 *
 * The span must be the span that is **on screen**, not the span that was
 * loaded: a two-year window of a fifteen-year history labelled from the loaded
 * extent repeats the year on every tick ("2025 2025 2025"), which is a date
 * axis that lost its dates. `timeAxisLabelScale` is the pure decision, and the
 * chart surfaces feed the live visible span into it.
 */
export declare function timeAxisFormatter(spanMs: number): (value: number) => string;
/**
 * The label granularity a visible span asks for.
 *
 * Coarse, discrete buckets rather than a continuous threshold: the chart
 * surfaces rebuild their axis option only when the bucket changes, so a pan or
 * a pinch does not re-render the chart on every frame (see `EChartSurface`'s
 * visible-span report).
 */
export type TimeAxisLabelScale = "time" | "day" | "month" | "month-year" | "year";
export declare function timeAxisLabelScale(spanMs: number): TimeAxisLabelScale;
export interface TimeAxisTickPlan {
  /** The label granularity the ticks can carry. */
  scale: TimeAxisLabelScale;
  /**
   * The `splitNumber` to hand ECharts. It is the number of label units that fit
   * in the span, so the engine's own interval ladder lands on — or coarsens
   * past — one label unit per tick.
   */
  splitNumber: number;
}
/**
 * Pair a time axis's label granularity with its tick spacing.
 *
 * The defect this exists to prevent: `timeAxisFormatter(span)` alone decides
 * *how much of a date to print* and says nothing about *how many ticks to
 * draw*, so ECharts — which sizes a time axis from the canvas width — drew
 * twelve ticks across a four-month series while the formatter printed bare
 * month names. The axis read `Jan Jan Feb Feb Feb Mar Mar Mar Apr Apr Apr May`:
 * present, styled, axe-clean, and a date axis that had lost its dates.
 *
 * The span is still the input, because the span is what the reader is looking
 * at; the fix is that the same span now also decides the tick count, so the two
 * decisions cannot disagree. See `axis-time.test.ts`, which renders every scale
 * through the real engine and fails if two adjacent ticks print the same label.
 */
export declare function timeAxisTickPlan(spanMs: number): TimeAxisTickPlan;
/**
 * The span a set of x values covers, in ms — what `axisFragment` wants.
 *
 * A time axis with no span falls back to a year, which is a reasonable guess
 * and a bad fact: a family component that has the caller's timestamps in hand
 * should say what they cover rather than let the engine assume. Non-finite
 * entries are skipped (a chart may legitimately carry a gap), and a set with
 * fewer than two usable timestamps has no span at all.
 */
export declare function timeSpanMs(values: Iterable<number | string | Date | null | undefined>): number | undefined;
/**
 * Compact tick label for a numeric axis: 1.2M, 38%, $109.1K …
 *
 * An axis has one job — be readable in the gutter it was given. Large values are
 * abbreviated from ten thousand up (a full `$124,658` label is 8 characters of
 * pure noise next to `$124.7K`), and a compacted currency keeps its unit so the
 * plate never loses the "these are dollars" information. Tooltips keep full
 * precision; only the ticks are abbreviated.
 */
export declare function numericAxisFormatter(format?: ChartFormat): (value: number) => string;
/** Full precision, used by tooltips where space is not the constraint. */
export declare function preciseFormatter(format?: ChartFormat): ChartFormatter;
//#endregion
//# sourceMappingURL=formatters.d.ts.map