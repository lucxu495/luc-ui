import { ChartFormat, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/sequence-charts.d.ts
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
export declare function RegimeStrip({ intervals, states, showLegend, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: RegimeStripProps): import("react").JSX.Element;
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
    window: {
      from: number;
      to: number;
    } | null;
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
export declare function EventTimeline({ events, guides, format, labelMode, range, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: EventTimelineProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=sequence-charts.d.ts.map