"use client";

/*
 * The client boundary a documentation page uses.
 *
 * A server page cannot pass a spec (it contains functions) or a `ReactNode`
 * preview across the boundary, so the page passes the two facts that *are*
 * serializable — the registry id and the entry — and this component resolves the
 * rest on the client. That also means the adapter's dependencies are loaded by
 * the page that needs them and not by any other page.
 *
 * The chart panel is a separate module on purpose: see `registry.ts`.
 */

import { PlaygroundShell } from "./shell";
import { playgroundFor } from "./registry";

/**
 * What the panel needs to know about the entry it is documenting.
 *
 * Deliberately narrower than `DocEntry`: the panel reads six fields, and a
 * generated page passes the full entry while a handwritten *client* page passes
 * the small projection from `lib/docs/playgrounds.ts`. Both are assignable, so
 * there is one component rather than two.
 */
export interface PlaygroundEntry {
  id: string;
  title: string;
  route: string;
  importPath: string;
  summary: string;
  exports: readonly string[];
  /** The adapter id, e.g. `button`. Without it there is no panel. */
  playground?: string;
}

export interface PlaygroundProps {
  entry: PlaygroundEntry;
  /** Extra guidance for the AI prompt, e.g. a data contract. */
  contract?: string;
}

export function Playground({ entry, contract }: PlaygroundProps) {
  const spec = playgroundFor(entry.playground);
  if (!spec) return null;
  return <PlaygroundShell spec={spec} entry={entry} {...(contract ? { contract } : {})} />;
}
