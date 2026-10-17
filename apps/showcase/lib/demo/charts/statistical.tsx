/*
 * Live Demos — Charts, statistical.
 *
 * `box-plot-chart`, `calibration-chart`, `confusion-matrix-chart`,
 * `correlation-matrix`, `distribution-chart`, `ecdf-chart`, `error-bar-chart`,
 * `qq-plot-chart`, `quadrant-scatter-chart`, `roc-curve-chart`,
 * `scatter-regression-chart`, `violin-chart`.
 */

/*
 * Statistical charts.
 *
 * Every fixture here is prepared data — the library bins nothing, fits nothing
 * and integrates nothing, so a fixture that looked like a model output would be
 * a lie about the component. Each one is small enough to read in the copied
 * snippet and still satisfies the contract of its chart: a monotone step for
 * the ECDF, ascending quantiles for the Q–Q plot, a symmetric matrix with a
 * unit diagonal for the correlation matrix, and so on.
 */

import {
  BoxPlotChart,
  CalibrationChart,
  ConfusionMatrixChart,
  CorrelationMatrix,
  DistributionChart,
  EcdfChart,
  ErrorBarChart,
  QqPlotChart,
  QuadrantScatterChart,
  RocCurveChart,
  ScatterRegressionChart,
  ViolinChart,
  type BoxPlotChartProps,
  type CalibrationChartProps,
  type ConfusionMatrixChartProps,
  type CorrelationMatrixProps,
  type DistributionChartProps,
  type EcdfChartProps,
  type ErrorBarChartProps,
  type QqPlotChartProps,
  type QuadrantScatterChartProps,
  type RocCurveChartProps,
  type ScatterRegressionChartProps,
  type ViolinChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

/* Session returns in percent, twelve order statistics per sample. Ascending in
 * `x`, cumulative in `y`, and the repeated x where the step jumps is deliberate:
 * a CDF is a step function, and interpolating between order statistics invents
 * mass the sample does not have. */
const ECDF = [
  { x: -2.9, y: 0 },
  { x: -2.9, y: 0.08 },
  { x: -2.1, y: 0.17 },
  { x: -1.4, y: 0.25 },
  { x: -0.8, y: 0.33 },
  { x: -0.3, y: 0.42 },
  { x: -0.3, y: 0.5 },
  { x: 0.2, y: 0.58 },
  { x: 0.7, y: 0.67 },
  { x: 1.1, y: 0.75 },
  { x: 1.8, y: 0.83 },
  { x: 2.6, y: 0.92 },
  { x: 3.4, y: 1 },
];

const ECDF_TILTED = [
  { x: -2.4, y: 0 },
  { x: -2.4, y: 0.08 },
  { x: -1.6, y: 0.17 },
  { x: -1, y: 0.25 },
  { x: -0.4, y: 0.33 },
  { x: 0.1, y: 0.42 },
  { x: 0.1, y: 0.5 },
  { x: 0.6, y: 0.58 },
  { x: 1.2, y: 0.67 },
  { x: 1.9, y: 0.75 },
  { x: 2.7, y: 0.83 },
  { x: 3.6, y: 0.92 },
  { x: 4.8, y: 1 },
];

/* Theoretical quantiles against sample quantiles, both ascending. A normal
 * sample lands near the 45° line; this one is slightly heavy in both tails. */
const QQ = [
  { x: -1.73, y: -2.05 },
  { x: -1.15, y: -1.31 },
  { x: -0.79, y: -0.86 },
  { x: -0.51, y: -0.58 },
  { x: -0.27, y: -0.24 },
  { x: -0.05, y: -0.02 },
  { x: 0.16, y: 0.19 },
  { x: 0.38, y: 0.36 },
  { x: 0.62, y: 0.71 },
  { x: 0.9, y: 0.98 },
  { x: 1.27, y: 1.44 },
  { x: 1.86, y: 2.22 },
];

/* A ROC curve is monotone in both coordinates: false-positive rate and
 * true-positive rate never decrease, and the last point is (1, 1). */
const ROC_POINTS = [
  { x: 0, y: 0 },
  { x: 0.04, y: 0.28 },
  { x: 0.11, y: 0.51 },
  { x: 0.22, y: 0.68 },
  { x: 0.38, y: 0.81 },
  { x: 0.61, y: 0.9 },
  { x: 1, y: 1 },
];

const ROC_POINTS_B = [
  { x: 0, y: 0 },
  { x: 0.06, y: 0.21 },
  { x: 0.15, y: 0.39 },
  { x: 0.3, y: 0.57 },
  { x: 0.49, y: 0.72 },
  { x: 0.72, y: 0.85 },
  { x: 1, y: 1 },
];

/* Eight prepared observations: two factors that move together, with one asset
 * that does not. */
const OBSERVATIONS = [
  { x: -1.42, y: -1.18, label: "EQ" },
  { x: -1.05, y: -0.84, label: "HY" },
  { x: -0.63, y: -0.51, label: "IG" },
  { x: -0.24, y: -0.31, label: "CMD" },
  { x: 0.18, y: 0.11, label: "FX" },
  { x: 0.55, y: 0.62, label: "REIT" },
  { x: 0.94, y: 0.71, label: "GOLD" },
  { x: 1.38, y: 1.24, label: "TECH" },
];

const X_VALUES = OBSERVATIONS.map((point) => point.x);

export const chartStatisticalDemos: readonly DemoSpec[] = [
  demo<EcdfChartProps>({
    id: "ecdf-chart",
    component: "EcdfChart",
    props: {
      series: [
        { key: "baseline", label: "Baseline", tone: "neutral", points: ECDF },
        { key: "candidate", label: "Candidate", tone: "accent", points: ECDF_TILTED },
      ],
      xFormat: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "ECDF of returns",
    },
    render: (props) => <EcdfChart {...props} />,
    note: "Twelve order statistics per sample, drawn as a step because a cumulative distribution is a step function.",
  }),
  demo<QqPlotChartProps>({
    id: "qq-plot-chart",
    component: "QqPlotChart",
    props: { points: QQ, height: 320, ariaLabel: "Normal quantile plot" },
    render: (props) => <QqPlotChart {...props} />,
    note: "Sample quantiles against theoretical normal quantiles; the curve leaves the 45° line in both tails.",
  }),
  demo<ViolinChartProps>({
    id: "violin-chart",
    component: "ViolinChart",
    props: {
      groups: [
        {
          label: "Baseline",
          tone: "neutral",
          marker: { value: 0, label: "median" },
          bins: [
            { value: -2, density: 0.04 },
            { value: -1.4, density: 0.14 },
            { value: -0.8, density: 0.31 },
            { value: -0.2, density: 0.45 },
            { value: 0.4, density: 0.38 },
            { value: 1, density: 0.2 },
            { value: 1.6, density: 0.07 },
          ],
        },
        {
          label: "Trend",
          tone: "accent",
          marker: { value: 0.6, label: "median" },
          bins: [
            { value: -1.2, density: 0.03 },
            { value: -0.5, density: 0.12 },
            { value: 0.2, density: 0.34 },
            { value: 0.9, density: 0.46 },
            { value: 1.6, density: 0.3 },
            { value: 2.3, density: 0.13 },
            { value: 3, density: 0.04 },
          ],
        },
        {
          label: "Carry",
          tone: "info",
          bins: [
            { value: -2.6, density: 0.06 },
            { value: -1.9, density: 0.17 },
            { value: -1.2, density: 0.33 },
            { value: -0.5, density: 0.42 },
            { value: 0.2, density: 0.29 },
            { value: 0.9, density: 0.14 },
            { value: 1.6, density: 0.05 },
          ],
        },
      ],
      valueFormat: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "Density per family",
    },
    render: (props) => <ViolinChart {...props} />,
    note: "Three supplied density outlines with the median the caller computed; nothing here is fitted.",
  }),
  demo<BoxPlotChartProps>({
    id: "box-plot-chart",
    component: "BoxPlotChart",
    props: {
      categories: ["Momentum", "Value", "Carry"],
      data: [
        [-1.8, -0.6, 0.12, 0.71, 1.9],
        [-2.4, -0.9, -0.18, 0.52, 1.6],
        [-1.2, -0.32, 0.24, 0.88, 2.2],
      ],
      outliers: [
        { category: 0, value: 2.6 },
        { category: 1, value: -3.1 },
      ],
      format: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "Dispersion by family",
    },
    render: (props) => <BoxPlotChart {...props} />,
    note: "Five-number summaries in percent, with the two points the caller classified as outliers.",
  }),
  demo<DistributionChartProps>({
    id: "distribution-chart",
    component: "DistributionChart",
    props: {
      bins: [
        { from: -3, to: -2, count: 4 },
        { from: -2, to: -1, count: 18 },
        { from: -1, to: 0, count: 46 },
        { from: 0, to: 1, count: 52 },
        { from: 1, to: 2, count: 21 },
        { from: 2, to: 3, count: 6 },
      ],
      density: {
        x: [-2.6, -2, -1.4, -0.8, -0.2, 0.4, 1, 1.6, 2.2, 2.8],
        y: [0.02, 0.08, 0.2, 0.36, 0.46, 0.38, 0.22, 0.1, 0.04, 0.01],
        label: "Kernel estimate",
      },
      references: [
        { value: -0.12, label: "Median", kind: "median" },
        { value: 0.04, label: "Mean", kind: "mean" },
      ],
      xFormat: { kind: "percent", decimals: 0 },
      format: { kind: "integer" },
      height: 320,
      ariaLabel: "Return distribution",
    },
    render: (props) => <DistributionChart {...props} />,
    note: "A pre-binned sample with a supplied density overlay and two reference markers — the library bins and fits nothing.",
  }),
  demo<ErrorBarChartProps>({
    id: "error-bar-chart",
    component: "ErrorBarChart",
    props: {
      points: [
        { label: "Market", value: 0.62, lower: 0.48, upper: 0.76 },
        { label: "Size", value: -0.18, lower: -0.34, upper: -0.02 },
        { label: "Value", value: 0.31, lower: 0.12, upper: 0.5 },
        { label: "Momentum", value: 0.09, lower: -0.11, upper: 0.29 },
        { label: "Quality", value: 0.24, lower: 0.06, upper: 0.42, tone: "positive" },
      ],
      intervalLabel: "95% CI",
      format: { kind: "number", decimals: 2, signed: true },
      height: 320,
      ariaLabel: "Factor exposures",
    },
    render: (props) => <ErrorBarChart {...props} />,
    note: "Five prepared point estimates with their confidence bounds; the interval is supplied, not computed.",
  }),
  demo<RocCurveChartProps>({
    id: "roc-curve-chart",
    component: "RocCurveChart",
    props: {
      curves: [
        { label: "Model A", auc: 0.84, tone: "accent", points: ROC_POINTS },
        { label: "Model B", auc: 0.74, tone: "neutral", points: ROC_POINTS_B },
      ],
      xFormat: { kind: "percent", decimals: 0 },
      yFormat: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "ROC for two models",
    },
    render: (props) => <RocCurveChart {...props} />,
    note: "Both curves rise monotonically to (1, 1); the areas under them are the caller's numbers.",
  }),
  demo<CalibrationChartProps>({
    id: "calibration-chart",
    component: "CalibrationChart",
    props: {
      bins: [
        { predicted: 0.06, observed: 0.05, count: 140 },
        { predicted: 0.18, observed: 0.16, count: 96 },
        { predicted: 0.34, observed: 0.31, count: 62 },
        { predicted: 0.52, observed: 0.55, count: 48 },
        { predicted: 0.71, observed: 0.74, count: 31 },
        { predicted: 0.89, observed: 0.86, count: 19 },
      ],
      xFormat: { kind: "percent", decimals: 0 },
      yFormat: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "Reliability diagram",
    },
    render: (props) => <CalibrationChart {...props} />,
    note: "Predicted against observed frequency, with bin size drawn as area so a sparse bin cannot masquerade.",
  }),
  demo<ConfusionMatrixChartProps>({
    id: "confusion-matrix-chart",
    component: "ConfusionMatrixChart",
    props: {
      labels: ["Buy", "Hold", "Sell"],
      matrix: [
        [82, 11, 7],
        [9, 74, 17],
        [6, 13, 81],
      ],
      normalized: true,
      height: 320,
      ariaLabel: "Confusion matrix",
    },
    render: (props) => <ConfusionMatrixChart {...props} />,
    note: "Integer counts, row-normalised: each row is the distribution of what actually happened.",
  }),
  demo<CorrelationMatrixProps>({
    id: "correlation-matrix",
    component: "CorrelationMatrix",
    props: {
      labels: ["Equity", "Credit", "Rates", "Gold", "Oil"],
      values: [
        [1, 0.72, -0.34, 0.11, 0.46],
        [0.72, 1, -0.18, 0.05, 0.38],
        [-0.34, -0.18, 1, 0.29, -0.22],
        [0.11, 0.05, 0.29, 1, 0.17],
        [0.46, 0.38, -0.22, 0.17, 1],
      ],
      height: 340,
      ariaLabel: "Correlation across assets",
    },
    render: (props) => <CorrelationMatrix {...props} />,
    note: "Symmetric coefficients in −1…1 with a unit diagonal; the matrix arrives already computed.",
  }),
  demo<QuadrantScatterChartProps>({
    id: "quadrant-scatter-chart",
    component: "QuadrantScatterChart",
    props: {
      points: OBSERVATIONS,
      xReference: 0,
      yReference: 0,
      quadrantLabels: {
        topRight: "Add",
        topLeft: "Watch",
        bottomRight: "Review",
        bottomLeft: "Avoid",
      },
      pointLabel: "Asset",
      xLabel: "Factor exposure",
      yLabel: "Realised return",
      height: 340,
      ariaLabel: "Assets by quadrant",
    },
    render: (props) => <QuadrantScatterChart {...props} />,
    note: "Eight labelled observations split by the caller's reference lines, which are the chart.",
  }),
  demo<ScatterRegressionChartProps>({
    id: "scatter-regression-chart",
    component: "ScatterRegressionChart",
    props: {
      points: OBSERVATIONS,
      regression: { slope: 0.86, intercept: 0.03, label: "Prepared fit" },
      band: {
        xValues: X_VALUES,
        lower: X_VALUES.map((x) => 0.86 * x + 0.03 - 0.14),
        upper: X_VALUES.map((x) => 0.86 * x + 0.03 + 0.14),
        label: "95% band",
      },
      pointLabel: "Asset",
      xLabel: "Factor exposure",
      yLabel: "Realised return",
      height: 340,
      ariaLabel: "Fit with confidence band",
    },
    render: (props) => <ScatterRegressionChart {...props} />,
    note: "The line and the band are supplied endpoints and widths: Luc UI draws a fit, it never computes one.",
  }),
];
