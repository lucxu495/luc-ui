/*
 * The general chart family: series over time, magnitude by category, part of a
 * whole, and uncertainty around a line.
 *
 * Every fixture is eight or fewer rows so the copyable snippet is readable, and
 * every one is deterministic — fixed dates, fixed values, no clock. The unit of
 * each number is declared on the axis that draws it, because `0.42` is a ratio,
 * 42 % and 42 basis points depending only on what the caller says it is.
 */

import {
  AreaChart,
  BarChart,
  BubbleChart,
  ComposedChart,
  FanChart,
  FunnelChart,
  HistogramChart,
  LineChart,
  PieChart,
  RangeBandChart,
  ScatterChart,
  SmallMultiple,
  SmallMultiples,
  Sparkline,
  WaterfallChart,
  type CartesianChartProps,
  type FanChartProps,
  type FunnelChartProps,
  type HistogramChartProps,
  type PieChartProps,
  type RangeBandChartProps,
  type SparklineProps,
  type WaterfallChartProps,
} from "@luc/ui/charts";
import { composition, demo, type DemoSpec } from "../index";

/* Eight weekly closes of one instrument, with the caller's own trend series. */
const SERIES_ROWS = [
  { date: "2026-08-17", close: 94.2, trend: 94.6 },
  { date: "2026-08-24", close: 95.1, trend: 94.8 },
  { date: "2026-08-31", close: 96.4, trend: 95.1 },
  { date: "2026-09-07", close: 95.8, trend: 95.4 },
  { date: "2026-09-14", close: 97.1, trend: 95.8 },
  { date: "2026-09-21", close: 98.6, trend: 96.3 },
  { date: "2026-09-28", close: 97.9, trend: 96.7 },
  { date: "2026-10-05", close: 99.4, trend: 97.2 },
];

const AREA_ROWS = [
  { date: "2026-08-17", value: 18.4 },
  { date: "2026-08-24", value: 17.1 },
  { date: "2026-08-31", value: 16.6 },
  { date: "2026-09-07", value: 15.2 },
  { date: "2026-09-14", value: 15.9 },
  { date: "2026-09-21", value: 14.4 },
  { date: "2026-09-28", value: 13.8 },
  { date: "2026-10-05", value: 14.1 },
];

const BAR_ROWS = [
  { quarter: "Q1", revenue: 42.6 },
  { quarter: "Q2", revenue: 46.1 },
  { quarter: "Q3", revenue: 51.8 },
  { quarter: "Q4", revenue: 49.4 },
  { quarter: "Q1 ", revenue: 55.2 },
];

const SCATTER_ROWS = [
  { factor: -1.42, forward: -1.05, turnover: 12 },
  { factor: -1.05, forward: -0.78, turnover: 8 },
  { factor: -0.63, forward: -0.41, turnover: 21 },
  { factor: -0.24, forward: -0.32, turnover: 15 },
  { factor: 0.18, forward: 0.24, turnover: 9 },
  { factor: 0.55, forward: 0.48, turnover: 27 },
  { factor: 0.94, forward: 0.86, turnover: 18 },
  { factor: 1.38, forward: 1.31, turnover: 11 },
];

const COMPOSED_ROWS = [
  { date: "2026-09-21", close: 96.4, drawdown: -1.2 },
  { date: "2026-09-22", close: 96.9, drawdown: -0.8 },
  { date: "2026-09-23", close: 96.2, drawdown: -1.5 },
  { date: "2026-09-24", close: 95.5, drawdown: -2.3 },
  { date: "2026-09-25", close: 96.1, drawdown: -1.7 },
  { date: "2026-09-28", close: 97.3, drawdown: -0.6 },
  { date: "2026-09-29", close: 98.0, drawdown: -0.1 },
  { date: "2026-09-30", close: 97.4, drawdown: -0.7 },
];

const FAN_X = ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"];
const FAN_MEDIAN = [100, 101.4, 102.9, 104.2, 105.6, 107.1, 108.4, 109.9];

export const chartGeneralDemos: readonly DemoSpec[] = [
  demo<CartesianChartProps>({
    id: "line-chart",
    component: "LineChart",
    props: {
      data: SERIES_ROWS,
      xKey: "date",
      axes: [{ id: "primary", position: "left", format: { kind: "number", decimals: 1 } }],
      series: [
        { key: "close", label: "Close", type: "line", tone: "accent", lineWidth: 2, axis: "primary" },
        { key: "trend", label: "Trend", type: "line", tone: "neutral", lineType: "dashed", symbol: false },
      ],
      interaction: { zoom: "none" },
      height: 320,
      ariaLabel: "Weekly closes",
    },
    render: (props) => <LineChart {...props} />,
    note: "Eight weekly closes and a supplied trend line; both series are the caller's numbers.",
  }),
  demo<CartesianChartProps>({
    id: "area-chart",
    component: "AreaChart",
    props: {
      data: AREA_ROWS,
      xKey: "date",
      axes: [{ id: "primary", format: { kind: "number", decimals: 1, suffix: "%" } }],
      series: [{ key: "value", label: "Realised vol", type: "area", tone: "accent", axis: "primary" }],
      interaction: { zoom: "none" },
      height: 320,
      ariaLabel: "Realised volatility",
    },
    render: (props) => <AreaChart {...props} />,
    note: "Percentage points on the value axis, one filled series, eight observations.",
  }),
  demo<CartesianChartProps>({
    id: "bar-chart",
    component: "BarChart",
    props: {
      data: BAR_ROWS,
      xKey: "quarter",
      axes: [{ id: "primary", format: { kind: "decimal", decimals: 1, suffix: "m" } }],
      series: [{ key: "revenue", label: "Revenue", type: "bar", tone: "accent", axis: "primary" }],
      height: 320,
      ariaLabel: "Revenue by quarter",
    },
    render: (props) => <BarChart {...props} />,
    note: "Magnitude by category in millions; five bars, one series, no stacking.",
  }),
  demo<CartesianChartProps>({
    id: "scatter-chart",
    component: "ScatterChart",
    props: {
      data: SCATTER_ROWS,
      xKey: "factor",
      x: { type: "value", format: { kind: "decimal", decimals: 2 } },
      axes: [{ id: "primary", format: { kind: "percent", decimals: 1 } }],
      series: [{ key: "forward", label: "Forward return", type: "scatter", tone: "accent" }],
      annotations: {
        referenceLines: [
          { value: 0, axis: "x", label: "Zero factor", tone: "neutral" },
          { value: 0, axis: "y", label: "Zero return", tone: "neutral" },
        ],
      },
      height: 320,
      ariaLabel: "Factor against return",
    },
    render: (props) => <ScatterChart {...props} />,
    note: "Two numeric axes with zero guides: the points are observations, not a fitted relationship.",
  }),
  demo<CartesianChartProps>({
    id: "bubble-chart",
    component: "BubbleChart",
    props: {
      data: SCATTER_ROWS,
      xKey: "factor",
      x: { type: "value", format: { kind: "decimal", decimals: 2 } },
      axes: [{ id: "primary", format: { kind: "percent", decimals: 1 } }],
      series: [
        {
          key: "forward",
          label: "Forward return",
          type: "scatter",
          tone: "accent",
          sizeKey: "turnover",
        },
      ],
      height: 320,
      ariaLabel: "Return by size",
    },
    render: (props) => <BubbleChart {...props} />,
    note: "The same observations with a third supplied measure — turnover — carried by the bubble radius.",
  }),
  demo<CartesianChartProps>({
    id: "composed-chart",
    component: "ComposedChart",
    props: {
      data: COMPOSED_ROWS,
      xKey: "date",
      axes: [
        { id: "price", position: "right", format: { kind: "number", decimals: 1 } },
        { id: "drawdown", position: "left", format: { kind: "percent", decimals: 1 } },
      ],
      series: [
        { key: "close", label: "Close", type: "line", axis: "price", tone: "accent", lineWidth: 2 },
        { key: "drawdown", label: "Drawdown", type: "bar", axis: "drawdown", tone: "negative", opacity: 0.5 },
      ],
      height: 340,
      ariaLabel: "Close with drawdown",
    },
    render: (props) => <ComposedChart {...props} />,
    note: "Two marks, two axes, two units: a price on the right and a negative percentage on the left.",
  }),
  demo<PieChartProps>({
    id: "pie-chart",
    component: "PieChart",
    props: {
      data: [
        { name: "Equity", value: 42 },
        { name: "Credit", value: 24 },
        { name: "Rates", value: 16 },
        { name: "Gold", value: 11 },
        { name: "Cash", value: 7 },
      ],
      centerValue: "100",
      centerLabel: "Weight",
      format: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "Portfolio weights",
    },
    render: (props) => <PieChart {...props} />,
    note: "Five parts of a genuine whole, capped at six by the component itself.",
  }),
  demo<FunnelChartProps>({
    id: "funnel-chart",
    component: "FunnelChart",
    props: {
      data: [
        { name: "Visit", value: 980 },
        { name: "Signup", value: 384 },
        { name: "Trial", value: 212 },
        { name: "Paid", value: 96 },
        { name: "Renewed", value: 61 },
      ],
      format: { kind: "integer" },
      height: 340,
      ariaLabel: "Signup funnel",
    },
    render: (props) => <FunnelChart {...props} />,
    note: "Stages in order, each count smaller than the last; nothing is aggregated by the chart.",
  }),
  demo<HistogramChartProps>({
    id: "histogram-chart",
    component: "HistogramChart",
    props: {
      bins: [
        { from: -3, to: -2, count: 4 },
        { from: -2, to: -1, count: 19 },
        { from: -1, to: 0, count: 47 },
        { from: 0, to: 1, count: 52 },
        { from: 1, to: 2, count: 21 },
        { from: 2, to: 3, count: 6 },
      ],
      xFormat: { kind: "percent", decimals: 0 },
      format: { kind: "integer" },
      annotations: { referenceLines: [{ value: 0, label: "Zero", axisLabel: true, tone: "neutral" }] },
      height: 320,
      ariaLabel: "Distribution of returns",
    },
    render: (props) => <HistogramChart {...props} />,
    note: "A pre-binned sample of 149 observations; the chart counts nothing and bins nothing.",
  }),
  demo<WaterfallChartProps>({
    id: "waterfall-chart",
    component: "WaterfallChart",
    props: {
      data: [
        { label: "Opening", value: 240, total: true },
        { label: "New", value: 86 },
        { label: "Upgrades", value: 42 },
        { label: "Churn", value: -58 },
        { label: "Downgrades", value: -31 },
        { label: "Closing", value: 279, total: true },
      ],
      format: { kind: "integer" },
      height: 340,
      ariaLabel: "Movement in accounts",
    },
    render: (props) => <WaterfallChart {...props} />,
    note: "240 + 86 + 42 − 58 − 31 = 279: the running total is arithmetically correct, and the chart only draws it.",
  }),
  demo<RangeBandChartProps>({
    id: "range-band-chart",
    component: "RangeBandChart",
    props: {
      points: [
        { t: "2026-08-17", center: 100, lower: 97.2, upper: 102.6 },
        { t: "2026-08-24", center: 101.1, lower: 98.1, upper: 103.9 },
        { t: "2026-08-31", center: 102.4, lower: 99.4, upper: 105.2 },
        { t: "2026-09-07", center: 103.2, lower: 100.1, upper: 106.4 },
        { t: "2026-09-14", center: 104.6, lower: 101.2, upper: 107.8 },
        { t: "2026-09-21", center: 105.9, lower: 102.4, upper: 109.3 },
        { t: "2026-09-28", center: 106.8, lower: 103.1, upper: 110.4 },
        { t: "2026-10-05", center: 107.9, lower: 104.2, upper: 111.6 },
      ],
      format: { kind: "decimal", decimals: 1 },
      bandLabel: "80% interval",
      height: 320,
      ariaLabel: "Estimate with interval",
    },
    render: (props) => <RangeBandChart {...props} />,
    note: "A centre line with one supplied interval: lower ≤ centre ≤ upper at every point.",
  }),
  demo<FanChartProps>({
    id: "fan-chart",
    component: "FanChart",
    props: {
      x: FAN_X,
      bands: [
        {
          label: "P5–P95",
          lower: [96, 94.8, 94.1, 93.6, 93.2, 92.9, 92.7, 92.6],
          upper: [104, 107.2, 110.4, 113.1, 115.6, 118.2, 120.4, 122.7],
        },
        {
          label: "P25–P75",
          lower: [98.6, 99.2, 99.9, 100.7, 101.4, 102.1, 102.8, 103.6],
          upper: [101.4, 103.2, 105.1, 106.9, 108.7, 110.4, 112.1, 113.9],
        },
      ],
      median: FAN_MEDIAN,
      format: { kind: "decimal", decimals: 1 },
      height: 340,
      ariaLabel: "Forecast cone",
    },
    render: (props) => <FanChart {...props} />,
    note: "Nested quantile bands ordered widest to narrowest, with the median the analytics layer computed.",
  }),
  demo<SparklineProps>({
    id: "sparkline",
    component: "Sparkline",
    props: {
      values: [0.9, 1.05, 1.02, 1.18, 1.1, 1.22, 1.31, 1.24],
      tone: "positive",
      marker: true,
      width: 160,
      height: 40,
      ariaLabel: "Sharpe ratio",
    },
    render: (props) => (
      <SmallMultiple title="Sharpe" aside="1.24">
        <Sparkline {...props} />
      </SmallMultiple>
    ),
    note: "Eight readings, no axes and no labels — a sparkline is a shape, not a chart you read values off.",
  }),
  composition({
    id: "small-multiples",
    node: (
      <SmallMultiples columns={2} label="Rolling volatility">
        {[
          { window: "30D", values: [18.4, 17.1, 16.6, 15.2, 15.9, 14.4, 13.8, 14.1] },
          { window: "90D", values: [14.2, 14.5, 14.9, 15.1, 15.4, 15.2, 15.6, 15.9] },
          { window: "180D", values: [12.6, 12.7, 12.9, 13.1, 13.2, 13.4, 13.5, 13.7] },
          { window: "1Y", values: [11.8, 11.9, 11.9, 12.1, 12.2, 12.2, 12.3, 12.4] },
        ].map((panel) => (
          <SmallMultiple key={panel.window} title={panel.window} aside={panel.values.at(-1)?.toFixed(1)}>
            <Sparkline values={panel.values} tone="accent" fill />
          </SmallMultiple>
        ))}
      </SmallMultiples>
    ),
    code: `<SmallMultiples columns={2} label="Rolling volatility">
  {windows.map((panel) => (
    <SmallMultiple key={panel.window} title={panel.window} aside={panel.latest}>
      <Sparkline values={panel.values} tone="accent" fill />
    </SmallMultiple>
  ))}
</SmallMultiples>`,
    note: "One shared caption and four panels on the same scale, which is what makes them comparable.",
  }),
];
