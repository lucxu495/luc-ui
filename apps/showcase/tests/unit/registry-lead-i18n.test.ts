/*
 * A registry page's lead sentence is visible prose, so it must be translated.
 *
 * This is the regression test for independent-audit finding C-04. The defect was
 * not a missing translation — it was a *blind spot*: the page printed
 * `{entry.summary}`, a string that lives in generated data, so nothing in the
 * source named it and `verify:i18n` reported 100% while every Chinese page opened
 * with an English sentence.
 *
 * The test reads the same source of truth the coverage gate now reads, so a new
 * registry entry with an untranslated summary fails here — and the negative case
 * is inherent: delete a key from the dictionary and this test fails, which is
 * what makes "100%" mean something.
 */

import { describe, expect, it } from "vitest";
import { CHART_LEAD_BY_FAMILY, chartLeadTemplate, entryLead } from "@/lib/docs/lead";
import { dictionaries } from "@/lib/i18n/messages";
import { loadRegistryProse } from "../../scripts/chart-catalog-strings.mjs";

/**
 * Every key the Chinese dictionary holds — read from the module, not the file.
 *
 * The regex-over-source version could not see that a key had landed outside the
 * exported map, which is a translation that never reaches a page while the test
 * stays green. See `install-i18n.test.ts`, where that happened for real.
 */
const chineseKeys = (): Set<string> => new Set(Object.keys(dictionaries["zh-CN"].prose));

describe("registry leads are translatable", () => {
  it("has a Chinese sentence for every summary the registry renders", async () => {
    const [rows, zh] = await Promise.all([loadRegistryProse(), chineseKeys()]);
    expect(rows.length).toBeGreaterThan(200);
    const untranslated = [...new Set(rows.map((row: { summary: string }) => row.summary))].filter(
      (summary: string) => !zh.has(summary),
    );
    expect(untranslated, `untranslated registry summaries:\n${untranslated.join("\n")}`).toEqual([]);
  });

  it("has a Chinese sentence for every chart-family lead", async () => {
    const zh = chineseKeys();
    /*
     * DOC-003 replaced the one template with one sentence per chart family —
     * "compare series and read the change behind them" answers a line chart, and
     * not a box plot — so the test moves from "the template is translated" to
     * "every family's sentence is", which is the same promise at the new shape.
     */
    const families = Object.keys(CHART_LEAD_BY_FAMILY);
    expect(families.length).toBeGreaterThan(5);
    const untranslated = families.filter((family) => !zh.has(CHART_LEAD_BY_FAMILY[family]));
    expect(untranslated, `untranslated chart leads:\n${untranslated.join("\n")}`).toEqual([]);
  });

  it("resolves a chart's lead to its own family, with nothing left to fill in", () => {
    const tcs = (source: string) => `«${source}»`;
    const lead = entryLead({ summary: "unused", family: "chart-statistical", chartName: "Violin" }, tcs);
    expect(lead).toBe(`«${CHART_LEAD_BY_FAMILY["chart-statistical"]}»`);
    expect(lead).not.toContain("{");
    /* An unknown family still gets a sentence rather than an empty header. */
    expect(entryLead({ summary: "unused", family: "chart-unknown", chartName: "Mystery" }, tcs)).toBe(
      `«${chartLeadTemplate() }»`,
    );
  });

  it("falls back to the summary when an entry has no chart name", () => {
    const tcs = (source: string) => `«${source}»`;
    expect(entryLead({ summary: "A quiet surface." }, tcs)).toBe("«A quiet surface.»");
  });
});
