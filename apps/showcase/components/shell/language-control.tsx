"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { IconButton, PopoverContent, PopoverRoot, PopoverTrigger, Text, cn } from "@luc/ui";
import { RiCheckLine, RiTranslate2 } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  localePrefix,
  stripLocale,
  type Locale,
} from "@/lib/i18n/config";

/*
 * Remember the choice *before* the navigation request leaves.
 *
 * The cookie is what the middleware uses to decide whether an unprefixed URL
 * should be served or redirected into Chinese, so switching back to English
 * has to write it first — otherwise the browser asks for `/components` while
 * still carrying `zh-CN` and is bounced straight back to `/zh/components`.
 *
 * It lives at module scope rather than in the component because writing to
 * `document.cookie` is a mutation of a value the component does not own, which
 * the React Compiler's immutability rules (rightly) refuse to allow inside a
 * render or a handler defined in the component body.
 */
function rememberLocale(target: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Language switcher.
 *
 * It is a set of real links, not buttons that call a setter: the language *is*
 * the URL, so the correct implementation is the one the browser already knows
 * how to handle. That buys middle-click, "open in new tab", the status-bar
 * preview and correct back/forward behaviour for free — and it means the switch
 * cannot desynchronise the address bar from what is rendered.
 *
 * The query string is carried across so a filtered table or a chart range
 * survives a language change.
 */
export function LanguageControl() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <IconButton
          variant="ghost"
          size="sm"
          label={t("language.switch")}
          icon={<RiTranslate2 />}
          disabled
        />
      }
    >
      <LanguageControlInner />
    </Suspense>
  );
}

function LanguageControlInner() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const { route } = stripLocale(pathname);
  const query = searchParams?.toString();

  const hrefFor = (target: Locale) => {
    const path = `${localePrefix(target)}${route === "/" ? "/" : route}`;
    return query ? `${path}?${query}` : path;
  };

  /*
   * A language change is a **document** change, so it performs a real
   * navigation rather than a client-side one.
   *
   * The locale is resolved on the server from the URL prefix, and Next's client
   * router caches the shared layout for a route — it has no reason to re-request
   * `app/layout.tsx` when only the leaf segment changes, so a soft navigation
   * would keep the previous language in the frame while the URL said otherwise.
   * The server-rendered `<html lang>`, the sidebar labels and the document
   * language all have to change together, and only a fresh document guarantees
   * that. Modified clicks are left alone so "open in new tab" still works.
   */
  const switchTo = (event: React.MouseEvent<HTMLAnchorElement>, target: Locale) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    rememberLocale(target);
    window.location.assign(hrefFor(target));
  };

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          label={t("language.switch")}
          data-testid="language-control"
          icon={<RiTranslate2 />}
        />
      </PopoverTrigger>
      <PopoverContent width="sm" align="end" className="flex flex-col gap-1">
        <Text variant="micro" tone="muted" className="px-2 pb-0.5">
          {t("language.title")}
        </Text>
        {LOCALES.map((option) => (
          <Link
            key={option}
            href={hrefFor(option)}
            /*
             * `prefetch={false}` is required, not a micro-optimisation. Next
             * prefetches a link as soon as it is in the viewport, and a prefetch
             * of `/components/buttons` made *while the cookie still said zh-CN*
             * receives the 307 into `/zh/...` — which the router then caches and
             * replays on click. Writing the cookie first is not enough; the stale
             * redirect has to not exist in the first place.
             */
            prefetch={false}
            onPointerEnter={() => rememberLocale(option)}
            onFocus={() => rememberLocale(option)}
            onClick={(event) => switchTo(event, option)}
            hrefLang={option}
            lang={option}
            aria-current={option === locale ? "true" : undefined}
            data-locale-option={option}
            className={cn(
              "luc-transition luc-focus flex h-8 items-center gap-2 rounded-sm px-2 text-label",
              "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
              option === locale && "bg-surface-selected text-fg-primary",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{LOCALE_LABELS[option]}</span>
            {option === locale ? (
              <RiCheckLine aria-hidden="true" className="size-3.5 shrink-0 text-fg-accent" />
            ) : null}
          </Link>
        ))}
        <Text variant="caption" tone="muted" className="px-2 pt-1">
          {t("language.hint")}
        </Text>
        <Text variant="caption" tone="muted" className="px-2">
          {t("language.coverage")}
        </Text>
      </PopoverContent>
    </PopoverRoot>
  );
}
