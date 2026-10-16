"use client";

import { useState, type ReactNode } from "react";
import { Button, Field, OtpInput, Text, toast } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export function OtpInputPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["otp-input"];
  const [code, setCode] = useState("");
  /* `onComplete` is the prop the check belongs to, so the demo shows the field
   * acknowledging a full code rather than pretending to have verified one. */
  const [complete, setComplete] = useState(false);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · OtpInput")}
        title="OtpInput"
        lead="Six visible slots over one real input. Type, paste the whole code, or navigate with the arrow keys — screen readers hear a single labelled field, not six unlabelled boxes."
      />

      <ImportLine line={'import { Field, OtpInput } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Basic")}
        code={`<Field
  label="Verification code"
  description="Six digits, sent to research@acme.dev."
  success={complete ? "Six digits entered — this is where the check runs." : undefined}
>
  <OtpInput
    length={6}
    groups={[3, 3]}
    value={code}
    onValueChange={setCode}
    onComplete={() => setComplete(true)}
  />
</Field>`}
        description={tcs("`autocomplete=\"one-time-code\"` is set for you, and the pattern decides which characters the field accepts.")}
        layout="block"
      >

        <Field
          label={tcs("Verification code")}
          description={tcs("Six digits, sent to research@acme.dev.")}
          success={complete ? tcs("Six digits entered — this is where the check runs.") : undefined}
        >
          <OtpInput
            length={6}
            groups={[3, 3]}
            value={code}
            onValueChange={(next) => {
              setCode(next);
              if (next.length < 6) setComplete(false);
            }}
            onComplete={() => setComplete(true)}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Text variant="caption" tone="muted">
            value: <code className="text-fg-secondary">{code || "—"}</code>
          </Text>
          <Button
            size="sm"
            variant="secondary"
            disabled={code.length !== 6}
            onClick={() => toast.success("Code accepted (demo)")}
          >
            Verify
          </Button>
        </div>
      </Example>

      <Example
        title={tcs("Characters, grouping and sizes")}
        code={`<OtpInput aria-label="Alphanumeric code" length={6} mode="alphanumeric" />
<OtpInput aria-label="Grouped code" length={8} groups={[4, 4]} defaultValue="1234" />
<OtpInput aria-label="Small code" length={4} size="sm" />
<OtpInput aria-label="Large code" length={4} size="lg" />`}
        layout="block"
      >

        <div className="flex flex-col gap-4">
          <OtpInput aria-label="Alphanumeric code" length={6} mode="alphanumeric" />
          <OtpInput aria-label="Grouped code" length={8} groups={[4, 4]} defaultValue="1234" />
          <OtpInput aria-label="Small code" length={4} size="sm" />
          <OtpInput aria-label="Large code" length={4} size="lg" />
        </div>
      </Example>

      <Example
        title={tcs("States")}
        description={tcs("Empty, rejected and locked: the invalid state is a message on the field, and a disabled code keeps its digits readable.")}
        layout="grid"
        code={`<OtpInput length={4} aria-label="Code" />
<Field label="Code" error="That code has expired">
  <OtpInput length={4} defaultValue="1234" />
</Field>
<OtpInput length={4} defaultValue="1234" disabled aria-label="Disabled code" />`}
      >

        <StateGrid
          columns={3}
          states={[
            {
              label: "Empty",
              render: <OtpInput aria-label="Empty" length={4} />,
            },
            {
              label: "Invalid",
              note: "field-level error",
              render: (
                <Field label={tcs("Code")} error={tcs("That code has expired")}>
                  <OtpInput length={4} defaultValue="1234" />
                </Field>
              ),
            },
            {
              label: "Disabled",
              render: <OtpInput aria-label="Disabled" length={4} defaultValue="1234" disabled />,
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
        <ImportLine line={`import { OtpInput } from "@luc/ui";`} />
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

      <EntryFooter entryId="otp-input" related={["password-input", "input", "field"]} />
    </DocPage>
  );
}
