/*
 * The Block registry's contract.
 *
 * A Block is documentation that claims to use a specific set of public
 * exports. That claim is checkable against the package catalogue, so it is
 * checked: a renamed or removed export fails here rather than leaving a page
 * that describes a composition nobody can build.
 */

import { describe, expect, it } from "vitest";
import catalog from "../../../../docs/component-catalog.json";
import { BLOCKS, BLOCK_CATEGORIES, blockById, blocksInCategory } from "@/lib/blocks";

const published = new Set(
  Object.values(catalog.entries).flatMap(
    (entry) =>
      ((entry as { exports?: { name: string }[] }).exports ?? []).map((item) => item.name),
  ),
);

describe("blocks", () => {
  it("has a unique id and a real category per block", () => {
    const ids = BLOCKS.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
    const categories = new Set(BLOCK_CATEGORIES.map((category) => category.id));
    for (const block of BLOCKS) {
      expect(categories.has(block.category), `${block.id} → ${block.category}`).toBe(true);
      expect(blockById(block.id)).toBe(block);
    }
  });

  it("covers every category with at least one block", () => {
    for (const category of BLOCK_CATEGORIES) {
      expect(blocksInCategory(category.id).length, category.id).toBeGreaterThan(0);
    }
  });

  it("only names exports the package really publishes", () => {
    const unknown: string[] = [];
    for (const block of BLOCKS) {
      expect(block.uses.length, `${block.id} claims no exports`).toBeGreaterThan(0);
      for (const symbol of block.uses) {
        if (!published.has(symbol)) unknown.push(`${block.id}: ${symbol}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("states what a reader has to supply", () => {
    for (const block of BLOCKS) {
      expect(block.needs.length, block.id).toBeGreaterThan(20);
      expect(block.summary.length, block.id).toBeGreaterThan(20);
    }
  });

  it("renders every block", () => {
    for (const block of BLOCKS) {
      expect(() => block.render(), block.id).not.toThrow();
    }
  });
});
