/**
 * The id-list rule, with the cases that make it safe.
 *
 * The positive cases are the strings the probe was actually misfiling on
 * `/visuals/docs`. The negative cases are the point of the file: if any of them
 * started passing, the rule would be excusing prose, and the gate would go green
 * on a page that is still English.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRegisteredIdList } from "./id-lists.mjs";

const registered = new Set([
  "editorial",
  "scientific",
  "minimal",
  "playful",
  "cyber",
  "warm",
  "swiss",
  "blueprint",
  "pastel",
  "autumn-storybook",
  "asset.sticker.sun",
]);

describe("registered id lists", () => {
  it("accepts the joined id columns the docs page prints", () => {
    for (const segment of [
      "editorial, scientific, minimal, playful, cyber, warm, swiss, blueprint, pastel",
      "editorial, minimal, playful, cyber, warm, swiss, blueprint, pastel",
      "editorial, scientific, minimal, cyber, warm",
      "editorial, scientific, minimal, warm, cyber",
      "warm, minimal, editorial, scientific, playful, cyber",
    ]) {
      assert.equal(isRegisteredIdList(segment, registered), true, segment);
    }
  });

  it("accepts the other separators the library joins with", () => {
    assert.equal(isRegisteredIdList("editorial · minimal · playful", registered), true);
    assert.equal(isRegisteredIdList("editorial/cyber/swiss", registered), true);
  });

  it("accepts dotted capability ids", () => {
    assert.equal(isRegisteredIdList("asset.sticker.sun, editorial, minimal, cyber", registered), true);
  });

  it("refuses a sentence that merely contains ids", () => {
    for (const segment of [
      "Editorial writing is what a newspaper does, and minimal is its opposite.",
      "the editorial and scientific skins differ in tone rather than in geometry",
      "Every element is drawn in one of the editorial, scientific or minimal skins",
    ]) {
      assert.equal(isRegisteredIdList(segment, registered), false, segment);
    }
  });

  it("refuses a sentence whose every word is id-shaped but not registered", () => {
    assert.equal(isRegisteredIdList("editorial, minimal, unregistered", registered), false);
    assert.equal(isRegisteredIdList("alpha, beta, gamma", registered), false);
  });

  it("refuses two-token and single-token segments, where a list is a coincidence", () => {
    assert.equal(isRegisteredIdList("editorial, minimal", registered), false);
    assert.equal(isRegisteredIdList("editorial", registered), false);
  });

  it("refuses capitalised words, which ids never are", () => {
    assert.equal(isRegisteredIdList("Editorial, Minimal, Cyber", registered), false);
  });
});
