/*
 * Operations and comparison.
 *
 * Seven charts that answer "how does this compare" rather than "what happened
 * over time": a schedule, a before/after pair, a rank movement, a target with
 * qualitative ranges, and a mosaic whose column *width* is the group size. The
 * fixtures are small, ordered where the chart requires order, and use one fixed
 * epoch instead of a clock.
 */

import {
  BulletChart,
  BumpChart,
  DumbbellChart,
  GanttChart,
  LollipopChart,
  MekkoChart,
  SlopeChart,
  type BulletChartProps,
  type BumpChartProps,
  type DumbbellChartProps,
  type GanttChartProps,
  type LollipopChartProps,
  type MekkoChartProps,
  type SlopeChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

const DAY = 86_400_000;
/** 2026-10-05, 00:00 UTC. */
const SCHEDULE_START = 1_791_158_400_000;

export const chartWorkflowDemos: readonly DemoSpec[] = [
  demo<GanttChartProps>({
    id: "gantt-chart",
    component: "GanttChart",
    props: {
      tasks: [
        { id: "t1", name: "Scope", start: SCHEDULE_START, end: SCHEDULE_START + 4 * DAY, progress: 1 },
        { id: "t2", name: "Build", start: SCHEDULE_START + 4 * DAY, end: SCHEDULE_START + 14 * DAY, progress: 0.7 },
        { id: "t3", name: "Review", start: SCHEDULE_START + 12 * DAY, end: SCHEDULE_START + 18 * DAY, progress: 0.2 },
        { id: "t4", name: "Release", start: SCHEDULE_START + 19 * DAY, end: SCHEDULE_START + 21 * DAY },
      ],
      axisLabel: "Weeks",
      /*
       * A schedule axis prints dates, not epoch milliseconds. The fixture used to
       * pass `{ kind: "number" }`, which would label a three-week plan with
       * "1791158400000" — a number nobody reads. The default `date` format picks
       * its granularity from the span.
       */
      timeFormat: { kind: "date" },
      height: 300,
      ariaLabel: "Delivery schedule",
    },
    render: (props) => <GanttChart {...props} />,
    note: "Four tasks on a real time axis, with progress drawn inside each bar rather than implied.",
  }),
  demo<DumbbellChartProps>({
    id: "dumbbell-chart",
    component: "DumbbellChart",
    props: {
      rows: [
        { label: "Latency p95", from: 412, to: 260 },
        { label: "Error rate", from: 1.8, to: 0.6 },
        { label: "Cost per run", from: 42, to: 31 },
        { label: "Coverage", from: 68, to: 84 },
      ],
      labels: ["Before", "After"],
      format: { kind: "number", decimals: 1 },
      height: 300,
      ariaLabel: "Before and after",
    },
    render: (props) => <DumbbellChart {...props} />,
    note: "One measured quantity per row at two moments; the connector is the change, and its direction is the message.",
  }),
  demo<SlopeChartProps>({
    id: "slope-chart",
    component: "SlopeChart",
    props: {
      rows: [
        { label: "Momentum", left: 1, right: 3, tone: "warning" },
        { label: "Value", left: 2, right: 1, tone: "positive" },
        { label: "Carry", left: 3, right: 2, tone: "accent" },
        { label: "Quality", left: 4, right: 4, tone: "neutral" },
      ],
      periods: ["Q1", "Q2"],
      format: { kind: "integer" },
      height: 300,
      ariaLabel: "Rank movement",
    },
    render: (props) => <SlopeChart {...props} />,
    note: "Ranks rather than levels: lines are free to cross, and the crossing is the finding.",
  }),
  demo<BulletChartProps>({
    id: "bullet-chart",
    component: "BulletChart",
    props: {
      rows: [
        { label: "Coverage", value: 84, target: 90, ranges: [60, 80, 100] },
        { label: "Latency", value: 72, target: 70, ranges: [50, 75, 100] },
        { label: "Uptime", value: 98, target: 99, ranges: [95, 98, 100] },
      ],
      valueLabel: "Actual",
      targetLabel: "Target",
      format: { kind: "integer", suffix: "%" },
      height: 280,
      ariaLabel: "Actual against target",
    },
    render: (props) => <BulletChart {...props} />,
    note: "A measured value, a target and qualitative bands — the ranges are context, not thresholds the chart enforces.",
  }),
  demo<BumpChartProps>({
    id: "bump-chart",
    component: "BumpChart",
    props: {
      periods: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { label: "Momentum", tone: "warning", ranks: [1, 1, 2, 3] },
        { label: "Value", tone: "positive", ranks: [3, 2, 1, 1] },
        { label: "Carry", tone: "accent", ranks: [2, 3, 3, 2] },
        { label: "Quality", tone: "neutral", ranks: [4, 4, null, 4] },
      ],
      rankLabel: "Rank",
      height: 320,
      ariaLabel: "Rank by quarter",
    },
    render: (props) => <BumpChart {...props} />,
    note: "Ranks per quarter with an explicit null where a series was not scored — a gap, never a zero.",
  }),
  demo<LollipopChartProps>({
    id: "lollipop-chart",
    component: "LollipopChart",
    props: {
      data: [
        { label: "Equity", value: 42 },
        { label: "Credit", value: 24 },
        { label: "Rates", value: 16 },
        { label: "Gold", value: 11 },
        { label: "Cash", value: 7 },
      ],
      format: { kind: "number", decimals: 0, suffix: "%" },
      height: 300,
      ariaLabel: "Weights by block",
    },
    render: (props) => <LollipopChart {...props} />,
    note: "A ranked list on horizontal rows: the same magnitude as a bar, with less ink per category.",
  }),
  demo<MekkoChartProps>({
    id: "mekko-chart",
    component: "MekkoChart",
    props: {
      columns: [
        {
          label: "EMEA",
          weight: 48,
          segments: [
            { name: "Net new", value: 26 },
            { name: "Expansion", value: 15 },
            { name: "Churn", value: 7 },
          ],
        },
        {
          label: "Americas",
          weight: 72,
          segments: [
            { name: "Net new", value: 41 },
            { name: "Expansion", value: 19 },
            { name: "Churn", value: 12 },
          ],
        },
        {
          label: "APAC",
          weight: 24,
          segments: [
            { name: "Net new", value: 15 },
            { name: "Expansion", value: 6 },
            { name: "Churn", value: 3 },
          ],
        },
      ],
      format: { kind: "number", decimals: 0, suffix: "m" },
      height: 340,
      ariaLabel: "Revenue mix by region",
    },
    render: (props) => <MekkoChart {...props} />,
    note: "Column width is the group's size, so equal percentages inside unequal columns read as the different facts they are.",
  }),
];
