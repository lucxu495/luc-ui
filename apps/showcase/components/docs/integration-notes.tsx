"use client";

/*
 * The content contract for a hand-written provider page.
 *
 * The TradingView pages already have a gallery and live widgets. They lacked the
 * part a developer needs before copying one: the public import, a minimal call,
 * the provider settings that matter, and the lifecycle boundary that the wrapper
 * cannot hide. The structured notes live beside the registry prose so the same
 * copy is measured by the i18n gate.
 */

import { Heading, Stack, Text } from "@luc/ui";
import { CodeBlock } from "./code-block";
import { GuidanceCards } from "./guidance";
import { ImportLine } from "./family-imports";
import { INTEGRATION_NOTES } from "@/lib/docs/curation/notes";
import { docEntries } from "@/lib/docs/registry";
import { importLine } from "@/lib/docs/install";
import { useOptionalI18n } from "@/lib/i18n/provider";

export function IntegrationNotes({ entryId }: { entryId: string }) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  const entry = docEntries.find((candidate) => candidate.id === entryId);
  const note = INTEGRATION_NOTES[entryId];
  if (!entry || !note) return null;

  return (
    <Stack gap="2xl">
      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        {note.usage.map((usage) => (
          <div key={`${entryId}:${usage.imports.join(",")}`} className="flex flex-col gap-3">
            <ImportLine line={importLine(entry.importPath, usage.imports)} />
            <CodeBlock code={usage.code} label={tcs("Copy the minimal call")} />
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(usage.note)}
            </Text>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="provider-configuration">
          {tcs("Configuration")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(note.configuration)}
        </Text>
        <Heading size="title" as="h3">
          {tcs("Client and provider lifecycle")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(note.lifecycle)}
        </Text>
        <Heading size="title" as="h3">
          {tcs("Limitations")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(note.limitations)}
        </Text>
      </section>

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={note.guidance.use} avoid={note.guidance.avoid} tcs={tcs} />
      </section>
    </Stack>
  );
}
