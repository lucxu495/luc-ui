/*
 * Indexing demos, once, for the three surfaces that need it.
 *
 * The registries are split by group (`registry.ts`, `registry.charts.ts`,
 * `registry.motion.ts`) so that a chart page does not load the component
 * demos and a component page never loads a chart engine. This module holds the
 * one piece of behaviour they share.
 */

import type { DemoSpec } from "./types";

export type { DemoSpec, DemoLayout } from "./types";
export { composition, demo, jsxElement, literal } from "./jsx";

/**
 * Index by entry id.
 *
 * A duplicate id is a bug that would otherwise be silent — the later demo
 * simply wins and the earlier one disappears — so it throws at module load,
 * where a test and a build both see it.
 */
export function indexDemos(specs: readonly DemoSpec[]): ReadonlyMap<string, DemoSpec> {
  const index = new Map<string, DemoSpec>();
  for (const spec of specs) {
    if (index.has(spec.id)) {
      throw new Error(
        `demo: two demos claim the id "${spec.id}". One page, one demo — remove or rename the duplicate.`,
      );
    }
    index.set(spec.id, spec);
  }
  return index;
}
