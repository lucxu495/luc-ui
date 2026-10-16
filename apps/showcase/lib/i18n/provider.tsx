"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, localizeHref, stripLocale, type Locale } from "./config";
import { en, dictionaries } from "./messages";

export interface I18nValue {
  locale: Locale;
  /** Chrome string by symbol, with `{name}` interpolation. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate a navigation label or description (keyed by its English source). */
  tn: (source: string) => string;
  /** Long-form page copy by symbol. */
  tc: (key: string) => string;
  /**
   * Translate a sentence of documentation prose, keyed by its English source.
   *
   * The English sentence stays in the page — it is the fallback for anything
   * this dictionary has not reached yet — and the Chinese is looked up by the
   * sentence itself. Whitespace is normalised on both sides, because JSX
   * collapses it for a string attribute and a page may be re-indented without
   * that being a translation change.
   */
  tcs: (source: string) => string;
  /** Page-header override for the current route, if one exists. */
  route: string;
  /** Add the locale prefix to an app-absolute href. */
  href: (target: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Missing-key diagnostics.
 *
 * A missing translation must never render a raw key — that is how a UI ends up
 * showing `nav.filterPlaceholder` to a customer. Fallback is always English,
 * and the gap is reported exactly once per key per session, in development
 * only, so a reviewer can see what is left without the console turning into a
 * wall of repeats on every render.
 */
const reported = new Set<string>();

function report(kind: "ui" | "nav" | "content" | "prose", key: string) {
  if (process.env.NODE_ENV === "production") return;
  const id = `${kind}:${key}`;
  if (reported.has(id)) return;
  reported.add(id);
  console.warn(`[i18n] missing zh-CN ${kind} string: ${key}`);
}

/** One canonical form for a source sentence: collapsed whitespace, trimmed. */
export function normalizeSource(source: string): string {
  return source.replace(/\s+/g, " ").trim();
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

export interface I18nProviderProps {
  /** Resolved on the server from the URL prefix, the cookie and `Accept-Language`. */
  locale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale = DEFAULT_LOCALE, children }: I18nProviderProps) {
  const pathname = usePathname();
  // The router may report either the browser URL or the rewritten one; both are
  // handled, so the route key is the same before and after middleware.
  const { route } = stripLocale(pathname ?? "/");

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[locale] ?? en;
    return {
      locale,
      route,
      t: (key, vars) => {
        const hit = dict.ui[key];
        if (hit !== undefined) return interpolate(hit, vars);
        if (locale !== DEFAULT_LOCALE) report("ui", key);
        return interpolate(en.ui[key] ?? key, vars);
      },
      tn: (source) => {
        const hit = dict.nav[source];
        if (hit !== undefined) return hit;
        if (locale !== DEFAULT_LOCALE) report("nav", source);
        return source;
      },
      tc: (key) => {
        const hit = dict.content[key];
        if (hit !== undefined) return hit;
        if (locale !== DEFAULT_LOCALE) report("content", key);
        return en.content[key] ?? key;
      },
      tcs: (source) => {
        const key = normalizeSource(source);
        const hit = dict.prose[key];
        if (hit !== undefined) return hit;
        if (locale !== DEFAULT_LOCALE) report("prose", key);
        return source;
      },
      href: (target) => localizeHref(target, locale),
    };
  }, [locale, route]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * The translation surface.
 *
 * `useI18n()` throws outside a provider — a missing provider is a bug in the
 * app, not a state a component should silently tolerate — while
 * `useOptionalI18n()` exists for components that also ship outside the Showcase.
 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n() must be used inside <I18nProvider> — see apps/showcase/app/layout.tsx.");
  }
  return value;
}

export function useOptionalI18n(): I18nValue | null {
  return useContext(I18nContext);
}

/** Convenience for components that only need the terse form. */
export function useT() {
  return useI18n().t;
}

/** Copy for the current route's page header, falling back to the English props. */
export function useRouteCopy(fallback: { title?: string; lead?: string }): {
  title?: string;
  lead?: string;
} {
  const { locale, route } = useI18n();
  return useMemo(() => {
    if (locale === DEFAULT_LOCALE) return fallback;
    const override = (dictionaries[locale] ?? en).routes[route];
    if (!override) return fallback;
    return { title: override.title ?? fallback.title, lead: override.lead ?? fallback.lead };
  }, [fallback, locale, route]);
}
