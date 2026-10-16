"use client";

/*
 * A Playground mounted on a hand-written page.
 *
 * The generated entry pages mount `Playground` themselves, because the page and
 * the entry arrive together. A *curated* page is a page a person wrote, so it
 * names the entry it documents instead: `<PlaygroundSection entryId="ai" />`.
 * The three outcomes are all deliberate —
 *
 *   - the entry declares a Playground adapter → the panel renders;
 *   - the entry exists but declares nothing → the section renders nothing, so
 *     the page does not claim a control panel it does not have;
 *   - the id is unknown → `null`, and `tests/unit/playground-wiring.test.ts`
 *     fails, so a typo cannot hide here.
 *
 * Keeping this in `components/docs/` rather than in `components/playground/`
 * keeps the engine Showcase-only: the playground directory knows nothing about
 * the documentation registry, and this thin adapter knows nothing about
 * controls.
 *
 * **Why a client component after Phase 9 hardening.** It used to be a server
 * component that resolved its entry from `registry.ts`, and that made it
 * impossible to mount on a page which is itself a client component — Turbopack
 * failed the build with `next/headers` in the browser graph. Four handwritten
 * pages are client components, so four documented Playgrounds (Input, Card,
 * ChatMessage, KineticHeadline) were declared in the registry and never
 * rendered. The entry now comes from the generated *projection*
 * (`lib/docs/playgrounds.ts`, six fields, a handful of rows) instead of the
 * server registry, so the same section works on either kind of page.
 */

import { Section } from "@luc/ui";
import { Playground } from "@/components/playground/boundary";
import { playgroundEntry } from "@/lib/docs/playground-entries";
import { useI18n } from "@/lib/i18n/provider";

export interface PlaygroundSectionProps {
  /** Documentation entry id, e.g. `button`. Also the adapter id. */
  entryId: string;
  /** Extra guidance for the AI prompt, e.g. a chart's data contract. */
  contract?: string;
}

export function PlaygroundSection({ entryId, contract }: PlaygroundSectionProps) {
  const { tcs } = useI18n();
  const entry = playgroundEntry(entryId);
  if (!entry) return null;
  return (
    <Section
      title={tcs("Playground")}
      description={tcs(
        "Change the props and read the result: the preview and the code below it are built from the same values, so what you see is what you copy.",
      )}
    >
      <Playground entry={entry} {...(contract ? { contract } : {})} />
    </Section>
  );
}
