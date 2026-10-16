/*
 * Statuses and freshness.
 *
 * A server component, which is what lets the page inject one fixed clock into
 * every specimen and render the same markup on both sides of hydration — the
 * property that makes a relative timestamp safe to server-render at all.
 *
 * Two registry entries meet here and only one of them is this page's subject:
 * `status-badge` is the entry the route belongs to (the feedback family), while
 * `FreshnessBadge` and `Timestamp` live in `timestamp` (data display, its own
 * page at `/components/timestamp`). The Examples below show how the two work
 * together, and the API area documents the entry this page owns, with a link to
 * the other one rather than a second copy of its tables.
 */

import type { Metadata } from "next";
import {
  Badge,
  Card,
  Code,
  FreshnessBadge,
  Heading,
  Inline,
  Panel,
  StatusBadge,
  Text,
  Timestamp,
} from "@luc/ui";
import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { EntryApiSection } from "@/components/docs/entry-api";
import { GuidanceCards } from "@/components/docs/guidance";
import { DataTable } from "@/components/docs/data-table";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Statuses" };

// Fixed clock so this page renders deterministically in tests and screenshots.
const NOW = new Date("2026-09-26T12:00:00Z");
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

const VOCABULARY_CODE = [
  `<StatusBadge status="live" />`,
  `<StatusBadge status="healthy" />`,
  `<StatusBadge status="degraded" />`,
  `<StatusBadge status="pending" />`,
  `<StatusBadge status="stale" />`,
  `<StatusBadge status="down" />`,
  `<StatusBadge status="unknown" />`,
].join("\n");

export default async function StatusesPage() {
  const { tcs, href } = await getServerCopy();
  const notes = ENTRY_NOTES["status-badge"];

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Feedback")}
        title="Statuses and freshness"
        lead="A state as a word and a colour, with the state itself as the source of the colour — and the age of the data beside it, because in a data product “how old is this?” is part of the number's meaning."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("The vocabulary")}
          description={tcs(
            "Seven presets, one meaning each. The word is the accessible carrier and the colour is the fast one; extending a status means extending the vocabulary, not the palette.",
          )}
          layout="block"
          code={VOCABULARY_CODE}
        >
          <div className="flex w-full flex-col gap-4">
            <Inline gap="sm" wrap>
              <StatusBadge status="live" />
              <StatusBadge status="healthy" />
              <StatusBadge status="degraded" />
              <StatusBadge status="pending" />
              <StatusBadge status="stale" />
              <StatusBadge status="down" />
              <StatusBadge status="unknown" />
            </Inline>
            <DataTable
              caption={tcs("Status presets")}
              columns={[
                {
                  key: "status",
                  header: "Status",
                  render: (row: { status: string; tone: string; meaning: string }) => (
                    <StatusBadge status={row.status as "live"} size="sm" />
                  ),
                },
                {
                  key: "tone",
                  header: "Tone",
                  render: (row: { status: string; tone: string; meaning: string }) => (
                    <Code>{row.tone}</Code>
                  ),
                },
                {
                  key: "meaning",
                  header: "Meaning",
                  render: (row: { status: string; tone: string; meaning: string }) => tcs(row.meaning),
                },
              ]}
              rows={[
                {
                  status: "live",
                  tone: "positive + pulse",
                  meaning: "Receiving data right now. The dot pulses; use it rarely.",
                },
                { status: "healthy", tone: "positive", meaning: "Fresh and within expectations." },
                {
                  status: "degraded",
                  tone: "warning",
                  meaning: "Working, but worse than expected. Still usable.",
                },
                {
                  status: "stale",
                  tone: "warning",
                  meaning: "Data is older than the freshness window.",
                },
                {
                  status: "pending",
                  tone: "info",
                  meaning: "In progress; no verdict yet. Not a problem.",
                },
                { status: "down", tone: "negative", meaning: "Failed or unavailable. Needs attention." },
                {
                  status: "unknown",
                  tone: "neutral",
                  meaning: "No signal. Never render this as an error.",
                },
              ]}
            />
          </div>
        </Example>

        <Example
          title={tcs("A custom label, an unchanged colour")}
          description={tcs(
            "The preset owns the tone and the dot; `label` overrides the word. A product that needs “Healthy · 3 regions” says so beside the status it already has rather than inventing a colour for it.",
          )}
          layout="block"
          code={`<StatusBadge status="healthy" label="Healthy · 3 regions" />
<StatusBadge status="live" size="sm" label="Streaming" />`}
        >
          <Inline gap="sm" wrap>
            <StatusBadge status="healthy" label={tcs("Healthy · 3 regions")} />
            <StatusBadge status="live" size="sm" label={tcs("Streaming")} />
            <StatusBadge status="degraded" size="sm" label={tcs("Degraded · EU p99 1.4 s")} />
          </Inline>
        </Example>

        <Example
          title={tcs("Freshness")}
          description={tcs(
            "Thresholds are explicit props, so “stale” is never a mystery, and the age is computed against an injected clock — which is what makes the server and the browser agree on the same string.",
          )}
          layout="block"
          code={`<FreshnessBadge updatedAt={updatedAt} freshSeconds={300} staleSeconds={3600} showAge />`}
        >
          <Panel className="grid w-full gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "8 seconds ago", value: ago(8) },
              { label: "3 minutes ago", value: ago(180) },
              { label: "42 minutes ago", value: ago(2520) },
              { label: "6 hours ago", value: ago(21_600) },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-2">
                <Text variant="micro" tone="muted" as="p">
                  {row.label}
                </Text>
                <FreshnessBadge updatedAt={row.value} now={NOW} showAge />
              </div>
            ))}
          </Panel>
        </Example>

        <Example
          title={tcs("Timestamps")}
          description={tcs(
            "Relative by default, exact on hover, and the machine-readable value is always in the DOM. The absolute form takes a `timeZone`, because a data product's readers are not all in one.",
          )}
          layout="block"
          code={`<Timestamp value={ago(30)} now={NOW} />
<Timestamp value={publishedAt} display="absolute" style="datetime" timeZone="UTC" />`}
        >
          <Panel className="grid w-full gap-4 p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                {tcs("relative")}
              </Text>
              <Inline gap="sm" wrap>
                <Timestamp value={ago(30)} now={NOW} />
                <Timestamp value={ago(5400)} now={NOW} />
                <Timestamp value={ago(172_800)} now={NOW} />
              </Inline>
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                {tcs("absolute (UTC)")}
              </Text>
              <Inline gap="sm" wrap>
                <Timestamp value={NOW} now={NOW} display="absolute" style="datetime" timeZone="UTC" />
                <Timestamp value={NOW} now={NOW} display="absolute" style="date" timeZone="UTC" />
                <Timestamp value={NOW} now={NOW} display="absolute" style="time" timeZone="UTC" />
              </Inline>
            </div>
          </Panel>
        </Example>

        <Example
          title={tcs("In a data quality panel")}
          description={tcs(
            "How the three combine with row counts in a real surface: the word, the age, and a note about why a table is in the state it is in.",
          )}
          layout="block"
          code={`<StatusBadge status="stale" size="sm" />
<Timestamp value={row.updated} now={NOW} />`}
        >
          <Panel className="w-full divide-y divide-line-subtle">
            {[
              {
                name: "market_candles_1h",
                status: "live" as const,
                updated: ago(12),
                rows: "1,284,020",
                note: "provider: binance",
              },
              {
                name: "market_candles_1d",
                status: "healthy" as const,
                updated: ago(900),
                rows: "18,420",
                note: "provider: binance",
              },
              {
                name: "market_candles_1w",
                status: "healthy" as const,
                updated: ago(7200),
                rows: "2,640",
                note: "provider: binance",
              },
              {
                name: "legacy market_candles",
                status: "stale" as const,
                updated: ago(604_800),
                rows: "—",
                note: "compatibility only",
              },
              {
                name: "retained parquet snapshot",
                status: "pending" as const,
                updated: ago(86_400),
                rows: "retained",
                note: "reader migration pending",
              },
            ].map((row) => (
              <div key={row.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <code className="w-56 shrink-0 font-mono text-caption text-fg-primary">{row.name}</code>
                <StatusBadge status={row.status} size="sm" />
                <span className="luc-numeric w-28 text-caption text-fg-secondary">{row.rows}</span>
                <Timestamp value={row.updated} now={NOW} className="text-caption" />
                <span className="ml-auto">
                  <Badge size="sm" tone="outline">
                    {tcs(row.note)}
                  </Badge>
                </span>
              </div>
            ))}
          </Panel>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { StatusBadge } from "@luc/ui/data";`} />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      <EntryApiSection
        entryId="status-badge"
        primary="StatusBadge"
        {...(notes?.api?.note ? { note: notes.api.note } : {})}
      />

      <section className="flex flex-col gap-2">
        <Heading size="title" as="h3">
          {tcs("FreshnessBadge and Timestamp")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Both live in their own module and have their own page, with the compiled tables for every prop — including `now`, `locale` and `timeZone`.",
          )}{" "}
          <Link className="luc-focus text-fg-accent underline" href={href("/components/timestamp")}>
            {tcs("Open the Timestamp page")}
          </Link>
          .
        </Text>
      </section>

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
        <Card variant="outline" className="gap-2 p-4">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Server and browser agree")}
          </Text>
          <Text variant="caption" tone="secondary" as="p" className="max-w-[68ch]">
            {tcs(
              "A relative time is computed from a clock, and two clocks are two strings: without an injected `now`, a page rendered at 12:00:59 and hydrated at 12:01:00 disagrees about “1m” and React reports a hydration mismatch. Every specimen above passes one fixed clock, which is what a product should do for anything server-rendered.",
            )}
          </Text>
        </Card>
      </section>

      <EntryFooter entryId="status-badge" />
    </DocPage>
  );
}
