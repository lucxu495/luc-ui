/**
 * Locale configuration for the Showcase.
 *
 * Placement: this is a Showcase concern, not a `@luc/ui` one. The library owns
 * locale-*aware controls* (`LocaleProvider` feeds React Aria so a date grid
 * knows its week start); it deliberately does not own a translation runtime,
 * because a component library has no business shipping other products' copy.
 *
 * URL strategy: prefix, with the default language unprefixed.
 *
 *   /components/buttons        English (every pre-existing URL keeps working)
 *   /zh/components/buttons     Simplified Chinese (shareable, refresh-safe)
 *   /en/components/buttons     English, explicitly (alias, never canonical)
 *
 * `middleware.ts` rewrites the prefixed form onto the unprefixed route and
 * hands the locale to the server through a request header, so exactly one set
 * of pages exists while the URL still describes the language. A deep link, a
 * refresh, the back button and a bookmark therefore all resolve to the same
 * language without a client-side effect.
 */

export const LOCALES = ["en", "zh-CN"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that remembers the visitor's last choice between visits. */
export const LOCALE_COOKIE = "luc-ui-locale";

/** Request header the middleware sets so a server component can read the locale. */
export const LOCALE_HEADER = "x-luc-locale";

/*
 * Path prefixes. `zh-CN` is the canonical tag; `zh` is accepted because it is
 * what people type, and `/en` exists only so a switcher can produce a stable,
 * shareable English URL.
 */
export const LOCALE_PREFIXES: Record<string, Locale> = {
  en: "en",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
};

/** The `<html lang>` value, chosen so screen readers pick the right voice. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  "zh-CN": "zh-Hans-CN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The canonical URL prefix for a locale: English is unprefixed. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : "/zh";
}

/**
 * Split a pathname into its locale and route.
 *
 * Tolerates every shape the app sees: a browser URL (`/zh/components`), an
 * already-rewritten internal path (`/components`) and a hash-only link. A
 * caller therefore never has to know whether it is running before or after the
 * rewrite.
 */
export function stripLocale(pathname: string): { locale: Locale | null; route: string } {
  const segments = pathname.split("/");
  const first = segments[1]?.toLowerCase();
  const locale = first ? LOCALE_PREFIXES[first] : undefined;
  if (!locale) return { locale: null, route: pathname || "/" };
  const rest = "/" + segments.slice(2).join("/");
  return { locale, route: rest === "/" ? "/" : rest.replace(/\/$/, "") || "/" };
}

/** Add the locale prefix to an app-absolute href. Leaves hashes and absolutes alone. */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href;
  const prefix = localePrefix(locale);
  if (!prefix) return href;
  const { route } = stripLocale(href);
  return route === "/" ? prefix : `${prefix}${route}`;
}

/** Pick a locale from an `Accept-Language` header, honouring `zh` first-class. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, quality] = part.trim().split(";q=");
      return { tag: (tag ?? "").trim().toLowerCase(), q: quality ? Number(quality) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const entry of ranked) {
    if (entry.tag.startsWith("zh")) return "zh-CN";
    if (entry.tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
