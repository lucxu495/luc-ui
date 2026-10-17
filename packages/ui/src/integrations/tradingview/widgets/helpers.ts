"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getLucTokenSnapshot,
  parseLucTokenSnapshot,
  subscribeLucTokens,
  type LucIframePalette,
} from "../core/tokens";
import { useTradingViewTheme } from "../core/use-tradingview";
import type { TradingViewLocale, TradingViewRawConfig, TradingViewThemeProp } from "../core/types";

/** Drop `undefined` entries so a provider config never carries an explicit null. */
export function clean<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) out[key] = entry;
  }
  return out as T;
}

/** Merge provider defaults with caller overrides, dropping undefined. */
export function providerConfig(
  defaults: TradingViewRawConfig,
  overrides: TradingViewRawConfig,
): TradingViewRawConfig {
  return { ...defaults, ...clean(overrides) };
}

/**
 * The provider locale an iframe widget should render in.
 *
 * An iframe embed receives its language as a **config value**, not through the
 * module URL (that is the Web-Component path), so every iframe wrapper has to
 * pass the caller's locale explicitly. The provider falls back to English, which
 * is also what an unmapped Luc locale gets: a Chinese page must never render an
 * English widget because the mapping was forgotten.
 */
export function providerLocale(locale: TradingViewLocale | undefined): TradingViewLocale {
  return locale ?? "en";
}

export interface UseIframePaletteOptions {
  theme?: TradingViewThemeProp;
  /** Resolve Luc UI's surface colours. Only needed when the widget takes them. */
  withSurface?: boolean;
}

/**
 * Resolve Luc UI's surface colours for an iframe config.
 *
 * Read through `useSyncExternalStore`, so nothing is measured during a server
 * render and the first client render still matches the server markup. A theme
 * flip re-resolves once and the wrapper rebuilds the embed with the new colours.
 */
export function useIframePalette({ theme: themeProp = "auto", withSurface = false }: UseIframePaletteOptions = {}) {
  const theme = useTradingViewTheme(themeProp);
  const snapshot = useSyncExternalStore(
    subscribeLucTokens,
    getLucTokenSnapshot,
    () => "",
  );
  const palette: LucIframePalette | null = useMemo(
    () => (withSurface ? parseLucTokenSnapshot(snapshot) : null),
    [snapshot, withSurface],
  );
  return { theme, palette };
}
