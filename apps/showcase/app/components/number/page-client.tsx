"use client";

import { useState, type ReactNode } from "react";
import {
  CurrencyInput,
  Field,
  FieldGroup,
  NumberInput,
  PercentageInput,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { StateGrid } from "@/components/docs/state-grid";
import { formatNumber } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";

export function NumberInputPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["number-input"];
  const [notional, setNotional] = useState<number | null>(250000);
  const [weight, setWeight] = useState<number | null>(0.045);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Inputs")}
        title="Number, currency and percentage"
        lead="One numeric control, three unit contracts. The value the component reports is always a plain number in the canonical unit — formatting is presentation, and it never rewrites what you stored."
      />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
        title={tcs("Number")}
        code={`<FieldGroup columns={3}>
  <Field label="Quantity" description="Integer, stepped by one.">
    <NumberInput defaultValue={250} step={1} decimals={0} />
  </Field>
  <Field label="Price" description="Two decimals, no step grid — 1234.567 stays 1234.567.">
    <NumberInput defaultValue={64321.15} decimals={2} />
  </Field>
  <Field label="Latency budget" description="Milliseconds; the unit is a suffix, not part of the value.">
    <NumberInput defaultValue={250} min={0} max={5000} step={10} decimals={0} unit="ms" />
  </Field>
</FieldGroup>`}
        description={tcs("Locale-aware parsing and formatting, caret-safe editing, arrow-key steps and real spinbutton semantics come from React Aria. LUC owns the shell and the steppers.")}
        layout="block"
      >

        <FieldGroup columns={3}>
          <Field label={tcs("Quantity")} description={tcs("Integer, stepped by one.")}>
            <NumberInput defaultValue={250} step={1} decimals={0} />
          </Field>
          <Field label={tcs("Price")} description={tcs("Two decimals, no step grid — 1234.567 stays 1234.567.")}>
            <NumberInput defaultValue={64321.15} decimals={2} />
          </Field>
          <Field label={tcs("Latency budget")} description={tcs("Milliseconds; the unit is a suffix, not part of the value.")}>
            <NumberInput defaultValue={250} min={0} max={5000} step={10} decimals={0} unit="ms" />
          </Field>
        </FieldGroup>
      </Example>

      <Example
        title={tcs("Currency")}
        code={`<CurrencyInput currency="USD" value={notional} onValueChange={setNotional} />
<CurrencyInput currency="EUR" locale="de-DE" defaultValue={1250.5} />
<CurrencyInput currency="JPY" decimals={0} defaultValue={980000} />`}
        description={tcs("The currency is a format, not a policy: the value is the major unit as a number (250000 renders $250,000.00), and any ISO-4217 code works.")}
        layout="block"
      >

        <FieldGroup columns={3}>
          <Field label={tcs("Notional")} description={tcs("USD")}>
            <CurrencyInput currency="USD" value={notional} onValueChange={setNotional} />
          </Field>
          <Field label={tcs("Fee")} description={tcs("EUR, de-DE grouping and separators.")}>
            <CurrencyInput currency="EUR" locale="de-DE" defaultValue={1250.5} />
          </Field>
          <Field label={tcs("Settlement")} description={tcs("JPY has no minor unit; precision is configuration.")}>
            <CurrencyInput currency="JPY" decimals={0} defaultValue={980000} />
          </Field>
        </FieldGroup>
        <Text variant="caption" tone="muted">
          canonical value: <code className="text-fg-secondary">{notional ?? "—"}</code> · displayed as{" "}
          <code className="text-fg-secondary">
            {formatNumber(notional, { kind: "currency", currency: "USD", minimumFractionDigits: 2 })}
          </code>
        </Text>
      </Example>

      <Example
        title={tcs("Percentage")}
        code={`<PercentageInput scale="fraction" value={weight} onValueChange={setWeight} />
<PercentageInput scale="percent" defaultValue={8} />`}
        description={tcs("`scale` is required, because 0.12 is ambiguous. The component converts only between the canonical value and the display value — it never guesses which one you meant.")}
        layout="block"
      >

        <FieldGroup columns={2}>
          <Field
            label={tcs("Position weight")}
            description={tcs("scale=\"fraction\" — the stored value is 0.045, displayed as 4.5%.")}
          >
            <PercentageInput scale="fraction" value={weight} onValueChange={setWeight} />
          </Field>
          <Field
            label={tcs("Target return")}
            description={tcs("scale=\"percent\" — the stored value is 8, displayed as 8.0%.")}
          >
            <PercentageInput scale="percent" defaultValue={8} />
          </Field>
        </FieldGroup>
        <Text variant="caption" tone="muted">
          canonical value: <code className="text-fg-secondary">{weight ?? "—"}</code> {tcs("(a fraction, not percent points)")}</Text>
      </Example>

      <Example
        title={tcs("States")}
        description={tcs("The same six states as every other LUC control: hover, focus, invalid, disabled and read-only share one shell.")}
        layout="stage"
        code={`<NumberInput invalid defaultValue={-0.5} aria-label="Invalid number" />
<NumberInput disabled defaultValue={200} aria-label="Disabled number" />
<NumberInput readOnly defaultValue={200} aria-label="Read-only number" />`}
      >
        <StateGrid
          columns={3}
          states={[
            {
              label: "Default",
              render: <NumberInput defaultValue={12.5} decimals={2} aria-label="Default" className="w-full" />,
            },
            {
              label: "Invalid",
              note: tcs("commitBehavior=\"validate\" reports the range instead of snapping to it"),
              render: (
                <NumberInput
                  defaultValue={140}
                  min={1}
                  max={100}
                  decimals={0}
                  invalid
                  commitBehavior="validate"
                  aria-label="Invalid"
                  className="w-full"
                />
              ),
            },
            {
              label: "Disabled",
              render: <NumberInput defaultValue={10} disabled aria-label="Disabled" className="w-full" />,
            },
            {
              label: "Read-only",
              render: <NumberInput defaultValue={10} readOnly aria-label="Read-only" className="w-full" />,
            },
            {
              label: "No steppers",
              note: "compact filter bars",
              render: (
                <NumberInput defaultValue={5} steppers={false} aria-label="No steppers" className="w-full" />
              ),
            },
            {
              label: "Small",
              render: <NumberInput defaultValue={5} size="sm" aria-label="Small" className="w-full" />,
            },
          ]}
        />
      </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine
          line={'import { NumberInput, CurrencyInput, PercentageInput } from "@luc/ui/forms";'}
        />
        <CodeBlock
          code={`<NumberInput value={lookback} onValueChange={setLookback} min={5} max={400} step={5} aria-label="Lookback (days)" />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`value` plus `onValueChange` controls it; a number commits on blur or Enter, and `step` is what the steppers move by.",
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

      <EntryFooter entryId="number-input" related={["input", "field", "slider"]} />
    </DocPage>
  );
}
