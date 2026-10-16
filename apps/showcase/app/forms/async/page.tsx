"use client";

import { useRef, useState } from "react";
import {
  Button,
  Card,
  Field,
  Form,
  FormActions,
  FormErrorSummary,
  FormSection,
  type FormErrorItem,
  Input,
  SubmitButton,
  Text,
  toast,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { RelatedApi } from "@/components/docs/related-api";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { FormField, RhfForm } from "@luc/ui/forms/react-hook-form";
import { useForm } from "react-hook-form";
import { useI18n } from "@/lib/i18n/provider";

/** Deterministic mock: no network, no randomness, ~900ms of latency. */
const TAKEN = new Set(["acme", "research", "luc-quant", "admin"]);
async function checkHandle(handle: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return !TAKEN.has(handle.trim().toLowerCase());
}

export default function FormAsyncPage() {
  const { tcs } = useI18n();
  const form = useForm<{ handle: string; workspace: string }>({
    defaultValues: { handle: "", workspace: "" },
  });
  const [available, setAvailable] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"idle" | "failed" | "saved">("idle");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Forms · Async")}
        title="Async validation and submission"
        lead="An availability check, a slow save and a server rejection — all mocked, none of it a network request. The rules are the interesting part: an in-flight check is a quiet status, success is only shown for something that was actually checked, and a rejection is a form-level message."
      />

      <ImportLine line={'import {\n  Field,\n  Form,\n  FormActions,\n  FormErrorSummary,\n  FormSection,\n  Input,\n  SubmitButton,\n} from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Availability check")}
        code={`<FormField
  name="handle"
  control={form.control}
  label="Workspace handle"
  description="Try “acme” or “research” to see a failed check."
  required
  validatingMessage="Checking availability…"
  successMessage="Handle is available"
  rules={{ required: "Pick a handle", minLength: { value: 3, message: "At least three characters" } }}
/>`}
        description={tcs("React Hook Form's async `validate` rule drives the field; `Field` renders the three states. There is no spinner in the middle of the field — just a 14px arc next to a one-line message.")}
        layout="block"
      >

        <Card className="p-5">
          <FormField
            name="handle"
            control={form.control}
            label={tcs("Workspace handle")}
            description={tcs("Try “acme” or “research” to see a failed check.")}
            required
            validatingMessage="Checking availability…"
            successMessage="Handle is available"
            rules={{
              required: "Pick a handle",
              minLength: { value: 3, message: "At least three characters" },
              validate: async (value) => {
                setAvailable(null);
                const free = await checkHandle(value);
                setAvailable(free ? value : null);
                return free ? undefined : "That handle is already taken";
              },
            }}
          >
            {({ controlProps }) => <Input placeholder="momentum-lab" {...controlProps} />}
          </FormField>
          <Text variant="caption" tone="muted" className="mt-3 block">
            last cleared check: <code className="text-fg-secondary">{available ?? "—"}</code>
          </Text>
        </Card>
      </Example>

      <Example
        title={tcs("Slow save, honest failure")}
        code={`<AsyncSubmitForm onOutcome={setOutcome} />`}
        description={tcs("The first submit fails on purpose. The button holds its width, the form keeps the values, and the failure lands in the summary instead of a toast that disappears after four seconds.")}
        layout="block"
      >

        <Card className="p-5">
          <AsyncSubmitForm onOutcome={setOutcome} />
          <Text variant="caption" tone="muted" className="mt-3 block">
            outcome: <code className="text-fg-secondary">{outcome}</code>
          </Text>
        </Card>
      </Example>

      <Example
        title={tcs("A form with no library at all")}
        code={`<PlainAsyncForm />`}
        description={tcs("`Form` owns the lifecycle on its own. Validation here is plain JavaScript, the errors array is prepared by the page, and the summary/focus behaviour is identical to the React Hook Form version.")}
        layout="block"
      >

        <Card className="p-5">
          <PlainAsyncForm />
        </Card>
      </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { Form, FormErrorSummary, SubmitButton } from "@luc/ui/forms";`} />
        <CodeBlock code={`<Form onSubmit={save} errors={errors}>
  <Field label="Run ID">
    <Input name="runId" />
  </Field>
  <FormActions>
    <SubmitButton loadingText="Queueing">Queue run</SubmitButton>
  </FormActions>
</Form>`} label={tcs("Copy the minimal call")} />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs("An async failure is a form-level message: the component renders it in the summary, and the fields keep their own validation messages.")}
        </Text>
      </section>

          <RelatedApi ids={["form", "field", "input"]} />
          <EntryFooter />
    </DocPage>
  );
}

function AsyncSubmitForm({ onOutcome }: { onOutcome: (outcome: "idle" | "failed" | "saved") => void }) {
  const { tcs } = useI18n();
  const form = useForm<{ workspace: string }>({ defaultValues: { workspace: "" } });
  const [attempts, setAttempts] = useState(0);

  return (
    <RhfForm
      form={form}
      fieldLabels={{ workspace: "Workspace name" }}
      onSubmit={async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 900));
        if (attempts === 0) {
          setAttempts(1);
          onOutcome("failed");
          throw new Error("The workspace service is not responding. Your changes are still here.");
        }
        onOutcome("saved");
        toast.success(`Created “${values.workspace}”`);
      }}
    >
      <FormSection title={tcs("Workspace")} description={tcs("Everything else is derived from this name.")} columns={1}>
        <FormField
          name="workspace"
          label={tcs("Workspace name")}
          required
          rules={{ required: "Name the workspace" }}
        >
          {({ controlProps }) => <Input placeholder="Macro research" {...controlProps} />}
        </FormField>
      </FormSection>
      <FormActions>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            form.reset();
            setAttempts(0);
            onOutcome("idle");
          }}
        >
          Reset
        </Button>
        <SubmitButton loadingText="Creating">Create workspace</SubmitButton>
      </FormActions>
    </RhfForm>
  );
}

function PlainAsyncForm() {
  const { tcs } = useI18n();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FormErrorItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Form
      errors={errors}
      onSubmit={async () => {
        const element = inputRef.current;
        if (!element) return "error";
        if (element.value.trim().length < 4) {
          setErrors([
            {
              label: "Workspace name",
              message: "Use at least four characters",
              focus: () => {
                element.focus();
                element.scrollIntoView({ block: "center", behavior: "smooth" });
              },
            },
          ]);
          return "error";
        }
        setErrors([]);
        await new Promise((resolve) => setTimeout(resolve, 700));
        toast.success(`Saved “${element.value}”`);
      }}
    >
      <FormErrorSummary />
      <Field label={tcs("Workspace name")} description={tcs("At least four characters.")} required>
        <Input
          ref={inputRef}
          name="plain-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <FormActions>
        <SubmitButton loadingText="Saving">Save workspace</SubmitButton>
      </FormActions>
    </Form>
  );
}
