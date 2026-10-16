/**
 * Chart palettes and deterministic series colour assignment.
 *
 * Three questions, three palettes:
 *
 *  - **Which series is this?** → the categorical palette (`chart.series.N`),
 *    twelve balanced hues.
 *  - **How much is this?** → a sequential ramp, interpolated from the theme's
 *    sequential anchors so it always sits beside the categorical hues.
 *  - **Which side of a midpoint?** → a diverging ramp with a deliberately
 *    low-chroma middle, so "no signal" reads as nothing rather than as a colour.
 *
 * The assignment rule matters more than the hues. A chart that colours its
 * series by array index repaints when a series is filtered out, which teaches
 * the reader something false about the data. `seriesColor` therefore resolves a
 * **stable key** (or an explicit index) to a slot, and the well-known research
 * keys below are pinned so the same concept keeps the same colour across every
 * page and every render.
 */

import type { ChartTheme } from "./theme";
import { mixColor, parseColor, withAlpha } from "./theme";

export type ColorRamp = readonly string[];

/**
 * Semantic series keys with a pinned palette slot.
 *
 * These are *concepts*, not products: a benchmark, a set of macro factors, a
 * funding rate. Pinning them means "the benchmark is orange" is true on every
 * page, which is what makes a reader trust a colour.
 *
 * Palette slot values are 0-based indices into `theme.palette` (twelve hues).
 */
export const SERIES_COLOR_SLOTS: Readonly<Record<string, number>> = {
  // Primary research series.
  price: 0,
  primary: 0,
  "price.btc": 0,
  // Benchmarks get a stable, secondary-but-distinct slot.
  benchmark: 1,
  reference: 1,
  "market.benchmark": 1,
  // Macro factors (the classic four, adjacent hues so they read as one family).
  "factor.us_equity": 2,
  "factor.usd": 3,
  "factor.real_yield": 4,
  "factor.gold": 5,
  // Derivatives / positioning.
  funding: 6,
  open_interest: 7,
  // The funding *baseline* (its 7-day average) and the running funding cost are
  // two different readings of the same contract; neither borrows the rate's hue
  // so a composed funding chart never draws three lines in one colour.
  "funding.ma": 1,
  "funding.cumulative": 2,
  "funding.z": 10,
  // Perpetual/dated basis is a price difference, not a cost: its own warm hue,
  // read against a real zero.
  basis: 5,
  // Observed open interest over market capitalisation — a size ratio beside the
  // open-interest level, so it takes its own slot.
  "oi.mcap": 3,
  "oi.change": 0,
  "oi.z": 10,
  // The two 25-delta smile statistics: the tilt and the curvature.
  skew: 10,
  butterfly: 1,
  // The two sides of one option contract, read as a paired comparison.
  "options.call": 7,
  "options.put": 2,
  // Risk measures.
  // Volatility is a *magnitude*, never "bad": a warm hue would read as a
  // verdict the measurement does not carry. The loss families keep the warm
  // end of the palette (a drawdown, a value-at-risk), volatility does not.
  volatility: 9,
  realized_vol: 9,
  dvol: 10,
  drawdown: 8,
  // On-chain.
  addresses: 9,
  hash_rate: 11,
  /*
   * The **research vocabulary**: the series identity an indicator binds to
   * instead of drawing every measurement in the same accent tone.
   *
   * The pins above cover the classic concepts; these give the indicators that
   * were previously all one colour their own stable slot — a short moving
   * average never uses the long one's hue, a MACD line never uses its signal's,
   * and a macro factor keeps its colour across every page. Two keys may share a
   * slot when they can never appear in one chart together, but the keys that
   * *do* co-occur are deliberately distinct.
   */
  // Price overlays: a short average reads warm, a long average cool, so a trend
  // stack never looks like one line duplicated.
  "sma.short": 2,
  "sma.long": 3,
  // The fast/slow spread answers "has the structure turned?" — a third, its own
  // identity, so a price+SMA+spread section never repeats a line colour.
  "sma.spread": 8,
  "ma.short": 2,
  "ma.long": 3,
  "ma.spread": 8,
  "price.high": 11,
  // The perpetual's mark price and the index price it tracks are drawn against
  // each other, so they take two well-separated hues rather than the shared
  // price slot.
  "price.mark": 0,
  "price.index": 1,
  // Momentum.
  // MACD is the primary momentum line (the sapphire family) and its signal is
  // the comparison, so the pair never looks like one line drawn twice.
  macd: 0,
  "macd.signal": 4,
  "macd.histogram": 3,
  rsi: 6,
  adx: 10,
  // Directional movement: the two DI lines are a directional *pair*, so they
  // take opposite ends of the palette; ADX keeps its own strength hue.
  "dmi.plus": 3,
  "dmi.minus": 5,
  // Realized-volatility lookback windows share one family with separate hues.
  "realized_vol.short": 9,
  "realized_vol.mid": 11,
  "realized_vol.long": 4,
  "realized_vol.max": 1,
  // Directional volatility: the *only* place volatility takes a directional
  // colour, because here the direction is the measurement (down moves vs up
  // moves), not a verdict on the level.
  downside_vol: 4,
  upside_vol: 7,
  // The down/up ratio, the instability of volatility itself, and the
  // implied-minus-realized spread are three different risk questions, so they
  // keep three distinct hues rather than borrowing the volatility family.
  "vol.ratio": 10,
  vol_of_vol: 9,
  "vol.spread": 2,
  "tail.severity": 10,
  "breach.rate": 6,
  // The two tail legs of one confidence level share a family but never a hue.
  "tail.var": 4,
  "tail.es": 8,
  // Signed / ratio families.
  distance: 11,
  zscore: 6,
  ratio: 1,
  sharpe: 7,
  sortino: 5,
  calmar: 8,
  hit_rate: 2,
  return: 6,
  position: 7,
  // Multi-horizon range position: one family, three horizons, three hues.
  "position.short": 9,
  "position.mid": 1,
  "position.long": 7,
  "position.percentile": 6,
  // Relative performance against a benchmark.
  excess: 1,
  "excess.return": 1,
  // A normalised wealth path: four benchmarks co-occur in one comparison, so
  // each gets a well-separated hue rather than a hash-ordered one.
  "growth.spy": 1,
  "growth.qqq": 2,
  "growth.gld": 5,
  "growth.eth": 4,
  // Relationship / cross-asset.
  correlation: 1,
  "relationship.spy": 1,
  "relationship.qqq": 2,
  "relationship.eth": 4,
  "relationship.gld": 5,
  beta: 10,
  r2: 6,
  alpha: 9,
  residual_vol: 11,
  // Macro factors beyond the classic four.
  "factor.us_2y": 5,
  "factor.us_10y": 6,
  "factor.vix": 10,
  "factor.m2": 11,
  "factor.fed_balance_sheet": 7,
  // Volume & liquidity.
  volume: 4,
  "volume.ma": 5,
  // The two volume baselines: short warm, long cool (a chart that draws a bar
  // with both averages must never show one line twice).
  "volume.ma.short": 1,
  "volume.ma.long": 6,
  // Taker flow is a signed notional delta, its own identity.
  // The two trailing horizons take two hues; the 30-day reading is matched
  // as `flow.short` and the 90-day one as `flow.long`.
  "flow.short": 7,
  "flow.long": 9,
  "flow.delta": 7,
  // The three activity z-scores: volume, the number of trades, and the size of a
  // trade are three questions, so they never share one hue.
  "volume.z": 10,
  "activity.trade_count": 9,
  "activity.trade_size": 7,
  // A bounded share: its own hue, so it is never confused with the volume level.
  "activity.share": 4,
  // A price-impact coefficient: a level, deliberately not the volume hue.
  amihud: 2,
  taker_ratio: 9,
  // On-chain activity.
  "addresses.ma7": 7,
  "addresses.ma30": 2,
  "onchain.tx_count": 2,
  "onchain.transfers": 4,
  "onchain.fees": 5,
  "onchain.blocks": 6,
  "onchain.fee_per_tx": 5,
  // Miner economics: revenue is an additive decomposition, so its parts keep
  // separate hues and the fiat-denominated reading keeps its own.
  "miner.revenue": 3,
  "miner.subsidy": 6,
  "miner.fee": 1,
  "miner.revenue.usd": 10,
  // Issuance: the daily stream, its annualised rate and the protocol subsidy
  // step are three readings, never one line drawn three times.
  issuance: 2,
  "issuance.rate": 10,
  "issuance.subsidy": 5,
  supply: 7,
};

/** FNV-1a — a tiny, stable string hash (never `Math.random`, never `Date`). */
function hashKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The palette slot for a series.
 *
 * Resolution order: an explicit `index` (the caller knows its own order) → a
 * pinned semantic key → a stable hash of the key. Passing only a key means the
 * colour never depends on how many series happen to be visible.
 */
export function seriesSlot(key: string, index?: number): number {
  if (typeof index === "number" && Number.isFinite(index)) return Math.abs(Math.trunc(index));
  const pinned = SERIES_COLOR_SLOTS[key];
  if (pinned !== undefined) return pinned;
  return hashKey(key);
}

/** The colour for a series key (or explicit slot). */
export function seriesColor(theme: ChartTheme, key: string, index?: number): string {
  const slot = seriesSlot(key, index);
  return theme.palette[slot % theme.palette.length] ?? theme.accent;
}

/**
 * The benchmark treatment.
 *
 * A benchmark is important but *not* the subject: it is drawn thinner and
 * slightly desaturated so the primary series stays dominant, while remaining a
 * distinct hue (never the primary's own colour at low opacity, which reads as
 * the same series).
 */
export function benchmarkColor(theme: ChartTheme): string {
  return seriesColor(theme, "benchmark");
}

function interpolate(anchors: readonly [string, string, string], t: number): string {
  const low = parseColor(anchors[0]);
  const mid = parseColor(anchors[1]);
  const high = parseColor(anchors[2]);
  // Unparseable anchors (a non-DOM environment) fall back to the anchor itself
  // rather than inventing a colour.
  if (!low || !mid || !high) return t < 0.5 ? anchors[0] : anchors[2];
  const clamped = Math.max(0, Math.min(1, t));
  const mixed = clamped <= 0.5 ? mixColor(low, mid, clamped * 2) : mixColor(mid, high, (clamped - 0.5) * 2);
  return `rgb(${Math.round(mixed.r)}, ${Math.round(mixed.g)}, ${Math.round(mixed.b)})`;
}

/**
 * A sequential ramp of `steps` colours, low → high.
 *
 * Interpolating in the chart layer (rather than storing N tokens) keeps the
 * ramp consistent with the categorical palette and lets a heatmap ask for
 * exactly the number of buckets it needs.
 */
export function sequentialPalette(theme: ChartTheme, steps = 7): ColorRamp {
  const count = Math.max(2, Math.trunc(steps));
  return Array.from({ length: count }, (_, index) => interpolate(theme.sequentialAnchors, index / (count - 1)));
}

/**
 * A diverging ramp of `steps` colours, low → midpoint → high.
 *
 * An odd `steps` puts an exact anchor colour on the midpoint, which is what a
 * correlation matrix wants; an even `steps` straddles it.
 */
export function divergingPalette(theme: ChartTheme, steps = 7): ColorRamp {
  const count = Math.max(3, Math.trunc(steps));
  return Array.from({ length: count }, (_, index) => interpolate(theme.divergingAnchors, index / (count - 1)));
}

/**
 * A ramp from three explicit low→mid→high anchors.
 *
 * The categorical and semantic ramps above answer the *system's* questions. A
 * product sometimes carries its own three-stop ramp — a financial return ramp
 * (loss → flat → gain) that must not be confused with the general cool→warm
 * diverging ramp a correlation matrix uses. This lets that product pass its
 * anchors straight to a heatmap instead of faking a `palette` enum.
 */
export function rampFromAnchors(
  anchors: readonly [string, string, string],
  steps = 7,
): ColorRamp {
  const count = Math.max(3, Math.trunc(steps));
  return Array.from({ length: count }, (_, index) => interpolate(anchors, index / (count - 1)));
}

/**
 * The **correlation** ramp: negative → zero → positive.
 *
 * Correlation encodes a sign, never investment goodness: a negative relationship
 * reads sapphire, the zero centre stays near-neutral, and a positive one reads
 * mauve. Reusing the loss/gain pair here would turn "moves against" into "bad"
 * in the reader's eye, which the domain's semantics explicitly refuse.
 */
export function correlationPalette(theme: ChartTheme, steps = 7): ColorRamp {
  return rampFromAnchors(theme.correlationAnchors, steps);
}

/** A ramp's colour at a normalised position `t` (0–1). */
export function rampColor(ramp: ColorRamp, t: number): string {
  if (ramp.length === 0) return "transparent";
  const clamped = Math.max(0, Math.min(1, t));
  return ramp[Math.round(clamped * (ramp.length - 1))] ?? ramp[ramp.length - 1]!;
}

export interface RobustDomainOptions {
  /** The semantic centre the domain is symmetric around. Defaults to 0. */
  midpoint?: number;
  /**
   * The quantile of |value − midpoint| used as the visual cap. `0.95` means the
   * top 5% of magnitudes saturate at the endpoint colour. Defaults to 0.95.
   */
  percentile?: number;
  /** A floor for the cap, so a nearly-flat series still has a usable domain. */
  floor?: number;
}

/**
 * A **robust, symmetric, zero-centred domain** for a diverging colour scale.
 *
 * A single extreme observation wrecks a min/max colour domain: one 450% month
 * forces every ordinary month to sit at the neutral centre, so the matrix reads
 * "nothing happened" almost everywhere. The fix is presentation-only — the
 * *values* never change — a cap taken from a high quantile of the absolute
 * deviations from the midpoint, and a domain of `[mid − cap, mid + cap]`. Values
 * beyond the cap saturate at the endpoint colour, so an outlier stays visually
 * identifiable without dominating the ramp.
 *
 * Returns `null` when there is nothing finite to measure (the caller then falls
 * back to its own min/max).
 */
export function robustSymmetricDomain(
  values: readonly number[],
  options: RobustDomainOptions = {},
): { min: number; max: number; cap: number; midpoint: number } | null {
  const midpoint = options.midpoint ?? 0;
  const percentile = Math.max(0, Math.min(1, options.percentile ?? 0.95));
  const floor = options.floor ?? 0;
  const magnitudes = values
    .filter((value) => typeof value === "number" && Number.isFinite(value))
    .map((value) => Math.abs(value - midpoint))
    .sort((left, right) => left - right);
  if (magnitudes.length === 0) return null;
  // Nearest-rank quantile: the smallest value whose rank covers the percentile.
  const rank = Math.min(magnitudes.length - 1, Math.max(0, Math.ceil(percentile * magnitudes.length) - 1));
  const cap = Math.max(floor, magnitudes[rank] ?? 0);
  if (!(cap > 0)) return null;
  return { min: midpoint - cap, max: midpoint + cap, cap, midpoint };
}

/**
 * A single-hue family for quantile bands (a fan chart).
 *
 * One hue, layered by luminance + opacity, is what makes nested quantile bands
 * readable: five different hues would read as five unrelated series. The
 * returned list runs from the *widest* band (dimmest) to the narrowest
 * (brightest), which is the order a fan is drawn.
 */
export function fanPalette(theme: ChartTheme, bands = 3): ColorRamp {
  // One hue, layered by opacity: the widest band is the faintest, the centre is
  // the most solid. Different hues would read as different series; different
  // opacities read as "how far from the centre", which is the actual meaning.
  // The resolved theme is rgb on the client, but the SSR fallback is authored in
  // oklch — `parseColor` handles both, and the ramp is emitted as rgba so the
  // engine and the alpha steps agree.
  const parsed = parseColor(seriesColor(theme, "primary"));
  const base = parsed
    ? `rgb(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)})`
    : seriesColor(theme, "primary");
  const count = Math.max(1, Math.trunc(bands));
  // Wider bands need more opacity on a light surface (where a faint tint washes
  // out) and less on a dark one (where it glows).
  const outermost = theme.mode === "dark" ? 0.14 : 0.1;
  const innermost = theme.mode === "dark" ? 0.4 : 0.32;
  return Array.from({ length: count }, (_, index) => {
    const step = count === 1 ? 1 : index / (count - 1);
    return withAlpha(base, outermost + step * (innermost - outermost));
  });
}
