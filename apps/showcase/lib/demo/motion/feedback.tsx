/*
 * Motion — feedback.
 *
 * The family that answers "did that happen?". Every one of these is caused by
 * something: a press, a value changing, a step moving, a selection. So each
 * specimen contains the cause as well as the effect, and the notes say which
 * state change fires it — a burst that cannot be triggered, or a flash with no
 * value to watch, would be a screenshot of motion rather than motion.
 */

/*
 * `FadeSwapDemo` lives in the island beside the others but is deliberately not
 * wired here: `presence` is the documented entry, and `FadeSwap` is one of the
 * two exports that page documents — the specimen above covers both.
 */
import {
  ClickBurstDemo,
  CollapseDemo,
  DataChangeFlashDemo,
  ExpandableDemo,
  IconMorphDemo,
  MagneticDemo,
  MotionIntensityDemo,
  PresenceDemo,
  PressableDemo,
  PressRippleDemo,
  SelectionBeamDemo,
  SharedHighlightDemo,
  StaggerDemo,
  TransitionPanelDemo,
} from "@/components/demo/islands/d-motion";
import { Magnetic, PressRipple } from "@luc/ui/motion";
import { Button, Text } from "@luc/ui";
import { composition, type DemoSpec } from "../index";

export const motionFeedbackDemos: readonly DemoSpec[] = [
  composition({
    id: "collapse",
    node: <CollapseDemo />,
    note: "Fully controlled: the caller owns `open`, so a disclosure can be driven by URL state or a parent.",
    code: `<Collapse
  open={open}
  onOpenChange={setOpen}
  title="Fills this quarter"
  description="One hundred and eighty-four, up from one hundred and two."
>
  <Text variant="body">The panel is the region the trigger points at.</Text>
</Collapse>`,
  }),
  composition({
    id: "expandable-surface",
    node: <ExpandableDemo />,
    note: "A summary that becomes its own detail in place: the collapsed face goes inert rather than staying tabbable.",
    code: `<ExpandableSurface defaultOpen={false}>
  <ExpandableSurfaceTrigger>
    <Card variant="outline">Sharpe, 12 months</Card>
  </ExpandableSurfaceTrigger>
  <ExpandableSurfaceContent>
    <Card variant="outline">The same place, more detail.</Card>
    <ExpandableSurfaceClose>Close</ExpandableSurfaceClose>
  </ExpandableSurfaceContent>
</ExpandableSurface>`,
  }),
  composition({
    id: "click-burst",
    node: <ClickBurstDemo />,
    note: "Eight rays on acknowledgement; scale the ray count with the size of the event, not with taste.",
    code: `<Button onClick={approve}>
  <ClickBurst count={8} spread={22} />
  Approve
</Button>`,
  }),
  composition({
    id: "data-change-flash",
    node: <DataChangeFlashDemo />,
    note: "The flash is caused by the value changing, and the tone is the caller's — a change is not automatically good.",
    code: `<DataChangeFlash value={volatility} tone="negative">
  <Text variant="body">{volatility.toFixed(1)} %</Text>
</DataChangeFlash>`,
  }),
  composition({
    id: "icon-morph",
    node: <IconMorphDemo />,
    note: "One glyph dissolves into the next in a fixed-size box, so a toolbar never reflows when state changes.",
    code: `<IconMorph
  state={state}
  size={22}
  icons={{ idle: <PlayIcon />, running: <PauseIcon />, done: <CheckIcon /> }}
/>`,
  }),
  composition({
    id: "presence",
    node: <PresenceDemo />,
    note: "Mount and unmount with a fade, for a panel that only exists in some states.",
    code: `<Presence present={present}>
  <Card variant="outline">A contextual panel.</Card>
</Presence>`,
  }),
  composition({
    id: "shared-highlight",
    node: <SharedHighlightDemo />,
    note: "The highlight is one element that moves between items, so the selection reads as a single object.",
    code: `<SharedHighlight
  items={[
    { value: "returns", label: "Returns" },
    { value: "risk", label: "Risk" },
  ]}
  value={value}
  onValueChange={setValue}
  variant="track"
  ariaLabel="Metric"
/>`,
  }),
  composition({
    id: "selection-beam",
    node: <SelectionBeamDemo />,
    note: "A rail from a row to its detail; clicking the row toggles whether the packet is travelling.",
    code: `<SelectionBeam from={rowRef} to={detailRef} active={active} />`,
  }),
  composition({
    id: "stagger",
    node: <StaggerDemo />,
    note: "Each item carries its own index — an implicit counter breaks the moment one item is conditional.",
    code: `<StaggerGroup step={0.05}>
  {cells.map((cell, index) => (
    <StaggerItem key={cell.id} index={index}>{cell.node}</StaggerItem>
  ))}
</StaggerGroup>`,
  }),
  composition({
    id: "transition-panel",
    node: <TransitionPanelDemo />,
    note: "The active panel is an identity, and the direction is a prop — a wizard that never collapses its slot.",
    code: `<TransitionPanel activeIndex={index} mode="overlay">
  <Card variant="outline">Step one</Card>
  <Card variant="outline">Step two</Card>
</TransitionPanel>`,
  }),
  composition({
    id: "press-ripple",
    node: <PressRippleDemo />,
    note: "For surfaces that are not already a Button; the rings are composited, so nothing re-renders per frame.",
    code: `<PressRipple rings={2}>
  <Text variant="body">Press anywhere on this surface</Text>
</PressRipple>`,
    examples: [
      {
        title: "One ring, quick",
        node: (
          <PressRipple rings={1} duration={420} className="inline-flex rounded-lg border border-line-subtle px-5 py-3">
            <Text variant="body">One ring</Text>
          </PressRipple>
        ),
        code: `<PressRipple rings={1} duration={420}>
  <Text variant="body">One ring</Text>
</PressRipple>`,
        note: "A single short ring for a dense surface, where two overlapping rings would be noise.",
      },
      {
        title: "A wider reach",
        node: (
          <PressRipple rings={2} maxScale={9} duration={760} className="inline-flex rounded-lg border border-line-subtle px-5 py-3">
            <Text variant="body">Press for a wider ring</Text>
          </PressRipple>
        ),
        code: `<PressRipple rings={2} maxScale={9} duration={760}>
  <Text variant="body">Press for a wider ring</Text>
</PressRipple>`,
        note: "`maxScale` is how far the ring travels relative to the press point, so a wide surface can answer further out.",
      },
    ],
  }),
  composition({
    id: "pressable",
    node: <PressableDemo />,
    note: "Lift, press and grow are three separate props, because a dense grid wants none of them.",
    code: `<Pressable as="div" lift press tabIndex={0}>
  <Text variant="body">A pressable surface</Text>
</Pressable>`,
  }),
  composition({
    id: "magnetic",
    node: <MagneticDemo />,
    note: "A modest pull: a control that chases the cursor is harder to click than one that leans toward it.",
    code: `<Magnetic strength={0.18} radius={160}>
  <Button variant="secondary">Lean toward the cursor</Button>
</Magnetic>`,
    examples: [
      {
        title: "A whisper of pull",
        node: (
          <Magnetic strength={0.06} radius={220}>
            <Button variant="secondary">Barely leans</Button>
          </Magnetic>
        ),
        code: `<Magnetic strength={0.06} radius={220}>
  <Button variant="secondary">Barely leans</Button>
</Magnetic>`,
        note: "The lowest setting that still reads as motion; the radius is how far away the pull begins.",
      },
      {
        title: "On a primary action",
        node: (
          <Magnetic strength={0.22} radius={120}>
            <Button variant="primary">Run the sweep</Button>
          </Magnetic>
        ),
        code: `<Magnetic strength={0.22} radius={120}>
  <Button variant="primary">Run the sweep</Button>
</Magnetic>`,
        note: "A filled action carries the pull better than a quiet one — the same physics, a different amount of surface to move.",
      },
    ],
  }),
  composition({
    id: "intensity",
    node: <MotionIntensityDemo />,
    note: "A scope, not a prop: components read the resolved profile, and reduced motion resolves to `none` in one place.",
    code: `<MotionIntensityProvider intensity="expressive" pointer ambient>
  <IntensityReadout />
</MotionIntensityProvider>`,
  }),
];
