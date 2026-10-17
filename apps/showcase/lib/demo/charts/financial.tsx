/*
 * Financial and quantitative charts.
 *
 * The rule in this family is stricter than elsewhere, because the numbers mean
 * something to someone: a candle has to satisfy `low ≤ min(open, close) ≤
 * max(open, close) ≤ high`, a drawdown is never positive, a rate is declared in
 * percent rather than passed as a ratio, and a "frontier" or a "fit" is
 * supplied by the caller because Luc UI solves no optimisation and fits no
 * line. Every fixture below is small, deterministic, and labelled as synthetic
 * where it is.
 */

import {
  CandlestickChart,
  CurveComparisonChart,
  DepthChart,
  DrawdownChart,
  EfficientFrontierChart,
  FactorExposureChart,
  HistoricalPositionChart,
  PnlAttributionChart,
  TermStructureChart,
  VolatilitySmileChart,
  VolatilitySurfaceChart,
  type CandlestickChartProps,
  type CurveComparisonChartProps,
  type DepthChartProps,
  type DrawdownChartProps,
  type EfficientFrontierChartProps,
  type FactorExposureChartProps,
  type HistoricalPositionChartProps,
  type PnlAttributionChartProps,
  type TermStructureChartProps,
  type VolatilitySmileChartProps,
  type VolatilitySurfaceChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

const DAY = 86_400_000;
/** 2026-10-06, 00:00 UTC — a fixed epoch, so the axis never depends on "now". */
const SESSION_START = 1_791_244_800_000;

/* Eight sessions. Every row satisfies the candle invariant, and the last close
 * is below the first, which is what makes the drawdown fixture beside it true. */
const CANDLES = [
  { time: SESSION_START, open: 98.4, high: 99.6, low: 98.1, close: 99.2 },
  { time: SESSION_START + DAY, open: 99.2, high: 99.8, low: 98.2, close: 98.6 },
  { time: SESSION_START + 2 * DAY, open: 98.6, high: 98.9, low: 97.1, close: 97.4 },
  { time: SESSION_START + 3 * DAY, open: 97.4, high: 98.2, low: 97, close: 97.9 },
  { time: SESSION_START + 4 * DAY, open: 97.9, high: 99.1, low: 97.7, close: 98.8 },
  { time: SESSION_START + 5 * DAY, open: 98.8, high: 99.4, low: 98.3, close: 98.5 },
  { time: SESSION_START + 6 * DAY, open: 98.5, high: 98.7, low: 96.4, close: 96.8 },
  { time: SESSION_START + 7 * DAY, open: 96.8, high: 97.5, low: 96.2, close: 97.2 },
];

/* A three-session average of the closes above, with `null` where there is not
 * yet a window — an MA is supplied, never computed by the chart. */
const MA3 = [
  null,
  null,
  Number(((99.2 + 98.6 + 97.4) / 3).toFixed(2)),
  Number(((98.6 + 97.4 + 97.9) / 3).toFixed(2)),
  Number(((97.4 + 97.9 + 98.8) / 3).toFixed(2)),
  Number(((97.9 + 98.8 + 98.5) / 3).toFixed(2)),
  Number(((98.8 + 98.5 + 96.8) / 3).toFixed(2)),
  Number(((98.5 + 96.8 + 97.2) / 3).toFixed(2)),
];

/* Negative by construction: a drawdown is measured from a running peak, so it
 * is zero at a high and negative everywhere else. */
const DRAWDOWN = [
  { time: SESSION_START, value: 0 },
  { time: SESSION_START + DAY, value: -0.006 },
  { time: SESSION_START + 2 * DAY, value: -0.0191 },
  { time: SESSION_START + 3 * DAY, value: -0.0133 },
  { time: SESSION_START + 4 * DAY, value: -0.0043 },
  { time: SESSION_START + 5 * DAY, value: -0.0074 },
  { time: SESSION_START + 6 * DAY, value: -0.0286 },
  { time: SESSION_START + 7 * DAY, value: -0.0245 },
];

export const chartFinancialDemos: readonly DemoSpec[] = [
  demo<CandlestickChartProps>({
    id: "candlestick-chart",
    component: "CandlestickChart",
    props: {
      candles: CANDLES,
      overlays: [{ label: "MA 3", values: MA3 }],
      priceFormat: { kind: "number", decimals: 2 },
      height: 340,
      ariaLabel: "Synthetic daily candles",
    },
    render: (props) => <CandlestickChart {...props} />,
    note: "Eight synthetic sessions with one supplied moving average; the band is your line, not the chart's calculation.",
  }),
  demo<DrawdownChartProps>({
    id: "drawdown-chart",
    component: "DrawdownChart",
    props: {
      points: DRAWDOWN,
      format: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "Drawdown from peak",
    },
    render: (props) => <DrawdownChart {...props} />,
    note: "Supplied values in ratio units, negative by construction — the axis never pads above zero.",
  }),
  demo<TermStructureChartProps>({
    id: "term-structure-chart",
    component: "TermStructureChart",
    props: {
      tenors: ["1M", "3M", "6M", "1Y", "2Y", "5Y"],
      curves: [
        { name: "Latest", values: [4.35, 4.42, 4.51, 4.58, 4.62, 4.66], tone: "accent", emphasis: true },
        { name: "One week ago", values: [4.72, 4.68, 4.63, 4.59, 4.55, 4.52], tone: "neutral", lineType: "dashed" },
      ],
      yLabel: "Rate",
      format: { kind: "percent", decimals: 2 },
      height: 320,
      ariaLabel: "Rate curve",
    },
    render: (props) => <TermStructureChart {...props} />,
    note: "Rates already in percent units, two curves on a shared ordered tenor axis.",
  }),
  demo<CurveComparisonChartProps>({
    id: "curve-comparison-chart",
    component: "CurveComparisonChart",
    props: {
      xLabels: [90, 95, 100, 105, 110],
      curves: [
        { name: "One month", tone: "accent", emphasis: true, values: [24.1, 20.4, 18.6, 19.2, 21.8] },
        { name: "Three months", tone: "neutral", values: [22.4, 19.6, 18.1, 18.9, 20.7] },
      ],
      xLabel: "Strike",
      yLabel: "Implied volatility",
      format: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "Smile by expiry",
    },
    render: (props) => <CurveComparisonChart {...props} />,
    note: "Implied volatility in percent against strike: the smile shape is the market's, never interpolated here.",
  }),
  demo<VolatilitySmileChartProps>({
    id: "volatility-smile-chart",
    component: "VolatilitySmileChart",
    props: {
      slices: [
        {
          expiry: "1M",
          points: [
            { strike: 90, impliedVol: 24.1 },
            { strike: 95, impliedVol: 20.4 },
            { strike: 100, impliedVol: 18.6 },
            { strike: 105, impliedVol: 19.2 },
            { strike: 110, impliedVol: 21.8 },
          ],
        },
        {
          expiry: "3M",
          points: [
            { strike: 90, impliedVol: 22.4 },
            { strike: 95, impliedVol: 19.6 },
            { strike: 100, impliedVol: 18.1 },
            { strike: 105, impliedVol: 18.9 },
            { strike: 110, impliedVol: 20.7 },
          ],
        },
      ],
      strikeFormat: { kind: "number", decimals: 0 },
      volFormat: { kind: "number", decimals: 1, suffix: "%" },
      height: 340,
      ariaLabel: "Volatility by strike",
    },
    render: (props) => <VolatilitySmileChart {...props} />,
    note: "Strike on a numeric axis, one curve per expiry. Volatility is declared with its own percent suffix.",
  }),
  demo<VolatilitySurfaceChartProps>({
    id: "volatility-surface-chart",
    component: "VolatilitySurfaceChart",
    props: {
      strikes: [90, 95, 100, 105, 110],
      maturities: [0.25, 0.5, 1, 2],
      /* `vols[maturity][strike]`, as ratios: 0.224 is 22.4 %. */
      vols: [
        [0.241, 0.204, 0.186, 0.192, 0.218],
        [0.231, 0.199, 0.183, 0.19, 0.211],
        [0.224, 0.196, 0.181, 0.189, 0.207],
        [0.216, 0.192, 0.179, 0.187, 0.202],
      ],
      strikeLabel: "Strike",
      maturityLabel: "Maturity (years)",
      height: 380,
      ariaLabel: "Volatility surface",
    },
    render: (props) => <VolatilitySurfaceChart {...props} />,
    note: "A supplied grid of ratios, drawn as a projected surface — no 3D engine, and nothing is interpolated between nodes.",
  }),
  demo<EfficientFrontierChartProps>({
    id: "efficient-frontier-chart",
    component: "EfficientFrontierChart",
    props: {
      /* Risk and return in percent, matching the percent axis format. */
      assets: [
        { label: "Equity", risk: 16, expectedReturn: 8 },
        { label: "Credit", risk: 9, expectedReturn: 5.2 },
        { label: "Rates", risk: 5.5, expectedReturn: 2.8 },
        { label: "Gold", risk: 13, expectedReturn: 4.5 },
        { label: "Cash", risk: 0.4, expectedReturn: 1.9 },
      ],
      frontier: [
        { risk: 2, expectedReturn: 2.4 },
        { risk: 5, expectedReturn: 3.9 },
        { risk: 8, expectedReturn: 5.1 },
        { risk: 11, expectedReturn: 6.1 },
        { risk: 14, expectedReturn: 7 },
        { risk: 17, expectedReturn: 7.8 },
      ],
      current: { label: "Current", risk: 10, expectedReturn: 5.5 },
      riskFormat: { kind: "percent", decimals: 0 },
      returnFormat: { kind: "percent", decimals: 0 },
      height: 340,
      ariaLabel: "Risk against return",
    },
    render: (props) => <EfficientFrontierChart {...props} />,
    note: "The frontier is supplied as ordered points: LUC draws the optimisation result, it does not solve one.",
  }),
  demo<FactorExposureChartProps>({
    id: "factor-exposure-chart",
    component: "FactorExposureChart",
    props: {
      factors: [
        { label: "Market", value: 0.86 },
        { label: "Value", value: 0.31 },
        { label: "Momentum", value: -0.22 },
        { label: "Quality", value: 0.44 },
        { label: "Size", value: -0.15 },
        { label: "Low vol", value: 0.12 },
      ],
      format: { kind: "number", decimals: 2, signed: true },
      height: 320,
      ariaLabel: "Factor exposures",
    },
    render: (props) => <FactorExposureChart {...props} />,
    note: "Signed exposures on a zero-centred axis, computed by your risk model and handed over as numbers.",
  }),
  demo<PnlAttributionChartProps>({
    id: "pnl-attribution-chart",
    component: "PnlAttributionChart",
    props: {
      periods: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [
        { label: "Trend", values: [42, 18, -12, 51, 34, 22] },
        { label: "Carry", values: [12, 14, 11, 9, 13, 15] },
        { label: "Costs", values: [-11, -9, -13, -10, -12, -14] },
      ],
      format: { kind: "number", decimals: 0, suffix: " bps" },
      height: 340,
      ariaLabel: "Monthly attribution",
    },
    render: (props) => <PnlAttributionChart {...props} />,
    note: "Stacked contributions in basis points, including the cost line: the total is the sum of what you pass in.",
  }),
  demo<DepthChartProps>({
    id: "depth-chart",
    component: "DepthChart",
    props: {
      bids: [
        { price: 99.5, size: 4.2 },
        { price: 99, size: 9.6 },
        { price: 98.5, size: 16.1 },
        { price: 98, size: 24.8 },
        { price: 97.5, size: 38.4 },
      ],
      asks: [
        { price: 100.5, size: 3.8 },
        { price: 101, size: 8.9 },
        { price: 101.5, size: 15.2 },
        { price: 102, size: 23.4 },
        { price: 102.5, size: 35.7 },
      ],
      mid: 100,
      priceFormat: { kind: "number", decimals: 1 },
      sizeFormat: { kind: "decimal", decimals: 1 },
      height: 320,
      ariaLabel: "Order book depth",
    },
    render: (props) => <DepthChart {...props} />,
    note: "Cumulative size either side of the mid, ascending away from it on both sides.",
  }),
  demo<HistoricalPositionChartProps>({
    id: "historical-position-chart",
    component: "HistoricalPositionChart",
    props: {
      percentile: 78,
      value: "+4.1 %",
      percentileLabel: "78th percentile",
      height: 56,
      ariaLabel: "Position in history",
    },
    render: (props) => <HistoricalPositionChart {...props} />,
    note: "One served percentile on a quantile band: the reading is yours, the band is the chart's.",
  }),
];
