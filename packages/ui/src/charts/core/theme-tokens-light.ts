/**
 * The light chart theme as data.
 *
 * Separate from `theme-tokens.ts` on purpose. That module is in the import graph
 * of every chart — `core/theme.ts` needs its fallback table to resolve a page
 * theme, and `core/theme.ts` is reached from the financial chart, the sparkline
 * and every other family. The interactive path resolves the *document's* tokens
 * and only ever falls back to one theme (the dark reference theme), so carrying
 * the light table in that graph would charge every consumer for a theme they
 * cannot read without a DOM.
 *
 * This module is reachable from `@luc/ui/charts` and from the capture entry
 * points, which is where a DOM-free light theme is actually used.
 */

import {
  CHART_THEME_TOKEN_NAMES,
  DEFAULT_CHART_THEME_METRICS,
  DARK_CHART_THEME_TOKEN_VALUES,
  chartThemeFromTokens,
  darkChartTheme,
  type ChartTheme,
  type ChartThemeMode,
  type ChartThemeTokenName,
} from "./theme-tokens";

export type { ChartTheme, ChartThemeMode, ChartThemeTokenName };

/**
 * The resolved chart tokens for the default **light** theme, with no DOM.
 *
 * Same rule as the dark table: a `color-mix` against `transparent` is written as
 * the source colour at that alpha, because the transparent end contributes no
 * colour of its own.
 */
export const LIGHT_CHART_THEME_TOKEN_VALUES: Record<ChartThemeTokenName, string> = {
    "--chart-grid": "oklch(0.2380 0.0140 258 / 0.07)",
    "--chart-grid-strong": "oklch(0.2380 0.0140 258 / 0.12)",
    "--chart-axis-line": "oklch(0.2380 0.0140 258 / 0.16)",
    "--chart-axis-label": "oklch(0.4800 0.0125 258)",
    "--chart-crosshair": "oklch(0.2980 0.0140 258 / 0.5)",
    "--chart-crosshair-label-bg": "oklch(0.2980 0.0140 258)",
    "--chart-crosshair-label-fg": "oklch(0.9910 0.0020 252)",
    "--chart-selection": "oklch(0.4960 0.1210 213 / 0.14)",
    "--chart-band": "oklch(0.4960 0.1210 213 / 0.08)",
    "--chart-reference": "oklch(0.4300 0.0130 258 / 0.55)",
    "--chart-marker": "oklch(0.4960 0.1210 213)",
    "--chart-positive": "oklch(0.5180 0.1340 156)",
    "--chart-negative": "oklch(0.5480 0.1910 26)",
    "--chart-neutral": "oklch(0.5200 0.0120 258)",
    "--chart-warning": "oklch(0.5520 0.1230 66)",
    "--chart-seq-low": "oklch(0.9450 0.0180 234)",
    "--chart-seq-mid": "oklch(0.7150 0.1050 220)",
    "--chart-seq-high": "oklch(0.4900 0.1350 264)",
    "--chart-div-low": "oklch(0.5350 0.1250 248)",
    "--chart-div-mid": "oklch(0.9450 0.0045 252)",
    "--chart-div-high": "oklch(0.5650 0.1500 30)",
    "--chart-corr-low": "oklch(0.5350 0.1250 250)",
    "--chart-corr-mid": "oklch(0.9450 0.0045 252)",
    "--chart-corr-high": "oklch(0.5450 0.1250 342)",
    "--surface-default": "oklch(1 0 0)",
    "--surface-raised": "oklch(1 0 0)",
    "--surface-overlay": "oklch(1 0 0)",
    "--line-default": "oklch(0.2380 0.0140 258 / 0.125)",
    "--line-subtle": "oklch(0.2380 0.0140 258 / 0.07)",
    "--accent-default": "oklch(0.4960 0.1210 213)",
    "--fg-primary": "oklch(0.2380 0.0140 258)",
    "--fg-muted": "oklch(0.4800 0.0125 258)",
    "--chart-ink-dark": "oklch(0.1800 0.0120 258)",
    "--chart-ink-light": "oklch(0.9910 0.0020 252)",
    "--chart-series-1": "oklch(0.5450 0.1450 252)",
    "--chart-series-2": "oklch(0.6200 0.1400 55)",
    "--chart-series-3": "oklch(0.5450 0.1550 292)",
    "--chart-series-4": "oklch(0.6000 0.1350 150)",
    "--chart-series-5": "oklch(0.5800 0.1600 350)",
    "--chart-series-6": "oklch(0.6600 0.1350 90)",
    "--chart-series-7": "oklch(0.5500 0.1250 272)",
    "--chart-series-8": "oklch(0.6000 0.1150 184)",
    "--chart-series-9": "oklch(0.5600 0.1650 18)",
    "--chart-series-10": "oklch(0.5800 0.1300 226)",
    "--chart-series-11": "oklch(0.5200 0.1550 310)",
    "--chart-series-12": "oklch(0.6400 0.1300 120)",
};

/** Both modes, for a host that has to choose at runtime. */
export const CHART_THEME_TOKEN_VALUES: Record<ChartThemeMode, Record<ChartThemeTokenName, string>> = {
  light: LIGHT_CHART_THEME_TOKEN_VALUES,
  dark: DARK_CHART_THEME_TOKEN_VALUES,
};

/** Every token a theme is built from — the contract for a host supplying its own. */
export { CHART_THEME_TOKEN_NAMES, DEFAULT_CHART_THEME_METRICS, chartThemeFromTokens, darkChartTheme };

/** The light chart theme, resolved with no DOM. */
export const lightChartTheme: ChartTheme = chartThemeFromTokens(
  (token) => LIGHT_CHART_THEME_TOKEN_VALUES[token],
  "light",
  DEFAULT_CHART_THEME_METRICS,
  LIGHT_CHART_THEME_TOKEN_VALUES,
);

/**
 * The chart theme for a mode, with no DOM.
 *
 * This is the entry point for a static or server-side render: it needs no
 * document, it is deterministic, and it describes the default palette.
 */
export function chartThemeFallback(mode: ChartThemeMode = "dark"): ChartTheme {
  return mode === "light" ? lightChartTheme : darkChartTheme;
}
