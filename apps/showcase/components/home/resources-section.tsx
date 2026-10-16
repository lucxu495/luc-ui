"use client";

/*
 * Where to go next.
 *
 * The homepage's job is to hand a visitor to the surface that answers their
 * question. A cell here is a real route, never a teaser: if the cell is on the
 * page, the destination exists. `id` is also the QA hook
 * (`data-testid="home-resource-<id>"`), so a broken destination fails the browser
 * sweep rather than turning into a 404 nobody notices.
 *
 * Phase 10A changed two things. The form: a grid of identical bordered cards
 * became one hairline field, because ten cards with the same radius and shadow is
 * the composition that says "generated" fastest. The content: each cell now
 * carries the size of the area it leads to, read from the discovery catalog, so
 * the front door's promise about a destination has a number attached to it.
 */

import { Heading, Section, Text } from "@luc/ui";
import { areaForRoute } from "@/lib/discovery/areas";
import { discoveryStats } from "@/lib/discovery/catalog";
import { useI18n } from "@/lib/i18n/provider";

export function HomeResources() {
  const { tcs, tn, href } = useI18n();

  return (
    <Section
      data-testid="home-resources"
      className="border-t border-line-subtle pt-10"
      title={tcs("Where to go next")}
      description={tcs(
        "Each surface has one job: learn the rules, find a component, read a chart, assemble a page, or see a whole product built from the library.",
      )}
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => {
          const area = areaForRoute(resource.route);
          /* "N in this area": a subarea reports its family's size (IA-007), so the
           * Blocks cell keeps counting what Build contains rather than the single
           * gallery page that now owns the prefix. */
          const count = discoveryStats.byAreaFamily[area.parent ?? area.id] ?? 0;
          return (
            <a
              key={resource.id}
              href={href(resource.route)}
              data-testid={`home-resource-${resource.id}`}
              className="luc-transition luc-focus flex flex-col gap-1.5 bg-surface-default p-4 hover:bg-surface-raised"
            >
              <span className="flex items-baseline justify-between gap-3">
                <Heading size="title" as="span">
                  {tn(resource.title)}
                </Heading>
                <span className="shrink-0 font-mono text-micro text-fg-muted luc-numeric">
                  {tcs("{count} in this area").replace("{count}", String(count))}
                </span>
              </span>
              <Text variant="caption" tone="muted">
                {tcs(resource.description)}
              </Text>
            </a>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

interface Resource {
  /** Stable test hook and React key. */
  id: string;
  /** A route that exists in `app/`. */
  route: string;
  /** A navigation label, so `tn()` can find the existing translation. */
  title: string;
  description: string;
}

const RESOURCES: Resource[] = [
  {
    id: "foundations",
    route: "/foundations",
    title: "Foundations",
    description: "The tokens, the spacing rhythm and the rules a page is built from.",
  },
  {
    id: "components",
    route: "/components",
    title: "Components",
    description: "Every public primitive and composite, one honest page at a time.",
  },
  {
    id: "charts",
    route: "/charts",
    title: "Charts",
    description: "The chart catalogue, and the contracts that keep chart engines out of your data layer.",
  },
  {
    id: "motion",
    route: "/motion",
    title: "Motion",
    description: "Spatial and expressive motion primitives, with reduced-motion behaviour built in.",
  },
  {
    id: "experiences",
    route: "/experiences",
    title: "Experiences",
    description: "Sixteen reference products assembled only from public components.",
  },
  {
    id: "data-table",
    route: "/data/table",
    title: "Data table",
    description: "Sorting, filtering, selection and virtualisation for datasets that are actually large.",
  },
  {
    id: "integrations",
    route: "/integrations/tradingview",
    title: "Integrations",
    description: "Third-party surfaces wrapped behind a LUC contract, starting with TradingView.",
  },
  {
    id: "studios",
    route: "/studios/charts",
    title: "Studios",
    description: "Configure a chart, a motion feel or a theme against the real props, then copy the code.",
  },
  {
    id: "blocks",
    route: "/blocks",
    title: "Blocks",
    description: "Page sections assembled from components: a hero, a pricing band, a feed, a timeline.",
  },
  {
    id: "templates",
    route: "/templates",
    title: "Templates",
    description: "Whole-page starters — a personal site, a marketing page, a product console.",
  },
  {
    id: "personal",
    route: "/experiences/personal/portfolio",
    title: "Personal sites",
    description: "Career, academic, portfolio and digital-garden references, built from the same primitives.",
  },
];
