/*
 * The discovery catalog's standing contract.
 *
 * Phase 10A's riskiest claim is "everything a reader can reach is in one index, and
 * searching it finds the thing by its name in either language". That claim is worth
 * nothing unless it is checked, so this file checks the *shape* of the catalog —
 * ids, routes, codes, statuses — and then the behaviours a reader depends on: a
 * Chinese alias reaches the component it names, and a filter's declared count is
 * the count of what the filter returns.
 */

import { describe, expect, it } from "vitest";
import {
  decodeDiscoveryRow,
  discoveryEntries,
  discoveryStats,
  entriesInArtDirection,
  entriesInUseCase,
  entriesOfKind,
  featuredEntries,
  searchDiscovery,
  studyEntries,
} from "@/lib/discovery/catalog";
import { generatedDiscovery } from "@/lib/docs/generated/discovery";
import {
  ART_DIRECTIONS,
  ART_DIRECTION_CODES,
  DISCOVERY_KINDS,
  USE_CASE_CODES,
  USE_CASES,
} from "@/lib/discovery/taxonomy";
import { NAV_AREAS } from "@/lib/discovery/areas";
import { routeExists, showcaseRoutes } from "./support/app-routes";

const routes = showcaseRoutes();
const areaIds = new Set<string>(NAV_AREAS.map((area) => area.id));
const kindIds = new Set<string>(DISCOVERY_KINDS.map((kind) => kind.id));

describe("discovery catalog", () => {
  it("decodes every generated row without dropping a field", () => {
    const decoded = generatedDiscovery.map(decodeDiscoveryRow);
    expect(decoded).toHaveLength(generatedDiscovery.length);
    for (const entry of decoded) {
      expect(entry.id).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(areaIds.has(entry.area)).toBe(true);
      expect(kindIds.has(entry.kind)).toBe(true);
      expect(["public", "study"]).toContain(entry.status);
    }
  });

  it("has a unique id and a unique route per row", () => {
    const ids = discoveryEntries.map((entry) => entry.id);
    const paths = discoveryEntries.map((entry) => entry.route);
    expect(new Set(ids).size).toBe(ids.length);
    /* Two rows sharing a route would be the same document listed twice in one
     * result list, which is the duplicate the generator is meant to have removed. */
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("points every row at a page that exists", () => {
    const missing = discoveryEntries
      .filter((entry) => !routeExists(routes, entry.route))
      .map((entry) => `${entry.id} → ${entry.route}`);
    expect(missing).toEqual([]);
  });

  it("decodes use-case and art-direction codes into real ids", () => {
    const useCaseIds = new Set<string>(USE_CASES.map((entry) => entry.id));
    const directionIds = new Set<string>(ART_DIRECTIONS.map((entry) => entry.id));
    for (const entry of discoveryEntries) {
      for (const useCase of entry.useCases) expect(useCaseIds.has(useCase)).toBe(true);
      for (const direction of entry.artDirections) expect(directionIds.has(direction)).toBe(true);
    }
    /* The code tables are the contract between the generator and the decoder: a code
     * that does not resolve would silently become its own two-letter id. */
    for (const code of Object.keys(USE_CASE_CODES)) expect(code).toHaveLength(2);
    for (const code of Object.keys(ART_DIRECTION_CODES)) expect(code).toHaveLength(2);
  });

  it("counts exactly what each filter returns", () => {
    expect(discoveryStats.total).toBe(discoveryEntries.length);
    for (const kind of DISCOVERY_KINDS) {
      expect(entriesOfKind(kind.id).length).toBe(discoveryStats.byKind[kind.id] ?? 0);
    }
    for (const useCase of USE_CASES) {
      expect(entriesInUseCase(useCase.id).length).toBe(
        discoveryStats.useCaseCounts[useCase.id] ?? 0,
      );
    }
    for (const direction of ART_DIRECTIONS) {
      expect(entriesInArtDirection(direction.id).length).toBe(
        discoveryStats.artDirectionCounts[direction.id] ?? 0,
      );
    }
  });

  it("carries no design studies, because the Phase 10A ones were retired", () => {
    /* `status: "study"` still exists as a concept — a catalogue has to be able to
     * say "this is a demonstration, not an API" — but nothing claims it now that
     * the six art-direction pages are gone. The assertion is the *absence*, so the
     * concept cannot quietly be repopulated by an obsolete page. */
    expect(studyEntries).toEqual([]);
  });

  it("features a short list, not a catalogue", () => {
    expect(featuredEntries.length).toBeGreaterThanOrEqual(6);
    expect(featuredEntries.length).toBeLessThanOrEqual(10);
    expect(featuredEntries.every((entry) => entry.status === "public")).toBe(true);
  });

  it("finds a component by its name, its alias and its Chinese name", () => {
    const cases: readonly (readonly [query: string, expectedId: string])[] = [
      ["rating", "rating"],
      ["Rating", "rating"],
      ["评分", "rating"],
      ["sheet", "sheet"],
      ["抽屉", "sheet"],
      ["candlestick", "candlestick-chart"],
      ["k线", "candlestick-chart"],
      ["violin", "violin-chart"],
      ["小提琴图", "violin-chart"],
      ["linechart", "line-chart"],
      ["折线图", "line-chart"],
      ["datagrid", "data-table"],
      ["表格", "data-table"],
      ["kanban", "kanban-board"],
      ["看板", "kanban-board"],
    ];
    for (const [query, expectedId] of cases) {
      const hits = searchDiscovery(query, 5);
      expect(hits.length, `${query} returned nothing`).toBeGreaterThan(0);
      expect(hits[0]?.entry.id, `${query} ranked ${hits[0]?.entry.id ?? "nothing"}`).toBe(expectedId);
    }
  });

  it("finds a whole page as well as a component", () => {
    /* Studio and pattern pages are catalog entries too: a reader searching for
     * "chart studio" should not have to know it lives under /studios. */
    const studio = searchDiscovery("chart studio", 3)[0];
    expect(studio?.entry.route).toBe("/studios/charts");
    const pattern = searchDiscovery("research workspace", 3)[0];
    expect(pattern?.entry.route).toBe("/patterns/research-workspace");
  });

  it("keeps the art-direction axis as a filter, and offers no study pages with it", () => {
    /* The axis survives: every curated row carries art-direction codes and the
     * browse filter reads them. What must not survive is a *page* per direction —
     * that was the Phase 10A shape, retired in the legacy cleanup. */
    expect(ART_DIRECTIONS.length).toBeGreaterThanOrEqual(6);
    const dead = generatedDiscovery
      .map(decodeDiscoveryRow)
      .filter((entry) => entry.route.startsWith("/visuals/art-direction"))
      .map((entry) => entry.route);
    expect(dead).toEqual([]);
  });
});
