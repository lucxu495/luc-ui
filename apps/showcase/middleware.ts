import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_PREFIXES,
  matchLocale,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Locale routing, in one place.
 *
 * | request                  | what happens                                            |
 * | ------------------------ | ------------------------------------------------------- |
 * | `/components/buttons`    | served as-is (English), locale header `en`               |
 * | `/en/components/buttons` | rewritten to `/components/buttons`, canonical English    |
 * | `/zh/components/buttons` | rewritten to `/components/buttons`, canonical Chinese    |
 * | `/zh`, `/zh-CN`, `/zh/c…`| same as above, and the cookie is refreshed               |
 * | `/` from a zh visitor    | 307 to `/zh`, so the URL describes the language          |
 *
 * Two consequences matter. First, there is exactly one copy of every page: the
 * prefix is a routing concern, never a second source file that can drift.
 * Second, the language survives a refresh, a bookmark, a deep link and the back
 * button, because it is in the URL — the cookie only decides what a *fresh*
 * unprefixed visit should do.
 */
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/");
  const prefix = segments[1]?.toLowerCase();
  const prefixed = prefix ? LOCALE_PREFIXES[prefix] : undefined;

  if (prefixed) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER, prefixed);
    /*
     * The prefix is *not* stripped here; `next.config.ts` rewrites `/zh/**` onto
     * the unprefixed route, and this branch only resolves and records the locale.
     *
     * It used to do the rewrite itself, and that is where the `/zh` redirect loop
     * came from. `NextResponse.rewrite()` needs an absolute URL, and the absolute
     * URL it accepts is compared against the server's own origin — not the host the
     * client used. On the standalone bundle started with `HOSTNAME=127.0.0.1`:
     *
     *   request.url            http://localhost:3405/zh/components/buttons
     *   request.headers.host   127.0.0.1:3405
     *   request.nextUrl.origin http://localhost:3405
     *
     * Neither origin can be reconciled with the other, `rewrite()` refuses a
     * path-only destination ("Please use only absolute URLs"), and the result was
     * `307 Location: /zh` for a request to `/zh` — the same path, forever. A
     * rewrite declared in the Next config is compiled into the route manifest
     * instead of being negotiated at runtime, so there is no origin to disagree
     * with: the browser keeps `/zh/components/buttons` and the app renders
     * `/components/buttons` with the locale header below.
     */
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, prefixed, COOKIE_OPTIONS);
    return response;
  }

  const stored = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred: Locale =
    prefixed ??
    (stored === "zh-CN" || stored === "en"
      ? stored
      : matchLocale(request.headers.get("accept-language")));

  /*
   * Send a Chinese-preferring visitor to the Chinese URL. English is the
   * default and stays unprefixed, so not a single pre-existing link changes.
   */
  if (preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/zh" : `/zh${pathname}`;
    const response = NextResponse.redirect(url, 307);
    response.cookies.set(LOCALE_COOKIE, preferred, COOKIE_OPTIONS);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, DEFAULT_LOCALE);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (stored !== DEFAULT_LOCALE) {
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  /*
   * Everything except Next's own assets, the QA artefacts and any file with an
   * extension (fonts, images, the web manifest). A middleware that runs for
   * static bytes is pure cost.
   */
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};
