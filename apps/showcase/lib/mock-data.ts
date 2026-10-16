/**
 * Deterministic demo data for the chart Showcase.
 *
 * Everything here is synthetic and generated from a fixed seed: no network, no
 * live prices, no randomness between runs, so screenshots are stable and a
 * reviewer sees the same chart twice. These helpers exist *only* for the
 * Showcase — `@luc/ui` chart components never compute an indicator.
 */

/* -------------------------------------------------------------------------- */
/* Deterministic random                                                        */
/* -------------------------------------------------------------------------- */

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/* -------------------------------------------------------------------------- */
/* Market series                                                               */
/* -------------------------------------------------------------------------- */

export interface MarketRow {
  time: Date;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  bandUpper: number | null;
  bandLower: number | null;
  rv30: number;
  funding: number;
  drawdown: number;
  zscore: number;
  rollingCorr: number;
}

export interface MarketSeriesOptions {
  days?: number;
  startPrice?: number;
  seed?: number;
  endDate?: string;
}

function mean(values: readonly (number | null)[], window: number, index: number): number | null {
  if (index + 1 < window) return null;
  let sum = 0;
  for (let offset = index - window + 1; offset <= index; offset += 1) {
    const value = values[offset];
    if (value === null || value === undefined) return null;
    sum += value;
  }
  return sum / window;
}

function stdev(values: readonly number[], window: number, index: number): number | null {
  if (index + 1 < window) return null;
  const slice = values.slice(index - window + 1, index + 1);
  const average = slice.reduce((sum, value) => sum + value, 0) / window;
  const variance = slice.reduce((sum, value) => sum + (value - average) ** 2, 0) / (window - 1);
  return Math.sqrt(variance);
}

/**
 * One synthetic price history with everything the chart pages need: candles,
 * moving averages, a volatility band, realized volatility, funding, drawdown
 * and a rolling correlation against a benchmark. Values are plausible, not
 * meaningful.
 */
export function marketSeries(options: MarketSeriesOptions = {}): MarketRow[] {
  const { days = 900, startPrice = 96_000, seed = 20260926, endDate = "2026-09-25" } = options;
  const random = mulberry32(seed);
  const closes: number[] = [];
  const benchmark: number[] = [];
  let price = startPrice;
  let macro = 0;
  let macroBenchmark = 0;

  for (let index = 0; index < days; index += 1) {
    // Regime-switching drift so the series has phases rather than pure noise.
    if (index % 120 === 0) macro = (random() - 0.45) * 0.0016;
    macroBenchmark = macroBenchmark * 0.94 + (random() - 0.5) * 0.004;
    const shock = gaussian(random) * 0.019;
    const cycle = Math.sin(index / 46) * 0.0022;
    price = Math.max(1_000, price * (1 + macro + cycle + shock));
    closes.push(price);
    benchmark.push(macroBenchmark);
  }

  const start = new Date(`${endDate}T00:00:00.000Z`).getTime() - (days - 1) * 86_400_000;
  const logReturns: number[] = closes.map((close, index) =>
    index === 0 ? 0 : Math.log(close / closes[index - 1]!),
  );
  let peak = closes[0]!;

  return closes.map((close, index) => {
    const previous = index === 0 ? close : closes[index - 1]!;
    const open = previous * (1 + (random() - 0.5) * 0.004);
    const span = close * (0.004 + random() * 0.012);
    const high = Math.max(open, close) + span;
    const low = Math.min(open, close) - span;
    peak = Math.max(peak, close);
    const sma20 = mean(closes, 20, index);
    const sma50 = mean(closes, 50, index);
    const sma200 = mean(closes, 200, index);
    const deviation = stdev(closes, 20, index);
    const rv = stdev(logReturns, 30, index);

    return {
      time: new Date(start + index * 86_400_000),
      close: round(close),
      open: round(open),
      high: round(high),
      low: round(low),
      volume: Math.round(1_800_000_000 + random() * 2_600_000_000 + Math.abs(logReturns[index]!) * 9e10),
      sma20: sma20 === null ? null : round(sma20),
      sma50: sma50 === null ? null : round(sma50),
      sma200: sma200 === null ? null : round(sma200),
      bandUpper: sma20 === null || deviation === null ? null : round(sma20 + deviation * 2),
      bandLower: sma20 === null || deviation === null ? null : round(sma20 - deviation * 2),
      rv30: round((rv ?? 0.4) * 100, 2),
      funding: round(Math.sin(index / 23) * 0.012 + gaussian(random) * 0.006, 4),
      drawdown: round(((close - peak) / peak) * 100, 2),
      zscore: deviation && sma20 ? round((close - sma20) / deviation, 2) : 0,
      rollingCorr: round(Math.max(-1, Math.min(1, 0.42 + Math.sin(index / 61) * 0.38 + gaussian(random) * 0.05)), 3),
    };
  });
}

export function candlesFrom(rows: readonly MarketRow[]) {
  return rows.map((row) => ({
    time: row.time,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
  }));
}

export function volumeFrom(rows: readonly MarketRow[]) {
  return rows.map((row, index) => ({
    time: row.time,
    value: row.volume,
    direction: index === 0 ? ("neutral" as const) : row.close >= rows[index - 1]!.close ? ("up" as const) : ("down" as const),
  }));
}

export function overlayFrom(rows: readonly MarketRow[], key: keyof MarketRow) {
  return rows.map((row) => ({ time: row.time, value: row[key] as number | null }));
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                  */
/* -------------------------------------------------------------------------- */

export const REVENUE_SERIES = [
  { key: "product", label: "Product" },
  { key: "services", label: "Services" },
  { key: "partnerships", label: "Partnerships" },
] as const;

export function revenueRows(quarters = 8) {
  const random = mulberry32(771);
  return Array.from({ length: quarters }, (_, index) => {
    const base = 24 + index * 2.6;
    return {
      period: `Q${(index % 4) + 1} ${2023 + Math.floor(index / 4)}`,
      product: round(base * (0.9 + random() * 0.3), 1),
      services: round(base * (0.45 + random() * 0.2), 1),
      partnerships: round(base * (0.18 + random() * 0.12), 1),
    };
  });
}

export function channelBars() {
  const random = mulberry32(4242);
  return [
    { channel: "Direct", current: round(38 + random() * 6, 1), previous: round(30 + random() * 6, 1) },
    { channel: "Partners", current: round(27 + random() * 6, 1), previous: round(24 + random() * 5, 1) },
    { channel: "Marketplace", current: round(18 + random() * 5, 1), previous: round(15 + random() * 4, 1) },
    { channel: "Self-serve", current: round(12 + random() * 4, 1), previous: round(13 + random() * 4, 1) },
    { channel: "Enterprise", current: round(9 + random() * 3, 1), previous: round(7 + random() * 3, 1) },
  ];
}

export function divergingBars() {
  const random = mulberry32(99);
  const segments = ["Enterprise", "Mid-market", "SMB", "Self-serve", "Education", "Public sector"];
  return segments.map((segment) => ({
    segment,
    // Prepared as signed change; the chart does not compute the delta.
    change: round((random() - 0.42) * 18, 1),
  }));
}

export function waterfallData() {
  return [
    { label: "Opening ARR", value: 412, total: true },
    { label: "New", value: 96 },
    { label: "Expansion", value: 54 },
    { label: "Reactivation", value: 18 },
    { label: "Contraction", value: -37 },
    { label: "Churn", value: -58 },
    { label: "Closing ARR", value: 485, total: true },
  ];
}

/* -------------------------------------------------------------------------- */
/* Distribution                                                                */
/* -------------------------------------------------------------------------- */

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

export function histogramBins(seed = 7, count = 34): HistogramBin[] {
  const random = mulberry32(seed);
  /*
   * Percent-scaled, like every other return fixture in this file (`rv30` is
   * `rv * 100`). Bins of ±9 % are what the distribution actually describes; in
   * ratio units the page formatted them as `{-0.09 %} … `+0.08 %`, which reads
   * as a distribution of a hundredth of a percent per session.
   */
  const min = -9;
  const max = 9;
  const width = (max - min) / count;
  const bins: HistogramBin[] = [];
  for (let index = 0; index < count; index += 1) {
    const centre = min + width * (index + 0.5);
    const density = Math.exp(-((centre - 0.4) ** 2) / (2 * 2.2 ** 2));
    const tail = centre > 4 ? 0.5 : 1;
    bins.push({
      from: round(min + index * width, 2),
      to: round(min + (index + 1) * width, 2),
      count: Math.max(1, Math.round(density * 420 * tail * (0.85 + random() * 0.3))),
    });
  }
  return bins;
}

export function boxPlotGroups() {
  const random = mulberry32(1234);
  const groups = ["Momentum", "Carry", "Mean reversion", "Breakout", "Volatility", "Quality"];
  const summaries = groups.map((_, index) => {
    const centre = 0.6 + index * 0.45 + random() * 0.3;
    const spread = 0.5 + random() * 0.5;
    const q1 = centre - spread * 0.42;
    const q3 = centre + spread * 0.38;
    return [round(q1 - spread * 0.8, 2), round(q1, 2), round(centre, 2), round(q3, 2), round(q3 + spread * 0.9, 2)] as [
      number,
      number,
      number,
      number,
      number,
    ];
  });
  const outliers = summaries.flatMap((summary, category) => {
    const count = 2 + Math.round(random() * 3);
    return Array.from({ length: count }, () => ({
      category,
      value: round(summary[4] + random() * 2.4, 2),
    }));
  });
  return { groups, summaries, outliers };
}

/* -------------------------------------------------------------------------- */
/* Matrix, composition, flow                                                   */
/* -------------------------------------------------------------------------- */

export const ASSET_LABELS = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DXY", "GOLD", "SPX", "UST10Y", "VIX"];

export function correlationMatrix(labels: readonly string[] = ASSET_LABELS, seed = 31) {
  const random = mulberry32(seed);
  const n = labels.length;
  /*
   * Four correlation clusters, spread evenly over however many labels the
   * caller passes. For the ten-asset default this reproduces the hand-written
   * `[0,0,0,1,1,1,2,2,3,3]` sequence exactly, and it keeps producing sensible
   * blocks for the 4- and 20-label examples the label policy is demonstrated
   * with.
   */
  const base = Math.floor(n / 4);
  const remainder = n % 4;
  const groupOf: number[] = [];
  for (let group = 0; group < 4; group += 1) {
    const size = base + (group < remainder ? 1 : 0);
    for (let index = 0; index < size; index += 1) groupOf.push(group);
  }
  const groups = labels.map((_, index) => groupOf[index] ?? 0);
  const values: number[][] = [];
  for (let row = 0; row < n; row += 1) {
    const line: number[] = [];
    for (let column = 0; column < n; column += 1) {
      if (row === column) {
        line.push(1);
        continue;
      }
      const sameGroup = groups[row] === groups[column];
      const base = sameGroup ? 0.72 : groups[row] === 3 || groups[column] === 3 ? -0.35 : 0.12;
      line.push(round(Math.max(-0.99, Math.min(0.99, base + (random() - 0.5) * 0.34)), 2));
    }
    values.push(line);
  }
  // Mirror so the matrix is symmetric, which is what a correlation matrix is.
  for (let row = 0; row < n; row += 1) {
    for (let column = 0; column < row; column += 1) values[row]![column] = values[column]![row]!;
  }
  return { labels: [...labels], values };
}

export function heatmapGrid() {
  const sessions = ["00", "04", "08", "12", "16", "20"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const random = mulberry32(808);
  const values = days.map((_, dayIndex) =>
    sessions.map((_, sessionIndex) => {
      const shape = Math.sin((dayIndex / 6) * Math.PI) * 0.6 + Math.cos((sessionIndex / 5) * Math.PI) * 0.4;
      return round(Math.max(-1, Math.min(1, shape * 0.9 + (random() - 0.5) * 0.55)), 2);
    }),
  );
  return { xLabels: sessions, yLabels: days, values, min: -1, max: 1 };
}

export function calendarData(year = 2026, seed = 55) {
  const random = mulberry32(seed);
  const data: Array<[string, number]> = [];
  const cursor = new Date(Date.UTC(year, 0, 1));
  while (cursor.getUTCFullYear() === year) {
    const weekday = cursor.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const value = weekend
      ? Math.max(0, Math.round(random() * 12))
      : Math.round(18 + random() * 62 + Math.sin(cursor.getUTCMonth() / 2) * 12);
    data.push([cursor.toISOString().slice(0, 10), value]);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return data;
}

export function hierarchyData(seed = 12) {
  const random = mulberry32(seed);
  const regions = ["North America", "Europe", "Asia Pacific", "Latin America"];
  const lines = ["Terminal", "Data", "Research", "Advisory"];
  return regions.map((region) => ({
    name: region,
    children: lines.map((line) => ({
      name: line,
      children: Array.from({ length: 3 }, (_, index) => ({
        name: `${line} ${String.fromCharCode(65 + index)}`,
        value: Math.round(20 + random() * 180),
      })),
    })),
  }));
}

export function sankeyFlow() {
  return {
    nodes: [
      { name: "Search" },
      { name: "Direct" },
      { name: "Partner" },
      { name: "Signup" },
      { name: "Trial" },
      { name: "Paid" },
      { name: "Churn" },
      { name: "Retained" },
    ],
    links: [
      { source: "Search", target: "Signup", value: 420 },
      { source: "Direct", target: "Signup", value: 260 },
      { source: "Partner", target: "Signup", value: 180 },
      { source: "Signup", target: "Trial", value: 700 },
      { source: "Signup", target: "Churn", value: 160 },
      { source: "Trial", target: "Paid", value: 430 },
      { source: "Trial", target: "Churn", value: 270 },
      { source: "Paid", target: "Retained", value: 350 },
      { source: "Paid", target: "Churn", value: 80 },
    ],
  };
}

export function networkGraph(seed = 77) {
  const random = mulberry32(seed);
  const groups = ["Core", "Research", "Execution", "Data"];
  const nodes = [
    { id: "engine", name: "Engine", value: 100, group: "Core" },
    { id: "registry", name: "Registry", value: 72, group: "Core" },
    { id: "ingest", name: "Ingest", value: 64, group: "Data" },
    { id: "warehouse", name: "Warehouse", value: 88, group: "Data" },
    { id: "factors", name: "Factors", value: 54, group: "Research" },
    { id: "signals", name: "Signals", value: 61, group: "Research" },
    { id: "backtest", name: "Backtest", value: 47, group: "Research" },
    { id: "broker", name: "Broker", value: 39, group: "Execution" },
    { id: "risk", name: "Risk", value: 44, group: "Execution" },
  ];
  const links = [
    { source: "ingest", target: "warehouse", value: 9 },
    { source: "warehouse", target: "factors", value: 8 },
    { source: "warehouse", target: "signals", value: 7 },
    { source: "factors", target: "backtest", value: 6 },
    { source: "signals", target: "backtest", value: 6 },
    { source: "backtest", target: "engine", value: 5 },
    { source: "registry", target: "engine", value: 4 },
    { source: "engine", target: "risk", value: 5 },
    { source: "risk", target: "broker", value: 4 },
    { source: "engine", target: "broker", value: 3 },
  ].map((link) => ({ ...link, value: round(link.value * (0.8 + random() * 0.4), 1) }));
  return { nodes, links, groups };
}

export function radarData() {
  const random = mulberry32(303);
  const indicators = [
    { name: "Return", max: 100 },
    { name: "Sharpe", max: 100 },
    { name: "Drawdown control", max: 100 },
    { name: "Turnover", max: 100 },
    { name: "Capacity", max: 100 },
    { name: "Robustness", max: 100 },
  ];
  const series = ["Momentum", "Carry", "Blend"].map((name, index) => ({
    name,
    values: indicators.map((_, indicatorIndex) =>
      Math.round(48 + Math.sin((indicatorIndex + index * 2) / 1.6) * 22 + random() * 12),
    ),
  }));
  return { indicators, series };
}

export function compositionData() {
  return [
    { name: "Infrastructure", value: 412 },
    { name: "Research", value: 268 },
    { name: "Data licences", value: 196 },
    { name: "Execution", value: 142 },
    { name: "Compliance", value: 88 },
    { name: "Other", value: 46 },
  ];
}

export function gaugeMetrics() {
  return [
    { label: "Gross exposure", value: 68, format: { kind: "percent" as const } },
    { label: "Realized volatility", value: 38.4, format: { kind: "percent" as const } },
    { label: "Capacity used", value: 1240, format: { kind: "compact" as const } },
  ];
}

/* -------------------------------------------------------------------------- */
/* Relationship, curve, depth                                                  */
/* -------------------------------------------------------------------------- */

export function scatterRows(count = 140, seed = 616) {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => {
    const factor = gaussian(random);
    return {
      factor: round(factor * 1.6, 3),
      forward: round(factor * 0.42 + gaussian(random) * 0.24 + 0.05, 3),
      turnover: round(Math.abs(gaussian(random)) * 1.8 + 0.3, 2),
      bucket: index % 3 === 0 ? "Liquid" : index % 3 === 1 ? "Mid" : "Small",
    };
  });
}

export function termStructure(seed = 909) {
  const random = mulberry32(seed);
  const tenors = ["1W", "1M", "2M", "3M", "6M", "9M", "1Y", "18M", "2Y"];
  const shape = (level: number) =>
    tenors.map((_, index) =>
      round(level + (index < 2 ? 0.9 - index * 0.3 : Math.log(1 + index * 0.9) * 0.55) + (random() - 0.5) * 0.08, 2),
    );
  return {
    tenors,
    curves: [
      { name: "Latest", values: shape(4.35), tone: "accent" as const, emphasis: true },
      { name: "1 week ago", values: shape(4.72), tone: "neutral" as const },
      { name: "1 month ago", values: shape(5.05), tone: "neutral" as const, lineType: "dashed" as const },
    ],
  };
}

export function curveComparison(seed = 411) {
  const random = mulberry32(seed);
  const strikes = Array.from({ length: 15 }, (_, index) => 60 + index * 5);
  const build = (base: number, skew: number) =>
    strikes.map((strike) => {
      const moneyness = Math.log(strike / 100);
      return round(base + moneyness * skew + moneyness * moneyness * 3.4 + (random() - 0.5) * 0.12, 2);
    });
  return {
    strikes,
    curves: [
      { name: "30d", values: build(52, -7.2), tone: "accent" as const, emphasis: true },
      { name: "60d", values: build(47, -5.4), tone: "neutral" as const },
      { name: "90d", values: build(43, -4.1), tone: "neutral" as const, lineType: "dashed" as const },
    ],
  };
}

export function depthData(seed = 2718) {
  const random = mulberry32(seed);
  const mid = 109_240;
  const bids: Array<{ price: number; size: number }> = [];
  const asks: Array<{ price: number; size: number }> = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let index = 1; index <= 60; index += 1) {
    const offset = index * 22;
    bidTotal += 0.35 + random() * 1.4 + index * 0.045;
    askTotal += 0.32 + random() * 1.35 + index * 0.043;
    bids.push({ price: round(mid - offset, 0), size: round(bidTotal, 2) });
    asks.push({ price: round(mid + offset, 2), size: round(askTotal, 2) });
  }
  return { mid, bids: bids.reverse(), asks };
}

/* -------------------------------------------------------------------------- */
/* Density / performance                                                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Research / uncertainty                                                      */
/* -------------------------------------------------------------------------- */

/** A forecast cone: nested quantile bands plus a median, all prepared. */
export function fanSeries(count = 90, seed = 812) {
  const random = mulberry32(seed);
  const start = Date.UTC(2026, 0, 1);
  const step = 7 * 86_400_000;
  const x: Date[] = [];
  const median: number[] = [];
  const p5: { lower: number[]; upper: number[] } = { lower: [], upper: [] };
  const p25: { lower: number[]; upper: number[] } = { lower: [], upper: [] };
  let level = 100;
  for (let index = 0; index < count; index += 1) {
    level += 0.35 + (random() - 0.5) * 0.9;
    // Uncertainty widens with the horizon — the whole point of a fan.
    const spread = 3 + index * 0.72 + random() * 1.4;
    x.push(new Date(start + index * step));
    median.push(round(level, 2));
    p25.lower.push(round(level - spread * 0.55, 2));
    p25.upper.push(round(level + spread * 0.55, 2));
    p5.lower.push(round(level - spread, 2));
    p5.upper.push(round(level + spread, 2));
  }
  return {
    x,
    median,
    bands: [
      { label: "P5–P95", lower: p5.lower, upper: p5.upper },
      { label: "P25–P75", lower: p25.lower, upper: p25.upper },
    ],
  };
}

/** Drawdown episodes as a categorical state timeline. */
export function regimeIntervals(seed = 9091) {
  const random = mulberry32(seed);
  const states = [
    { state: "risk-on", label: "Risk on", tone: "positive" as const },
    { state: "neutral", label: "Neutral", tone: "neutral" as const },
    { state: "risk-off", label: "Risk off", tone: "negative" as const },
  ];
  const intervals: Array<{ start: Date; end: Date; state: string; label: string }> = [];
  let cursor = Date.UTC(2019, 0, 1);
  while (cursor < Date.UTC(2026, 0, 1)) {
    const length = 20 + Math.floor(random() * 90);
    const end = cursor + length * 86_400_000;
    const pick = states[Math.floor(random() * states.length)]!;
    intervals.push({ start: new Date(cursor), end: new Date(end), state: pick.state, label: pick.label });
    cursor = end;
  }
  return { intervals, states };
}

/** Dated events with a category, for an event study / annotation lane. */
export function studyEvents(seed = 4404) {
  const random = mulberry32(seed);
  const categories = ["protocol", "macro", "signal"] as const;
  const labels: Record<(typeof categories)[number], string[]> = {
    protocol: ["Halving", "Upgrade", "Fork"],
    macro: ["FOMC", "CPI print", "Payrolls"],
    signal: ["Signal active", "Signal inactive"],
  };
  const events: Array<{ at: Date; label: string; category: string }> = [];
  let cursor = Date.UTC(2022, 0, 15);
  while (cursor < Date.UTC(2026, 0, 1)) {
    const category = categories[Math.floor(random() * categories.length)]!;
    const options = labels[category];
    events.push({
      at: new Date(cursor),
      label: options[Math.floor(random() * options.length)]!,
      category,
    });
    cursor += (12 + Math.floor(random() * 40)) * 86_400_000;
  }
  return events;
}

/** A pre-binned sample with a density curve and prepared reference levels. */
export function returnDistribution(seed = 5150) {
  const random = mulberry32(seed);
  const bins: Array<{ from: number; to: number; count: number }> = [];
  const density = { x: [] as number[], y: [] as number[], label: "Kernel density" };
  const width = 0.02;
  for (let index = -14; index < 14; index += 1) {
    const from = round(index * width, 3);
    const to = round(from + width, 3);
    const centre = (from + to) / 2;
    // A slightly right-skewed sample, like a set of forward returns.
    const weight = Math.exp(-((centre - 0.012) ** 2) / (2 * 0.028 ** 2));
    bins.push({ from, to, count: Math.max(1, Math.round(weight * 420 + random() * 12)) });
    density.x.push(centre);
    density.y.push(round(weight * 420, 1));
  }
  return {
    bins,
    density,
    references: [
      { value: 0, label: "Break-even", kind: "threshold" as const },
      { value: 0.012, label: "Median", kind: "median" as const },
      { value: 0.021, label: "Mean", kind: "mean" as const },
    ],
  };
}

export interface DensePoint {
  time: Date;
  value: number;
  upper: number;
  lower: number;
}

/** A long, deterministic series used by the performance page. */
export function denseTimeSeries(count = 10_000, seed = 2024): DensePoint[] {
  const random = mulberry32(seed);
  const start = Date.UTC(2026, 0, 1);
  const step = Math.round(86_400_000 / 12);
  let level = 100;
  const points: DensePoint[] = [];
  for (let index = 0; index < count; index += 1) {
    level += Math.sin(index / 480) * 0.06 + (random() - 0.5) * 0.22;
    points.push({
      time: new Date(start + index * step),
      value: round(level, 3),
      upper: round(level + 1.4 + Math.sin(index / 210) * 0.5, 3),
      lower: round(level - 1.4 - Math.sin(index / 210) * 0.5, 3),
    });
  }
  return points;
}

/* -------------------------------------------------------------------------- */
/* Small helpers used by several pages                                         */
/* -------------------------------------------------------------------------- */

export const TIME_RANGES = ["1m", "3m", "6m", "1y", "all"] as const;

export const RANGE_DAYS: Readonly<Record<string, number>> = {
  "1m": 30,
  "3m": 91,
  "6m": 182,
  "1y": 365,
  "3y": 1095,
  all: Number.POSITIVE_INFINITY,
};

export function windowForRange<T>(rows: readonly T[], range: string): readonly T[] {
  const days = RANGE_DAYS[range] ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(days)) return rows;
  const slice = rows.slice(Math.max(0, rows.length - days));
  return slice.length > 1 ? slice : rows;
}

export function trailing<T>(rows: readonly T[], range: string, durations: Record<string, number>): T[] {
  const days = durations[range];
  if (!days || days <= 0) return [...rows];
  return rows.slice(Math.max(0, rows.length - days));
}

export function lastValue<T>(rows: readonly T[]): T | undefined {
  return rows[rows.length - 1];
}

export function pctChange(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / from) * 100;
}

export function seededBoxOutliers() {
  return boxPlotGroups();
}
