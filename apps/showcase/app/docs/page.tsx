/*
 * The documentation index.
 *
 * The first thing a developer needs is not a component — it is a way to find
 * one, and an honest statement of how complete the documentation is. So this
 * page carries the search field, the section map, and the counts read from the
 * registry itself: a number on this page cannot be larger than the number of
 * pages that exist.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Card, Heading, Inline, Stack, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DocSearch } from "@/components/docs/doc-search";
import { docGroups, familiesInGroup, registryStats } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Get started — Luc UI",
  description:
    "What Luc UI is, how to find the component you need, and how the documentation states its own coverage.",
};

const START_HERE = [
  { href: "/docs/installation", key: "Installation" },
  { href: "/docs/theming", key: "Theming" },
  { href: "/docs/reference", key: "API reference" },
];

export default async function DocsIndexPage() {
  const { tcs, tn, href } = await getServerCopy();
  const groups = docGroups.map((group) => ({
    ...group,
    title: tn(group.title),
    families: familiesInGroup(group.id),
  }));
  const totals = registryStats;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("Get started")}
        lead={tcs(
          "Luc UI is a React and TypeScript design system: tokens, accessible primitives, spatial motion, data display and charts, documented one component at a time.",
        )}
      />

      <DocSearch />

      <Stack gap="md">
        <Heading size="title" as="h2" id="start-here">
          {tcs("Start here")}
        </Heading>
        <Inline gap="sm" wrap>
          {START_HERE.map((item) => (
            <Link
              key={item.href}
              href={href(item.href)}
              className="rounded-lg border border-line-subtle px-3 py-2 text-label text-fg-primary luc-transition hover:border-line-strong"
            >
              {tcs(item.key)}
            </Link>
          ))}
        </Inline>
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="sections">
          {tcs("The four documentation surfaces")}
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="gap-2 p-4">
              <Inline justify="between" align="center" wrap gap="sm">
                <Link href={href(group.route)} className="text-title font-medium text-fg-primary">
                  {group.title}
                </Link>
                <Text variant="caption" tone="muted" as="p">
                  {tcs("{count} entries").replace("{count}", String(group.families.length))}
                </Text>
              </Inline>
              <Text variant="caption" tone="muted" as="p">
                {tcs(group.summary)}
              </Text>
            </Card>
          ))}
        </div>
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="coverage">
          {tcs("How complete this is")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Every page states what it is. A reviewed page was written and read by a person; a generated page is assembled from the package's real exports, signatures and props; an entry that only exists as part of a module is listed on its family page instead of pretending to be its own page.",
          )}
        </Text>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Documented entries by coverage</caption>
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Coverage")}
                </th>
                <th scope="col" className="py-2 text-micro font-medium text-fg-muted uppercase">
                  {tcs("Entries")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [tcs("Reviewed page"), totals.byStatus.curated],
                [tcs("Generated from the public API"), totals.byStatus.generated],
                [tcs("Listed on a family page"), totals.byStatus.reference],
              ].map(([label, count]) => (
                <tr key={String(label)} className="border-b border-line-subtle/60">
                  <td className="py-2 pr-4 text-body text-fg-secondary">{label}</td>
                  <td className="py-2 font-mono text-caption text-fg-primary">{String(count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("{families} families, {entries} documented entries.")
            .replace("{families}", String(totals.families))
            .replace("{entries}", String(totals.entries))}
        </Text>
      </Stack>
    </DocPage>
  );
}
