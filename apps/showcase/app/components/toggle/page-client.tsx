"use client";

import type { ReactNode } from "react";

import {
  Card,
  Heading,
  Link,
  Separator,
  Text,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  cn,
  toggleVariants,
} from "@luc/ui";
import { RiBold, RiItalic, RiListCheck2, RiUnderline } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { PageHeader } from "@/components/docs/page-header";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * Toggle, in the canonical Components V2 shape.
 *
 * The three list controls in this library answer three different questions, and
 * this page is the only place that says so with real specimens:
 *
 *   Toggle          an independent on/off *action* (bold, show ranges)
 *   ToggleGroup     a set of independent options, or exactly one of them
 *   Toolbar         the keyboard contract around a strip of them
 *
 * What changed in this revision:
 *
 *   - the "Joined actions" pair of `ButtonGroup` specimens moved to the page that
 *     documents `ButtonGroup`; the one toolbar composition stayed here, where it
 *     demonstrates a toggle inside a toolbar rather than a group's geometry.
 *   - the API table is the compiler's, not a hand-written one, and it no longer
 *     mixes in the `ButtonGroup`/`Toolbar` symbols (see `page.tsx`).
 *   - the Do/Don't rows and the accessibility note come from the same curation
 *     file the generated Actions pages read, so the advice exists once.
 */
export function TogglePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tc, tcs, href } = useI18n();
  const notes = ENTRY_NOTES.toggle;
  /*
   * The visual for one control inside a `Toolbar`.
   *
   * `ToolbarToggleItem` is the Radix part re-exported as it is, so it arrives
   * with no skin: the module styles the shell and hands the caller the recipe it
   * already has. Composing `toggleVariants` is the supported way to make it look
   * like a LUC control, and it is what the snippet shows. Measured, not assumed —
   * without it, three items render as a vertical column inside the toolbar.
   */
  const toolbarItem = cn(toggleVariants({ variant: "outline", size: "sm" }), "px-2");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Toggle"
        lead={tcs(
          "A button that keeps its pressed state: formatting, column sets, and any on/off that is not a switch.",
        )}
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <Heading size="title" as="h2" id="examples">
          {tcs("Examples")}
        </Heading>

        <Example
          title={tcs("Pressed and unpressed")}
          description={tc("components.toggle.pressed.lead")}
          code={`<Toggle variant="outline" label="Bold"><RiBold /></Toggle>
<Toggle variant="outline" label="Italic"><RiItalic /></Toggle>
<Toggle variant="soft" defaultPressed label="Show ranges"><RiListCheck2 /> Ranges</Toggle>
<Toggle label="Disabled" disabled>Off</Toggle>`}
        >
          <Toggle variant="outline" label="Bold">
            <RiBold />
          </Toggle>
          <Toggle variant="outline" label="Italic">
            <RiItalic />
          </Toggle>
          <Toggle variant="outline" label="Underline">
            <RiUnderline />
          </Toggle>
          <Separator orientation="vertical" className="h-6" />
          <Toggle variant="soft" defaultPressed>
            <RiListCheck2 />
            <span>Ranges</span>
          </Toggle>
          <Toggle label={tcs("Disabled")} disabled>
            {tcs("Off")}
          </Toggle>
        </Example>

        <Example
          title={tcs("A group: multiple or single")}
          description={tc("components.toggle.group.lead")}
          layout="block"
          code={`<ToggleGroup type="multiple" defaultValue={["price", "volume"]} aria-label="Columns">
  <ToggleGroupItem value="price">Price</ToggleGroupItem>
  <ToggleGroupItem value="volume">Volume</ToggleGroupItem>
  <ToggleGroupItem value="funding">Funding</ToggleGroupItem>
</ToggleGroup>

<ToggleGroup type="single" defaultValue="d1" aria-label="Aggregation">
  <ToggleGroupItem value="h1">1h</ToggleGroupItem>
  <ToggleGroupItem value="d1">1d</ToggleGroupItem>
  <ToggleGroupItem value="w1">1w</ToggleGroupItem>
</ToggleGroup>`}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Text variant="caption" tone="muted" as="p">
                {tcs("multiple")}
              </Text>
              <ToggleGroup type="multiple" defaultValue={["price", "volume"]} aria-label="Columns">
                <ToggleGroupItem value="price">Price</ToggleGroupItem>
                <ToggleGroupItem value="volume">Volume</ToggleGroupItem>
                <ToggleGroupItem value="funding">Funding</ToggleGroupItem>
              </ToggleGroup>
              <Text variant="caption" tone="muted" as="p">
                {tc("components.toggle.multiple")}
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="caption" tone="muted" as="p">
                {tcs("single")}
              </Text>
              <ToggleGroup type="single" defaultValue="d1" aria-label="Aggregation">
                <ToggleGroupItem value="h1">1h</ToggleGroupItem>
                <ToggleGroupItem value="d1">1d</ToggleGroupItem>
                <ToggleGroupItem value="w1">1w</ToggleGroupItem>
              </ToggleGroup>
              <Text variant="caption" tone="muted" as="p">
                {tc("components.toggle.single")}
              </Text>
            </div>
          </div>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="caption" tone="secondary">
              {tc("components.toggle.vsSegmented")}
            </Text>
            <Text variant="caption" tone="muted">
              <Link
                href={href("/components/segmented-control")}
                className="luc-focus text-fg-accent underline"
              >
                {"SegmentedControl"}
              </Link>
            </Text>
          </Card>
        </Example>

        <Example
          title={tcs("A toolbar")}
          description={tc("components.toggle.toolbarNote")}
          /* `inline`, so the shell hugs its controls. `block` stretched a
           * three-button strip across the whole stage, which reads as an empty
           * toolbar rather than a dense one. */
          layout="inline"
          code={`<Toolbar label="Formatting">
  <ToolbarToggleGroup
    type="multiple"
    defaultValue={["bold"]}
    aria-label="Text style"
    className="flex items-center gap-1"
  >
    <ToolbarToggleItem
      value="bold"
      aria-label="Bold"
      className={cn(toggleVariants({ variant: "outline", size: "sm" }), "px-2")}
    >
      <RiBold />
    </ToolbarToggleItem>
    <ToolbarToggleItem
      value="italic"
      aria-label="Italic"
      className={cn(toggleVariants({ variant: "outline", size: "sm" }), "px-2")}
    >
      <RiItalic />
    </ToolbarToggleItem>
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarToggleGroup
    type="single"
    defaultValue="columns"
    aria-label="Layout"
    className="flex items-center gap-1"
  >
    <ToolbarToggleItem
      value="columns"
      aria-label="Column sets"
      className={cn(toggleVariants({ variant: "outline", size: "sm" }), "px-2")}
    >
      <RiListCheck2 />
    </ToolbarToggleItem>
  </ToolbarToggleGroup>
</Toolbar>`}
        >
          <Toolbar label={tcs("Formatting")}>
            {/* The Radix parts are re-exported unstyled — the module styles the
             * shell and leaves the strip's layout to the caller, so the group
             * carries its own `flex`. Measured: without it, three items render as
             * a column inside the toolbar. See the note on the ButtonGroup page. */}
            <ToolbarToggleGroup
              type="multiple"
              defaultValue={["bold"]}
              aria-label="Text style"
              className="flex items-center gap-1"
            >
              {(
                [
                  { value: "bold", label: "Bold", icon: <RiBold className="size-4" /> },
                  { value: "italic", label: "Italic", icon: <RiItalic className="size-4" /> },
                  { value: "underline", label: "Underline", icon: <RiUnderline className="size-4" /> },
                ] as const
              ).map((item) => (
                <ToolbarToggleItem
                  key={item.value}
                  value={item.value}
                  aria-label={item.label}
                  className={toolbarItem}
                >
                  {item.icon}
                </ToolbarToggleItem>
              ))}
            </ToolbarToggleGroup>
            <ToolbarSeparator className="mx-1 w-px self-stretch bg-line-subtle" />
            <ToolbarToggleGroup
              type="single"
              defaultValue="columns"
              aria-label="Layout"
              className="flex items-center gap-1"
            >
              <ToolbarToggleItem value="columns" aria-label="Column sets" className={toolbarItem}>
                <RiListCheck2 className="size-4" />
              </ToolbarToggleItem>
            </ToolbarToggleGroup>
          </Toolbar>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <Heading size="title" as="h2" id="usage">
          {tcs("Usage")}
        </Heading>
        <ImportLine line={'import { Toggle, ToggleGroup, ToggleGroupItem } from "@luc/ui";'} />
        <CodeBlock
          code={`<Toggle label="Bold" defaultPressed onPressedChange={applyBold}>
  <RiBold />
</Toggle>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`pressed` plus `onPressedChange` controls it; `defaultPressed` leaves the state to the component. A group item takes `value` instead, and the group takes `type`.",
          )}
        </Text>
      </section>

      {apiSection}

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
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs("ButtonGroup and Toolbar are one module, documented together on")}{" "}
          <Link className="luc-focus text-fg-accent underline" href={href("/components/button-group")}>
            {tcs("the ButtonGroup page")}
          </Link>
          .
        </Text>
      </section>

      <EntryFooter entryId="toggle" related={["button-group", "button"]} />
    </DocPage>
  );
}
