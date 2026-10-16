"use client";

/*
 * The body of the Alert page.
 *
 * Six examples, in the order the questions come up: what does each tone look
 * like, when is it an Alert and when is it a Callout, how do the parts compose,
 * what can the reader do about it, when is anything announced, and how does it
 * sit beside a form.
 *
 * What changed in this pass: the handwritten props table became
 * `EntryApiSection` (the compiler's own reading, with `Alert` and `Callout`
 * first and the three parts folded), the "Rules" section became the Guidelines
 * row in `curation/notes.ts`, the `#examples` / `#usage` / `#api` /
 * `#guidelines` anchors are now the standard ones, and three labels that were
 * left in English on the Chinese page ("Where Callouts sit", "Live region
 * honesty") go through the dictionary like the rest of the page.
 */

import { useState, type ReactNode } from "react";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
  Callout,
  Card,
  Field,
  Form,
  FormErrorSummary,
  Heading,
  Inline,
  Input,
  Panel,
  Text,
  toast,
  type FormErrorItem,
} from "@luc/ui";
import { RiExternalLinkLine, RiShieldCheckLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

const TONES_CODE = [
  `<Alert tone="neutral" title="Nothing to report" description="All jobs finished in their window." />`,
  `<Alert tone="info" title="Backfill queued" description="1,284 bars will be ingested." />`,
  `<Alert tone="success" title="Validation passed" description="Seven analytics domains matched." />`,
  `<Alert tone="warning" title="Delayed data" description="Yahoo returned end-of-day prices." />`,
  `<Alert tone="danger" title="Ingestion failed" description="Provider returned 503." />`,
].join("\n");

const EMPHASIS_CODE = [
  `{/* A status message: it happened, or it needs attention. */}`,
  `<Alert tone="warning" title="Warm-up period" description="Sharpe is not meaningful before 60 bars." />`,
  ``,
  `{/* The same surface, declared as persistent context. */}`,
  `<Callout tone="info" title="Third-party data" description="This panel loads resources from TradingView." />`,
].join("\n");

const PARTS_CODE = [
  `<Alert tone="info" icon={null}>`,
  `  <AlertTitle>Rebalance in progress</AlertTitle>`,
  `  <AlertDescription>`,
  `    Orders are queued against the <a href="/docs/api">execution policy</a>.`,
  `  </AlertDescription>`,
  `  <AlertActions>`,
  `    <Button size="sm" variant="secondary">View orders</Button>`,
  `  </AlertActions>`,
  `</Alert>`,
].join("\n");

const LIVE_CODE = [
  `const [warned, setWarned] = useState(false);`,
  ``,
  `<Button onClick={() => setWarned(true)}>Break the connection</Button>`,
  `{warned ? (`,
  `  <Alert`,
  `    tone="danger"`,
  `    live="polite"`,
  `    title="Stream disconnected"`,
  `    description="Reconnect from the toolbar when you are ready."`,
  `  />`,
  `) : null}`,
].join("\n");

export function AlertPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.alert;
  const [dismissed, setDismissed] = useState(false);
  const [errors, setErrors] = useState<FormErrorItem[]>([]);
  const [dataset, setDataset] = useState("");
  const [warned, setWarned] = useState(false);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Feedback")}
        title="Alert and Callout"
        lead="One surface, two intents. An Alert reports a status about something that happened; a Callout explains something persistent. Neither is announced to assistive technology unless you ask for it."
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Five tones")}
          description={tcs(
            "A surface, a semantic edge and a semantic icon — never a flooded panel. These blocks sit beside tables and charts, and a wall of colour destroys the hierarchy.",
          )}
          layout="block"
          code={TONES_CODE}
        >
          <div className="grid w-full gap-3">
            <Alert
              tone="neutral"
              title={tcs("Nothing to report")}
              description={tcs("All scheduled jobs finished within their window.")}
            />
            <Alert
              tone="info"
              title={tcs("Backfill queued")}
              description={tcs("1,284 bars will be ingested for BTCUSDT 1h.")}
            />
            <Alert
              tone="success"
              title={tcs("Validation passed")}
              description={tcs("Seven analytics domains matched their expected row counts.")}
            />
            <Alert
              tone="warning"
              title={tcs("Delayed data")}
              description={tcs("Yahoo returned end-of-day prices for the last two sessions.")}
            />
            <Alert
              tone="danger"
              title={tcs("Ingestion failed")}
              description={tcs("The provider returned 503 for the 04:00 UTC window.")}
              live="assertive"
            />
          </div>
        </Example>

        <Example
          title={tcs("One surface, two intents")}
          description={tcs(
            "`emphasis` is the only difference between the two exports: an Alert is a status about something that happened, a Callout is context that stays. They look alike on purpose — the difference is what the reader is meant to do about it.",
          )}
          layout="grid"
          code={EMPHASIS_CODE}
        >
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted">
              {tcs("Alert · a status")}
            </Text>
            <Alert
              tone="warning"
              title={tcs("Warm-up period")}
              description={tcs("Sharpe is not meaningful before 60 bars of history.")}
            />
          </Card>
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted">
              {tcs("Callout · persistent context")}
            </Text>
            <Callout
              tone="info"
              title={tcs("This benchmark comes from an external provider")}
              description={tcs(
                "Provider data may be delayed or end-of-day depending on the market and your data agreement.",
              )}
            />
          </Card>
        </Example>

        <Example
          title={tcs("Composing the parts")}
          description={tcs(
            "`title` and `description` are shorthand for the common case; the parts compose the same block when it has to hold a link, a list or a custom mark. `icon={null}` drops the mark without dropping the tone.",
          )}
          layout="block"
          code={PARTS_CODE}
        >
          <div className="grid w-full gap-3">
            <Alert tone="info" icon={null}>
              <AlertTitle>{tcs("Rebalance in progress")}</AlertTitle>
              <AlertDescription>
                {tcs("Orders are queued against the")} <a className="underline" href="#examples">{tcs("execution policy")}</a>
                {tcs("; nothing is sent until you confirm.")}
              </AlertDescription>
              <AlertActions>
                <Button size="sm" variant="secondary">
                  {tcs("View orders")}
                </Button>
              </AlertActions>
            </Alert>
            <Alert
              tone="success"
              icon={<RiShieldCheckLine />}
              title={tcs("Signed with your own key")}
              description={tcs("The mark is yours to choose; the tone still comes from the alert.")}
            />
          </div>
        </Example>

        <Example
          title={tcs("Actions and dismissal")}
          description={tcs(
            "Both are opt-in. The component never persists a dismissal, and it never hides an action behind the close button — a reader who dismisses twice should not lose their way back.",
          )}
          layout="grid"
          code={[
            `<Alert tone="danger" title="Widget unavailable"`,
            `  actions={<Button size="sm">Retry</Button>}`,
            `  onDismiss={() => setDismissed(true)} />`,
          ].join("\n")}
        >
          <Panel className="p-5">
            {dismissed ? (
              <Callout
                tone="neutral"
                title={tcs("Widget dismissed")}
                description={tcs("The consumer owns the persistence — LUC does not remember a dismissal.")}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => setDismissed(false)}>
                    {tcs("Bring it back")}
                  </Button>
                }
              />
            ) : (
              <Alert
                tone="danger"
                title={tcs("Market widget unavailable")}
                description={tcs("TradingView could not be reached. The rest of this page is unaffected.")}
                actions={
                  <Button size="sm" variant="secondary" onClick={() => toast(tcs("Retrying the widget"))}>
                    {tcs("Retry")}
                  </Button>
                }
                onDismiss={() => setDismissed(true)}
                dismissLabel={tcs("Dismiss market widget error")}
              />
            )}
          </Panel>
          <Panel className="flex flex-col gap-3 p-5">
            <Text variant="label">{tcs("What the close button means")}</Text>
            <Text variant="caption" tone="muted">
              {tcs(
                "A dismissal is a UI event the caller hears about — persist it, log it, or reopen the alert. The component itself keeps no state, so an alert that returns on the next render is a decision the product made.",
              )}
            </Text>
            <Inline gap="sm">
              <Callout
                tone="warning"
                icon={<RiExternalLinkLine />}
                title={tcs("External resources")}
                description={tcs("This page loads TradingView widgets at runtime.")}
              />
            </Inline>
          </Panel>
        </Example>

        <Example
          title={tcs("When it is announced")}
          description={tcs(
            "`live` is the whole accessibility decision, and `off` is the default: a block that is present when the page loads is already part of the page, and announcing it as an interruption is worse than saying nothing. Press the button — the alert that arrives afterwards announces itself once.",
          )}
          layout="block"
          code={LIVE_CODE}
        >
          <div className="flex w-full flex-col gap-4">
            <Inline gap="sm" align="center" wrap>
              <Button size="sm" variant="secondary" onClick={() => setWarned(true)}>
                {tcs("Break the connection")}
              </Button>
              <Text variant="caption" tone="muted">
                {tcs("live=\"polite\" → role=\"status\"; live=\"assertive\" → role=\"alert\"; off → no role.")}
              </Text>
            </Inline>
            {warned ? (
              <Alert
                tone="danger"
                live="polite"
                title={tcs("Stream disconnected")}
                description={tcs("Reconnect from the toolbar when you are ready; buffered rows are kept.")}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => setWarned(false)}>
                    {tcs("Reconnect")}
                  </Button>
                }
              />
            ) : (
              <Text variant="caption" tone="muted">
                {tcs("Nothing is announced yet — this text is the page, not a message.")}
              </Text>
            )}
          </div>
        </Example>

        <Example
          title={tcs("Next to a form")}
          description={tcs(
            "A page-level Alert and a form's own error summary answer different questions; they can sit together without repeating each other. The field keeps its own error — that is where the reader is looking.",
          )}
          layout="block"
          code={[
            `<Form errors={errors} onSubmit={submit}>`,
            `  <Alert tone="info" title="Server-side validation also runs on submit"`,
            `    description="Client rules are a courtesy; the dataset is validated again." />`,
            `  <FormErrorSummary />`,
            `  <Field label="Dataset name" required description="Lowercase, no spaces.">`,
            `    <Input value={dataset} onChange={change} required pattern="[a-z0-9_]+" />`,
            `  </Field>`,
            `  <Button type="submit">Save dataset</Button>`,
            `</Form>`,
          ].join("\n")}
        >
          <Card className="w-full p-5">
            <Form
              className="flex flex-col gap-5"
              errors={errors}
              onSubmit={async () => {
                if (!/^[a-z0-9_]+$/.test(dataset)) {
                  setErrors([
                    {
                      id: "dataset-name",
                      label: tcs("Dataset name"),
                      message: tcs("Use lowercase letters, digits and underscores"),
                    },
                  ]);
                  return "error";
                }
                setErrors([]);
                await new Promise((resolve) => setTimeout(resolve, 250));
                toast.success(tcs("Dataset saved"));
              }}
            >
              <Alert
                tone="info"
                title={tcs("Server-side validation also runs on submit")}
                description={tcs("Client rules are a courtesy; the stored dataset is validated again.")}
              />
              <FormErrorSummary />
              <Field label={tcs("Dataset name")} required description={tcs("Lowercase, no spaces.")}>
                <Input
                  value={dataset}
                  onChange={(event) => setDataset(event.target.value)}
                  required
                  pattern="[a-z0-9_]+"
                  placeholder="btc_majors_daily"
                />
              </Field>
              <div className="flex justify-end">
                <Button type="submit">{tcs("Save dataset")}</Button>
              </div>
            </Form>
          </Card>
        </Example>
      </section>

      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={`import { Alert, Callout } from "@luc/ui/alert";`} />
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

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="alert" />
    </DocPage>
  );
}
