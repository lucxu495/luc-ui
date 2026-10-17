/*
 * The component index.
 *
 * This page used to carry a hand-written list of families and links, which is a
 * second catalogue: a component added to the library appeared in the sidebar
 * (generated) and not here (written), and the two drifted. It is now a view of
 * the registry — every family, every entry, their real routes — so it cannot
 * disagree with the navigation, the family pages or the search index.
 *
 * A server component: it reads the registry and prints it. The only interactive
 * part is the search field, which is an island.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Heading, Inline, Stack, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { DocSearch } from "@/components/docs/doc-search";
import { PageHeader } from "@/components/docs/page-header";
import { entriesInFamily, familiesInGroup } from "@/lib/docs/registry";
import { componentDemoFor } from "@/lib/demo/registry";
import { DemoStage } from "@/components/docs/demo-stage";
import { getServerCopy } from "@/lib/i18n/server";

/**
 * One lightweight live preview per family, chosen by rule rather than by hand.
 *
 * The catalogue listed names and nothing else, so a reader had to open thirteen
 * pages to find out what any of it looked like (independent audit C-08). A live
 * specimen per *family* is the cheap half of that fix: one per family keeps the
 * page's cost bounded, and a rule rather than a hand-picked list keeps it true as
 * the library grows.
 *
 * The rule: the first entry in the family whose demo is not a full-width "stage".
 * A stage demo needs room — a table, a board, a shell — and thirteen of those on
 * one page is a performance problem and a worse catalogue. A family with no
 * lightweight demo simply shows no preview rather than a squeezed one.
 */
function previewForFamily(familyId: string) {
  for (const entry of entriesInFamily(familyId)) {
    const demo = componentDemoFor(entry.id);
    if (demo && demo.layout !== "stage" && demo.height === undefined) {
      return { entry, demo };
    }
  }
  return undefined;
}

export const metadata: Metadata = {
  title: "Components — Luc UI",
  description:
    "Every documented component, grouped by the job it does, with the family and the page each one lives on.",
};

export default async function ComponentsIndexPage() {
  const { tcs, tn, href } = await getServerCopy();
  const families = familiesInGroup("components");
  const total = families.reduce((count, family) => count + entriesInFamily(family.id).length, 0);
  /* Motion is a component family now, so it is part of this catalogue's total
   * and gets its own section below. */
  const motionFamilies = familiesInGroup("motion");
  const motionEntries = motionFamilies.flatMap((family) => entriesInFamily(family.id));

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("Components")}
        lead={tcs(
          "Every documented component, grouped by the job it does. Search for a name, or open a family and read it in context.",
        )}
      />

      <DocSearch />

      <Text variant="caption" tone="muted" as="p">
        {tcs("{count} entries across {families} families.")
          .replace("{count}", String(total))
          .replace("{families}", String(families.length))}
      </Text>

      {families.map((family) => {
        const entries = entriesInFamily(family.id);
        if (entries.length === 0) return null;
        /*
         * `data-outline-ignore` suppresses the rail on purpose (UX-004).
         *
         * This page is the catalogue: one section per family, thirteen of them,
         * and the area sidebar already lists exactly those thirteen as
         * destinations. A rail repeating the sidebar is the "repeated navigation
         * list" the design spec forbids — the sidebar navigates, the search box
         * filters, and page-local navigation has nothing of its own to move
         * between. The `id` on each heading stays, so a deep link to a family
         * still lands correctly.
         */
        return (
          <Stack gap="sm" key={family.id} data-outline-ignore>
            <Inline gap="sm" align="baseline" wrap>
              <Heading size="title" as="h2" id={family.id}>
                {tn(family.title)}
              </Heading>
              {family.landing ? (
                <Link
                  href={href(family.landing)}
                  className="text-caption text-fg-accent underline luc-focus rounded-sm"
                >
                  {tcs("Overview")}
                </Link>
              ) : null}
            </Inline>
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(family.summary)}
            </Text>
            {(() => {
              const preview = previewForFamily(family.id);
              if (!preview) return null;
              return (
                <div className="rounded-lg border border-line-subtle bg-surface-canvas p-4">
                  <Inline gap="sm" align="baseline" justify="between" wrap>
                    <Text variant="micro" tone="muted" as="p">
                      {tcs("Live preview")}
                    </Text>
                    <Link
                      href={href(preview.entry.route)}
                      className="text-caption text-fg-accent underline luc-focus rounded-sm"
                    >
                      {tcs("Open {name}").replace("{name}", preview.entry.title)}
                    </Link>
                  </Inline>
                  <div className="mt-3">
                    <DemoStage spec={preview.demo} compact />
                  </div>
                </div>
              );
            })()}
            <Inline gap="sm" wrap>
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={href(entry.route)}
                  className="rounded-lg border border-line-subtle px-3 py-1.5 text-label text-fg-primary luc-transition hover:border-line-strong luc-focus"
                >
                  {entry.title}
                </Link>
              ))}
            </Inline>
          </Stack>
        );
      })}

      {/*
       * Motion lives here (WP-5).
       *
       * It used to be a header entry of its own, which meant a reader looking for
       * a motion primitive under Components found nothing, and a reader glancing
       * at the header saw "Motion" competing with "Charts". It is a component
       * family, so it is a section of the component catalogue — with its own
       * five families and every entry reachable, not one link to a separate
       * corner of the site.
       */}
      <div className="flex flex-col gap-6 border-t border-line-strong pt-8">
        <Inline gap="sm" align="baseline" wrap>
          <Heading size="title" as="h2" id="motion">
            {tcs("Motion and interaction")}
          </Heading>
          <Badge tone="neutral" size="sm">
            {motionEntries.length}
          </Badge>
          <Link
            href={href("/motion")}
            className="text-caption text-fg-accent underline luc-focus rounded-sm"
          >
            {tcs("Open the motion gallery")}
          </Link>
        </Inline>
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Kinetic primitives that share one intensity profile and one reduced-motion contract. Every entry below is a public export with a live specimen.",
          )}
        </Text>
        {motionFamilies.map((family) => {
          const entries = entriesInFamily(family.id);
          if (entries.length === 0) return null;
          return (
            <Stack gap="sm" key={family.id} data-outline-ignore>
              <Heading size="title" as="h3" id={family.id}>
                {tn(family.title)}
              </Heading>
              <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
                {tcs(family.summary)}
              </Text>
              <Inline gap="sm" wrap>
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={href(entry.route)}
                    className="rounded-lg border border-line-subtle px-3 py-1.5 text-label text-fg-primary luc-transition hover:border-line-strong luc-focus"
                  >
                    {entry.title}
                  </Link>
                ))}
              </Inline>
            </Stack>
          );
        })}
      </div>
    </DocPage>
  );
}
