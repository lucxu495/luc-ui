/*
 * Template Composer logic — pure, so ordering and serialization are testable
 * without a browser.
 *
 * The Composer arranges real Blocks; it does not invent sections and it never
 * executes pasted code. That makes it a small amount of logic with a lot of
 * *contract*, which is exactly what belongs in a module a test can call:
 *
 *   - an archetype decides which Blocks a page starts from;
 *   - moving a Block is a list operation, not a drag library;
 *   - the outline that gets copied is generated from the arrangement on screen,
 *     so the code and the preview cannot drift apart.
 */

import { BLOCKS, blockById } from "../blocks";

export const ARCHETYPES = ["marketing", "product", "personal"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

/** The Blocks a page of this kind starts from, in reading order. */
export const ARCHETYPE_BLOCKS: Record<Archetype, readonly string[]> = {
  marketing: ["hero-banner", "feature-grid", "pricing-band"],
  product: ["console-header", "stats-strip", "metric-band", "activity-feed"],
  personal: ["personal-hero", "career-timeline", "publication-list", "reading-shelf", "now"],
};

/** A Block whose id is not in the catalogue would render nothing, so it is dropped here. */
export function defaultArrangement(archetype: Archetype): string[] {
  return ARCHETYPE_BLOCKS[archetype].filter((id) => blockById(id) !== undefined);
}

export function moveBlock(order: readonly string[], id: string, delta: -1 | 1): string[] {
  const next = [...order];
  const from = next.indexOf(id);
  if (from < 0) return next;
  const to = from + delta;
  if (to < 0 || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...order];
  next.splice(to, 0, moved);
  return next;
}

export function removeBlock(order: readonly string[], id: string): string[] {
  return order.filter((entry) => entry !== id);
}

/**
 * Every Block the page could still take.
 *
 * The archetype decides where a page *starts*, not what it may contain: a
 * product page may open with a marketing hero, and pretending otherwise would
 * be the composer telling a reader how to build their page.
 */
export function addableBlocks(order: readonly string[]): readonly { id: string; title: string }[] {
  return BLOCKS.filter((block) => !order.includes(block.id)).map((block) => ({
    id: block.id,
    title: block.title,
  }));
}

/**
 * The outline a reader copies: real imports, the arrangement, and nothing that
 * was not decided on screen.
 */
export function composerOutline(archetype: Archetype, order: readonly string[]): string {
  return [
    `/* A ${archetype} page plan: ${order.length} Block(s) in reading order.`,
    `   Each Block is a section you copy from the Blocks gallery — the library`,
    `   ships components, not pages, so this is the arrangement, not a component. */`,
    ``,
    `export const sections = [`,
    ...order.map((id) => {
      const block = blockById(id);
      const uses = (block?.uses ?? []).slice(0, 4).join(", ");
      return `  { block: "${id}", title: "${block?.title ?? id}", uses: "${uses}" },`;
    }),
    `] as const;`,
    ``,
    `/* Render them in order, supplying each Block's own data. */`,
  ].join("\n");
}

/** Everything the gallery knows, for the honest coverage line on the page. */
export const BLOCK_COUNT = BLOCKS.length;
