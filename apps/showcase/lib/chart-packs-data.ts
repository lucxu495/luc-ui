/*
 * Deterministic fixtures for the Phase 4 chart packs.
 *
 * Everything here is generated from a fixed seed at module load, so the server
 * render and the client render produce byte-identical series — no `Math.random`
 * in a render path, and no hydration mismatch. The numbers are synthetic and
 * labelled as such on every page: none of them are market data, and the library
 * computes none of them (they are exactly the "prepared values" the chart
 * contract asks for).
 */

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/* ---------------------------------------------------------------- ECDF / QQ */

export const comparisonSamples = (() => {
  const random = seeded(7);
  const make = (centre: number, spread: number, count: number) => {
    const values = Array.from({ length: count }, () => centre + (random() + random() + random() - 1.5) * spread);
    return values.sort((a, b) => a - b);
  };
  const build = (values: number[]) =>
    values.map((value, index) => ({ x: value, y: (index + 1) / values.length }));
  return {
    /*
     * Session returns in percent, matching the `{ kind: "percent" }` axis the
     * ECDF is drawn on. As ratios (0.012) the six axis ticks all formatted to
     * "0.0 %" and the chart had no readable x axis at all.
     */
    baseline: build(make(0, 1.2, 240)),
    candidate: build(make(0.15, 1.7, 240)),
  };
})();

export const qqPoints = (() => {
  const random = seeded(11);
  return Array.from({ length: 120 }, (_, index) => {
    const p = (index + 0.5) / 120;
    /* Inverse-normal by rational approximation — a fixture, not a statistic. */
    const z = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p)) * (p < 0.5 ? -1 : 1);
    return { x: z, y: z * 0.94 + (random() - 0.5) * 0.35 };
  });
})();

/* ------------------------------------------------------------------- Violin */

export const violinGroups = (
  [
    { label: "Baseline", centre: 0, spread: 1, tone: "neutral" as const },
    { label: "Trend", centre: 0.6, spread: 0.8, tone: "accent" as const },
    { label: "Carry", centre: -0.4, spread: 1.25, tone: "info" as const },
  ]
).map((group) => {
  const random = seeded(group.label.length * 31 + 5);
  const bins = Array.from({ length: 33 }, (_, index) => {
    const value = group.centre - 2.4 * group.spread + (index / 32) * 4.8 * group.spread;
    const z = (value - group.centre) / group.spread;
    return { value, density: Math.exp(-0.5 * z * z) * (0.9 + random() * 0.2) };
  });
  return { ...group, bins, marker: { value: group.centre, label: "median" } };
});

/* ------------------------------------------------------ intervals / residuals */

export const errorBarPoints = [
  { label: "Momentum", value: 0.42, lower: 0.21, upper: 0.63, tone: "positive" as const },
  { label: "Value", value: 0.18, lower: -0.04, upper: 0.4, tone: "neutral" as const },
  { label: "Carry", value: 0.31, lower: 0.12, upper: 0.5, tone: "positive" as const },
  { label: "Quality", value: -0.09, lower: -0.28, upper: 0.1, tone: "negative" as const },
  { label: "Size", value: 0.06, lower: -0.15, upper: 0.27 },
];

export const residualPoints = (() => {
  const random = seeded(23);
  return Array.from({ length: 160 }, () => {
    const fitted = -0.02 + random() * 0.05;
    return { fitted, residual: (random() + random() + random() - 1.5) * 0.012 };
  });
})();

/* ------------------------------------------------------ ROC / calibration */

export const rocCurves = [
  { label: "Model A", auc: 0.86, tone: "accent" as const },
  { label: "Model B", auc: 0.74, tone: "info" as const },
].map((curve) => ({
  ...curve,
  points: Array.from({ length: 21 }, (_, index) => {
    const fpr = index / 20;
    /* A parametric curve whose area is close to the printed AUC. */
    const tpr = Math.min(1, Math.max(0, Math.pow(fpr, 1 / (curve.auc * 4.4))));
    return { x: fpr, y: index === 0 ? 0 : index === 20 ? 1 : tpr };
  }),
}));

export const calibrationBins = [
  { predicted: 0.05, observed: 0.06, count: 640 },
  { predicted: 0.15, observed: 0.13, count: 512 },
  { predicted: 0.25, observed: 0.27, count: 388 },
  { predicted: 0.35, observed: 0.31, count: 296 },
  { predicted: 0.45, observed: 0.47, count: 214 },
  { predicted: 0.55, observed: 0.52, count: 168 },
  { predicted: 0.65, observed: 0.68, count: 121 },
  { predicted: 0.75, observed: 0.72, count: 88 },
  { predicted: 0.85, observed: 0.88, count: 54 },
  { predicted: 0.95, observed: 0.93, count: 31 },
];

export const confusionLabels = ["Buy", "Hold", "Sell"];
export const confusionMatrix = [
  [412, 47, 21],
  [38, 706, 44],
  [19, 52, 361],
];

/* --------------------------------------------------------- parallel / ternary */

export const parallelAxes = [
  { key: "return", label: "Return", format: { kind: "percent" as const, decimals: 1 } },
  { key: "vol", label: "Volatility", format: { kind: "percent" as const, decimals: 1 } },
  { key: "sharpe", label: "Sharpe", format: { kind: "number" as const, decimals: 2 } },
  { key: "drawdown", label: "Drawdown", invert: true, format: { kind: "percent" as const, decimals: 1 } },
  { key: "turnover", label: "Turnover", format: { kind: "number" as const, decimals: 2 } },
  { key: "capacity", label: "Capacity", format: { kind: "compact" as const } },
];

export const parallelRows = (() => {
  const random = seeded(37);
  return Array.from({ length: 60 }, () => {
    const volatility = 8 + random() * 18;
    const trend = 0.2 + random() * 0.8;
    return {
      return: 2 + trend * 14 + (random() - 0.5) * 3,
      vol: volatility,
      sharpe: 0.4 + trend * 1.8 - volatility / 40,
      drawdown: -(4 + (1 - trend) * 22 + random() * 6),
      turnover: 0.6 + random() * 4.4,
      capacity: 5e6 + random() * 9.5e7,
    };
  });
})();

export const ternaryPoints = [
  /*
   * Shares in percent, so the `{ kind: "percent" }` tooltip reads "70 %" for a
   * 70 % share. The component normalises by `a + b + c`, so the geometry is
   * identical at any common scale; the ratio form printed "0 %" and "1 %".
   */
  { a: 10, b: 20, c: 70, label: "Low vol" },
  { a: 25, b: 50, c: 25, label: "Balanced" },
  { a: 60, b: 30, c: 10, label: "High beta" },
  { a: 35, b: 15, c: 50, label: "Defensive" },
  { a: 20, b: 65, c: 15, label: "Momentum" },
  { a: 45, b: 35, c: 20, label: "Quality" },
] as const;

/* --------------------------------------------------------------- field / spectrum */

export const vectorField = (() => {
  const vectors: { x: number; y: number; u: number; v: number }[] = [];
  for (let row = 0; row < 11; row += 1) {
    for (let column = 0; column < 13; column += 1) {
      const x = -3 + (column / 12) * 6;
      const y = -2.5 + (row / 10) * 5;
      vectors.push({ x, y, u: y * 0.4, v: -x * 0.4 });
    }
  }
  return vectors;
})();

/*
 * A sampled saddle, `z = 0.42 (x² − y²)`.
 *
 * The iso-lines are computed **here**, not by the chart: the contour component
 * draws the rings it is given. The level sets of a saddle are exact hyperbolas,
 * so they are generated from that closed form rather than by a marching-squares
 * pass — a fixture that produced stray segments would look like a broken chart.
 */
const SADDLE = (x: number, y: number) => 0.42 * (x * x - y * y);
const SADDLE_LEVELS = [-2.4, -1.2, 1.2, 2.4];

export const contourLevels = SADDLE_LEVELS.map((level) => {
  const constant = level / 0.42;
  const branches: [number, number][][] = [];
  const steps = 90;
  if (constant > 0) {
    /* x² − y² = c with c > 0: two branches opening left and right. */
    for (const side of [1, -1]) {
      const branch: [number, number][] = [];
      for (let index = 0; index <= steps; index += 1) {
        const y = -3 + (index / steps) * 6;
        const x = side * Math.sqrt(y * y + constant);
        if (Math.abs(x) <= 3.4) branch.push([Number(x.toFixed(3)), Number(y.toFixed(3))]);
      }
      if (branch.length > 1) branches.push(branch);
    }
  } else {
    /* x² − y² = c with c < 0: two branches opening up and down. */
    const edge = Math.sqrt(-constant);
    for (const side of [1, -1]) {
      const branch: [number, number][] = [];
      for (let index = 0; index <= steps; index += 1) {
        const x = -3.4 + (index / steps) * 6.8;
        if (Math.abs(x) < edge) continue;
        const y = side * Math.sqrt(x * x - constant);
        if (Math.abs(y) <= 3.2) branch.push([Number(x.toFixed(3)), Number(y.toFixed(3))]);
      }
      if (branch.length > 1) branches.push(branch);
    }
  }
  return { level: Number(level.toFixed(2)), rings: branches };
});

/** A coarse grid of the same surface, drawn under the iso-lines. */
export const contourSurface = (() => {
  const points: { x: number; y: number; z: number }[] = [];
  for (let row = 0; row <= 36; row += 1) {
    for (let column = 0; column <= 36; column += 1) {
      const x = -3.4 + (column / 36) * 6.8;
      const y = -3.2 + (row / 36) * 6.4;
      points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z: Number(SADDLE(x, y).toFixed(3)) });
    }
  }
  return points;
})();

export const spectrogramValues = (() => {
  const random = seeded(53);
  const frames = 64;
  const bins = 32;
  return Array.from({ length: bins }, (_, bin) =>
    Array.from({ length: frames }, (_, frame) => {
      const t = frame / frames;
      const frequency = bin / bins;
      const peak = Math.exp(-Math.pow((frequency - (0.28 + 0.2 * Math.sin(t * Math.PI * 2))) / 0.06, 2));
      const harmonic = 0.6 * Math.exp(-Math.pow((frequency - 0.62) / 0.09, 2));
      return Math.round((-96 + 84 * Math.min(1, peak + harmonic) + random() * 5) * 10) / 10;
    }),
  );
})();

export const spectrogramXValues = Array.from({ length: 64 }, (_, index) => `${(index * 0.05).toFixed(2)}s`);
export const spectrogramYValues = Array.from({ length: 32 }, (_, index) => `${160 + index * 40}Hz`);

export const hexbinCells = (() => {
  const random = seeded(61);
  const cells: { x: number; y: number; value: number }[] = [];
  for (let row = 0; row < 14; row += 1) {
    for (let column = 0; column < 16; column += 1) {
      const x = -3.4 + column * 0.46 + (row % 2 === 0 ? 0 : 0.23);
      const y = -2.4 + row * 0.38;
      const density = Math.exp(-Math.pow((x + 0.6) / 1.7, 2) - Math.pow((y - 0.3) / 1.2, 2));
      const value = Math.round(density * 420 + random() * 30);
      if (value > 4) cells.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), value });
    }
  }
  return cells;
})();

export const ridgelineGroups = ["2019", "2020", "2021", "2022", "2023"].map((year, index) => {
  const random = seeded(70 + index * 3);
  const centre = -0.4 + index * 0.28;
  return {
    label: year,
    points: Array.from({ length: 41 }, (_, bin) => {
      const x = -2.6 + (bin / 40) * 5.2;
      const z = (x - centre) / (0.85 + index * 0.06);
      return { label: year, x: Number(x.toFixed(2)), density: Math.exp(-0.5 * z * z) * (0.9 + random() * 0.2) };
    }),
  };
});

export const themeRiverEvents = (() => {
  const random = seeded(83);
  const streams = ["Momentum", "Value", "Carry", "Quality"];
  const events: { date: string; name: string; value: number }[] = [];
  for (let month = 0; month < 36; month += 1) {
    const date = `${2019 + Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, "0")}-01`;
    streams.forEach((name, index) => {
      const base = 18 + index * 6;
      events.push({
        date,
        name,
        value: Math.round((base + Math.sin((month + index * 3) / 4) * 8 + random() * 6) * 10) / 10,
      });
    });
  }
  return events;
})();

/* ------------------------------------------------------------------ workflow */

const DAY = 86_400_000;
const GANTT_START = Date.UTC(2026, 0, 6);

export const ganttTasks = [
  { id: "ingest", name: "Ingest candles", start: GANTT_START, end: GANTT_START + 2 * DAY, progress: 1 },
  { id: "validate", name: "Validate analytics", start: GANTT_START + 2 * DAY, end: GANTT_START + 4 * DAY, progress: 0.8 },
  { id: "research", name: "Research pass", start: GANTT_START + 3 * DAY, end: GANTT_START + 8 * DAY, progress: 0.35 },
  { id: "signals", name: "Evaluate signals", start: GANTT_START + 8 * DAY, end: GANTT_START + 11 * DAY },
  { id: "publish", name: "Publish serving generation", start: GANTT_START + 11 * DAY, end: GANTT_START + 12 * DAY },
];

export const dumbbellRows = [
  { label: "Volatility", from: 0.14, to: 0.19 },
  { label: "Drawdown", from: -0.31, to: -0.22 },
  { label: "Sharpe", from: 0.8, to: 1.24 },
  { label: "Turnover", from: 3.4, to: 2.6 },
  { label: "Capacity", from: 4.2e7, to: 6.1e7 },
];

export const lollipopData = [
  { label: "Momentum", value: 0.62 },
  { label: "Carry", value: 0.41 },
  { label: "Quality", value: 0.28 },
  { label: "Value", value: 0.19 },
  { label: "Size", value: -0.12 },
  { label: "Low vol", value: -0.24 },
];

export const bulletRows = [
  { label: "Ingestion freshness", value: 96, target: 99, ranges: [90, 97, 100] },
  { label: "Analytics coverage", value: 91, target: 95, ranges: [85, 95, 100] },
  { label: "Serving warm rate", value: 88, target: 92, ranges: [80, 92, 100] },
  { label: "Validation pass", value: 99, target: 98, ranges: [90, 96, 100] },
];

export const slopeRows = [
  { label: "Trend", left: 0.31, right: 0.52 },
  { label: "Carry", left: 0.44, right: 0.38 },
  { label: "Value", left: 0.12, right: 0.34 },
  { label: "Quality", left: 0.4, right: 0.29 },
  { label: "Size", left: 0.18, right: 0.11 },
];

export const bumpPeriods = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
export const bumpSeries = [
  { label: "Trend", ranks: [3, 2, 1, 1, 2, 1] },
  { label: "Carry", ranks: [1, 1, 2, 3, 3, 2] },
  { label: "Value", ranks: [4, 5, 4, 2, 1, 3] },
  { label: "Quality", ranks: [2, 3, 3, 4, 4, 4] },
  { label: "Size", ranks: [5, 4, 5, null, 5, 5] },
];

export const mekkoColumns = [
  { label: "Direct", weight: 420, segments: [{ name: "New", value: 180 }, { name: "Retained", value: 240 }] },
  { label: "Partners", weight: 260, segments: [{ name: "New", value: 90 }, { name: "Retained", value: 170 }] },
  { label: "Self-serve", weight: 180, segments: [{ name: "New", value: 140 }, { name: "Retained", value: 40 }] },
  { label: "Marketplace", weight: 90, segments: [{ name: "New", value: 70 }, { name: "Retained", value: 20 }] },
];

/* ------------------------------------------------------------- quantitative */

const PRICE_START = Date.UTC(2025, 0, 1);

export const candles = (() => {
  const random = seeded(97);
  let price = 100;
  return Array.from({ length: 120 }, (_, index) => {
    const drift = 0.0009 + (random() - 0.5) * 0.02;
    const open = price;
    const close = Math.max(1, open * (1 + drift));
    const high = Math.max(open, close) * (1 + random() * 0.008);
    const low = Math.min(open, close) * (1 - random() * 0.008);
    price = close;
    return {
      time: PRICE_START + index * DAY,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    };
  });
})();

export const candleOverlays = (() => {
  const average = (window: number, position: number) => {
    if (position < window - 1) return null;
    const slice = candles.slice(position - window + 1, position + 1);
    return Number((slice.reduce((sum, candle) => sum + candle.close, 0) / window).toFixed(2));
  };
  return [
    { label: "MA 20", values: candles.map((_, index) => average(20, index)) },
    { label: "MA 50", values: candles.map((_, index) => average(50, index)) },
  ];
})();

export const drawdownPoints = (() => {
  let peak = -Infinity;
  return candles.map((candle) => {
    peak = Math.max(peak, candle.close);
    return { time: candle.time, value: Number((candle.close / peak - 1).toFixed(4)) };
  });
})();

export const volatilitySlices = ["1M", "3M", "6M", "12M"].map((expiry, slice) => ({
  expiry,
  points: Array.from({ length: 13 }, (_, index) => {
    const moneyness = -0.3 + index * 0.05;
    const smile = 0.18 + Math.pow(moneyness - 0.02, 2) * 1.4 + slice * 0.012;
    return { strike: Number((100 * (1 + moneyness)).toFixed(1)), impliedVol: Number((smile * 100).toFixed(2)) };
  }),
}));

export const frontierAssets = [
  /*
   * Risk and expected return in percent. The chart is drawn on
   * `{ kind: "percent" }` axes, and a 16 % risk passed as `0.16` printed every
   * tick as "0 %" with `decimals: 0` — an unreadable frontier.
   */
  { label: "Equity", risk: 16, expectedReturn: 8 },
  { label: "Credit", risk: 9, expectedReturn: 5.2 },
  { label: "Rates", risk: 5.5, expectedReturn: 2.8 },
  { label: "Gold", risk: 13, expectedReturn: 4.5 },
  { label: "Crypto", risk: 42, expectedReturn: 14 },
  { label: "Cash", risk: 0.4, expectedReturn: 1.9 },
];

export const frontierCurve = Array.from({ length: 24 }, (_, index) => {
  const risk = 2 + (index / 23) * 34;
  return { risk: Number(risk.toFixed(2)), expectedReturn: Number((2 + Math.sqrt(risk) * 2.9).toFixed(2)) };
});

export const factorExposures = [
  { label: "Market", value: 0.86 },
  { label: "Value", value: 0.31 },
  { label: "Momentum", value: -0.22 },
  { label: "Quality", value: 0.44 },
  { label: "Size", value: -0.15 },
  { label: "Low vol", value: 0.12 },
];

export const pnlPeriods = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const pnlSeries = [
  { label: "Trend", values: [42, 18, -12, 51, 34, 22] },
  { label: "Carry", values: [12, 14, 11, 9, 13, 15] },
  { label: "Value", values: [-8, 22, 31, -14, 6, 18] },
  { label: "Costs", values: [-11, -9, -13, -10, -12, -14] },
];

/* ------------------------------------------------------- multidimensional */

export const scatterMatrixVariables = [
  { key: "return", label: "Return", format: { kind: "percent" as const, decimals: 1 } },
  { key: "vol", label: "Volatility", format: { kind: "percent" as const, decimals: 1 } },
  { key: "sharpe", label: "Sharpe", format: { kind: "number" as const, decimals: 2 } },
  { key: "turnover", label: "Turnover", format: { kind: "number" as const, decimals: 1 } },
];

export const scatterMatrixRows = (() => {
  const random = seeded(101);
  return Array.from({ length: 90 }, () => {
    const vol = 7 + random() * 18;
    const ret = 2 + random() * 12;
    return {
      return: Number(ret.toFixed(2)),
      vol: Number(vol.toFixed(2)),
      sharpe: Number((ret / vol).toFixed(3)),
      turnover: Number((0.5 + random() * 4).toFixed(2)),
    };
  });
})();

export const hierarchyRoot = {
  name: "luc-ui",
  children: [
    {
      name: "packages",
      children: [
        { name: "components", value: 48, tone: "accent" },
        { name: "charts", value: 66, tone: "info" },
        { name: "motion", value: 31, tone: "positive" },
      ],
    },
    {
      name: "apps",
      children: [{ name: "showcase", value: 120, tone: "warning" }],
    },
    { name: "docs", value: 24, tone: "neutral" },
  ],
};

export const geoPoints = [
  { name: "Singapore", coordinates: [103.82, 1.35] as const, value: 42 },
  { name: "London", coordinates: [-0.13, 51.51] as const, value: 63 },
  { name: "New York", coordinates: [-74.01, 40.71] as const, value: 81 },
  { name: "Tokyo", coordinates: [139.69, 35.69] as const, value: 37 },
  { name: "Sydney", coordinates: [151.21, -33.87] as const, value: 18 },
  { name: "São Paulo", coordinates: [-46.63, -23.55] as const, value: 22 },
  { name: "Frankfurt", coordinates: [8.68, 50.11] as const, value: 29 },
  { name: "Hong Kong", coordinates: [114.17, 22.32] as const, value: 51 },
];
