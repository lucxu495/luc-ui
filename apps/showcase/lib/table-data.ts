/**
 * Deterministic Showcase datasets.
 *
 * No network, no randomness at runtime: the same seed always produces the same
 * table, so screenshots and visual diffs stay comparable. Treat all of it as
 * demo data — none of these numbers are research results.
 */

export interface ResearchRun {
  id: string;
  symbol: string;
  strategy: string;
  status: "live" | "draft" | "paused" | "failed";
  regime: "trend" | "range" | "stress";
  sharpe: number;
  cagr: number;
  maxDrawdown: number;
  trades: number;
  exposure: number;
  updated: number;
  equity: number[];
}

export interface Instrument {
  value: string;
  label: string;
  description: string;
  group: string;
  disabled?: boolean;
}

/** Small, fast, seeded PRNG. Deterministic across runs and machines. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "AAPL", "MSFT", "NVDA", "SPX", "NDX", "GC", "CL"];
const STRATEGIES = [
  "Trend breakout",
  "Mean reversion",
  "Volatility carry",
  "Funding basis",
  "Regime switch",
  "Cross-sectional momentum",
];
const STATUSES: ResearchRun["status"][] = ["live", "live", "draft", "paused", "failed"];
const REGIMES: ResearchRun["regime"][] = ["trend", "range", "stress"];
const DAY = 86_400_000;
/** Fixed anchor so "updated" is stable for screenshots. */
export const DEMO_NOW = Date.UTC(2026, 8, 26);

function equityCurve(random: () => number, points = 48): number[] {
  const out: number[] = [];
  let value = 100;
  for (let index = 0; index < points; index += 1) {
    value *= 1 + (random() - 0.48) * 0.035;
    out.push(Number(value.toFixed(3)));
  }
  return out;
}

/** 48 research runs: enough to page, filter and sort while staying readable. */
export function researchRuns(count = 48): ResearchRun[] {
  const random = mulberry32(0x5eed);
  return Array.from({ length: count }, (_, index) => {
    // Drawn from the seeded stream rather than `index % n`, so a sorted table
    // does not look like a repeating pattern.
    const symbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)]!;
    const strategy = STRATEGIES[Math.floor(random() * STRATEGIES.length)]!;
    return {
      id: `run-${String(index + 1).padStart(3, "0")}`,
      symbol,
      strategy,
      status: STATUSES[Math.floor(random() * STATUSES.length)]!,
      regime: REGIMES[Math.floor(random() * REGIMES.length)]!,
      sharpe: Number((random() * 2.6 - 0.5).toFixed(2)),
      cagr: Number((random() * 48 - 6).toFixed(2)),
      maxDrawdown: Number((-(random() * 34 + 3)).toFixed(2)),
      trades: Math.round(random() * 900 + 20),
      exposure: Number((random() * 80 + 15).toFixed(1)),
      updated: DEMO_NOW - Math.round(random() * 45) * DAY,
      equity: equityCurve(random),
    };
  });
}

/** Searchable options in the shape `Combobox` expects. */
export const instruments: Instrument[] = [
  { value: "BTC-USD", label: "Bitcoin", description: "BTC-USD · Crypto", group: "Crypto" },
  { value: "ETH-USD", label: "Ethereum", description: "ETH-USD · Crypto", group: "Crypto" },
  { value: "SOL-USD", label: "Solana", description: "SOL-USD · Crypto", group: "Crypto" },
  { value: "AAPL", label: "Apple", description: "AAPL · Nasdaq", group: "Equities" },
  { value: "MSFT", label: "Microsoft", description: "MSFT · Nasdaq", group: "Equities" },
  { value: "NVDA", label: "NVIDIA", description: "NVDA · Nasdaq", group: "Equities" },
  { value: "SPX", label: "S&P 500 index", description: "SPX · Index", group: "Indices" },
  { value: "NDX", label: "Nasdaq 100 index", description: "NDX · Index", group: "Indices" },
  { value: "VIX", label: "Volatility index", description: "VIX · Index", group: "Indices" },
  { value: "GC", label: "Gold futures", description: "GC · Metals", group: "Commodities" },
  { value: "CL", label: "Crude oil futures", description: "CL · Energy", group: "Commodities" },
  { value: "ZS", label: "Soybean futures", description: "ZS · Agriculture", group: "Commodities", disabled: true },
];

export const countries: Instrument[] = [
  { value: "us", label: "United States", description: "US · USD", group: "Americas" },
  { value: "ca", label: "Canada", description: "CA · CAD", group: "Americas" },
  { value: "br", label: "Brazil", description: "BR · BRL", group: "Americas" },
  { value: "de", label: "Germany", description: "DE · EUR", group: "Europe" },
  { value: "fr", label: "France", description: "FR · EUR", group: "Europe" },
  { value: "gb", label: "United Kingdom", description: "GB · GBP", group: "Europe" },
  { value: "jp", label: "Japan", description: "JP · JPY", group: "Asia-Pacific" },
  { value: "sg", label: "Singapore", description: "SG · SGD", group: "Asia-Pacific" },
  { value: "au", label: "Australia", description: "AU · AUD", group: "Asia-Pacific" },
];

export interface LedgerRow {
  id: string;
  venue: string;
  pair: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  notional: number;
  fee: number;
  timestamp: number;
}

const VENUES = ["Binance", "Coinbase", "Kraken", "OKX", "Bybit"];
const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BTC/USD", "ETH/EUR"];

/**
 * Large deterministic dataset for the virtualised table. 10,000 rows is a
 * realistic "we loaded a year of fills" size — not a benchmark claim.
 */
export function ledgerRows(count = 10_000): LedgerRow[] {
  const random = mulberry32(0xbeef);
  return Array.from({ length: count }, (_, index) => {
    const venue = VENUES[index % VENUES.length]!;
    const pair = PAIRS[index % PAIRS.length]!;
    const side = random() > 0.5 ? "buy" : "sell";
    const price = Number((30_000 + random() * 70_000).toFixed(2));
    const quantity = Number((random() * 4).toFixed(4));
    return {
      id: `fill-${index + 1}`,
      venue,
      pair,
      side,
      price,
      quantity,
      notional: Number((price * quantity).toFixed(2)),
      fee: Number((price * quantity * 0.0004).toFixed(4)),
      timestamp: DEMO_NOW - index * 90_000,
    };
  });
}
