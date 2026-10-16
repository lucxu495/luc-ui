"use client";

/*
 * Motion gallery index.
 *
 * A catalogue, not a poster: every entry names the public API it demonstrates,
 * says what it is for, and links to the page where it can be triggered. Small
 * specimens run inline so the gallery is scannable without opening sixteen tabs.
 */

import Link from "next/link";
import { useState } from "react";
import {
  AuroraSurface,
  Badge,
  BeamFlow,
  BorderGlow,
  BorderTrail,
  Button,
  Card,
  GlareSurface,
  Heading,
  Inline,
  Magnetic,
  MagnifyDock,
  MagnifyDockItem,
  Marquee,
  NumberTicker,
  OrbitField,
  OrbitFieldCore,
  OrbitFieldNode,
  OrbitFieldRing,
  ParallaxLayer,
  ParallaxScene,
  Reveal,
  Section,
  ShimmerText,
  SpotlightSurface,
  Text,
  TextReveal,
  TiltSurface,
  buttonVariants,
  cn,
} from "@luc/ui";
import { RiArrowRightLine, RiFlashlightLine, RiRefreshLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import {
  CardStackTile,
  ClickBurstTile,
  CollapseTile,
  DataChangeFlashTile,
  ExpandableSurfaceTile,
  IconMorphTile,
  KineticHeadlineTile,
  MorphingTile,
  PressRippleTile,
  SelectionBeamTile,
} from "@/components/demo/islands/motion-tiles";
import { useI18n } from "@/lib/i18n/provider";

interface Entry {
  name: string;
  api: string;
  href: string;
  body: string;
  specimen?: React.ReactNode;
}

export default function MotionGalleryPage() {
  const { href, tn, tcs } = useI18n();
  /*
   * MOT-003. Several specimens are *timed*: a shimmer sweeps, a border trail
   * orbits, a number ticks, a headline assembles. A reader who looked away has
   * no way to see the beginning again — unless the specimen is remounted, which
   * is exactly what this counter does. It is one control for the page rather
   * than one per tile, because a card grid with twenty-three replay buttons is a
   * worse page than a card grid with one.
   *
   * Reduced motion is not duplicated here: the header's own control
   * (`Motion auto · Reduced`) writes the same provider every specimen reads, and
   * `qa/motion.mjs` asserts that turning it down really does flatten them.
   */
  const [replay, setReplay] = useState(0);

  const groups: { title: string; note: string; entries: Entry[] }[] = [
    {
      title: tcs("Spatial"),
      note: tcs("Depth, geometry and continuity: one public export per capability family, all with live controls."),
      entries: [
        {
          name: "ParallaxScene",
          api: "<ParallaxScene depth tilt> · <ParallaxLayer depth z axis>",
          href: "/motion/spatial",
          body: tcs("A depth coordinate system: one pointer offset, published as custom properties, multiplied per layer."),
          specimen: (
            <ParallaxScene depth={14} className="grid h-full place-items-center p-4">
              <ParallaxLayer depth={2} z={10}>
                <span className="rounded-md border border-line-subtle bg-surface-raised px-4 py-3 text-caption text-fg-primary">
                  {tcs("Move the pointer")}
                </span>
              </ParallaxLayer>
            </ParallaxScene>
          ),
        },
        {
          name: "OrbitField",
          api: "<OrbitFieldRing> · <OrbitFieldNode>",
          href: "/motion/spatial",
          body: tcs("Geometric composition on rings, with seats that are real buttons and labels that stay upright."),
          specimen: (
            <OrbitField label={tcs("Orbit field")} className="h-full">
              <OrbitFieldCore className="size-10 rounded-full border border-line-subtle bg-surface-raised" />
              <OrbitFieldRing radius={44}>
                <OrbitFieldNode className="size-5 rounded-full bg-accent-default" />
              </OrbitFieldRing>
              <OrbitFieldRing radius={74}>
                <OrbitFieldNode className="size-4 rounded-full bg-surface-raised" />
                <OrbitFieldNode className="size-4 rounded-full bg-surface-raised" />
              </OrbitFieldRing>
            </OrbitField>
          ),
        },
        {
          name: "ExpandableSurface",
          api: "<ExpandableSurface> · <ExpandableSurfaceTrigger>",
          href: "/motion/spatial",
          body: tcs("A surface that grows out of its own rectangle, in flow — no portal, no scroll lock, no focus trap."),
          specimen: <ExpandableSurfaceTile />,
        },
        {
          name: "KineticHeadline",
          api: "<KineticHeadline text mode live />",
          href: "/motion/spatial",
          body: tcs("A change of words with a direction and a rhythm — one accessible string, real text nodes."),
          specimen: <KineticHeadlineTile />,
        },
        {
          name: "CardStack",
          api: "<CardStackItem> · <CardStackControls>",
          href: "/motion/spatial",
          body: tcs("Depth as navigation: the deck tells you where you are, and inert cards stay out of the tab order."),
          specimen: <CardStackTile />,
        },
        {
          name: "SelectionBeam",
          api: "<SelectionBeam from to active />",
          href: "/motion/spatial",
          body: tcs("Two DOM nodes, one travelling packet: selection, marker and inspector read as a single gesture."),
          specimen: <SelectionBeamTile />,
        },
      ],
    },
    {
      title: tcs("Signature"),
      note: tcs("Distinctive, reusable interactions with their own pages and live controls."),
      entries: [
        {
          name: "PressRipple",
          api: "usePressRipple · <RippleLayer />",
          href: "/motion/signature",
          body: tcs("Ink that starts where the finger landed. Used by Button and IconButton by default."),
          specimen: (
            <PressRippleTile />
          ),
        },
        {
          name: "AuroraSurface",
          api: "<AuroraSurface />",
          href: "/motion/signature",
          body: tcs("A drifting, palette-derived atmosphere for the one surface allowed to be memorable."),
          specimen: (
            <AuroraSurface className="grid h-full place-items-center p-4">
              <Text variant="caption" tone="muted">
                {tcs("Ambient depth")}
              </Text>
            </AuroraSurface>
          ),
        },
        {
          name: "BeamFlow",
          api: "<BeamFlow points />",
          href: "/motion/signature",
          body: tcs("A packet travelling between nodes: pipelines, agent traces, integration maps."),
          specimen: (
            <BeamFlow
              label={tcs("A packet travelling between two nodes")}
              points={[
                { x: 16, y: 70 },
                { x: 84, y: 24 },
              ]}
              className="h-full w-full"
            />
          ),
        },
        {
          name: "MagnifyDock",
          api: "<MagnifyDock> · <MagnifyDockItem>",
          href: "/motion/signature",
          body: tcs("Pointer-proximity magnification for a dense toolbar, with no React re-render per move."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <MagnifyDock className="flex items-center gap-1">
                {["A", "B", "C", "D"].map((label) => (
                  <MagnifyDockItem key={label} className="grid size-9 place-items-center rounded-md border border-line-subtle bg-surface-raised text-caption text-fg-primary">
                    {label}
                  </MagnifyDockItem>
                ))}
              </MagnifyDock>
            </div>
          ),
        },
        {
          name: "Marquee",
          api: "<Marquee />",
          href: "/motion/signature",
          body: tcs("A seamless, pausable stream for content that is genuinely a stream."),
          specimen: (
            <Marquee pauseOnHover fade className="py-4">
              {["BTCUSDT", "ETHUSDT", "SOLUSDT", "AAPL", "MSFT"].map((symbol) => (
                <span key={symbol} className="px-4 text-caption text-fg-secondary">{symbol}</span>
              ))}
            </Marquee>
          ),
        },
      ],
    },
    {
      title: tcs("Pointer"),
      note: tcs("Cursor-reactive depth and light. Inert on touch devices and under reduced motion."),
      entries: [
        {
          name: "SpotlightSurface",
          api: "<SpotlightSurface />",
          href: "/motion/spotlight",
          body: tcs("A light layer above the surface and below the content, so text never loses contrast."),
          specimen: (
            <SpotlightSurface radius="lg" surface="raised" className="h-full p-4">
              <Text variant="caption" tone="muted">
                {tcs("Move the pointer")}
              </Text>
            </SpotlightSurface>
          ),
        },
        {
          name: "BorderGlow",
          api: "<BorderGlow mode />",
          href: "/motion/border-glow",
          body: tcs("A thin light on the perimeter: travelling, following, or a calm ring when selected."),
          specimen: (
            <BorderGlow radius="lg" intensity="normal" className="h-full">
              <div className="grid h-full place-items-center rounded-lg border border-line-subtle bg-surface-raised p-4">
                <Text variant="caption" tone="muted">
                  {tcs("Follow · travel")}
                </Text>
              </div>
            </BorderGlow>
          ),
        },
        {
          name: "Magnetic",
          api: "<Magnetic strength />",
          href: "/motion/kinetic",
          body: tcs("A control that leans toward the pointer and springs home, clamped so it stays clickable."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <Magnetic strength={0.3}>
                <span className="rounded-md border border-line-subtle bg-surface-raised px-3 py-1.5 text-caption text-fg-primary">Magnetic</span>
              </Magnetic>
            </div>
          ),
        },
        {
          name: "TiltSurface",
          api: "<TiltSurface max />",
          href: "/motion/kinetic",
          body: tcs("The loudest pointer effect: a 3D lean with an optional sheen. Never a default."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <TiltSurface max={12} className="rounded-lg border border-line-subtle bg-surface-raised px-6 py-5 text-caption text-fg-primary">
                {tcs("Tilt me")}
              </TiltSurface>
            </div>
          ),
        },
        {
          name: "GlareSurface",
          api: "<GlareSurface />",
          href: "/motion/kinetic",
          body: tcs("A soft highlight that tracks the pointer across a raised surface."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <GlareSurface className="rounded-lg border border-line-subtle bg-surface-raised px-6 py-5 text-caption text-fg-primary">
                {tcs("Pointer sheen")}
              </GlareSurface>
            </div>
          ),
        },
        {
          name: "BorderTrail",
          api: "<BorderTrail />",
          href: "/motion/kinetic",
          body: tcs("One segment travelling the perimeter — for a task that is running, not for decoration."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <BorderTrail className="rounded-lg border border-line-subtle bg-surface-raised px-6 py-5 text-caption text-fg-primary">
                {tcs("Running")}
              </BorderTrail>
            </div>
          ),
        },
      ],
    },
    {
      title: tcs("Feedback"),
      note: tcs("Answers to something the user did, or to something the product is doing."),
      entries: [
        {
          name: "NumberTicker",
          api: "<NumberTicker value />",
          href: "/motion/number-ticker",
          body: tcs("A value moving to its new state with the width reserved and the digits tabular."),
          specimen: (
            <div className="flex h-full items-center justify-center p-4">
              <NumberTicker value={48291} kind="compact" className="font-display text-heading" />
            </div>
          ),
        },
        {
          name: "IconMorph",
          api: "<IconMorph state icons />",
          href: "/motion/kinetic",
          body: tcs("One glyph dissolving into the next in place: copy to check, expand to collapse."),
          specimen: <IconMorphTile />,
        },
        {
          name: "ClickBurst",
          api: "<ClickBurst />",
          href: "/motion/kinetic",
          body: tcs("A short spark from the actual pointer position at a moment of completion."),
          specimen: <ClickBurstTile />,
        },
        {
          name: "DataChangeFlash",
          api: "<DataChangeFlash />",
          href: "/motion/kinetic",
          body: tcs("A brief tint when a number changes, so a scan of a table shows what moved."),
          specimen: <DataChangeFlashTile />,
        },
        {
          name: "Shimmer",
          api: "<Shimmer /> · <ShimmerText />",
          href: "/motion/shimmer",
          body: tcs("The loading language: a skeleton with shape, and a sweep inside a glyph fill."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <ShimmerText className="font-display text-title">{tcs("Loading state")}</ShimmerText>
            </div>
          ),
        },
      ],
    },
    {
      title: tcs("Entrance"),
      note: tcs("Content arriving with intent: once, in reading order, and never on a timer."),
      entries: [
        {
          name: "Reveal",
          api: "<Reveal /> · <StaggerGroup />",
          href: "/motion/reveal",
          body: tcs("A short fade and a few pixels of travel, once, the first time it is seen."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <Reveal immediate>
                <Badge tone="accent">Reveal</Badge>
              </Reveal>
            </div>
          ),
        },
        {
          name: "TextReveal",
          api: "<TextReveal mode />",
          href: "/motion/kinetic",
          body: tcs("A headline assembling by word or by character, with the layout reserved up front."),
          specimen: (
            <div className="grid h-full place-items-center p-4">
              <TextReveal text="Assembling by word" mode="word" className="font-display text-heading-sm text-fg-primary" />
            </div>
          ),
        },
        {
          name: "Collapse",
          api: "<Collapse />",
          href: "/motion/kinetic",
          body: tcs("Disclosure whose height is measured, not guessed, so nothing jumps on close."),
          specimen: <CollapseTile />,
        },
        {
          name: "MorphingDialog / MorphingPopover",
          api: "<MorphingDialog />",
          href: "/motion/kinetic",
          body: tcs("Trigger-to-surface continuity: the panel grows out of the thing you pressed."),
          specimen: <MorphingTile />,
        },
      ],
    },
  ];

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Motion")}
        title="Motion gallery"
        lead="Every kinetic primitive in @luc/ui, grouped by what it is for. Each entry names the public API, and every one of them is driven by the same intensity profile and the same reduced-motion contract."
        actions={
          <Inline gap="sm" align="center">
            <Button variant="outline" size="sm" onClick={() => setReplay((count) => count + 1)}>
              <RiRefreshLine aria-hidden="true" className="size-4" />
              {tcs("Replay the specimens")}
            </Button>
            <Link href={href("/motion/signature")} className={buttonVariants({ variant: "primary" })}>
              {tn("Signature motion")}
              <RiArrowRightLine className="size-4" />
            </Link>
          </Inline>
        }
      />

      {groups.map((group) => (
        <Section key={group.title} title={group.title} description={group.note}>
          {/*
            A catalogue grid, not a table of contents: the card titles are `h3`
            for the reader who scans the grid, and `data-outline-ignore` keeps
            the thirty of them out of the page rail, which lists the groups.
          */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-outline-ignore>
            {group.entries.map((entry) => (
              <Card
                key={entry.name}
                as="a"
                href={href(entry.href)}
                variant="outline"
                interactive
                /*
                 * `min-w-0` because a grid track takes its floor from its
                 * items' min-content, and a marquee's inner track is as wide as
                 * its loop. One `Marquee` specimen therefore stretched every
                 * card in the Signature group to 1226px, and the whole page to
                 * 1246px at a 390px viewport — the tile that clips its own
                 * overflow does not stop its *min-content* from propagating up.
                 * The mobile sweep found it; a reader on a phone was scrolling
                 * this page sideways three screens wide.
                 */
                className="min-w-0 gap-2 p-4"
              >
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <Heading size="title" as="h3">
                    {entry.name}
                  </Heading>
                  <RiArrowRightLine aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
                </div>
                <code className="break-words font-mono text-micro text-fg-accent">{entry.api}</code>
                <Text variant="caption" tone="muted">
                  {tcs(entry.body)}
                </Text>
                {entry.specimen ? (
                  <div
                    /* Remounted by Replay: a timed specimen starts again from
                     * its first frame, which is the only honest way to show a
                     * one-shot animation to a second reader. */
                    key={`${entry.name}-${replay}`}
                    className={cn(
                      "mt-2 min-h-20 overflow-hidden rounded-md border border-line-subtle bg-surface-canvas",
                    )}
                  >
                    {entry.specimen}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </Section>
      ))}

      {/*
       * The grammar note comes *after* the catalogue.
       *
       * It used to sit between the title and the first group, which pushed the
       * first live specimen to ~1169px — one and a bit screens down a page whose
       * entire purpose is "see what this motion primitive does" (independent audit
       * C-11). Nothing was said here that a reader needs before the first tile;
       * nothing is lost by saying it afterwards.
       */}
      <Section title={tcs("One grammar, one switch")} description={tcs("Every primitive above reads the same resolved profile, so loudness is scoped rather than hard-coded.")}>
        <Card variant="raised" className="flex flex-col gap-3 p-5">
          <Inline gap="sm">
            <Badge tone="accent" size="sm">
              <RiFlashlightLine className="size-3" />
              {tcs("One grammar")}
            </Badge>
            <Badge tone="neutral" size="sm">
              MotionIntensityProvider
            </Badge>
          </Inline>
          <Text variant="caption" tone="muted" className="max-w-[70ch]">
            {tcs(
              "A component reads the resolved profile (`pointer`, `ambient`, `travel`, `glow`, `depth`) and nothing else. A dense table toolbar scopes itself to `functional`, a hero pushes to `showcase`, and reduced motion resolves every level to `none` — once, in one place.",
            )}
          </Text>
        </Card>
      </Section>
    </DocPage>
  );
}
