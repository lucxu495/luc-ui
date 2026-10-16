/**
 * The chrome-label rule, pinned.
 *
 * The case that matters is the negative regression the brief names: a required
 * translation, replaced by its English source in a controlled fixture, must make
 * the gate fail. Without this, the probe can be green because it is looking at
 * nothing — which is exactly how `/zh/blocks` showed "Marketing" while
 * `verify:i18n` reported 100%.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED,
  candidates,
  chromeProblems,
  isCandidate,
  isCandidateWith,
  knownIdentifiers,
  mergeBaseline,
  splitSpecimenLabels,
  unaccounted,
} from "./i18n-chrome.mjs";

describe("labels that are picture content", () => {
  /*
   * The Visuals plates declare `role="img"`: their interior is a composed
   * drawing whose words are the sample, not the interface. The rule that matters
   * is not "skip them" — it is "classify them, and lose none of them": a label
   * that could vanish between the two lists is how a gate turns green while the
   * product stays English.
   */
  const labels = [
    { label: "Marketing", picture: false },
    { label: "Product", picture: false },
    { label: "On the numbers", picture: true },
    { label: "Where we are", picture: true },
  ];

  it("gates a page label and counts a plate label, in the right lists", async () => {
    const identifiers = await knownIdentifiers();
    const { gated, specimen } = splitSpecimenLabels(labels, identifiers);
    assert.deepEqual(gated, ["Marketing", "Product"]);
    assert.deepEqual(specimen, ["On the numbers", "Where we are"]);
  });

  it("accounts for every candidate exactly once, so nothing is silently dropped", async () => {
    const identifiers = await knownIdentifiers();
    const { gated, specimen } = splitSpecimenLabels(labels, identifiers);
    const all = candidates(
      labels.map((entry) => entry.label),
      identifiers,
    );
    assert.deepEqual([...gated, ...specimen].sort(), [...all].sort());
    assert.equal(gated.length + specimen.length, all.length);
  });

  it("still gates a label that merely sits beside a picture", async () => {
    const identifiers = await knownIdentifiers();
    /* The flag is the whole decision: absence of it must never read as consent. */
    const { gated, specimen } = splitSpecimenLabels([{ label: "Open palette" }], identifiers);
    assert.deepEqual(gated, ["Open palette"]);
    assert.deepEqual(specimen, []);
  });

  it("keeps a control inside a picture gated — a drawing may hold words, not buttons", async () => {
    const identifiers = await knownIdentifiers();
    const { gated, specimen } = splitSpecimenLabels(
      [
        { label: "On the numbers", picture: true },
        { label: "Download the plate", picture: true, interactive: true },
      ],
      identifiers,
    );
    assert.deepEqual(gated, ["Download the plate"]);
    assert.deepEqual(specimen, ["On the numbers"]);
  });
});

describe("chrome labels", () => {
  it("treats a short label as a candidate — the class the sentence rule cannot see", () => {
    /* The real leak: two one-word category headings on /zh/blocks. */
    assert.equal(isCandidate("Marketing"), true);
    assert.equal(isCandidate("Product"), true);
    assert.equal(isCandidate("Open palette"), true);
    assert.equal(isCandidate("Update values"), true);
    assert.equal(isCandidate("Bare rows"), true);
  });

  it("leaves identifiers, proper nouns and data alone", async () => {
    const identifiers = await knownIdentifiers();
    /* A reader types these in either language. */
    assert.equal(isCandidateWith("ParallaxScene", identifiers), false);
    assert.equal(isCandidate("API"), false);
    assert.equal(isCandidateWith("DataTableSelectionCount", identifiers), false);
    assert.equal(isCandidateWith("StatCard", identifiers), false);
    assert.equal(isCandidateWith("Textarea", identifiers), false);
    assert.equal(isCandidate("@luc/ui/data-table"), false);
    for (const proper of ["LUC UI", "ECharts", "TradingView"]) {
      assert.equal(isCandidate(proper), false);
      assert.ok(ALLOWED.has(proper), `${proper} must be an explicit allowance`);
    }
    /* Data, not words: a formatter's output and a measured value. */
    assert.equal(isCandidate("Portfolio value£"), false);
    assert.equal(isCandidate("Sharpe1.24"), false);
    assert.equal(isCandidate("30D14.1"), false);
  });

  it("still reports a family heading, which is chrome rather than a name", async () => {
    const identifiers = await knownIdentifiers();
    /* The five `/zh/motion` headings that stayed English on the Chinese page.
     * A family heading is chrome and must be translated; only an *entry* title
     * is a name the product keeps as it is. */
    for (const family of ["Spatial", "Signature", "Pointer", "Feedback", "Entrance"]) {
      assert.equal(isCandidateWith(family, identifiers), true, family);
    }
    /* And a block category heading, the original report. */
    assert.equal(isCandidateWith("Marketing", identifiers), true);
    assert.equal(isCandidateWith("Product", identifiers), true);
  });

  it("leaves an already-Chinese label alone", () => {
    assert.equal(isCandidate("市场表现"), false);
    assert.equal(isCandidate("空间"), false);
  });

  it("fails a route whose label is not in the baseline", () => {
    /* The negative regression: `/zh/blocks` before the fix. */
    const byRoute = { "/blocks": ["Marketing", "Product"] };
    const problems = chromeProblems(byRoute, {});
    assert.equal(problems.length, 2);
    assert.match(problems[0], /^\/blocks: "Marketing" is English chrome/);
  });

  it("passes the same route once the label is translated away", () => {
    /* What the page looks like after the dictionary carries 营销: the probe
     * collects no candidate at all, so there is nothing to account for. */
    assert.deepEqual(chromeProblems({ "/blocks": candidates(["营销", "产品"]) }, {}), []);
  });

  it("passes a route whose residue was reviewed, and fails again when it grows", () => {
    const byRoute = { "/experience/portfolio": candidates(["Ada Rensselaer", "Portfolio overview"]) };
    const baseline = { "/experience/portfolio": { "Ada Rensselaer": "a fixture name" } };
    const problems = chromeProblems(byRoute, baseline);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /Portfolio overview/);
    /* And once reviewed, the pair is quiet. */
    const merged = mergeBaseline(byRoute, baseline);
    assert.deepEqual(chromeProblems(byRoute, merged), []);
    assert.equal(merged["/experience/portfolio"]["Ada Rensselaer"], "a fixture name");
  });

  it("reports a baseline entry that gained no reason", () => {
    /* `--update` writes empty reasons; a reviewer fills them in. An empty reason
     * is still an acceptance, so the label is not re-reported — the risk is
     * forgetting *why*, and the file is the place that shows it. */
    const merged = mergeBaseline({ "/x": ["Some label"] }, {});
    assert.deepEqual(unaccounted(["Some label"], merged["/x"]), []);
    assert.equal(merged["/x"]["Some label"], "");
  });
});
