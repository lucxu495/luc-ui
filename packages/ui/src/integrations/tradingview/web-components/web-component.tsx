"use client";

import { createElement, useEffect, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../../utils/cn";
import { TradingViewBoundary } from "../core/boundary";
import { tradingViewModuleUrl, type TradingViewWidgetDefinition } from "../core/catalog";
import { buildWebComponentAttributes, defaultLocale } from "../core/markup";
import { TradingViewRetryAction, TradingViewWidgetError, TradingViewWidgetSkeleton } from "../core/surface";
import type { TradingViewLinkDetail, TradingViewWidgetBaseProps } from "../core/types";
import {
  useTradingViewElement,
  useTradingViewInView,
  useTradingViewStatusChange,
  useTradingViewTokenBridge,
} from "../core/use-tradingview";

export interface TradingViewWebComponentProps extends TradingViewWidgetBaseProps {
  definition: TradingViewWidgetDefinition;
  /** Typed provider settings, keyed by the widget's documented setting names. */
  settings?: Record<string, unknown>;
  /** Values that are derived by LUC rather than passed by the consumer. */
  derived?: Record<string, unknown>;
  /**
   * Placeholders for the provider's module URL, currently only `{broker}`.
   */
  urlParams?: Record<string, string>;
  /** `tv-link-open` handler. Calling it stops the provider opening TradingView. */
  onSymbolNavigate?: (detail: TradingViewLinkDetail) => void;
  /** Provider `symbol-url` template, when the widget supports it. */
  symbolUrl?: string;
  children?: ReactNode;
}

/**
 * The one Web Component adapter.
 *
 * The custom element is rendered by React (in SSR markup too), so before the
 * provider module arrives the browser simply paints the placeholder children —
 * TradingView's own documented graceful-degradation path. When the element
 * upgrades, its closed shadow root takes over and the light DOM stops painting,
 * which is why no overlay is needed and why the provider's UI can never be
 * covered by LUC.
 */
export function TradingViewWebComponent({
  definition,
  settings,
  derived,
  urlParams,
  onSymbolNavigate,
  symbolUrl,
  height,
  minHeight,
  className,
  title,
  theme: themeProp,
  inheritTheme = true,
  transparent = false,
  loading = "lazy",
  locale,
  timeoutMs,
  config,
  onStatusChange,
  placeholder,
  fallback,
  children,
  ...aria
}: TradingViewWebComponentProps) {
  const resolvedLocale = defaultLocale(locale);
  const url = tradingViewModuleUrl(definition, resolvedLocale, urlParams);
  const { ref: boxRef, inView } = useTradingViewInView(loading);
  const { theme: resolvedTheme, style } = useTradingViewTokenBridge({ theme: themeProp, inheritTheme, transparent });
  const { status, error, retry } = useTradingViewElement({
    url,
    tag: definition.element ?? "",
    active: inView,
    timeoutMs,
  });

  useTradingViewStatusChange(status, error, onStatusChange);

  // Symbol links: the provider only lets us redirect symbol URLs, and only
  // through this event. Attribution and legal links never reach it, which is why
  // this listens for the provider's own event instead of rewriting anchors.
  useEffect(() => {
    const element = definition.element ? boxRef.current?.querySelector(definition.element) : null;
    if (!element || !onSymbolNavigate) return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TradingViewLinkDetail>).detail;
      if (!detail?.href) return;
      event.preventDefault();
      onSymbolNavigate(detail);
    };
    element.addEventListener("tv-link-open", handler);
    return () => element.removeEventListener("tv-link-open", handler);
  }, [boxRef, definition.element, onSymbolNavigate, status]);

  const attributes = buildWebComponentAttributes({
    definition,
    props: settings ?? {},
    extras: {
      ...derived,
      ...(locale ? { locale } : {}),
    },
    config,
  });

  /*
   * `transparent` is a generic attribute on the provider's custom elements, not
   * one of a widget's declared settings — so it is applied here rather than
   * through the settings map.
   */
  if (transparent && definition.supports.transparent) attributes.transparent = "";
  /*
   * `symbol-url` is also generic: the provider resolves it in the widget itself
   * and its own attribution and legal links are never redirected.
   */
  if (symbolUrl && definition.supports.symbolUrl) attributes["symbol-url"] = symbolUrl;

  const boxStyle: CSSProperties = {
    height: typeof height === "number" ? `${height}px` : (height ?? `${definition.defaultHeight}px`),
    minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
  };

  const elementProps: Record<string, unknown> = {
    ...attributes,
    theme: resolvedTheme,
    "data-luc-tv-widget": definition.id,
    style: { display: "block", width: "100%", ...(style ?? {}) },
  };

  /*
   * A custom element only ever sees strings. Presence-encoded settings become
   * `attr=""`, and an omitted prop must not become `attr=""` — so `undefined`
   * entries are dropped rather than rendered as an empty value the provider
   * would read as explicit.
   */
  for (const [key, value] of Object.entries(elementProps)) {
    if (value === undefined) delete elementProps[key];
    else if (value === true) elementProps[key] = "";
  }

  return (
    /*
     * The boundary is the last line of defence: the loader classifies network
     * failures, but a throw while *constructing* the provider element would
     * otherwise unmount the page. A provider widget is never allowed to do that.
     */
    <TradingViewBoundary resetKey={url}>
      <div
        ref={boxRef}
        className={cn("relative w-full min-w-0", className)}
        style={boxStyle}
        role="group"
        aria-label={aria["aria-label"] ?? title ?? definition.name}
        /*
         * QA-only lifecycle hook. It reports the *wrapper's* state
         * (`idle | loading | ready | error`) — never the provider's internals —
         * so browser QA can wait for a real, LUC-owned condition instead of
         * inferring readiness from the placeholder markup. Nothing styles it.
         */
        data-luc-tv-status={status}
      >
        {status === "error" ? (
          fallback ?? (
            <TradingViewWidgetError action={<TradingViewRetryAction onRetry={retry} />} />
          )
        ) : (
          createElement(
            definition.element ?? "div",
            elementProps,
            status === "ready" ? null : (placeholder ?? <TradingViewWidgetSkeleton />),
          )
        )}
        {children}
      </div>
    </TradingViewBoundary>
  );
}
