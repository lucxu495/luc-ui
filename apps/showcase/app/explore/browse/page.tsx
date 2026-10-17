import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { localizeHref } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

/*
 * The alias for the catalog index.
 *
 * Explore shipped two entrances to one experience: `/explore` ("Find the right
 * thing") and `/explore/browse` ("All capabilities"), both mounting the same
 * `BrowseExplorer`, differing only in the material printed underneath it. A
 * reader had to open both to discover that, and the sidebar listed both as
 * though they were different destinations.
 *
 * There is one destination now, and this is its old address. A permanent
 * redirect rather than a deleted route, because the links that exist in the wild
 * carry the filter — `/explore/browse?use=monitoring` and `?kind=chart` are
 * shareable views, and every filter axis is a query parameter on the surviving
 * page. The copy is carried across, so a bookmark keeps showing what it showed.
 */

export const metadata: Metadata = {
  title: "All capabilities",
  /*
   * Kept as written rather than rewritten: the sentence still describes what the
   * alias lands on, and it is already in both dictionaries. A redirect never
   * renders metadata, so a new sentence here would be a translation nobody reads.
   */
  description:
    "Every component, chart, motion component, block, template, studio, pattern and visual study in Luc UI, filterable by kind, use case and art direction.",
};

export default async function ExploreBrowseAlias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /*
   * The locale comes from the *request*, not from the path.
   *
   * The middleware rewrites `/zh/explore/browse` onto `/explore/browse` before
   * this page runs, so a redirect to a bare `/explore` sends a Chinese reader to
   * the English page — which is what the first version of this alias did, and it
   * is invisible in a curl of the un-prefixed route. `getLocale` reads the same
   * header the rest of the server-rendered site reads, and the target is built
   * with it.
   */
  const locale = await getLocale();
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) for (const item of value) query.append(key, item);
  }
  const search = query.toString();
  permanentRedirect(localizeHref(search ? `/explore?${search}` : "/explore", locale));
}
