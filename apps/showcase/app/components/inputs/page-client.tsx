"use client";

import { useState, type ReactNode } from "react";
import { Button, Code, Field, Input, Panel, SearchInput, Text, Textarea } from "@luc/ui";
import { RiAtLine, RiCalendarLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The Input page, in the canonical Components V2 shape.
 *
 * What changed in this revision, and why:
 *
 *   - **the Playground is gone.** Components V2 §5 rejects a 16rem control
 *     column beside an ordinary control: a text field's prop space is small
 *     enough to demonstrate, and the panel spent a screen explaining which
 *     properties it could not change here. Its capabilities are examples now —
 *     sizes, states, icons, the trailing action, `Field` composition — and
 *     `lib/docs/curation/playgrounds.ts` no longer wires this entry.
 *   - the three stacked `Section` blocks became examples, so the page reads as
 *     one list of capabilities with its code behind the same disclosure the
 *     Actions pages use.
 *   - the hand-written props table is replaced by `EntryApiSection`, the
 *     compiler's own reading of `InputProps` — which knows `inputClassName`, the
 *     `ControlSize` union and the inherited input attributes the hand-written
 *     six rows did not.
 *   - the Do/Don't rows and the accessibility note come from
 *     `curation/notes.ts`, so the same advice cannot drift from the page beside
 *     it.
 */
export function InputsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.input;
  const [query, setQuery] = useState("");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Input"
        lead={tcs(
          "The text control: one shell shared with Textarea and SearchInput, so their states can never drift apart.",
        )}
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("One chrome, three controls")}
          description={tcs(
            "Input, Textarea and SearchInput share the same shell, so hover, focus, invalid, disabled and read-only are one implementation and cannot drift. Only the element inside changes.",
          )}
          layout="block"
          code={`<Input placeholder="Instrument or symbol" aria-label="Instrument or symbol" />
<Input placeholder="Read-only value" defaultValue="BTC-USD" readOnly aria-label="Read-only value" />
<Textarea placeholder="Notes for this run" aria-label="Run notes" />
<SearchInput placeholder="Search runs…" value={query} onValueChange={setQuery} />`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder={tcs("Instrument or symbol")} aria-label="Instrument or symbol" />
            <Input
              placeholder={tcs("Read-only value")}
              defaultValue="BTC-USD"
              readOnly
              aria-label="Read-only value"
            />
            <Textarea placeholder={tcs("Notes for this run")} aria-label="Run notes" />
            <div className="flex flex-col gap-3">
              <SearchInput
                placeholder={tcs("Search runs…")}
                value={query}
                onValueChange={setQuery}
                clearLabel={tcs("Clear the search")}
              />
              <Text variant="caption" tone="muted">
                {tcs("Bound value:")} <Code>{query || "—"}</Code>
              </Text>
            </div>
          </div>
        </Example>

        <Example
          title={tcs("Sizes")}
          description={tcs(
            "One density scale shared by every control: a dense toolbar, a default form, a large onboarding step.",
          )}
          layout="block"
          code={`<Input size="sm" placeholder="Small — dense toolbars" aria-label="Small input" />
<Input size="md" placeholder="Medium — default" aria-label="Medium input" />
<Input size="lg" placeholder="Large — forms and onboarding" aria-label="Large input" />`}
        >
          <div className="flex flex-col gap-3">
            <Input size="sm" placeholder={tcs("Small — dense toolbars")} aria-label="Small input" />
            <Input size="md" placeholder={tcs("Medium — default")} aria-label="Medium input" />
            <Input size="lg" placeholder={tcs("Large — forms and onboarding")} aria-label="Large input" />
          </div>
        </Example>

        <Example
          title={tcs("States")}
          description={tcs(
            "Hover, focus, invalid, disabled and read-only are shown as specimens, so the treatment is reviewable in a screenshot as well as by using it.",
          )}
          layout="stage"
          code={`<Input aria-label="Hover state input" className="border-line-strong" />
<Input aria-label="Focus state input" className="border-line-accent shadow-[var(--glow-focus)]" />
<Input invalid defaultValue="BTC/USD" aria-label="Invalid input" />
<Input disabled aria-label="Disabled input" />
<Input readOnly defaultValue="2026-09-26" aria-label="Read-only input" />`}
        >
          <StateGrid
            columns={3}
            states={[
              {
                label: tcs("Default"),
                render: <Input placeholder={tcs("Instrument")} aria-label="Default input" className="w-full" />,
              },
              {
                label: tcs("Hover"),
                note: tcs("Border steps up one level"),
                render: (
                  <Input
                    placeholder={tcs("Instrument")}
                    aria-label="Hover state input"
                    className="w-full border-line-strong"
                  />
                ),
              },
              {
                label: tcs("Focus"),
                note: tcs("Accent border and a soft 3px ring"),
                render: (
                  <Input
                    placeholder={tcs("Instrument")}
                    aria-label="Focus state input"
                    className="w-full border-line-accent shadow-[var(--glow-focus)]"
                  />
                ),
              },
              {
                label: tcs("Invalid"),
                note: tcs("`aria-invalid` drives the treatment, so `Field error` sets it for you"),
                render: (
                  <Input
                    placeholder={tcs("Instrument")}
                    aria-label="Invalid input"
                    invalid
                    className="w-full"
                    defaultValue="BTC/USD"
                  />
                ),
              },
              {
                label: tcs("Disabled"),
                note: tcs("Out of the tab order; use it only when the value is genuinely unavailable"),
                render: (
                  <Input placeholder={tcs("Instrument")} aria-label="Disabled input" disabled className="w-full" />
                ),
              },
              {
                label: tcs("Read-only"),
                note: tcs("Selectable and copyable, not editable"),
                render: (
                  <Input readOnly defaultValue="2026-09-26" aria-label="Read-only input" className="w-full" />
                ),
              },
            ]}
          />
        </Example>

        <Example
          title={tcs("A leading icon and a trailing action")}
          description={tcs(
            "Both live inside the one shell: the icon is decorative and brightens with focus, and the trailing slot holds an action, a unit or a clear button.",
          )}
          layout="block"
          code={`<Input placeholder="you@luc.dev" leadingIcon={<RiAtLine />} aria-label="Email address" />

<Input
  placeholder="Range start"
  leadingIcon={<RiCalendarLine />}
  trailingAction={<Button size="sm" variant="ghost">Today</Button>}
  aria-label="Range start"
/>`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="you@luc.dev"
              leadingIcon={<RiAtLine />}
              aria-label="Email address"
            />
            <Input
              placeholder={tcs("Range start")}
              leadingIcon={<RiCalendarLine />}
              aria-label={tcs("Range start")}
              trailingAction={
                <Button size="sm" variant="ghost">
                  {tcs("Today")}
                </Button>
              }
            />
          </div>
        </Example>

        <Example
          title={tcs("Field composition")}
          description={tcs(
            "`Field` owns the id, the description and the message, so labelling is never something a page has to remember.",
          )}
          layout="block"
          code={`<Field label="Symbol" description="Ticker in BASE/QUOTE form" required>
  <Input placeholder="BTC/USD" />
</Field>

<Field label="Universe" error="Select at least one instrument">
  <Input placeholder="No instruments selected" />
</Field>`}
        >
          <Panel className="grid gap-5 p-5 md:grid-cols-2">
            <Field label={tcs("Symbol")} description={tcs("Ticker in BASE/QUOTE form")} required>
              <Input placeholder="BTC/USD" />
            </Field>
            <Field label={tcs("Universe")} error={tcs("Select at least one instrument")}>
              <Input defaultValue="" placeholder={tcs("No instruments selected")} />
            </Field>
            <Field label={tcs("Lookback")} description={tcs("Bars used to warm up indicators.")}>
              <Input size="sm" defaultValue="200" />
            </Field>
            <Field label={tcs("Disabled example")} disabled>
              <Input disabled placeholder={tcs("Locked by the workspace owner")} />
            </Field>
          </Panel>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { Input } from "@luc/ui";'} />
        <CodeBlock code={`<Input placeholder="BTC/USD" aria-label="Instrument" />`} label={tcs("Copy the minimal call")} />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Inside a `Field` the label, description and error message wire themselves to the input; the `aria-label` above is only for a field standing alone.",
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

      <EntryFooter entryId="input" related={["textarea", "search-input", "field"]} />
    </DocPage>
  );
}
