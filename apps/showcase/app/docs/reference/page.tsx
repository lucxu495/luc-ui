/*
 * The API reference index — DOC-002.
 *
 * This page used to be the whole reference: 217 symbols in one document,
 * measured at 12,787 px with twenty-seven `h3` sections in the rail. The
 * acceptance criteria for `DOC-002` are an index plus per-family pages, an index
 * of at most 400 words, every symbol still reachable and a rail of at most twelve
 * rows per page — so this is the index, and the tables live one page per family
 * under `/docs/reference/<family>`.
 *
 * It is still not a second catalogue: every row is a view of the registry, and
 * the reader's job here is to get to the family they want in one click.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Heading, Stack, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { docGroups, docEntries, entriesInFamily, familiesInGroup } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "API reference — LUC UI",
  description: "Every documented entry, grouped by family, with the exports it documents.",
};

export default async function ReferencePage() {
  const { tcs, tn, href } = await getServerCopy();
  const documented = docEntries.filter((entry) => entry.status !== "reference");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("API reference")}
        lead={tcs(
          "Every documented entry in one place, grouped the way the sidebar groups it. Component names, import paths and export names are identifiers and stay in English.",
        )}
      />

      <Text variant="caption" tone="muted" as="p">
        {tcs("{count} documented entries across {families} families.")
          .replace("{count}", String(documented.length))
          .replace("{families}", String(docGroups.length))}
      </Text>

      {docGroups.map((group) => (
        <Stack gap="md" key={group.id}>
          <Heading size="title" as="h2" id={group.id}>
            {tn(group.title)}
          </Heading>
          <ul className="flex flex-col gap-1">
            {familiesInGroup(group.id).map((family) => {
              const entries = entriesInFamily(family.id);
              if (entries.length === 0) return null;
              return (
                <li key={family.id} className="flex min-h-6 items-center gap-3">
                  {/*
                    * WCAG 2.5.8 asks for a 24×24 px target, and a bare
                    * underlined label in a `gap-1` list is about 18 px tall —
                    * which axe reports as `target-size` on this page and nowhere
                    * else, because everywhere else a link sits inside a padded
                    * row. Both halves of the rule need answering: the link gets
                    * `py-1` (26 px tall, measured) and the row gets `min-h-6` so
                    * the *pitch* between two targets stays above 24 px. Padding
                    * the link alone is not enough — axe measures the spacing
                    * between neighbouring targets as well, and pulling the rows
                    * together with a negative margin made the count go up, 15 to
                    * 18, which is how the second half was found.
                    */}
                  <Link
                    href={href(`/docs/reference/${family.id}`)}
                    className="luc-focus rounded-sm py-1 text-label text-fg-primary underline"
                  >
                    {tn(family.title)}
                  </Link>
                  {/*
                    * The family's sentence belongs on the family's page, which is
                    * one click away and where it is the lead. Printing all 27 here
                    * cost ~270 words on an index whose budget is 400, which is
                    * most of the page spent describing pages rather than listing
                    * them.
                    */}
                  <span className="ml-auto shrink-0 font-mono text-micro text-fg-muted luc-numeric">
                    {entries.length}
                  </span>
                </li>
              );
            })}
          </ul>
        </Stack>
      ))}
    </DocPage>
  );
}
