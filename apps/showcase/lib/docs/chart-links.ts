/*
 * From a catalogue row to the page that documents it.
 *
 * `components/charts/chart-catalog-data.ts` names a chart by *public symbol* —
 * "LineChart", or two symbols joined by "·" / "+" where one row covers two
 * renderers of the same plot. The registry names a chart by *route*. Neither is
 * the other's key, and writing the 78 routes down a second time inside the data
 * file is how a catalogue starts pointing at pages that were renamed.
 *
 * So the join is derived, here, from the client-safe navigation projection
 * (`./nav`), which is itself generated from the package exports. A chart that
 * gains a page gains a link; a chart whose page moves cannot leave a stale href
 * behind. `tests/unit/chart-links.test.ts` refuses a public catalogue row that
 * resolves to nothing — the mapping is allowed to be derived, not allowed to be
 * silently incomplete.
 */

import { navEntries, type NavEntry } from "./nav";

/**
 * The generated `/charts/<id>` pages.
 *
 * `status === "generated"` is what separates a one-chart page from the
 * handwritten family overviews (`/charts/statistical`), which are curation rows
 * and are reached from the chart landing page rather than from a catalogue row.
 */
const chartPages: readonly NavEntry[] = navEntries.filter(
  (entry) => entry.group === "charts" && entry.status === "generated" && entry.route.startsWith("/charts/"),
);

const pageBySymbol = new Map<string, NavEntry>(chartPages.map((entry) => [entry.title, entry]));

/** How many charts have a page of their own. The catalogue's own count to quote. */
export const chartPageCount = chartPages.length;

/**
 * The chart page a catalogue row's `symbol` names.
 *
 * `symbol` is one or more public component names; a composition ("A + B") is
 * documented by the page of its first component, because that is the one a
 * reader has to import to draw the composition at all.
 */
export function chartPageForSymbol(symbol: string): NavEntry | undefined {
  const direct = pageBySymbol.get(symbol);
  if (direct !== undefined) return direct;
  for (const token of symbol.split(/[·+]/)) {
    const page = pageBySymbol.get(token.trim());
    if (page !== undefined) return page;
  }
  return undefined;
}

/**
 * The demo id behind a chart route.
 *
 * `/charts/area-chart` → `area-chart`, which is the key `chartDemoFor` uses. The
 * demo registry is where the fixture and the live specimen live, so a thumbnail
 * is "the chart this page documents", not a second picture of it.
 */
export function chartDemoId(route: string): string {
  return route.startsWith("/charts/") ? route.slice("/charts/".length) : route;
}
