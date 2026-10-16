"use client";

/*
 * Motion Studio.
 *
 * One real primitive (`KineticHeadline`), the intensity register that scales the
 * whole system, and the honest limits: only declared props are exposed, and the
 * reduced-motion path is stated rather than demonstrated by disabling the
 * preference of the reader's machine.
 */

import { useState } from "react";
import {
  Button,
  Code,
  Inline,
  Panel,
  SegmentedControl,
  SegmentedItem,
  Stack,
  Text,
  motionIntensities,
} from "@luc/ui";
import { KineticHeadline, MotionIntensityProvider } from "@luc/ui/motion";
import { CopyButton } from "@/components/docs/copy-button";
import { useI18n } from "@/lib/i18n/provider";

type Mode = "reveal" | "swap";
type Intensity = (typeof motionIntensities)[number];

const HEADLINES = [
  "Read the data, not the volume",
  "Every week, one honest measurement",
  "Positions change; the process does not",
] as const;

export function MotionStudio() {
  const { tcs } = useI18n();
  const [mode, setMode] = useState<Mode>("reveal");
  const [intensity, setIntensity] = useState<Intensity>("functional");
  const [stagger, setStagger] = useState("0.05");
  const [index, setIndex] = useState(0);

  const headline = HEADLINES[index % HEADLINES.length] ?? HEADLINES[0];
  const snippet = [
    `import { MotionIntensityProvider } from "@luc/ui/motion";`,
    `import { KineticHeadline } from "@luc/ui/motion";`,
    ``,
    `<MotionIntensityProvider intensity="${intensity}">`,
    `  <KineticHeadline mode="${mode}" stagger={${stagger}} as="h2" live>`,
    `    {headline}`,
    `  </KineticHeadline>`,
    `</MotionIntensityProvider>`,
  ].join("\n");

  return (
    <Stack gap="lg">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel tone="sunken" className="h-fit">
          <Stack gap="md" className="p-4">
            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Mode")}
              </Text>
              <SegmentedControl size="sm" value={mode} onValueChange={(next) => setMode(next as Mode)}>
                <SegmentedItem value="reveal">{tcs("Reveal")}</SegmentedItem>
                <SegmentedItem value="swap">{tcs("Swap")}</SegmentedItem>
              </SegmentedControl>
            </Inline>
            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Intensity")}
              </Text>
              <SegmentedControl
                size="sm"
                value={intensity}
                onValueChange={(next) => setIntensity(next as Intensity)}
              >
                {motionIntensities.map((id) => (
                  <SegmentedItem key={id} value={id}>
                    {id}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            </Inline>
            <Inline justify="between" align="center">
              <Text variant="label" as="span">
                {tcs("Stagger")}
              </Text>
              <SegmentedControl size="sm" value={stagger} onValueChange={setStagger}>
                <SegmentedItem value="0.02">0.02s</SegmentedItem>
                <SegmentedItem value="0.05">0.05s</SegmentedItem>
                <SegmentedItem value="0.09">0.09s</SegmentedItem>
              </SegmentedControl>
            </Inline>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIndex((current) => current + 1)}
            >
              {tcs("Change the headline")}
            </Button>
          </Stack>
        </Panel>

        <Stack gap="md">
          <div className="rounded-lg border border-line-subtle bg-surface-canvas p-8">
            <MotionIntensityProvider intensity={intensity}>
              <KineticHeadline text={headline} mode={mode} stagger={Number(stagger)} as="h2" live />
            </MotionIntensityProvider>
          </div>
          <Text variant="caption" tone="muted" as="p">
            {tcs(
              "Intensity scales the system's motion physics; the primitive reads the reduced-motion preference and changes state instantly when it is set.",
            )}
          </Text>
          <Inline justify="between" align="center">
            <Text variant="caption" tone="muted" as="p">
              {tcs("Only declared props are exposed here: a callback, a ref or a custom node is not a control.")}
            </Text>
            <CopyButton value={snippet} label={tcs("Copy the motion")} />
          </Inline>
          {/* A generated snippet is wider than the panel; it scrolls, so it takes a tab stop. */}
          <Code block>{snippet}</Code>
        </Stack>
      </div>
    </Stack>
  );
}
