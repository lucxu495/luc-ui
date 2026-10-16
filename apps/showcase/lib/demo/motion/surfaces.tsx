/*
 * Motion — surfaces.
 *
 * Every one of these is a *surface*: it changes how a piece of content sits, not
 * what the content is. The specimens therefore put real content inside each one,
 * and the notes say what the surface is for — an aurora that follows the palette,
 * a beam that reports progress, a grid that reacts to a pointer.
 */

import {
  AuroraSurface,
  BeamFlow,
  BorderTrail,
  GlareSurface,
  InteractiveGrid,
  Marquee,
  MotionSurface,
  TiltSurface,
  type AuroraSurfaceProps,
  type BeamFlowProps,
  type GlareSurfaceProps,
  type MarqueeProps,
  type TiltSurfaceProps,
} from "@luc/ui/motion";
import { Card, Stack, Text } from "@luc/ui";
import { composition, demo, type DemoSpec } from "../index";

const CALLOUT = (
  <Stack gap="xs" className="p-5">
    <Text variant="label" as="p">
      Drawdown control
    </Text>
    <Text variant="caption" tone="muted" as="p">
      Half the risk, the same breadth.
    </Text>
  </Stack>
);

export const motionSurfaceDemos: readonly DemoSpec[] = [
  demo<AuroraSurfaceProps>({
    id: "aurora-surface",
    component: "AuroraSurface",
    props: { tone: "duotone", density: "normal", speed: 26, grid: true, vignette: true },
    render: (props) => (
      <div className="w-full overflow-hidden rounded-xl">
        <AuroraSurface {...props}>{CALLOUT}</AuroraSurface>
      </div>
    ),
    layout: "block",
    note: "Both fields come from the live accent, so the surface follows every palette rather than pinning two colours.",
    examples: [
      {
        title: "Content-first, no grid",
        props: { tone: "neutral", density: "quiet", speed: 40, grid: false, vignette: true },
        note: "`neutral` stays monochrome for a surface that has to carry content; the grid is what makes the duotone version read as a plotted plane.",
      },
      {
        title: "Rich and slow",
        props: { tone: "duotone", density: "rich", speed: 64, grid: true, vignette: true },
        note: "Density is the number of fields and `speed` is seconds per cycle, so the calm setting is the slower one.",
      },
    ],
  }),
  demo<GlareSurfaceProps>({
    id: "glare-surface",
    component: "GlareSurface",
    props: { size: 260, opacity: 0.11, tone: "light" },
    render: (props) => (
      <GlareSurface {...props} className="w-full rounded-xl border border-line-subtle">
        {CALLOUT}
      </GlareSurface>
    ),
    layout: "block",
    note: "A sheen that reads as reflection across the content; the peak opacity stays in the low teens on purpose.",
    examples: [
      {
        title: "A tight, brighter highlight",
        props: { size: 120, opacity: 0.2, tone: "light" },
        note: "A small radius reads as a point of light, and only at this size does the brighter opacity stay tasteful.",
      },
      {
        title: "Accent tone, wide and soft",
        props: { size: 420, opacity: 0.08, tone: "accent", softness: 70 },
        note: "The widest and faintest setting, carrying the theme accent instead of white.",
      },
    ],
  }),
  demo<TiltSurfaceProps>({
    id: "tilt-surface",
    component: "TiltSurface",
    props: { max: 8, perspective: 900, glare: true },
    render: (props) => (
      <TiltSurface {...props} className="w-full rounded-xl border border-line-subtle bg-surface-default">
        {CALLOUT}
      </TiltSurface>
    ),
    layout: "block",
    note: "Eight degrees at most: enough to read as depth, not enough to make the text harder to follow.",
    examples: [
      {
        title: "A lean you have to look for",
        props: { max: 3, perspective: 1200, glare: false },
        note: "Three degrees on a wide surface: the card acknowledges the pointer without appearing to move.",
      },
      {
        title: "Glass material, twelve degrees",
        props: { max: 12, perspective: 700, glare: true, glareTone: "accent", material: "glass" },
        note: "The loudest setting the library ships, and the only one that also changes the material.",
      },
    ],
  }),
  demo<MarqueeProps>({
    id: "marquee",
    component: "Marquee",
    props: { speed: 28, gap: "2.5rem", pauseOnHover: true, fade: true },
    render: (props) => (
      <Marquee {...props}>
        {["Momentum", "Carry", "Value", "Quality", "Low volatility"].map((item) => (
          <Text key={item} variant="label" tone="muted">
            {item}
          </Text>
        ))}
      </Marquee>
    ),
    layout: "block",
    note: "Stops while a pointer is over it, because a strip that cannot be read is decoration.",
    examples: [
      {
        title: "Right to left, unhurried",
        props: { speed: 60, direction: "right", gap: "2.5rem", pauseOnHover: true, fade: true },
        note: "The same strip reading the other way; `speed` is seconds per pass, so a higher number is slower.",
      },
      {
        title: "No fade, tighter gutter",
        props: { speed: 22, direction: "left", gap: "1.25rem", pauseOnHover: false, fade: false },
        note: "Without the feathered ends the first item is cut by the container edge — the honest trade for a tighter strip.",
      },
    ],
  }),
  demo<BeamFlowProps>({
    id: "beam-flow",
    component: "BeamFlow",
    props: {
      points: [
        { x: 0, y: 40 },
        { x: 120, y: 12 },
        { x: 240, y: 64 },
        { x: 360, y: 28 },
      ],
      state: "active",
      speed: 3.2,
      width: 2,
      label: "Pipeline progress",
    },
    render: (props) => (
      <div className="h-24 w-full">
        <BeamFlow {...props} />
      </div>
    ),
    layout: "block",
    note: "The packet's position is the progress: `state` freezes it without removing the path.",
    examples: [
      {
        title: "A two-point S",
        props: {
          points: [
            { x: 0, y: 48 },
            { x: 360, y: 16 },
          ],
          state: "active",
          speed: 4.5,
          width: 2,
          label: "Transfer progress",
        },
        note: "Two waypoints draw one smooth S; a label makes the connector a real element instead of decoration.",
      },
      {
        title: "Failed, with the path kept",
        props: {
          points: [
            { x: 0, y: 40 },
            { x: 120, y: 12 },
            { x: 240, y: 64 },
            { x: 360, y: 28 },
          ],
          state: "error",
          speed: 3.2,
          width: 3,
          label: "Pipeline failed",
        },
        note: "`error` recolours the packet and stops it in place: the path stays, so the reader still sees where the run got to.",
      },
    ],
  }),
  composition({
    id: "border-trail",
    node: (
      <BorderTrail variant="ambient" radius="lg" className="w-full">
        <Card variant="outline" className="p-5">
          <Text variant="body">A featured panel with a slow sweep around its edge.</Text>
        </Card>
      </BorderTrail>
    ),
    layout: "block",
    note: "The radius prop must match the wrapped surface, or the beam cuts the corner.",
    code: `<BorderTrail variant="ambient" radius="lg">
  <Card variant="outline" className="p-5">
    <Text variant="body">A featured panel.</Text>
  </Card>
</BorderTrail>`,
  }),
  composition({
    id: "interactive-grid",
    node: (
      <div className="relative h-48 w-full overflow-hidden rounded-xl border border-line-subtle">
        <InteractiveGrid cell={26} radius={180} fade />
        <div className="relative grid h-full place-items-center">
          <Text variant="label">Move the pointer</Text>
        </div>
      </div>
    ),
    layout: "block",
    note: "A pointer-reactive field with a soft edge; under reduced motion it becomes a static grid.",
    code: `<div className="relative h-48 overflow-hidden rounded-xl">
  <InteractiveGrid cell={26} radius={180} fade />
  <div className="relative grid h-full place-items-center">
    <Text variant="label">Move the pointer</Text>
  </div>
</div>`,
    examples: [
      {
        title: "Dots, larger cells",
        node: (
          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-line-subtle">
            <InteractiveGrid cell={44} radius={140} variant="dots" fade />
            <div className="relative grid h-full place-items-center">
              <Text variant="label">Move the pointer</Text>
            </div>
          </div>
        ),
        code: `<div className="relative h-40 overflow-hidden rounded-xl">
  <InteractiveGrid cell={44} radius={140} variant="dots" fade />
  <div className="relative grid h-full place-items-center">
    <Text variant="label">Move the pointer</Text>
  </div>
</div>`,
        note: "Dots at a larger cell read as a surface texture rather than as graph paper.",
      },
      {
        title: "Still and wide",
        node: (
          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-line-subtle">
            <InteractiveGrid cell={26} radius={260} drift={false} />
            <div className="relative grid h-full place-items-center">
              <Text variant="label">Move the pointer</Text>
            </div>
          </div>
        ),
        code: `<div className="relative h-40 overflow-hidden rounded-xl">
  <InteractiveGrid cell={26} radius={260} drift={false} />
  <div className="relative grid h-full place-items-center">
    <Text variant="label">Move the pointer</Text>
  </div>
</div>`,
        note: "No drift and a wide radius: the field only exists where the pointer is.",
      },
    ],
  }),
  composition({
    id: "motion-surface",
    node: (
      <MotionSurface hover selected className="w-full rounded-lg border border-line-subtle p-5">
        <Text variant="body">Hover, focus and select states all read from the same surface.</Text>
      </MotionSurface>
    ),
    layout: "block",
    note: "The interaction states are the surface's, so a card does not re-implement hover, focus and selection.",
    code: `<MotionSurface hover selected>
  <Text variant="body">A selectable, hoverable surface.</Text>
</MotionSurface>`,
  }),
];
