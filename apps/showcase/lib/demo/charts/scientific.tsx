/*
 * Scientific and mathematical charts.
 *
 * The rule the library states, and these fixtures obey: the analysis happened
 * upstream. A contour arrives as rings, a hexbin as aggregated cells, a surface
 * as a grid of samples, a ternary as barycentric shares that sum to one. Where a
 * fixture *looks* like a field it is because someone sampled a field, not
 * because the chart extrapolated one.
 *
 * The grids are deliberately small — a five-by-four spectrogram is enough to
 * show what the component does and small enough to read in the copied snippet.
 */

import {
  ContourChart,
  HexbinChart,
  ParallelCoordinatesChart,
  PolarRoseChart,
  RidgelineChart,
  ScatterMatrixChart,
  SpectrogramChart,
  Surface3DChart,
  TernaryChart,
  ThemeRiverChart,
  VectorFieldChart,
  WindRoseChart,
  type ContourChartProps,
  type HexbinChartProps,
  type ParallelCoordinatesChartProps,
  type PolarRoseChartProps,
  type RidgelineChartProps,
  type ScatterMatrixChartProps,
  type SpectrogramChartProps,
  type Surface3DChartProps,
  type TernaryChartProps,
  type ThemeRiverChartProps,
  type VectorFieldChartProps,
  type WindRoseChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

/* A synthetic saddle, sampled on a 3×3 grid. The rings are the caller's march
 * over that grid; the chart draws them. */
const SADDLE_SURFACE = [
  { x: -1, y: -1, z: 1 },
  { x: 0, y: -1, z: 0 },
  { x: 1, y: -1, z: 1 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: -1 },
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 1, z: 1 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 1, z: 1 },
];

const SADDLE_RINGS = (radius: number): readonly (readonly [number, number][])[] => [
  [
    [-radius, 0],
    [0, radius],
    [radius, 0],
    [0, -radius],
    [-radius, 0],
  ],
  [
    [-radius * 2, 0],
    [0, radius * 2],
    [radius * 2, 0],
    [0, -radius * 2],
    [-radius * 2, 0],
  ],
];

const MATRIX_ROWS = [
  { ret: 0.9, vol: 14.2, sharpe: 1.24 },
  { ret: 1.4, vol: 18.6, sharpe: 1.02 },
  { ret: -0.4, vol: 11.1, sharpe: -0.36 },
  { ret: 2.1, vol: 22.4, sharpe: 0.94 },
  { ret: 0.6, vol: 9.8, sharpe: 0.88 },
  { ret: -1.2, vol: 15.7, sharpe: -0.76 },
  { ret: 1.8, vol: 19.3, sharpe: 1.11 },
  { ret: 0.2, vol: 12.6, sharpe: 0.32 },
];

export const chartScientificDemos: readonly DemoSpec[] = [
  demo<ContourChartProps>({
    id: "contour-chart",
    component: "ContourChart",
    props: {
      levels: [
        { level: 0.5, rings: SADDLE_RINGS(0.5) },
        { level: 1, rings: SADDLE_RINGS(0.95) },
      ],
      surface: SADDLE_SURFACE,
      xFormat: { kind: "number", decimals: 1 },
      yFormat: { kind: "number", decimals: 1 },
      zFormat: { kind: "number", decimals: 1 },
      height: 340,
      ariaLabel: "Saddle field",
    },
    render: (props) => <ContourChart {...props} />,
    note: "Iso-rings supplied by the caller over a nine-point sampled surface — the chart traces nothing itself.",
  }),
  demo<HexbinChartProps>({
    id: "hexbin-chart",
    component: "HexbinChart",
    props: {
      cells: [
        { x: -1.2, y: -0.8, value: 6 },
        { x: -0.6, y: -1.1, value: 14 },
        { x: -0.1, y: -0.4, value: 31 },
        { x: 0.3, y: 0.2, value: 42 },
        { x: 0.8, y: 0.6, value: 27 },
        { x: 1.3, y: 1, value: 11 },
        { x: -0.9, y: 0.5, value: 9 },
        { x: 0.6, y: -0.9, value: 18 },
      ],
      radius: 0.22,
      valueLabel: "Samples",
      valueFormat: { kind: "integer" },
      xFormat: { kind: "number", decimals: 1 },
      yFormat: { kind: "number", decimals: 1 },
      height: 340,
      ariaLabel: "Density over a plane",
    },
    render: (props) => <HexbinChart {...props} />,
    note: "Eight aggregated cells: hexbinning is an aggregation, so the grid is the caller's, not the chart's.",
  }),
  demo<ParallelCoordinatesChartProps>({
    id: "parallel-coordinates-chart",
    component: "ParallelCoordinatesChart",
    props: {
      axes: [
        { key: "ret", label: "Return", format: { kind: "number", decimals: 1, suffix: "%" } },
        { key: "vol", label: "Volatility", format: { kind: "number", decimals: 1, suffix: "%" } },
        { key: "sharpe", label: "Sharpe", format: { kind: "number", decimals: 2 } },
        { key: "drawdown", label: "Max DD", format: { kind: "number", decimals: 1, suffix: "%" } },
      ],
      rows: [
        { ret: 0.9, vol: 14.2, sharpe: 1.24, drawdown: -6.1 },
        { ret: 1.4, vol: 18.6, sharpe: 1.02, drawdown: -9.4 },
        { ret: -0.4, vol: 11.1, sharpe: -0.36, drawdown: -4.2 },
        { ret: 2.1, vol: 22.4, sharpe: 0.94, drawdown: -12.8 },
        { ret: 0.6, vol: 9.8, sharpe: 0.88, drawdown: -3.1 },
        { ret: 1.8, vol: 19.3, sharpe: 1.11, drawdown: -8.6 },
      ],
      opacity: 0.5,
      height: 340,
      ariaLabel: "Portfolios across four axes",
    },
    render: (props) => <ParallelCoordinatesChart {...props} />,
    note: "Four metrics on one polyline per portfolio: crossings show trade-offs a scatter cannot.",
  }),
  demo<PolarRoseChartProps>({
    id: "polar-rose-chart",
    component: "PolarRoseChart",
    props: {
      data: [
        { name: "N", value: 12 },
        { name: "NE", value: 18 },
        { name: "E", value: 24 },
        { name: "SE", value: 31 },
        { name: "S", value: 27 },
        { name: "SW", value: 19 },
        { name: "W", value: 15 },
        { name: "NW", value: 9 },
      ],
      variant: "rose",
      format: { kind: "integer" },
      height: 340,
      ariaLabel: "Readings by sector",
    },
    render: (props) => <PolarRoseChart {...props} />,
    note: "Eight equal-angle sectors whose radius — not their angle — carries the measurement.",
  }),
  demo<WindRoseChartProps>({
    id: "wind-rose-chart",
    component: "WindRoseChart",
    props: {
      directions: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
      series: [
        { label: "< 5 m/s", tone: "neutral", values: [6, 8, 11, 14, 12, 9, 7, 5] },
        { label: "5–10 m/s", tone: "accent", values: [4, 6, 9, 12, 10, 7, 5, 3] },
        { label: "> 10 m/s", tone: "info", values: [2, 3, 4, 5, 4, 3, 2, 1] },
      ],
      format: { kind: "integer" },
      height: 340,
      ariaLabel: "Speed by direction",
    },
    render: (props) => <WindRoseChart {...props} />,
    note: "A stacked polar histogram: each sector's rings are speed bins the caller already binned.",
  }),
  demo<TernaryChartProps>({
    id: "ternary-chart",
    component: "TernaryChart",
    props: {
      points: [
        { a: 0.8, b: 0.1, c: 0.1, label: "A" },
        { a: 0.6, b: 0.3, c: 0.1, label: "B" },
        { a: 0.55, b: 0.25, c: 0.2, label: "C" },
        { a: 0.33, b: 0.33, c: 0.34, label: "D" },
        { a: 0.2, b: 0.5, c: 0.3, label: "E" },
        { a: 0.1, b: 0.2, c: 0.7, label: "F" },
      ],
      corners: ["Growth", "Value", "Quality"],
      format: { kind: "percent", decimals: 0 },
      height: 360,
      ariaLabel: "Style mix",
    },
    render: (props) => <TernaryChart {...props} />,
    note: "Each point's three shares sum to one, which is the only thing the geometry can honestly accept.",
  }),
  demo<VectorFieldChartProps>({
    id: "vector-field-chart",
    component: "VectorFieldChart",
    props: {
      vectors: [
        { x: -1, y: -1, u: 0.3, v: -0.4 },
        { x: 0, y: -1, u: 0.5, v: -0.2 },
        { x: 1, y: -1, u: 0.4, v: 0.3 },
        { x: -1, y: 0, u: -0.6, v: 0.1 },
        { x: 0, y: 0, u: 0, v: 0 },
        { x: 1, y: 0, u: 0.6, v: -0.1 },
        { x: -1, y: 1, u: -0.4, v: 0.3 },
        { x: 0, y: 1, u: -0.5, v: 0.2 },
        { x: 1, y: 1, u: -0.3, v: 0.4 },
      ],
      scale: 1,
      xFormat: { kind: "number", decimals: 1 },
      yFormat: { kind: "number", decimals: 1 },
      height: 340,
      ariaLabel: "Vector field",
    },
    render: (props) => <VectorFieldChart {...props} />,
    note: "Nine sampled arrows at their true magnitude, including the one that is exactly zero.",
  }),
  demo<RidgelineChartProps>({
    id: "ridgeline-chart",
    component: "RidgelineChart",
    props: {
      groups: [
        {
          label: "2024",
          tone: "neutral",
          points: [
            { label: "2024", x: -2, density: 0.05 },
            { label: "2024", x: -1, density: 0.24 },
            { label: "2024", x: 0, density: 0.42 },
            { label: "2024", x: 1, density: 0.28 },
            { label: "2024", x: 2, density: 0.09 },
          ],
        },
        {
          label: "2025",
          tone: "accent",
          points: [
            { label: "2025", x: -2, density: 0.03 },
            { label: "2025", x: -1, density: 0.18 },
            { label: "2025", x: 0, density: 0.36 },
            { label: "2025", x: 1, density: 0.33 },
            { label: "2025", x: 2, density: 0.14 },
          ],
        },
        {
          label: "2026",
          tone: "info",
          points: [
            { label: "2026", x: -2, density: 0.02 },
            { label: "2026", x: -1, density: 0.12 },
            { label: "2026", x: 0, density: 0.29 },
            { label: "2026", x: 1, density: 0.38 },
            { label: "2026", x: 2, density: 0.21 },
          ],
        },
      ],
      overlap: 0.5,
      xFormat: { kind: "number", decimals: 1 },
      height: 340,
      ariaLabel: "Densities by year",
    },
    render: (props) => <RidgelineChart {...props} />,
    note: "Three supplied densities offset vertically, so the shapes can be compared without overlaying them.",
  }),
  demo<ScatterMatrixChartProps>({
    id: "scatter-matrix-chart",
    component: "ScatterMatrixChart",
    props: {
      variables: [
        { key: "ret", label: "Return", format: { kind: "percent", decimals: 1 } },
        { key: "vol", label: "Volatility", format: { kind: "number", decimals: 1 } },
        { key: "sharpe", label: "Sharpe", format: { kind: "number", decimals: 2 } },
      ],
      rows: MATRIX_ROWS,
      cellSize: 110,
      height: 360,
      ariaLabel: "Pairs across three variables",
    },
    render: (props) => <ScatterMatrixChart {...props} />,
    note: "Three variables, so six panels: the pairs without the diagonal, each one an ordinary scatter.",
  }),
  demo<SpectrogramChartProps>({
    id: "spectrogram-chart",
    component: "SpectrogramChart",
    props: {
      xValues: ["0.00", "0.05", "0.10", "0.15", "0.20", "0.25"],
      yValues: ["400 Hz", "800 Hz", "1.6 kHz", "3.2 kHz"],
      /* `magnitude[y][x]`, in dB. */
      values: [
        [-18, -12, -9, -14, -22, -31],
        [-24, -16, -11, -10, -19, -27],
        [-36, -28, -19, -15, -23, -34],
        [-52, -44, -37, -31, -40, -49],
      ],
      unit: "dBFS",
      range: { min: -60, max: 0 },
      height: 340,
      ariaLabel: "Signal over time",
    },
    render: (props) => <SpectrogramChart {...props} />,
    note: "A four-by-six magnitude grid with a fixed decibel range, drawn low frequencies first.",
  }),
  demo<Surface3DChartProps>({
    id: "surface3-dchart",
    component: "Surface3DChart",
    props: {
      /* `z[row][column]`, one row per y label. */
      z: [
        [0.22, 0.19, 0.18, 0.2],
        [0.2, 0.17, 0.16, 0.18],
        [0.19, 0.16, 0.15, 0.17],
        [0.21, 0.18, 0.17, 0.19],
      ],
      xLabels: [90, 95, 100, 105],
      yLabels: [0.25, 0.5, 1, 2],
      xLabel: "Strike",
      yLabel: "Maturity (years)",
      zLabel: "Implied volatility",
      mode: "surface",
      height: 380,
      ariaLabel: "Volatility grid",
    },
    render: (props) => <Surface3DChart {...props} />,
    note: "A supplied grid of ratios, projected without a 3D engine: no cell is interpolated to fill a hole.",
  }),
  demo<ThemeRiverChartProps>({
    id: "theme-river-chart",
    component: "ThemeRiverChart",
    props: {
      events: [
        { date: "2026-01-01", name: "Trend", value: 42 },
        { date: "2026-01-01", name: "Carry", value: 18 },
        { date: "2026-01-01", name: "Value", value: 11 },
        { date: "2026-04-01", name: "Trend", value: 51 },
        { date: "2026-04-01", name: "Carry", value: 14 },
        { date: "2026-04-01", name: "Value", value: 22 },
        { date: "2026-07-01", name: "Trend", value: 34 },
        { date: "2026-07-01", name: "Carry", value: 13 },
        { date: "2026-07-01", name: "Value", value: 31 },
        { date: "2026-10-01", name: "Trend", value: 22 },
        { date: "2026-10-01", name: "Carry", value: 15 },
        { date: "2026-10-01", name: "Value", value: 18 },
      ],
      format: { kind: "number", decimals: 0, suffix: " bps" },
      height: 360,
      ariaLabel: "Contribution by source",
    },
    render: (props) => <ThemeRiverChart {...props} />,
    note: "Four quarters of supply-and-demand facts; the engine lays out the bands, the numbers are the caller's.",
  }),
];
