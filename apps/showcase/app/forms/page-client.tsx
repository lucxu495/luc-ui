"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  CalendarDate,
  Card,
  DatePicker,
  Field,
  FieldGroup,
  Fieldset,
  Form,
  FormActions,
  FormSection,
  Input,
  NumberInput,
  OtpInput,
  PasswordInput,
  PercentageInput,
  Panel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SubmitButton,
  Switch,
  TagInput,
  Text,
  Textarea,
  toast,
  useLucForm,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { DEMO_TODAY } from "@/lib/form-data";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/** A tiny probe so the page can show the lifecycle it is describing. */
function FormStatusLine() {
  const { status, isSubmitting } = useLucForm();
  return (
    <Text variant="caption" tone="muted">
      status <code className="text-fg-secondary">{status}</code>
      {isSubmitting ? " · in flight" : ""}
    </Text>
  );
}

export function FormsOverviewPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.form;
  const [notifications, setNotifications] = useState(true);
  const [allocation, setAllocation] = useState<number | null>(0.12);
  const [symbols, setSymbols] = useState<string[]>(["BTC", "ETH"]);
  const [date, setDate] = useState<CalendarDate | null>(new CalendarDate(2026, 9, 26));

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Forms")}
        title="Forms"
        lead="Luc UI does not own form state — React Hook Form, TanStack Form or a reducer all work. It owns the part every product otherwise rebuilds: one field anatomy, one submit lifecycle, one error summary, and inputs that agree with the rest of the system."
      />

      <ImportLine line={'import { Form, FormActions, FormSection, SubmitButton } from "@luc/ui/forms";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Field anatomy")}
        code={`<Field label="Instrument" description="Ticker or venue-qualified symbol.">
  <Input placeholder="BTC-USD" />
</Field>
<Field label="Notional" description="Settlement currency, whole units.">
  <NumberInput placeholder="0" formatOptions={{ style: "decimal", maximumFractionDigits: 0 }} />
</Field>`}
        description={tcs("Label, description, control and message. The field owns the ids and the ARIA wiring, so a control can never be labelled by accident or by hand.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={tcs("Instrument")} description={tcs("Ticker or venue-qualified symbol.")}>
            <Input placeholder="BTC-USD" />
          </Field>
          <Field label={tcs("Notional")} description={tcs("Settlement currency, whole units.")}>
            <NumberInput placeholder="0" formatOptions={{ style: "decimal", maximumFractionDigits: 0 }} />
          </Field>
          <Field label={tcs("Settlement date")} description={tcs("Value date, not trade date.")}>
            <DatePicker value={date} onValueChange={setDate} todayValue={DEMO_TODAY} locale="en-US" />
          </Field>
          <Field label={tcs("Venue")}>
            <Select defaultValue="binance" size="md">
              <SelectTrigger aria-label="Venue">
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
                <SelectItem value="kraken">Kraken</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("States")}
        code={`<Field label="Default" description="Helper text sits at --fg-muted, not disabled grey.">
  <Input placeholder="Instrument" />
</Field>
<Field label="Validating" validating>
  <Input defaultValue="acme" />
</Field>
<Field label="Verified" success="Handle is available">
  <Input defaultValue="acme-research" />
</Field>
<Field label="Invalid" error="Above the drift threshold">
  <Input defaultValue="140" />
</Field>`}
        description={tcs("Six states, one message slot: description, validating, success, error, disabled, read-only. Only one of them is ever rendered, so the field never stacks four lines of text.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={tcs("Default")} description={tcs("Helper text sits at --fg-muted, not disabled grey.")}>
            <Input placeholder="Instrument" />
          </Field>
          <Field label={tcs("Validating")} validating>
            <Input defaultValue="acme" />
          </Field>
          <Field label={tcs("Verified")} success="Handle is available">
            <Input defaultValue="acme-research" />
          </Field>
          <Field label={tcs("Invalid")} error={tcs("Above the desk limit of 100")}>
            <NumberInput defaultValue={140} decimals={0} invalid />
          </Field>
          <Field label={tcs("Disabled")} disabled description={tcs("Locked by the workspace policy.")}>
            <Input defaultValue="BTC-USD" disabled />
          </Field>
          <Field label={"Read-only"} readOnly description={tcs("Computed from the instrument.")}>
            <Input defaultValue="USD" readOnly />
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("Groups and sections")}
        code={`<Fieldset legend="Delivery" description="Where the daily report is sent.">
  <FieldGroup columns={2}>
    <Field label="Channel">
      <Select defaultValue="email">
        <SelectTrigger aria-label="Channel">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>…</SelectContent>
      </Select>
    </Field>
  </FieldGroup>
</Fieldset>`}
        description={tcs("A real fieldset for a set of controls that answer one question; a responsive grid for fields that stand alone.")}
        layout="block"
      >

        <div className="flex flex-col gap-6">
          <Fieldset
            legend="Delivery"
            description={tcs("Where the daily report is sent.")}
            legendHint={
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                label={tcs("Enabled")}
                aria-label={tcs("Enable delivery")}
              />
            }
          >
            <FieldGroup columns={2}>
              <Field label={tcs("Channel")}>
                <Select defaultValue="email">
                  <SelectTrigger aria-label="Channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={tcs("Address")}>
                <Input placeholder="research@acme.dev" />
              </Field>
            </FieldGroup>
          </Fieldset>
          <Field label={tcs("Notes")} description={tcs("Markdown is supported.")}>
            <Textarea placeholder={tcs("Why is this run different?")} />
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("Units are stated, never assumed")}
        code={`<Field label="Target allocation" description="Stored as a fraction: 0.12 is 12%.">
  <PercentageInput scale="fraction" value={allocation} onValueChange={setAllocation} />
</Field>
<Field label="Fee" description="Stored in percent points: 12 is 12%.">
  <PercentageInput scale="percent" value={12} />
</Field>`}
        description={tcs("A percentage field requires a declared scale, because 0.12 is ambiguous and a silent conversion is how a 12% allocation becomes a 0.12% one.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={tcs("Target allocation")}
            description={tcs("Stored as a fraction: 0.12 is 12%.")}
          >
            <PercentageInput scale="fraction" value={allocation} onValueChange={setAllocation} />
          </Field>
          <Field label={tcs("Fee")} description={tcs("Stored in percent points: 12 is 12%.")}>
            <PercentageInput scale="percent" value={12} />
          </Field>
        </div>
        <Text variant="caption" tone="muted">
          canonical allocation value: <code className="text-fg-secondary">{allocation ?? "—"}</code> {tcs("(a fraction, not percent points)")}</Text>
      </Example>

      <Example
        title={tcs("Specialised inputs")}
        code={`<Field label="API secret" description="Stored locally; never sent by this demo.">
  <PasswordInput autoComplete="new-password" placeholder="••••••••••••" />
</Field>
<Field label="Confirmation code" description="Paste the whole code — it fills every slot.">
  <OtpInput length={6} groups={[3, 3]} />
</Field>`}
        description={tcs("Password, one-time codes and tag lists are LUC components too — same shell, same focus language, same field wiring.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={tcs("API secret")} description={tcs("Stored locally; never sent by this demo.")}>
            <PasswordInput autoComplete="new-password" placeholder="••••••••••••" />
          </Field>
          <Field label={tcs("Confirmation code")} description={tcs("Paste the whole code — it fills every slot.")}>
            <OtpInput length={6} groups={[3, 3]} />
          </Field>
          <Field
            label={tcs("Watchlist")}
            className="md:col-span-2"
            description={tcs("Enter or comma commits; paste a list to add several.")}
          >
            <TagInput value={symbols} onValueChange={setSymbols} placeholder="Add a symbol…" />
          </Field>
        </div>
      </Example>

      <Example
        title={tcs("One submit lifecycle")}
        code={`<Form onSubmit={save}>
  <FormSection title="Profile" description="How the workspace is identified in reports." columns={2}>
    <Field label="Workspace" required>
      <Input defaultValue="Macro research" required />
    </Field>
    <Field label="Analyst">
      <Input placeholder="Name" />
    </Field>
  </FormSection>
  <Button type="submit">Save preferences</Button>
</Form>`}
        description={tcs("idle → submitting → success | error. The button owns the pending state, the form owns the outcome, and nothing here needs a form library.")}
        layout="block"
      >

        <Card className="p-5">
          <Form
            onSubmit={async () => {
              await new Promise((resolve) => setTimeout(resolve, 700));
              toast.success("Preferences saved");
            }}
          >
            <FormSection
              title={tcs("Profile")}
              description={tcs("How the workspace is identified in reports.")}
              columns={2}
            >
              <Field label={tcs("Workspace")} required>
                <Input defaultValue="Macro research" required />
              </Field>
              <Field label={tcs("Analyst")}>
                <Input placeholder="Name" />
              </Field>
            </FormSection>
            <FormActions>
              <Button type="reset" variant="ghost">
                Reset
              </Button>
              <SubmitButton loadingText="Saving">Save changes</SubmitButton>
            </FormActions>
            <FormStatusLine />
          </Form>
        </Card>
      </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { Form, FormActions, SubmitButton } from "@luc/ui/forms";`} />
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
            {tcs("The lifecycle, in one place")}
          </Text>
          <dl className="grid gap-3 text-caption sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">idle → submitting</dt>
              <dd className="text-fg-muted">
                {tcs("A promise from `onSubmit` sets the status; `SubmitButton` shows it and stays focusable.")}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">success</dt>
              <dd className="text-fg-muted">
                {tcs("The resolved promise returns the form to rest — and the page decides what to say about it.")}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">error</dt>
              <dd className="text-fg-muted">
                {tcs("A rejection or a returned status fills the summary from `errors` and `errorMessage`.")}
              </dd>
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

      <EntryFooter entryId="form" related={["sections", "field", "input"]} />
    </DocPage>
  );
}
