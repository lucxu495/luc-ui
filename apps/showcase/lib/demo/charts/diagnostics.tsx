/*
 * Diagnostics and model evaluation.
 *
 * Four charts, three of which are only meaningful because of a *shape*: an ACF
 * is bars around zero with a supplied significance band, a survival curve is a
 * step that never rises, and a precision–recall curve is monotone in recall and
 * bounded by the prevalence baseline. Each fixture is small and satisfies the
 * shape, because a diagnostic chart that is subtly wrong teaches the wrong
 * thing faster than no chart at all.
 */

import {
  AutocorrelationChart,
  FeatureImportanceChart,
  PrecisionRecallChart,
  SurvivalCurveChart,
  type AutocorrelationChartProps,
  type FeatureImportanceChartProps,
  type PrecisionRecallChartProps,
  type SurvivalCurveChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

/* An ACF decays toward zero and the caller supplies the significance band:
 * ±1.96 / √40 ≈ 0.31, which is where the bars stop being distinguishable from
 * noise. */
const ACF = [
  { x: 1, y: 0.72 },
  { x: 2, y: 0.51 },
  { x: 3, y: 0.36 },
  { x: 4, y: 0.22 },
  { x: 5, y: 0.14 },
  { x: 6, y: 0.08 },
  { x: 7, y: -0.04 },
  { x: 8, y: -0.09 },
  { x: 9, y: 0.05 },
  { x: 10, y: 0.03 },
];

const PACF = [
  { x: 1, y: 0.72 },
  { x: 2, y: 0.08 },
  { x: 3, y: -0.05 },
  { x: 4, y: 0.11 },
  { x: 5, y: 0.02 },
  { x: 6, y: -0.07 },
  { x: 7, y: 0.04 },
  { x: 8, y: -0.02 },
  { x: 9, y: 0.06 },
  { x: 10, y: -0.01 },
];

/* Survival is constant between events and drops at one: the repeated x is the
 * step, and the curve never rises. */
const SURVIVAL = [
  { x: 0, y: 1 },
  { x: 3, y: 1 },
  { x: 3, y: 0.92 },
  { x: 6, y: 0.92 },
  { x: 6, y: 0.84 },
  { x: 11, y: 0.84 },
  { x: 11, y: 0.75 },
  { x: 16, y: 0.75 },
  { x: 16, y: 0.68 },
  { x: 24, y: 0.68 },
  { x: 24, y: 0.61 },
];

const SURVIVAL_B = [
  { x: 0, y: 1 },
  { x: 4, y: 1 },
  { x: 4, y: 0.88 },
  { x: 9, y: 0.88 },
  { x: 9, y: 0.76 },
  { x: 14, y: 0.76 },
  { x: 14, y: 0.69 },
  { x: 24, y: 0.69 },
  { x: 24, y: 0.58 },
];

/* Recall increases along x; precision falls as the threshold relaxes. */
const PR = [
  { x: 0.06, y: 0.94 },
  { x: 0.2, y: 0.88 },
  { x: 0.38, y: 0.79 },
  { x: 0.58, y: 0.68 },
  { x: 0.76, y: 0.55 },
  { x: 0.9, y: 0.44 },
  { x: 1, y: 0.31 },
];

export const chartDiagnosticsDemos: readonly DemoSpec[] = [
  demo<AutocorrelationChartProps>({
    id: "autocorrelation-chart",
    component: "AutocorrelationChart",
    props: {
      series: [
        { key: "acf", label: "ACF", kind: "acf", tone: "accent", points: ACF },
        { key: "pacf", label: "PACF", kind: "pacf", tone: "neutral", points: PACF },
      ],
      band: 0.31,
      bandLabel: "±1.96/√n",
      format: { kind: "number", decimals: 2, signed: true },
      height: 320,
      ariaLabel: "Autocorrelation to lag 10",
    },
    render: (props) => <AutocorrelationChart {...props} />,
    note: "Ten lags of a supplied ACF and PACF, with the significance band the caller computed from its own sample size.",
  }),
  demo<SurvivalCurveChartProps>({
    id: "survival-curve-chart",
    component: "SurvivalCurveChart",
    props: {
      series: [
        { key: "control", label: "Control", tone: "neutral", points: SURVIVAL, censored: [{ x: 20, y: 0.64 }] },
        { key: "treated", label: "Treated", tone: "accent", points: SURVIVAL_B, censored: [{ x: 7, y: 0.82 }] },
      ],
      xFormat: { kind: "number", decimals: 0, suffix: " mo" },
      yFormat: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "Survival by cohort",
    },
    render: (props) => <SurvivalCurveChart {...props} />,
    note: "Two step curves that never rise, with censoring marks the caller supplied rather than inferred.",
  }),
  demo<PrecisionRecallChartProps>({
    id: "precision-recall-chart",
    component: "PrecisionRecallChart",
    props: {
      curves: [{ key: "model", label: "Model", tone: "accent", points: PR, averagePrecision: 0.71 }],
      baseline: 0.18,
      xFormat: { kind: "percent", decimals: 0 },
      yFormat: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "Precision against recall",
    },
    render: (props) => <PrecisionRecallChart {...props} />,
    note: "Recall on x and precision on y, with the prevalence drawn as the dashed no-skill line.",
  }),
  demo<FeatureImportanceChartProps>({
    id: "feature-importance-chart",
    component: "FeatureImportanceChart",
    props: {
      features: [
        { key: "vol", label: "Realised vol", value: 0.31, low: 0.26, high: 0.36 },
        { key: "carry", label: "Carry", value: 0.24, low: 0.2, high: 0.28 },
        { key: "trend", label: "Trend", value: 0.18, low: 0.14, high: 0.22 },
        { key: "value", label: "Value", value: 0.11, low: 0.07, high: 0.15 },
        { key: "size", label: "Size", value: -0.07, low: -0.12, high: -0.02 },
      ],
      intervalLabel: "±1 s.e.",
      signed: true,
      format: { kind: "number", decimals: 2, signed: true },
      height: 320,
      ariaLabel: "Feature importance",
    },
    render: (props) => <FeatureImportanceChart {...props} />,
    note: "Ranked importances with the caller's own standard errors; signed, because these are coefficients.",
  }),
];
