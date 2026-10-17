/*
 * Template Composer.
 *
 * Not a site builder: it arranges the Blocks the gallery already documents, and
 * it says so. The outline it copies is a plan for a page, because the library
 * ships components rather than pages.
 */

import type { Metadata } from "next";
import { DocPage } from "@/components/docs/doc-page";
import { CollectionReturn } from "@/components/docs/collection-return";
import { PageHeader } from "@/components/docs/page-header";
import { ComposerStudio } from "@/components/studios/composer-studio";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Template Composer — Luc UI",
  description: "Arrange real Blocks into a page plan and copy the arrangement.",
};

export default async function ComposerStudioPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Studios")}
        title={tcs("Template Composer")}
        lead={tcs(
          "Start from an archetype, move and remove Blocks, and copy the arrangement. Every Block is one the gallery documents — this composes pages, it does not invent them.",
        )}
        actions={<CollectionReturn to="/blocks" label="Build" />}
      />

      <ComposerStudio />
    </DocPage>
  );
}
