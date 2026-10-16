//#region src/charts/core/theme-tokens.d.ts
/**
 * The chart theme as *data*.
 *
 * `resolveChartTheme()` reads the live token layer through `getComputedStyle`,
 * which is the right source for anything on a screen: a palette attribute on a
 * subtree, a personality that changes the radius, a `color-mix()` that only the
 * browser can evaluate. It is the wrong source for a renderer that has no
 * document yet — a server-side pass, a print pipeline, an image capture — and
 * the usual workaround is exactly the problem: the capture host keeps its own
 * copy of the palette, and the copy drifts the first time a token moves.
 *
 * This module is the bridge. It holds the resolved values of both themes as a
 * plain table keyed by *token name*, so a host can read them without a DOM, and
 * — more importantly — it holds the mapping from token name to `ChartTheme`
 * field in exactly one place. `resolveChartTheme()` is built on the same
 * function, so the DOM path and the no-DOM path cannot disagree about what a
 * token means.
 *
 * Two honest limits, both of them structural rather than unfinished work:
 *
 *  - **The table describes the default palette.** A `data-palette` or a
 *    personality overrides the accent and the tokens derived from it; those
 *    live in CSS and can only be read from a document. A capture host that
 *    knows its theme should pass it in (`chartThemeFromTokens`) rather than
 *    rely on the default; `CHART_THEME_TOKEN_NAMES` lists what to supply.
 *  - **These values track `tokens/tokens.css`.** `theme-tokens.test.ts` parses
 *    that file and fails if any value here stops matching it, so this is a
 *    verified copy rather than a hopeful one.
 */
export type ChartThemeMode = "dark" | "light";
/**
 * Everything a chart needs in order to paint, resolved to plain values.
 *
 * Defined here rather than in `theme.ts` because this is the *contract* — the
 * list of things a theme has to supply — while `theme.ts` holds the browser-side
 * resolution and the colour maths.
 */
export interface ChartTheme {
  mode: "dark" | "light";
  /** Resolved colour strings, ready for a canvas. */
  palette: readonly string[];
  /** Anchor colours for continuous ramps (low → mid → high). */
  sequentialAnchors: readonly [string, string, string];
  /** Anchor colours for diverging ramps (low → midpoint → high). */
  divergingAnchors: readonly [string, string, string];
  /**
   * Anchor colours for a **correlation** ramp (negative → zero → positive).
   *
   * Correlation encodes a sign, never investment goodness, so it must not reuse
   * the loss/gain pair the diverging ramp's warm end implies: a negative
   * relationship reads sapphire, a positive one mauve.
   */
  correlationAnchors: readonly [string, string, string];
  positive: string;
  negative: string;
  neutral: string;
  warning: string;
  grid: string;
  gridStrong: string;
  axisLine: string;
  axisLabel: string;
  crosshair: string;
  crosshairLabelBg: string;
  crosshairLabelFg: string;
  selection: string;
  band: string;
  reference: string;
  marker: string;
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  border: string;
  borderSubtle: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  /**
   * The two inks a label may use on top of a coloured mark. Absolute values —
   * the choice is made per mark by `readableInk()`, never by the page theme.
   */
  inkDark: string;
  inkLight: string;
  /** Styling primitives, also resolved from tokens. */
  fontFamily: string;
  monoFamily: string;
  fontMicro: number;
  fontCaption: number;
  fontLabel: number;
  radius: number;
  motionFast: number;
  motionNormal: number;
  motionSlow: number;
}
/**
 * Every colour token a chart theme is resolved from.
 *
 * Exported because it is the contract for the bridge: a host that has the real
 * token values (from a stylesheet it controls, from a document it can measure)
 * supplies these names, and gets back a theme with no guessing.
 */
export declare const CHART_THEME_TOKEN_NAMES: readonly ["--chart-grid", "--chart-grid-strong", "--chart-axis-line", "--chart-axis-label", "--chart-crosshair", "--chart-crosshair-label-bg", "--chart-crosshair-label-fg", "--chart-selection", "--chart-band", "--chart-reference", "--chart-marker", "--chart-positive", "--chart-negative", "--chart-neutral", "--chart-warning", "--chart-seq-low", "--chart-seq-mid", "--chart-seq-high", "--chart-div-low", "--chart-div-mid", "--chart-div-high", "--chart-corr-low", "--chart-corr-mid", "--chart-corr-high", "--surface-default", "--surface-raised", "--surface-overlay", "--line-default", "--line-subtle", "--accent-default", "--fg-primary", "--fg-muted", "--chart-ink-dark", "--chart-ink-light", "--chart-series-1", "--chart-series-2", "--chart-series-3", "--chart-series-4", "--chart-series-5", "--chart-series-6", "--chart-series-7", "--chart-series-8", "--chart-series-9", "--chart-series-10", "--chart-series-11", "--chart-series-12"];
export type ChartThemeTokenName = (typeof CHART_THEME_TOKEN_NAMES)[number];
/** Typography and rhythm tokens, which are not colours but still theme-wide. */
export interface ChartThemeMetrics {
  fontFamily: string;
  monoFamily: string;
  fontMicro: number;
  fontCaption: number;
  fontLabel: number;
  radius: number;
  motionFast: number;
  motionNormal: number;
  motionSlow: number;
}
/**
 * The default metrics. They match `:root` and the default personality — a
 * personality may change the radius and the motion scale, which is one more
 * reason a themed capture should supply its own.
 */
export declare const DEFAULT_CHART_THEME_METRICS: ChartThemeMetrics;
/**
 * The resolved chart tokens for a mode, with no DOM involved.
 *
 * `color-mix(in oklab, var(--accent-default) 14%, transparent)` is written here
 * as the equivalent explicit alpha on the same accent, because that is what the
 * mix computes to: the transparent end contributes no colour, only the 14%
 * weight. It keeps the value readable without a browser.
 */
/**
 * The resolved chart tokens for the default **dark** theme, with no DOM.
 *
 * `color-mix(in oklab, var(--accent-default) 14%, transparent)` is written here
 * as the equivalent explicit alpha on the same accent, because that is what the
 * mix computes to: the transparent end contributes no colour, only the 14%
 * weight. It keeps the value readable without a browser.
 *
 * Only the dark table lives in this module. The light one is in
 * `theme-tokens-light.ts`, and that split is not cosmetic: this module is in the
 * graph of every chart, and the interactive path needs exactly one fallback
 * theme (the server one). Keeping light-mode data out of it keeps `@luc/ui/charts`
 * consumers from paying for a theme they will never resolve without a DOM.
 */
export declare const DARK_CHART_THEME_TOKEN_VALUES: Record<ChartThemeTokenName, string>;
/**
 * Build a `ChartTheme` from token values.
 *
 * The single mapping from token name to field lives here, and both the DOM
 * reader and the no-DOM fallback go through it: a token that is renamed, added
 * or dropped cannot be wired correctly in one place and wrongly in the other.
 *
 * `get` returns `undefined` for a token the source does not have, and the value
 * falls back to the mode's default rather than collapsing to an empty string —
 * a chart painted with `""` is a chart painted black.
 */
export declare function chartThemeFromTokens(get: (token: ChartThemeTokenName) => string | undefined, mode: ChartThemeMode, metrics?: ChartThemeMetrics, fallback?: Record<ChartThemeTokenName, string>): ChartTheme;
/**
 * The default (dark) chart theme, resolved with no DOM.
 *
 * Dark is the reference theme in this design system, and it is also the theme a
 * server render falls back to — see `resolveChartTheme`.
 */
export declare const darkChartTheme: ChartTheme;
//#endregion
//# sourceMappingURL=theme-tokens.d.ts.map