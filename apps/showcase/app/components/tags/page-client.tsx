"use client";

import { useState, type ReactNode } from "react";
import { Field, Tag, TagInput, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.\-/]{0,11}$/i;

/*
 * The TagInput page, in the canonical Components V2 shape — and at the canonical
 * width.
 *
 * The page used to render inside `intent="compact"`, a 56rem measure, while every
 * other Forms page used the 104rem documentation measure: measured at 1440px the
 * content column was 896px here and 1173px on `/components/inputs`, so the same
 * two-column field grid wrapped differently and the page looked like a different
 * site (manual-review finding F-01). The intent is gone; the page keeps the
 * default `docs` measure that every other component page uses.
 *
 * What else changed: the loose `States` section became an example, the hand-written
 * import prose became the shared Usage block, and the Do/Don't rows come from
 * `curation/notes.ts` so they cannot drift from the page beside them.
 */
export function TagsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["tag-input"];
  const [symbols, setSymbols] = useState<string[]>(["BTC-USD", "ETH-USD"]);
  const [emails, setEmails] = useState<string[]>([]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="TagInput"
        lead={tcs(
          "A list of short values typed into one row: keywords, symbols, addresses. Enter or comma commits, Backspace removes the last chip, and a pasted list arrives as separate tags.",
        )}
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Values with a shape")}
          description={tcs(
            "`validate` returns a message and the candidate never enters the list — validation belongs here, not in a toast.",
          )}
          layout="block"
          code={`<Field label="Watchlist" description="Uppercase tickers, optionally venue-qualified.">
  <TagInput
    value={symbols}
    onValueChange={setSymbols}
    placeholder="Add a symbol…"
    validate={(tag) => (SYMBOL_PATTERN.test(tag) ? undefined : "Use a ticker like BTC-USD")}
  />
</Field>

<Field label="Report recipients" description="Up to five addresses; duplicates are refused.">
  <TagInput
    value={emails}
    onValueChange={setEmails}
    maxTags={5}
    placeholder="name@acme.dev"
    validate={(tag) => (tag.includes("@") ? undefined : "That is not an email address")}
  />
</Field>`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={tcs("Watchlist")}
              description={tcs("Uppercase tickers, optionally venue-qualified.")}
            >
              <TagInput
                value={symbols}
                onValueChange={setSymbols}
                placeholder={tcs("Add a symbol…")}
                validate={(tag) =>
                  SYMBOL_PATTERN.test(tag) ? undefined : tcs("Use a ticker like BTC-USD")
                }
              />
            </Field>
            <Field
              label={tcs("Report recipients")}
              description={tcs("Up to five addresses; duplicates are refused.")}
            >
              <TagInput
                value={emails}
                onValueChange={setEmails}
                maxTags={5}
                placeholder="name@acme.dev"
                validate={(tag) =>
                  tag.includes("@") ? undefined : tcs("That is not an email address")
                }
              />
            </Field>
          </div>
          <Text variant="caption" tone="muted">
            {tcs("{tags} tags · {recipients} recipients")
              .replace("{tags}", String(symbols.length))
              .replace("{recipients}", String(emails.length))}
          </Text>
        </Example>

        <Example
          title={tcs("States")}
          description={tcs(
            "Empty, filled, read-only and disabled are one input with four treatments — the chips do not change shape, only their editability does.",
          )}
          layout="stage"
          code={`<TagInput aria-label="Empty tags" placeholder="Add a value…" />
<TagInput aria-label="Filled tags" defaultValue={["momentum", "carry", "value"]} />
<TagInput aria-label="Read-only tags" readOnly defaultValue={["BTC-USD"]} />
<TagInput aria-label="Disabled tags" disabled defaultValue={["BTC-USD"]} />`}
        >
          <StateGrid
            columns={2}
            states={[
              {
                label: tcs("Empty"),
                render: <TagInput aria-label="Empty tags" placeholder={tcs("Add a value…")} />,
              },
              {
                label: tcs("Filled"),
                render: (
                  <TagInput aria-label="Filled tags" defaultValue={["momentum", "carry", "value"]} />
                ),
              },
              {
                label: tcs("Read-only"),
                render: <TagInput aria-label="Read-only tags" readOnly defaultValue={["BTC-USD"]} />,
              },
              {
                label: tcs("Disabled"),
                render: <TagInput aria-label="Disabled tags" disabled defaultValue={["BTC-USD"]} />,
              },
            ]}
          />
        </Example>

        <Example
          title={tcs("The same chips, read-only")}
          description={tcs(
            "The chips a tag input produces are the `Tag` component used everywhere else in the library, so a read-only list and an editable one look identical.",
          )}
          layout="inline"
          code={`{symbols.map((symbol) => (
  <Tag key={symbol}>{symbol}</Tag>
))}`}
        >
          {symbols.map((symbol) => (
            <Tag key={symbol}>{symbol}</Tag>
          ))}
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { TagInput } from "@luc/ui";'} />
        <CodeBlock
          code={`<TagInput value={symbols} onValueChange={setSymbols} placeholder="Add a symbol…" />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`value` plus `onValueChange` controls the list; `defaultValue` leaves it to the component. A `Field` supplies the label and the message a refused value is announced through.",
          )}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="tag-input" related={["input", "field", "file-input"]} />
    </DocPage>
  );
}
