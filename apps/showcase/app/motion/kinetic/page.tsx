"use client";

import { useState } from "react";
import {
  AreaChart,
  Badge,
  BorderTrail,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ClickBurst,
  Code,
  DataChangeFlash,
  DialogBody,
  DialogFooter,
  GlareSurface,
  Heading,
  HeatmapChart,
  IconButton,
  IconMorph,
  Inline,
  Input,
  InteractiveGrid,
  Link,
  Magnetic,
  Metric,
  MetricValue,
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogTitle,
  MorphingDialogTrigger,
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
  MotionIntensityProvider,
  MotionSurface,
  NumberTicker,
  Pressable,
  Radio,
  RadioGroup,
  ScrambleText,
  ScatterChart,
  Section,
  SegmentedControl,
  SegmentedItem,
  ShimmerText,
  Slider,
  SpotlightSurface,
  StatCard,
  Switch,
  Text,
  TextReveal,
  TiltSurface,
  Tooltip,
  TransitionPanel,
  useMotionProfile,
  type MotionIntensity,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { ControlRow, Playground } from "@/components/docs/playground";
import { ChartPanel } from "@/components/charts/chart-panel";
import { PlaygroundSection } from "@/components/docs/playground-section";
import { heatmapGrid, marketSeries, scatterRows } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

const ROWS = marketSeries({ days: 420 });
const POINTS = scatterRows(140);
const MATRIX = heatmapGrid();

export default function KineticPage() {
  const { tcs } = useI18n();
  const [intensity, setIntensity] = useState<MotionIntensity>("expressive");
  const [pointer, setPointer] = useState(true);
  const [ambient, setAmbient] = useState(true);

  return (
    <MotionIntensityProvider intensity={intensity} pointer={pointer} ambient={ambient}>
      <DocPage>
        <PageHeader
          eyebrow={tcs("Motion")}
          title="Premium motion & kinetic interaction"
          lead="Every kinetic effect in @luc/ui, driven by one intensity profile — and every one of them resolves to an instant state change under reduced motion."
        />

        <PlaygroundSection entryId="kinetic-headline" />

        <Section
          title={tcs("Review controls")}
          description={tcs("Everything on this page reads its behaviour from these switches. Reduced motion and the light/dark theme live in the topbar, exactly as they do everywhere else in the system — one control surface, not two.")}
        >
          <Playground
            /*
             * MOT-002: the switches above are a `MotionIntensityProvider`, so the
             * snippet is the provider element — the thing a reader actually has to
             * write to get this page's behaviour.
             */
            code={`<MotionIntensityProvider intensity="${intensity}" pointer={${pointer}} ambient={${ambient}}>
  <YourPage />
</MotionIntensityProvider>`}
            note={tcs("Intensity cascades to every child through React context. `none` is what reduced motion resolves to, so the two paths can never drift.")}
            controls={
              <>
                <ControlRow label={tcs("Intensity")}>
                  <SegmentedControl
                    size="sm"
                    value={intensity}
                    onValueChange={(next) => next && setIntensity(next as MotionIntensity)}
                  >
                    {(["functional", "expressive", "showcase"] as const).map((level) => (
                      <SegmentedItem size="sm" key={level} value={level}>
                        {level}
                      </SegmentedItem>
                    ))}
                  </SegmentedControl>
                </ControlRow>
                <ControlRow label={tcs("Pointer effects")}>
                  <Switch checked={pointer} onCheckedChange={setPointer} label={"Cursor-reactive"} />
                </ControlRow>
                <ControlRow label={tcs("Ambient motion")}>
                  <Switch checked={ambient} onCheckedChange={setAmbient} label={tcs("Loops allowed")} />
                </ControlRow>
                <ControlRow label={tcs("Profile")}>
                  <ProfileReadout />
                </ControlRow>
              </>
            }
          >
            <div className="relative flex w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-line-subtle bg-surface-canvas p-10">
              <InteractiveGrid cell={26} radius={180} />
              <div className="relative text-center">
                <TextReveal text="Quiet at rest." mode="word" className="block text-heading-sm font-semibold" />
                <TextReveal
                  text="Alive on interaction."
                  mode="word"
                  delay={0.18}
                  className="mt-1 block text-heading-sm font-semibold text-fg-accent"
                />
              </div>
            </div>
          </Playground>
        </Section>

        <Section
          title={tcs("Micro")}
          description={tcs("Small controls still feel intentional: a magnet, a spring press, a glyph that morphs, a field that answers focus.")}
        >
          <Demo title={tcs("Buttons and icons")} description={tcs("Magnetic CTAs, a perimeter beam and a spring press.")} layout="inline">
            <Magnetic>
              <BorderTrail variant="ambient" radius="md" className="inline-flex rounded-md">
                <Button variant="primary">Publish revision</Button>
              </BorderTrail>
            </Magnetic>
            <Magnetic strength={0.18}>
              <Button variant="secondary" leadingIcon={<RingIcon />}>
                Magnetic secondary
              </Button>
            </Magnetic>
            <ClickBurst>
              <Button variant="ghost" trailingIcon={<CheckIcon />}>
                Copy (burst)
              </Button>
            </ClickBurst>
            <Tooltip content={tcs("Fullscreen")} side="bottom">
              <Magnetic strength={0.22}>
                <BorderTrail variant="hover" radius="sm" className="inline-grid rounded-sm">
                  <IconButton label="Fullscreen" icon={<ExpandIcon />} variant="solid" />
                </BorderTrail>
              </Magnetic>
            </Tooltip>
          </Demo>

          <Demo
            title={tcs("Icon morph")}
            description={tcs("Copy → check, sun → moon: one glyph dissolving into the next in a stable box.")}
            layout="inline"
          >
            <IconStateDemo />
          </Demo>

          <Demo
            title={tcs("Selection and fields")}
            description={tcs("The physical states, with the press spring.")}
            layout="grid"
          >
            <div className="flex flex-col gap-3">
              <Checkbox label={tcs("Persist to Redis")} defaultChecked />
              <Switch label={tcs("Stream updates")} defaultChecked />
              <RadioGroup defaultValue="a" className="flex flex-col gap-2">
                <Radio value="a" label={tcs("All history")} />
                <Radio value="b" label={tcs("Last 12 months")} />
              </RadioGroup>
            </div>
            <div className="flex flex-col gap-4">
              <Input placeholder="Search outputs…" leadingIcon={<SearchIcon />} />
              <Slider defaultValue={40} showValue="always" label="Position sizing" />
            </div>
            <div className="flex flex-col gap-3">
              <Link href="#" variant="accent" underline="hover">
                Animated underline
              </Link>
              <Text variant="caption" tone="muted">
                {tcs("Links keep the sweep; body copy stays calm.")}</Text>
              <ShimmerText>Processing analytics…</ShimmerText>
            </div>
          </Demo>
        </Section>

        <Section
          title={tcs("Surfaces")}
          description={tcs("Tilt, glare, spotlight and a border beam — the primitives stay generic; a product composes them.")}
        >
          <Demo
            title={tcs("Tilt + glare")}
            description={tcs("Move the pointer across the card. Only transform animates, and the release is a spring.")}
            layout="grid"
          >
            <TiltSurface max={8} className="rounded-xl">
              <Card variant="raised" className="rounded-xl">
                <CardContent className="gap-3">
                  <Text variant="micro" tone="muted">
                    Research card
                  </Text>
                  <Heading size="title" as="h3">
                    SMA200W accumulation
                  </Heading>
                  <Text variant="caption" tone="muted">
                    {tcs("Prepared evidence, 2015 → 2026. The card leans; the data does not move.")}</Text>
                </CardContent>
              </Card>
            </TiltSurface>

            <GlareSurface tone="accent" className="rounded-xl">
              <Card variant="raised" className="rounded-xl">
                <CardContent className="gap-3">
                  <Text variant="micro" tone="muted">
                    Glare surface
                  </Text>
                  <MetricValue value={72104.87} kind="currency" currency="USD" />
                  <Text variant="caption" tone="muted">
                    {tcs("A sheen across the surface — never over the glyphs.")}</Text>
                </CardContent>
              </Card>
            </GlareSurface>
          </Demo>

          <Demo
            title={tcs("Spotlight + border trail")}
            description={tcs("One pointer tracker drives the interior light, the lit edge and the texture: three readouts, one rAF write.")}
            layout="grid"
          >
            <SpotlightSurface border texture radius="xl">
              <div className="flex flex-col items-start gap-3 p-5">
                <Text variant="micro" tone="muted">
                  SpotlightSurface
                </Text>
                <Heading size="title" as="h3">
                  Forward-return study
                </Heading>
                <Text variant="caption" tone="muted">
                  {tcs("Border and texture are the same pointer position, rendered three ways.")}</Text>
                <Badge size="sm" tone="info" dot>
                  active
                </Badge>
              </div>
            </SpotlightSurface>

            <BorderTrail variant="ambient" radius="xl" track className="rounded-xl">
              <Card variant="raised" className="rounded-xl">
                <CardContent className="gap-3">
                  <Text variant="micro" tone="muted">
                    BorderTrail · ambient
                  </Text>
                  <Heading size="title" as="h3">
                    Featured research
                  </Heading>
                  <Text variant="caption" tone="muted">
                    {tcs("A single bright segment travelling the perimeter. One per page.")}</Text>
                </CardContent>
              </Card>
            </BorderTrail>
          </Demo>

          <Demo
            title={tcs("MotionSurface and Pressable")}
            description={tcs("The interactive shell and the spring press, composed. `featured` is the loudest static Card treatment.")}
            layout="grid"
          >
            <MotionSurface spotlight highlight radius="lg" as="article">
              <div className="flex flex-col gap-2 p-5">
                <Text variant="micro" tone="muted">
                  MotionSurface
                </Text>
                <Heading size="title" as="h3">
                  Indicator context
                </Heading>
                <Text variant="caption" tone="muted">
                  {tcs("Lifts, lights and steps its border on hover.")}</Text>
              </div>
            </MotionSurface>
            <Pressable as="div" growOnHover className="rounded-lg border border-line-subtle bg-surface-raised p-5">
              <Text variant="micro" tone="muted">
                Pressable
              </Text>
              <Text variant="label" className="mt-2 block">
                {tcs("Hover lifts · press compresses")}</Text>
            </Pressable>
            <Card interaction="featured" padding="lg">
              <CardHeader>
                <CardTitle>Featured card</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="caption" tone="muted">
                  {tcs("Static, but deliberate: accent hairline, deeper shadow, hover lift.")}</Text>
              </CardContent>
            </Card>
          </Demo>
        </Section>

        <Section
          title={tcs("Overlays")}
          description={tcs("Shared geometry where a real source exists; directional panels where content swaps in place.")}
        >
          <Demo
            title={tcs("Morphing dialog and popover")}
            description={tcs("Radix owns focus, Escape and scroll lock; Motion owns one shared layout id.")}
            layout="inline"
          >
            <MorphingDialog>
              <MorphingDialogTrigger className="rounded-lg border border-line-subtle bg-surface-raised p-4">
                <Text variant="micro" tone="muted">
                  Research card
                </Text>
                <Text variant="label" className="mt-1 block">
                  Open detail
                </Text>
              </MorphingDialogTrigger>
              <MorphingDialogContent>
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-1 pr-10">
                    <MorphingDialogTitle className="text-title text-fg-primary">
                      Forward-return detail
                    </MorphingDialogTitle>
                    <MorphingDialogDescription className="text-caption text-fg-muted">
                      {tcs("The panel grows out of the card you clicked.")}</MorphingDialogDescription>
                  </div>
                  <DialogBody className="p-0">
                    <Text variant="body" tone="secondary">
                      {tcs("Statistics are prepared upstream and only rendered here.")}</Text>
                  </DialogBody>
                  <DialogFooter className="border-0 bg-transparent px-0 pb-0">
                    <MorphingDialogClose asChild>
                      <Button variant="ghost">Close</Button>
                    </MorphingDialogClose>
                  </DialogFooter>
                </div>
              </MorphingDialogContent>
            </MorphingDialog>

            <MorphingPopover>
              <MorphingPopoverTrigger className="rounded-md border border-line-subtle bg-surface-interactive px-3 py-1.5">
                <Text variant="caption">Metric detail</Text>
              </MorphingPopoverTrigger>
              <MorphingPopoverContent>
                <div className="flex flex-col gap-2">
                  <Text variant="micro" tone="muted">
                    Sharpe · 90d
                  </Text>
                  <MetricValue value={0.94} size="md" maximumFractionDigits={2} />
                  <Text variant="caption" tone="muted">
                    P73 historical
                  </Text>
                </div>
              </MorphingPopoverContent>
            </MorphingPopover>
          </Demo>

          <Demo
            title={tcs("TransitionPanel")}
            description={tcs("A directional swap inside one fixed slot — the outgoing panel leaves the flow, so the slot never collapses.")}
          >
            <TransitionDemo />
          </Demo>
        </Section>

        <Section
          title={tcs("Data")}
          description={tcs("Numbers and dense data get functional motion: digit-level rolls, semantic flashes, no per-row cascade.")}
        >
          <Demo
            title={tcs("Animated digits")}
            description={tcs("Only the digits that changed move. The width is reserved, so nothing reflows.")}
            layout="grid"
          >
            <DigitDemo />
            <StatCard
              label="Realized volatility"
              value={38.4}
              kind="percent"
              delta={2.1}
              deltaLabel="30d"
              visual={<Text variant="caption" tone="muted">Prepared series</Text>}
              interactive
            />
            <Card variant="default" padding="md">
              <Metric label="Funding" aside={<DataChangeFlash value={0.0112}>Δ</DataChangeFlash>}>
                <NumberTicker value={0.0112} kind="percent" minimumFractionDigits={2} variant="digits" />
              </Metric>
            </Card>
          </Demo>
        </Section>

        <Section title={tcs("Charts")} description={tcs("Interaction kinetics on the existing engines. No fabricated history, ever.")}>
          <ChartPanel
            title={tcs("Series focus, current point and gradient area")}
            description={tcs("Hover a series: it thickens and glows while its peers step back. The latest observation carries a lit core.")}
            height={320}
            render={({ height }) => (
              <AreaChart
                data={ROWS}
                xKey="time"
                series={[
                  { key: "close", label: "Close", type: "area", tone: "accent", currentPoint: true },
                  { key: "sma50", label: "SMA 50", type: "line", tone: "info", symbol: false },
                  { key: "sma200", label: "SMA 200", type: "line", palette: 4, symbol: false },
                ]}
                height={height}
                ariaLabel={tcs("Close with moving averages and a current-point marker")}
              />
            )}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartPanel
              title={tcs("Matrix focus")}
              description={tcs("Hovering a cell lights its edge, prints its value and lifts it — the grid geometry never moves.")}
              height={300}
              render={({ height }) => (
                <HeatmapChart
                  xLabels={MATRIX.xLabels}
                  yLabels={MATRIX.yLabels}
                  values={MATRIX.values}
                  min={MATRIX.min}
                  max={MATRIX.max}
                  midpoint={0}
                  palette="diverging"
                  height={height}
                  ariaLabel="Session-by-day heatmap"
                />
              )}
            />
            <ChartPanel
              title={tcs("Scatter focus")}
              description={tcs("The hovered observation grows, gains a lit border and a halo; every other point stays visible.")}
              height={300}
              render={({ height }) => (
                <ScatterChart
                  data={POINTS}
                  xKey="factor"
                  series={[{ key: "forward", label: "Forward return", type: "scatter", tone: "accent" }]}
                  x={{ type: "value", format: { kind: "decimal", decimals: 2 } }}
                  axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
                  height={height}
                  ariaLabel={tcs("Scatter of factor exposure against forward return")}
                />
              )}
            />
          </div>
        </Section>

        <Section
          title={tcs("Atmosphere")}
          description={tcs("Loops are allowed now, but only when they mean something: a grid that answers the pointer, a status that decodes, a completion that sparks.")}
        >
          <Demo
            title={tcs("Interactive research grid")}
            description={tcs("A low-contrast technical grid that lights up near the pointer, with an optional slow drift.")}
            layout="block"
          >
            <div className="relative h-56 overflow-hidden rounded-xl border border-line-subtle bg-surface-canvas">
              <InteractiveGrid cell={30} radius={200} drift />
              <div className="relative flex h-full flex-col items-center justify-center gap-2 text-center">
                <ScrambleText text="SIGNAL ACTIVE" className="text-title font-semibold text-fg-primary" />
                <Text variant="caption" tone="muted">
                  {tcs("Move the pointer across the field.")}</Text>
              </div>
            </div>
          </Demo>
        </Section>
      <EntryFooter />
      </DocPage>
    </MotionIntensityProvider>
  );
}

function ProfileReadout() {
  const profile = useMotionProfile();
  return (
    <Code>{`${profile.intensity} · pointer=${profile.pointer} · ambient=${profile.ambient} · depth=${profile.depth}`}</Code>
  );
}

function IconStateDemo() {
  const { tcs } = useI18n();
  const [state, setState] = useState<"copy" | "done">("copy");
  return (
    <div className="flex items-center gap-4">
      <Magnetic>
        <ClickBurst color="var(--positive)">
          <IconButton
            label={state === "copy" ? "Copy" : "Copied"}
            variant="solid"
            size="lg"
            icon={<IconMorph state={state} icons={{ copy: <CopyIcon />, done: <CheckIcon /> }} size={18} />}
            onClick={() => {
              setState("done");
              window.setTimeout(() => setState("copy"), 1600);
            }}
          />
        </ClickBurst>
      </Magnetic>
      <Text variant="caption" tone="muted">
        {tcs("The glyph box never changes size, so the toolbar never reflows.")}</Text>
    </div>
  );
}

function TransitionDemo() {
  const { tcs } = useI18n();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const views = [
    { id: "levels", title: "Levels", body: tcs("Price, SMA 50 and SMA 200 on one prepared axis.") },
    { id: "returns", title: "Returns", body: tcs("Prepared forward returns, binned upstream.") },
    { id: "risk", title: "Risk", body: tcs("Realized volatility and drawdown episodes.") },
  ] as const;
  const active = views[index]!;

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      {/*
       * A view switcher, not tab navigation: `SegmentedControl` is the control
       * LUC uses when the choice swaps content in place. `Tabs` would publish an
       * `aria-controls` pointing at a `TabsContent` that does not exist (the
       * panel is the `TransitionPanel` below), which is an ARIA error.
       */}
      <SegmentedControl
        size="sm"
        value={active.id}
        onValueChange={(next) => {
          if (!next) return;
          const nextIndex = views.findIndex((view) => view.id === next);
          setDirection(nextIndex >= index ? 1 : -1);
          setIndex(nextIndex);
        }}
        aria-label="Panel content"
      >
        {views.map((view) => (
          <SegmentedItem size="sm" key={view.id} value={view.id}>
            {view.title}
          </SegmentedItem>
        ))}
      </SegmentedControl>
      <TransitionPanel
        activeIndex={active.id}
        direction={direction}
        className="rounded-lg border border-line-subtle bg-surface-raised p-4"
      >
        <Text variant="label">{active.title}</Text>
        <Text variant="caption" tone="muted" className="mt-1 block">
          {active.body}
        </Text>
      </TransitionPanel>
    </div>
  );
}

function DigitDemo() {
  const [value, setValue] = useState(72104.87);
  return (
    <div className="flex flex-col gap-3">
      <Text variant="micro" tone="muted">
        BTC · USD
      </Text>
      <MetricValue value={value} kind="currency" currency="USD" maximumFractionDigits={2} />
      <Inline gap="sm">
        <Button size="sm" variant="secondary" onClick={() => setValue((current) => current + 186.42)}>
          +186.42
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setValue(72104.87)}>
          Reset
        </Button>
      </Inline>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons (local to the Showcase — @luc/ui does not ship product icons)         */
/* -------------------------------------------------------------------------- */

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3.5 8.5 6.5 11.5 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="4.5" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="7" cy="7" r="4" />
      <path d="m10.2 10.2 3 3" strokeLinecap="round" />
    </svg>
  );
}
