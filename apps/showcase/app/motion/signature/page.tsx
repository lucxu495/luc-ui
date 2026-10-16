"use client";

/*
 * Signature motion.
 *
 * The rule for this page: nothing is a picture of an interaction. Every tile is
 * the real component, driven by the real public API, with a control that lets a
 * reviewer repeat it, soften it or compare it — because a motion decision cannot
 * be reviewed from a screenshot.
 */

import { useState } from "react";
import {
  AuroraSurface,
  Badge,
  BeamFlow,
  BorderGlow,
  Button,
  Card,
  Heading,
  IconButton,
  Inline,
  Marquee,
  MagnifyDock,
  MagnifyDockItem,
  MotionIntensityProvider,
  PressRipple,
  SegmentedControl,
  SegmentedItem,
  ShimmerText,
  Section,
  SpotlightSurface,
  Text,
  TextReveal,
  TiltSurface,
  motionIntensities,
  type MotionIntensity,
} from "@luc/ui";
import {
  RiArrowLeftRightLine,
  RiBarChart2Line,
  RiCheckLine,
  RiCrosshair2Line,
  RiDatabase2Line,
  RiEqualizer2Line,
  RiHeartLine,
  RiLoopLeftLine,
  RiPlayLine,
  RiPulseLine,
  RiShareLine,
  RiSparklingLine,
  RiZoomInLine,
} from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { useI18n } from "@/lib/i18n/provider";

type BeamState = "idle" | "active" | "success" | "error";

export default function SignatureMotionPage() {
  const { t, tcs } = useI18n();
  const [intensity, setIntensity] = useState<MotionIntensity>("expressive");
  const [presses, setPresses] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);
  const [beamState, setBeamState] = useState<BeamState>("active");
  const [beamKey, setBeamKey] = useState(0);
  const [auroraTone, setAuroraTone] = useState<"brand" | "duotone" | "neutral">("duotone");
  const [auroraDensity, setAuroraDensity] = useState<"quiet" | "normal" | "rich">("normal");
  const [dockAction, setDockAction] = useState("None yet");
  const [marqueeSpeed, setMarqueeSpeed] = useState(28);
  const [saved, setSaved] = useState(false);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="Signature motion"
        lead="Five new interaction primitives, plus a stronger default for the controls you already use. Everything here is a public @luc/ui export driven by the resolved intensity profile, so a product can scope it down to functional — or off — without touching a call site."
      />

      {/* ------------------------------------------------------- Intensity */}
      <Section
        title={tcs("Intensity is a product decision, not a component clamp")}
        description={tcs("MotionIntensityProvider scopes how loud everything below it is allowed to be. Reduced motion still wins over every level. Change it and watch the whole page respond.")}
      >
        <Card variant="raised" className="gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SegmentedControl
              aria-label="Motion intensity"
              value={intensity}
              onValueChange={(next) => next && setIntensity(next as MotionIntensity)}
            >
              {motionIntensities.map((level) => (
                <SegmentedItem key={level} value={level} data-testid={`intensity-${level}`}>
                  {level}
                </SegmentedItem>
              ))}
            </SegmentedControl>
            <Text variant="caption" tone="muted" className="max-w-[46ch]">
              {tcs("`none` renders static output, `functional` keeps feedback but drops cursor effects, `expressive` is the house default, `showcase` is for the one surface that deserves to be remembered.")}</Text>
          </div>
        </Card>
      </Section>

      <MotionIntensityProvider intensity={intensity}>
        {/* ------------------------------------------------------ Press ink */}
        <Section
          title={tcs("PressRipple")}
          description={tcs("Tactile ink under the pointer, derived from where the finger actually landed. The Button and IconButton families use it by default; anything else can adopt it through the hook or the wrapper.")}
        >
          <Demo
            title={tcs("Press ink")}
            api="usePressRipple() · <RippleLayer /> · <PressRipple>"
            note={tcs("Two rings per press on a filled control, one on a quiet one. Never on hover, never on focus, gone entirely under reduced motion.")}
            onReplay={() => {
              setRippleKey((key) => key + 1);
              setPresses(0);
            }}
          >
            <div className="flex flex-col gap-4">
              <Inline gap="sm" wrap>
                <Button variant="primary" leadingIcon={<RiSparklingLine />} data-testid="ripple-primary">
                  Primary
                </Button>
                <Button variant="accent">Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <IconButton variant="solid" label="Favourite" icon={<RiHeartLine />} />
                <IconButton variant="accent" label="Share" icon={<RiShareLine />} />
              </Inline>

              {/* A bare surface, to prove the primitive is not a Button feature. */}
              <PressRipple
                key={rippleKey}
                className="h-24 items-center justify-center rounded-xl border border-dashed border-line-default bg-surface-canvas text-caption text-fg-muted"
                onClick={() => setPresses((count) => count + 1)}
                data-testid="ripple-surface"
              >
                {tcs("Press anywhere in this panel —")}{" "}{presses} presses
              </PressRipple>
            </div>
          </Demo>
        </Section>

        {/* --------------------------------------------------- Aurora surface */}
        <Section
          title={tcs("AuroraSurface")}
          description={tcs("A living background for the one moment that should be remembered: a hero, an auth screen, an empty state. The light is derived from the live accent, so switching palette re-tints the whole atmosphere.")}
        >
          <Demo
            title={tcs("Ambient light, derived")}
            api="<AuroraSurface tone density speed grid vignette />"
            note={tcs("Compositor-only drift on a ≥14s loop, masked and vignetted so foreground text keeps full contrast. Reduced motion keeps the composition and drops the movement.")}
            controls={
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  size="sm"
                  aria-label="Aurora tone"
                  value={auroraTone}
                  onValueChange={(next) => next && setAuroraTone(next as typeof auroraTone)}
                >
                  <SegmentedItem size="sm" value="brand">
                    Brand
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="duotone">
                    Duotone
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="neutral">
                    Neutral
                  </SegmentedItem>
                </SegmentedControl>
                <SegmentedControl
                  size="sm"
                  aria-label="Aurora density"
                  value={auroraDensity}
                  onValueChange={(next) => next && setAuroraDensity(next as typeof auroraDensity)}
                >
                  <SegmentedItem size="sm" value="quiet">
                    Quiet
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="normal">
                    Normal
                  </SegmentedItem>
                  <SegmentedItem size="sm" value="rich">
                    Rich
                  </SegmentedItem>
                </SegmentedControl>
              </div>
            }
          >
            <AuroraSurface
              tone={auroraTone}
              density={auroraDensity}
              grid
              className="rounded-xl border border-line-subtle"
              data-testid="aurora-demo"
            >
              <div className="flex flex-col gap-4 px-6 py-10 sm:px-10 sm:py-14">
                <Badge tone="accent" size="sm" dot>
                  AuroraSurface
                </Badge>
                <Heading size="display-sm" as="h3" className="max-w-[24ch]">
                  {tcs("A background that reacts to the brand, not to a hardcoded gradient.")}</Heading>
                <Text variant="body" tone="secondary" className="max-w-[52ch]">
                  {tcs("Nothing above the light layer is dimmed, tinted or filtered — the fields are mixed from the accent token and blurred behind the content.")}</Text>
              </div>
            </AuroraSurface>
          </Demo>
        </Section>

        {/* -------------------------------------------------------- Beam flow */}
        <Section
          title={tcs("BeamFlow")}
          description={tcs("A connector that shows something moving between two places: an AI request from model to tool to answer, an ingest pipeline, an onboarding map. It is an overlay, so the nodes stay ordinary LUC surfaces.")}
        >
          <Demo
            title={tcs("Something is happening here")}
            api="<BeamFlow points state width speed label />"
            note={tcs("One SVG in a 0-100 viewBox with non-scaling strokes, so the connector is responsive with no ResizeObserver. The rail stays when the packet stops.")}
            onReplay={() => setBeamKey((key) => key + 1)}
            controls={
              <SegmentedControl
                size="sm"
                aria-label="Beam state"
                value={beamState}
                onValueChange={(next) => next && setBeamState(next as BeamState)}
              >
                {(["idle", "active", "success", "error"] as const).map((state) => (
                  <SegmentedItem key={state} size="sm" value={state}>
                    {state}
                  </SegmentedItem>
                ))}
              </SegmentedControl>
            }
          >
            <Card variant="outline" className="relative gap-0 p-6">
              {/* Scoped to the icon row so the packet is aimed at icon centres,
                  not at the gap between the icons and their labels. */}
              <BeamFlow
                key={beamKey}
                points={[
                  { x: 16.7, y: 50 },
                  { x: 50, y: 50 },
                  { x: 83.3, y: 50 },
                ]}
                state={beamState}
                data-testid="beam-demo"
                className="bottom-auto top-6 h-11"
              />
              <div className="relative grid grid-cols-3 gap-3">
                {[
                  { icon: <RiDatabase2Line />, label: "Retrieve" },
                  { icon: <RiPulseLine />, label: "Reason" },
                  { icon: <RiSparklingLine />, label: "Answer" },
                ].map((node) => (
                  <div key={node.label} className="flex flex-col items-center gap-2">
                    <span className="grid size-11 place-items-center rounded-lg border border-line-subtle bg-surface-raised text-fg-accent [&_svg]:size-[18px]">
                      {node.icon}
                    </span>
                    <Text variant="caption" tone="muted">
                      {node.label}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Demo>
        </Section>

        {/* ----------------------------------------------------- Magnify dock */}
        <Section
          title={tcs("MagnifyDock")}
          description={tcs("A toolbar that answers the most basic question a dense toolbar raises: which of these am I about to hit? Pointer proximity swells each item along a cosine falloff.")}
        >
          <Demo
            title={tcs("Dock physics")}
            api="<MagnifyDock range scale lift orientation> · <MagnifyDockItem>"
            note={tcs("Pointer movement never re-renders React: the container writes two custom properties onto cached element references inside one animation frame.")}
            status={dockAction}
          >
            <div className="flex flex-col items-center gap-4 py-2">
              <MagnifyDock
                aria-label="Chart tools"
                className="gap-2 rounded-2xl border border-line-subtle bg-surface-sunken px-4 pt-3 pb-2"
                data-testid="dock-demo"
              >
                {[
                  { icon: <RiZoomInLine />, label: "Zoom" },
                  { icon: <RiArrowLeftRightLine />, label: "Pan" },
                  { icon: <RiCrosshair2Line />, label: "Crosshair" },
                  { icon: <RiEqualizer2Line />, label: "Series" },
                  { icon: <RiBarChart2Line />, label: "Compare" },
                ].map((item) => (
                  <MagnifyDockItem key={item.label}>
                    <IconButton
                      variant="solid"
                      size="lg"
                      label={item.label}
                      icon={item.icon}
                      onClick={() => setDockAction(item.label)}
                    />
                  </MagnifyDockItem>
                ))}
              </MagnifyDock>
              <Text variant="caption" tone="muted">
                {tcs("Hover across the dock. Every item is a real IconButton with its own focus ring.")}</Text>
            </div>
          </Demo>
        </Section>

        {/* --------------------------------------------------------- Marquee */}
        <Section
          title={tcs("Marquee")}
          description={tcs("A strip that never stops, reserved for content that is genuinely a stream: a logo wall, a live ticker, a long list of names. Pause on hover is on by default, because an unreadable strip is a usability defect.")}
        >
          <Demo
            title={tcs("A stream, not a layout trick")}
            api="<Marquee speed direction gap pauseOnHover fade>"
            note={tcs("Two copies of the track, the second hidden from assistive technology, each shifted by exactly its own width — so the loop is seamless at any content length.")}
            controls={
              <SegmentedControl
                size="sm"
                aria-label="Marquee speed"
                value={String(marqueeSpeed)}
                onValueChange={(next) => next && setMarqueeSpeed(Number(next))}
              >
                <SegmentedItem size="sm" value="48">
                  Slow
                </SegmentedItem>
                <SegmentedItem size="sm" value="28">
                  Normal
                </SegmentedItem>
                <SegmentedItem size="sm" value="14">
                  Fast
                </SegmentedItem>
              </SegmentedControl>
            }
          >
            <div className="rounded-xl border border-line-subtle bg-surface-canvas py-5">
              <Marquee speed={marqueeSpeed} data-testid="marquee-demo">
                {[
                  "Design tokens",
                  "Data tables",
                  "Charts",
                  "Workspaces",
                  "Motion",
                  "Forms",
                  "Accessibility",
                  "Bilingual",
                  "Dark & light",
                ].map((item) => (
                  <Badge key={item} tone="outline" size="md" className="whitespace-nowrap">
                    {item}
                  </Badge>
                ))}
              </Marquee>
            </div>
          </Demo>
        </Section>

        {/* --------------------------------------------- Upgraded primitives */}
        <Section
          title={tcs("And the primitives that were already here")}
          description={tcs("The same motion contract governs the older layer. These are unchanged in API and were re-verified in the same pass — Tile, BorderGlow, SpotlightSurface, Reveal and the fluid indicator all read the intensity profile above.")}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card variant="outline" className="gap-3 p-4">
              <Text variant="micro" tone="muted">
                TiltSurface + BorderGlow
              </Text>
              <TiltSurface max={8} className="rounded-lg">
                <BorderGlow radius="lg" mode="follow" intensity="normal">
                  <SpotlightSurface radius="lg" surface="raised" className="p-5">
                    <Heading size="title" as="h3">
                      Pointer depth
                    </Heading>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {tcs("Lean, light and edge highlight from one pointer position.")}</Text>
                  </SpotlightSurface>
                </BorderGlow>
              </TiltSurface>
            </Card>

            <Card variant="outline" className="flex items-center justify-center p-6">
              <TextReveal className="font-display text-heading" text="Text that arrives" />
            </Card>

            <Card variant="outline" className="flex flex-col items-center justify-center gap-3 p-6">
              <ShimmerText className="font-display text-heading">Shimmering headline</ShimmerText>
              <Text variant="caption" tone="muted">
                {tcs("A moving highlight in the glyph fill, never a layer over it.")}</Text>
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------------------- Completion */}
        <Section
          title={tcs("Motion that confirms an outcome")}
          description={tcs("IconMorph swaps one glyph for the next in place; ClickBurst punctuates a completion. Both are state-triggered, so they answer something the user did rather than animating on a timer.")}
        >
          <Card variant="raised" className="flex flex-wrap items-center gap-4 p-5">
            <Button
              variant={saved ? "accent" : "primary"}
              onClick={() => setSaved((value) => !value)}
              data-testid="success-morph"
            >
              <RiCheckLine aria-hidden="true" className="size-4" />
              {saved ? "Saved" : "Save changes"}
            </Button>
            <Text variant="caption" tone="muted" className="max-w-[46ch]">
              {tcs("A state change is the only trigger: the label and the icon swap together, the fill moves to the accent variant, and nothing loops afterwards.")}</Text>
            <IconButton
              variant="ghost"
              label="Replay gallery"
              icon={<RiLoopLeftLine />}
              onClick={() => {
                setRippleKey((key) => key + 1);
                setBeamKey((key) => key + 1);
                setSaved(false);
              }}
            />
          </Card>
        </Section>
      </MotionIntensityProvider>

      <Section
        title={tcs("Accessibility contract")}
        description={tcs("Everything on this page is covered by the same two gates as the rest of the system.")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Reduced motion wins",
              body: tcs("The global clamp in base.css plus the JS profile mean a decorative effect cannot run when the user asks for less. One-shot effects simply never spawn."),
            },
            {
              title: "Nothing carries meaning",
              body: tcs("Every layer is aria-hidden and pointer-events-none. A selection, an error or a status is always carried by semantics and colour, never by an animation."),
            },
            {
              title: tcs("No motion on content you read"),
              body: tcs("The aurora and the marquee are the only looping effects, both slow, both optional per surface, and both stopped by hover where reading is possible."),
            },
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

      <Text variant="caption" tone="muted">
        {t("docs.onThisPage")}{tcs(": PressRipple · AuroraSurface · BeamFlow · MagnifyDock · Marquee")}</Text>
    </DocPage>
  );
}

/* -------------------------------------------------------------------------- */

function Demo({
  title,
  api,
  note,
  controls,
  status,
  onReplay,
  children,
}: {
  title: string;
  api: string;
  note: string;
  controls?: React.ReactNode;
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
          {controls}
          {onReplay ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<RiPlayLine />}
              onClick={onReplay}
              data-testid="replay"
            >
              Replay
            </Button>
          ) : null}
        </div>
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Text variant="caption" tone="muted" className="max-w-[70ch]">
          {note}
        </Text>
        {status ? <Badge tone="neutral" size="sm">{status}</Badge> : null}
      </div>
    </Card>
  );
}
