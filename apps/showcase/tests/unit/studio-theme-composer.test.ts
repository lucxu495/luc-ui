/*
 * The Theme Studio and Template Composer contracts.
 *
 * Both are small amounts of logic with a heavy claim ("this is the whole
 * configuration", "this is the arrangement you see"), so both are pinned here:
 * the theme round-trips into the attribute string a consumer writes, and the
 * composer's ordering operations do exactly one thing each.
 */

import { describe, expect, it } from "vitest";
import { ALL_BLOCK_SECTIONS, BLOCKS } from "@/lib/blocks";
import {
  ARCHETYPES,
  ARCHETYPE_BLOCKS,
  addableBlocks,
  composerOutline,
  defaultArrangement,
  moveBlock,
  removeBlock,
} from "@/lib/studios/composer";
import { DEFAULT_THEME, themeAttributeString, themeAttributes } from "@/lib/studios/theme";

describe("theme studio", () => {
  it("serializes exactly the attributes the preview applies", () => {
    const attributes = themeAttributes(DEFAULT_THEME);
    const line = themeAttributeString(DEFAULT_THEME);
    for (const [name, value] of Object.entries(attributes)) {
      expect(line).toContain(`${name}="${value}"`);
    }
  });

  it("round-trips: every attribute in the line is a token the library ships", () => {
    const line = themeAttributeString({
      mode: "light",
      palette: "violet",
      typeface: "editorial",
      personality: "dense",
      space: "flat",
    });
    expect(line).toBe(
      `<html data-theme="light" data-palette="violet" data-typeface="editorial" data-personality="dense" data-space="flat">`,
    );
  });

  it("offers no value the registry does not contain", () => {
    expect(themeAttributes(DEFAULT_THEME)["data-palette"]).toBe("cyan");
    expect(themeAttributeString(DEFAULT_THEME)).toContain('data-space="layered"');
  });
});

describe("template composer", () => {
  it("starts every archetype from Blocks that exist", () => {
    for (const archetype of ARCHETYPES) {
      const order = defaultArrangement(archetype);
      expect(order.length).toBeGreaterThan(0);
      for (const id of order) {
        /*
         * The arrangement is resolved by `blockById`, so the domain of "exists" is
         * every renderable section — the gallery's compositions plus the
         * single-component sections the composer arranges (a profile hero, a
         * career timeline, …). Asserting against the gallery list alone would
         * demand that the composer stop offering the personal sections, which is
         * the opposite of what the composer is for.
         */
        expect(ALL_BLOCK_SECTIONS.some((block) => block.id === id), `${archetype}: ${id}`).toBe(true);
      }
    }
  });

  it("drops an unknown Block from a declared arrangement instead of rendering nothing", () => {
    const declared = ARCHETYPE_BLOCKS.marketing;
    expect(declared.length).toBeGreaterThan(0);
    expect(defaultArrangement("marketing").every((id) => ALL_BLOCK_SECTIONS.some((b) => b.id === id))).toBe(true);
  });

  it("moves one Block one place and stops at the ends", () => {
    const order = ["a", "b", "c"];
    expect(moveBlock(order, "c", -1)).toEqual(["a", "c", "b"]);
    expect(moveBlock(order, "a", -1)).toEqual(order);
    expect(moveBlock(order, "c", 1)).toEqual(order);
    expect(moveBlock(order, "missing", 1)).toEqual(order);
  });

  it("removes by id and never mutates the input", () => {
    const order = ["a", "b", "c"];
    expect(removeBlock(order, "b")).toEqual(["a", "c"]);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("offers only Blocks that are not already on the page", () => {
    const order = defaultArrangement("marketing");
    const addable = addableBlocks(order).map((block) => block.id);
    for (const id of order) expect(addable).not.toContain(id);
    expect(addable.length).toBe(BLOCKS.length - order.length);
  });

  it("writes an outline that names the arrangement on screen, in order", () => {
    const order = ["hero-banner", "pricing-band"];
    const outline = composerOutline("marketing", order);
    const heroAt = outline.indexOf('block: "hero-banner"');
    const pricingAt = outline.indexOf('block: "pricing-band"');
    expect(heroAt).toBeGreaterThan(-1);
    expect(pricingAt).toBeGreaterThan(heroAt);
    expect(outline).toContain("as const");
  });

  it("is deterministic: the same arrangement serializes identically twice", () => {
    const order = defaultArrangement("product");
    expect(composerOutline("product", order)).toBe(composerOutline("product", order));
  });
});
