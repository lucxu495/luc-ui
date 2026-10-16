"use client";

/*
 * The foot of a component page: related pages, then the pager.
 *
 * UX-003. The five pages that are written by hand rather than assembled from the
 * registry — Buttons, Inputs, Cards, AI, Slider — ended in a different place from
 * every generated page: the generated ones offer two to four related entries and
 * a Previous/Next pair, and the handwritten ones simply stopped. A reader who
 * arrived from search had no next step, which is the one thing a documentation
 * catalog owes them.
 *
 * It reads the *compact* projection (`lib/docs/nav.ts`), not `registry.ts`: four
 * of these five pages are client components, and the registry carries 700 KB of
 * compiler output that has no business in a page bundle. The projection is
 * generated from the same rows, so "related" and "next" mean here exactly what
 * they mean on a generated page — and the ordering is reproduced rather than
 * approximated, because Previous/Next walk the catalogue's reading order.
 *
 * The DOM is deliberately the same as `RelatedEntries`/`PrevNextNav` in
 * `doc-entry.tsx` — a named `nav` for each — so one browser gate can check both
 * families of page.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inline, Separator, Stack, Text, buttonVariants, cn } from "@luc/ui";
import {
  navEntries,
  navEntry,
  navEntryByRoute,
  navFamilies,
  navGroupMeta,
} from "@/lib/docs/nav";
import { stripLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

/** The catalogue's reading order, flattened the way `registry.ts` builds it. */
const readingOrder = navGroupMeta.flatMap((group) =>
  navFamilies
    .filter((family) => family.group === group.id)
    .flatMap((family) => family.entries),
);
const orderIndex = new Map(readingOrder.map((entry, index) => [entry.id, index]));

export interface EntryFooterProps {
  /**
   * The registry id of the capability the page documents.
   *
   * Omitted, and the footer resolves the entry from the URL — which is what a
   * handwritten page wants, because the route *is* the id it was documented
   * under. A page whose route is not in the registry (a family overview, a
   * collection page) resolves nothing and renders nothing.
   */
  entryId?: string;
  /**
   * Extra related rows, by id.
   *
   * A handwritten page can document more than the one export its registry row
   * names — `/components/cards` documents `Card` and `Panel` — and this is how it
   * says so without a second list of routes.
   */
  related?: readonly string[];
}

export function EntryFooter({ entryId, related = [] }: EntryFooterProps) {
  const { tcs, href } = useI18n();
  const route = stripLocale(usePathname() ?? "/").route;
  const entry = entryId ? navEntry(entryId) : navEntryByRoute(route);
  if (!entry) return null;

  const seen = new Set<string>([entry.id]);
  const links = [...related, ...(navFamilies.find((family) => family.id === entry.family)?.entries ?? []).map((item) => item.id)]
    .flatMap((id) => {
      const candidate = id === entry.id ? undefined : navEntry(id);
      if (!candidate || seen.has(candidate.id)) return [];
      seen.add(candidate.id);
      return [candidate];
    })
    .slice(0, 4);

  const index = orderIndex.get(entry.id);
  const previous = index === undefined || index === 0 ? undefined : readingOrder[index - 1];
  const next = index === undefined ? undefined : readingOrder[index + 1];

  return (
    <Stack gap="md">
      {links.length > 0 ? (
        <Stack gap="sm">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Related")}
          </Text>
          <nav aria-label="Related pages">
            <Inline gap="sm" wrap>
              {links.map((item) => (
                <Link
                  key={item.id}
                  href={href(item.route)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {item.title}
                </Link>
              ))}
            </Inline>
          </nav>
        </Stack>
      ) : null}
      {previous || next ? (
        <>
          <Separator />
          <nav aria-label="Documentation" className="grid gap-3 sm:grid-cols-2">
            {previous ? (
              <Link
                href={href(previous.route)}
                className="luc-transition flex flex-col gap-0.5 rounded-lg border border-line-subtle p-3 hover:border-line-strong"
              >
                <span className="text-micro text-fg-muted uppercase">{tcs("Previous")}</span>
                <span className="text-label text-fg-primary">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={href(next.route)}
                className={cn(
                  "luc-transition flex flex-col gap-0.5 rounded-lg border border-line-subtle p-3 text-right hover:border-line-strong",
                  previous ? "" : "sm:col-start-2",
                )}
              >
                <span className="text-micro text-fg-muted uppercase">{tcs("Next")}</span>
                <span className="text-label text-fg-primary">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        </>
      ) : null}
    </Stack>
  );
}

/** The ids of the entries a page in this family might offer, for callers. */
export const footerEntryIds: readonly string[] = navEntries.map((entry) => entry.id);
