import type { ThemeMode } from "./theme-provider";

const DARK_QUERY = "(prefers-color-scheme: dark)";

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
export function lucThemeInitScript({
  defaultTheme = "system",
  storageKey = "luc-ui-theme",
}: ThemeInitScriptOptions = {}): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var d=${JSON.stringify(defaultTheme)};var s=localStorage.getItem(k)||d;var m=window.matchMedia('${DARK_QUERY}').matches;var r=s==='system'?(m?'dark':'light'):s;var e=document.documentElement;e.classList.toggle('dark',r==='dark');e.dataset.theme=r;e.style.colorScheme=r;}catch(e){}})();`;
}
