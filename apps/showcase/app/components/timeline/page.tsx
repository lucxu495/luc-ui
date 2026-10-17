"use client";

import { Badge, Button, Card, Section, Stepper, Text, Timeline } from "@luc/ui";
import { useState } from "react";
import { RiCheckLine, RiDatabase2Line, RiErrorWarningLine, RiLoader4Line } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

export default function TimelinePage() {
  const { tc, tcs } = useI18n();
  const [step, setStep] = useState(1);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="Timeline and Stepper" lead={tc("components.timeline.lead")} />
      <ExamplesHeading />

      <ImportLine line={'import { Timeline } from "@luc/ui";'} />

      <Example
        title={tc("components.timeline.run.title")}
        description={tc("components.timeline.run.lead")}
        layout="block"
        code={'<Timeline items={runs} />'}
      >

        <div className="grid gap-5 lg:grid-cols-2">
          <Card variant="outline" className="p-4">
            <Timeline
              items={[
                {
                  id: "ingest",
                  title: "Ingest",
                  description: tcs("1,284 bars written for BTCUSDT 1h"),
                  meta: "04:00",
                  tone: "positive",
                  icon: <RiCheckLine />,
                },
                {
                  id: "analytics",
                  title: "Analytics",
                  description: "Seven domains validated",
                  meta: "04:12",
                  tone: "positive",
                  icon: <RiCheckLine />,
                },
                {
                  id: "materialize",
                  title: "Materialize",
                  description: tcs("Serving generation 1284 built and published"),
                  meta: "12m 04s",
                  tone: "accent",
                  icon: <RiDatabase2Line />,
                },
                {
                  id: "research",
                  title: "Research pass",
                  description: tcs("Waiting for the analytics window"),
                  meta: "queued",
                  tone: "neutral",
                  icon: <RiLoader4Line className="luc-spinner" data-motion-essential="" />,
                  muted: true,
                },
                {
                  id: "notify",
                  title: "Notify",
                  description: tcs("Lark delivery failed — retrying"),
                  meta: "attempt 2 / 5",
                  tone: "warning",
                  icon: <RiErrorWarningLine />,
                },
              ]}
            />
          </Card>
          <Card variant="outline" className="p-4">
            <Timeline
              density="compact"
              variant="plain"
              items={[
                { id: "a", title: "Schema applied", meta: "10:02", tone: "positive" },
                { id: "b", title: "Backfill queued", meta: "10:04", tone: "info" },
                { id: "c", title: "Rows written", meta: "10:31", tone: "positive" },
                { id: "d", title: "Parity check clean", meta: "10:36", tone: "positive" },
                { id: "e", title: "Serving switched", meta: "10:41", tone: "accent" },
              ]}
            />
          </Card>
        </div>
      </Example>

      <Example
        title={tc("components.timeline.stepper.title")}
        description={tc("components.timeline.stepper.lead")}
        layout="block"
        code={'<Stepper steps={steps} current={step} onStepSelect={setStep} />'}
      >

        <Card variant="outline" className="flex flex-col gap-5 p-5">
          {/*
           * A horizontal stepper is a row by design — four labelled steps are
           * ~434px wide — so at 390px the frame scrolls the specimen rather than
           * the reader scrolling the page. The generated `/components` catalogue
           * preview of the same component has carried this since the stepper was
           * written; this page's own copy of it had not, which is why the mobile
           * overflow sweep reported +106px here and nowhere else.
           */}
          <div className="min-w-0 overflow-x-auto">
            <Stepper
              steps={[
                { id: "account", label: "Account", description: "Identity and roles" },
                { id: "dataset", label: "Dataset", description: tcs("What is in scope") },
                { id: "schedule", label: "Schedule", description: "When it runs" },
                { id: "review", label: "Review", description: "Confirm and publish" },
              ]}
              current={step}
              onStepSelect={setStep}
            />
          </div>
          <div className="h-px bg-line-subtle" />
          <Stepper
            orientation="vertical"
            steps={[
              { id: "v1", label: "Connect provider" },
              { id: "v2", label: "Map instruments" },
              { id: "v3", label: "Validate parity" },
            ]}
            current={2}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))}>
              Back
            </Button>
            <Button size="sm" onClick={() => setStep((current) => Math.min(3, current + 1))}>
              Continue
            </Button>
            <Text variant="caption" tone="muted">
              {tc("components.timeline.stepperNote")}
            </Text>
            <Badge tone="info" size="sm">
              step {step + 1} / 4
            </Badge>
          </div>
        </Card>
      </Example>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Timeline items", type: "TimelineItem[]", description: tcs("title, description, meta, detail, tone, icon, muted.") },
            { name: "Timeline variant", type: '"rail" | "plain"', default: '"rail"', description: tcs("Draw the connector, or a bare sequence.") },
            { name: "Timeline density", type: '"default" | "compact"', default: '"default"', description: tcs("Compact for a log surface.") },
            { name: "Stepper steps", type: "StepperStep[]", description: tcs("id, label, description, and an optional explicit complete.") },
            { name: "Stepper current", type: "number", description: tcs("Zero-based. Only steps at or before it are interactive.") },
            { name: "Stepper orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: tcs("A form header, or a sidebar checklist.") },
          ]}
        />
      </Section>
      <EntryNotes entryIds={["timeline"]} />
      <EntryFooter />
    </DocPage>
  );
}
