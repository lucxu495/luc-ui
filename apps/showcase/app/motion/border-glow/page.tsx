"use client";

import { useState } from "react";
import {
  Badge,
  BorderGlow,
  Button,
  Card,
  Code,
  Heading,
  Inline,
  Metric,
  MetricValue,
  Panel,
  Section,
  SegmentedControl,
  SegmentedItem,
  Switch,
  Text,
  useReducedMotion,
} from "@luc/ui";
import { RiAddLine, RiArrowUpLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

type Intensity = "subtle" | "normal" | "strong";
type Mode = "follow" | "travel";

export default function BorderGlowPage() {
  const { tcs } = useI18n();
  const [intensity, setIntensity] = useState<Intensity>("subtle");
  const [mode, setMode] = useState<Mode>("follow");
  const [selected, setSelected] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="BorderGlow"
        lead="A light on the perimeter. Nothing at rest, a thin accent line on hover or focus, and a calm persistent ring when selected. No canvas, no always-running JavaScript — one masked conic gradient."
      />

      <Section title={tcs("Playground")} description={tcs("Hover the surface, then try travel mode. Flip the motion control in the top bar to see the reduced-motion path.")}>
        <Playground
          /* MOT-002: the configuration the controls produce, as a pasteable snippet. */
          code={`<BorderGlow intensity="${intensity}" mode="${mode}" selected={${selected}} radius="xl">
  <Card variant="raised">A panel that answers the pointer</Card>
</BorderGlow>`}
          note={
            reducedMotion
              ? tcs("Reduced motion is on: travel mode falls back to a static ring, and the pointer light is disabled.")
              : tcs("Pointer-reactive lighting is disabled on touch devices and under reduced motion.")
          }
          controls={
            <>
              <ControlRow label={tcs("Intensity")}>
                <SegmentedControl
                  size="sm"
                  value={intensity}
                  onValueChange={(next) => next && setIntensity(next as Intensity)}
                >
                  <SegmentedItem size="sm" value="subtle">
                    Subtle
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="normal">
                    Normal
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="strong">
                    Strong
                  </SegmentedItem>
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Mode")}>
                <SegmentedControl size="sm" value={mode} onValueChange={(next) => next && setMode(next as Mode)}>
                  <SegmentedItem size="sm" value="follow">
                    Follow pointer
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="travel">
                    Travel
                  </SegmentedItem>
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Selected")}>
                <Switch checked={selected} onCheckedChange={setSelected} aria-label={tcs("Selected state")} />
              </ControlRow>
              <ControlRow label={tcs("Current configuration")}>
                <Code>
                  intensity=&quot;{intensity}&quot; mode=&quot;{mode}&quot; selected=
                  {String(selected)}
                </Code>
              </ControlRow>
            </>
          }
        >
          <BorderGlow intensity={intensity} mode={mode} selected={selected} radius="xl" className="w-full max-w-md">
            <Card variant="raised" className="gap-4 rounded-xl p-5">
              <Inline justify="between" className="w-full">
                <Heading size="title" as="h3">
                  Featured run
                </Heading>
                <Badge size="sm" tone="accent">
                  glow
                </Badge>
              </Inline>
              <Metric label="Total return" aside={<Badge tone="positive" size="sm" dot>+18.2%</Badge>}>
                <MetricValue value={182_410} kind="currency" currency="USD" size="lg" />
              </Metric>
              <Text variant="caption" tone="muted">
                {tcs("Hover to light the edge. Select to keep it lit.")}</Text>
            </Card>
          </BorderGlow>
        </Playground>
      </Section>

      <Section title={tcs("States")} description={tcs("Four states, described precisely so they can be reviewed rather than debated.")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "At rest", body: tcs("No ring, no bloom, no listeners. Identical to a plain surface."), props: "selected={false}" },
            { label: "Hover / focus", body: tcs("A 1px accent ring appears over 200ms, plus a low-alpha bloom outside the edge."), props: "group-hover / focus-within" },
            { label: "Selected", body: tcs("The ring stays lit at reduced strength. Never brighter than focus."), props: "selected" },
            { label: "Reduced motion", body: tcs("Travel stops. The ring still appears on hover as a static gradient."), props: "prefers-reduced-motion" },
          ].map((state) => (
            <Card key={state.label} variant="outline" className="gap-2 p-4">
              <Text variant="label" tone="primary" as="p">
                {state.label}
              </Text>
              <Text variant="caption" tone="muted">
                {state.body}
              </Text>
              <Code>{state.props}</Code>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("Applied")} description={tcs("The effect wraps the surface; the surface itself stays a normal Card.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          <BorderGlow mode="follow" intensity="subtle" radius="lg">
            <Card variant="raised" className="gap-2 p-4">
              <Text variant="label" tone="primary" as="p">
                Card
              </Text>
              <Text variant="caption" tone="muted">
                {tcs("The default combination for a featured item in a grid.")}</Text>
            </Card>
          </BorderGlow>

          <BorderGlow mode="travel" intensity="normal" radius="lg">
            <Panel className="gap-2 p-4">
              <Inline justify="between" className="w-full">
                <Text variant="label" tone="primary" as="p">
                  Travel mode
                </Text>
                <Badge size="sm" tone="outline">
                  attention
                </Badge>
              </Inline>
              <Text variant="caption" tone="muted">
                {tcs("A slow light travels the perimeter. Use when something genuinely needs to be found.")}</Text>
            </Panel>
          </BorderGlow>

          <BorderGlow selected mode="follow" radius="lg">
            <Card variant="raised" selected className="gap-2 p-4">
              <Inline gap="xs">
                <RiArrowUpLine className="size-4 text-fg-positive" />
                <Text variant="label" tone="primary" as="p">
                  Selected
                </Text>
              </Inline>
              <Text variant="caption" tone="muted">
                {tcs("Pairs with the Card's own selected state: accent border, soft tint, subtle glow.")}</Text>
            </Card>
          </BorderGlow>
        </Demo>
      </Section>

      <Section title={tcs("Low intensity on a button")} description={tcs("At the lowest intensity the same effect reads as a precise hover, not a decoration.")}>
        <Demo layout="inline">
          <BorderGlow mode="follow" intensity="subtle" radius="md">
            <Button variant="secondary" leadingIcon={<RiAddLine />}>
              Add to watchlist
            </Button>
          </BorderGlow>
          <BorderGlow mode="travel" intensity="strong" radius="md">
            <Button variant="primary">Primary action</Button>
          </BorderGlow>
        </Demo>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "intensity", type: '"subtle" | "normal" | "strong"', default: '"subtle"', description: tcs("Ring opacity. Subtle is the house default for dense UI.") },
            { name: "mode", type: '"travel" | "follow"', default: '"follow"', description: tcs("Travel needs attention; follow is calm and pointer-driven.") },
            { name: "selected", type: "boolean", default: "false", description: tcs("Persistent ring independent of hover.") },
            { name: "radius", type: '"md" | "lg" | "xl" | "full"', default: '"lg"', description: tcs("Must match the wrapped surface.") },
            { name: "speed", type: "number", default: "5.5", description: tcs("Seconds per perimeter sweep in travel mode.") },
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
              <li>{tcs("Wrap a surface — never paint the glow into the surface itself.")}</li>
              <li>Match <Code>radius</Code> {tcs("to the card so the ring hugs the edge.")}</li>
              <li>Use <Code>selected</Code> {tcs("for the one item the user is working on.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Apply it to every card in a dashboard.")}</li>
              <li>{tcs("Use travel mode in a dense grid — you cannot watch twelve lights.")}</li>
              <li>{tcs("Increase intensity to compensate for low contrast somewhere else.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
