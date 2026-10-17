"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Code,
  Field,
  Input,
  Panel,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Text,
  type SheetSide,
  type SheetSize,
} from "@luc/ui";
import { RiFilter3Line, RiSettings3Line } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

export function SheetPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  /*
   * The open flag and the edge are two pieces of state, not one.
   *
   * A single `open: SheetSide | null` is the compact way to write it, and it is
   * what this page used to do — but then the edge is derived from the state
   * that closes the panel, so the moment the exit animation begins the panel
   * re-anchors to the fallback edge and slides away from there. Keeping the
   * edge independently means the panel leaves the way it arrived.
   */
  const [open, setOpen] = useState(false);
  const [edge, setEdge] = useState<{ side: SheetSide; size: SheetSize }>({ side: "right", size: "md" });
  const [size, setSize] = useState<SheetSize>("md");

  const openAt = (side: SheetSide, next: SheetSize) => {
    setEdge({ side, size: next });
    setOpen(true);
  };

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Sheet")}
        title="Sheet"
        lead="A side-anchored panel for settings, filters, details and navigation. It is built on the same Radix Dialog primitive as Dialog, so focus trapping, focus restore, Escape and overlay behaviour are the mature ones LUC already ships. A gesture drawer is deliberately out of scope: a Sheet is a panel, not a swipeable card."
      />
      <ExamplesHeading />

      <ImportLine line={'import {\n  Sheet,\n  SheetBody,\n  SheetContent,\n  SheetDescription,\n  SheetFooter,\n  SheetHeader,\n  SheetTitle,\n} from "@luc/ui";'} />

      <Example
        title={tcs("Edges")}
        description={tcs("Four edges, one surface. Choose the edge by what the panel is for: right for settings and details, left for navigation, bottom for filters on small screens.")}
        layout="inline"
        code={`<Sheet open={edge !== null} onOpenChange={(next) => setEdge(next ? edge : null)}>
  <Button
    variant="secondary"
    aria-haspopup="dialog"
    onClick={() => openAt("right", size)}
  >
    right
  </Button>
  <SheetContent side="right" size="md">
    <SheetHeader>
      <SheetTitle>Chart settings</SheetTitle>
    </SheetHeader>
    <SheetBody>...</SheetBody>
    <SheetFooter>
      <Button>Apply</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
      >

        {/* `aria-haspopup="dialog"` is what `SheetTrigger` sets on the button it
          * wraps; these four drive one controlled Sheet from local state, so they
          * have to declare it themselves. Without it a reader is told the button
          * opens nothing, and the wrong shape of popup is announced. */}
        {(["right", "left", "top", "bottom"] as const).map((side) => (
          <Button
            key={side}
            variant="secondary"
            aria-haspopup="dialog"
            onClick={() =>
              openAt(
                side,
                side === "left" ? "sm" : side === "top" || side === "bottom" ? "md" : size,
              )
            }
          >
            {side}
          </Button>
        ))}
        <Select value={size} onValueChange={(next) => setSize(next as SheetSize)}>
          <SelectTrigger size="sm" aria-label="Sheet size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent size="sm">
            {(["sm", "md", "lg", "xl", "full"] as const).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Example>

      <Sheet open={open && edge.side === "right"} onOpenChange={setOpen}>
        <SheetContent side={edge.side} size={edge.size}>
          <SheetHeader icon={<RiSettings3Line />}>
            <SheetTitle>Chart settings</SheetTitle>
            <SheetDescription className="text-caption text-fg-muted">
              {tcs("Applies to this workspace only.")}</SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-5">
            <Field label={tcs("Lookback")} description={tcs("Bars of history used by every overlay.")}>
              <Input defaultValue="365" inputMode="numeric" />
            </Field>
            <Field label={tcs("Price scale")}>
              <Select defaultValue="linear">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="log">Logarithmic</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-col gap-3">
              <Switch defaultChecked label={tcs("Snap crosshair to bar")} description={tcs("Skips the interpolation.")} />
              <Switch label={tcs("Show volume pane")} />
              <Checkbox defaultChecked label={tcs("Persist these settings")} />
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="micro" tone="muted" as="p">
                {tcs("A long body scrolls on its own")}</Text>
              {Array.from({ length: 8 }, (_, index) => (
                <p key={index} className="text-caption text-fg-muted">
                  Section {index + 1} {tcs("— the header and the footer stay put while this region scrolls, which is the whole reason a Sheet exists rather than a dialog.")}</p>
              ))}
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Apply</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={open && edge.side !== "right"} onOpenChange={setOpen}>
        <SheetContent side={edge.side} size={edge.size}>
          <SheetHeader icon={<RiFilter3Line />}>
            <SheetTitle>
              {edge.side === "left" ? "Workspaces" : edge.side === "top" ? "Global filters" : "Table filters"}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-3">
            <Text variant="caption" tone="muted">
              {edge.side === "left"
                ? tcs("A left panel reads as navigation: a list of destinations, not a form.")
                : tcs("The same surface, anchored to a horizontal edge, for filters and compact controls.")}
            </Text>
            {Array.from({ length: 6 }, (_, index) => (
              <Panel key={index} className="p-3 text-caption text-fg-secondary">
                Item {index + 1}
              </Panel>
            ))}
          </SheetBody>
          <SheetFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Section title={tcs("Behaviour that comes for free")} description={tcs("Inherited from the Dialog primitive, not re-invented here.")}>
        <Panel className="flex flex-col gap-3 p-5">
          <ul className="flex flex-col gap-2 text-caption text-fg-muted">
            <li>{tcs("Focus is trapped inside the panel and returned to the trigger on close.")}</li>
            <li>{tcs("Escape closes; the overlay absorbs the click and the page behind never scrolls away.")}</li>
            <li>{tcs("The panel is a labelled dialog, so screen readers announce it by its title.")}</li>
            <li>{tcs("Under reduced motion the slide collapses to an immediate appearance.")}</li>
          </ul>
          <Code block>{`// Sizes are a vocabulary, not a free-for-all: sm, md, lg, xl, full.
// Widths for left/right edges, heights for top/bottom.`}</Code>
        </Panel>
      </Section>
      {apiSection}
      <EntryNotes entryIds={["sheet"]} />
      <EntryFooter />
    </DocPage>
  );
}
