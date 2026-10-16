/**
 * The API-delivery probe has to be able to fail.
 *
 * A clean result from a checker that cannot detect a violation is worse than no
 * checker: it certifies the thing it does not measure. So the rule is pinned
 * here against fixtures, without a build, and the last case is the negative
 * regression — a chunk that *does* carry the payload must be reported.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sampleWindows, windowsIn } from "./api-delivery.mjs";

/** A stand-in for the generated file: long, varied, and full of real letters. */
const SOURCE = `export const generatedApi = {${Array.from(
  { length: 400 },
  (_, index) =>
    `"entry-${index}": [{ name: "Symbol${index}", kind: "value", signature: "import(\\"react\\").FC<Props${index}>", props: [{ name: "prop${index}", optional: true, type: "string | undefined", description: "The ${index}th documented prop of this component." }] }],`,
).join("\n")}} as const;`;

describe("api delivery", () => {
  it("samples deterministic, payload-sized windows from the middle of the file", () => {
    const windows = sampleWindows(SOURCE, { count: 16, size: 64 });
    assert.ok(windows.length >= 8, `expected several windows, got ${windows.length}`);
    for (const window of windows) {
      assert.equal(window.length, 64);
      assert.match(window, /[A-Za-z]{6}/);
    }
    /* Deterministic: the same source must produce the same sample, or a failure
     * cannot be reproduced by hand. */
    assert.deepEqual(sampleWindows(SOURCE, { count: 16, size: 64 }), windows);
  });

  it("does not report a chunk that shares nothing with the payload", () => {
    const windows = sampleWindows(SOURCE, { count: 16, size: 64 });
    const unrelated = "function Button(){return React.createElement('button',null,'Save')}";
    assert.deepEqual(windowsIn(unrelated, windows), []);
  });

  it("reports a chunk that carries even one window of the payload", () => {
    const windows = sampleWindows(SOURCE, { count: 16, size: 64 });
    /* The negative regression: a client chunk that swallowed the API tables must
     * be caught. Nobody writes a whole 650 KB bundle by hand, so this is what a
     * leaked import actually looks like — one window is enough to fail. */
    const leaked = `self.webpackChunk=[...];${windows[3]}/* rest of a page bundle */`;
    const hits = windowsIn(leaked, windows);
    assert.equal(hits.length, 1);
    assert.equal(hits[0], windows[3]);
  });

  it("declines to sample a file too short to carry a sample", () => {
    assert.throws(() => sampleWindows("export const x = 1;", { count: 48, size: 64 }));
  });
});
