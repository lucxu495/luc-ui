/*
 * One family of the API reference — DOC-002's second half.
 *
 * The reference used to be a single document; measured, it was 12,787 px with
 * twenty-seven `h3` sections in the rail, and the acceptance criteria ask for an
 * index plus per-family pages with a rail of at most twelve rows. So each family
 * gets a page: its own exports table, no nested headings, and one way back.
 *
 * The table is the same projection the index used to print — entry, import path,
 * exports, with a link on the entries that have a page of their own. Nothing was
 * dropped in the split, which is the criterion that makes it safe: 217 symbols
 * across 27 families, all still reachable, and `qa/route-health.mjs` walks the
 * generated routes to prove it.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading, Stack, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { docFamilies, entriesInFamily, familiesInGroup, docGroups } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

interface FamilyPageProps {
  params: Promise<{ family: string }>;
}

/** Every family that documents at least one entry. */
function documentedFamilyIds(): string[] {
  return docGroups
    .flatMap((group) => familiesInGroup(group.id))
    .filter((family) => entriesInFamily(family.id).length > 0)
    .map((family) => family.id);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return documentedFamilyIds().map((family) => ({ family }));
}

export async function generateMetadata({ params }: FamilyPageProps): Promise<Metadata> {
  const { family: familyId } = await params;
  const family = docFamilies.find((candidate) => candidate.id === familyId);
  return family
    ? { title: `${family.title} — API reference`, description: family.summary }
    : { title: "API reference" };
}

export default async function ReferenceFamilyPage({ params }: FamilyPageProps) {
  const { family: familyId } = await params;
  const family = docFamilies.find((candidate) => candidate.id === familyId);
  const entries = family ? entriesInFamily(family.id) : [];
  if (!family || entries.length === 0) notFound();

  const { tcs, tn, href } = await getServerCopy();
  const group = docGroups.find((candidate) => candidate.id === family.group);

  return (
    <DocPage>
      {/*
        * The lead is `tcs`, not `tn`.
        *
        * A family summary is a sentence, and the navigation dictionary holds
        * *labels* — so `tn` fell back to English here, silently, on all 27
        * reference pages, while both the static coverage number and the
        * navigation-description count read 100%. The family overview pages one
        * level up already translate the same string through `tcs`, so this was
        * two code paths for one sentence and only one of them localized.
        */}
      <PageHeader
        eyebrow={tcs("API reference")}
        title={tn(family.title)}
        lead={tcs(family.summary)}
        actions={
          <Link
            href={href("/docs/reference")}
            className="luc-focus rounded-sm text-caption text-fg-accent underline"
          >
            {tcs("All families")}
          </Link>
        }
      />

      <Text variant="caption" tone="muted" as="p">
        {tcs("{count} documented entries in {family} under {group}.")
          .replace("{count}", String(entries.length))
          .replace("{family}", tn(family.title))
          .replace("{group}", group ? tn(group.title) : "")}
      </Text>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{family.title}</caption>
          <thead>
            <tr className="border-b border-line-subtle">
              <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                {tcs("Entry")}
              </th>
              <th scope="col" className="py-2 pr-4 text-micro font-medium text-fg-muted uppercase">
                {tcs("Import")}
              </th>
              <th scope="col" className="py-2 text-micro font-medium text-fg-muted uppercase">
                {tcs("Exports")}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-line-subtle/60 align-top">
                <td className="py-2.5 pr-4">
                  {entry.status === "reference" ? (
                    <span className="text-caption text-fg-secondary">{entry.title}</span>
                  ) : (
                    <Link
                      href={href(entry.route)}
                      className="text-caption text-fg-primary luc-focus rounded-sm underline"
                    >
                      {entry.title}
                    </Link>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <code className="font-mono text-caption text-fg-muted">{entry.importPath}</code>
                </td>
                <td className="py-2.5">
                  <code className="font-mono text-caption break-words text-fg-secondary">
                    {entry.exports.join(", ")}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Stack gap="sm">
        <Heading size="title" as="h2" id="next">
          {tcs("Other families")}
        </Heading>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {docGroups
            .flatMap((candidate) => familiesInGroup(candidate.id))
            .filter((candidate) => candidate.id !== family.id && entriesInFamily(candidate.id).length > 0)
            .slice(0, 12)
            .map((candidate) => (
              <li key={candidate.id}>
                <Link
                  href={href(`/docs/reference/${candidate.id}`)}
                  className="luc-focus rounded-sm text-caption text-fg-secondary underline"
                >
                  {tn(candidate.title)}
                </Link>
              </li>
            ))}
        </ul>
      </Stack>
    </DocPage>
  );
}
