"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Code,
  Heading,
  Inline,
  Panel,
  Reveal,
  Section,
  SegmentedControl,
  SegmentedItem,
  Text,
  buttonVariants,
  useReducedMotion,
} from "@luc/ui";
import { RiRefreshLine } from "@remixicon/react";
import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export default function RevealPage() {
  const { tcs, href } = useI18n();
  const [distance, setDistance] = useState<"0" | "8" | "20">("8");
  const [delay, setDelay] = useState<"0" | "0.08" | "0.16">("0.08");
  const [nonce, setNonce] = useState(0);
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="Reveal"
        lead="Content entering with intent: a short fade and a few pixels of travel, once, the first time it is seen. Under reduced motion the element is simply present."
      />

      <Section title={tcs("Playground")} description={tcs("Press replay to re-run the entrance. Distance is measured in pixels; 8 is the default.")}>
        <Playground
          /*
           * MOT-002: the snippet is built from the control values above, so the
           * code panel and the preview cannot disagree — the page owns both.
           */
          code={`<Reveal immediate distance={${Number(distance)}} delay={${Number(delay)}}>
  <Card>Staggered item</Card>
</Reveal>

{/* Per item, so the entrance reads as a sequence rather than a flash. */}
<Reveal immediate delay={${Number(delay)} * (index + 1)} />`}
          note={
            reducedMotion
              ? tcs("Reduced motion is on: Reveal renders a plain element with no initial offset — the content is never hidden.")
              : tcs("Reveal never gates content: if the observer never fires, the element is still present after the transition budget.")
          }
          controls={
            <>
              <ControlRow label={tcs("Distance")}>
                <SegmentedControl
                  size="sm"
                  value={distance}
                  onValueChange={(next) => next && setDistance(next as typeof distance)}
                >
                  {["0", "8", "20"].map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}px
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Delay")}>
                <SegmentedControl size="sm" value={delay} onValueChange={(next) => next && setDelay(next as typeof delay)}>
                  {["0", "0.08", "0.16"].map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}s
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Replay")}>
                <Button size="sm" variant="secondary" leadingIcon={<RiRefreshLine />} onClick={() => setNonce((n) => n + 1)}>
                  Replay entrance
                </Button>
              </ControlRow>
            </>
          }
        >
          <div key={nonce} className="grid w-full max-w-md gap-3">
            {[0, 1, 2].map((index) => (
              <Reveal
                key={index}
                immediate
                delay={Number(delay) * (index + 1)}
                distance={Number(distance)}
                className="rounded-lg border border-line-subtle bg-surface-raised p-4"
              >
                <Inline justify="between" className="w-full">
                  <Text variant="label" tone="primary" as="p">
                    Staggered item {index + 1}
                  </Text>
                  <Badge size="sm" tone="outline">
                    {(Number(delay) * (index + 1)).toFixed(2)}s
                  </Badge>
                </Inline>
              </Reveal>
            ))}
          </div>
        </Playground>
      </Section>

      <Section title={tcs("Stagger in a grid")} description={tcs("Delay is applied per item. Beyond ~0.24s total the entrance starts to feel slow.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-4">
          {["Ingest", "Analytics", "Validation", "Summary"].map((step, index) => (
            <Reveal key={step} immediate delay={index * 0.06} className="h-full">
              <Card variant="outline" className="h-full gap-2 p-4">
                <Text variant="micro" tone="accent" as="p">
                  STEP {index + 1}
                </Text>
                <Heading size="title" as="h3">
                  {step}
                </Heading>
                <Text variant="caption" tone="muted">
                  {tcs("Each card enters 60ms after the one before it.")}</Text>
              </Card>
            </Reveal>
          ))}
        </Demo>
      </Section>

      <Section
        title={tcs("Scrolling into view")}
        description={tcs("By default Reveal plays once, the first time a section is seen, then stays put. Content that is already on screen at load is simply present — no animation to wait for.")}
      >
        <Demo layout="block" stageClassName="min-h-72">
          <div className="flex w-full flex-col gap-4">
            <Text variant="caption" tone="muted">
              {tcs("Scroll this page slowly and the blocks below animate in once each.")}</Text>
            <Panel className="flex min-h-56 flex-col justify-end p-5">
              {[0, 1, 2, 3, 4].map((index) => (
                <Reveal
                  key={index}
                  delay={index * 0.05}
                  className="mt-3 flex items-center justify-between rounded-md border border-line-subtle bg-surface-raised px-4 py-2.5"
                >
                  <Text variant="caption" tone="secondary" as="span">
                    Observation {index + 1}
                  </Text>
                  <Badge size="sm" tone="outline">
                    once
                  </Badge>
                </Reveal>
              ))}
            </Panel>
          </div>
        </Demo>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "delay", type: "number", default: "0", description: tcs("Seconds before the entrance starts.") },
            { name: "distance", type: "number", default: "8", description: tcs("Travel in px. 0 gives a pure fade.") },
            { name: "repeat", type: "boolean", default: "false", description: tcs("Re-run every time it enters the viewport.") },
            { name: "immediate", type: "boolean", default: "false", description: tcs("Play on mount instead of waiting for view.") },
          ]}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Keep distance small — 6–10px is felt, 40px is seen.")}</li>
              <li>{tcs("Stagger lists by 40–80ms, never more.")}</li>
              <li>{tcs("Reveal the region, not each line of text.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Reveal content the user came to read.")}</li>
              <li>{tcs("Use Reveal inside a scrollable table body.")}</li>
              <li>{tcs("Chain three animations on one element.")}</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section title={tcs("See it applied")}>
        <Inline gap="sm">
          <Link href={href("/patterns")} className={buttonVariants({ variant: "secondary" })}>
            Patterns
          </Link>
          <Link href={href("/data/metrics")} className={buttonVariants({ variant: "ghost" })}>
            Metrics
          </Link>
          <Code>{reducedMotion ? "reduced motion active" : "full motion"}</Code>
        </Inline>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
