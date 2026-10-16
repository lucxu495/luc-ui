"use client";

/*
 * Spatial motion gallery.
 *
 * The rule for this page is the same as the signature page: nothing is a
 * picture of an interaction. Every tile is the real public component, driven by
 * real controls, so a reviewer can push depth to 48px, freeze the orbit, switch
 * the material to glass, and watch the whole page answer.
 *
 * Six capability families are covered here, and each one is one public export:
 *
 *   A  surfaces & materials   ParallaxScene · ParallaxLayer · TiltSurface glass
 *   B  geometric motion       OrbitField · OrbitFieldRing · OrbitFieldNode
 *   C  morphing & continuity  ExpandableSurface
 *   D  kinetic typography     KineticHeadline
 *   E  depth & navigation     CardStack · CardStackItem · CardStackControls
 *   F  interactive data       SelectionBeam
 */

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardStack,
  CardStackControls,
  CardStackItem,
  ExpandableSurface,
  ExpandableSurfaceClose,
  ExpandableSurfaceContent,
  ExpandableSurfaceTrigger,
  Heading,
  IconButton,
  Inline,
  KineticHeadline,
  MotionIntensityProvider,
  OrbitField,
  OrbitFieldCore,
  OrbitFieldNode,
  OrbitFieldRing,
  ParallaxLayer,
  ParallaxScene,
  Section,
  SegmentedControl,
  SegmentedItem,
  SelectionBeam,
  Slider,
  Switch,
  Text,
  TiltSurface,
  cn,
  motionIntensities,
  type MotionIntensity,
} from "@luc/ui";
import {
  RiArrowLeftRightLine,
  RiDatabase2Line,
  RiLoopLeftLine,
  RiPlayLine,
  RiSparklingLine,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { useI18n } from "@/lib/i18n/provider";

const REGIONS = [
  { id: "apac", label: "APAC", value: 412, delta: 6.4 },
  { id: "emea", label: "EMEA", value: 356, delta: -1.8 },
  { id: "amer", label: "Americas", value: 508, delta: 3.1 },
  { id: "latam", label: "LATAM", value: 138, delta: 9.7 },
] as const;

const HEADLINES = [
  "Built for dense interfaces",
  "Alive on every interaction",
  "One system, many products",
] as const;

export default function SpatialMotionPage() {
  const { tc, tcs } = useI18n();

  // One control board drives every tile, so a reviewer can compare treatments
  // under identical settings instead of hunting for per-demo knobs.
  const [intensity, setIntensity] = useState<MotionIntensity>("expressive");
  const [depth, setDepth] = useState(24);
  const [tilt, setTilt] = useState(6);
  const [glass, setGlass] = useState(true);
  const [orbitSpeed, setOrbitSpeed] = useState(1);
  const [orbitPaused, setOrbitPaused] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("apac");
  const [headline, setHeadline] = useState(0);
  const [deck, setDeck] = useState(0);
  const [key, setKey] = useState(0);

  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const beamFrom = useRef<HTMLButtonElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = Math.max(
    0,
    REGIONS.findIndex((region) => region.id === selectedRegion),
  );
  const selected = REGIONS[selectedIndex]!;

  const material = glass ? "glass" : "solid";

  return (
    <DocPage>
      <PageHeader
        eyebrow={tc("spatial.eyebrow")}
        title={tc("spatial.title")}
        lead={tc("spatial.lead")}
      />

      <Card variant="raised" className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Heading size="title" as="h2">
              {tc("spatial.board.title")}
            </Heading>
            <Text variant="caption" tone="muted" className="max-w-[70ch]">
              {tc("spatial.board.lead")}
            </Text>
          </div>
          <IconButton
            variant="ghost"
            label={tc("spatial.board.reset")}
            icon={<RiLoopLeftLine />}
            onClick={() => {
              setDepth(24);
              setTilt(6);
              setGlass(true);
              setOrbitSpeed(1);
              setOrbitPaused(false);
              setHeadline(0);
              setDeck(0);
              setKey((value) => value + 1);
            }}
            data-testid="spatial-reset"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Control label={tc("spatial.control.depth")} value={`${depth}px`}>
            <Slider
              label={tc("spatial.control.depth")}
              min={0}
              max={48}
              step={2}
              value={depth}
              onValueChange={setDepth}
              data-testid="spatial-depth"
            />
          </Control>
          <Control label={tc("spatial.control.tilt")} value={`${tilt}°`}>
            <Slider
              label={tc("spatial.control.tilt")}
              min={0}
              max={14}
              step={1}
              value={tilt}
              onValueChange={setTilt}
              data-testid="spatial-tilt"
            />
          </Control>
          <Control label={tc("spatial.control.orbit")} value={`${orbitSpeed.toFixed(1)}×`}>
            <Slider
              label={tc("spatial.control.orbit")}
              min={0.4}
              max={2.4}
              step={0.2}
              value={orbitSpeed}
              onValueChange={setOrbitSpeed}
              data-testid="spatial-orbit-speed"
            />
          </Control>
          <div className="flex flex-col gap-3">
            <Switch
              label={tc("spatial.control.material")}
              checked={glass}
              onCheckedChange={setGlass}
              data-testid="spatial-material"
            />
            <Switch
              label={tc("spatial.control.pause")}
              checked={orbitPaused}
              onCheckedChange={setOrbitPaused}
              data-testid="spatial-pause"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line-subtle pt-4">
          <SegmentedControl
            aria-label={tc("spatial.control.intensity")}
            value={intensity}
            onValueChange={(next) => next && setIntensity(next as MotionIntensity)}
          >
            {motionIntensities.map((level) => (
              <SegmentedItem key={level} value={level} data-testid={`spatial-intensity-${level}`}>
                {level}
              </SegmentedItem>
            ))}
          </SegmentedControl>
          <Text variant="caption" tone="muted" className="max-w-[56ch]">
            {tc("spatial.board.intensity")}
          </Text>
        </div>
      </Card>

      <MotionIntensityProvider intensity={intensity}>
        {/* ------------------------------------------------ A. Materials */}
        <Section title={tc("spatial.a.title")} description={tc("spatial.a.lead")}>
          <Demo
            title={tcs("ParallaxScene")}
            api="<ParallaxScene depth tilt> · <ParallaxLayer depth z axis>"
            note={tc("spatial.a.note")}
            status={`${depth}px · ${tilt}°`}
          >
            <ParallaxScene
              key={`scene-${key}`}
              depth={depth}
              tilt={tilt}
              className="h-80 overflow-hidden rounded-xl border border-line-subtle bg-surface-canvas sm:h-96"
              data-testid="parallax-scene-demo"
            >
              <ParallaxLayer depth={0.35} z={-90} className="absolute inset-0">
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 30% 20%, color-mix(in oklab, var(--accent-default) 22%, transparent), transparent 70%), radial-gradient(50% 50% at 80% 80%, color-mix(in oklab, var(--accent-default) 14%, transparent), transparent 70%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--line-strong) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
              </ParallaxLayer>

              <ParallaxLayer
                depth={-1.4}
                z={70}
                className="absolute right-5 bottom-5 sm:right-10 sm:bottom-8"
              >
                <Badge tone="accent" size="sm" className="shadow-md backdrop-blur">
                  <RiSparklingLine aria-hidden="true" className="size-3" />
                  {tc("spatial.a.badge")}
                </Badge>
              </ParallaxLayer>

              <ParallaxLayer
                depth={1.6}
                z={30}
                axis="x"
                className="absolute top-8 left-5 w-40 sm:left-10 sm:w-52"
              >
                <TiltSurface material={material} max={8} className="rounded-lg">
                  <Card variant="outline" className="gap-1 p-4">
                    <Text variant="micro" tone="muted">
                      workspace
                    </Text>
                    <Heading size="title" as="h3">
                      analyst / eu-west
                    </Heading>
                  </Card>
                </TiltSurface>
              </ParallaxLayer>

              {/* Depth 0: readable content never moves. */}
              <ParallaxLayer depth={0} className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                <div className={cn("max-w-[38ch] rounded-lg p-4", glass ? "luc-glass luc-glass-strong" : "")}>
                  <Text variant="micro" tone="accent" className="font-mono">
                    depth 0
                  </Text>
                  <Heading size="title" as="h3" className="mt-1">
                    {tc("spatial.a.headline")}
                  </Heading>
                  <Text variant="caption" tone="muted" className="mt-1">
                    {tc("spatial.a.body")}
                  </Text>
                </div>
              </ParallaxLayer>
            </ParallaxScene>
          </Demo>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: tc("spatial.a.card1.title"), body: tc("spatial.a.card1.body") },
              { title: tc("spatial.a.card2.title"), body: tc("spatial.a.card2.body") },
              { title: tc("spatial.a.card3.title"), body: tc("spatial.a.card3.body") },
            ].map((item) => (
              <TiltSurface key={item.title} material={material} max={7} className="rounded-lg">
                <Card variant="outline" className="h-full gap-1.5 p-4">
                  <Heading size="title" as="h3">
                    {item.title}
                  </Heading>
                  <Text variant="caption" tone="muted">
                    {tcs(item.body)}
                  </Text>
                </Card>
              </TiltSurface>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------ B. Geometry */}
        <Section title={tc("spatial.b.title")} description={tc("spatial.b.lead")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <Card variant="raised" className="gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Heading size="title" as="h3">
                    OrbitField
                  </Heading>
                  <code className="font-mono text-micro text-fg-accent">
                    {`<OrbitField speed paused> · <OrbitFieldRing radius duration direction> · <OrbitFieldNode angle onSelect>`}
                  </code>
                </div>
                <Badge tone="neutral" size="sm">
                  {orbitPaused ? "frozen" : `${orbitSpeed.toFixed(1)}× turn`}
                </Badge>
              </div>

              <div className="mx-auto w-full max-w-[26rem]">
                <OrbitField
                  key={`orbit-${key}`}
                  label={tc("spatial.b.label")}
                  tilt={16}
                  speed={orbitSpeed}
                  paused={orbitPaused}
                  data-testid="orbit-demo"
                >
                  <OrbitFieldRing radius={47} duration={40} trackless>
                    <OrbitFieldNode angle={90}>
                      <Seat label="Ingest" glyph={<RiDatabase2Line />} active={false} />
                    </OrbitFieldNode>
                    <OrbitFieldNode angle={210}>
                      <Seat label="Transform" glyph={<RiArrowLeftRightLine />} active={false} />
                    </OrbitFieldNode>
                    <OrbitFieldNode angle={330}>
                      <Seat label="Publish" glyph={<RiPlayLine />} active={false} />
                    </OrbitFieldNode>
                  </OrbitFieldRing>

                  <OrbitFieldRing radius={28} duration={26} direction="reverse" dashed>
                    {REGIONS.map((region, index) => (
                      <OrbitFieldNode
                        key={region.id}
                        angle={index * 90 + 45}
                        active={region.id === selectedRegion}
                        label={`${region.label} — ${region.value} M`}
                        onSelect={() => setSelectedRegion(region.id)}
                        data-testid={`spatial-seat-${region.id}`}
                      >
                        <Seat
                          label={region.label}
                          active={region.id === selectedRegion}
                          compact
                        />
                      </OrbitFieldNode>
                    ))}
                  </OrbitFieldRing>

                  <OrbitFieldCore>
                    <div
                      className={cn(
                        "grid size-28 place-items-center rounded-full text-center sm:size-32",
                        glass ? "luc-glass luc-glass-strong" : "border border-line-default bg-surface-raised",
                      )}
                      data-testid="spatial-hub"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <Text variant="micro" tone="muted">
                          {selected.label}
                        </Text>
                        <span className="font-mono text-heading text-fg-primary luc-numeric">
                          {selected.value}
                        </span>
                        <Text variant="micro" tone={selected.delta >= 0 ? "positive" : "negative"}>
                          {selected.delta >= 0 ? "+" : ""}
                          {selected.delta}%
                        </Text>
                      </div>
                    </div>
                  </OrbitFieldCore>
                </OrbitField>
              </div>

              <Text variant="caption" tone="muted" className="max-w-[70ch]">
                {tc("spatial.b.note")}
              </Text>
            </Card>

            <Card variant="outline" className="flex flex-col gap-3 p-5">
              <Heading size="title" as="h3">
                {tc("spatial.b.legend.title")}
              </Heading>
              {[
                tc("spatial.b.legend.1"),
                tc("spatial.b.legend.2"),
                tc("spatial.b.legend.3"),
              ].map((line) => (
                <Text key={line} variant="caption" tone="muted">
                  {line}
                </Text>
              ))}
              <Text variant="caption" tone="muted" className="mt-auto">
                {tc("spatial.b.selection")}
              </Text>
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------------ C. Morphing */}
        <Section title={tc("spatial.c.title")} description={tc("spatial.c.lead")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <ExpandableSurface className="rounded-lg">
              <ExpandableSurfaceTrigger className="rounded-lg">
                <Card variant="outline" interactive className="h-full gap-2 p-5">
                  <Inline gap="sm">
                    <Badge tone="accent" size="sm">
                      {tc("spatial.c.badge")}
                    </Badge>
                    <Text variant="micro" tone="muted">
                      {tc("spatial.c.hint")}
                    </Text>
                  </Inline>
                  <Heading size="title" as="h3">
                    {tc("spatial.c.cardTitle")}
                  </Heading>
                  <Text variant="caption" tone="muted">
                    {tc("spatial.c.cardBody")}
                  </Text>
                </Card>
              </ExpandableSurfaceTrigger>
              <ExpandableSurfaceContent className="rounded-lg">
                <Card variant="raised" className="h-full gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Heading size="title" as="h3">
                      {tc("spatial.c.openTitle")}
                    </Heading>
                    <ExpandableSurfaceClose>{tc("spatial.c.close")}</ExpandableSurfaceClose>
                  </div>
                  <Text variant="caption" tone="muted">
                    {tc("spatial.c.openBody")}
                  </Text>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { k: tc("spatial.c.metric1"), v: "1.2s" },
                      { k: tc("spatial.c.metric2"), v: "0 kB" },
                      { k: tc("spatial.c.metric3"), v: "44 kb" },
                    ].map((metric) => (
                      <div key={metric.k} className="rounded-md border border-line-subtle bg-surface-sunken p-3">
                        <Text variant="micro" tone="muted">
                          {metric.k}
                        </Text>
                        <span className="font-mono text-body text-fg-primary luc-numeric">{metric.v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </ExpandableSurfaceContent>
            </ExpandableSurface>

            <Card variant="outline" className="flex flex-col gap-3 p-5">
              <Heading size="title" as="h3">
                {tc("spatial.c.rules.title")}
              </Heading>
              {[tc("spatial.c.rules.1"), tc("spatial.c.rules.2"), tc("spatial.c.rules.3")].map((line) => (
                <Text key={line} variant="caption" tone="muted">
                  {line}
                </Text>
              ))}
              <div className="mt-auto">
                <Text variant="micro" tone="muted">
                  {tc("spatial.c.reject")}
                </Text>
              </div>
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------- D. Kinetic typography */}
        <Section title={tc("spatial.d.title")} description={tc("spatial.d.lead")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card variant="raised" className="gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="font-mono text-micro text-fg-accent">{`<KineticHeadline text mode stagger live />`}</code>
                <Inline gap="xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHeadline((value) => (value + 1) % HEADLINES.length)}
                    data-testid="kinetic-next"
                  >
                    {tc("spatial.d.change")}
                  </Button>
                  <IconButton
                    variant="ghost"
                    label={tc("spatial.board.reset")}
                    icon={<RiLoopLeftLine />}
                    onClick={() => setKey((value) => value + 1)}
                  />
                </Inline>
              </div>

              <div className="min-h-28 rounded-lg border border-line-subtle bg-surface-canvas p-5">
                <KineticHeadline
                  key={`headline-${key}`}
                  as="h3"
                  live
                  text={HEADLINES[headline]!}
                  stagger={0.06}
                  className="font-display text-display-sm font-semibold tracking-[-0.026em] text-fg-primary"
                />
              </div>

              <Text variant="caption" tone="muted">
                {tc("spatial.d.note")}
              </Text>
            </Card>

            <Card variant="outline" className="flex flex-col justify-center gap-3 p-5">
              <Text variant="micro" tone="muted">
                {tc("spatial.d.contrast")}
              </Text>
              {/* The same string as static type, for an honest comparison. */}
              <h3 className="font-display text-display-sm font-semibold tracking-[-0.026em] text-fg-muted">
                {HEADLINES[headline]}
              </h3>
              <Text variant="caption" tone="muted">
                {tc("spatial.d.contrastBody")}
              </Text>
            </Card>
          </div>
        </Section>

        {/* --------------------------------------- E. Depth & navigation */}
        <Section title={tc("spatial.e.title")} description={tc("spatial.e.lead")}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <Card variant="raised" className="gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="font-mono text-micro text-fg-accent">
                  {`<CardStack visible offsetY shrink spread> · <CardStackItem> · <CardStackControls>`}
                </code>
                <Badge tone="neutral" size="sm">
                  {`${deck + 1} / 3`}
                </Badge>
              </div>

              <CardStack
                label={tc("spatial.e.label")}
                index={deck}
                onIndexChange={setDeck}
                offsetY={12}
                shrink={0.07}
                spread={0}
                /*
                 * The stage has to hold the deepest card *and* the controls.
                 *
                 * Each layer behind the active one sinks by `offsetY`, so a card
                 * sized `h-full` pushes the last layer past the stage's own box by
                 * `2 × offsetY` — the deck's bottom edge used to stick 24px out of
                 * its container, and the control pill was positioned over the third
                 * card (`qa/card-stack.mjs` measures the gap and failed at −64px).
                 * An explicit card height plus a taller stage leaves both room.
                 */
                className="h-80"
                data-testid="card-stack-demo"
              >
                {[
                  { title: tc("spatial.e.card1"), body: tc("spatial.e.card1Body"), tone: "accent" as const },
                  { title: tc("spatial.e.card2"), body: tc("spatial.e.card2Body"), tone: "neutral" as const },
                  { title: tc("spatial.e.card3"), body: tc("spatial.e.card3Body"), tone: "positive" as const },
                ].map((item) => (
                  <CardStackItem key={item.title}>
                    {/*
                     * Deliberately opaque, even when the control board is set to
                     * glass: stacked translucent surfaces show each other's text
                     * and turn a deck into noise. Materials do not survive
                     * stacking — see the note under the deck.
                     */}
                    <Card variant="raised" className="h-56 gap-2 p-5 shadow-lg">
                      <Heading size="title" as="h3">
                        {item.title}
                      </Heading>
                      <Text variant="caption" tone="muted">
                        {tcs(item.body)}
                      </Text>
                    </Card>
                  </CardStackItem>
                ))}
                <CardStackControls
                  previousLabel={tc("spatial.e.prev")}
                  nextLabel={tc("spatial.e.next")}
                  /*
                   * Inside the deck's own overlay slot rather than absolutely
                   * positioned over the cards. `self-start` keeps the pill at the
                   * left edge of the centred overlay.
                   */
                  className="luc-glass self-start rounded-full px-2 py-1.5"
                />
              </CardStack>

              <Text variant="caption" tone="muted" className="max-w-[70ch]">
                {tc("spatial.e.note")}
              </Text>
            </Card>

            <Card variant="outline" className="flex flex-col gap-3 p-5">
              <Heading size="title" as="h3">
                {tc("spatial.e.rules.title")}
              </Heading>
              {[tc("spatial.e.rules.1"), tc("spatial.e.rules.2"), tc("spatial.e.rules.3")].map((line) => (
                <Text key={line} variant="caption" tone="muted">
                  {line}
                </Text>
              ))}
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------- F. Data continuity */}
        <Section title={tc("spatial.f.title")} description={tc("spatial.f.lead")}>
          <Card variant="raised" className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <code className="font-mono text-micro text-fg-accent">
                {`<SelectionBeam from={rowRef} to={inspectorRef} active tone />`}
              </code>
              <Text variant="caption" tone="muted">
                {tc("spatial.f.keyboard")}
              </Text>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,16rem)]">
              <div className="flex flex-col gap-1" role="group" aria-label={tc("spatial.f.listLabel")}>
                {REGIONS.map((region, index) => {
                  const isSelected = region.id === selectedRegion;
                  return (
                    <button
                      key={region.id}
                      ref={(node) => {
                        rowRefs.current[index] = node;
                        // The beam watches one stable ref. The selected row owns
                        // it, so the anchor moves without the beam ever learning
                        // which row is active — the `revision` prop is the only
                        // signal it needs that an anchor changed identity.
                        if (index === selectedIndex) beamFrom.current = node;
                      }}
                      type="button"
                      aria-pressed={isSelected}
                      data-testid={`spatial-row-${region.id}`}
                      onClick={() => setSelectedRegion(region.id)}
                      className={cn(
                        "luc-focus flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left luc-transition",
                        isSelected
                          ? "border-line-accent bg-surface-selected"
                          : "border-transparent hover:border-line-subtle hover:bg-surface-interactive-hover",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-4 place-items-center rounded-full border text-[10px] leading-none",
                            isSelected ? "border-line-accent text-fg-accent" : "border-line-strong text-transparent",
                          )}
                        >
                          ●
                        </span>
                        <Text variant="label">{region.label}</Text>
                      </span>
                      <span className="font-mono text-caption text-fg-secondary luc-numeric">
                        {region.value} M
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* A deliberately generic "chart": bars, one highlighted marker. */}
              <div className="flex items-end gap-3 rounded-lg border border-line-subtle bg-surface-canvas p-4">
                {REGIONS.map((region) => {
                  const isSelected = region.id === selectedRegion;
                  return (
                    <div key={region.id} className="flex flex-1 flex-col items-center gap-2">
                      <span
                        className={cn(
                          "font-mono text-micro luc-numeric",
                          isSelected ? "text-fg-accent" : "text-fg-muted",
                        )}
                      >
                        {isSelected ? region.value : ""}
                      </span>
                      <div
                        data-slot="beam-target"
                        className={cn(
                          "w-full rounded-t-sm transition-[height,background-color] duration-[var(--motion-normal)] ease-[var(--ease-standard)]",
                          isSelected ? "bg-accent-default" : "bg-surface-interactive",
                        )}
                        style={{ height: `${(region.value / 520) * 148 + 12}px` }}
                      />
                      <Text variant="micro" tone={isSelected ? "accent" : "muted"}>
                        {region.label}
                      </Text>
                    </div>
                  );
                })}
              </div>

              <div
                ref={inspectorRef}
                className={cn(
                  "flex flex-col gap-2 rounded-lg p-4",
                  glass ? "luc-glass luc-glass-strong" : "border border-line-default bg-surface-raised",
                )}
              >
                <Text variant="micro" tone="muted">
                  {tc("spatial.f.inspector")}
                </Text>
                <Heading size="title" as="h3">
                  {selected.label}
                </Heading>
                <span className="font-mono text-heading text-fg-primary luc-numeric">{selected.value}M</span>
                <Text variant="caption" tone={selected.delta >= 0 ? "positive" : "negative"}>
                  {selected.delta >= 0 ? "+" : ""}
                  {selected.delta}% {tc("spatial.f.period")}
                </Text>
                <Text variant="caption" tone="muted" className="mt-1">
                  {tc("spatial.f.inspectorBody")}
                </Text>
              </div>
            </div>

            <SelectionBeam
              from={beamFrom}
              to={inspectorRef}
              revision={selectedRegion}
              active
              label={tc("spatial.f.beam")}
            />

            <Text variant="caption" tone="muted" className="max-w-[80ch]">
              {tc("spatial.f.note")}
            </Text>
          </Card>
        </Section>
      </MotionIntensityProvider>

      <Section title={tc("spatial.g.title")} description={tc("spatial.g.lead")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: tc("spatial.g.1.title"), body: tc("spatial.g.1.body") },
            { title: tc("spatial.g.2.title"), body: tc("spatial.g.2.body") },
            { title: tc("spatial.g.3.title"), body: tc("spatial.g.3.body") },
          ].map((item) => (
            <Card key={item.title} variant="outline" className="gap-1.5 p-4">
              <Heading size="title" as="h3">
                {item.title}
              </Heading>
              <Text variant="caption" tone="muted">
                {tcs(item.body)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}

/* -------------------------------------------------------------------------- */

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Text variant="micro" tone="muted">
          {label}
        </Text>
        <span className="font-mono text-micro text-fg-secondary luc-numeric">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Seat({
  label,
  glyph,
  active = false,
  compact = false,
}: {
  label: string;
  glyph?: React.ReactNode;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border shadow-sm luc-transition",
        compact ? "px-2.5 py-1" : "px-3 py-1.5",
        active
          ? "border-line-accent bg-surface-selected text-fg-accent"
          : "border-line-subtle bg-surface-raised text-fg-secondary hover:border-line-strong hover:text-fg-primary",
      )}
    >
      {glyph ? <span aria-hidden="true" className="text-current [&_svg]:size-3.5">{glyph}</span> : null}
      <span className={cn("font-medium", compact ? "text-micro" : "text-caption")}>{label}</span>
    </span>
  );
}

function Demo({
  title,
  api,
  note,
  status,
  onReplay,
  children,
}: {
  title: string;
  api: string;
  note: string;
  status?: string;
  onReplay?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card variant="raised" className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading size="title" as="h3">
            {title}
          </Heading>
          <code className="font-mono text-micro text-fg-accent">{api}</code>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status ? (
            <Badge tone="neutral" size="sm">
              {status}
            </Badge>
          ) : null}
          {onReplay ? (
            <Button variant="ghost" size="sm" leadingIcon={<RiPlayLine />} onClick={onReplay}>
              Replay
            </Button>
          ) : null}
        </div>
      </div>
      {children}
      <Text variant="caption" tone="muted" className="max-w-[80ch]">
        {note}
      </Text>
    </Card>
  );
}
