/*
 * TEMPORARY audit probe for the seven-category documentation remediation.
 * Prints the per-entry content matrix; deleted once the inventory is recorded.
 */
import { it } from "vitest";
import { docEntries, apiFor } from "@/lib/docs/registry";
import { componentDemoFor } from "@/lib/demo/registry";
import { chartDemoFor } from "@/lib/demo/registry.charts";
import { motionDemoFor } from "@/lib/demo/registry.motion";
import { ENTRY_NOTES, RELATED_ENTRIES } from "@/lib/docs/curation/notes";
import { playgroundEntry } from "@/lib/docs/playground-entries";

const FAMILIES: Record<string, string[]> = {
  "Data Display": ["data-display"],
  Overlays: ["overlays"],
  Media: ["media"],
  AI: ["ai"],
  Motion: ["motion-feedback", "motion-spatial", "motion-surfaces", "motion-typography"],
  Charts: [
    "chart-general",
    "chart-diagnostics",
    "chart-statistical",
    "chart-workflow",
    "chart-time",
    "chart-financial",
    "chart-multidimensional",
    "chart-geographic",
    "chart-scientific",
  ],
  Integrations: ["tradingview"],
};

it("prints the seven-category matrix", () => {
  const rows: unknown[] = [];
  for (const [category, families] of Object.entries(FAMILIES)) {
    for (const entry of docEntries.filter((e) => families.includes(e.family))) {
      const demo =
        componentDemoFor(entry.id) ?? chartDemoFor(entry.id) ?? motionDemoFor(entry.id);
      const note = ENTRY_NOTES[entry.id];
      const api = apiFor(entry.id);
      rows.push({
        category,
        id: entry.id,
        family: entry.family,
        route: entry.route,
        status: entry.status,
        exports: api.length,
        props: api.reduce((n, s) => n + (s.props?.length ?? 0), 0),
        examples: demo ? 1 + (demo.examples?.length ?? 0) : 0,
        demoId: demo?.id ?? null,
        playground: Boolean(playgroundEntry(entry.id)),
        usage: Boolean(note?.usage),
        guidance: Boolean(note?.guidance),
        accessibility: Boolean(note?.accessibility),
        related: (RELATED_ENTRIES[entry.id] ?? []).length,
      });
    }
  }
  // Written to a file: the Showcase vitest config swallows console output.
  require("node:fs").writeFileSync("/tmp/lucshot/audit.json", JSON.stringify(rows, null, 1));
});
