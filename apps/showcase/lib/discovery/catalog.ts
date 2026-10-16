/*
 * The discovery catalog, decoded.
 *
 * `lib/docs/generated/discovery.ts` is the compact projection the generator
 * writes (short keys, joined lists). This module is the only place that knows
 * that encoding, so every consumer — the header search, the Explore filters, the
 * galleries, the Visuals categories — works with `DiscoveryEntry` objects and
 * one set of accessors.
 *
 * Client-safe by construction: it imports the *generated projection* and the
 * taxonomy tables, never `lib/docs/registry.ts` (700 KB of compiler output) and
 * never a component. A page that needs a live demo imports the demo itself.
 */

import { generatedDiscovery } from "../docs/generated/discovery";
import { areaById } from "./areas";
import {
  ART_DIRECTION_CODES,
  USE_CASE_CODES,
  kindById,
  useCaseById,
} from "./taxonomy";
import type { DiscoveryEntry, DiscoveryKind, DiscoveryRow } from "./types";

/** Decode one generated row. Exported for the unit test that reads the raw file. */
export function decodeDiscoveryRow(row: DiscoveryRow): DiscoveryEntry {
  return {
    id: row.i,
    title: row.t,
    route: row.r,
    kind: row.k,
    area: row.a,
    ...(row.f ? { family: row.f } : {}),
    status: row.s,
    aliases: row.x ? row.x.split("|") : [],
    tags: row.g ? row.g.split("|") : [],
    useCases: (row.u ? row.u.split(",") : []).map((code) => USE_CASE_CODES[code] ?? code),
    artDirections: (row.d ? row.d.split(",") : []).map((code) => ART_DIRECTION_CODES[code] ?? code),
    ...(row.p ? { featured: true } : {}),
  };
}

/**
 * Every catalog row, decoded once.
 *
 * Sorted by title within the generated id order so the browse page's unfiltered
 * view reads alphabetically rather than by an accident of how the registry
 * happened to be assembled. Identifiers (`LineChart`) sort as a developer would
 * type them, which is what a reader is scanning for.
 */
export const discoveryEntries: readonly DiscoveryEntry[] = generatedDiscovery
  .map(decodeDiscoveryRow)
  .sort((a, b) => a.title.localeCompare(b.title, "en"));

const byKind = new Map<string, DiscoveryEntry[]>();
const byArea = new Map<string, DiscoveryEntry[]>();
const byUseCase = new Map<string, DiscoveryEntry[]>();
const byArtDirection = new Map<string, DiscoveryEntry[]>();
const byTag = new Map<string, DiscoveryEntry[]>();

function push(map: Map<string, DiscoveryEntry[]>, key: string, entry: DiscoveryEntry): void {
  const list = map.get(key);
  if (list) list.push(entry);
  else map.set(key, [entry]);
}

for (const entry of discoveryEntries) {
  push(byKind, entry.kind, entry);
  push(byArea, entry.area, entry);
  for (const useCase of entry.useCases) push(byUseCase, useCase, entry);
  for (const direction of entry.artDirections) push(byArtDirection, direction, entry);
  for (const tag of entry.tags) push(byTag, tag, entry);
}

export function entriesOfKind(kind: DiscoveryKind): readonly DiscoveryEntry[] {
  return byKind.get(kind) ?? [];
}

export function entriesInArea(area: string): readonly DiscoveryEntry[] {
  return byArea.get(area) ?? [];
}

export function entriesInUseCase(id: string): readonly DiscoveryEntry[] {
  return byUseCase.get(id) ?? [];
}

export function entriesInArtDirection(id: string): readonly DiscoveryEntry[] {
  return byArtDirection.get(id) ?? [];
}

export function entriesWithTag(tag: string): readonly DiscoveryEntry[] {
  return byTag.get(tag) ?? [];
}

export const featuredEntries: readonly DiscoveryEntry[] = discoveryEntries.filter(
  (entry) => entry.featured,
);

/** The rows that are not installed code — studies, in this phase. */
export const studyEntries: readonly DiscoveryEntry[] = discoveryEntries.filter(
  (entry) => entry.status === "study",
);

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Why a row matched. The UI prints it, so a result explains itself instead of
 * looking like a false positive.
 */
export type MatchReason = "id" | "name" | "alias" | "tag" | "use-case";

export interface DiscoveryHit {
  entry: DiscoveryEntry;
  /** 0 is best. Lower ranks are exact matches; higher ones are looser. */
  rank: number;
  matchedOn: MatchReason;
}

/*
 * Ranking, in the order a reader would agree with:
 *
 *   0  the id or the title is exactly what was typed
 *   1  the id or the title starts with it
 *   2  an alias is exactly what was typed — this is the Chinese path, so 折线图
 *      lands on LineChart as directly as `linechart` does
 *   3  an alias starts with it
 *   4  the title contains it
 *   5  the id contains it
 *   6  a tag matches, or contains it
 *   7  a use case's label matches
 *
 * Deliberately not fuzzy. A documentation search that answers `card` with
 * `RadarChart` costs the reader more than an empty list, because every hit has to
 * be read to find out it is wrong.
 */
export function searchDiscovery(query: string, limit = 12): DiscoveryHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: DiscoveryHit[] = [];
  for (const entry of discoveryEntries) {
    const id = entry.id.toLowerCase();
    const title = entry.title.toLowerCase();
    const aliases = entry.aliases.map((alias) => alias.toLowerCase());
    let rank: number | undefined;
    let matchedOn: MatchReason = "name";
    if (id === needle || title === needle) {
      rank = 0;
      matchedOn = id === needle ? "id" : "name";
    } else if (id.startsWith(needle) || title.startsWith(needle)) {
      rank = 1;
      matchedOn = id.startsWith(needle) ? "id" : "name";
    } else if (aliases.includes(needle)) {
      rank = 2;
      matchedOn = "alias";
    } else if (aliases.some((alias) => alias.startsWith(needle))) {
      rank = 3;
      matchedOn = "alias";
    } else if (title.includes(needle)) {
      rank = 4;
    } else if (id.includes(needle)) {
      rank = 5;
    } else if (entry.tags.some((tag) => tag === needle || tag.includes(needle))) {
      rank = 6;
      matchedOn = "tag";
    } else if (
      entry.useCases.some((useCase) => {
        const label = useCaseById.get(useCase)?.label.toLowerCase();
        return label ? label.includes(needle) : false;
      })
    ) {
      rank = 7;
      matchedOn = "use-case";
    }
    if (rank === undefined) continue;
    hits.push({ entry, rank, matchedOn });
  }
  return hits
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        /* Within a rank, a component beats a study and both beat an essay: the
         * reader typing a name is almost always looking for the thing itself. */
        kindWeight(a.entry) - kindWeight(b.entry) ||
        a.entry.title.localeCompare(b.entry.title, "en"),
    )
    .slice(0, limit);
}

/**
 * Tie-break weight per kind.
 *
 * Not a quality judgement — a statement about what a search box is for. Someone
 * typing "table" wants `DataTable` before the guide that explains it.
 */
function kindWeight(entry: DiscoveryEntry): number {
  if (entry.status === "study") return 3;
  switch (entry.kind) {
    case "component":
    case "chart":
    case "motion":
      return 0;
    case "block":
    case "experience":
    case "studio":
      return 1;
    default:
      return 2;
  }
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

export const discoveryStats = {
  total: discoveryEntries.length,
  studies: studyEntries.length,
  featured: featuredEntries.length,
  byKind: Object.fromEntries(
    [...byKind.entries()].map(([kind, list]) => [kind, list.length]),
  ) as Record<string, number>,
  byArea: Object.fromEntries(
    [...byArea.entries()].map(([area, list]) => [area, list.length]),
  ) as Record<string, number>,
  /*
   * The same rows, counted under the family an area belongs to.
   *
   * `byArea` answers "how many rows are stamped with this area id", which is the
   * question the router asks. A reader comparing surfaces on the front door asks a
   * different one — "how much is in Build" — and IA-007 split Build into four
   * areas, so the exact count for `/blocks` is now 1 and the entry would read
   * "1 in this area" for a gallery of twelve sections.
   *
   * The rollup resolves the chain (`patterns` → `build`), so a future third level
   * does not silently start reporting zero.
   */
  byAreaFamily: (() => {
    const rootOf = (id: string): string => {
      let current = id;
      for (let hop = 0; hop < 4; hop += 1) {
        const parent = areaById.get(current)?.parent;
        if (!parent) return current;
        current = parent;
      }
      return current;
    };
    const counts: Record<string, number> = {};
    for (const [area, list] of byArea.entries()) {
      const root = rootOf(area);
      counts[root] = (counts[root] ?? 0) + list.length;
    }
    return counts;
  })(),
  useCaseCounts: Object.fromEntries(
    [...byUseCase.entries()].map(([id, list]) => [id, list.length]),
  ) as Record<string, number>,
  artDirectionCounts: Object.fromEntries(
    [...byArtDirection.entries()].map(([id, list]) => [id, list.length]),
  ) as Record<string, number>,
  /** Tags that describe at least three rows — the ones worth offering as filters. */
  commonTags: [...byTag.entries()]
    .filter(([, list]) => list.length >= 3)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([tag, list]) => ({ tag, count: list.length })),
} as const;

/** The kind's display label, translated by the caller (`tcs`). */
export function kindLabel(kind: string): string {
  return kindById.get(kind)?.label ?? kind;
}
