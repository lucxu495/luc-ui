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
export const CHART_THEME_TOKEN_NAMES = [
  "--chart-grid",
  "--chart-grid-strong",
  "--chart-axis-line",
  "--chart-axis-label",
  "--chart-crosshair",
  "--chart-crosshair-label-bg",
  "--chart-crosshair-label-fg",
  "--chart-selection",
  "--chart-band",
  "--chart-reference",
  "--chart-marker",
  "--chart-positive",
  "--chart-negative",
  "--chart-neutral",
  "--chart-warning",
  "--chart-seq-low",
  "--chart-seq-mid",
  "--chart-seq-high",
  "--chart-div-low",
  "--chart-div-mid",
  "--chart-div-high",
  "--chart-corr-low",
  "--chart-corr-mid",
  "--chart-corr-high",
  "--surface-default",
  "--surface-raised",
  "--surface-overlay",
  "--line-default",
  "--line-subtle",
  "--accent-default",
  "--fg-primary",
  "--fg-muted",
  "--chart-ink-dark",
  "--chart-ink-light",
  "--chart-series-1",
  "--chart-series-2",
  "--chart-series-3",
  "--chart-series-4",
  "--chart-series-5",
  "--chart-series-6",
  "--chart-series-7",
  "--chart-series-8",
  "--chart-series-9",
  "--chart-series-10",
  "--chart-series-11",
  "--chart-series-12",
] as const;

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
export const DEFAULT_CHART_THEME_METRICS: ChartThemeMetrics = {
  fontFamily: '"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif',
  monoFamily: '"JetBrains Mono Variable", ui-monospace, monospace',
  fontMicro: 11,
  fontCaption: 12,
  fontLabel: 13,
  radius: 8,
  motionFast: 140,
  motionNormal: 200,
  motionSlow: 300,
};

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
export const DARK_CHART_THEME_TOKEN_VALUES: Record<ChartThemeTokenName, string> = {
    "--chart-grid": "oklch(1 0 0 / 0.055)",
    "--chart-grid-strong": "oklch(1 0 0 / 0.1)",
    "--chart-axis-line": "oklch(1 0 0 / 0.14)",
    "--chart-axis-label": "oklch(0.6880 0.0110 252)",
    "--chart-crosshair": "oklch(0.9690 0.0030 252 / 0.32)",
    "--chart-crosshair-label-bg": "oklch(0.3350 0.0140 258)",
    "--chart-crosshair-label-fg": "oklch(0.9690 0.0030 252)",
    "--chart-selection": "oklch(0.7780 0.1130 205 / 0.16)",
    "--chart-band": "oklch(0.7780 0.1130 205 / 0.1)",
    "--chart-reference": "oklch(0.8280 0.0085 252 / 0.5)",
    "--chart-marker": "oklch(0.7780 0.1130 205)",
    "--chart-positive": "oklch(0.8020 0.1390 158)",
    "--chart-negative": "oklch(0.7420 0.1520 24)",
    "--chart-neutral": "oklch(0.6200 0.0120 254)",
    "--chart-warning": "oklch(0.8400 0.1250 80)",
    "--chart-seq-low": "oklch(0.2400 0.0300 244)",
    "--chart-seq-mid": "oklch(0.6000 0.1050 224)",
    "--chart-seq-high": "oklch(0.8400 0.1150 190)",
    "--chart-div-low": "oklch(0.7600 0.1150 250)",
    "--chart-div-mid": "oklch(0.2450 0.0100 258)",
    "--chart-div-high": "oklch(0.7800 0.1250 34)",
    "--chart-corr-low": "oklch(0.7200 0.1200 250)",
    "--chart-corr-mid": "oklch(0.3000 0.0100 258)",
    "--chart-corr-high": "oklch(0.7400 0.1250 342)",
    "--surface-default": "oklch(0.1875 0.0100 258)",
    "--surface-raised": "oklch(0.2210 0.0110 258)",
    "--surface-overlay": "oklch(0.2480 0.0120 258)",
    "--line-default": "oklch(1 0 0 / 0.105)",
    "--line-subtle": "oklch(1 0 0 / 0.06)",
    "--accent-default": "oklch(0.7780 0.1130 205)",
    "--fg-primary": "oklch(0.9690 0.0030 252)",
    "--fg-muted": "oklch(0.6880 0.0110 252)",
    "--chart-ink-dark": "oklch(0.1800 0.0120 258)",
    "--chart-ink-light": "oklch(0.9910 0.0020 252)",
    "--chart-series-1": "oklch(0.7800 0.1300 250)",
    "--chart-series-2": "oklch(0.8000 0.1250 55)",
    "--chart-series-3": "oklch(0.7800 0.1350 292)",
    "--chart-series-4": "oklch(0.8300 0.1250 148)",
    "--chart-series-5": "oklch(0.7900 0.1400 348)",
    "--chart-series-6": "oklch(0.8600 0.1200 92)",
    "--chart-series-7": "oklch(0.7800 0.1150 272)",
    "--chart-series-8": "oklch(0.8300 0.1100 182)",
    "--chart-series-9": "oklch(0.7600 0.1400 18)",
    "--chart-series-10": "oklch(0.8100 0.1150 222)",
    "--chart-series-11": "oklch(0.7400 0.1400 308)",
    "--chart-series-12": "oklch(0.8600 0.1150 122)",
};


const PALETTE_TOKENS = Array.from({ length: 12 }, (_, index) => `--chart-series-${index + 1}` as ChartThemeTokenName);

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
export function chartThemeFromTokens(
  get: (token: ChartThemeTokenName) => string | undefined,
  mode: ChartThemeMode,
  metrics: ChartThemeMetrics = DEFAULT_CHART_THEME_METRICS,
  fallback: Record<ChartThemeTokenName, string> = DARK_CHART_THEME_TOKEN_VALUES,
): ChartTheme {
  const read = (token: ChartThemeTokenName): string => {
    const value = get(token);
    return value && value.trim() !== "" ? value : fallback[token];
  };
  return {
    mode,
    palette: PALETTE_TOKENS.map(read),
    sequentialAnchors: [read("--chart-seq-low"), read("--chart-seq-mid"), read("--chart-seq-high")],
    divergingAnchors: [read("--chart-div-low"), read("--chart-div-mid"), read("--chart-div-high")],
    correlationAnchors: [read("--chart-corr-low"), read("--chart-corr-mid"), read("--chart-corr-high")],
    positive: read("--chart-positive"),
    negative: read("--chart-negative"),
    neutral: read("--chart-neutral"),
    warning: read("--chart-warning"),
    grid: read("--chart-grid"),
    gridStrong: read("--chart-grid-strong"),
    axisLine: read("--chart-axis-line"),
    axisLabel: read("--chart-axis-label"),
    crosshair: read("--chart-crosshair"),
    crosshairLabelBg: read("--chart-crosshair-label-bg"),
    crosshairLabelFg: read("--chart-crosshair-label-fg"),
    selection: read("--chart-selection"),
    band: read("--chart-band"),
    reference: read("--chart-reference"),
    marker: read("--chart-marker"),
    surface: read("--surface-default"),
    surfaceRaised: read("--surface-raised"),
    surfaceOverlay: read("--surface-overlay"),
    border: read("--line-default"),
    borderSubtle: read("--line-subtle"),
    accent: read("--accent-default"),
    textPrimary: read("--fg-primary"),
    textMuted: read("--fg-muted"),
    inkDark: read("--chart-ink-dark"),
    inkLight: read("--chart-ink-light"),
    ...metrics,
  };
}

/**
 * The default (dark) chart theme, resolved with no DOM.
 *
 * Dark is the reference theme in this design system, and it is also the theme a
 * server render falls back to — see `resolveChartTheme`.
 */
export const darkChartTheme: ChartTheme = chartThemeFromTokens(
  (token) => DARK_CHART_THEME_TOKEN_VALUES[token],
  "dark",
);
