"use client";

/*
 * The gallery tiles that need state, so `/motion` can show the real component in
 * a card instead of naming it.
 *
 * Most motion primitives wrap a `div` and can be demonstrated inline with no
 * island. Five cannot: `SelectionBeam` links two live elements by ref,
 * `ClickBurst` sparks from a real pointer position, and `IconMorph`,
 * `DataChangeFlash` and `Collapse` are all *changes of state* — a still frame of
 * them is a picture of nothing.
 *
 * Each tile is deliberately small. A gallery specimen's job is to make the
 * capability recognisable in one glance, with the full surface one click away;
 * a tile that needs instructions has failed at that.
 */

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  Badge,
  Button,
  CardStack,
  CardStackControls,
  CardStackItem,
  ClickBurst,
  Collapse,
  DataChangeFlash,
  ExpandableSurface,
  ExpandableSurfaceClose,
  ExpandableSurfaceContent,
  ExpandableSurfaceTrigger,
  IconMorph,
  Inline,
  KineticHeadline,
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTitle,
  MorphingDialogTrigger,
  SelectionBeam,
  Text,
  useCardStack,
} from "@luc/ui";
import { RiAddLine, RiSubtractLine } from "@remixicon/react";

/** A row that links to a detail panel, with a beam drawn between the two. */
export function SelectionBeamTile() {
  const from = useRef<HTMLButtonElement>(null);
  const to = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  return (
    <div className="relative grid h-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4">
      <button
        ref={from}
        type="button"
        onClick={() => setActive((value) => !value)}
        className="luc-focus rounded-sm border border-line-subtle bg-surface-raised px-2.5 py-1.5 text-caption text-fg-primary"
      >
        Q3 review
      </button>
      <span aria-hidden="true" />
      <div ref={to} className="rounded-sm border border-line-accent bg-surface-raised px-2.5 py-1.5 text-caption text-fg-secondary">
        Detail
      </div>
      <SelectionBeam from={from} to={to} active={active} tone="accent" />
    </div>
  );
}

/** A spark at the pointer, on a real completion. */
export function ClickBurstTile() {
  const [done, setDone] = useState(false);
  return (
    <div className="grid h-full place-items-center p-4">
      <Button
        variant={done ? "secondary" : "primary"}
        size="sm"
        onClick={() => setDone((value) => !value)}
      >
        {done ? "Sent" : "Send"}
        <ClickBurst count={7} spread={26} />
      </Button>
    </div>
  );
}

/** Two glyphs in one box: the state changes, the box does not. */
export function IconMorphTile() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid h-full place-items-center p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-pressed={open}
      >
        <IconMorph
          state={open ? "close" : "open"}
          size={16}
          icons={{
            open: <RiAddLine />,
            close: <RiSubtractLine />,
          }}
        />
        {open ? "Collapse" : "Expand"}
      </Button>
    </div>
  );
}

/** A number that changed, and says so once. */
export function DataChangeFlashTile() {
  const [value, setValue] = useState(97);
  return (
    <div className="grid h-full place-items-center p-4">
      <Inline gap="sm" align="center">
        <DataChangeFlash value={value} tone="positive" className="rounded-sm px-2 py-1">
          <Text variant="body" className="luc-numeric">
            {value}
          </Text>
        </DataChangeFlash>
        <Button variant="ghost" size="sm" onClick={() => setValue((current) => current + 1)}>
          Tick
        </Button>
      </Inline>
    </div>
  );
}

/** Height measured, not guessed. */
export function CollapseTile() {
  const { tcs } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full flex-col justify-center p-3">
      <Collapse
        open={open}
        onOpenChange={setOpen}
        title={tcs("Measured height")}
        description={tcs("Nothing below jumps when this closes.")}
        aside={<Badge size="sm" tone="neutral">{open ? "open" : "closed"}</Badge>}
      >
        <Text variant="caption" tone="muted">
          The panel is a real disclosure: its height is read from the content, so the row under it moves by exactly
          the amount it should.
        </Text>
      </Collapse>
    </div>
  );
}

/** Ink that starts where the finger landed. */
export function PressRippleTile() {
  const { tcs } = useI18n();
  const [presses, setPresses] = useState(0);
  return (
    <div className="grid h-full place-items-center p-4">
      <Button variant="secondary" size="sm" onClick={() => setPresses((count) => count + 1)}>
        {tcs("Press me")}
        {presses > 0 ? <span className="sr-only">{`Pressed ${presses} times`}</span> : null}
      </Button>
    </div>
  );
}

/** A surface that grows out of its own rectangle, in flow. */
export function ExpandableSurfaceTile() {
  const { tcs } = useI18n();
  return (
    <div className="grid h-full place-items-center p-4">
      <ExpandableSurface className="w-full max-w-[22rem]">
        <ExpandableSurfaceTrigger className="w-full rounded-sm border border-line-subtle bg-surface-raised px-3 py-2 text-left text-caption text-fg-primary">
          {tcs("Expand this row")}
        </ExpandableSurfaceTrigger>
        <ExpandableSurfaceContent className="rounded-sm border border-line-subtle border-t-0 p-3">
          <Text variant="caption" tone="muted">
            {tcs("No portal, no scroll lock, no focus trap — the panel is part of the document.")}
          </Text>
          <ExpandableSurfaceClose className="mt-2 text-caption text-fg-accent">{tcs("Close")}</ExpandableSurfaceClose>
        </ExpandableSurfaceContent>
      </ExpandableSurface>
    </div>
  );
}

/** Depth as navigation: the deck says where you are. */
export function CardStackTile() {
  return (
    <div className="grid h-full place-items-center p-4">
      {/*
       * Same shape as the full specimen: an opaque card, enough layer offset for
       * the titles to read as titles, and dimming so the front card is clearly
       * the front one. A tile that is a smaller copy of a broken arrangement is
       * still broken.
       */}
      <CardStack visible={3} offsetY={16} shrink={0.05} className="h-36 w-[15rem]">
        {[
          { id: "one", title: "Trend", body: "Carry" },
          { id: "two", title: "Carry", body: "Baseline" },
          { id: "three", title: "Baseline", body: "Trend" },
        ].map((card) => (
          <CardStackItem key={card.id}>
            {/* Content at the top, empty bottom strip = the peek. */}
            <div className="flex h-24 flex-col justify-start gap-1 rounded-lg border border-line-subtle bg-surface-default p-3 shadow-rest">
              <Text variant="label">{card.title}</Text>
              <Text variant="caption" tone="muted">
                {card.body}
              </Text>
            </div>
          </CardStackItem>
        ))}
        <CardStackControls className="justify-center">
          <CardStackPosition />
        </CardStackControls>
      </CardStack>
    </div>
  );
}

/** The deck's own "1 / 3", so the tile does not stack three copies of it. */
function CardStackPosition() {
  const { index, count } = useCardStack();
  return (
    <Text variant="caption" tone="muted" as="p" className="luc-numeric tabular-nums" aria-hidden="true">
      {index + 1} / {count}
    </Text>
  );
}

/** Words re-entering with a direction and a rhythm. */
export function KineticHeadlineTile() {
  const [which, setWhich] = useState(0);
  const headlines = ["Alive on every interaction", "One system, many products"];
  return (
    <div className="flex h-full flex-col items-start justify-center gap-3 p-4">
      <KineticHeadline
        as="p"
        text={headlines[which] ?? headlines[0]!}
        className="font-display text-heading-sm text-fg-primary"
      />
      <Button variant="ghost" size="sm" onClick={() => setWhich((index) => (index + 1) % headlines.length)}>
        Change the words
      </Button>
    </div>
  );
}

/** Trigger-to-surface continuity. */
export function MorphingTile() {
  const { tcs } = useI18n();
  return (
    <div className="grid h-full place-items-center p-4">
      <MorphingDialog>
        <MorphingDialogTrigger className="rounded-md border border-line-subtle bg-surface-raised px-3 py-2 text-caption text-fg-primary">
          {tcs("Open the panel")}
        </MorphingDialogTrigger>
        {/* No className: it would land on the fixed centring frame. The panel is
          * sized by `width`, and its content carries the padding. */}
        <MorphingDialogContent width="sm">
          <div className="flex flex-col gap-3 p-4">
            <MorphingDialogTitle className="text-title text-fg-primary">{tcs("Grown from the trigger")}</MorphingDialogTitle>
            <MorphingDialogDescription className="text-caption text-fg-muted">
              {tcs("The panel keeps the trigger's corner radius and grows out of it.")}
            </MorphingDialogDescription>
            <MorphingDialogClose asChild>
              <Button variant="ghost" size="sm">
                {tcs("Close")}
              </Button>
            </MorphingDialogClose>
          </div>
        </MorphingDialogContent>
      </MorphingDialog>
    </div>
  );
}
