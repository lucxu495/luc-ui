"use client";

import Image from "next/image";

import { Button, Card, CardContent, ImageGallery, Marquee, Separator, Text } from "@luc/ui";
import { KineticHeadline, ParallaxLayer, ParallaxScene, TiltSurface } from "@luc/ui/motion";
import { ProjectShowcase } from "@luc/ui/experiences";
import { toast } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { APPROACH, CLIENTS, COMMISSIONS } from "./data";
import { placeholderArt } from "../../placeholder-art";

// Studio Kestrel — a creative portfolio.
//
// The brief for this page is the opposite of the SaaS console: expressive is the
// requirement, so the depth is `deep`, the radius scale is the expressive
// personality's, and the hero is a genuine spatial scene. Three rules keep it
// from becoming noise:
//
//   1. The motion answers the pointer. Nothing loops, nothing autoplays, and the
//      whole scene collapses to a still composition under reduced motion.
//   2. Type carries the expression. The display face is set at display scale and
//      the words are a kinetic headline, which assembles once and then rests.
//   3. One loud thing per screen. The hero is loud; the grid is quiet; the
//      approach section is quieter still.

export function KestrelPortfolio() {
  const { tcs } = useI18n();

  return (
    <div data-slot="kestrel" className="flex flex-col">
      <ParallaxScene
        depth={34}
        tilt={4}
        className="relative overflow-hidden border-b border-line-subtle px-6 py-16 lg:px-12 lg:py-24"
      >
        <ParallaxLayer depth={0.15} className="pointer-events-none absolute inset-0 -z-10">
          <div className="size-full bg-gradient-to-br from-accent-soft via-transparent to-transparent" />
        </ParallaxLayer>
        <ParallaxLayer depth={0.6} className="flex flex-col gap-6">
          <p className="text-micro text-fg-accent">{tcs("Studio Kestrel — identity, editorial, environmental")}</p>
          <KineticHeadline
            as="h2"
            mode="reveal"
            text={tcs("We keep one number and let it do the work")}
            className="max-w-[16ch] font-display text-display font-semibold tracking-[-0.04em] text-fg-primary text-balance"
          />
          <p className="max-w-[52ch] text-body-lg text-fg-secondary text-pretty">
            {tcs(
              "Four commissions a year, from a converted sail loft in Leith. Every project below is governed by a single inherited constraint, and the whole run is shown rather than the best sleeve.",
            )}
          </p>
        </ParallaxLayer>
      </ParallaxScene>

      <Marquee speed={38} gap="3rem" fade pauseOnHover className="border-b border-line-subtle py-5">
        {CLIENTS.map((client) => (
          <span
            key={client}
            className="font-display text-heading-sm whitespace-nowrap font-semibold tracking-[-0.02em] text-fg-muted"
          >
            {client}
          </span>
        ))}
      </Marquee>

      <section aria-labelledby="work" className="flex flex-col gap-6 px-6 py-14 lg:px-12">
        <div className="flex flex-col gap-2">
          <h3 id="work" className="font-display text-display-sm font-semibold tracking-[-0.03em] text-fg-primary">
            {tcs("Selected commissions")}
          </h3>
          <p className="max-w-[56ch] text-body text-fg-secondary text-pretty">
            {tcs(
              "Choose a piece to read the constraint behind it. The set stays visible, because a single cover can flatter anything.",
            )}
          </p>
        </div>
        <ProjectShowcase
          projects={COMMISSIONS.map((commission) => ({
            id: commission.id,
            title: commission.title,
            summary: tcs(commission.summary),
            status: commission.year,
            tags: [tcs(commission.discipline), commission.client],
            meta: [
              { id: "client", label: tcs("Client"), value: commission.client },
              { id: "discipline", label: tcs("Discipline"), value: tcs(commission.discipline) },
              { id: "year", label: tcs("Year"), value: commission.year },
            ],
          }))}
          label={tcs("Commissions")}
          columns={2}
          renderMedia={(project) => (
            <Image
              unoptimized
              {...placeholderArt(project.id, project.title)}
              alt={tcs("Cover artwork for {name}").replace("{name}", project.title)}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          )}
          renderDetail={(project) => (
            <Text variant="body" tone="secondary">
              {tcs(
                COMMISSIONS.find((commission) => commission.id === project.id)?.detail ??
                  project.summary ??
                  "",
              )}
            </Text>
          )}
        />
      </section>

      <Separator />

      <section aria-labelledby="gallery" className="flex flex-col gap-6 px-6 py-14 lg:px-12">
        <div className="flex flex-col gap-2">
          <h3 id="gallery" className="font-display text-display-sm font-semibold tracking-[-0.03em] text-fg-primary">
            {tcs("Quiet/Loud, in full")}
          </h3>
          <p className="max-w-[56ch] text-body text-fg-secondary text-pretty">
            {tcs(
              "Twelve sleeves with the rule applied. Open any one to view it full size, or step through the run in order.",
            )}
          </p>
        </div>
        <ImageGallery
          label={tcs("Quiet/Loud sleeve series")}
          columns={4}
          aspect="square"
          images={Array.from({ length: 8 }, (_, index) => {
            const art = placeholderArt(`quiet-loud-${index}`, `${index + 1}`, "tall");
            return {
              id: `sleeve-${index}`,
              src: art.src,
              width: art.width,
              height: art.height,
              alt: tcs("Sleeve {n} of the Quiet/Loud series").replace("{n}", String(index + 1)),
              caption: `${tcs("Sleeve")} ${index + 1}`,
            };
          })}
        />
      </section>

      <Separator />

      <section aria-labelledby="approach" className="flex flex-col gap-6 bg-surface-sunken px-6 py-14 lg:px-12">
        <h3 id="approach" className="font-display text-display-sm font-semibold tracking-[-0.03em] text-fg-primary">
          {tcs("How a commission runs")}
        </h3>
        <ul className="grid list-none gap-5 lg:grid-cols-3">
          {APPROACH.map((step, index) => (
            <li key={step.id}>
              <TiltSurface max={6} glare glareTone="accent" material="solid" className="h-full rounded-lg">
                <Card variant="raised" className="h-full">
                  <CardContent className="flex h-full flex-col gap-2 p-6">
                    <span className="font-mono text-caption text-fg-accent luc-numeric">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-title font-semibold text-fg-primary">
                      {tcs(step.title)}
                    </span>
                    <span className="text-body text-fg-secondary text-pretty">{tcs(step.body)}</span>
                  </CardContent>
                </Card>
              </TiltSurface>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-start gap-4 px-6 py-14 lg:px-12">
        <h3 className="max-w-[22ch] font-display text-display-sm font-semibold tracking-[-0.03em] text-fg-primary text-balance">
          {tcs("We take four commissions a year. Two places are open for 2027.")}
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="accent"
            size="lg"
            onClick={() =>
              toast.success(tcs("Enquiry started"), {
                description: "studio@example.com",
              })
            }
          >
            {tcs("Start an enquiry")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => toast.info(tcs("The 2026 annual is a printed object, not a file"))}
          >
            {tcs("See the annual")}
          </Button>
        </div>
      </section>
    </div>
  );
}
