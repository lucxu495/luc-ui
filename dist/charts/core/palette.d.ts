import { ChartTheme } from "./theme-tokens.js";
//#region src/charts/core/palette.d.ts
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
export declare const SERIES_COLOR_SLOTS: Readonly<Record<string, number>>;
/**
 * The palette slot for a series.
 *
 * Resolution order: an explicit `index` (the caller knows its own order) → a
 * pinned semantic key → a stable hash of the key. Passing only a key means the
 * colour never depends on how many series happen to be visible.
 */
export declare function seriesSlot(key: string, index?: number): number;
/** The colour for a series key (or explicit slot). */
export declare function seriesColor(theme: ChartTheme, key: string, index?: number): string;
/**
 * The benchmark treatment.
 *
 * A benchmark is important but *not* the subject: it is drawn thinner and
 * slightly desaturated so the primary series stays dominant, while remaining a
 * distinct hue (never the primary's own colour at low opacity, which reads as
 * the same series).
 */
export declare function benchmarkColor(theme: ChartTheme): string;
/**
 * A sequential ramp of `steps` colours, low → high.
 *
 * Interpolating in the chart layer (rather than storing N tokens) keeps the
 * ramp consistent with the categorical palette and lets a heatmap ask for
 * exactly the number of buckets it needs.
 */
export declare function sequentialPalette(theme: ChartTheme, steps?: number): ColorRamp;
/**
 * A diverging ramp of `steps` colours, low → midpoint → high.
 *
 * An odd `steps` puts an exact anchor colour on the midpoint, which is what a
 * correlation matrix wants; an even `steps` straddles it.
 */
export declare function divergingPalette(theme: ChartTheme, steps?: number): ColorRamp;
/**
 * A ramp from three explicit low→mid→high anchors.
 *
 * The categorical and semantic ramps above answer the *system's* questions. A
 * product sometimes carries its own three-stop ramp — a financial return ramp
 * (loss → flat → gain) that must not be confused with the general cool→warm
 * diverging ramp a correlation matrix uses. This lets that product pass its
 * anchors straight to a heatmap instead of faking a `palette` enum.
 */
export declare function rampFromAnchors(anchors: readonly [string, string, string], steps?: number): ColorRamp;
/**
 * The **correlation** ramp: negative → zero → positive.
 *
 * Correlation encodes a sign, never investment goodness: a negative relationship
 * reads sapphire, the zero centre stays near-neutral, and a positive one reads
 * mauve. Reusing the loss/gain pair here would turn "moves against" into "bad"
 * in the reader's eye, which the domain's semantics explicitly refuse.
 */
export declare function correlationPalette(theme: ChartTheme, steps?: number): ColorRamp;
/** A ramp's colour at a normalised position `t` (0–1). */
export declare function rampColor(ramp: ColorRamp, t: number): string;
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
export declare function robustSymmetricDomain(values: readonly number[], options?: RobustDomainOptions): {
  min: number;
  max: number;
  cap: number;
  midpoint: number;
} | null;
/**
 * A single-hue family for quantile bands (a fan chart).
 *
 * One hue, layered by luminance + opacity, is what makes nested quantile bands
 * readable: five different hues would read as five unrelated series. The
 * returned list runs from the *widest* band (dimmest) to the narrowest
 * (brightest), which is the order a fan is drawn.
 */
export declare function fanPalette(theme: ChartTheme, bands?: number): ColorRamp;
//#endregion
//# sourceMappingURL=palette.d.ts.map