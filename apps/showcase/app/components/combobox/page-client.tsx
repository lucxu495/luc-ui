"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Combobox, Field, Panel, Text, type ComboboxOption } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { countries, instruments } from "@/lib/table-data";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const asOptions = (items: typeof instruments): ComboboxOption[] =>
  items.map((item) => ({
    value: item.value,
    label: item.label,
    description: item.description,
    group: item.group,
    disabled: item.disabled,
  }));

const INSTRUMENTS = asOptions(instruments);
const COUNTRIES = asOptions(countries);

/** A long list, to show that search — not virtualisation — is the answer here. */
const MANY: ComboboxOption[] = Array.from({ length: 240 }, (_, index) => ({
  value: `series-${index + 1}`,
  label: `Series ${String(index + 1).padStart(3, "0")}`,
  description: index % 3 === 0 ? "Prepared study output" : undefined,
  group: ["Prepared", "Derived", "Imported"][index % 3],
}));

export function ComboboxPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.combobox;
  const [instrument, setInstrument] = useState<ComboboxOption | null>(null);
  /*
   * Both of these are controlled with a real handler, so neither specimen is a
   * dead control.
   *
   * Both start with a real preset value, which is the case the component was
   * fixed for: the field shows the selection while the menu behind it offers the
   * whole list, because the filter query is what the reader typed rather than
   * the label in the field. Before that fix these two specimens started empty —
   * a preset value narrowed the menu to the one option already chosen, so a
   * demonstration that invited the reader to browse would have been showing a
   * control that could not be browsed.
   */
  const [country, setCountry] = useState<ComboboxOption | null>(COUNTRIES[3] ?? null);
  const [pinned, setPinned] = useState<ComboboxOption | null>(INSTRUMENTS[0] ?? null);
  const [asyncQuery, setAsyncQuery] = useState("");
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [asyncValue, setAsyncValue] = useState<ComboboxOption | null>(null);

  // A fake async source: it filters the same deterministic list with a tick of
  // latency so the loading row is real. Nothing here touches the network.
  const asyncOptions = useMemo(() => {
    if (!asyncQuery) return MANY.slice(0, 20);
    return MANY.filter((option) => option.label.toLowerCase().includes(asyncQuery.toLowerCase())).slice(0, 40);
  }, [asyncQuery]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Combobox")}
        title="Combobox"
        lead="Search, then choose. Downshift owns the WAI-ARIA combobox contract — active-descendant bookkeeping, roving highlight, Home/End, typeahead, Escape and Enter. LUC owns the field, the menu, the grouped rows and the loading and no-results states. Nothing here fetches anything."
      />

      <ImportLine line={'import { Combobox } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Searchable selection")}
        description={tcs("The default matcher is a case-insensitive contains across the label and the description.")}
        layout="grid"
        code={`<Combobox options={instruments} aria-label="Instrument" value={instrument} onValueChange={setInstrument} />`}
      >

        <Panel className="flex flex-col gap-4 p-5">
          <Field label={tcs("Instrument")} description={tcs("Type a ticker or a name.")}>
            <Combobox
              options={INSTRUMENTS}
              aria-label="Instrument"
              placeholder="Search instruments…"
              value={instrument}
              onValueChange={setInstrument}
            />
          </Field>
          <Text variant="caption" tone="muted">
            Selected:{" "}
            <span className="text-fg-secondary">{instrument ? instrument.label : "nothing yet"}</span>
          </Text>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <Field
            label={tcs("Country")}
            description={tcs(
              "Grouped by region, filtered as you type. It starts with a chosen value, and opening it still offers every country — the field shows the selection, the menu is not filtered by it.",
            )}
          >
            <Combobox
              options={COUNTRIES}
              aria-label="Country"
              placeholder="Search countries…"
              value={country}
              onValueChange={setCountry}
            />
          </Field>
          <Field label={tcs("Disabled")} description={tcs("Disabled keeps its value readable.")}>
            <Combobox options={COUNTRIES} aria-label="Locked country" disabled value={COUNTRIES[0] ?? null} />
          </Field>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <Field label={tcs("No matches")} description={tcs("An empty result is a state, not a blank popover.")}>
            <Combobox
              options={INSTRUMENTS.filter((option) => option.group === "Crypto")}
              aria-label="Crypto only"
              placeholder="Only crypto here…"
              emptyMessage="No instrument matches that"
            />
          </Field>
        </Panel>
      </Example>

      <Example
        title={tcs("Sizes and the clear affordance")}
        description={tcs("One size token drives the field, the glyph padding and the row rhythm. The clear button is the default and can be turned off when the value may never be unset.")}
        layout="block"
        code={`<Combobox options={instruments} size="sm" aria-label="Small" />
<Combobox options={instruments} size="md" aria-label="Default" />
<Combobox options={instruments} size="lg" aria-label="Large" />
<Combobox options={instruments} clearable={false} placeholder="Choose an instrument…" aria-label="Pinned instrument" value={pinned} onValueChange={setPinned} />`}
      >

        <div className="flex flex-col gap-4">
          <Field label={tcs("Small")}>
            <Combobox options={INSTRUMENTS} size="sm" aria-label="Small combobox" placeholder={tcs("Search instruments…")} />
          </Field>
          <Field label={tcs("Default")}>
            <Combobox options={INSTRUMENTS} aria-label="Default combobox" placeholder={tcs("Search instruments…")} />
          </Field>
          <Field label={tcs("Large")}>
            <Combobox options={INSTRUMENTS} size="lg" aria-label="Large combobox" placeholder={tcs("Search instruments…")} />
          </Field>
          <Field
            label={tcs("Not clearable")}
            description={tcs("A value the form requires: the clear affordance would offer an invalid state, so it is gone and the value can only be replaced.")}
          >
            <Combobox
              options={INSTRUMENTS}
              aria-label="Pinned instrument"
              placeholder={tcs("Choose an instrument…")}
              clearable={false}
              value={pinned}
              onValueChange={setPinned}
            />
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("Async-friendly, without owning the network")}
        description={tcs("Pass inputValue, onInputValueChange and loading, and hand back options when your request resolves. The component never calls fetch.")}
        layout="block"
        code={`<Combobox options={results} loading={loading} inputValue={query} onInputValueChange={(next) => search(next)} aria-label="Series" />`}
      >

        <Panel className="max-w-md p-5">
          <Field label={tcs("Series")} description={tcs("240 prepared series, filtered by the caller.")}>
            <Combobox
              options={asyncOptions}
              aria-label="Series"
              placeholder="Search series 001-240…"
              inputValue={asyncQuery}
              loading={asyncLoading}
              value={asyncValue}
              onValueChange={setAsyncValue}
              onInputValueChange={(next) => {
                setAsyncQuery(next);
                setAsyncLoading(true);
                window.setTimeout(() => setAsyncLoading(false), 220);
              }}
            />
          </Field>
        </Panel>
      </Example>

      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { Combobox } from "@luc/ui";`} />
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

      <EntryFooter entryId="combobox" related={["select", "search-input", "field"]} />
    </DocPage>
  );
}
