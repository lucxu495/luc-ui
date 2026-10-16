"use client";

/*
 * The client boundary a *chart* documentation page uses.
 *
 * It mirrors `boundary.tsx` exactly and differs in one thing: it resolves the
 * spec from `registry.charts.ts`. That is what keeps the engine out of every
 * other page's bundle while still letting a chart page mount the same shell,
 * the same controls and the same generated snippet.
 */

import { PlaygroundShell } from "./shell";
import { chartPlaygroundFor } from "./registry.charts";
import type { PlaygroundEntry } from "./boundary";

export interface ChartPlaygroundProps {
  entry: PlaygroundEntry;
  /** Extra guidance for the AI prompt, e.g. a chart's data contract. */
  contract?: string;
}

export function ChartPlayground({ entry, contract }: ChartPlaygroundProps) {
  const spec = chartPlaygroundFor(entry.playground);
  if (!spec) return null;
  return <PlaygroundShell spec={spec} entry={entry} {...(contract ? { contract } : {})} />;
}
