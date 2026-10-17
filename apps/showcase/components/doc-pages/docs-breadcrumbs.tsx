"use client";

/*
 * Where am I, in the documentation's own vocabulary.
 *
 * The trail is derived from the URL and the registry projection, never written
 * per page: a component page added tomorrow gets a correct trail because it is
 * in the registry, and a page cannot disagree with the sidebar about the family
 * it belongs to. It reads `lib/docs/nav.ts` — the compact, client-safe
 * projection — because this runs in the browser; the server registry with its
 * API tables must never be imported here.
 */

import { Breadcrumbs } from "@luc/ui";
import { usePathname } from "next/navigation";
import { navEntries, navFamilies, navGroupMeta } from "@/lib/docs/nav";
import { stripLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

interface TrailItem {
  label: string;
  href?: string;
}

export function DocsBreadcrumbs() {
  const { tn, href } = useI18n();
  const pathname = stripLocale(usePathname() ?? "/").route;

  const entry = navEntries.find((candidate) => candidate.route === pathname);
  const family =
    navFamilies.find((candidate) => candidate.id === pathname.split("/").filter(Boolean).at(-1)) ??
    (entry ? navFamilies.find((candidate) => candidate.id === entry.family) : undefined);
  const groupId = entry?.group ?? family?.group;
  const group = groupId ? navGroupMeta.find((candidate) => candidate.id === groupId) : undefined;

  const items: TrailItem[] = [{ label: "Luc UI", href: href("/") }];
  if (group) items.push({ label: tn(group.title), href: href(group.route) });
  /* The family is only a distinct step when the current page is not the family
   * landing itself; on a landing page the trail would otherwise say the same
   * thing twice. */
  if (family && family.id !== pathname.split("/").filter(Boolean).at(-1)) {
    items.push({
      label: tn(family.title),
      ...(family.landing ? { href: href(family.landing) } : {}),
    });
  }
  if (entry) items.push({ label: entry.title });
  else if (family) items.push({ label: tn(family.title) });

  /*
   * A trail of one is not a trail.
   *
   * The primitive renders on every documentation page, and not every
   * documentation page is in the registry — an overview, a guide, a studio.
   * Those used to render nothing at all because the trail lived in a route
   * layout that only wrapped three groups; now that it belongs to `DocPage`,
   * the guard is what keeps a lone "Luc UI" crumb from appearing above a
   * heading that already says the same thing.
   */
  if (items.length < 2) return null;

  return <Breadcrumbs items={items} />;
}
