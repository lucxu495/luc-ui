/*
 * The Blocks gallery.
 *
 * Every preview on this page renders the real Block, at full width, in the same
 * order the registry declares — so the gallery is a demonstration rather than a
 * picture of one. Filtering is a query parameter read on the server, which
 * means the page ships no client JavaScript at all: no interactive island, no
 * hydration for a list of links.
 *
 * The reuse note is the honest part. A Block is *source*, not an npm export: a
 * hero that ships as a package export is a hero the library has to version and
 * support forever. Each card names the exports it uses and what you have to
 * supply, which is everything a reader needs to copy the file.
 */

import type { Metadata } from "next";
import { Badge, Card, Heading, Inline, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { BLOCKS, BLOCK_CATEGORIES, blocksInCategory, type BlockCategory } from "@/lib/blocks";
import { getServerCopy } from "@/lib/i18n/server";
import { BlocksGallery } from "@/components/blocks/blocks-gallery";

export const metadata: Metadata = {
  title: "Blocks",
  description:
    "Reusable page sections assembled from Luc UI components — a hero, a pricing band, a career timeline, a metrics strip.",
};

export default async function BlocksPage() {
  const { tcs, href } = await getServerCopy();

  const sections = BLOCK_CATEGORIES.flatMap((category) => {
    const blocks = blocksInCategory(category.id as BlockCategory);
    if (blocks.length === 0) return [];
    return [
      {
        id: category.id,
        node: (
          <Section
            key={category.id}
            title={tcs(category.title)}
            description={tcs(category.summary)}
          >
            <div className="flex flex-col gap-6">
              {blocks.map((block) => (
                <Card key={block.id} className="gap-0 overflow-hidden p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-4 py-3">
                    <Inline gap="sm" align="center">
                      <Heading size="title" as="h3">
                        {block.title}
                      </Heading>
                      <Badge tone="neutral" size="sm">
                        {block.uses.length} exports
                      </Badge>
                    </Inline>
                    <Text variant="caption" tone="muted" as="p" className="max-w-[52ch]">
                      {tcs(block.summary)}
                    </Text>
                  </div>
                  <div className="bg-surface-canvas px-4 py-6">
                    {block.render(href, tcs)}
                  </div>
                  <div className="flex flex-col gap-2 border-t border-line-subtle px-4 py-3">
                    <Inline gap="xs" wrap>
                      {block.uses.map((symbol) => (
                        <code
                          key={symbol}
                          className="rounded-sm border border-line-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-micro text-fg-secondary"
                        >
                          {symbol}
                        </code>
                      ))}
                    </Inline>
                    <Text variant="caption" tone="muted" as="p">
                      {tcs("You supply")}: {tcs(block.needs)}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        ),
      },
    ];
  });

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Build with it")}
        title="Blocks"
        lead="A Block is one section of a page, assembled from public components. Blocks are source you read and copy, not package exports — so each one names the exports it uses and the data you have to supply."
      />

      {/*
        * Where the personal-site sections went, and why they are not here.
        *
        * Five of them (`personal-hero`, `career-timeline`, `publication-list`,
        * `reading-shelf`, `now`) were a one-line wrapper around a single
        * `experiences/*` component, and `activity-feed` was the same around
        * `Timeline`. A Block is supposed to be *several* primitives working
        * together; a component wearing a Block's name is a component demo, and
        * its page is where it belongs. Nothing was deleted: the components, their
        * pages and the `/experiences/**` galleries that compose them are all
        * still there, and this sentence is the signpost.
        */}
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {tcs(
          "Personal-site sections — a profile hero, a career timeline, publications, a reading shelf, /now — are documented with the components they are made of, and composed end to end in Experiences.",
        )}
      </Text>

      <BlocksGallery
        allLabel={tcs("All")}
        allCount={BLOCKS.length}
        allSummary={tcs("Every Block in the gallery, in reading order.")}
        filterTitle={tcs("Filter")}
        filterDescription={tcs(
          "Blocks are grouped by the kind of page they belong to: marketing, personal, product.",
        )}
        allHref={href("/blocks")}
        categories={BLOCK_CATEGORIES.map((category) => ({
          id: category.id,
          title: tcs(category.title),
          summary: tcs(category.summary),
          count: blocksInCategory(category.id).length,
        }))}
        categoryHrefs={Object.fromEntries(
          BLOCK_CATEGORIES.map((category) => [
            category.id,
            href(`/blocks?category=${category.id}`),
          ]),
        )}
        sections={sections}
      />
    </DocPage>
  );
}
