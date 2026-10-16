/*
 * Motion — spatial.
 *
 * Depth, perspective and shared geometry. Every specimen here is a composition
 * rather than a props table, because the *shape of the composition* is the API:
 * a `ParallaxScene` is only meaningful with layers at different depths, and a
 * `MorphingDialog` is only meaningful with a trigger it grows out of.
 */

import {
  MorphingPopover,
  MorphingPopoverClose,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@luc/ui/motion";
import { Card, Inline, Stack, Text } from "@luc/ui";
import {
  CardStackDemo,
  MagnifyDockDemo,
  MorphingDialogDemo,
  OrbitFieldDemo,
  ParallaxDemo,
} from "@/components/demo/islands/d-motion";
import { composition, type DemoSpec } from "../index";

export const motionSpatialDemos: readonly DemoSpec[] = [
  composition({
    id: "card-stack",
    node: <CardStackDemo />,
    note: "Arrow keys and the buttons move the deck; the layers behind the active card recede on scale, offset and light, and one readout beside the controls says where you are.",
    code: `<CardStack visible={3} offsetY={20} shrink={0.05} className="h-48 w-full max-w-sm">
  {cards.map((card) => (
    <CardStackItem key={card.id}>
      {/* Content at the top: the bottom strip is the peek the layers behind
          leave visible, so text there would ladder down the deck. */}
      <Card className="flex h-32 flex-col justify-start gap-1 p-4">{card.node}</Card>
    </CardStackItem>
  ))}
  <CardStackControls>
    <Position />   {/* const { index, count } = useCardStack(); */}
  </CardStackControls>
</CardStack>

/* One position readout for the deck. Three copies — one inside every card —
   land a line apart and are unreadable, which is why the counter lives here. */`,
    examples: [
      {
        title: "Two cards, a wider stage",
        node: (
          <CardStackDemo
            labels={["Baseline", "Trend"]}
            visible={2}
            offsetY={24}
            shrink={0.07}
            className="h-44 w-full max-w-md"
          />
        ),
        code: `<CardStack visible={2} offsetY={24} shrink={0.07} className="h-44 w-full max-w-md">
  {cards.map((card) => (
    <CardStackItem key={card.id}>
      <Card className="flex h-28 flex-col justify-start gap-1 p-4">{card.label}</Card>
    </CardStackItem>
  ))}
  <CardStackControls>
    <Position />
  </CardStackControls>
</CardStack>`,
        note: "A two-card deck with a wider peek, so the layer behind is legible enough to compare against the front.",
      },
      {
        title: "Five cards, a deep deck",
        node: (
          <CardStackDemo
            labels={["Baseline", "Trend", "Carry", "Value", "Quality"]}
            visible={3}
            offsetY={14}
            shrink={0.035}
            className="h-52 w-full max-w-sm"
          />
        ),
        code: `<CardStack visible={3} offsetY={14} shrink={0.035} className="h-52 w-full max-w-sm">
  {cards.map((card) => (
    <CardStackItem key={card.id}>
      <Card className="flex h-32 flex-col justify-start gap-1 p-4">{card.label}</Card>
    </CardStackItem>
  ))}
  <CardStackControls>
    <Position />
  </CardStackControls>
</CardStack>`,
        note: "Five positions behind three visible layers: the deck stays readable while the depth still reads as depth.",
      },
    ],
  }),
  composition({
    id: "magnify-dock",
    node: <MagnifyDockDemo />,
    note: "Each lane swells toward the pointer within its own range; the house scale stays under half again.",
    code: `<MagnifyDock range={90} scale={0.45} lift={6}>
  {actions.map((action) => (
    <MagnifyDockItem key={action.id} label={action.label}>
      {action.glyph}
    </MagnifyDockItem>
  ))}
</MagnifyDock>`,
  }),
  composition({
    id: "orbit-field",
    node: <OrbitFieldDemo />,
    note: "Rings tilt into a plane and rotate; the same field flattens to a static diagram under reduced motion.",
    code: `<OrbitField label="Model pipeline" tilt={58} perspective={900}>
  <OrbitFieldRing radius={92} duration={18}>
    <OrbitFieldNode>Ingest</OrbitFieldNode>
    <OrbitFieldNode>Store</OrbitFieldNode>
  </OrbitFieldRing>
  <OrbitFieldCore>API</OrbitFieldCore>
</OrbitField>`,
  }),
  composition({
    id: "parallax-scene",
    node: <ParallaxDemo />,
    note: "Three layers at three depths; negative depth moves against the pointer, which is the foreground read.",
    code: `<ParallaxScene depth={16} perspective={900}>
  <ParallaxLayer depth={0.2} z={-80} />
  <ParallaxLayer depth={1}>Move the pointer</ParallaxLayer>
  <ParallaxLayer depth={-0.4} z={60}>Foreground</ParallaxLayer>
</ParallaxScene>`,
  }),
  composition({
    id: "morphing-dialog",
    node: <MorphingDialogDemo />,
    note: "A centred panel that grows out of the card it was opened from; Radix still owns focus, Escape and the unmount.",
    code: `<MorphingDialog>
  <MorphingDialogTrigger>
    <Card className="w-56 p-4">Run detail</Card>
  </MorphingDialogTrigger>
  {/* No className: it lands on the fixed centring frame, not the panel.
      Size the panel with \`width\` or \`panelClassName\`. */}
  <MorphingDialogContent width="md">
    <div className="flex flex-col gap-4 p-5">
      <MorphingDialogTitle>Run detail</MorphingDialogTitle>
      <MorphingDialogDescription>The panel grows out of the card.</MorphingDialogDescription>
      <MorphingDialogClose asChild>
        <IconButton label="Close" variant="ghost" size="sm" />
      </MorphingDialogClose>
    </div>
  </MorphingDialogContent>
</MorphingDialog>`,
    examples: [
      {
        title: "A narrow panel, one fact",
        node: (
          <MorphingDialogDemo
            width="sm"
            triggerTitle="Sharpe"
            items={[{ label: "Sharpe", value: "1.42" }]}
          />
        ),
        code: `<MorphingDialog>
  <MorphingDialogTrigger>
    <Card className="w-56 p-4">Sharpe</Card>
  </MorphingDialogTrigger>
  {/* The panel is sized by \`width\`; the trigger's own box is unchanged, so
      the morph still reads as the same object growing. */}
  <MorphingDialogContent width="sm">
    <div className="flex flex-col gap-4 p-5">
      <MorphingDialogTitle>Sharpe</MorphingDialogTitle>
      <dl className="grid grid-cols-1 gap-3">
        <div>
          <dt>Sharpe</dt>
          <dd>1.42</dd>
        </div>
      </dl>
    </div>
  </MorphingDialogContent>
</MorphingDialog>`,
        note: "A narrow panel with one fact: the panel is content-sized, and the trigger keeps its own width.",
      },
    ],
  }),
  composition({
    id: "morphing-popover",
    node: (
      <MorphingPopover>
        <MorphingPopoverTrigger>
          <Card variant="outline" className="w-44 p-3">
            <Text variant="caption" tone="muted">
              Select a period
            </Text>
          </Card>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent className="w-64">
          <Stack gap="sm">
            <Text variant="label" as="p">
              Period
            </Text>
            <Inline gap="sm">
              <Text variant="caption" tone="muted">
                Trailing twelve months
              </Text>
            </Inline>
            <MorphingPopoverClose>Done</MorphingPopoverClose>
          </Stack>
        </MorphingPopoverContent>
      </MorphingPopover>
    ),
    note: "The same shared-geometry idea at popover scale, with Radix keeping the placement and dismiss contract.",
    code: `<MorphingPopover>
  <MorphingPopoverTrigger>
    <Card variant="outline">Select a period</Card>
  </MorphingPopoverTrigger>
  <MorphingPopoverContent>
    <Text variant="label" as="p">Period</Text>
    <MorphingPopoverClose>Done</MorphingPopoverClose>
  </MorphingPopoverContent>
</MorphingPopover>`,
  }),
];
