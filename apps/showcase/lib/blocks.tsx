/*
 * The Block registry.
 *
 * A Block is a page *section* built from public components. The registry exists
 * so the gallery, the Template Composer and the templates page all describe the
 * same set, in the same order, with the same statement of which exports each
 * one uses — a Block that silently starts using a component nobody documented
 * is a Block that no longer matches its own description.
 *
 * `uses` is checked against the real package catalogue by
 * `tests/unit/blocks.test.ts`, so a renamed export fails the build rather than
 * leaving a stale list in the documentation.
 */

import type { ReactNode } from "react";
import {
  ActivityFeedBlock,
  CareerTimelineBlock,
  ConsoleHeaderBlock,
  FeatureGrid,
  HeroBanner,
  MetricBandBlock,
  NowBlock,
  PersonalHeroBlock,
  PricingBand,
  PublicationBlock,
  ReadingShelfBlock,
  StatsStrip,
} from "@/components/blocks/blocks";

/**
 * A gallery category, plus the one that only the template composer uses.
 *
 * `multi-section` has no gallery heading — a filter that matches nothing is
 * worse than one fewer filter — but its members are real sections, and the
 * composer arranges them into a personal page.
 */
export type BlockCategory = "marketing" | "product" | "multi-section";

/**
 * Localizes an internal link, so a Block renders `/zh/...` on a Chinese page.
 *
 * A Block is specimen source a reader copies into their own product, where
 * `/zh` means nothing — but the copy *rendered in the gallery* is a real link,
 * and an unprefixed one on a Chinese page gets a 307 that Next's prefetch
 * caches. The string in the code sample stays unprefixed; only the live anchor
 * is localized.
 */
export type BlockHref = (target: string) => string;

export interface BlockSpec {
  id: string;
  title: string;
  category: BlockCategory;
  summary: string;
  /** Public exports this Block composes. Verified against the package catalogue. */
  uses: readonly string[];
  /** One sentence on what a reader has to supply to reuse it. */
  needs: string;
  /**
   * Renders the Block for the gallery and the composer.
   *
   * Two contextual services, both passed rather than reached for: `href`
   * prefixes an internal link with the locale, and `tcs` localizes the Block's
   * own sample copy. A Block is specimen source, so it may not import either.
   */
  render: (href: BlockHref, tcs: (source: string) => string) => ReactNode;
}

export const BLOCK_CATEGORIES: ReadonlyArray<{ id: BlockCategory; title: string; summary: string }> = [
  {
    id: "marketing",
    title: "Marketing",
    summary: "Sections that make a claim and ask for one action.",
  },
  {
    id: "product",
    title: "Product",
    summary: "Sections that read as a working tool rather than a brochure.",
  },
];

export const BLOCKS: readonly BlockSpec[] = [
  {
    id: "hero-banner",
    title: "Hero banner",
    category: "marketing",
    summary: "One claim, one supporting paragraph and exactly one primary action.",
    uses: ["Badge", "Heading", "Text", "Inline", "buttonVariants"],
    needs: "Your own headline, subhead and destination for the two links.",
    render: (href, tcs) => <HeroBanner href={href} tcs={tcs} />,
  },
  {
    id: "feature-grid",
    title: "Feature grid",
    category: "marketing",
    summary: "Three short statements with their explanations, at a readable measure.",
    uses: ["Grid", "Stack", "Heading", "Text"],
    needs: "A list of { title, body } pairs.",
    render: (_href, tcs) => <FeatureGrid tcs={tcs} />,
  },
  {
    id: "pricing-band",
    title: "Pricing band",
    category: "marketing",
    summary: "Two tiers side by side, with the unavailable one saying so instead of pretending.",
    uses: ["Grid", "Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "Heading", "Button"],
    needs: "Your pricing model — or, as here, an honest statement that it does not exist yet.",
    render: (_href, tcs) => <PricingBand tcs={tcs} />,
  },
  {
    id: "stats-strip",
    title: "Stats strip",
    category: "product",
    summary: "Three numbers with their direction, sized so the value dominates the label.",
    uses: ["Grid", "StatCard"],
    needs: "Numeric values: a formatted string is not a number the component can align.",
    render: () => <StatsStrip />,
  },
  {
    id: "metric-band",
    title: "Metric band",
    category: "product",
    summary: "A row of metrics using the numeric formatter, so units and separators stay consistent.",
    uses: ["Inline", "Metric", "MetricValue"],
    needs: "A number and a format kind (`number`, `percent`, `currency`, `compact`).",
    render: () => <MetricBandBlock />,
  },
  {
    id: "console-header",
    title: "Console section header",
    category: "product",
    summary: "A titled section with one action — what most console pages need instead of a toolbar.",
    uses: ["Section", "Inline", "Button"],
    needs: "A title, a description and the actions your page actually has.",
    render: (_href, tcs) => <ConsoleHeaderBlock tcs={tcs} />,
  },
];

/*
 * The sections a page is *assembled* from, as opposed to the compositions the
 * gallery shows.
 *
 * Six of the twelve entries are a single `experiences/*` component each — a
 * profile hero, a career timeline, a publication list, a reading shelf, `/now`,
 * an activity feed. They are not compositions, so the gallery does not list them
 * (and their prose is on the component's own page); but the **template composer**
 * composes pages out of exactly these sections, and its `personal` archetype
 * starts from five of them. Deleting them would have emptied that archetype,
 * which is why they live here rather than nowhere.
 */
export const BLOCK_SECTIONS: readonly BlockSpec[] = [
  {
    id: "personal-hero",
    title: "Personal hero",
    category: "multi-section",
    summary: "A name as the page h1, one line of context, and the facts a reader wants first.",
    uses: ["ProfileHero"],
    needs: "A name, a title and the facts list; `ProfileHero` owns the heading order.",
    render: () => <PersonalHeroBlock />,
  },
  {
    id: "career-timeline",
    title: "Career timeline",
    category: "multi-section",
    summary: "Roles as an ordered list, with a machine-readable period and an open end for the current one.",
    uses: ["ExperienceTimeline"],
    needs: "Entries with { role, org, from, to? }; mark the current role with `current`.",
    render: () => <CareerTimelineBlock />,
  },
  {
    id: "publication-list",
    title: "Publication list",
    category: "multi-section",
    summary: "Publications with a real author line and venue, and no invented citation counts.",
    uses: ["PublicationList"],
    needs: "Entries with { title, authors, venue, year }; facets are derived from the data.",
    render: () => <PublicationBlock />,
  },
  {
    id: "reading-shelf",
    title: "Reading shelf",
    category: "multi-section",
    summary: "Books and papers grouped by status, with progress as a real progress bar.",
    uses: ["ReadingShelf"],
    needs: "Entries with { title, author, status } and an optional 0–1 progress.",
    render: () => <ReadingShelfBlock />,
  },
  {
    id: "now",
    title: "Now section",
    category: "multi-section",
    summary: "A /now block that must carry the date it was last true.",
    uses: ["NowSection"],
    needs: "The `updatedAt` date — the component requires it, so the section cannot go stale silently.",
    render: () => <NowBlock />,
  },
  {
    id: "activity-feed",
    title: "Activity feed",
    category: "multi-section",
    summary: "Recent events as a timeline, with the timestamps the caller supplies.",
    uses: ["Timeline"],
    needs: "ISO timestamps; the component renders them, it does not generate them.",
    render: () => <ActivityFeedBlock />,
  },
];

/** Everything that can be rendered as a page section, gallery entries included. */
export const ALL_BLOCK_SECTIONS: readonly BlockSpec[] = [...BLOCKS, ...BLOCK_SECTIONS];

export function blocksInCategory(category: BlockCategory): readonly BlockSpec[] {
  return BLOCKS.filter((block) => block.category === category);
}

export function blockById(id: string): BlockSpec | undefined {
  return ALL_BLOCK_SECTIONS.find((block) => block.id === id);
}
