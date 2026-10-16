"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  EmptyState,
  Heading,
  Input,
  Panel,
  Text,
} from "@luc/ui";
import { RiFileChartLine, RiFilterOffLine, RiFolderOpenLine, RiLineChartLine, RiSearchLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const runs = ["btc-sma-2026-09", "eth-momentum-2026-09", "macro-regime-2026-08"];

export function EmptyStatePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["empty-state"];
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => runs.filter((run) => run.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Feedback")}
        title="EmptyState"
        lead="The reusable “nothing here yet” surface, so a page, a card, a pane and a table region never invent icon plus heading plus paragraph plus button a fourth time."
      />

      <ImportLine line={'import { EmptyState } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

      <Example
        title={tcs("Page level")}
        description={tcs("Calm by default: one mark, one line of what is missing, one sentence of what to do, and the action that does it.")}
        layout="block"
        code={'<EmptyState icon={<RiFolderOpenLine />} title="No research runs yet" description="Run a study to see its artifacts here." action={<Button>New run</Button>} secondaryAction={<Button variant="ghost">Browse templates</Button>} />'}
      >

        <Panel>
          <EmptyState
            icon={<RiFolderOpenLine />}
            title={tcs("No research runs yet")}
            description={tcs("Artifacts are written to luc-data/research. Start a study to see the registry fill up.")}
            action={<Button>New run</Button>}
            secondaryAction={<Button variant="ghost">Browse templates</Button>}
          />
        </Panel>
      </Example>

      <Example
        title={tcs("Inside a card")}
        code={`<Card className="p-0">
  <EmptyState
    size="sm"
    icon={<RiLineChartLine />}
    title="No chart selected"
    description="Pick an instrument to load its prepared series."
    action={<Button size="sm">Add instrument</Button>}
  />
</Card>`}
        description={tcs("The same component, sized by its own padding. Nothing about it assumes a full-page canvas.")}
        layout="grid"
      >

        <Card className="p-0">
          <EmptyState
            size="sm"
            icon={<RiLineChartLine />}
            title={tcs("No chart selected")}
            description={tcs("Pick an instrument to load its prepared series.")}
            action={<Button size="sm">Add instrument</Button>}
          />
        </Card>
        <Card className="p-0">
          <EmptyState
            size="sm"
            icon={<RiFileChartLine />}
            title={tcs("No backtest artifacts")}
            description={tcs("Reports appear here once a run finishes.")}
          />
        </Card>
        <Card className="p-0">
          <EmptyState size="sm" title={tcs("Nothing pinned")} description={tcs("Pin a timestamp to compare across charts.")} />
        </Card>
      </Example>

      <Example
        title={tcs("No search results")}
        code={`{matches.length > 0 ? (
  <ul>{matches.map((run) => <li key={run}>{run}</li>)}</ul>
) : (
  <EmptyState
    size="sm"
    icon={<RiFilterOffLine />}
    title="No runs match that filter"
    description={\`Nothing matches "\${query}".\`}
    action={<Button size="sm" variant="secondary" onClick={clear}>Clear filter</Button>}
  />
)}`}
        description={tcs("The most common empty state of all. The difference between “empty” and “filtered to nothing” is worth a distinct message and a reset — never the same panel with different words.")}
        layout="block"
      >

        <Panel className="flex flex-col gap-4 p-4">
          <label className="flex items-center gap-2 rounded-md border border-line-default bg-surface-sunken px-2.5 shadow-xs focus-within:border-line-accent">
            <RiSearchLine aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
            <Input
              className="border-0 bg-transparent shadow-none"
              placeholder="Filter runs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filter runs"
            />
          </label>
          {matches.length > 0 ? (
            <ul className="flex flex-col gap-1 text-label text-fg-secondary">
              {matches.map((run) => (
                <li key={run} className="rounded-sm px-2 py-1.5 font-mono">
                  {run}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              size="sm"
              icon={<RiFilterOffLine />}
              title={tcs("No runs match that filter")}
              description={`Nothing matches “${query}”.`}
              action={
                <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                  Clear filter
                </Button>
              }
            />
          )}
        </Panel>
      </Example>

      <Example
        title={tcs("Sizing and semantics")}
        code={`<EmptyState size="sm" title="Small" description="Compact padding, 32px mark." />
<EmptyState size="md" title="Medium" description="Page and card rhythm, 40px mark." />

/* Emptiness as an event, not a state. */
<EmptyState size="sm" role="status" title="Announced when it appears" />`}
        description={tcs("Small is for a table region or a pane; medium is for a page or a card. The title is a paragraph unless you say otherwise, and nothing is announced as a live region.")}
        layout="grid"
      >

        <Card className="p-0">
          <EmptyState size="sm" title={tcs("Small")} description={tcs("Compact padding, 32px mark.")} />
        </Card>
        <Card className="p-0">
          <EmptyState size="md" title={tcs("Medium")} description={tcs("Page and card rhythm, 40px mark.")} />
        </Card>
        <Card className="p-0">
          <EmptyState
            size="sm"
            role="status"
            title={tcs("Announced when it appears")}
            description={tcs("Pass a role when emptiness is an event rather than a state.")}
          />
        </Card>
      </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={'import { EmptyState } from "@luc/ui";'} />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      {apiSection}

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="empty-state" />
    </DocPage>
  );
}
