import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as tradingView from "@luc/ui/tradingview";
import { chartDemoIds } from "@/lib/demo/registry.charts";
import { CHART_NOTES, INTEGRATION_NOTES } from "@/lib/docs/curation/notes";
import { docEntries } from "@/lib/docs/registry";

const appRoot = join(import.meta.dirname, "..", "..");

function pageSource(route: string): string {
  return readFileSync(join(appRoot, "app", `${route.replace(/^\//, "")}/page.tsx`), "utf8");
}

describe("chart documentation content contract", () => {
  const charts = docEntries.filter((entry) => entry.group === "charts");

  it("covers every canonical chart entry with structured, entry-specific guidance", () => {
    expect(charts.length).toBeGreaterThan(0);
    expect(Object.keys(CHART_NOTES).sort()).toEqual(charts.map((entry) => entry.id).sort());

    for (const entry of charts) {
      const note = CHART_NOTES[entry.id];
      expect(note, entry.id).toBeDefined();
      expect(note?.purpose.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.dataContract.trim().length, entry.id).toBeGreaterThan(30);
      expect(note?.configuration.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.avoid.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.dataContract, entry.id).toContain("`");
      expect(entry.route, entry.id).toBe(`/charts/${entry.id}`);
    }

    for (const field of ["purpose", "dataContract", "configuration", "avoid"] as const) {
      const values = Object.values(CHART_NOTES).map((note) => note[field]);
      expect(new Set(values).size, `${field} must not be boilerplate`).toBe(charts.length);
    }
  });

  it("has a real, non-empty demo and Usage call for every chart", () => {
    expect(chartDemoIds.sort()).toEqual(charts.map((entry) => entry.id).sort());
    for (const id of chartDemoIds) {
      const note = CHART_NOTES[id];
      expect(note, id).toBeDefined();
      expect(note?.dataContract, id).toContain("`");
    }
  });

  it("renders the chart content sections from the shared entry renderer", () => {
    const source = readFileSync(join(appRoot, "components/doc-pages/entry-page.tsx"), "utf8");
    expect(source).toContain("CHART_NOTES[entry.id]");
    expect(source).toContain('id="what-it-shows"');
    expect(source).toContain('id="data-contract"');
    expect(source).toContain('id="guidelines"');
  });
});

describe("TradingView integration documentation content contract", () => {
  const integrations = docEntries.filter((entry) => entry.group === "integrations");
  const publicExports = new Set(Object.keys(tradingView));

  it("covers every canonical integration entry and every authored usage import", () => {
    expect(integrations.length).toBeGreaterThan(0);
    expect(Object.keys(INTEGRATION_NOTES).sort()).toEqual(integrations.map((entry) => entry.id).sort());

    for (const entry of integrations) {
      const note = INTEGRATION_NOTES[entry.id];
      expect(note, entry.id).toBeDefined();
      expect(note?.usage.length, entry.id).toBeGreaterThan(0);
      expect(note?.configuration.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.lifecycle.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.limitations.trim().length, entry.id).toBeGreaterThan(20);
      expect(note?.guidance.use.length, entry.id).toBeGreaterThan(0);
      expect(note?.guidance.avoid.length, entry.id).toBeGreaterThan(0);

      for (const usage of note?.usage ?? []) {
        expect(usage.code, entry.id).toContain("<");
        expect(usage.code, entry.id).not.toContain("@/");
        expect(usage.code, entry.id).not.toContain("packages/ui");
        expect(usage.note.trim().length, entry.id).toBeGreaterThan(10);
        for (const name of usage.imports) {
          expect(publicExports.has(name), `${entry.id}: ${name}`).toBe(true);
          expect(usage.code, `${entry.id}: ${name}`).toContain(name);
        }
      }

      const used = new Set(note?.usage.flatMap((usage) => usage.imports) ?? []);
      for (const exported of entry.exports.filter((name) => /^TradingView/.test(name))) {
        /*
         * `tradingview-themes` documents a bridge constant and demonstrates the
         * themed widgets on other pages. Every other component export must have
         * its own copyable call on the page that owns it.
         */
        if (entry.id !== "tradingview-themes") expect(used.has(exported), `${entry.id}: ${exported}`).toBe(true);
      }
    }
  });

  it("mounts Usage/Guidelines and compiler API on every integration page", () => {
    for (const entry of integrations) {
      const server = pageSource(entry.route);
      expect(server, entry.id).toMatch(/EntryApiSection|Reference/);
      const client = readFileSync(join(appRoot, "app", `${entry.route.replace(/^\//, "")}/page-client.tsx`), "utf8");
      expect(client, entry.id).toContain(`<IntegrationNotes entryId="${entry.id}" />`);
      expect(client, entry.id).toContain("{api}");
    }
  });
});
