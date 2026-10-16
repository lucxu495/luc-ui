/*
 * UX-002 — every entry summary says what the thing is *for*, in one short line.
 *
 * The lead sentence is the most-read copy on a detail page, and the failure mode
 * is quiet: a summary that opens with the component's own class name ("LineChart
 * draws line on the ECharts engine…") is grammatically fine, passes every link
 * and rendering check, and still tells the reader nothing they could act on.
 *
 * So this asserts the two rules the action item names, on the artefact readers
 * actually see — the generated registry, not the curation source — and on the
 * curation source too, so a new hand-written summary cannot slip past:
 *
 *   1. at most 25 words;
 *   2. it does not begin by naming its own class.
 */

import { describe, expect, it } from "vitest";
import { MODULE_SUMMARIES } from "@/lib/docs/curation/summaries";
import { docEntries } from "@/lib/docs/registry";
import { chartContractCopy } from "@/components/doc-pages/copy";

const WORDS = 25;

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** A summary that opens with an exported identifier, e.g. `LineChart draws …`. */
const opensWithOwnClass = (text: string) => /^[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\s/.test(text);

describe("the entry summary budget", () => {
  it("keeps every curated module summary to 25 words", () => {
    const over = Object.entries(MODULE_SUMMARIES)
      .filter(([, text]) => words(text) > WORDS)
      .map(([key, text]) => `${key} (${words(text)} words)`);
    expect(over).toEqual([]);
  });

  it("keeps every generated entry summary to 25 words", () => {
    const over = docEntries
      .filter((entry) => words(entry.summary) > WORDS)
      .map((entry) => `${entry.id} (${words(entry.summary)} words)`);
    expect(over).toEqual([]);
  });

  it("makes every generated entry summary start from the job, not the class name", () => {
    const offenders = docEntries
      .filter((entry) => opensWithOwnClass(entry.summary))
      .map((entry) => `${entry.id}: ${entry.summary.slice(0, 70)}…`);
    expect(offenders).toEqual([]);
  });

  it("names no statistic the library does not compute", () => {
    /*
     * The promise follows the copy.
     *
     * This used to require every chart *summary* to contain "prepares" /
     * "computes no", because the summary was where that contract was stated — in
     * the same sentence as the engine, under a title that already named the
     * chart. DOC-003 moved the contract to the page's Usage copy, which is where
     * a reader looks for how to feed a chart, and made the lead say what the
     * chart is for. So the assertion moves with it: the contract has to exist in
     * the Usage copy, and no chart summary may promise a computation.
     */
    const usage = chartContractCopy((source) => source);
    expect(usage.length).toBeGreaterThan(40);
    expect(/prepared by the caller|computes no statistic/i.test(usage)).toBe(true);

    const charts = docEntries.filter((entry) => entry.group === "charts");
    expect(charts.length).toBeGreaterThan(0);
    const wrong = charts
      .filter((entry) => /computes .*(the )?(mean|median|average|correlation|regression)/i.test(entry.summary))
      .map((entry) => entry.id);
    expect(wrong).toEqual([]);
  });

  it("gives the chart lead a purpose, not an engine", () => {
    /*
     * The sentence the audit quoted: "Draws line with the ECharts engine from the
     * values the caller prepares — the renderer computes no statistic of its
     * own." It is about the implementation, and it was printed on seventy-six
     * pages. A chart's lead names what the reader does with the chart; the engine
     * is stated once, in Usage, by `ENGINE_FRAGMENT`.
     */
    const charts = docEntries.filter((entry) => entry.group === "charts");
    const wrong = charts
      .filter((entry) => /ECharts|Lightweight Charts|engine/i.test(entry.summary))
      .map((entry) => `${entry.id}: ${entry.summary.slice(0, 60)}…`);
    expect(wrong).toEqual([]);
  });
});
