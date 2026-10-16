"use client";

/*
 * The API section for a page that composes components instead of being one.
 *
 * `/forms/validation`, `/forms/async`, `/forms/sections`, `/date-time/date-range`
 * and the `/application` overview document *arrangements*: a validated form, an
 * async field, a repeatable section, a picker's date range, the application
 * shell. None of them exports a component with props of its own, so a props
 * table here would have to be invented — which is exactly what Components V2
 * forbids. What the reader needs instead is the way to the real references.
 *
 * So this prints those links and says plainly what the page is. The rows come
 * from the compact navigation projection (`lib/docs/nav.ts`): a client component
 * cannot read the registry, and it must not, because the registry's API tables
 * are compiler output measured in hundreds of kilobytes.
 *
 * A link is not a consolation prize here. `#api` is the anchor the generated
 * pages already give their API section, so this lands the reader on the props
 * table of the component the sentence was about.
 */

import Link from "next/link";
import { Heading, Text } from "@luc/ui";
import { navEntry } from "@/lib/docs/nav";
import { useI18n } from "@/lib/i18n/provider";

export interface RelatedApiProps {
  /** Registry ids whose API this page is composed from. */
  ids: readonly string[];
}

export function RelatedApi({ ids }: RelatedApiProps) {
  const { tcs, tn, href } = useI18n();
  const rows = ids.flatMap((id) => {
    const entry = navEntry(id);
    return entry ? [entry] : [];
  });
  /* An id that is not in the registry means the caller named something that
   * does not exist. Rendering nothing is better than rendering a dead link. */
  if (rows.length === 0) return null;

  return (
    <section data-slot="related-api" className="flex flex-col gap-4">
      <Heading size="title" as="h2" id="api">
        {tcs("API")}
      </Heading>
      <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
        {tcs(
          "This page shows components working together rather than exporting one of its own, so the props live on the pages below — each link opens that page's API table.",
        )}
      </Text>
      <ul className="flex flex-col gap-1.5">
        {rows.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3">
            <Link
              href={href(`${entry.route}#api`)}
              className="luc-focus rounded-sm text-body text-fg-accent underline underline-offset-4"
            >
              {tn(entry.title)}
            </Link>
            <code className="font-mono text-caption text-fg-muted">{entry.id}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
