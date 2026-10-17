"use client";

/*
 * The motion demos that need state.
 *
 * Motion is the one family where a static specimen is nearly always a lie: a
 * collapse that never closes, a burst that never fires or a selection that never
 * moves shows the *resting* frame and none of the behaviour. Each component
 * here is fully controlled — the caller owns `open`, the active index, the
 * watched value — so the specimen owns that state, which is also the code a
 * consumer writes.
 *
 * Reduced motion is never special-cased in these demos: the library already
 * swaps every one of these for an instant state change, and a demo that
 * disabled the effect itself would hide the contract it is documenting.
 */

import { useState } from "react";
import { Button, Card, Code, IconButton, Inline, Stack, Text, Toggle } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import {
  CardStack,
  CardStackControls,
  useCardStack,
  CardStackItem,
  ClickBurst,
  Collapse,
  DataChangeFlash,
  ExpandableSurface,
  ExpandableSurfaceClose,
  ExpandableSurfaceContent,
  ExpandableSurfaceTrigger,
  FadeSwap,
  IconMorph,
  Magnetic,
  MagnifyDock,
  MagnifyDockItem,
  MotionIntensityProvider,
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTitle,
  MorphingDialogTrigger,
  OrbitField,
  OrbitFieldCore,
  OrbitFieldNode,
  OrbitFieldRing,
  ParallaxLayer,
  ParallaxScene,
  Presence,
  Pressable,
  PressRipple,
  SelectionBeam,
  SharedHighlight,
  StaggerGroup,
  StaggerItem,
  TransitionPanel,
  useMotionProfile,
  usePointerMotionEnabled,
} from "@luc/ui/motion";

import { useRef } from "react";

export function CollapseDemo() {
  const [open, setOpen] = useState(true);
  /*
   * A client island is invisible to `localizeSpecimen`: the server walker sees
   * `<CollapseDemo />`, an element with no props and no children, and the copy
   * below is compiled into this module. So every string a reader sees in an island
   * is looked up here, through the same `tcs` the frames use — the dictionary is
   * shared, so the server render and the client hydration agree and there is
   * nothing to mismatch.
   *
   * The exception is the specimen's own fixture text: `title` and `description`
   * below are printed verbatim in this demo's code block (`lib/demo/motion/
   * feedback.tsx`), so they stay English. A preview that says 本季度已填满 beside a
   * snippet that says `title="Fills this quarter"` is a page contradicting itself,
   * which is worse than an English word inside a live example — see the same
   * boundary in `lib/i18n/messages.ts`. The prose underneath them is not printed
   * anywhere, so it is translated.
   */
  const { tcs } = useI18n();
  return (
    <Collapse
      open={open}
      onOpenChange={setOpen}
      title="Fills this quarter"
      description="One hundred and eighty-four, up from one hundred and two."
    >
      <Text variant="body" tone="muted" as="p">
        {tcs(
          "The trigger is a real button with `aria-expanded` and `aria-controls`; the panel is the region it points at.",
        )}
      </Text>
    </Collapse>
  );
}

export function ExpandableDemo() {
  return (
    <ExpandableSurface defaultOpen={false} className="w-full max-w-xl">
      <ExpandableSurfaceTrigger>
        <Card variant="outline" className="p-5">
          <Stack gap="xs">
            <Text variant="label" as="p">
              Sharpe, 12 months
            </Text>
            <Text variant="caption" tone="muted" as="p">
              1.24
            </Text>
          </Stack>
        </Card>
      </ExpandableSurfaceTrigger>
      <ExpandableSurfaceContent>
        <Card variant="outline" className="relative p-6">
          <Stack gap="sm">
            <Text variant="body-lg" as="p">
              Sharpe, 12 months
            </Text>
            <Text variant="body" tone="muted" as="p">
              A summary and its detail occupy the same place, so the page never jumps: the panel grows out of the card, and
              the collapsed face goes inert rather than staying tabbable behind it.
            </Text>
            <ExpandableSurfaceClose>Close</ExpandableSurfaceClose>
          </Stack>
        </Card>
      </ExpandableSurfaceContent>
    </ExpandableSurface>
  );
}

export function ClickBurstDemo() {
  const [count, setCount] = useState(0);
  return (
    <Inline gap="sm" align="center">
      <Button size="sm" onClick={() => setCount((value) => value + 1)}>
        <ClickBurst count={8} spread={22} />
        Approve
      </Button>
      <Text variant="caption" tone="muted">
        {count} acknowledgement{count === 1 ? "" : "s"}
      </Text>
    </Inline>
  );
}

export function DataChangeFlashDemo() {
  const [value, setValue] = useState(18.4);
  return (
    <Inline gap="md" align="center">
      <DataChangeFlash value={value} tone={value > 18.4 ? "negative" : "positive"} className="rounded-sm px-2 py-1">
        <Text variant="body" className="luc-numeric">
          {value.toFixed(1)} %
        </Text>
      </DataChangeFlash>
      <Button size="sm" variant="outline" onClick={() => setValue((current) => (current > 18.4 ? 18.4 : 20.1))}>
        New print
      </Button>
    </Inline>
  );
}

export function IconMorphDemo() {
  const [state, setState] = useState("idle");
  return (
    <Inline gap="md" align="center">
      <IconMorph
        state={state}
        size={22}
        icons={{
          idle: <span aria-hidden="true">▶</span>,
          running: <span aria-hidden="true">⏸</span>,
          done: <span aria-hidden="true">✓</span>,
        }}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => setState((current) => (current === "idle" ? "running" : current === "running" ? "done" : "idle"))}
      >
        Advance state
      </Button>
      <Code>{state}</Code>
    </Inline>
  );
}

export function PresenceDemo() {
  const [present, setPresent] = useState(true);
  const { tcs } = useI18n();
  return (
    <Stack gap="sm" align="start">
      <Toggle size="sm" pressed={present} onPressedChange={setPresent}>
        {tcs("Filter bar")}
      </Toggle>
      <Presence present={present}>
        <Card variant="outline" className="p-3">
          <Text variant="caption" tone="muted">
            {tcs("Mounted and unmounted with a fade, so a contextual panel does not pop.")}
          </Text>
        </Card>
      </Presence>
    </Stack>
  );
}

export function FadeSwapDemo() {
  const [slot, setSlot] = useState(1);
  return (
    <Stack gap="sm" align="start">
      <FadeSwap slot={slot} className="rounded-lg border border-line-subtle p-4">
        <Text variant="body">Panel {slot}</Text>
      </FadeSwap>
      <Button size="sm" variant="outline" onClick={() => setSlot((current) => (current === 3 ? 1 : current + 1))}>
        Next panel
      </Button>
    </Stack>
  );
}

export function TransitionPanelDemo() {
  const [index, setIndex] = useState(0);
  return (
    <Stack gap="sm" align="start">
      <TransitionPanel activeIndex={index} mode="overlay" className="w-full max-w-md rounded-lg border border-line-subtle p-4">
        <Card variant="outline" className="p-3">
          <Text variant="body">Step one: choose a universe.</Text>
        </Card>
        <Card variant="outline" className="p-3">
          <Text variant="body">Step two: choose a schedule.</Text>
        </Card>
        <Card variant="outline" className="p-3">
          <Text variant="body">Step three: confirm.</Text>
        </Card>
      </TransitionPanel>
      <Inline gap="sm">
        <Button size="sm" variant="outline" onClick={() => setIndex((current) => Math.max(0, current - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => setIndex((current) => Math.min(2, current + 1))}>
          Next
        </Button>
      </Inline>
    </Stack>
  );
}

export function SharedHighlightDemo() {
  const [value, setValue] = useState("returns");
  return (
    <SharedHighlight
      items={[
        { value: "returns", label: "Returns" },
        { value: "risk", label: "Risk" },
        { value: "costs", label: "Costs" },
      ]}
      value={value}
      onValueChange={setValue}
      variant="track"
      ariaLabel="Metric"
    />
  );
}

export function SelectionBeamDemo() {
  const source = useRef<HTMLButtonElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  return (
    <div className="flex w-full max-w-xl items-center justify-between gap-10">
      <button
        ref={source}
        type="button"
        onClick={() => setActive((current) => !current)}
        className="rounded-sm border border-line-default px-3 py-1.5 text-label"
      >
        Row 4
      </button>
      <div ref={target} className="rounded-sm border border-line-default px-3 py-1.5 text-label">
        Detail
      </div>
      <SelectionBeam from={source} to={target} active={active} />
    </div>
  );
}

export function StaggerDemo() {
  return (
    <StaggerGroup step={0.05} className="grid w-full max-w-md gap-2 sm:grid-cols-2">
      {["Return", "Volatility", "Sharpe", "Drawdown"].map((label, index) => (
        <StaggerItem key={label} index={index}>
          <Card variant="outline" className="p-3">
            <Text variant="caption" tone="muted">
              {label}
            </Text>
          </Card>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}

export function PressRippleDemo() {
  return (
    <PressRipple className="rounded-lg border border-line-subtle bg-surface-default px-6 py-4" rings={2}>
      <Text variant="body" as="span">
        {/*
         * Printed in this demo's own snippet (`lib/demo/motion/feedback.tsx`), so
         * it stays as written; `qa/i18n-live.mjs` recognises the class and reports
         * it as snippet-locked rather than as a leak.
         */}
        Press anywhere on this surface
      </Text>
    </PressRipple>
  );
}

export function PressableDemo() {
  return (
    <Pressable as="div" lift press className="rounded-lg border border-line-subtle bg-surface-default px-5 py-3" tabIndex={0}>
      <Text variant="body" as="span">
        A pressable surface
      </Text>
    </Pressable>
  );
}

export interface CardStackDemoProps {
  /** The deck's front-to-back labels. The count is the deck's size. */
  labels?: readonly string[];
  /** How many layers are visible at once, including the active one. */
  visible?: number;
  /** The strip of each back card that stays visible, in px. */
  offsetY?: number;
  /** Scale step per layer behind the active card. */
  shrink?: number;
  className?: string;
}

/**
 * The deck.
 *
 * Parameterised for MOT-002: the page's own specimen is the three-card default,
 * and the other configurations are the *same* component with different props
 * rather than three more copies of the same deck.
 */
export function CardStackDemo({
  labels = ["Baseline", "Trend", "Carry"],
  visible = 3,
  offsetY = 20,
  shrink = 0.05,
  className = "h-48 w-full max-w-sm",
}: CardStackDemoProps = {}) {
  /*
   * The deck's own copy goes through the dictionary like any other visible
   * text. It is safe to translate because no snippet in the registry prints
   * these literals — the code shows `cards.map(...)` and a `labels` prop — so
   * the preview and the copyable code still agree.
   */
  const { tcs } = useI18n();
  return (
    <CardStack
      visible={visible}
      /*
       * The offset is the *peek*: the strip of each card behind the active one
       * that stays visible.
       *
       * A downward offset hides the top of a back card and reveals its bottom
       * edge, so whatever sits at the bottom of a card is what ladders down the
       * deck. Twenty pixels is enough to read as a deck and small enough that the
       * strip is the card's empty padding rather than a line of text — the audit's
       * C-02 was three copies of a caption showing through three translucent
       * cards, and text in the peek area reproduces that in a different way.
       */
      offsetY={offsetY}
      shrink={shrink}
      /*
       * A deck is a composition in space: it needs a stage. The card is `h-32`
       * and each layer behind it sinks 14px, so 12rem frames the whole stack and
       * leaves the controls room at the bottom.
       */
      className={className}
    >
      {labels.map((label) => (
        <CardStackItem key={label}>
          {/*
           * An opaque card, not `outline`.
           *
           * `outline` is `bg-transparent`, so three stacked outlines let every
           * layer's text show through the one in front — which is exactly what
           * the audit photographed. A stack also needs the *front* card to be the
           * brightest thing in the deck, so the active layer keeps the raised
           * surface and the ones behind it are dimmed by `dim`.
           */}
          {/* Content sits at the top; the bottom strip is the peek, so it stays
            * empty. */}
          <Card variant="default" className="flex h-32 flex-col justify-start gap-1 p-4">
            <Text variant="label" as="p">
              {tcs(label)}
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("Prepared fixture")}
            </Text>
          </Card>
        </CardStackItem>
      ))}
      {/*
       * One position readout, beside the controls, instead of a copy inside
       * every card. Three copies of "Card N of 3" one line apart is unreadable by
       * construction; one readout next to the thing that changes it is not.
       */}
      <CardStackControls className="justify-center">
        <CardStackPosition />
      </CardStackControls>
    </CardStack>
  );
}

/** "1 / 3", read from the deck itself rather than passed down by hand. */
function CardStackPosition() {
  const { index, count } = useCardStack();
  return (
    <Text variant="caption" tone="muted" as="p" className="luc-numeric tabular-nums" aria-hidden="true">
      {index + 1} / {count}
    </Text>
  );
}

export function MagnifyDockDemo() {
  return (
    <MagnifyDock range={90} scale={0.45} lift={6} className="rounded-xl border border-line-subtle bg-surface-default px-4 py-3">
      {["◧", "◫", "⊞", "⌗", "☰"].map((glyph, index) => (
        <MagnifyDockItem key={glyph} label={`Action ${index + 1}`}>
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-sm border border-line-subtle">
            {glyph}
          </span>
        </MagnifyDockItem>
      ))}
    </MagnifyDock>
  );
}

export function OrbitFieldDemo() {
  return (
    /*
     * A bounded stage, because the ring radii are percentages of the container's
     * *width*.
     *
     * This specimen ran on a full-bleed `w-full` box and asked for `radius={92}`:
     * on a 1440px viewport the outer ring came out ~2,000px wide, the orbit's
     * seats sat outside the column and the whole document scrolled sideways by
     * 257px. The gallery tile has always drawn the same component inside a
     * bounded stage — the geometry is simply tuned for one, and the page was
     * handing it the width of the reading column. `overflow-hidden` is the
     * belt-and-braces: on a phone the stage is narrow, so the ring is clipped
     * rather than allowed to push the page.
     */
    <div className="grid h-64 w-full place-items-center overflow-hidden">
      <OrbitField
        label="Model pipeline"
        tilt={58}
        perspective={900}
        speed={1}
        className="h-full w-[26rem] max-w-full"
      >
        <OrbitFieldRing radius={92} duration={18}>
          <OrbitFieldNode>Ingest</OrbitFieldNode>
          <OrbitFieldNode>Store</OrbitFieldNode>
        </OrbitFieldRing>
        <OrbitFieldRing radius={52} duration={12}>
          <OrbitFieldNode>Model</OrbitFieldNode>
          <OrbitFieldNode>Serve</OrbitFieldNode>
        </OrbitFieldRing>
        <OrbitFieldCore>API</OrbitFieldCore>
      </OrbitField>
    </div>
  );
}

export function ParallaxDemo() {
  return (
    <ParallaxScene depth={16} perspective={900} className="h-52 w-full overflow-hidden rounded-xl border border-line-subtle bg-surface-sunken">
      <ParallaxLayer depth={0.2} z={-80} className="absolute inset-6 rounded-lg border border-line-subtle" />
      <ParallaxLayer depth={1} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Text variant="label">Move the pointer</Text>
      </ParallaxLayer>
      <ParallaxLayer depth={-0.4} z={60} className="absolute bottom-6 right-8 rounded-md border border-line-subtle bg-surface-default px-3 py-1.5">
        <Text variant="caption" tone="muted">
          Foreground
        </Text>
      </ParallaxLayer>
    </ParallaxScene>
  );
}

export function MagneticDemo() {
  return (
    <div className="grid h-32 w-full place-items-center">
      <Magnetic strength={0.18} radius={160}>
        <Button variant="secondary" size="sm">
          Lean toward the cursor
        </Button>
      </Magnetic>
    </div>
  );
}

export interface MorphingDialogDemoProps {
  /** The panel's width token. The trigger stays the same size either way. */
  width?: "sm" | "md" | "lg";
  /** The label on the trigger card. */
  triggerTitle?: string;
  /** The facts the panel shows, one cell each. */
  items?: readonly { label: string; value: string }[];
}

const RUN_FACTS = [
  { label: "Sharpe", value: "1.42" },
  { label: "Max drawdown", value: "−8.4%" },
  { label: "Trades", value: "1,204" },
] as const;

export function MorphingDialogDemo({
  width = "md",
  triggerTitle = "Run detail",
  items = RUN_FACTS,
}: MorphingDialogDemoProps = {}) {
  /*
   * The island's own copy, looked up here for the reason `CollapseDemo` states —
   * and, as there, only the strings this demo's code block does *not* print.
   * `Run detail` and `Close` are both in the snippet, so they stay as written;
   * `Close` in particular is a dictionary key that means the market close
   * (收盘), and translating a dialog's close button into it would be a worse bug
   * than the one being fixed.
   */
  const { tcs } = useI18n();
  return (
    <MorphingDialog>
      <MorphingDialogTrigger>
        {/*
         * A recognizable trigger: an opaque surface that reads as the thing you
         * press, with the destination named. It is what the panel grows out of,
         * so it also has to be the same shape the panel roughly becomes.
         */}
        <Card variant="default" className="w-56 cursor-pointer p-4">
          <Stack gap="xs">
            <Text variant="label" as="p">
              {triggerTitle}
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("Opens a panel from this card")}
            </Text>
          </Stack>
        </Card>
      </MorphingDialogTrigger>
      {/*
       * No `className` here.
       *
       * `className` lands on the *centring frame* — a `fixed inset-0` box — and
       * this demo used to pass `w-[26rem]`, which narrowed the frame to 416px and
       * pinned it to the left edge of the viewport. That is exactly the geometry
       * the independent audit measured (C-03). The panel owns its own width
       * (`width="md"`, or `panelClassName` when a measurement is needed).
       */}
      <MorphingDialogContent width={width}>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <Stack gap="xs">
              <MorphingDialogTitle className="text-title text-fg-primary">{triggerTitle}</MorphingDialogTitle>
              <MorphingDialogDescription className="text-caption text-fg-muted">
                {tcs("The panel grows out of the card it was opened from, so the reader keeps their place.")}
              </MorphingDialogDescription>
            </Stack>
            {/* A real close control: an empty `<button>` has no accessible name. */}
            <MorphingDialogClose asChild>
              <IconButton
                variant="ghost"
                size="sm"
                label="Close"
                icon={<span aria-hidden="true">✕</span>}
              />
            </MorphingDialogClose>
          </div>
          <DefinitionList items={items} />
          <div className="flex justify-end gap-2">
            <MorphingDialogClose asChild>
              <Button variant="ghost" size="sm">
                {tcs("Cancel")}
              </Button>
            </MorphingDialogClose>
            <Button variant="primary" size="sm">
              {tcs("Open the run")}
            </Button>
          </div>
        </div>
      </MorphingDialogContent>
    </MorphingDialog>
  );
}

/** Two columns of label/value pairs — the shape a detail dialog actually has. */
function DefinitionList({ items }: { items: readonly { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-3 rounded-lg border border-line-subtle bg-surface-sunken p-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-micro tracking-[0.12em] text-fg-muted uppercase">{item.label}</dt>
          <dd className="luc-numeric text-label text-fg-primary tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The intensity readout.
 *
 * Motion intensity is context, not props, so the honest specimen is a scope with
 * a component inside it that *reads* the resolved profile: the level, and whether
 * the pointer and ambient halves are on. Reduced motion resolves to `none`, and
 * that resolution happens once, here, rather than in every component.
 */
export function MotionIntensityDemo() {
  return (
    <MotionIntensityProvider intensity="expressive" pointer ambient>
      <IntensityReadout />
    </MotionIntensityProvider>
  );
}

function IntensityReadout() {
  const profile = useMotionProfile();
  const pointerEnabled = usePointerMotionEnabled();
  return (
    <Card variant="outline" className="w-full max-w-sm p-4">
      <Stack gap="xs">
        <Text variant="label" as="p">
          Resolved intensity: {profile.intensity}
        </Text>
        <Text variant="caption" tone="muted" as="p">
          pointer effects {pointerEnabled ? "on" : "off"}
        </Text>
      </Stack>
    </Card>
  );
}
