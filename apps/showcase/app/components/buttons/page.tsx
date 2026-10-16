import type { Metadata } from "next";
import { Button, Heading, IconButton, Link as LucLink, Text, buttonVariants } from "@luc/ui";
import {
  RiAddLine,
  RiArrowRightLine,
  RiDownloadLine,
  RiMoreLine,
  RiPlayLine,
  RiSettings3Line,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { EntryApiSection } from "@/components/docs/entry-api";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { PageHeader } from "@/components/docs/page-header";
import { StateGrid } from "@/components/docs/state-grid";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Button" };

/*
 * The Button page, in the canonical Components V2 shape (`docs/COMPONENTS_V2.md`
 * §5), which is the same shape the registry generates for the other Actions
 * entries: title → one sentence → Examples → Usage → API → Guidelines →
 * related navigation.
 *
 * What changed in this revision, and why:
 *
 *   - the hand-written props table is **gone**, replaced by `EntryApiSection`,
 *     the compiler's own reading of the published package. It had listed
 *     `asChild`, which `ButtonProps` does not have (the supported way to make a
 *     link look like a button is `buttonVariants` on the anchor, which this page
 *     demonstrates), and it was missing `loadingLabel` and `tactile`. A table a
 *     human maintains beside a table a compiler emits is a table that drifts; now
 *     there is one, and it is the compiler's. `npm run verify:docs` fails if the
 *     package and the page ever disagree again.
 *   - the import line moved out of the header block and into **Usage**, beside
 *     the minimal call, which is where a reader looks for "how do I write this".
 *   - "States" became an example like the others, so the page reads as one list
 *     of capabilities rather than examples plus a floating section.
 *   - the "Other actions" link row is gone: the related row at the foot of the
 *     page reads the curated neighbours (`curation/notes.ts`) instead of
 *     repeating the sidebar with five anchors.
 *   - the Do/Don't rows and the accessibility note come from the same curation
 *     file the generated Actions pages use, so the advice exists once.
 */
export default async function ButtonPage() {
  const { tcs, href } = await getServerCopy();
  const notes = ENTRY_NOTES.button;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Button"
        lead={tcs("The action a person takes next: six intents, three sizes, and a press you can feel.")}
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Intents")}
          description={tcs(
            "Primary is the one action a region is about; everything else steps down from it.",
          )}
          code={`<Button variant="primary">Run backtest</Button>
<Button variant="accent">Preview</Button>
<Button variant="secondary">Duplicate</Button>
<Button variant="outline">Export</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete run</Button>`}
        >
          <Button variant="primary">Run backtest</Button>
          <Button variant="accent">Preview</Button>
          <Button variant="secondary">Duplicate</Button>
          <Button variant="outline">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete run</Button>
        </Example>

        <Example
          title={tcs("Sizes")}
          description={tcs(
            "Small for toolbars and dense tables, medium as the default, large for the one action on an empty state.",
          )}
          code={`<Button size="sm" variant="secondary">Small</Button>
<Button size="md" variant="secondary">Medium</Button>
<Button size="lg" variant="primary">Large</Button>`}
        >
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="md" variant="secondary">
            Medium
          </Button>
          <Button size="lg" variant="primary">
            Large
          </Button>
        </Example>

        <Example
          title={tcs("States")}
          description={tcs(
            "Hover, focus and loading are shown as specimens, so the interaction is reviewable in a screenshot as well as by using it.",
          )}
          layout="stage"
          code={`{/* focus-visible: the platform ring, 2px accent, 2px offset */}
<Button variant="secondary" className="ring-2 ring-accent-default ring-offset-2 ring-offset-surface-canvas">
  Duplicate
</Button>
<Button variant="primary" loading>Saving</Button>
<Button variant="secondary" disabled>Unavailable</Button>`}
        >
          <StateGrid
            states={[
              {
                label: tcs("Focus-visible"),
                note: tcs("A 2px accent ring, offset by 2px"),
                render: (
                  <Button
                    variant="secondary"
                    className="ring-2 ring-accent-default ring-offset-2 ring-offset-surface-canvas"
                  >
                    Duplicate
                  </Button>
                ),
              },
              {
                label: tcs("Loading"),
                note: tcs("Width preserved, aria-busy set, still focusable"),
                render: (
                  <Button variant="primary" loading>
                    Saving
                  </Button>
                ),
              },
              {
                label: tcs("Disabled"),
                note: tcs("Native disabled, never whole-component opacity"),
                render: (
                  <Button variant="secondary" disabled>
                    Unavailable
                  </Button>
                ),
              },
            ]}
          />
        </Example>

        <Example
          title={tcs("With an icon")}
          description={tcs(
            "Icons are decorative and optically aligned; the label carries the meaning, so an icon never becomes the only name.",
          )}
          code={`<Button variant="primary" leadingIcon={<RiPlayLine />}>Run</Button>
<Button variant="secondary" leadingIcon={<RiDownloadLine />}>Export</Button>
<Button variant="secondary" trailingIcon={<RiArrowRightLine />}>Continue</Button>`}
        >
          <Button variant="primary" leadingIcon={<RiPlayLine />}>
            Run
          </Button>
          <Button variant="secondary" leadingIcon={<RiDownloadLine />}>
            Export
          </Button>
          <Button variant="secondary" trailingIcon={<RiArrowRightLine />}>
            Continue
          </Button>
        </Example>

        <Example
          title={tcs("Icon-only")}
          description={tcs(
            "An icon-only action is an `IconButton`, and its `label` is required — that is the whole difference between the two components.",
          )}
          code={`<IconButton label="Add instrument" icon={<RiAddLine />} />
<IconButton label="Settings" icon={<RiSettings3Line />} variant="ghost" />
<IconButton label="More actions" icon={<RiMoreLine />} variant="solid" showTooltip />`}
        >
          <IconButton label="Add instrument" icon={<RiAddLine />} />
          <IconButton label="Settings" icon={<RiSettings3Line />} variant="ghost" />
          <IconButton label="More actions" icon={<RiMoreLine />} variant="solid" showTooltip />
        </Example>

        <Example
          title={tcs("Loading and disabled")}
          description={tcs(
            "Loading keeps the label and the width and sets aria-busy; disabled is for an action that genuinely cannot run.",
          )}
          code={`<Button variant="primary" loading loadingLabel="Saving the run">Saving</Button>
<Button variant="secondary" disabled>Unavailable</Button>`}
        >
          <Button variant="primary" loading loadingLabel="Saving the run">
            Saving
          </Button>
          <Button variant="secondary" disabled>
            Unavailable
          </Button>
        </Example>

        <Example
          title={tcs("A block action")}
          description={tcs(
            "`block` fills the available width — for the single action at the foot of a form or a card.",
          )}
          layout="block"
          code={`<Button variant="primary" block>Publish revision</Button>`}
        >
          <Button variant="primary" block>
            Publish revision
          </Button>
        </Example>

        <Example
          title={tcs("A link that looks like a button")}
          description={tcs(
            "An anchor keeps the anchor contract and borrows the button's recipe; never put a link inside a button.",
          )}
          code={`<Link href="/charts" className={buttonVariants({ variant: "secondary" })}>
  Open the chart catalogue
</Link>`}
        >
          <LucLink href={href("/charts")} className={buttonVariants({ variant: "secondary" })}>
            {"Open the chart catalogue"}
          </LucLink>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={'import { Button, buttonVariants } from "@luc/ui";'} />
        <CodeBlock
          code={`<Button variant="primary" onClick={runBacktest}>
  Run backtest
</Button>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`type` defaults to `button` rather than `submit`, so a Button inside a form never submits it by accident.",
          )}
        </Text>
      </section>

      {/* ----------------------------------------------------------------- api */}
      <EntryApiSection entryId="button" />

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="guidelines">
          {tcs("Guidelines")}
        </Heading>
        <GuidanceCards
          use={notes?.guidance?.use ?? []}
          avoid={notes?.guidance?.avoid ?? []}
          tcs={tcs}
        />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <Heading size="title" as="h3">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="button" related={["link", "icon-button"]} />
    </DocPage>
  );
}
