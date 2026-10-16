"use client";

import { useState, type ReactNode } from "react";
import {
  Field,
  Panel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Text,
} from "@luc/ui";
import { RiExchangeLine, RiGlobalLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";

/** A list long enough to prove the menu caps its own height. */
const SYMBOLS = [
  "BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD", "DOT-USD", "LINK-USD", "MATIC-USD",
  "ADA-USD", "XRP-USD", "ATOM-USD", "NEAR-USD", "APT-USD", "ARB-USD", "OP-USD",
  "SUI-USD", "TIA-USD", "INJ-USD", "SEI-USD", "RNDR-USD", "FIL-USD", "LDO-USD",
  "MKR-USD", "AAVE-USD", "UNI-USD", "CRV-USD", "SNX-USD", "COMP-USD", "GRT-USD",
];

const RANGES = [
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All history" },
];

export function SelectPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const [range, setRange] = useState("1y");
  const [venue, setVenue] = useState<string | undefined>(undefined);
  const notes = ENTRY_NOTES.select;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Select")}
        title="Select"
        lead="Choosing one value from a known, finite set. Radix supplies the listbox ARIA model, typeahead and focus behaviour; LUC supplies the trigger chrome — identical to Input — and the menu surface. If the list needs searching that is Combobox; if the action needs running that is CommandMenu."
      />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
        title={tcs("Trigger and menu")}
        description={tcs("One size token drives the trigger height, the type scale and the menu rhythm, so a dropdown is never hand-tuned.")}
        layout="grid"
        code={`<Select defaultValue="1y">
  <SelectTrigger aria-label="Range">
    <SelectValue placeholder="Choose a range" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1y">1 year</SelectItem>
  </SelectContent>
</Select>`}
      >

        <Panel className="flex flex-col gap-4 p-5">
          <Field label={tcs("Range")} description={tcs("Applies to every chart in the group.")}>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a range" />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Text variant="caption" tone="muted">
            Value: <span className="luc-numeric text-fg-secondary">{range}</span>
          </Text>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <Field label={tcs("Venue")} description={tcs("Placeholder shows until a venue is chosen.")}>
            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger leadingIcon={<RiExchangeLine />}>
                <SelectValue placeholder="Any venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
                <SelectItem value="kraken">Kraken</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={tcs("Disabled")} description={tcs("Disabled controls keep their label and value.")}>
            <Select defaultValue="usd" disabled>
              <SelectTrigger leadingIcon={<RiGlobalLine />}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <Field label={tcs("Invalid")} error={tcs("A venue is required for this run")}>
            <Select>
              <SelectTrigger invalid>
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Panel>
      </Example>

      <Example
        title={tcs("Sizes")}
        description={tcs("One size drives the trigger's height, its type scale and the menu's rhythm, so a dropdown is never hand-tuned.")}
        layout="grid"
        code={`<Select size="sm">…</Select>
<Select size="md">…</Select>
<Select size="lg">…</Select>`}
      >
        {(["sm", "md", "lg"] as const).map((option) => (
          <Panel key={option} className="flex flex-col gap-3 p-5">
            <Text variant="caption" tone="muted" as="p">
              {option}
            </Text>
            <Select size={option} defaultValue={option}>
              <SelectTrigger aria-label={tcs("Size {size}").replace("{size}", option)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </Panel>
        ))}
      </Example>

      <Example
        title={tcs("A long list scrolls")}
        description={tcs("The menu caps its own height and scrolls, so a hundred-option list stays inside the viewport.")}
        layout="block"
        code={`<Select>
  <SelectTrigger aria-label="Instrument">
    <SelectValue placeholder="Choose an instrument" />
  </SelectTrigger>
  <SelectContent>
    {symbols.map((symbol) => (
      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
    ))}
  </SelectContent>
</Select>`}
      >
        <Panel className="max-w-sm p-5">
          <Field label={tcs("Instrument")} description={tcs("Type a few letters to jump — the listbox has typeahead.")}>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose an instrument" />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Panel>
      </Example>

      <Example
        title={tcs("Groups, descriptions and disabled options")}
        description={tcs("A group is a heading, not a nesting level. Descriptions carry the code or the unit; the label stays short.")}
        layout="block"
        code={`<Select>
  <SelectTrigger aria-label="Instrument">
    <SelectValue placeholder="Choose an instrument" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Equities</SelectLabel>
      <SelectItem value="AAPL" description="Nasdaq">Apple</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectItem value="SPX" disabled description="Unavailable">S&P 500</SelectItem>
  </SelectContent>
</Select>`}
      >

        <Panel className="max-w-sm p-5">
          <Field label={tcs("Instrument")} description={tcs("The universe drives every downstream column.")}>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose an instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Crypto</SelectLabel>
                  <SelectItem value="BTC-USD" description={tcs("BTC-USD · spot")}>
                    Bitcoin
                  </SelectItem>
                  <SelectItem value="ETH-USD" description={tcs("ETH-USD · spot")}>
                    Ethereum
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Indices</SelectLabel>
                  <SelectItem value="SPX" description={tcs("SPX · cash")}>
                    S&amp;P 500
                  </SelectItem>
                  <SelectItem value="VIX" description={tcs("Not licensed for this workspace")} disabled>
                    VIX
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </Panel>
      </Example>

      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine
          line={'import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@luc/ui";'}
        />
        <CodeBlock
          code={`<Select value={range} onValueChange={setRange}>
  <SelectTrigger aria-label="Range">
    <SelectValue placeholder="Choose a range" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1y">1 year</SelectItem>
  </SelectContent>
</Select>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "The trigger is the tab stop and the menu owns the active option; `size` on the root drives both. Radix supplies the listbox model, the typeahead and the focus behaviour.",
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
        <Panel className="flex flex-col gap-3 p-5">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Three controls, three different jobs")}
          </Text>
          <dl className="grid gap-3 text-caption sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">Select</dt>
              <dd className="text-fg-muted">{tcs("Pick one of a handful of known options. No search.")}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">Combobox</dt>
              <dd className="text-fg-muted">{tcs("Search, then pick. Long or async lists.")}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">CommandMenu</dt>
              <dd className="text-fg-muted">{tcs("Execute something: navigate, run, toggle.")}</dd>
            </div>
          </dl>
        </Panel>
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="select" related={["combobox", "native-select", "field"]} />
    </DocPage>
  );
}
