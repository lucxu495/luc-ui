"use client";

/*
 * The Feedback family overview.
 *
 * The one job a family page has that a component page cannot do: answer *which
 * one*. Feedback is the family where that question is hardest — ten components
 * that all say "something is happening" — so the page leads with a decision
 * table and then makes the three decisions visible side by side:
 *
 *   a wait    · Skeleton (shape known) · Spinner (nothing known) · Progress (size known)
 *   a message · Alert (a status) · Callout (context) · Toast (transient)
 *   an end    · Result (an outcome) · EmptyState (a state)
 *
 * What it deliberately does not do: dump ten API tables. Every member's API is
 * on its own page, and the index at the foot is the way to it.
 */

import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  EmptyState,
  Heading,
  Inline,
  Panel,
  Progress,
  Result,
  Skeleton,
  Spinner,
  StatusBadge,
  Text,
  toast,
} from "@luc/ui";
import { RiInboxLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { DataTable } from "@/components/docs/data-table";
import { useI18n } from "@/lib/i18n/provider";

/** The family's own advice, printed once here rather than on ten pages. */
const USE = [
  "Say what happened, what it means and what the reader can do, in that order — a colour with no sentence is decoration.",
  "Match the volume to the event: a toast for what the reader just did, an alert for what the page is telling them, a result for where a flow ended.",
  "Announce once. A region, a control or the message itself may own the live region, but only one of them should.",
];

const AVOID = [
  "Do not use two components for one message: an alert plus a toast about the same failure reaches a screen reader twice.",
  "Do not show a loading state you cannot name — \"Loading…\" with no subject tells the reader nothing they can act on.",
  "Do not use colour as the only carrier of a state; every status here also has a word, an icon or a shape.",
];

export function FeedbackPage({ members }: { members?: ReactNode }) {
  const { tcs } = useI18n();
  const [progress, setProgress] = useState(38);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Feedback"
        lead="What the product says when something happened, is happening, or did not. Choose the component by what the reader needs to understand, not by how the message feels to write."
      />

      {/*
        * The family's import line. Every member is its own subpath, and the
        * comparison below uses four of them together — which is exactly the list
        * a reader needs in one place before opening ten separate pages.
        */}
      <ImportLine
        line={`import { Progress, Skeleton, SkeletonText, Spinner } from "@luc/ui";\nimport { Toaster, toast } from "@luc/ui/components/toast";`}
      />

      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Which one")}
        </Heading>

        <DataTable
          caption={tcs("Choosing a feedback component")}
          columns={[
            {
              key: "case",
              header: "Situation",
              render: (row: { case: string; use: string; why: string }) => tcs(row.case),
            },
            {
              key: "use",
              header: "Use",
              render: (row: { case: string; use: string; why: string }) => <Code>{row.use}</Code>,
            },
            {
              key: "why",
              header: "Why",
              render: (row: { case: string; use: string; why: string }) => tcs(row.why),
            },
          ]}
          rows={[
            {
              case: "A page or panel whose layout is known",
              use: "Skeleton",
              why: "It preserves the layout, so nothing jumps when the data lands.",
            },
            {
              case: "A small action inside a control",
              use: "Spinner",
              why: "The feedback belongs in the control that was pressed, not across the page.",
            },
            {
              case: "A long job with a measurable size",
              use: "Progress",
              why: "It answers how much longer, which a spinner cannot.",
            },
            {
              case: "A wait whose end is unknown",
              use: "Progress (indeterminate)",
              why: "One sweeping bar for the region, never a screen full of spinners.",
            },
            {
              case: "Something the page must say and keep saying",
              use: "Alert",
              why: "It stays where it is, and it can be announced when it arrives.",
            },
            {
              case: "Context that explains a field or a chart",
              use: "Callout",
              why: "It is static by design and never interrupts.",
            },
            {
              case: "A confirmation the reader just caused",
              use: "Toaster",
              why: "It leaves on its own, so it does not occupy the layout.",
            },
            {
              case: "Nothing here yet, and what to do about it",
              use: "EmptyState",
              why: "A state the page sits in, with the action that fills it.",
            },
            {
              case: "The outcome of a flow",
              use: "Result",
              why: "It *is* the page a submit, an import or a failure ended on.",
            },
            {
              case: "A state that has a word",
              use: "StatusBadge",
              why: "The word is the accessible carrier; the colour is the fast one.",
            },
            {
              case: "Messages that accumulated while the reader was away",
              use: "NotificationCenter",
              why: "An inbox with read state, not a queue that expires.",
            },
            {
              case: "A surface the reader has not learned yet",
              use: "GuidedTour",
              why: "It points at the real thing instead of describing it.",
            },
          ]}
        />

        <Example
          title={tcs("A wait: three shapes")}
          description={tcs(
            "The same job, three honest answers. A skeleton when the shape is known, a spinner when nothing is, a bar when the size is. They are not interchangeable and they are not a progression.",
          )}
          layout="grid"
          stageClassName="lg:grid-cols-3"
          code={`<SkeletonText lines={3} />\n<Spinner size={20} label={null} />\n<Progress value={38} aria-label="Position ingest" />`}
        >
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Shape known · Skeleton")}
            </Text>
            <Skeleton variant="text" className="h-3.5 w-32" />
            <Skeleton variant="text" className="h-3.5 w-40" />
            <Skeleton className="h-14" />
          </Card>
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Nothing known · Spinner")}
            </Text>
            <Inline gap="sm" align="center">
              <Spinner size={20} label={null} />
              <Text variant="caption" tone="muted" as="p">
                {tcs("Validating the universe…")}
              </Text>
            </Inline>
          </Card>
          <Card variant="outline" className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Size known · Progress")}
            </Text>
            <Inline justify="between" className="w-full">
              <Text variant="caption" tone="muted" as="p">
                {tcs("18 of 44 sectors")}
              </Text>
              <Text variant="caption" tone="muted" as="p" className="luc-numeric">
                {progress} %
              </Text>
            </Inline>
            <Progress value={progress} aria-label={tcs("Sector ingest")} />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setProgress((current) => (current + 12 > 100 ? 12 : current + 12))}
            >
              {tcs("Advance the job")}
            </Button>
          </Card>
        </Example>

        <Example
          title={tcs("A message: three volumes")}
          description={tcs(
            "An Alert is a status the page is telling the reader, a Callout is context that stays true, and a toast is something they just caused. Press the button: only the toast leaves on its own.",
          )}
          layout="block"
          code={`<Alert tone="warning" title="Warm-up period" description="Sharpe is not meaningful before 60 bars." />\n<Callout tone="info" title="Third-party data" description="This panel loads TradingView widgets." />\ntoast.success("Dataset saved", { description: "Validate it from the pipeline page." });`}
        >
          <div className="flex w-full flex-col gap-3">
            <Card variant="outline" className="p-4">
              <Inline gap="sm" align="start" wrap>
                <span className="w-40 shrink-0 text-caption text-fg-muted">{tcs("Alert · a status")}</span>
                <div className="min-w-0 flex-1">
                  <Inline gap="sm" align="center">
                    <Badge tone="warning" size="sm" dot>
                      {tcs("warning")}
                    </Badge>
                    <Text variant="caption" tone="secondary" as="p">
                      {tcs("Sharpes before 60 bars are not meaningful; the panel says so above the plot.")}
                    </Text>
                  </Inline>
                </div>
              </Inline>
            </Card>
            <Card variant="outline" className="p-4">
              <Inline gap="sm" align="start" wrap>
                <span className="w-40 shrink-0 text-caption text-fg-muted">
                  {tcs("Callout · context")}
                </span>
                <Text variant="caption" tone="secondary" as="p" className="min-w-0 flex-1">
                  {tcs("This benchmark comes from an external provider and may be end-of-day.")}
                </Text>
              </Inline>
            </Card>
            <Card variant="outline" className="flex flex-wrap items-center gap-3 p-4">
              <span className="w-40 shrink-0 text-caption text-fg-muted">
                {tcs("Toast · transient")}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast.success(tcs("Dataset saved"), { description: tcs("Validate it from the pipeline page.") })
                }
              >
                {tcs("Save the dataset")}
              </Button>
            </Card>
          </div>
        </Example>

        <Example
          title={tcs("An end: Result or EmptyState")}
          description={tcs(
            "A Result answers “this is what happened when you pressed the button”; an EmptyState answers “there is nothing here yet”. They look alike and are not: one is an outcome, the other is a state a page sits in.",
          )}
          layout="grid"
          code={`<Result status="success" title="Import finished" description="1,284 bars written." />\n<EmptyState icon={<RiInboxLine />} title="No runs yet" description="Start one from the toolbar." />`}
        >
          <Card variant="outline" className="p-2">
            <Result
              size="sm"
              status="success"
              titleAs="p"
              title={tcs("Import finished")}
              description={tcs("1,284 bars were written for BTCUSDT 1h.")}
              extra={
                <Button size="sm" variant="secondary">
                  {tcs("Open the dataset")}
                </Button>
              }
            />
          </Card>
          <Card variant="outline" className="p-2">
            <EmptyState
              size="sm"
              icon={<RiInboxLine />}
              title={tcs("No runs yet")}
              description={tcs("Start one from the toolbar and its artifacts appear here.")}
              action={
                <Button size="sm" variant="secondary">
                  {tcs("New run")}
                </Button>
              }
            />
          </Card>
        </Example>

        <Example
          title={tcs("A state, and its history")}
          description={tcs(
            "A badge says what is true now; the inbox says what happened while the reader was elsewhere. The badge is not an announcement, and the inbox is not a status.",
          )}
          layout="block"
          code={`<StatusBadge status="degraded" />\n<NotificationCenter items={items} onRead={markRead} label="Notifications" />`}
        >
          <Panel className="flex w-full flex-wrap items-center gap-4 p-4">
            <Inline gap="sm" align="center">
              <Text variant="caption" tone="muted" as="p">
                {tcs("Now")}
              </Text>
              <StatusBadge status="degraded" />
              <StatusBadge status="live" />
            </Inline>
            <Text variant="caption" tone="muted" as="p">
              {tcs(
                "The badge reads as a word, carries no live region, and never expires — the panel behind the bell is where yesterday's message is still waiting.",
              )}
            </Text>
          </Panel>
        </Example>
      </section>

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards use={USE} avoid={AVOID} tcs={tcs} />
        <Card variant="outline" className="gap-2 p-4">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Accessibility, said once for the family")}
          </Text>
          <Text variant="caption" tone="secondary" as="p" className="max-w-[68ch]">
            {tcs(
              "Exactly one element should announce a message. A static block renders no role until its author asks for one (`live=\"polite\"` on an Alert), a spinner is silent when an ancestor already says it is busy (`label={null}`), a skeleton is a picture and never announced at all (`aria-hidden`, with `aria-busy` on the region), and a toast is announced by Sonner's single viewport rather than by each toast. Colour is never the only carrier: every component in this family also states the state in words, and the two moving indicators (a live dot, an indeterminate sweep) slow to a pulse under `prefers-reduced-motion` instead of freezing, because a frozen indicator reads as a bug.",
            )}
          </Text>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="members">
          {tcs("Every component in this family")}
        </Heading>
        {members}
      </section>
    </DocPage>
  );
}
