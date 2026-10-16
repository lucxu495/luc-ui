"use client";

/*
 * A `<Link>` inside a live specimen, in the reader's language.
 *
 * A specimen is the real public component, so a link demo has to render a real
 * anchor with a real destination. On a Chinese page that destination has to be
 * `/zh/...`: `middleware.ts` redirects an unprefixed URL into `/zh` when the
 * cookie says so, and Next *prefetches* a `<Link>` in the viewport — so the
 * unprefixed href is not merely one extra hop, it is a 307 the client router
 * caches and replays on click (`qa/locale.mjs`).
 *
 * The wrapper exists because the fixture is module-level data and cannot know
 * the locale; the component is rendered where the locale *is* known. It renders
 * the same `Link` the snippet shows the reader — only the resolved `href`
 * differs, and only for an app-relative target.
 */

import { Link, type LinkProps } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export function LocalLink({ href, ...props }: LinkProps) {
  const { href: localize } = useI18n();
  const resolved = typeof href === "string" && href.startsWith("/") ? localize(href) : href;
  return <Link {...props} href={resolved} />;
}
