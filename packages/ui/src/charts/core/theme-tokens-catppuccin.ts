import {
  chartThemeFromTokens,
  DARK_CHART_THEME_TOKEN_VALUES,
  DEFAULT_CHART_THEME_METRICS,
  type ChartTheme,
  type ChartThemeTokenName,
} from "./theme-tokens";

/**
 * Opt-in Catppuccin Mocha tokens for the financial escape hatch.
 *
 * The default Light/Dark themes remain CSS-token driven. This explicit preset
 * exists for notebook/embedded surfaces that do not inherit the Showcase's
 * `data-theme`; it enters the same `ChartTheme` contract as every built-in
 * chart, so no component needs a Catppuccin-specific branch.
 */
const CATPPUCCIN_MOCHA_TOKENS: Partial<Record<ChartThemeTokenName, string>> = {
  "--chart-grid": "rgba(108, 112, 134, 0.16)",
  "--chart-grid-strong": "rgba(108, 112, 134, 0.28)",
  "--chart-axis-line": "#45475a",
  "--chart-axis-label": "#a6adc8",
  "--chart-crosshair": "rgba(205, 214, 244, 0.42)",
  "--chart-crosshair-label-bg": "#313244",
  "--chart-crosshair-label-fg": "#cdd6f4",
  "--chart-selection": "rgba(137, 180, 250, 0.18)",
  "--chart-band": "rgba(137, 180, 250, 0.1)",
  "--chart-reference": "rgba(166, 173, 200, 0.46)",
  "--chart-marker": "#89b4fa",
  "--chart-positive": "#a6e3a1",
  "--chart-negative": "#f38ba8",
  "--chart-neutral": "#7f849c",
  "--chart-warning": "#f9e2af",
  "--chart-seq-low": "#313244",
  "--chart-seq-mid": "#74c7ec",
  "--chart-seq-high": "#b4befe",
  "--chart-div-low": "#89b4fa",
  "--chart-div-mid": "#313244",
  "--chart-div-high": "#f38ba8",
  "--chart-corr-low": "#89b4fa",
  "--chart-corr-mid": "#313244",
  "--chart-corr-high": "#cba6f7",
  "--surface-default": "#1e1e2e",
  "--surface-raised": "#313244",
  "--surface-overlay": "#45475a",
  "--line-default": "#45475a",
  "--line-subtle": "#313244",
  "--accent-default": "#89b4fa",
  "--fg-primary": "#cdd6f4",
  "--fg-muted": "#a6adc8",
  "--chart-ink-dark": "#11111b",
  "--chart-ink-light": "#f5e0dc",
  "--chart-series-1": "#89b4fa",
  "--chart-series-2": "#fab387",
  "--chart-series-3": "#cba6f7",
  "--chart-series-4": "#a6e3a1",
  "--chart-series-5": "#f38ba8",
  "--chart-series-6": "#f9e2af",
  "--chart-series-7": "#b4befe",
  "--chart-series-8": "#94e2d5",
  "--chart-series-9": "#eba0ac",
  "--chart-series-10": "#89dceb",
  "--chart-series-11": "#f5c2e7",
  "--chart-series-12": "#74c7ec",
};

export const catppuccinMochaChartTheme: ChartTheme = chartThemeFromTokens(
  (token) => CATPPUCCIN_MOCHA_TOKENS[token] ?? DARK_CHART_THEME_TOKEN_VALUES[token],
  "dark",
  {
    ...DEFAULT_CHART_THEME_METRICS,
    monoFamily: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
  },
);
