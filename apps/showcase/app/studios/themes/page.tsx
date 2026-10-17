/*
 * Theme Studio.
 *
 * The theming guide explains the four attributes; the Studio lets a reader try
 * them and copy the line. It adds no token of its own.
 */

import type { Metadata } from "next";
import { DocPage } from "@/components/docs/doc-page";
import { CollectionReturn } from "@/components/docs/collection-return";
import { PageHeader } from "@/components/docs/page-header";
import { ThemeStudio } from "@/components/studios/theme-studio";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Theme Studio — Luc UI",
  description: "Four attributes, a live preview and the exact line to copy.",
};

export default async function ThemeStudioPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Studios")}
        title={tcs("Theme Studio")}
        lead={tcs(
          "Pick a palette, a type voice, a personality and a depth, watch the same components change, and copy the single line that produced it.",
        )}
        actions={<CollectionReturn to="/blocks" label="Build" />}
      />

      <ThemeStudio />
    </DocPage>
  );
}
