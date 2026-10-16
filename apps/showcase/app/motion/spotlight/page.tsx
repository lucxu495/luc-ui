"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  Code,
  Heading,
  Inline,
  Metric,
  MetricValue,
  Section,
  SegmentedControl,
  SegmentedItem,
  SpotlightSurface,
  Text,
  useReducedMotion,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { PropsTable } from "@/components/docs/tables";
import { Sparkline } from "@/components/showcase/sparkline";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const values = [86, 92, 88, 104, 99, 118, 112, 126, 121, 134, 128, 142];

export default function SpotlightPage() {
  const { tcs } = useI18n();
  const [size, setSize] = useState<"240" | "320" | "480">("320");
  const [tone, setTone] = useState<"accent" | "neutral">("accent");
  const [surface, setSurface] = useState<"default" | "raised" | "sunken">("default");
  const reducedMotion = useReducedMotion();

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="SpotlightSurface"
        lead="A surface that acknowledges the pointer. The light layer sits above the surface colour but below the content, at single-digit alpha, so nothing you need to read ever loses contrast."
      />

      <Section
        title={tcs("Playground")}
        description={tcs("Move the pointer across the surface. Nothing animates on its own; the light only exists while you are interacting.")}
      >
        <Playground
          /* MOT-002: the snippet the controls produce, copyable — see `reveal`. */
          code={`<SpotlightSurface size={${size}} tone="${tone}" surface="${surface}">
  <Card>Content under the light</Card>
</SpotlightSurface>`}
          note={
            reducedMotion
              ? tcs("Reduced motion is on: the surface renders flat with no pointer listeners attached.")
              : tcs("Listeners are attached per surface, rAF-throttled, and removed when the pointer leaves. Coarse pointers get the calm version.")
          }
          controls={
            <>
              <ControlRow label={tcs("Spot size")}>
                <SegmentedControl size="sm" value={size} onValueChange={(next) => next && setSize(next as typeof size)}>
                  {["240", "320", "480"].map((option) => (
                    <SegmentedItem size="sm" key={option} value={option}>
                      {option}px
                    </SegmentedItem>
                  ))}
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Tone")}>
                <SegmentedControl size="sm" value={tone} onValueChange={(next) => next && setTone(next as typeof tone)}>
                  <SegmentedItem size="sm" value="accent">
                    Accent
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="neutral">
                    Neutral
                  </SegmentedItem>
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Surface")}>
                <SegmentedControl
                  size="sm"
                  value={surface}
                  onValueChange={(next) => next && setSurface(next as typeof surface)}
                >
                  <SegmentedItem size="sm" value="default">
                    Default
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="raised">
                    Raised
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="sunken">
                    Sunken
                  </SegmentedItem>
                </SegmentedControl>
              </ControlRow>
              <ControlRow label={tcs("Rendered as")}>
                <Code>{`<SpotlightSurface size={${size}} tone="${tone}" surface="${surface}">`}</Code>
              </ControlRow>
            </>
          }
        >
          <SpotlightSurface
            size={Number(size)}
            tone={tone}
            surface={surface}
            radius="xl"
            className="w-full max-w-md"
          >
            <div className="flex flex-col gap-4 p-5">
              <Inline justify="between" className="w-full">
                <Heading size="title" as="h3">
                  Portfolio overview
                </Heading>
                <Badge size="sm" tone="positive" dot>
                  +4.2%
                </Badge>
              </Inline>
              <Metric label="Net asset value" aside={<Text variant="caption" tone="muted">30d</Text>}>
                <MetricValue value={1_284_310.22} kind="currency" currency="USD" size="lg" />
              </Metric>
              <Sparkline values={values} tone="positive" />
              <Text variant="caption" tone="muted">
                {tcs("Text contrast is untouched: the light never exceeds 7% alpha.")}</Text>
            </div>
          </SpotlightSurface>
        </Playground>
      </Section>

      <Section title={tcs("In a grid")} description={tcs("Used on a few flagship surfaces, never on all of them. Three lights competing is noise.")}>
        <Demo layout="grid" stageClassName="lg:grid-cols-3">
          {["Live signals", "Risk monitor", "Data quality"].map((title, index) => (
            <SpotlightSurface key={title} surface={index === 0 ? "raised" : "default"} size={280}>
              <div className="flex flex-col gap-3 p-4">
                <Inline justify="between" className="w-full">
                  <Text variant="label" tone="primary" as="p">
                    {title}
                  </Text>
                  <Badge size="sm" tone="outline">
                    spotlight
                  </Badge>
                </Inline>
                <Text variant="caption" tone="muted">
                  {tcs("Each surface tracks its own pointer position and writes two CSS variables.")}</Text>
                <Sparkline values={values.map((value) => value + index * 6)} tone={index === 1 ? "negative" : "positive"} />
              </div>
            </SpotlightSurface>
          ))}
        </Demo>
      </Section>

      <Section title={tcs("Static / print")} description={tcs("Pass `static` where the surface is rendered to an image or printed — no listeners are attached at all.")}>
        <Demo layout="inline">
          <SpotlightSurface static className="w-72">
            <div className="p-4">
              <Text variant="label" tone="primary" as="p">
                static
              </Text>
              <Text variant="caption" tone="muted">
                {tcs("Deterministic output for screenshots and PDFs.")}</Text>
            </div>
          </SpotlightSurface>
        </Demo>
      </Section>

      <Section title={tcs("SpotlightSurface vs BorderGlow")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="label" tone="primary" as="p">
              SpotlightSurface
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("Is a surface. It brings its own background, border and radius, and puts the light between the background and the content.")}</Text>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="label" tone="primary" as="p">
              BorderGlow
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("Wraps one. It paints only the 1px perimeter and reads the wrapped element's radius through")}<Code>border-radius: inherit</Code>.
            </Text>
          </Card>
        </div>
      </Section>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "size", type: "number", default: "320", description: tcs("Spotlight diameter in px. Larger is softer.") },
            { name: "tone", type: '"accent" | "neutral"', default: '"accent"', description: tcs("Neutral uses a low-alpha foreground tint instead.") },
            { name: "surface", type: '"default" | "raised" | "sunken"', default: '"default"', description: tcs("The surface treatment under the light.") },
            { name: "radius", type: '"md" | "lg" | "xl"', default: '"lg"', description: tcs("Matches the Card radius scale.") },
            { name: "static", type: "boolean", default: "false", description: tcs("Skips pointer tracking entirely.") },
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
              <li>{tcs("Keep the alpha under 10% — it is a shimmer, not a lamp.")}</li>
              <li>{tcs("Use it on one or two surfaces per view.")}</li>
              <li>{tcs("Let it sit behind the content so charts stay readable.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Add a list of pointer listeners to a 60-row table.")}</li>
              <li>{tcs("Use a white radial “blob” over text.")}</li>
              <li>{tcs("Rely on the light to signal that something is interactive.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
      <EntryFooter />
    </DocPage>
  );
}
