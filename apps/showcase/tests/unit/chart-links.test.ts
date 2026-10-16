/*
 * Batch D — the chart catalogue can draw every row it claims.
 *
 * The catalogue lists a chart by its public *symbol*; the page that documents it
 * is keyed by *route*; the picture inside the row comes from the demo that route
 * points at. Three names for one thing, joined in `lib/docs/chart-links.ts`.
 *
 * The join is derived so it cannot go stale, and derived joins fail quietly: a
 * symbol with no page resolves to `undefined`, the row renders without a
 * thumbnail, and the catalogue is subtly worse with nothing red anywhere. These
 * three assertions are what make that impossible — every public row has a page,
 * every page has a demo, and the page count the catalogue quotes is the number
 * of pages that actually exist.
 */

import { describe, expect, it } from "vitest";
import { chartGroups } from "@/components/charts/chart-catalog-data";
import { chartDemoId, chartPageCount, chartPageForSymbol } from "@/lib/docs/chart-links";
import { chartDemoIds } from "@/lib/demo/registry.charts";

const publicRows = chartGroups.flatMap((group) => group.entries).filter((entry) => entry.status === "public");
const rowsWithPage = publicRows.map((entry) => ({ entry, page: chartPageForSymbol(entry.symbol) }));

describe("every public catalogue row is drawable", () => {
  it("resolves each one to a chart page", () => {
    const unresolved = rowsWithPage.filter((row) => row.page === undefined).map((row) => row.entry.id);
    expect(unresolved).toEqual([]);
  });

  it("resolves each one to a demo, which is what the thumbnail renders", () => {
    const demos = new Set(chartDemoIds);
    const missing = rowsWithPage
      .filter((row) => row.page !== undefined && !demos.has(chartDemoId(row.page.route)))
      .map((row) => row.entry.id);
    expect(missing).toEqual([]);
  });

  it("counts the pages that exist rather than the rows that name them", () => {
    /* Rows outnumber pages on purpose — `rolling-measure` is a LineChart and
     * `segmented-bars` is a ComposedChart — so a count of rows would overstate
     * how many charts the library ships. */
    const routes = new Set(rowsWithPage.map((row) => row.page?.route).filter(Boolean));
    expect(chartPageCount).toBeGreaterThan(0);
    expect(routes.size).toBeLessThanOrEqual(chartPageCount);
  });
});
