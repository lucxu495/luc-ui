"use client";

import {
  AspectRatio,
  Badge,
  Button,
  Card,
  Carousel,
  CarouselControls,
  CarouselItem,
  CarouselTrack,
  Section,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

const CARDS = [
  { name: "Aurora", tag: "Motion", note: "A drifting aurora surface for hero panels." },
  { name: "BeamFlow", tag: "Motion", note: "A travelling packet along a measured path." },
  { name: "OrbitField", tag: "Geometry", note: "Elements on a rotating ring, pausable on hover." },
  { name: "CardStack", tag: "Depth", note: "Depth as navigation, one card in front." },
  { name: "ParallaxScene", tag: "Spatial", note: "Pointer depth without a React render." },
];

export default function CarouselPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="Carousel and AspectRatio" lead={tc("components.carousel.lead")} />
      <ExamplesHeading />

      <ImportLine line={'import { Carousel, CarouselControls, CarouselItem, CarouselTrack } from "@luc/ui";'} />

      <Example
        title={tc("components.carousel.rail.title")}
        description={tc("components.carousel.rail.lead")}
        layout="block"
        code={'<Carousel label="Motion primitives">\n  <CarouselTrack>{items}</CarouselTrack>\n  <CarouselControls />\n</Carousel>'}
      >

        <Carousel label="Motion primitives">
          <CarouselTrack itemWidth="min(18rem, 78%)">
            {CARDS.map((entry) => (
              <CarouselItem key={entry.name}>
                <Card variant="outline" padding="sm" className="h-full gap-2">
                  <AspectRatio ratio="wide" className="rounded-md bg-surface-sunken">
                    <span className="absolute inset-0 grid place-items-center text-micro text-fg-muted">
                      {entry.tag}
                    </span>
                  </AspectRatio>
                  <Text variant="label">{entry.name}</Text>
                  <Text variant="caption" tone="muted">
                    {tcs(entry.note)}
                  </Text>
                </Card>
              </CarouselItem>
            ))}
          </CarouselTrack>
          <CarouselControls />
        </Carousel>
      </Example>

      <Example
        title={tc("components.carousel.manual.title")}
        description={tc("components.carousel.manual.lead")}
        layout="block"
        code={`<Carousel label="Release notes" autoplay interval={5000}>
  <CarouselTrack gap="0.75rem" itemWidth="100%">
    {releases.map((release) => (
      <CarouselItem key={release.version}>
        <Card variant="outline" padding="md">{release.text}</Card>
      </CarouselItem>
    ))}
  </CarouselTrack>
</Carousel>`}
      >

        <Carousel label="Release notes" autoplay interval={5000}>
          <CarouselTrack gap="0.75rem" itemWidth="100%">
            {[
              { version: "V3.0", text: tcs("Spatial motion: ParallaxScene, OrbitField, ExpandableSurface, CardStack.") },
              { version: "V4.0", text: tcs("One depth scale for the whole library, and five new chart packs.") },
              { version: "V4.1", text: tcs("Twelve new components, from Accordion to Avatar.") },
            ].map((release) => (
              <CarouselItem key={release.version}>
                <Card variant="outline" padding="md" className="h-full gap-2">
                  <span className="flex items-center gap-2">
                    <Badge tone="accent" size="sm">
                      {release.version}
                    </Badge>
                    <Text variant="caption" tone="muted">
                      {tc("components.carousel.autoplayNote")}
                    </Text>
                  </span>
                  <Text variant="body">{tcs(release.text)}</Text>
                </Card>
              </CarouselItem>
            ))}
          </CarouselTrack>
          <CarouselControls arrows={false} />
        </Carousel>
      </Example>

      <Example
        title={tc("components.carousel.aspect.title")}
        description={tc("components.carousel.aspect.lead")}
        layout="grid"
        code={`{(["square", "video", "photo", "portrait"] as const).map((preset) => (
  <div key={preset} className="flex flex-col gap-2">
    <AspectRatio ratio={preset} className="rounded-lg border border-line-subtle">
      <span className="absolute inset-0 grid place-items-center text-micro">{preset}</span>
    </AspectRatio>
    <Button size="sm" variant="ghost">Use preset</Button>
  </div>
))}`}
      >

        {(["square", "video", "photo", "portrait"] as const).map((preset) => (
          <div key={preset} className="flex flex-col gap-2">
            <AspectRatio ratio={preset} className="rounded-lg border border-line-subtle bg-surface-sunken">
              <span className="absolute inset-0 grid place-items-center text-micro text-fg-muted">
                {preset}
              </span>
            </AspectRatio>
            <Button size="sm" variant="ghost">
              {tc("components.carousel.usePreset")}
            </Button>
          </div>
        ))}
      </Example>

      <Section title={tcs("API")}>
        <PropsTable
          rows={[
            { name: "Carousel label", type: "string", description: tcs("Required — a carousel is a named landmark.") },
            { name: "Carousel autoplay / interval", type: "boolean · number", default: "false · 6000", description: tcs("Off by default; pauses on hover, focus and a hidden tab.") },
            { name: "CarouselTrack itemWidth / gap", type: "string", default: '"min(20rem, 82%)" · "1rem"', description: tcs("The rhythm lives on the track, so every item matches.") },
            { name: "CarouselItem label", type: "string", description: tcs("Accessible name per slide; defaults to “Slide n of m”.") },
            { name: "CarouselControls dots / arrows", type: "boolean", default: "true", description: tcs("Dots are a tablist; arrows disable at the ends.") },
            { name: "AspectRatio ratio", type: "number | preset", default: '"square"', description: tcs("square · video · photo · wide · portrait · ultrawide, or any number.") },
          ]}
        />
      </Section>
      <EntryNotes entryIds={["carousel"]} />
      <EntryFooter />
    </DocPage>
  );
}
