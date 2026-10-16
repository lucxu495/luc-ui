"use client";

import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Heading,
  IconButton,
  Inline,
  Panel,
  PanelBody,
  PanelHeader,
  Text,
} from "@luc/ui";
import { RiMoreLine, RiStackLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The Cards page, in the canonical Components V2 shape (`docs/COMPONENTS_V2.md`
 * §5) — the same order the other nine Layout pages use: title, one sentence,
 * Examples, Usage, API, Guidelines, related navigation.
 *
 * What changed in this revision, and why:
 *
 *   - the examples gained their `Examples` heading, which every other Layout
 *     page has and this one did not;
 *   - the **Playground is gone**: the Navigation review's decision is that every
 *     ordinary component page is examples first and nothing else, and a Card's
 *     props are small enough to demonstrate — four variants, three interaction
 *     modes, a padding scale — which the examples below do. The one thing the
 *     panel said better than an example can is that `selected` is only meaningful
 *     under `interaction="selectable"`, and that sentence is now in Guidelines,
 *     where a reader looking for advice finds it;
 *   - the hand-written props table is **replaced by `EntryApiSection`**, the
 *     compiler's own reading of `card.tsx`. The six handwritten rows summarised
 *     nine props and collapsed `as` and `href` into one, and a table a human
 *     maintains beside a table a compiler emits is a table that drifts; every
 *     public prop is still on the page, read from the declarations;
 *   - the Import section became a Usage section with the canonical import and a
 *     minimal call, which is where a reader looks for "how do I write this";
 *   - the Do/Don't rows moved to `curation/notes.ts`, so the same advice renders
 *     through the same `GuidanceCards` component the generated pages use.
 */
export function CardsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.card;
  const [selected, setSelected] = useState(true);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Cards and panels"
        lead="A container for one object: quiet by default, interactive only when the whole surface is genuinely clickable."
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Variants")}
          code={`<Card variant="default">A hairline and a small shadow on the canvas.</Card>
<Card variant="raised">Brighter surface, deeper shadow — stat cards.</Card>
<Card variant="outline">Transparent shell, for use inside another surface.</Card>
<Card variant="ghost">Grouping only. No chrome until it is hovered.</Card>`}
          description={tcs("Choose elevation by how far the surface is from the canvas, not by how important it feels.")}
          layout="grid"
          stageClassName="lg:grid-cols-4"
        >
          <Card variant="default" className="gap-2 p-4">
            <Heading size="title" as="h3">
              Default
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("A hairline and a small shadow on the canvas. The workhorse.")}
            </Text>
          </Card>
          <Card variant="raised" className="gap-2 p-4">
            <Heading size="title" as="h3">
              Raised
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("Brighter surface and deeper shadow. For stat cards and focused content.")}
            </Text>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Heading size="title" as="h3">
              Outline
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("Transparent shell. Use inside an existing surface or over media.")}
            </Text>
          </Card>
          <Card variant="ghost" className="gap-2 p-4">
            <Heading size="title" as="h3">
              Ghost
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("Grouping only. No chrome until it is hovered.")}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("Composition")}
          code={`<Card variant="raised">
  <CardHeader
    icon={<RiStackLine />}
    actions={<Badge size="sm" tone="info">nightly</Badge>}
  >
    <CardTitle>Research pipeline</CardTitle>
    <CardDescription>raw → analytics → validation → summary</CardDescription>
  </CardHeader>
  <CardContent>
    Seven analytics domains run after ingestion, then a read-only validation pass.
  </CardContent>
  <CardFooter>
    <Button size="sm" variant="secondary">Open run</Button>
    <Button size="sm" variant="ghost">Copy id</Button>
  </CardFooter>
</Card>`}
          description={tcs("CardHeader, CardContent and CardFooter give every card the same internal rhythm.")}
          layout="grid"
          stageClassName="lg:grid-cols-2"
        >
          <Card variant="raised">
            <CardHeader
              icon={<RiStackLine />}
              actions={
                <>
                  <Badge size="sm" tone="info">
                    nightly
                  </Badge>
                  <IconButton label="Card actions" icon={<RiMoreLine />} size="sm" />
                </>
              }
            >
              <CardTitle>Research pipeline</CardTitle>
              <CardDescription>{tcs("raw → analytics → validation → summary")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="label" tone="muted">
                {tcs("Seven analytics domains run after ingestion, then a read-only validation pass records a Lark summary.")}
              </Text>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">
                Open run
              </Button>
              <Button size="sm" variant="ghost">
                Copy id
              </Button>
            </CardFooter>
          </Card>

          <Panel>
            <PanelHeader
              actions={
                <Button size="sm" variant="ghost">
                  Refresh
                </Button>
              }
            >
              <RiStackLine className="size-4 text-fg-muted" />
              Panel header
            </PanelHeader>
            <PanelBody className="flex flex-col gap-3">
              <Text variant="caption" tone="muted">
                {tcs("Panels have no elevation. They structure content inside a surface without adding another visual layer.")}
              </Text>
              <Inline gap="xs">
                <Badge size="sm" tone="outline">
                  dense
                </Badge>
                <Badge size="sm" tone="outline">
                  no shadow
                </Badge>
              </Inline>
            </PanelBody>
          </Panel>
        </Example>

        <Example
          title={tcs("Interactive and selected")}
          code={`<Card variant="outline">Static: no hover response, because it is not clickable.</Card>\n\n<Card as="a" href="/runs/128" interaction="interactive">\n  Border, surface and shadow each move exactly one step.\n</Card>\n\n<Card interaction="selectable" selected={selected} onClick={toggle}>\n  Selected uses the accent border, never a filled accent surface.\n</Card>\n\n<Card interaction="featured">\n  The loudest static mode: a brighter border and a subtle accent glow at rest.\n</Card>`}
          description={tcs("Interaction adds a brighter border, one elevation step and half a pixel of travel. Selection uses the accent border plus a restrained glow.")}
          layout="grid"
          stageClassName="lg:grid-cols-4"
        >
          <Card variant="outline" className="gap-2 p-4">
            <Heading size="title" as="h3">
              {tcs("Static")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("No hover response. It is not clickable, so it does not pretend to be.")}
            </Text>
          </Card>

          <Card as="a" href="#" variant="default" interaction="interactive" className="gap-2 p-4">
            <Heading size="title" as="h3">
              {tcs("Interactive")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("Hover me. Border, surface and shadow each move exactly one step.")}
            </Text>
          </Card>

          <Card
            variant="default"
            interaction="selectable"
            selected={selected}
            onClick={() => setSelected((current) => !current)}
            className="gap-2 p-4"
          >
            <Inline justify="between" className="w-full">
              <Heading size="title" as="h3">
                {tcs("Selectable")}
              </Heading>
              <Badge size="sm" tone="accent">
                active
              </Badge>
            </Inline>
            <Text variant="caption" tone="muted">
              {tcs("Accent border, soft accent tint, subtle glow. Click to toggle.")}
            </Text>
          </Card>

          <Card interaction="featured" className="gap-2 p-4">
            <Heading size="title" as="h3">
              {tcs("Featured")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs(
                "The loudest static mode: a brighter border and a subtle accent glow at rest, without pretending to be clickable.",
              )}
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("Padding, and the element it renders as")}
          code={`<Card padding="md">The shell sets the inner rhythm.</Card>\n\n<Card as="article" variant="raised" padding="lg">\n  An article inside a list of runs.\n</Card>\n\n<Card as="section" variant="outline" padding="sm">\n  A page section. It says so in the outline.\n</Card>`}
          description={tcs(
            "`padding` is the shell's own rhythm — `none` hands it to the parts, which carry their own. `as` picks the element, so a card that holds an article or a page section appears in the document outline as one.",
          )}
          layout="grid"
          stageClassName="lg:grid-cols-3"
        >
          <Card padding="md" className="gap-2">
            <Heading size="title" as="h3">
              {tcs("Medium padding")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("The default rhythm for a card that carries its own content.")}
            </Text>
          </Card>

          <Card as="article" variant="raised" padding="lg" className="gap-2">
            <Heading size="title" as="h3">
              {tcs("An article")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("A run, a report, anything a reader acts on as one object.")}
            </Text>
          </Card>

          <Card as="section" variant="outline" padding="sm" className="gap-2">
            <Heading size="title" as="h3">
              {tcs("A section")}
            </Heading>
            <Text variant="caption" tone="muted">
              {tcs("A region with a heading of its own; tight padding keeps it quiet.")}
            </Text>
          </Card>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { Card, CardHeader, CardContent, CardFooter } from "@luc/ui";'} />
        <CodeBlock
          code={`<Card>
  <CardHeader>
    <CardTitle>Research pipeline</CardTitle>
    <CardDescription>raw → analytics → validation → summary</CardDescription>
  </CardHeader>
  <CardContent>Seven analytics domains run after ingestion.</CardContent>
  <CardFooter>
    <Button size="sm" variant="secondary">Open run</Button>
  </CardFooter>
</Card>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`Panel`, `PanelHeader` and `PanelBody` come from the same package and are what a region inside a card uses: `import { Panel, PanelHeader, PanelBody } from \"@luc/ui\";`.",
          )}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      {/* The page documents two exports, so the related row says so — `card`'s
       * registry row names `Card` only. */}
      <EntryFooter entryId="card" related={["panel", "section"]} />
    </DocPage>
  );
}
