/*
 * Live Demos — Feedback.
 *
 * `progress`, `spinner`, `skeleton`, `result`, `guided-tour`.
 *
 * All five are compositions rather than structured demos, and for the same
 * reason each time: the thing worth showing is a *state* the caller owns. A bar
 * that is progressing, a button that is busy, a placeholder that is replaced by
 * the row it reserved, an outcome with two actions, a tour that is open — none of
 * those is a function of one props object, so each is a client island with the
 * code beside it.
 */

import {
  Button,
  Card,
  Inline,
  Panel,
  Progress,
  Result,
  Skeleton,
  SkeletonText,
  Spinner,
  StatusBadge,
  Text,
} from "@luc/ui";
import { ProgressDemo } from "@/components/demo/islands/progress-demo";
import { SkeletonDemo } from "@/components/demo/islands/skeleton-demo";
import { SpinnerDemo } from "@/components/demo/islands/spinner-demo";
import { GuidedTourDemo } from "@/components/demo/islands/c-guided-tour";
import { composition, type DemoSpec } from "../index";

/** A labelled bar: the component draws the track, the caller writes the number. */
function LabelledBar({
  label,
  value,
  tone,
  size,
}: {
  label: string;
  value?: number;
  tone?: "accent" | "positive" | "negative" | "warning";
  size?: "sm" | "md";
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Inline justify="between" className="w-full">
        <Text variant="caption" tone="secondary" as="p">
          {label}
        </Text>
        <Text variant="caption" tone="muted" as="p" className="luc-numeric">
          {value === undefined ? "—" : `${value} %`}
        </Text>
      </Inline>
      <Progress
        {...(value === undefined ? {} : { value })}
        {...(tone === undefined ? {} : { tone })}
        {...(size === undefined ? {} : { size })}
        aria-label={label}
      />
    </div>
  );
}

export const feedbackDemos: readonly DemoSpec[] = [
  /*
   * Progress.
   *
   * The page used to show one bar at 62 per cent, which answers "what does it
   * look like" and none of the questions a reader arrives with. The specimen is
   * now a job the reader starts, pauses and resets, and the configurations beside
   * it cover the two ends, the indeterminate mode, the size and tone scales, and
   * the row a real ingest queue puts a bar in.
   */
  composition({
    id: "progress",
    title: "A bar that is actually progressing",
    node: <ProgressDemo />,
    code: `const [value, setValue] = useState(62);\n\n<Progress value={value} aria-label="Sector ingest" />`,
    layout: "block",
    note: "The value lives in the caller, and the bar's own width transition is what moves — no second animation is written beside the component.",
    examples: [
      {
        title: "At the ends, and in the middle",
        node: (
          <div className="flex w-full max-w-md flex-col gap-4">
            <LabelledBar label="Not started" value={0} />
            <LabelledBar label="Running" value={62} />
            <LabelledBar label="Finished" value={100} tone="positive" />
          </div>
        ),
        code: `<Progress value={0} aria-label="Not started" />
<Progress value={62} aria-label="Running" />
<Progress value={100} tone="positive" aria-label="Finished" />`,
        layout: "block",
        note: "Zero is a value, not an absence: a bar at 0 per cent is determinate and announces `aria-valuenow=\"0\"`.",
      },
      {
        title: "Indeterminate",
        node: (
          <div className="flex w-full max-w-md flex-col gap-4">
            <LabelledBar label="Reconnecting to the stream" />
            <LabelledBar label="Connecting to the provider" tone="warning" size="sm" />
          </div>
        ),
        code: `{/* No value: the sweep, and no aria-valuenow to lie about. */}
<Progress aria-label="Reconnecting to the stream" />`,
        layout: "block",
        note: "Omitting `value` is the honest answer when the length is genuinely unknown — and it is the one mode where the component owns the motion.",
      },
      {
        title: "Two sizes, four tones",
        node: (
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <LabelledBar label="Ingest · accent · md" value={48} />
            <LabelledBar label="Validated · positive · md" value={91} tone="positive" />
            <LabelledBar label="Quota · warning · sm" value={78} tone="warning" size="sm" />
            <LabelledBar label="Rejected · negative · sm" value={12} tone="negative" size="sm" />
          </div>
        ),
        code: `<Progress value={48} aria-label="Ingest" />
<Progress value={91} tone="positive" aria-label="Validated" />
<Progress value={78} tone="warning" size="sm" aria-label="Quota" />
<Progress value={12} tone="negative" size="sm" aria-label="Rejected" />`,
        layout: "block",
        note: "`size` is the bar's height, not the label's: `sm` is the one that fits inside a table row or a toolbar.",
      },
      {
        title: "In a task row",
        node: (
          <Card variant="outline" className="flex w-full max-w-xl flex-col gap-3 p-4">
            <Inline justify="between" align="center" className="w-full">
              <Inline gap="sm" align="center">
                <Text variant="label" as="p">
                  Sector ingest
                </Text>
                <StatusBadge status="pending" size="sm" />
              </Inline>
              <Text variant="caption" tone="muted" as="p">
                18 of 44 sectors · about 6 minutes left
              </Text>
            </Inline>
            <Progress value={41} aria-label="Sector ingest" />
            <Inline justify="between" className="w-full">
              <Text variant="caption" tone="muted" as="p">
                Started 12:04 UTC · writes to luc-data/research
              </Text>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </Inline>
          </Card>
        ),
        code: `<Progress value={41} aria-label="Sector ingest" />`,
        layout: "block",
        note: "Where a bar actually lives: beside a status and a sentence about what is running, with the action that stops it.",
      },
    ],
  }),

  /*
   * Spinner.
   *
   * The specimen is a button that really becomes busy, because that is where a
   * spinner is usually found and where the accessibility question is decided:
   * the button announces the wait, so the spinner inside it must not announce it
   * a second time.
   */
  composition({
    id: "spinner",
    title: "A spinner inside the control that is waiting",
    node: <SpinnerDemo />,
    code: `const [busy, setBusy] = useState(false);\n\n<Button loading={busy} loadingLabel={t("rebalancing")} onClick={run}>\n  {t("rebalance.portfolio")}\n</Button>\n\n{/* What \`loading\` renders for you: */}\n<Spinner size={16} label={null} />`,
    layout: "block",
    note: "`loading` keeps the label, sets `aria-busy`, blocks a second press and renders a spinner with `label={null}` — so the wait is announced once, by the button.",
    examples: [
      {
        title: "Five sizes",
        node: (
          <Inline gap="lg" align="center">
            {([14, 16, 18, 20, 24] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <Spinner size={size} label={null} />
                <Text variant="micro" tone="muted" as="p" className="luc-numeric">
                  {size}
                </Text>
              </div>
            ))}
          </Inline>
        ),
        code: `<Spinner size={16} label={null} />`,
        layout: "block",
        note: "The scale is the library's own: 16 inside a control, 24 in a panel header, and nothing in between invented locally.",
      },
      {
        title: "One announcement, not two",
        node: (
          <Panel className="flex w-full max-w-md flex-col gap-3 p-4" aria-busy="true">
            <Inline gap="sm" align="center">
              <Spinner size={16} label={null} />
              <Text variant="label" as="p">
                Loading the last 30 days
              </Text>
            </Inline>
            <SkeletonText lines={2} />
          </Panel>
        ),
        code: `<Panel aria-busy="true">
  <Spinner size={16} label={null} />
  <span>Loading the last 30 days</span>
</Panel>`,
        layout: "block",
        note: "A region that is already announcing its own wait passes `label={null}`: the spinner is then a picture of the wait rather than a second live region.",
      },
      {
        title: "A wait with a shape",
        node: (
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card variant="outline" className="flex flex-col gap-3 p-4">
              <Text variant="micro" tone="muted" as="p">
                Spinner · unknown length
              </Text>
              <Inline gap="sm" align="center">
                <Spinner size={20} label={null} />
                <Text variant="caption" tone="muted" as="p">
                  Validating… (no estimate)
                </Text>
              </Inline>
            </Card>
            <Card variant="outline" className="flex flex-col gap-3 p-4">
              <Text variant="micro" tone="muted" as="p">
                Skeleton · known shape
              </Text>
              <Skeleton variant="text" className="h-3.5 w-32" />
              <Skeleton variant="text" className="h-3.5 w-24" />
            </Card>
          </div>
        ),
        code: `{/* Unknown length */}\n<Spinner size={20} label="Validating" />\n\n{/* Known shape */}\n<SkeletonText lines={2} className="w-32" />`,
        layout: "block",
        note: "The two are not interchangeable: a spinner says \"wait\", a skeleton says \"this is what is coming\".",
      },
      {
        title: "In a panel header, sized to its own type",
        node: (
          <Panel className="flex w-full max-w-md flex-col gap-3 p-4">
            <Inline justify="between" align="center" className="w-full">
              <Text variant="label" as="p">
                Positions
              </Text>
              <Spinner size={16} label="Refreshing positions" />
            </Inline>
            <Text variant="caption" tone="muted" as="p">
              6 open · last refresh 12:04 UTC
            </Text>
          </Panel>
        ),
        code: `<Spinner size={16} label="Refreshing positions" />`,
        layout: "block",
        note: "Here the spinner carries the label, because nothing else on the surface says what is loading.",
      },
    ],
  }),

  /*
   * Skeleton.
   *
   * The specimen swaps the placeholder for the data it reserved, which is the
   * only way to show the property that matters: the geometry does not move.
   */
  composition({
    id: "skeleton",
    title: "A placeholder that keeps the shape it reserved",
    node: <SkeletonDemo />,
    code: `{loaded ? <Text>{row.name}</Text> : <Skeleton variant="text" className="h-3.5 w-full" />}`,
    layout: "block",
    note: "Press the button: the same rows arrive where the placeholder was, and nothing on the card moves. That is the reason to reach for a skeleton instead of a spinner.",
    examples: [
      {
        title: "The three variants",
        node: (
          <div className="grid w-full gap-5 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                text
              </Text>
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                block
              </Text>
              <Skeleton className="h-16" />
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                circle
              </Text>
              <Skeleton variant="circle" className="size-10" />
            </div>
          </div>
        ),
        code: `<Skeleton variant="text" />\n<Skeleton className="h-16" />\n<Skeleton variant="circle" className="size-10" />`,
        layout: "block",
        note: "`text` is a line, `block` is a surface, `circle` is a person or a mark.",
      },
      {
        title: "A list that reserves its rows",
        node: (
          <Card variant="outline" className="flex w-full max-w-lg flex-col gap-3 p-4">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[minmax(0,1fr)_5rem_3rem] items-center gap-3 border-t border-line-subtle pt-3 first:border-t-0 first:pt-0"
              >
                <Skeleton variant="text" className="h-3.5" />
                <Skeleton variant="text" className="h-3.5" />
                <Skeleton variant="text" className="h-3.5" />
              </div>
            ))}
          </Card>
        ),
        code: `{rows.map((row) => (\n  <Skeleton key={row.id} variant="text" className="h-3.5" />\n))}`,
        layout: "block",
        note: "A table's placeholder is a grid, not a paragraph: the columns have to line up with the columns that are coming.",
      },
      {
        title: "Shimmer, on and off",
        node: (
          <div className="flex w-full max-w-lg flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                shimmer · {"the page's main wait"}
              </Text>
              <Skeleton className="h-12" />
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                no shimmer · a quiet region
              </Text>
              <Skeleton className="h-12" shimmer={false} />
            </div>
          </div>
        ),
        code: `<Skeleton className="h-12" />\n<Skeleton className="h-12" shimmer={false} />`,
        layout: "block",
        note: "One shimmer per view is feedback; a dozen is noise. The static surface is the honest choice for everything else.",
      },
      {
        title: "A page region, not a page",
        node: (
          <Panel className="flex w-full max-w-lg flex-col gap-3 p-4">
            <Skeleton variant="text" className="h-4 w-40" />
            <SkeletonText lines={3} />
            <Skeleton className="h-24" />
          </Panel>
        ),
        code: `<Skeleton variant="text" className="h-4 w-40" />\n<SkeletonText lines={3} />\n<Skeleton className="h-24" />`,
        layout: "block",
        note: "A region that is loading keeps its own frame: the panel, the heading and the chart body are all already there.",
      },
    ],
  }),

  /*
   * Result.
   *
   * Every specimen declares its own heading level. `Result` defaults to `h1`
   * because its usual job is to *be* the page, and a documentation page that
   * renders four of them would have four `h1`s in it — which is exactly what the
   * page did before this pass.
   */
  composition({
    id: "result",
    title: "The page a flow ends on",
    node: (
      <Result
        status="success"
        titleAs="p"
        title="Import finished"
        description="1,284 bars were written for BTCUSDT 1h, and the series is ready to chart."
        extra={
          <>
            <Button variant="primary">Open the dataset</Button>
            <Button variant="ghost">Copy the run id</Button>
          </>
        }
      />
    ),
    code: `<Result\n  status="success"\n  title={t("import.finished.title")}\n  description={t("import.finished.body")}\n  extra={<Button variant="primary">Open the dataset</Button>}\n/>`,
    layout: "block",
    note: "`titleAs=\"p\"` here because the specimen is a block on a documentation page; a real page leaves the default, and the Result *is* the `h1`.",
    examples: [
      {
        title: "Every status",
        node: (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Panel className="p-2">
              <Result size="sm" status="success" titleAs="p" title="Validated" description="All seven domains matched." />
            </Panel>
            <Panel className="p-2">
              <Result size="sm" status="error" titleAs="p" title="Failed" description="The provider returned 503." />
            </Panel>
            <Panel className="p-2">
              <Result size="sm" status="warning" titleAs="p" title="Partly loaded" description="Two rows were skipped." />
            </Panel>
            <Panel className="p-2">
              <Result size="sm" status="info" titleAs="p" title="Queued" description="Starts when the window opens." />
            </Panel>
            <Panel className="p-2">
              <Result size="sm" status="empty" titleAs="p" title="No results" description="Widen the date range." />
            </Panel>
            <Panel className="p-2">
              <Result size="sm" status="empty" titleAs="p" icon={null} title="Not found" description="The link may be old." />
            </Panel>
          </div>
        ),
        code: `<Result status="success" title="Validated" description="All seven domains matched." />\n<Result status="error" title="Failed" description="The provider returned 503." />\n<Result status="empty" icon={null} title="Not found" description="The link may be old." />`,
        layout: "block",
        note: "Five tones and the text-only variant: `empty` with `icon={null}` is how a not-found outcome is said without a red circle above it.",
      },
      {
        title: "Compact, inside a panel",
        node: (
          <Panel className="flex w-full max-w-lg flex-col gap-3 p-4">
            <Text variant="label" as="p">
              Validation
            </Text>
            <Result
              size="sm"
              status="warning"
              titleAs="h3"
              title="Two rows were skipped"
              description="They carried a timestamp outside the contract's range."
              extra={<Button size="sm" variant="secondary">Open the log</Button>}
            />
          </Panel>
        ),
        code: `<Result\n  size="sm"\n  status="warning"\n  titleAs="h3"\n  title="Two rows were skipped"\n  extra={<Button size="sm">Open the log</Button>}\n/>`,
        layout: "block",
        note: "`size=\"sm\"` is the dialog-or-panel shape, and `titleAs=\"h3\"` keeps the outline honest inside a page that already has an `h1` and an `h2`.",
      },
      {
        title: "More than a sentence",
        node: (
          <Result
            status="error"
            size="sm"
            titleAs="p"
            title="The import could not finish"
            description="Provider B refused six requests, which left the dataset partly written."
            extra={
              <>
                <Button size="sm" variant="secondary">Retry the missing rows</Button>
                <Button size="sm" variant="ghost">Discard the partial dataset</Button>
              </>
            }
          >
            <Text variant="caption" tone="muted" as="p" className="max-w-[46ch]">
              Rows already written stay where they are: the retry continues from the first missing
              batch rather than starting again.
            </Text>
          </Result>
        ),
        code: `<Result status="error" size="sm" title="The import could not finish" description="…">\n  <Text>Rows already written stay where they are.</Text>\n</Result>`,
        layout: "block",
        note: "`children` is the body for an outcome that owes the reader more than a paragraph — and the two actions are where the choice actually is.",
      },
      {
        title: "Long copy, narrow column",
        node: (
          <Card variant="outline" className="w-full max-w-sm p-2">
            <Result
              size="sm"
              status="info"
              titleAs="p"
              title="Your export is queued behind two other jobs"
              description="The scheduler runs one export per workspace at a time, and this one is third in line. You can leave the page — the artifact is written under luc-data/research and linked from your notifications when it lands."
              extra={<Button size="sm" variant="secondary">Notify me</Button>}
            />
          </Card>
        ),
        code: `<Result size="sm" status="info" title="Your export is queued behind two other jobs" description="…" />`,
        layout: "block",
        note: "The description is capped at 58 characters per line by the component, so a long sentence stays readable at 390 px.",
      },
    ],
  }),

  /*
   * GuidedTour.
   *
   * The main specimen is a real tour of a small surface; the configurations are
   * the two failure shapes a consumer will actually meet — a step whose selector
   * has gone, and a single targetless step.
   */
  composition({
    id: "guided-tour",
    title: "A tour that points at the product",
    node: <GuidedTourDemo />,
    code: `const [open, setOpen] = useState(false);\n\n<Button onClick={() => setOpen(true)}>Start the tour</Button>\n<GuidedTour open={open} onOpenChange={setOpen} steps={steps} />`,
    layout: "block",
    note: "Three anchored steps and a targetless summary. The spotlight is measured from the real element on every scroll and resize, Escape leaves from any step, and focus returns to the button you started from.",
    examples: [
      {
        title: "A step whose target is gone",
        node: <GuidedTourDemo variant="missing" />,
        code: `<GuidedTour\n  open={open}\n  onOpenChange={setOpen}\n  steps={[{ id: "gone", title: "…", target: "#tour-does-not-exist" }]}\n/>`,
        layout: "block",
        note: "A selector that resolves to nothing gives a centred card instead of a spotlight over the top-left corner — the tour degrades, it does not break.",
      },
      {
        title: "A targetless step",
        node: <GuidedTourDemo variant="targetless" />,
        code: `<GuidedTour\n  open={open}\n  onOpenChange={setOpen}\n  steps={[{ id: "summary", title: "That is the whole tour" }]}\n/>`,
        layout: "block",
        note: "Omit `target` for a step that is a summary rather than a pointer: it centres itself and still owns focus, Escape and the step counter.",
      },
    ],
  }),
];
