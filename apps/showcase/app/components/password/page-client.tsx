"use client";

import type { ReactNode } from "react";

import { Field, Panel, PasswordInput, Text } from "@luc/ui";
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

export function PasswordInputPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["password-input"];
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · PasswordInput")}
        title="PasswordInput"
        lead="A password field with a reveal toggle and nothing clever. No policy, no strength theatre, and paste is never blocked — a field that refuses paste breaks password managers and passphrases alike."
      />

      <ImportLine line={'import { Field, PasswordInput } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Reveal")}
        code={`<Field label="Password" description="State the rule in the description, not in a red banner.">
  <PasswordInput autoComplete="current-password" placeholder="••••••••••••" />
</Field>

<Field label="New API secret" description="Autocomplete is new-password, so a manager offers to generate one.">
  <PasswordInput autoComplete="new-password" />
</Field>`}
        description={tcs("The toggle is a real button with an accessible name, and it keeps `type=password` semantics for password managers until you ask it not to.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={tcs("Password")} description={tcs("State the rule in the description, not in a red banner.")}>
            <PasswordInput autoComplete="current-password" placeholder="••••••••••••" />
          </Field>
          <Field label={tcs("New API secret")} description={tcs("Autocomplete is `new-password` so the manager offers to generate one.")}>
            <PasswordInput autoComplete="new-password" placeholder={tcs("At least 12 characters")} />
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("States")}
        description={tcs("The invalid state comes from the field rather than the control, and a disabled field keeps its text readable instead of dimming the whole row.")}
        layout="grid"
        code={`<PasswordInput aria-label="Password" placeholder="••••••••" />
<Field label="Password" error="That password is too short">
  <PasswordInput defaultValue="hunter2" />
</Field>
<PasswordInput disabled aria-label="Disabled password" defaultValue="••••••••" />`}
      >

        <StateGrid
          columns={3}
          states={[
            {
              label: "Default",
              render: <PasswordInput aria-label="Default password" placeholder="••••••••" className="w-full" />,
            },
            {
              label: "Invalid",
              note: tcs("from the field, not the control"),
              render: (
                <Field label={tcs("Password")} error={tcs("That password is too short")}>
                  <PasswordInput defaultValue="hunter2" />
                </Field>
              ),
            },
            {
              label: "Disabled",
              render: <PasswordInput disabled aria-label="Disabled password" className="w-full" />,
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
        <ImportLine line={`import { PasswordInput } from "@luc/ui";`} />
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
        <Panel className="flex flex-col gap-3 p-5">
          <Text variant="micro" tone="muted" as="p">
            {tcs("What LUC does not do")}
          </Text>
          <Text variant="body" tone="secondary" className="max-w-[70ch]">
            {tcs("Strength meters, breach checks, complexity rules and lockouts belong to the product and its security review. If a product wants a strength readout, it can render one next to the field — the field itself stays a field. The only thing LUC insists on is that the value is never silently reformatted, truncated or refused.")}
          </Text>
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

      <EntryFooter entryId="password-input" related={["input", "otp-input", "field"]} />
    </DocPage>
  );
}
