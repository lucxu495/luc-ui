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
  Section,
  SegmentedControl,
  SegmentedItem,
  Shimmer,
  ShimmerText,
  Skeleton,
  SkeletonText,
  Text,
  useReducedMotion,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export default function ShimmerPage() {
  const { tcs } = useI18n();
  const [speed, setSpeed] = useState<"1.4" | "1.9" | "2.6">("1.9");
  const [active, setActive] = useState(true);
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="Shimmer"
        lead="One soft highlight sweeping across a surface. It is the loading language of LUC UI — a skeleton that carries shape, not a spinner that only says “wait”."
      />

      <Section title={tcs("Playground")} description={tcs("A single band, moving on the standard curve. Nothing else on the surface animates.")}>
        <Playground
          /* MOT-002: the snippet the controls produce, copyable — see `reveal`. */
          code={`<Shimmer speed={${speed}} active={${active}} />`}
          note={
            reducedMotion
              ? tcs("Reduced motion is on: the sweep is removed and the placeholder renders as a flat surface.")
              : tcs("The sweep is a transform on one pseudo-layer, so it costs a compositor frame, not a repaint.")
          }
          controls={
            <>
              <ControlRow label={tcs("Speed")}>
                <SegmentedControl size="sm" value={speed} onValueChange={(next) => next && setSpeed(next as typeof speed)}>
                  {["1.4", "1.9", "2.6"].map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}s
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Active")}>
                <SegmentedControl
                  size="sm"
                  value={active ? "on" : "off"}
                  onValueChange={(next) => setActive(next === "on")}
                >
                  <SegmentedItem size="sm" value="on">
                    On
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="off">
                    Off
                  </SegmentedItem>
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Rendered as")}>
                <Code>{`<Shimmer speed={${speed}} active={${active}} />`}</Code>
              </ControlRow>
            </>
          }
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-line-subtle bg-surface-raised p-5">
            <Shimmer active={active} speed={Number(speed)} />
            <div className="relative flex flex-col gap-3">
              <Inline justify="between" className="w-full">
                <Text variant="micro" tone="muted" as="p">
                  Writing artifacts
                </Text>
                <Badge size="sm" tone="outline">
                  62%
                </Badge>
              </Inline>
              <Skeleton className="h-3 w-2/3" shimmer={false} />
              <Skeleton className="h-3 w-1/2" shimmer={false} />
              <Skeleton className="h-20 w-full" shimmer={false} />
            </div>
          </div>
        </Playground>
      </Section>

      <Section
        title={tcs("ShimmerText")}
        description={tcs("Text whose fill carries the highlight, drawn with background-clip so nothing is layered over the glyphs.")}
      >
        <Demo layout="block">
          <Panel className="flex flex-col gap-4 p-5">
            <Heading size="heading-sm" as="p">
              <ShimmerText>Rebuilding factor library…</ShimmerText>
            </Heading>
            <Text variant="body" tone="muted">
              <ShimmerText animate={false}>{tcs("Steady gradient without movement")}</ShimmerText>
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("Use it for in-progress titles and values. Never for body copy you need to read while it moves.")}</Text>
          </Panel>
        </Demo>
      </Section>

      <Section title={tcs("Composed loading states")} description={tcs("Skeleton, Shimmer and Spinner cover three different waits.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          <Card variant="raised" className="gap-3 p-4" aria-busy="true">
            <Skeleton variant="text" className="w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-16" />
            <SkeletonText lines={2} widths={["70%", "45%"]} />
          </Card>

          <Card variant="raised" className="gap-3 p-4">
            <Inline justify="between" className="w-full">
              <Skeleton variant="text" className="w-20" />
              <Skeleton variant="circle" className="size-5" />
            </Inline>
            <div className="relative overflow-hidden rounded-md">
              <Skeleton className="h-24" />
              <Shimmer speed={1.9} />
            </div>
            <Skeleton variant="text" className="w-1/2" />
          </Card>

          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("When not to shimmer")}</Text>
            <Text variant="caption" tone="muted">
              {tcs("If the wait is under ~200ms, show nothing. A flash of a placeholder is worse than a still frame.")}</Text>
            <Button variant="secondary" size="sm" loading>
              Inline action instead
            </Button>
          </Panel>
        </Demo>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Shimmer speed", type: "number", default: "1.9", description: "Seconds per sweep." },
            { name: "Shimmer active", type: "boolean", default: "true", description: tcs("Hide the band without unmounting.") },
            { name: "ShimmerText animate", type: "boolean", default: "true", description: tcs("Steady gradient when false.") },
            { name: "Skeleton shimmer", type: "boolean", default: "true", description: tcs("The skeleton uses the same band as its built-in sweep.") },
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
              <li>{tcs("Keep the band at hairline contrast — it should be felt, not watched.")}</li>
              <li>{tcs("Place the Shimmer over a surface that has")}{" "}<Code>overflow-hidden</Code>.</li>
              <li>{tcs("Stop it as soon as the data arrives.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Run two shimmer speeds on the same surface.")}</li>
              <li>{tcs("Use shimmer as a hover effect on interactive content.")}</li>
              <li>{tcs("Animate a shimmer behind text you must read.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
