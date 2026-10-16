/*
 * The client-safe view of the registry.
 *
 * Why this file exists, and why it is not `registry.ts`: the sidebar, the
 * command palette and component search run in the browser. `registry.ts` also
 * exposes the API tables, which are 700 KB of compiler output — correct on the
 * server, unacceptable in a page bundle. So the browser reads the compact
 * projection (`generated/nav.ts`: id, title, route, family) and the server reads
 * the full registry. One source, two projections, no second catalogue.
 */

import { generatedFamilies, generatedGroups } from "./generated/registry";
import { generatedNav } from "./generated/nav";
import type { NavRow } from "./api-types";

export interface NavEntry {
  id: string;
  title: string;
  route: string;
  family: string;
  group: string;
  /** `reference` entries are documented on a family page, not on their own. */
  status: NavRow["s"];
}

/*
 * Two rules shape the navigation, and both are about not lying to a reader:
 *
 *  1. A `reference` entry has no page of its own, so it gets no row. It is
 *     listed on its family page instead, which is where its exports are
 *     documented.
 *  2. Two entries may share a page — `FileInput` and `FileUpload` really are
 *     one page, `/components/file-upload` — and the second must not become a
 *     duplicate link to the first. The first occurrence wins, in registry
 *     order, so which one is canonical is deterministic rather than accidental.
 */
const rows = generatedNav.map((row: NavRow) => ({
  id: row.id,
  title: row.t,
  route: row.r,
  family: row.f,
  group: row.g,
  status: row.s,
}));

const claimedRoutes = new Set<string>();
export const navEntries: readonly NavEntry[] = rows.filter((entry) => {
  if (entry.status === "reference") return false;
  if (claimedRoutes.has(entry.route)) return false;
  claimedRoutes.add(entry.route);
  return true;
});

const entryById = new Map(navEntries.map((entry) => [entry.id, entry]));
const entryByRoute = new Map<string, NavEntry>();
for (const entry of navEntries) {
  if (!entryByRoute.has(entry.route)) entryByRoute.set(entry.route, entry);
}

export function navEntry(id: string): NavEntry | undefined {
  return entryById.get(id);
}

/** Resolve the registry row a pathname belongs to, for active state. */
export function navEntryByRoute(route: string): NavEntry | undefined {
  const normalized = route.length > 1 ? route.replace(/\/$/, "") : route;
  return entryByRoute.get(normalized);
}

export interface NavFamily {
  id: string;
  title: string;
  summary: string;
  group: string;
  landing: string | null;
  entries: NavEntry[];
}

/*
 * Families with their entries resolved, in registry order.
 *
 * A chart may belong to two families — `LineChart` is filed under General and
 * under Time series, because both are true from a reader's point of view — and
 * it still has exactly one page. The second family therefore lists the *same*
 * entry only if no earlier family already claimed its route; otherwise the
 * sidebar would offer two rows that lead to one page.
 */
const claimedByFamilies = new Set<string>();
export const navFamilies: readonly NavFamily[] = generatedFamilies.map((family) => ({
  id: family.id,
  title: family.title,
  summary: family.summary,
  group: family.group,
  landing: family.landing,
  entries: family.entries.flatMap((id) => {
    const entry = entryById.get(id);
    if (!entry) return [];
    if (claimedByFamilies.has(entry.route)) return [];
    claimedByFamilies.add(entry.route);
    return [entry];
  }),
}));

export const navGroupMeta = generatedGroups;

export interface NavSearchResult {
  entry: NavEntry;
  rank: number;
}

/**
 * Ranked substring search over the documentation.
 *
 * Deliberately not fuzzy. A documentation search that answers `card` with
 * `RadarChart` costs the reader more than an empty result, because every hit
 * has to be read to find out it is wrong. Exact id, id prefix, title prefix,
 * title substring — in that order.
 */
export function searchNav(query: string, limit = 10): NavSearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const results: NavSearchResult[] = [];
  for (const entry of navEntries) {
    const id = entry.id.toLowerCase();
    const title = entry.title.toLowerCase();
    let rank: number | undefined;
    if (id === needle || title === needle) rank = 0;
    else if (id.startsWith(needle)) rank = 1;
    else if (title.startsWith(needle)) rank = 2;
    else if (title.includes(needle)) rank = 3;
    else if (id.includes(needle)) rank = 4;
    if (rank === undefined) continue;
    results.push({ entry, rank });
  }
  return results
    .sort((a, b) => a.rank - b.rank || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit);
}

/** The families of one group, for the sidebar's section headings. */
export function navFamiliesInGroup(group: string): readonly NavFamily[] {
  return navFamilies.filter((family) => family.group === group);
}
