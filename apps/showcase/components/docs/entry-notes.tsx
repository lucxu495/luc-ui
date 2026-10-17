"use client";

/*
 * Usage and Guidelines for a hand-written page.
 *
 * The registry-rendered pages (`doc-pages/entry-page.tsx`) read `ENTRY_NOTES`
 * themselves. The hand-written pages were each built before that contract
 * existed, so a curated entry could have a *complete* note — usage, do/don't,
 * accessibility — and still show none of it, because nothing mounted it. That is
 * how the six finished categories ended up with Guidelines and the rest did not:
 * not a missing note, a missing import.
 *
 * So this is the one mount point, and it renders only what exists: an entry with
 * no `usage` gets no Usage heading, and an entry with no guidance and no
 * accessibility sentence gets no Guidelines heading (the no-empty-headings rule).
 * Examples stay the page's own business — they are written where the specimen is.
 */

import { Heading, Stack, Text } from "@luc/ui";
import { CodeBlock } from "./code-block";
import { ImportLine } from "./family-imports";
import { GuidanceCards } from "./guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { docEntries } from "@/lib/docs/registry";
import { importLine } from "@/lib/docs/install";
import { useOptionalI18n } from "@/lib/i18n/provider";

/** The export that names the page, the same rule the generated pages use. */
function primaryExport(entry: { title: string; exports: readonly string[] }): string {
  return (
    entry.exports.find((name) => name === entry.title) ??
    entry.exports.find((name) => /^[A-Z]/.test(name)) ??
    entry.exports[0] ??
    entry.title
  );
}

export function EntryNotes({ entryIds }: { entryIds: readonly string[] }) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  /*
   * Two entries can share one page (the two menus). Only the first *noted* entry
   * carries the section headings and the anchor ids; a second one contributes
   * body only, so the page never renders "Usage" twice or two "#usage" targets.
   */
  const firstNoted = entryIds.find((id) => ENTRY_NOTES[id]);

  return (
    <>
      {entryIds.map((entryId) => {
        const note = ENTRY_NOTES[entryId];
        const entry = docEntries.find((candidate) => candidate.id === entryId);
        if (!note || !entry) return null;
        const usage = note.usage;
        const guidance = note.guidance;
        const accessibility = note.accessibility?.detail;
        const hasGuidelines = Boolean(guidance?.use?.length || guidance?.avoid?.length || accessibility);
        const first = entryId === firstNoted;
        return (
          <div key={entryId} className="flex flex-col gap-9">
            {usage ? (
              <section className="flex flex-col gap-3">
                {first ? (
                  <Heading size="title" as="h2" id="usage">
                    {tcs("Usage")}
                  </Heading>
                ) : null}
                <ImportLine line={importLine(entry.importPath, usage.imports ?? [primaryExport(entry)])} />
                <CodeBlock code={usage.code} label={tcs("Copy the minimal call")} />
                {usage.note ? (
                  <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
                    {tcs(usage.note)}
                  </Text>
                ) : null}
              </section>
            ) : null}
            {hasGuidelines ? (
              <section className="flex flex-col gap-4">
                {/*
                 * A page can document two entries (the two menus). The first one
                 * owns the canonical "Guidelines" heading and its `#guidelines`
                 * anchor; the second one is named after its component, because
                 * two headings reading "Guidelines" is the duplicate-section
                 * defect the V2 standard removes.
                 */}
                <Heading size="title" as={first ? "h2" : "h3"} {...(first ? { id: "guidelines" } : {})}>
                  {first ? tcs("Guidelines") : entry.title}
                </Heading>
                {guidance?.use?.length || guidance?.avoid?.length ? (
                  <GuidanceCards use={guidance?.use ?? []} avoid={guidance?.avoid ?? []} tcs={tcs} />
                ) : null}
                {accessibility ? (
                  <Stack gap="xs">
                    <Heading size="title" as="h3">
                      {tcs("Accessibility")}
                    </Heading>
                    <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                      {tcs(accessibility)}
                    </Text>
                  </Stack>
                ) : null}
              </section>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
