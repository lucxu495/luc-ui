/*
 * Every Playground a page promises must exist.
 *
 * The link between a documentation page and a control panel is one string in
 * `lib/docs/curation/playgrounds.ts`, and a wrong or stale string is invisible
 * in the browser: `Playground` resolves nothing and renders `null`, so the page
 * simply has no panel and no page ever claims otherwise. That silence is the
 * reason this test exists — the promise is checked against the registry that
 * actually satisfies it, in both directions:
 *
 *   - a wired id must resolve to a registered adapter, and the adapter's own id
 *     must be the one the page looks up;
 *   - a registered adapter must be reachable from a page, so an adapter cannot
 *     be written and then forgotten.
 *
 * It also checks that the *planned* ids stay unwired until their adapter lands,
 * so "not written yet" cannot quietly become "wired to nothing".
 */

import { describe, expect, it } from "vitest";
import { docEntries } from "@/lib/docs/registry";
import { ENTRY_PLAYGROUNDS, PLANNED_PLAYGROUNDS } from "@/lib/docs/curation/playgrounds";
import { playgroundFor, playgroundIds } from "@/components/playground/registry";
import { chartPlaygroundFor, chartPlaygroundIds } from "@/components/playground/registry.charts";

const wired = docEntries.filter((entry) => entry.playground !== undefined);

describe("playground wiring", () => {
  /*
   * Two registries, because a chart adapter carries a rendering engine: a chart
   * entry is resolved by `ChartPlayground`, everything else by `Playground`.
   * Checking only the light registry would report both chart wirings as broken.
   */
  const specFor = (id: string | undefined) => playgroundFor(id) ?? chartPlaygroundFor(id);

  it("resolves every wired entry to a registered adapter", () => {
    for (const entry of wired) {
      const spec = specFor(entry.playground);
      expect(spec, `${entry.id} → ${entry.playground} is not registered`).toBeDefined();
      expect(spec?.id).toBe(entry.playground);
    }
  });

  it("never wires an entry that is not in the curation map", () => {
    for (const entry of wired) {
      expect(ENTRY_PLAYGROUNDS[entry.id], `${entry.id} has a playground but no curation row`).toBe(
        entry.playground,
      );
    }
    for (const [entryId, adapterId] of Object.entries(ENTRY_PLAYGROUNDS)) {
      const entry = docEntries.find((candidate) => candidate.id === entryId);
      expect(entry, `${entryId} is wired but is not a documented entry`).toBeDefined();
      expect(entry?.playground).toBe(adapterId);
    }
  });

  it("leaves no registered adapter unreachable", () => {
    for (const id of [...playgroundIds, ...chartPlaygroundIds]) {
      expect(wired.some((entry) => entry.playground === id), `${id} is not used by any page`).toBe(
        true,
      );
    }
  });

  it("keeps the planned ids unwired until their adapter exists", () => {
    for (const [entryId, adapterId] of Object.entries(PLANNED_PLAYGROUNDS)) {
      if (specFor(adapterId)) continue;
      expect(
        ENTRY_PLAYGROUNDS[entryId],
        `${entryId} is wired to ${adapterId}, which is not registered`,
      ).toBeUndefined();
    }
  });
});
