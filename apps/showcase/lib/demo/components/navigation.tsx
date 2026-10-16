/*
 * Live Demos — Navigation.
 *
 * `stepper`. The other four Navigation entries are handwritten pages with their
 * own specimens.
 */

/*
 * Stepper.
 *
 * The page's specimen is a **composition** rather than a structured demo, and the
 * reason is the capability the page kept claiming: a completed step is a real
 * `<button>` that reports its index, which needs `onStepSelect` — a function,
 * which the structured printer cannot print and RSC cannot serialise. So the
 * state lives in an island (`components/demo/islands/stepper-demo.tsx`), and the
 * configurations beside it are written by hand for the same reason
 * `search-input` is: one of them has to run.
 *
 * The fixture is written out in each snippet rather than shared as a constant:
 * `STEPS` is passed to the island as a prop, and a constant exported from a
 * `"use client"` module is a client reference, not a value.
 */

import type { ReactNode } from "react";
import { Card, Stepper } from "@luc/ui";
import { StepperDemo } from "@/components/demo/islands/stepper-demo";
import { composition, type DemoSpec } from "../index";

const STEPS = [
  { id: "account", label: "Account", description: "Identity and roles" },
  { id: "dataset", label: "Dataset", description: "What is in scope" },
  { id: "schedule", label: "Schedule", description: "When it runs" },
  { id: "review", label: "Review", description: "Confirm and publish" },
] as const;

/*
 * The frame every specimen shares.
 *
 * A stepper is a row, so a strip that cannot fit has to scroll — and a region
 * that scrolls must be reachable from the keyboard, because a keyboard user
 * cannot drag a scrollbar. `tabIndex={0}` is what makes that true: axe reports
 * `scrollable-region-focusable` (serious) without it, measured on
 * `/components/stepper` at 390px, three specimens. `ScrollArea`'s viewport and
 * `AppShellStatusBar` follow the same rule, and this is the same idea one
 * level up.
 */
function Steps({ children }: { children: ReactNode }) {
  return (
    <Card variant="outline" tabIndex={0} className="luc-focus w-full overflow-x-auto p-5">
      {children}
    </Card>
  );
}

export const navigationDemos: readonly DemoSpec[] = [
  composition({
    id: "stepper",
    title: "A completed step is a button",
    node: <StepperDemo steps={STEPS} current={2} />,
    code: `const [current, setCurrent] = useState(2);

<Stepper steps={STEPS} current={current} onStepSelect={setCurrent} />`,
    layout: "block",
    note: "Steps at or before the current one are real buttons that report their index — go back to Account and the strip re-derives which steps are done. A step after the current one is static text, so nothing can jump past a prerequisite.",
    examples: [
      {
        title: "A vertical checklist beside the work",
        node: (
          <div className="grid w-full gap-4 sm:grid-cols-[15rem_minmax(0,1fr)]">
            <Card variant="outline" className="p-4">
              <Stepper steps={STEPS} current={1} orientation="vertical" />
            </Card>
            <Card variant="outline" className="gap-2 p-4">
              <span className="text-micro text-fg-muted uppercase">Dataset</span>
              <span className="text-title text-fg-primary">What is in scope</span>
            </Card>
          </div>
        ),
        code: `<Stepper steps={STEPS} current={1} orientation="vertical" />`,
        layout: "block",
        note: "`vertical` is the sidebar shape — a checklist beside the work it belongs to, not a header above it. Nothing else changes with the orientation: the marker, the connector and the reachability rule are identical, so a form header and a sidebar checklist cannot drift apart.",
      },
      {
        title: "Numbers instead of checks",
        node: (
          <Steps>
            <Stepper steps={STEPS} current={2} showNumbers />
          </Steps>
        ),
        code: `<Stepper steps={STEPS} current={2} showNumbers />`,
        layout: "block",
        note: "`showNumbers` keeps the position legible once a step is done, which a check does not: the reader can see that this is step three of four.",
      },
      {
        title: "A step finished out of order",
        node: (
          <Steps>
            <Stepper
              steps={[
                { id: "account", label: "Account", description: "Identity and roles" },
                { id: "dataset", label: "Dataset", description: "Skipped: no new data" },
                { id: "schedule", label: "Schedule", description: "When it runs" },
                { id: "review", label: "Review", description: "Confirm and publish", complete: true },
              ]}
              current={2}
            />
          </Steps>
        ),
        code: `<Stepper
  steps={[
    { id: "account", label: "Account", description: "Identity and roles" },
    { id: "dataset", label: "Dataset", description: "Skipped: no new data" },
    { id: "schedule", label: "Schedule", description: "When it runs" },
    { id: "review", label: "Review", description: "Confirm and publish", complete: true },
  ]}
  current={2}
/>`,
        layout: "block",
        note: "`complete` on a step overrides the position: Review is done while Schedule is still the active step, which is what a step that can be finished early needs.",
      },
      {
        title: "Long labels, and a narrow column",
        node: (
          <Steps>
            <Stepper
              steps={[
                {
                  id: "scope",
                  label: "Universe and instrument scope",
                  description: "Sectors, regions, liquidity floors",
                },
                {
                  id: "cost",
                  label: "Cost and slippage assumptions",
                  description: "Per venue, in basis points",
                },
                {
                  id: "risk",
                  label: "Risk limits and drawdown guardrails",
                  description: "Hard and soft thresholds",
                },
              ]}
              current={1}
            />
          </Steps>
        ),
        code: `<Stepper
  steps={[
    { id: "scope", label: "Universe and instrument scope", description: "Sectors, regions, liquidity floors" },
    { id: "cost", label: "Cost and slippage assumptions", description: "Per venue, in basis points" },
    { id: "risk", label: "Risk limits and drawdown guardrails", description: "Hard and soft thresholds" },
  ]}
  current={1}
/>`,
        layout: "block",
        note: "A label wraps inside its own step and the strip keeps its even `1fr` rhythm; when the row genuinely cannot fit, let the container scroll rather than the page.",
      },
    ],
  }),
];
