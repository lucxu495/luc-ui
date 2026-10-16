/*
 * Time, calendar and sequence.
 *
 * These four charts are all "when" rather than "how much": a calendar cell, a
 * labelled event, a categorical state over time, and an intensity grid. Every
 * date below is a fixed ISO string, so the picture never depends on the day the
 * page is opened, and every state token is a word rather than a number — the
 * strip's whole point is that the vocabulary is fixed.
 */

import {
  CalendarHeatmap,
  EventTimeline,
  GaugeChart,
  HeatmapChart,
  RegimeStrip,
  type CalendarHeatmapProps,
  type EventTimelineProps,
  type GaugeChartProps,
  type HeatmapChartProps,
  type RegimeStripProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

const REGIME_STATES = [
  { state: "calm", label: "Calm", tone: "positive" as const },
  { state: "watch", label: "Watch", tone: "warning" as const },
  { state: "stress", label: "Stress", tone: "negative" as const },
];

export const chartTimeDemos: readonly DemoSpec[] = [
  demo<CalendarHeatmapProps>({
    id: "calendar-heatmap",
    component: "CalendarHeatmap",
    props: {
      year: 2026,
      data: [
        ["2026-01-06", 12],
        ["2026-02-11", -8],
        ["2026-03-17", 24],
        ["2026-04-22", -3],
        ["2026-05-28", 17],
        ["2026-06-09", 41],
        ["2026-07-15", -19],
        ["2026-08-20", 7],
        ["2026-09-24", 33],
        ["2026-10-01", -11],
      ],
      format: { kind: "number", decimals: 0, suffix: " bps" },
      height: 300,
      ariaLabel: "Daily contribution",
    },
    render: (props) => <CalendarHeatmap {...props} />,
    note: "Ten sessions of one year, in basis points; the calendar is the axis, not a data field.",
  }),
  demo<EventTimelineProps>({
    id: "event-timeline",
    component: "EventTimeline",
    props: {
      events: [
        { at: "2026-01-15", label: "Rate decision", category: "Macro", tone: "info" },
        { at: "2026-03-02", label: "Earnings", category: "Company", tone: "accent" },
        { at: "2026-04-18", label: "Index rebalance", category: "Index", tone: "neutral" },
        { at: "2026-06-09", label: "Volatility spike", category: "Market", tone: "negative" },
        { at: "2026-08-27", label: "Guidance cut", category: "Company", tone: "accent" },
        { at: "2026-10-06", label: "Rate decision", category: "Macro", tone: "info" },
      ],
      guides: true,
      height: 260,
      ariaLabel: "Event timeline",
    },
    render: (props) => <EventTimeline {...props} />,
    note: "Six dated events grouped by category; the timeline enriches the axis rather than replacing it.",
  }),
  demo<RegimeStripProps>({
    id: "regime-strip",
    component: "RegimeStrip",
    props: {
      intervals: [
        { start: "2026-01-05", end: "2026-02-13", state: "calm", label: "Low volatility" },
        { start: "2026-02-16", end: "2026-03-20", state: "watch", label: "Range widening" },
        { start: "2026-03-23", end: "2026-04-30", state: "stress", label: "Drawdown" },
        { start: "2026-05-04", end: "2026-07-31", state: "calm" },
        { start: "2026-08-03", end: "2026-09-11", state: "watch" },
        { start: "2026-09-14", end: "2026-10-06", state: "calm" },
      ],
      states: REGIME_STATES,
      showLegend: true,
      height: 120,
      ariaLabel: "Regime over the year",
    },
    render: (props) => <RegimeStrip {...props} />,
    note: "Six spans on one time axis with a fixed three-word vocabulary, drawn from the caller's own classification.",
  }),
  demo<HeatmapChartProps>({
    id: "heatmap-chart",
    component: "HeatmapChart",
    props: {
      xLabels: ["09:00", "11:00", "13:00", "15:00", "17:00"],
      yLabels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      /* Row-major: `values[day][hour]`. `null` is a session with no print. */
      values: [
        [12, 34, 28, 41, 18],
        [9, 47, 33, 52, 24],
        [15, 38, 22, null, 19],
        [11, 44, 39, 48, 27],
        [8, 29, 31, 36, 14],
      ],
      format: { kind: "integer" },
      showCellValues: true,
      height: 320,
      ariaLabel: "Volume by hour",
    },
    render: (props) => <HeatmapChart {...props} />,
    note: "A five-by-five grid of supplied intensities with one empty cell kept empty rather than filled with zero.",
  }),
  demo<GaugeChartProps>({
    id: "gauge-chart",
    component: "GaugeChart",
    props: {
      value: 62,
      min: 0,
      max: 100,
      label: "Utilisation",
      thresholds: [
        { value: 70, tone: "positive" },
        { value: 90, tone: "warning" },
        { value: 100, tone: "negative" },
      ],
      format: { kind: "integer", suffix: "%" },
      height: 220,
      ariaLabel: "Capacity utilisation",
    },
    render: (props) => <GaugeChart {...props} />,
    note: "One served reading inside labelled zones; the gauge draws the thresholds, it does not evaluate them.",
  }),
];
