import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Heading, Inline, Text } from "@luc/ui";
import { Suspense } from "react";
import { DocPage } from "@/components/docs/doc-page";
import { BrowseExplorer } from "@/components/explore/browse-explorer";
import { BrowseFallback } from "@/components/explore/browse-fallback";
import { PageHeader } from "@/components/docs/page-header";
import {
  discoveryStats,
  entriesInArtDirection,
  entriesInUseCase,
  featuredEntries,
} from "@/lib/discovery/catalog";
import { ART_DIRECTIONS, DISCOVERY_KINDS, USE_CASES, kindById } from "@/lib/discovery/taxonomy";
import { getServerCopy } from "@/lib/i18n/server";
import { docEntries } from "@/lib/docs/registry";
import { BLOCKS } from "@/lib/blocks";

/*
 * Capability counts, from the registries that own the capabilities.
 *
 * The tiles used to print `discoveryStats.byKind` — the number of *discovery
 * rows*, which for a page-backed area is not the number of capabilities: there is
 * one row for `/blocks`, so the page announced "1 block" while the library ships
 * twelve (independent audit C-05). A reader comparing areas concludes one of them
 * is nearly empty.
 *
 * So each kind states its capability count where a registry can answer, and the
 * row count is shown beside it only when the two differ — a page count and a
 * capability count are different facts and are no longer merged into one number.
 */
const capabilityCounts: Record<string, number> = {
  component: docEntries.filter((entry) => entry.group === "components").length,
  chart: docEntries.filter((entry) => entry.group === "charts").length,
  motion: docEntries.filter((entry) => entry.group === "motion").length,
  block: BLOCKS.length,
};

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Every capability in LUC UI — components, charts, motion, blocks, experiences, studios and visual studies — browsable by name, by use case and by art direction.",
};

/**
 * The Explore hub.
 *
 * The front door of discovery, and the answer to "I do not know what this
 * library contains". It states the size of the catalog, shows a curated handful
 * a visitor can start with, and then offers the two axes that a component list
 * cannot: what you are building, and how it should look.
 *
 * Everything on it is derived from the catalog, so a count here cannot drift from
 * the filter it links to.
 */
export default async function ExplorePage() {
  const { tcs, href } = await getServerCopy();

  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Explore")}
        title={tcs("Find the right thing")}
        lead={tcs(
          "LUC UI is a catalog, and a catalog is only useful if you can enter it from where you already are: by name, by what you are building, or by how it should look.",
        )}
      />

      {/*
        * IA-006 — the tool, not a page about the tool.
        *
        * The filter lived one click away at `/explore/browse`, and this page was
        * 460 words plus a link to it: a reader arrived at "Explore" and had to
        * leave to explore. The explorer is the same island the other route mounts
        * (one discovery engine, not two), and it sits directly under the header so
        * the field and the three filter axes are in the first viewport. Everything
        * below is the curated material that was already here — kind totals,
        * featured picks, the two axes as lists — which is a landing page's job and
        * no longer stands between a reader and the search.
        */}
      <Suspense fallback={<BrowseFallback />}>
        <BrowseExplorer />
      </Suspense>

      <section className="grid gap-px overflow-hidden rounded-xl border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:grid-cols-4">
        {DISCOVERY_KINDS.filter((kind) => (discoveryStats.byKind[kind.id] ?? 0) > 0).map((kind) => {
          const pages = discoveryStats.byKind[kind.id] ?? 0;
          const capabilities = capabilityCounts[kind.id] ?? pages;
          return (
            <Link
              key={kind.id}
              href={href(`/explore?kind=${kind.id}`)}
              className="flex flex-col gap-1 bg-surface-default p-4 luc-transition hover:bg-surface-raised luc-focus"
            >
              <span className="luc-numeric font-display text-display-sm text-fg-primary">
                {capabilities}
              </span>
              <span className="text-caption text-fg-secondary">{tcs(kind.plural)}</span>
              {capabilities !== pages ? (
                <span className="text-micro text-fg-muted">
                  {tcs("{count} documentation pages").replace("{count}", String(pages))}
                </span>
              ) : null}
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-4">
        <Inline gap="sm" align="baseline" wrap>
          <Heading size="title" as="h2" id="featured">
            {tcs("Featured")}
          </Heading>
          <Text variant="caption" tone="muted" as="span">
            {tcs("{count} entries chosen for a first visit").replace(
              "{count}",
              String(featuredEntries.length),
            )}
          </Text>
        </Inline>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featuredEntries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={href(entry.route)}
                className="flex h-full flex-col gap-2 rounded-xl border border-line-subtle bg-surface-default p-4 luc-transition hover:border-line-strong luc-focus"
              >
                <Inline gap="sm" align="center">
                  <Badge tone="outline" size="sm">
                    {tcs(kindById.get(entry.kind)?.label ?? entry.kind)}
                  </Badge>
                  {entry.status === "study" ? (
                    <Badge tone="neutral" size="sm">
                      {tcs("Study")}
                    </Badge>
                  ) : null}
                </Inline>
                {/*
                  * `tcs`, like every other label on this card — and like the
                  * sidebar, which has always looked entry titles up.
                  *
                  * A discovery row's title is either an identifier (`DataTable`,
                  * which both dictionaries return unchanged) or a *name* the
                  * taxonomy wrote in English ("Chart with a date range"), and the
                  * dictionary has held the Chinese for those since Phase 9. This
                  * one span printed the raw field, so a Chinese reader saw the two
                  * pattern tiles in English while the page around them was
                  * translated.
                  */}
                <span className="text-title text-fg-primary">{tcs(entry.title)}</span>
                <span className="font-mono text-micro text-fg-muted">{entry.route}</span>
                {entry.useCases.length > 0 ? (
                  <span className="mt-auto text-caption text-fg-secondary">
                    {entry.useCases
                      .slice(0, 2)
                      .map((id) => tcs(USE_CASES.find((useCase) => useCase.id === id)?.label ?? id))
                      .join(" · ")}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <Heading size="title" as="h2" id="use-cases">
          {tcs("Browse by use case")}
        </Heading>
        <Text variant="caption" tone="muted" className="max-w-[76ch]">
          {tcs(
            "A use case is a claim about applicability, not a category: `DataTable` belongs to finance, research and business software at once, and appears under all three.",
          )}
        </Text>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((useCase) => (
            <li key={useCase.id}>
              <Link
                href={href(`/explore?use=${useCase.id}`)}
                className="flex h-full flex-col gap-2 rounded-xl border border-line-subtle p-4 luc-transition hover:border-line-strong luc-focus"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-title text-fg-primary">{tcs(useCase.label)}</span>
                  <span className="luc-numeric font-mono text-micro text-fg-muted">
                    {entriesInUseCase(useCase.id).length}
                  </span>
                </span>
                <span className="text-caption text-fg-secondary text-pretty">
                  {tcs(useCase.description)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <Inline gap="sm" align="baseline" wrap>
          <Heading size="title" as="h2" id="art-directions">
            {tcs("Browse by art direction")}
          </Heading>
          <Text variant="caption" tone="muted" as="span">
            {tcs("Each direction is a filter over the catalogue, not a separate gallery.")}
          </Text>
        </Inline>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ART_DIRECTIONS.map((direction) => (
            <li key={direction.id}>
              <Link
                href={href(`/explore?art=${direction.id}`)}
                className="flex h-full flex-col gap-2 rounded-xl border border-line-subtle p-4 luc-transition hover:border-line-strong luc-focus"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-title text-fg-primary">{tcs(direction.label)}</span>
                  <span className="luc-numeric font-mono text-micro text-fg-muted">
                    {entriesInArtDirection(direction.id).length}
                  </span>
                </span>
                <span className="text-caption text-fg-secondary text-pretty">
                  {tcs(direction.premise)}
                </span>
                <span className="mt-auto font-mono text-micro text-fg-muted">
                  {direction.knobs.palette} · {direction.knobs.typeface} ·{" "}
                  {direction.knobs.personality}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </DocPage>
  );
}
