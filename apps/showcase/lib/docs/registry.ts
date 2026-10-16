/*
 * The documentation registry, as an API.
 *
 * Everything the developer platform knows about its own contents is answered
 * from here: the sidebar tree, the search index, breadcrumbs, related links,
 * previous/next, the API tables and the AI prompts. One registry, many views —
 * which is the whole point, because a second catalogue is a second thing that
 * can disagree with the first.
 *
 * The facts come from `generated/registry.ts`, produced from the real package
 * catalogue and the real TypeScript program. This module adds judgement and
 * indexing on top, and nothing else: it never hard-codes an import path, an
 * export name or a signature.
 */

import { generatedEntries, generatedFamilies, generatedGroups } from "./generated/registry";
import { generatedApi } from "./generated/api";
import type { ApiSymbol } from "./api-types";
import type { DocEntry, DocFamily, DocGroup, DocGroupMeta } from "./types";

export type { DocEntry, DocFamily, DocGroup, DocGroupMeta } from "./types";

export const docGroups: readonly DocGroupMeta[] = generatedGroups;
export const docFamilies: readonly DocFamily[] = generatedFamilies;
export const docEntries: readonly DocEntry[] = generatedEntries;

const byId = new Map<string, DocEntry>(generatedEntries.map((entry) => [entry.id, entry]));
const byRoute = new Map<string, DocEntry>();
for (const entry of generatedEntries) {
  /* The first entry wins a shared route: a curated page that documents two
   * modules resolves to the module that owns the page's title. */
  if (!byRoute.has(entry.route)) byRoute.set(entry.route, entry);
}
const familyById = new Map<string, DocFamily>(generatedFamilies.map((family) => [family.id, family]));

export function entryById(id: string): DocEntry | undefined {
  return byId.get(id);
}

/** Resolve the entry a pathname belongs to, for the shared page chrome. */
export function entryByRoute(route: string): DocEntry | undefined {
  const normalized = route.length > 1 ? route.replace(/\/$/, "") : route;
  return byRoute.get(normalized);
}

export function familyOf(entry: DocEntry): DocFamily | undefined {
  return familyById.get(entry.family);
}

export function familiesInGroup(group: DocGroup): readonly DocFamily[] {
  return generatedFamilies.filter((family) => family.group === group);
}

export function entriesInFamily(familyId: string): DocEntry[] {
  const family = familyById.get(familyId);
  if (!family) return [];
  return family.entries.flatMap((id) => {
    const entry = byId.get(id);
    return entry ? [entry] : [];
  });
}

/**
 * The reading order of the whole catalogue, flattened.
 *
 * Previous/next walk this list, so a reader moving through the documentation
 * never falls into a gap between families or between groups.
 */
export const readingOrder: readonly DocEntry[] = generatedGroups.flatMap((group) =>
  generatedFamilies
    .filter((family) => family.group === group.id)
    .flatMap((family) =>
      family.entries.flatMap((id) => {
        const entry = byId.get(id);
        return entry ? [entry] : [];
      }),
    ),
);

const orderIndex = new Map<string, number>(readingOrder.map((entry, index) => [entry.id, index]));

export interface DocNeighbours {
  previous?: DocEntry;
  next?: DocEntry;
}

export function neighbours(entry: DocEntry): DocNeighbours {
  const index = orderIndex.get(entry.id);
  if (index === undefined) return {};
  const previous = index > 0 ? readingOrder[index - 1] : undefined;
  const next = index < readingOrder.length - 1 ? readingOrder[index + 1] : undefined;
  return {
    ...(previous ? { previous } : {}),
    ...(next ? { next } : {}),
  };
}

/** Related entries, resolved and de-duplicated, never including the entry itself. */
export function relatedEntries(entry: DocEntry): DocEntry[] {
  const seen = new Set<string>([entry.id]);
  return (entry.related ?? []).flatMap((id) => {
    const related = byId.get(id);
    if (!related || seen.has(id)) return [];
    seen.add(id);
    return [related];
  });
}

/**
 * The entries in the same family that the caller is most likely to want next.
 *
 * Used when an entry declares no `related` list of its own, so a page never
 * shows an empty "related" section and never invents a relationship.
 */
export function familyPeers(entry: DocEntry, limit = 4): DocEntry[] {
  return entriesInFamily(entry.family)
    .filter((candidate) => candidate.id !== entry.id)
    .slice(0, limit);
}

export interface SearchResult {
  entry: DocEntry;
  family: DocFamily | undefined;
  /** 0 is an exact id or title match; higher is worse. */
  rank: number;
}

/**
 * Substring search, ranked by where the match lands.
 *
 * Deliberately not fuzzy: a documentation search that returns "Chart#Radar" for
 * `card` is worse than one that returns nothing, because the reader has to read
 * every result to find out it is wrong. Exact id, id prefix, title prefix,
 * then substring — and the summary is searched last, so a page that merely
 * *mentions* a word ranks below a page that *is* the word.
 */
export function searchEntries(query: string, limit = 12): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const results: SearchResult[] = [];
  for (const entry of docEntries) {
    const id = entry.id.toLowerCase();
    const title = entry.title.toLowerCase();
    let rank: number | undefined;
    if (id === normalized) rank = 0;
    else if (title === normalized) rank = 1;
    else if (id.startsWith(normalized)) rank = 2;
    else if (title.startsWith(normalized)) rank = 3;
    else if (title.includes(normalized)) rank = 4;
    else if (id.includes(normalized)) rank = 5;
    else if (entry.summary.toLowerCase().includes(normalized)) rank = 6;
    if (rank === undefined) continue;
    results.push({ entry, family: familyById.get(entry.family), rank });
  }
  return results
    .sort((a, b) => a.rank - b.rank || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit);
}

/** The API facts for a page: real exports, real signatures, real props. */
export function apiFor(entryId: string): readonly ApiSymbol[] {
  return generatedApi[entryId] ?? [];
}

/**
 * Redirects from a canonical id URL to the page that actually serves it.
 *
 * The Showcase documented some components before Phase 9 at a plural or
 * topical path (`/components/buttons`, `/components/inputs`). Those pages are
 * the canonical page for their component — they are not duplicated — so the
 * canonical *id* URL redirects to them rather than 404ing. Derived from the
 * registry, so a new exception cannot be forgotten.
 */
export interface DocRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

export function docRedirects(): DocRedirect[] {
  const seen = new Set<string>();
  const redirects: DocRedirect[] = [];
  const push = (source: string, destination: string) => {
    if (source === destination || seen.has(source)) return;
    seen.add(source);
    redirects.push({ source, destination, permanent: true });
  };
  for (const entry of docEntries) {
    if (entry.status === "reference") continue;
    /*
     * The id's own URL, which is what a reader types and what a search result
     * shows. When the page already lives somewhere else — because the Showcase
     * documented it before Phase 9 at a plural or topical path — that URL
     * redirects rather than 404s.
     */
    const idUrl =
      entry.group === "components"
        ? `/components/${entry.id}`
        : entry.group === "motion"
          ? `/motion/${entry.id}`
          : null;
    if (idUrl) push(idUrl, entry.route);
  }
  return redirects;
}

/** True when the registry documents this route (used by the layout chrome). */
export function documents(route: string): boolean {
  return byRoute.has(route);
}

export const registryStats = {
  entries: generatedEntries.length,
  families: generatedFamilies.length,
  byGroup: generatedGroups.map((group) => ({
    id: group.id,
    title: group.title,
    count: generatedEntries.filter((entry) => entry.group === group.id).length,
  })),
  byStatus: {
    curated: generatedEntries.filter((entry) => entry.status === "curated").length,
    generated: generatedEntries.filter((entry) => entry.status === "generated").length,
    reference: generatedEntries.filter((entry) => entry.status === "reference").length,
  },
  withProps: Object.values(generatedApi).filter((symbols) =>
    symbols.some((symbol) => (symbol.props?.length ?? 0) > 0),
  ).length,
} as const;
