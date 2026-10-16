"use client";

import { useRef } from "react";
import {
  Button,
  Card,
  Fieldset,
  FormActions,
  Input,
  SubmitButton,
  Switch,
  Text,
  Textarea,
  toast,
} from "@luc/ui";
import { useForm } from "react-hook-form";
import { FormField, RhfForm } from "@luc/ui/forms/react-hook-form";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { RelatedApi } from "@/components/docs/related-api";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { useI18n } from "@/lib/i18n/provider";

interface ResearchSpec {
  name: string;
  symbol: string;
  lookback: string;
  notes: string;
  allowShorts: boolean;
}

const SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "SPX", "DXY"];

/**
 * Validation placement, demonstrated with React Hook Form.
 *
 * Field errors render next to the field (LUC `Field`), a form-level failure
 * renders in `FormErrorSummary`, and a successful save is the only thing that
 * gets a toast. Nothing here validates with a toast.
 */
export default function FormValidationPage() {
  const { tcs } = useI18n();
  const form = useForm<ResearchSpec>({
    defaultValues: {
      name: "",
      symbol: "",
      lookback: "",
      notes: "",
      allowShorts: false,
    },
  });

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Forms · Validation")}
        title="Validation"
        lead="Every message has one home. Required and format errors sit under the field, a failed submit produces a summary with links back to the offending fields, and the server's own failure is a form-level message — not a toast that vanishes."
      />

      <ImportLine line={'import { Fieldset, FormActions, Input, SubmitButton, Switch, Textarea } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Field rules, field messages")}
        code={`<RhfForm form={form} fieldLabels={labels} onSubmit={save}>
  <FormField name="name" label="Study name" rules={{ required: "Give the study a name" }} />
  <FormField
    name="symbol"
    label="Instrument"
    rules={{ validate: (value) => (SYMBOLS.includes(value) ? undefined : "Unsupported instrument") }}
  >
    {({ controlProps }) => <Input placeholder="BTC-USD" {...controlProps} />}
  </FormField>
  <FormField
    name="lookback"
    label="Lookback (days)"
    description="Whole days between 5 and 400."
    rules={{ required: "Enter a lookback" }}
  />
</RhfForm>`}
        description={tcs("Required, minimum length, numeric shape and cross-field rules all report through the same `error` slot, so the form never grows four different error styles.")}
        layout="block"
      >

        <Card className="p-5">
          <RhfForm
            form={form}
            fieldLabels={{ name: "Study name", symbol: "Instrument", lookback: "Lookback" }}
            onSubmit={async (values) => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              toast.success(`Saved “${values.name}”`);
            }}
          >
            <div className="flex flex-col gap-5">
              <FormField
                name="name"
                label={tcs("Study name")}
                description={tcs("A short, unique label for this research spec.")}
                required
                validatingMessage="Checking the name…"
                successMessage="Name is available"
                rules={{
                  required: "Give the study a name",
                  minLength: { value: 4, message: "Use at least four characters" },
                  validate: (value) =>
                    value.trim().toLowerCase().startsWith("test")
                      ? tcs("Reserve “test…” for throwaway work")
                      : undefined,
                }}
              >
                {({ controlProps }) => <Input placeholder="Momentum, 1h, 30d" {...controlProps} />}
              </FormField>

              <FormField
                name="symbol"
                label={tcs("Instrument")}
                description={`One of ${SYMBOLS.join(", ")}.`}
                required
                rules={{
                  required: "Choose an instrument",
                  validate: (value) =>
                    SYMBOLS.includes(value) ? undefined : "This demo only supports the listed instruments",
                }}
              >
                {({ controlProps }) => <Input placeholder="BTC-USD" list="validation-symbols" {...controlProps} />}
              </FormField>
              <datalist id="validation-symbols">
                {SYMBOLS.map((symbol) => (
                  <option key={symbol} value={symbol} />
                ))}
              </datalist>

              <FormField
                name="lookback"
                label={tcs("Lookback (days)")}
                description={tcs("Whole days between 5 and 400.")}
                required
                rules={{
                  required: "Enter a lookback",
                  validate: (value) => {
                    const parsed = Number(value);
                    if (!Number.isInteger(parsed)) return "Use a whole number of days";
                    if (parsed < 5 || parsed > 400) return "Between 5 and 400 days";
                    return undefined;
                  },
                }}
              >
                {({ controlProps }) => <Input inputMode="numeric" placeholder="30" {...controlProps} />}
              </FormField>

              <Fieldset legend="Direction" description={tcs("Cross-field rules read from the same form state.")}>
                <FormField name="allowShorts" label={tcs("Allow short positions")}>
                  {({ value, onValueChange }) => (
                    /*
                     * No `label` on the switch: `FormField` already renders one
                     * and binds it to the control's id, so a second visible label
                     * printed the same words twice in a row (the manual review's
                     * finding on this page). The switch keeps its accessible name
                     * from the field's label.
                     */
                    <Switch checked={Boolean(value)} onCheckedChange={onValueChange} />
                  )}
                </FormField>
              </Fieldset>

              <FormField
                name="notes"
                label={tcs("Notes")}
                description={tcs("Optional. Anything a future reader needs.")}
              >
                {({ controlProps }) => <Textarea rows={3} placeholder="Why this lookback?" {...controlProps} />}
              </FormField>
            </div>

            <FormActions>
              <Button type="reset" variant="ghost" onClick={() => form.reset()}>
                Reset
              </Button>
              <SubmitButton loadingText="Saving">Save study</SubmitButton>
            </FormActions>
          </RhfForm>
        </Card>
      </Example>

      <Example
        title={tcs("Server errors are form-level")}
        code={`<ServerErrorDemo />`}
        description={tcs("When the save itself fails, the message belongs to the form. The demo throws on the second attempt so you can see the difference between validation and rejection.")}
        layout="block"
      >

        <Card className="p-5">
          <ServerErrorDemo />
        </Card>
      </Example>
          </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { FormField, RhfForm } from "@luc/ui/forms/react-hook-form";'} />
        <CodeBlock
          code={`<RhfForm form={form} fieldLabels={{ name: "Study name" }} onSubmit={save}>
  <FormField name="name" label="Study name" rules={{ required: "Give the study a name" }}>
    {({ controlProps }) => <Input {...controlProps} />}
  </FormField>
  <FormActions>
    <SubmitButton loadingText="Saving">Save study</SubmitButton>
  </FormActions>
</RhfForm>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`FormField` takes a `name`, a `label` and the engine's `rules`; `fieldLabels` names the fields inside the error summary, because a summary that lists `symbol` instead of “Instrument” is a summary nobody can act on.",
          )}
        </Text>
      </section>

      <RelatedApi ids={["form", "field", "input"]} />

      {/*
        * Guidelines — the one thing a reader gets wrong here, stated once.
        *
        * This used to be a loose `Section` sitting between two runnable
        * specimens ("The summary is not decoration"): it is guidance, so it
        * belongs with the guidance rather than in the middle of the examples.
        */}
      <section className="flex flex-col gap-3">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Every message has one home: a field rule reports under its field, a failed submit fills the summary — which appears only after an attempt, never while the form is still being filled in — and a rejected save is a form-level message. Nothing here validates with a toast.",
          )}
        </Text>
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Field messages come from the form engine; the summary is LUC's, and a plain form renders it by passing its own errors array.",
          )}
        </Text>
      </section>

      <EntryFooter />
    </DocPage>
  );
}

function ServerErrorDemo() {
  const { tcs } = useI18n();
  const form = useForm<{ runId: string }>({ defaultValues: { runId: "" } });
  const attempts = useRef(0);

  return (
    <RhfForm
      form={form}
      fieldLabels={{ runId: "Run ID" }}
      onSubmit={async (values) => {
        attempts.current += 1;
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (attempts.current < 2) {
          throw new Error(`No run matching “${values.runId || "any"}” could be queued`);
        }
        toast.success("Queued");
      }}
    >
      <div className="flex flex-col gap-4">
        <FormField name="runId" label={tcs("Run ID")} description={tcs("Try any value — the first submit always fails.")}>
          {({ controlProps }) => <Input placeholder="run_2026_09_26" {...controlProps} />}
        </FormField>
      </div>
      <FormActions>
        <SubmitButton loadingText="Queueing">Queue run</SubmitButton>
      </FormActions>
    </RhfForm>
  );
}
