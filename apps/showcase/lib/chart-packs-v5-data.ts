// Deterministic fixtures for the Phase 5 chart pages.
//
// Two rules, both inherited from the earlier packs:
//
//   1. Nothing is generated from a random number source at render time. Every
//      array is a literal or the product of a fixed closed-form loop, so two
//      screenshots of the same page are the same picture.
//   2. Nothing here is a statistic the library could invent. The lag
//      correlations are written down, the survival estimates are written down,
//      the clustering merges are written down. If a page needs a number, the
//      number lives in this file.

import type { XYPoint } from "@luc/ui";

// A tiny deterministic LCG: the same sequence on every machine.
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/* Diagnostics */

function acfSeries(seed: number, decay: number, lags = 24): XYPoint[] {
  const next = seeded(seed);
  return Array.from({ length: lags + 1 }, (_, lag) => {
    const noise = (next() - 0.5) * 0.12;
    const value = lag === 0 ? 1 : Math.exp(-lag / decay) - noise;
    return { x: lag, y: Number(value.toFixed(4)) };
  });
}

export const acfPoints = acfSeries(7, 9);
export const pacfPoints = acfSeries(11, 4);
// ±1.96/√240, written down rather than derived inside the component.
export const acfBand = 0.1265;

export const survivalArms = [
  {
    key: "arm-a",
    label: "Arm A · treated",
    points: [
      { x: 0, y: 1 },
      { x: 4, y: 0.94 },
      { x: 7, y: 0.88 },
      { x: 11, y: 0.82 },
      { x: 15, y: 0.74 },
      { x: 20, y: 0.71 },
      { x: 26, y: 0.68 },
    ],
    censored: [
      { x: 9, y: 0.88 },
      { x: 18, y: 0.74 },
    ],
  },
  {
    key: "arm-b",
    label: "Arm B · control",
    points: [
      { x: 0, y: 1 },
      { x: 3, y: 0.9 },
      { x: 6, y: 0.79 },
      { x: 10, y: 0.66 },
      { x: 14, y: 0.58 },
      { x: 19, y: 0.51 },
      { x: 26, y: 0.44 },
    ],
    censored: [{ x: 12, y: 0.66 }],
  },
];

export const prCurves = [
  {
    key: "model-a",
    label: "Gradient boosted",
    averagePrecision: 0.68,
    points: [
      { x: 0.05, y: 0.94 },
      { x: 0.2, y: 0.88 },
      { x: 0.4, y: 0.79 },
      { x: 0.6, y: 0.66 },
      { x: 0.8, y: 0.49 },
      { x: 1, y: 0.12 },
    ],
  },
  {
    key: "model-b",
    label: "Logistic baseline",
    averagePrecision: 0.44,
    points: [
      { x: 0.05, y: 0.72 },
      { x: 0.2, y: 0.61 },
      { x: 0.4, y: 0.5 },
      { x: 0.6, y: 0.41 },
      { x: 0.8, y: 0.3 },
      { x: 1, y: 0.12 },
    ],
  },
];

export const featureImportances = [
  { key: "mom", label: "Momentum 60d", value: 0.28, low: 0.19, high: 0.36 },
  { key: "carry", label: "Carry", value: 0.21, low: 0.12, high: 0.3 },
  { key: "vol", label: "Realised vol", value: 0.17, low: 0.08, high: 0.27 },
  { key: "spread", label: "Bid–ask spread", value: -0.13, low: -0.22, high: -0.05 },
  { key: "size", label: "Position size", value: 0.09 },
  { key: "sector", label: "Sector dummy", value: -0.05 },
];

/* Network and hierarchy */

export const chordLabels = ["Equities", "Rates", "Credit", "FX", "Commodities"];

export const chordMatrix = [
  [0, 18, 12, 6, 4],
  [14, 0, 22, 9, 3],
  [12, 20, 0, 5, 2],
  [7, 11, 6, 0, 8],
  [5, 4, 3, 9, 0],
];

export const dendrogramLeaves = ["MOM", "CARRY", "VOL", "VALUE", "SIZE", "QUAL"];

export const dendrogramMerges = [
  { id: "m1", left: "MOM", right: "CARRY", height: 0.42 },
  { id: "m2", left: "VALUE", right: "QUAL", height: 0.55 },
  { id: "m3", left: "VOL", right: "SIZE", height: 0.61 },
  { id: "m4", left: "m1", right: "m2", height: 0.92 },
  { id: "m5", left: "m4", right: "m3", height: 1.28 },
];

/* Geospatial */

export const trajectoryRoutes = [
  {
    id: "voyage-1",
    label: "Voyage 1 · westward",
    points: [
      { x: 4.9, y: 52.4 },
      { x: -9.1, y: 38.7 },
      { x: -30.1, y: 25.4 },
      { x: -58.4, y: 12.6 },
    ],
  },
  {
    id: "voyage-2",
    label: "Voyage 2 · across the date line",
    highlight: true,
    points: [
      { x: 139.7, y: 35.7 },
      { x: 172.4, y: 41.3 },
      { x: -168.2, y: 43.9 },
      { x: -122.3, y: 37.8 },
    ],
  },
];

// A deliberately synthetic map: a 6 × 4 grid of rectangular regions. LUC ships
// no boundary data and a documentation page should not imply otherwise, so the
// demo registers geometry that is obviously a fixture.
export const gridMapName = "luc-showcase-grid";

export const gridMapGeoJson = {
  type: "FeatureCollection",
  features: Array.from({ length: 24 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const width = 60;
    const height = 45;
    const x = -180 + column * width;
    const y = 90 - row * height;
    return {
      type: "Feature",
      properties: { name: `R${row + 1}C${column + 1}` },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [x, y],
            [x + width, y],
            [x + width, y - height],
            [x, y - height],
            [x, y],
          ],
        ],
      },
    };
  }),
};

export const choroplethRegions = Array.from({ length: 24 }, (_, index) => {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const id = `R${row + 1}C${column + 1}`;
  // One region has no value on purpose, so the no-data path is visible.
  if (index === 9) return { id, value: null };
  const distance = Math.abs(column - 2.5) + Math.abs(row - 1.5);
  return { id, value: Number((48 - distance * 7.5).toFixed(1)) };
});

/* Surfaces */

export const surfaceStrikes = [80, 90, 95, 100, 105, 110, 120];
export const surfaceMaturities = [0.08, 0.25, 0.5, 1, 2, 5];

// A fixed closed-form surface: no randomness, no fit, no interpolation.
export function surfaceValue(strike: number, maturity: number): number {
  const moneyness = Math.log(strike / 100);
  const smile = 0.2 + 1.4 * moneyness * moneyness;
  return Number((smile - 0.06 * Math.sqrt(maturity) + 0.02 * Math.sin(maturity * 2)).toFixed(4));
}

export const volatilityGrid = surfaceMaturities.map((maturity) =>
  surfaceStrikes.map((strike) => surfaceValue(strike, maturity)),
);
