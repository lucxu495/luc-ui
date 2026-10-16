import { mixColor, parseColor, withAlpha } from "./theme.js";
//#region src/charts/core/palette.ts
/**
* Semantic series keys with a pinned palette slot.
*
* These are *concepts*, not products: a benchmark, a set of macro factors, a
* funding rate. Pinning them means "the benchmark is orange" is true on every
* page, which is what makes a reader trust a colour.
*
* Palette slot values are 0-based indices into `theme.palette` (twelve hues).
*/
const SERIES_COLOR_SLOTS = {
	price: 0,
	primary: 0,
	"price.btc": 0,
	benchmark: 1,
	reference: 1,
	"market.benchmark": 1,
	"factor.us_equity": 2,
	"factor.usd": 3,
	"factor.real_yield": 4,
	"factor.gold": 5,
	funding: 6,
	open_interest: 7,
	"funding.ma": 1,
	"funding.cumulative": 2,
	"funding.z": 10,
	basis: 5,
	"oi.mcap": 3,
	"oi.change": 0,
	"oi.z": 10,
	skew: 10,
	butterfly: 1,
	"options.call": 7,
	"options.put": 2,
	volatility: 9,
	realized_vol: 9,
	dvol: 10,
	drawdown: 8,
	addresses: 9,
	hash_rate: 11,
	"sma.short": 2,
	"sma.long": 3,
	"sma.spread": 8,
	"ma.short": 2,
	"ma.long": 3,
	"ma.spread": 8,
	"price.high": 11,
	"price.mark": 0,
	"price.index": 1,
	macd: 0,
	"macd.signal": 4,
	"macd.histogram": 3,
	rsi: 6,
	adx: 10,
	"dmi.plus": 3,
	"dmi.minus": 5,
	"realized_vol.short": 9,
	"realized_vol.mid": 11,
	"realized_vol.long": 4,
	"realized_vol.max": 1,
	downside_vol: 4,
	upside_vol: 7,
	"vol.ratio": 10,
	vol_of_vol: 9,
	"vol.spread": 2,
	"tail.severity": 10,
	"breach.rate": 6,
	"tail.var": 4,
	"tail.es": 8,
	distance: 11,
	zscore: 6,
	ratio: 1,
	sharpe: 7,
	sortino: 5,
	calmar: 8,
	hit_rate: 2,
	return: 6,
	position: 7,
	"position.short": 9,
	"position.mid": 1,
	"position.long": 7,
	"position.percentile": 6,
	excess: 1,
	"excess.return": 1,
	"growth.spy": 1,
	"growth.qqq": 2,
	"growth.gld": 5,
	"growth.eth": 4,
	correlation: 1,
	"relationship.spy": 1,
	"relationship.qqq": 2,
	"relationship.eth": 4,
	"relationship.gld": 5,
	beta: 10,
	r2: 6,
	alpha: 9,
	residual_vol: 11,
	"factor.us_2y": 5,
	"factor.us_10y": 6,
	"factor.vix": 10,
	"factor.m2": 11,
	"factor.fed_balance_sheet": 7,
	volume: 4,
	"volume.ma": 5,
	"volume.ma.short": 1,
	"volume.ma.long": 6,
	"flow.short": 7,
	"flow.long": 9,
	"flow.delta": 7,
	"volume.z": 10,
	"activity.trade_count": 9,
	"activity.trade_size": 7,
	"activity.share": 4,
	amihud: 2,
	taker_ratio: 9,
	"addresses.ma7": 7,
	"addresses.ma30": 2,
	"onchain.tx_count": 2,
	"onchain.transfers": 4,
	"onchain.fees": 5,
	"onchain.blocks": 6,
	"onchain.fee_per_tx": 5,
	"miner.revenue": 3,
	"miner.subsidy": 6,
	"miner.fee": 1,
	"miner.revenue.usd": 10,
	issuance: 2,
	"issuance.rate": 10,
	"issuance.subsidy": 5,
	supply: 7
};
/** FNV-1a — a tiny, stable string hash (never `Math.random`, never `Date`). */
function hashKey(key) {
	let hash = 2166136261;
	for (let index = 0; index < key.length; index += 1) {
		hash ^= key.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
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
function seriesSlot(key, index) {
	if (typeof index === "number" && Number.isFinite(index)) return Math.abs(Math.trunc(index));
	const pinned = SERIES_COLOR_SLOTS[key];
	if (pinned !== void 0) return pinned;
	return hashKey(key);
}
/** The colour for a series key (or explicit slot). */
function seriesColor(theme, key, index) {
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
function benchmarkColor(theme) {
	return seriesColor(theme, "benchmark");
}
function interpolate(anchors, t) {
	const low = parseColor(anchors[0]);
	const mid = parseColor(anchors[1]);
	const high = parseColor(anchors[2]);
	if (!low || !mid || !high) return t < .5 ? anchors[0] : anchors[2];
	const clamped = Math.max(0, Math.min(1, t));
	const mixed = clamped <= .5 ? mixColor(low, mid, clamped * 2) : mixColor(mid, high, (clamped - .5) * 2);
	return `rgb(${Math.round(mixed.r)}, ${Math.round(mixed.g)}, ${Math.round(mixed.b)})`;
}
/**
* A sequential ramp of `steps` colours, low → high.
*
* Interpolating in the chart layer (rather than storing N tokens) keeps the
* ramp consistent with the categorical palette and lets a heatmap ask for
* exactly the number of buckets it needs.
*/
function sequentialPalette(theme, steps = 7) {
	const count = Math.max(2, Math.trunc(steps));
	return Array.from({ length: count }, (_, index) => interpolate(theme.sequentialAnchors, index / (count - 1)));
}
/**
* A diverging ramp of `steps` colours, low → midpoint → high.
*
* An odd `steps` puts an exact anchor colour on the midpoint, which is what a
* correlation matrix wants; an even `steps` straddles it.
*/
function divergingPalette(theme, steps = 7) {
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
function rampFromAnchors(anchors, steps = 7) {
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
function correlationPalette(theme, steps = 7) {
	return rampFromAnchors(theme.correlationAnchors, steps);
}
/** A ramp's colour at a normalised position `t` (0–1). */
function rampColor(ramp, t) {
	if (ramp.length === 0) return "transparent";
	return ramp[Math.round(Math.max(0, Math.min(1, t)) * (ramp.length - 1))] ?? ramp[ramp.length - 1];
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
function robustSymmetricDomain(values, options = {}) {
	const midpoint = options.midpoint ?? 0;
	const percentile = Math.max(0, Math.min(1, options.percentile ?? .95));
	const floor = options.floor ?? 0;
	const magnitudes = values.filter((value) => typeof value === "number" && Number.isFinite(value)).map((value) => Math.abs(value - midpoint)).sort((left, right) => left - right);
	if (magnitudes.length === 0) return null;
	const rank = Math.min(magnitudes.length - 1, Math.max(0, Math.ceil(percentile * magnitudes.length) - 1));
	const cap = Math.max(floor, magnitudes[rank] ?? 0);
	if (!(cap > 0)) return null;
	return {
		min: midpoint - cap,
		max: midpoint + cap,
		cap,
		midpoint
	};
}
/**
* A single-hue family for quantile bands (a fan chart).
*
* One hue, layered by luminance + opacity, is what makes nested quantile bands
* readable: five different hues would read as five unrelated series. The
* returned list runs from the *widest* band (dimmest) to the narrowest
* (brightest), which is the order a fan is drawn.
*/
function fanPalette(theme, bands = 3) {
	const parsed = parseColor(seriesColor(theme, "primary"));
	const base = parsed ? `rgb(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)})` : seriesColor(theme, "primary");
	const count = Math.max(1, Math.trunc(bands));
	const outermost = theme.mode === "dark" ? .14 : .1;
	const innermost = theme.mode === "dark" ? .4 : .32;
	return Array.from({ length: count }, (_, index) => {
		const step = count === 1 ? 1 : index / (count - 1);
		return withAlpha(base, outermost + step * (innermost - outermost));
	});
}
//#endregion
export { SERIES_COLOR_SLOTS, benchmarkColor, correlationPalette, divergingPalette, fanPalette, rampColor, rampFromAnchors, robustSymmetricDomain, sequentialPalette, seriesColor, seriesSlot };

//# sourceMappingURL=palette.js.map