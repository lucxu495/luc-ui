/*
 * The Playground registry, in two halves.
 *
 * A `PlaygroundSpec` carries functions — `render` and `serialize` — so it
 * cannot cross the server/client boundary as a prop. The client component
 * therefore resolves the spec from an id, which means *every* adapter it can
 * resolve is in that page's bundle. That is the reason this file exists in two
 * parts:
 *
 *   registry.ts         light adapters: primitives, composites, motion, AI.
 *   registry.charts.ts  chart adapters, which pull a rendering engine with them.
 *
 * A chart page imports the chart entry point; every other page imports this
 * one. A Button documentation page therefore never loads ECharts because a
 * RadarChart page exists in the same application.
 */

import { chatMessagePlayground } from "./adapters/ai-message";
import { kineticHeadlinePlayground } from "./adapters/kinetic-headline";
import type { PlaygroundSpec } from "./types";

/** Adapters whose dependencies are safe to load on any documentation page. */
const registry: readonly PlaygroundSpec[] = [
  kineticHeadlinePlayground,
  chatMessagePlayground,
];

export const playgroundSpecs: ReadonlyMap<string, PlaygroundSpec> = new Map(
  registry.map((spec) => [spec.id, spec]),
);

export function playgroundFor(id: string | undefined): PlaygroundSpec | undefined {
  return id ? playgroundSpecs.get(id) : undefined;
}

/** Honest coverage numbers, used by the docs index and by the audit report. */
export const playgroundIds: readonly string[] = [...playgroundSpecs.keys()].sort();
