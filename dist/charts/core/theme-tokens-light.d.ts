import { CHART_THEME_TOKEN_NAMES, ChartTheme, ChartThemeMode, ChartThemeTokenName, DEFAULT_CHART_THEME_METRICS, chartThemeFromTokens, darkChartTheme } from "./theme-tokens.js";
//#region src/charts/core/theme-tokens-light.d.ts
/**
 * The resolved chart tokens for the default **light** theme, with no DOM.
 *
 * Same rule as the dark table: a `color-mix` against `transparent` is written as
 * the source colour at that alpha, because the transparent end contributes no
 * colour of its own.
 */
export declare const LIGHT_CHART_THEME_TOKEN_VALUES: Record<ChartThemeTokenName, string>;
/** Both modes, for a host that has to choose at runtime. */
export declare const CHART_THEME_TOKEN_VALUES: Record<ChartThemeMode, Record<ChartThemeTokenName, string>>;
/** The light chart theme, resolved with no DOM. */
export declare const lightChartTheme: ChartTheme;
/**
 * The chart theme for a mode, with no DOM.
 *
 * This is the entry point for a static or server-side render: it needs no
 * document, it is deterministic, and it describes the default palette.
 */
export declare function chartThemeFallback(mode?: ChartThemeMode): ChartTheme;
//#endregion
export type { ChartTheme, ChartThemeMode, ChartThemeTokenName };
//# sourceMappingURL=theme-tokens-light.d.ts.map