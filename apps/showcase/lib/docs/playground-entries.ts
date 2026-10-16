/*
 * The Playground projection, as an API.
 *
 * `registry.ts` is the server's view of the documentation: it carries the
 * compiler's API tables — hundreds of kilobytes — and importing it from a client
 * component is what made a Playground impossible on the four handwritten client
 * pages (`/components/inputs`, `/components/cards`, `/components/ai`,
 * `/motion/kinetic`).
 *
 * This is the *other* projection: only the entries that declare a Playground,
 * with only the fields the panel reads. It is generated from the same registry
 * (`generated/playgrounds.ts`), so it cannot disagree with it, and it is small
 * enough to be part of a page bundle.
 */

import { generatedPlaygrounds } from "./generated/playgrounds";
import type { PlaygroundRow } from "./api-types";

const byId = new Map(generatedPlaygrounds.map((row) => [row.id, row]));

export function playgroundEntry(id: string): PlaygroundRow | undefined {
  return byId.get(id);
}

/** The ids that can mount a control panel. `playground-wiring.test.ts` checks it. */
export const playgroundEntryIds: readonly string[] = [...byId.keys()].sort();
