"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Field,
  FieldArray,
  FieldGroup,
  Fieldset,
  Form,
  FormActions,
  FormSection,
  Input,
  Radio,
  RadioGroup,
  SegmentedControl,
  SegmentedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  Textarea,
  toast,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { RelatedApi } from "@/components/docs/related-api";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { useI18n } from "@/lib/i18n/provider";

interface Endpoint {
  id: number;
  label: string;
  url: string;
}

export default function FormSectionsPage() {
  const { tcs } = useI18n();
  const [tab, setTab] = useState("profile");
  const [digest, setDigest] = useState("daily");
  const [retries, setRetries] = useState(true);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    { id: 1, label: "Primary", url: "https://api.acme.dev/research" },
    { id: 2, label: "Failover", url: "https://eu.api.acme.dev/research" },
  ]);
  const [nextId, setNextId] = useState(3);

  const move = (from: number, to: number) => {
    setEndpoints((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      if (!item) return current;
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Forms · Sections")}
        title="Sections and repeating groups"
        lead="A long form is a document: sections with real headings, fieldsets for the questions that need one, and repeating rows with add, remove and reorder. The chrome is LUC&apos;s; the array lives in your state — or in `useFieldArray`."
      />

      <ImportLine line={'import { FieldArray, FormSection } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("A sectioned settings form")}
        code={`<Form onSubmit={save}>
  <SegmentedControl value={tab} onValueChange={setTab}>
    <SegmentedItem value="profile">Profile</SegmentedItem>
    <SegmentedItem value="delivery">Delivery</SegmentedItem>
    <SegmentedItem value="security">Security</SegmentedItem>
  </SegmentedControl>

  <FormSection title="Profile" columns={2}>…</FormSection>
</Form>`}
        description={tcs("Tabs switch sections without pretending to be navigation: the form is one surface, and each tab is a Chapter of it.")}
        layout="block"
      >

        <Card className="p-5">
          <Form
            onSubmit={async () => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              toast.success("Settings saved");
            }}
          >
            <SegmentedControl value={tab} onValueChange={(next) => next && setTab(next)}>
              <SegmentedItem value="profile">Profile</SegmentedItem>
              <SegmentedItem value="delivery">Delivery</SegmentedItem>
              <SegmentedItem value="security">Security</SegmentedItem>
            </SegmentedControl>

            {tab === "profile" ? (
              <FormSection
                title={tcs("Profile")}
                description={tcs("How this workspace appears in reports and shares.")}
                columns={2}
              >
                <Field label={tcs("Workspace")} required>
                  <Input defaultValue="Macro research" required />
                </Field>
                <Field label={tcs("Short name")} description={tcs("Used in chart legends.")}>
                  <Input defaultValue="MACRO" />
                </Field>
                <Field label={tcs("Default currency")} className="md:col-span-2">
                  <Select defaultValue="USD">
                    <SelectTrigger aria-label="Default currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">US dollar</SelectItem>
                      <SelectItem value="EUR">Euro</SelectItem>
                      <SelectItem value="JPY">Japanese yen</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FormSection>
            ) : null}

            {tab === "delivery" ? (
              <div className="flex flex-col gap-6">
                <FormSection title={tcs("Digest")} description={tcs("What lands in the inbox, and how often.")} columns={2}>
                  <Fieldset legend="Frequency">
                    <RadioGroup value={digest} onValueChange={setDigest} aria-label="Digest frequency">
                      <Radio value="daily" label={tcs("Every trading day")} />
                      <Radio value="weekly" label={tcs("Weekly summary")} />
                      <Radio value="monthly" label={tcs("Monthly summary")} />
                    </RadioGroup>
                  </Fieldset>
                  <Field label={tcs("Send at")} description={tcs("In the workspace time zone.")}>
                    <Input type="time" defaultValue="07:30" />
                  </Field>
                </FormSection>

                <Fieldset
                  legend="Endpoints"
                  description={tcs("Tried in order; the first healthy one wins.")}
                >
                  <FieldArray
                    legend="Webhook endpoints"
                    count={endpoints.length}
                    onAdd={() => {
                      setEndpoints((current) => [
                        ...current,
                        { id: nextId, label: `Endpoint ${current.length + 1}`, url: "" },
                      ]);
                      setNextId((current) => current + 1);
                    }}
                    onRemove={(index) =>
                      setEndpoints((current) => current.filter((_, position) => position !== index))
                    }
                    onMove={move}
                    addLabel="Add endpoint"
                  >
                    {endpoints.map((endpoint, index) => (
                      <FieldGroup key={endpoint.id} columns={2}>
                        <Field label={`Label ${index + 1}`}>
                          <Input
                            defaultValue={endpoint.label}
                            onChange={(event) =>
                              setEndpoints((current) =>
                                current.map((item) =>
                                  item.id === endpoint.id ? { ...item, label: event.target.value } : item,
                                ),
                              )
                            }
                          />
                        </Field>
                        <Field label={tcs("URL")}>
                          <Input
                            defaultValue={endpoint.url}
                            placeholder="https://…"
                            onChange={(event) =>
                              setEndpoints((current) =>
                                current.map((item) =>
                                  item.id === endpoint.id ? { ...item, url: event.target.value } : item,
                                ),
                              )
                            }
                          />
                        </Field>
                      </FieldGroup>
                    ))}
                  </FieldArray>
                </Fieldset>
              </div>
            ) : null}

            {tab === "security" ? (
              <FormSection title={tcs("Security")} description={tcs("Two-factor policy for this workspace.")} columns={1}>
                <Fieldset legend="Recovery" description={tcs("How members regain access.")}>
                  <div className="flex flex-col gap-3">
                    <Switch
                      checked={retries}
                      onCheckedChange={setRetries}
                      label={tcs("Allow retrying a code three times")}
                      description={tcs("After that, the member must use a recovery code.")}
                    />
                    <Field label={tcs("Recovery contact")} description={tcs("A shared inbox, not a personal address.")}>
                      <Input placeholder="security@acme.dev" />
                    </Field>
                  </div>
                </Fieldset>
                <Field label={tcs("Audit note")} description={tcs("Added to the audit log when settings change.")}>
                  <Textarea rows={3} placeholder={tcs("Why is this changing?")} />
                </Field>
              </FormSection>
            ) : null}

            <FormActions sticky>
              <Text variant="caption" tone="muted" className="mr-auto">
                {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"} configured
              </Text>
              <Button type="reset" variant="ghost">
                Discard
              </Button>
              <Button type="submit" variant="primary">
                Save settings
              </Button>
            </FormActions>
          </Form>
        </Card>
      </Example>

      <Example
        title={tcs("Density without losing touch targets")}
        code={`<div data-density="compact" className="grid gap-3 md:grid-cols-3">
  <Field label="Symbol"><Input size="sm" defaultValue="BTC-USD" /></Field>
  <Field label="Weight"><Input size="sm" defaultValue="4.5%" /></Field>
  <Field label="Cap"><Input size="sm" defaultValue="250000" /></Field>
</div>`}
        description={tcs("A form can be dense; it must not be small. Compact spacing changes the gap between rows, never the size of a control.")}
        layout="block"
      >

        <div data-density="compact" className="grid gap-3 rounded-lg border border-line-subtle p-4 md:grid-cols-3">
          <Field label={tcs("Symbol")}>
            <Input size="sm" defaultValue="BTC-USD" />
          </Field>
          <Field label={tcs("Weight")}>
            <Input size="sm" defaultValue="4.5%" />
          </Field>
          <Field label={tcs("Cap")}>
            <Input size="sm" defaultValue="250000" />
          </Field>
        </div>
      </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { FieldArray, FormSection } from "@luc/ui/forms";`} />
        <CodeBlock code={`<FormSection title="Universe" description="Which instruments are in scope." columns={2}>
  <Field label="Sector">
    <Input defaultValue="Technology" />
  </Field>
</FormSection>`} label={tcs("Copy the minimal call")} />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs("A section is a heading and a description; the fields inside own their own labels, and the grid collapses to one column on a narrow screen.")}
        </Text>
      </section>

          <RelatedApi ids={["form", "sections", "input"]} />
          <EntryFooter />
    </DocPage>
  );
}
