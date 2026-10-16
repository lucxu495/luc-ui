"use client";

import { useState, type ReactNode } from "react";
import { ColorPicker, Field, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

const swatches = [
  { value: "#3b6ef5", label: "Sapphire" },
  { value: "#0f9d8f", label: "Teal" },
  { value: "#c05a2c", label: "Ember" },
  { value: "#7b5cd6", label: "Violet" },
  { value: "#c22f5a", label: "Rose" },
  { value: "#6b7280", label: "Graphite" },
];

/*
 * The ColorPicker page, in the canonical Components V2 shape.
 *
 * It was one half of "Colour and transfer": a single page documenting
 * `ColorPicker` *and* `TransferList`, with a hand-written four-row API table
 * covering both. The manual review found that grouping (finding F-02) — the two
 * components answer different questions and share no props — so the page now
 * documents one component, at the canonical structure, and TransferList has the
 * page at `/components/transfer-list`.
 */
export function ColorPickerPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["color-picker"];
  const [color, setColor] = useState("#3b6ef5");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="ColorPicker"
        lead={tcs(
          "Turn a colour into a hex string: a swatch trigger, a palette the caller supplies, and the value always available as text.",
        )}
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("A palette and a value")}
          description={tcs(
            "Presets come from the caller — the component ships no default palette, because a colour that means something is a product decision.",
          )}
          layout="block"
          code={`<ColorPicker
  value={color}
  onValueChange={setColor}
  swatches={[
    { value: "#3b6ef5", label: "Sapphire" },
    { value: "#0f9d8f", label: "Teal" },
  ]}
  label="Accent colour"
/>`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <ColorPicker
              value={color}
              onValueChange={setColor}
              swatches={swatches}
              label={tcs("Accent colour")}
            />
            <Text variant="caption" tone="muted" className="font-mono">
              {color}
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("The value is a normalised `#rrggbb` string — what a form, a CSS variable or a design token stores.")}
            </Text>
          </div>
        </Example>

        <Example
          title={tcs("Uncontrolled, and disabled")}
          description={tcs(
            "With `defaultValue` the component keeps its own state; `disabled` keeps the value readable without letting anyone change it.",
          )}
          layout="inline"
          code={`<ColorPicker defaultValue="#0f9d8f" swatches={swatches} label="Series colour" />
<ColorPicker defaultValue="#c22f5a" swatches={swatches} label="Locked colour" disabled />`}
        >
          <ColorPicker defaultValue="#0f9d8f" swatches={swatches} label={tcs("Series colour")} />
          <ColorPicker
            defaultValue="#c22f5a"
            swatches={swatches}
            label={tcs("Locked colour")}
            disabled
          />
        </Example>

        <Example
          title={tcs("In a field")}
          description={tcs(
            "Inside a `Field` the visible label is the field's, and the message slot is where a rule about the value belongs.",
          )}
          layout="block"
          code={`<Field label="Series colour" description="Used for the primary line on every chart.">
  <ColorPicker value={color} onValueChange={setColor} swatches={swatches} />
</Field>`}
        >
          <Field
            label={tcs("Series colour")}
            description={tcs("Used for the primary line on every chart.")}
          >
            <ColorPicker value={color} onValueChange={setColor} swatches={swatches} />
          </Field>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { ColorPicker } from "@luc/ui";'} />
        <CodeBlock
          code={`<ColorPicker value={color} onValueChange={setColor} swatches={swatches} label="Series colour" />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`value` plus `onValueChange` controls it; `defaultValue` leaves the state to the component. Either way the value is a hex string, so a form stores it like any other text field.",
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

      <EntryFooter entryId="color-picker" related={["input-group", "input", "label"]} />
    </DocPage>
  );
}
