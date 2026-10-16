import { cookies, headers } from "next/headers";
import { dictionaries, en } from "./messages";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  localizeHref,
  matchLocale,
  type Locale,
} from "./config";

/**
 * Resolve the request's locale on the server.
 *
 * Order of precedence, and why:
 *
 *  1. **The URL prefix.** `/zh/...` is an explicit, shareable instruction and
 *     always wins — that is what makes a deep link reproducible.
 *  2. **The cookie.** A returning visitor who chose Chinese on the homepage gets
 *     Chinese on the next unprefixed URL they open.
 *  3. **`Accept-Language`.** First-time visitors are greeted in their own
 *     language; anything that is not Chinese or English falls back to English.
 *
 * Reading headers makes the route dynamic. That is a deliberate trade: the
 * alternative is shipping English HTML and swapping it after hydration, which
 * means a visible flash of the wrong language and a `<html lang>` that lies to a
 * screen reader. For a documentation Showcase with no data fetching, server
 * rendering is cheap and correctness wins.
 */
export async function getLocale(): Promise<Locale> {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);

  const fromMiddleware = headerList.get(LOCALE_HEADER);
  if (isLocale(fromMiddleware)) return fromMiddleware;

  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  return matchLocale(headerList.get("accept-language")) ?? DEFAULT_LOCALE;
}

/**
 * The same prose lookup the client provider offers, for a server component.
 *
 * A page that only prints documentation — no state, no handler — has no reason
 * to become a client component just to read a dictionary, and it should keep its
 * `metadata` export. Those pages call this instead, `await` it and stay on the
 * server. Both paths read the same tables, so a sentence has exactly one
 * translation regardless of which one rendered the page.
 */
export async function getServerCopy(): Promise<{
  locale: Locale;
  /** Documentation prose keyed by its English source; falls back to English. */
  tcs: (source: string) => string;
  /**
   * A navigation label or description, keyed by its English source — the same
   * lookup the client provider's `tn` performs, for a page that lists
   * navigation entries itself.
   */
  tn: (source: string) => string;
  /**
   * Add the locale prefix to an app-absolute href.
   *
   * Every internal link on a Chinese page has to be a Chinese URL, and this is
   * the whole reason: `middleware.ts` redirects an unprefixed URL back into
   * `/zh` when the cookie says so, and Next *prefetches* a `<Link>` as soon as it
   * is in the viewport — so an unprefixed link on a Chinese page gets a 307 the
   * client router then caches and replays on click. `curl` follows one redirect
   * and sees a correct page; the browser keeps a poisoned entry.
   *
   * Returning it here, rather than exporting a free function a page has to
   * remember to import and thread a locale into, makes the correct link the
   * shortest thing to write. `qa/locale.mjs` is the gate that keeps it true.
   */
  href: (target: string) => string;
}> {
  const locale = await getLocale();
  const dict = dictionaries[locale] ?? en;
  return {
    locale,
    tcs: (source) => {
      const key = source.replace(/\s+/g, " ").trim();
      return dict.prose[key] ?? source;
    },
    tn: (source) => dict.nav[source] ?? source,
    href: (target) => localizeHref(target, locale),
  };
}
