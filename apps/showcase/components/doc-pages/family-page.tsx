/*
 * The landing page for one documentation family.
 *
 * A family is the sidebar's middle level: `Actions` for Button and Toggle,
 * `Statistical` for the statistical charts. The families that were documented
 * before Phase 9 have a handwritten overview page and keep it — this page is
 * for the families that have none, and it does the one job such a page should:
 * it lists what is in the family, says which entries are reviewed and which are
 * generated from the public API, and gets out of the way.
 *
 * It is a view of the registry rather than a second catalogue, so a component
 * that is added to a family appears here because it exists.
 */

import { Card, Heading, Inline, Stack, Text } from "@luc/ui";
import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { StatusBadge } from "@/components/docs/doc-entry";
import { accessibilityCopy } from "./copy";
import type { DocEntry, DocFamily } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

const GROUP_TITLE: Record<string, string> = {
  components: "Components",
  charts: "Charts",
  motion: "Motion",
  integrations: "Integrations",
};

export interface DocFamilyPageProps {
  family: DocFamily;
  /** The family's entries, in reading order, resolved by the caller. */
  entries: readonly DocEntry[];
}

/**
 * The family's members, as cards.
 *
 * Extracted so the families that have a *handwritten* overview page — Feedback
 * is one — can list their members the same way this page does instead of
 * writing a second list. The difference between the two kinds of family page is
 * the prose in the middle, not the index at the bottom.
 */
export async function FamilyEntryList({ entries }: { entries: readonly DocEntry[] }) {
  const { tcs, href } = await getServerCopy();
  return (
    <Stack gap="md">
      {entries.map((entry) => (
        <Card key={entry.id} className="gap-2 p-4">
          <Inline gap="sm" align="center" justify="between" wrap>
            <Link
              href={href(entry.route)}
              className="text-title font-medium text-fg-primary luc-focus rounded-sm"
            >
              {entry.title}
            </Link>
            <StatusBadge status={entry.status} tcs={tcs} />
          </Inline>
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(entry.summary)}
          </Text>
          <code className="font-mono text-caption text-fg-subtle">{entry.importPath}</code>
        </Card>
      ))}
    </Stack>
  );
}

export async function DocFamilyPage({ family, entries }: DocFamilyPageProps) {
  const { tcs, tn, href } = await getServerCopy();
  /* Group and family titles come from the registry as English labels, and the
   * navigation dictionary already carries a rendering for every one of them —
   * the same lookup the sidebar performs, so a heading cannot read differently
   * in the sidebar and on the page. */
  const groupTitle = tn(GROUP_TITLE[family.group] ?? family.group);

  return (
    <DocPage>
      <header className="flex flex-col gap-3">
        <span className="text-micro tracking-[0.14em] text-fg-muted uppercase">
          {groupTitle}
        </span>
        <Heading size="display" as="h1" id="overview">
          {tn(family.title)}
        </Heading>
        <Text variant="body-lg" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(family.summary)}
        </Text>
        <Text variant="caption" tone="muted" as="p">
          {tcs("{count} documented entries in this family.").replace(
            "{count}",
            String(entries.length),
          )}
        </Text>
      </header>

      {family.landing ? (
        <Card className="gap-2 p-4">
          <Heading size="title" as="h2">
            {tcs("Overview and live examples")}
          </Heading>
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(
              "This family already has a hand-reviewed overview that renders the pieces together with example data.",
            )}
          </Text>
          <Link className="text-caption text-fg-accent underline" href={href(family.landing)}>
            {tcs("Open the overview")}
          </Link>
        </Card>
      ) : null}

      <FamilyEntryList entries={entries} />

      {/*
        * What accessibility means for this family — said once, here.
        *
        * It used to be printed on each member page, which made the same 46 words
        * the largest block of identical copy in the catalogue: eight Actions
        * pages, eleven form pages, six overlay pages, all saying it. Components
        * V2 §5 asks a *detail* page for a note that is specific to the component,
        * and the per-entry note lives in `curation/notes.ts`. The statement about
        * the family's primitives belongs where the family is introduced.
        */}
      <Card className="gap-2 p-4">
        <Heading size="title" as="h2" id="accessibility">
          {tcs("Accessibility")}
        </Heading>
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {accessibilityCopy(family.id, tcs)}
        </Text>
      </Card>
    </DocPage>
  );
}
