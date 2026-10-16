import { SeriesTone } from "../types.js";
import { ChartTheme, ChartThemeMode, ChartThemeTokenName } from "./theme-tokens.js";
//#region src/charts/core/theme.d.ts
/**
 * A dark fallback so option builders are total even before the DOM is ready.
 *
 * The value now comes from the token bridge (`theme-tokens.ts`) rather than a
 * literal in this file, because `resolveChartTheme()` below and the DOM-free
 * path must agree about what every token is — and the only way to guarantee
 * that is for both to be built by the same mapper from the same table.
 */
export declare const defaultChartTheme: ChartTheme;
/**
 * Attach an alpha channel to a normalised colour string.
 * Handles `#rrggbb` and `rgb()`; anything else is returned unchanged.
 */
export declare function withAlpha(color: string, alpha: number): string;
/**
 * Read the chart token layer for the element's current theme.
 *
 * Safe to call on the server: it returns the mode's default theme from the
 * token bridge, with no DOM touched. Every value falls back per token, so a
 * partially-loaded stylesheet degrades to a readable chart rather than to
 * `""`, which every engine paints as black.
 */
export declare function resolveChartTheme(root?: HTMLElement | null): ChartTheme;
/** The palette slot for a series index, wrapping after twelve tones. */
export declare function paletteColor(theme: ChartTheme, index: number): string;
/** Semantic tone → resolved colour. Falls back to the palette by index. */
export declare function toneColor(theme: ChartTheme, tone: SeriesTone | undefined, index: number): string;
//#endregion
export type { ChartTheme };
//# sourceMappingURL=theme.d.ts.map