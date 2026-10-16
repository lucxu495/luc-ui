/**
 * The LUC → TradingView theme bridge.
 *
 * Two depths of customisation exist, and the wrappers keep them apart honestly:
 *
 *  - **Web Components** are built on closed shadow roots, but TradingView
 *    publishes a documented set of CSS custom properties plus a `theme`
 *    attribute. LUC maps its semantic tokens onto those properties, so a widget
 *    inherits the page's colours and font without a single private selector.
 *  - **iframe** widgets expose only the provider's own configuration keys
 *    (`colorTheme`, `backgroundColor`, `gridColor`, `isTransparent`…). LUC can
 *    match the theme; it cannot restyle the inside, and it does not pretend to.
 *
 * No selector here targets internal widget markup, and none of these tokens are
 * guesses: they are the names published in TradingView's "Set styles and themes"
 * tutorial.
 */

import type { CSSProperties } from "react";
import type { TradingViewTheme } from "./types";

/**
 * Public TradingView CSS custom properties → LUC semantic tokens.
 *
 * Only tokens with a clear semantic counterpart are mapped. TradingView's
 * market-status chips and its positive/negative *areas* are left alone: the
 * provider keeps its own design there, and LUC's up/down axis is expressed
 * through `--chart-positive` / `--chart-negative` only.
 */
export const TRADINGVIEW_TOKEN_BRIDGE: Readonly<Record<string, string>> = {
  "--tv-widget-background-color": "var(--surface-raised)",
  "--tv-widget-text-color": "var(--fg-primary)",
  "--tv-widget-font-family": "var(--font-sans)",
  "--tv-widget-accent-color": "var(--accent-default)",
  "--tv-widget-price-text-color": "var(--fg-primary)",
  "--tv-widget-scales-font-color": "var(--fg-muted)",
  "--tv-widget-popup-background-color": "var(--surface-overlay)",
  "--tv-widget-tooltip-background-color": "var(--chart-tooltip-surface)",
  "--tv-widget-tooltip-text-color": "var(--fg-primary)",
  "--tv-widget-positive-color": "var(--chart-positive)",
  "--tv-widget-negative-color": "var(--chart-negative)",
};

/** The LUC token inside a `var(--token)` reference, or `null` for a literal. */
export function bridgedLucToken(reference: string): string | null {
  const match = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/.exec(reference.trim());
  return match?.[1] ?? null;
}

/**
 * The bridged entries that are **colours**.
 *
 * Only these are resolved before they reach the provider; everything else (the
 * font family) is a reference the provider resolves itself.
 */
const BRIDGED_COLOR_TOKENS = new Set<string>([
  "--surface-raised",
  "--fg-primary",
  "--accent-default",
  "--fg-muted",
  "--surface-overlay",
  "--chart-tooltip-surface",
  "--chart-positive",
  "--chart-negative",
]);

export interface TradingViewTokenStyleOptions {
  inheritTheme: boolean;
  transparent?: boolean;
  /**
   * Resolved colours keyed by LUC token (see `getLucBridgeColorSnapshot`).
   *
   * `null`/absent means "not resolved yet" — the server render and the hydration
   * pass. The bridge then emits **no** colour overrides, so the provider falls
   * back to its own themed defaults instead of being handed a value it cannot
   * parse (`var(--x)` resolving to `lab(…)` made TradingView throw during
   * construction). Non-colour tokens (the font family) always pass through as a
   * `var()` reference, which the provider resolves itself.
   */
  colors?: Readonly<Record<string, string>> | null;
}

/**
 * Inline style that hands the mapped tokens to a widget subtree.
 *
 * `transparent` is a documented provider option rather than a token override,
 * so it is applied at the token that controls the widget's own surface.
 */
export function tradingViewTokenStyle(options: TradingViewTokenStyleOptions): CSSProperties | undefined {
  const { inheritTheme, transparent, colors } = options;
  if (!inheritTheme && !transparent) return undefined;
  const style: Record<string, string> = {};
  if (inheritTheme && colors) {
    for (const [property, reference] of Object.entries(TRADINGVIEW_TOKEN_BRIDGE)) {
      const token = bridgedLucToken(reference);
      // A non-colour reference (the font family) passes through; a colour the
      // page has not resolved yet is simply omitted.
      const value = token && BRIDGED_COLOR_TOKENS.has(token) ? colors[token] : reference;
      if (value) style[property] = value;
    }
  }
  if (transparent) style["--tv-widget-background-color"] = "transparent";
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

/** Resolve the provider theme from LUC's resolved theme. */
export function resolveTradingViewTheme(
  theme: "dark" | "light" | "auto",
  lucTheme: "dark" | "light",
): TradingViewTheme {
  return theme === "auto" ? lucTheme : theme;
}

/**
 * iframe widgets read a `colorTheme` string. Kept as a function so the value
 * stays in one place rather than being spelled out in twenty option builders.
 */
export function iframeColorTheme(theme: TradingViewTheme): "dark" | "light" {
  return theme;
}
