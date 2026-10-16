import { ThemeMode } from "./theme-provider.js";
//#region src/providers/theme-script.d.ts
export interface ThemeInitScriptOptions {
  defaultTheme?: ThemeMode;
  storageKey?: string;
}
/**
 * Blocking theme bootstrap. Rendered in `<head>` so the first paint already
 * carries the right theme — no flash of the wrong surface colour.
 *
 * Server-safe on purpose: this module has no `"use client"` directive so a
 * server component can inline it.
 */
export declare function lucThemeInitScript({ defaultTheme, storageKey }?: ThemeInitScriptOptions): string;
//#endregion
//# sourceMappingURL=theme-script.d.ts.map