"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useOptionalTheme } from "../../../providers/theme-provider";
import {
  getTradingViewLoadError,
  getTradingViewLoadState,
  loadTradingViewElement,
  resetTradingViewLoad,
  subscribeTradingViewLoad,
} from "./loader";
import { resolveTradingViewTheme, tradingViewTokenStyle } from "./theme";
import {
  getLucBridgeColorSnapshot,
  parseLucBridgeColorSnapshot,
  subscribeLucTokens,
} from "./tokens";
import type { TradingViewStatus, TradingViewTheme, TradingViewThemeProp } from "./types";

/** The theme a widget should render in, resolved from LUC's theme. */
export function useTradingViewTheme(theme: TradingViewThemeProp = "auto"): TradingViewTheme {
  const luc = useOptionalTheme();
  const resolved = luc?.resolvedTheme ?? "dark";
  return resolveTradingViewTheme(theme, resolved);
}

export interface TradingViewTokenProps {
  theme?: TradingViewThemeProp;
  inheritTheme?: boolean;
  transparent?: boolean;
}

/** Theme + token style for a Web Component wrapper. */
export function useTradingViewTokenBridge({ theme, inheritTheme = true, transparent }: TradingViewTokenProps) {
  const resolvedTheme = useTradingViewTheme(theme);
  /*
   * The bridge hands the provider *resolved* colours, never `var(…)`.
   *
   * A LUC token resolves to `lab(…)` (Tailwind v4's palette) and TradingView's
   * own colour parser rejects that notation, so a raw reference made the widget
   * throw during construction. The snapshot is an external store, so nothing is
   * measured during a server render, the hydration pass matches the server, and
   * a theme flip re-resolves exactly once.
   */
  const snapshot = useSyncExternalStore(
    subscribeLucTokens,
    getLucBridgeColorSnapshot,
    () => "",
  );
  const colors = useMemo(() => parseLucBridgeColorSnapshot(snapshot), [snapshot]);
  const style = useMemo(
    () => tradingViewTokenStyle({ inheritTheme, transparent, colors }),
    [colors, inheritTheme, transparent],
  );
  return { theme: resolvedTheme, style };
}

/**
 * Lazy gate.
 *
 * Nothing is requested until the widget is near the viewport, so a catalog page
 * with thirty previews does not open thirty connections. `eager` skips the
 * observer entirely; a widget that is already visible resolves on the first
 * observer callback, which is one frame after mount.
 */
export function useTradingViewInView(loading: "lazy" | "eager" = "lazy") {
  const [observed, setObserved] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const supported = typeof IntersectionObserver !== "undefined";

  useEffect(() => {
    if (loading === "eager" || observed || !supported) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setObserved(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, observed, supported]);

  // Without IntersectionObserver there is nothing to defer to: load immediately.
  return { ref, inView: loading === "eager" || observed || !supported };
}

export interface TradingViewElementStatus {
  status: TradingViewStatus;
  error?: Error;
  retry: () => void;
}

/**
 * Lifecycle for a Web Component wrapper.
 *
 * The store is read through `useSyncExternalStore`, so several wrappers sharing
 * one module URL all observe the same transition without any context.
 */
export function useTradingViewElement(options: {
  url: string;
  tag: string;
  active: boolean;
  timeoutMs?: number;
}): TradingViewElementStatus {
  const { url, tag, active, timeoutMs } = options;
  const subscribe = useCallback((listener: () => void) => subscribeTradingViewLoad(url, listener), [url]);
  const getSnapshot = useCallback(() => getTradingViewLoadState(url), [url]);
  const storeState = useSyncExternalStore(subscribe, getSnapshot, () => "pending" as const);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active || !url) return;
    void loadTradingViewElement(url, { tag, timeoutMs });
  }, [active, tag, timeoutMs, url, tick]);

  const retry = useCallback(() => {
    resetTradingViewLoad(url);
    setTick((value) => value + 1);
  }, [url]);

  const status: TradingViewStatus =
    !active || !url ? "idle" : storeState === "pending" ? "loading" : storeState === "failed" ? "error" : "ready";
  return { status, error: getTradingViewLoadError(url), retry };
}

/**
 * Notify a caller on every lifecycle transition.
 *
 * The callback is kept in a ref that is written from an effect (the same
 * pattern as `useLatest`), so a caller passing an inline arrow does not restart
 * the load on every render.
 */
export function useTradingViewStatusChange(
  status: TradingViewStatus,
  error: Error | undefined,
  onChange: ((change: { status: TradingViewStatus; error?: Error }) => void) | undefined,
) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(() => {
    latest.current?.({ status, error });
  }, [error, status]);
}
