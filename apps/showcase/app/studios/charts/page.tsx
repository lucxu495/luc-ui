/*
 * Chart Studio.
 *
 * A Studio is the Showcase's answer to "what does this do with my data?" — so
 * the page is mostly the island beside it. The prose states the limits: two
 * families are editable today, the chart computes nothing, and a unit is
 * declared rather than guessed.
 */

import type { Metadata } from "next";
import { DocPage } from "@/components/docs/doc-page";
import { CollectionReturn } from "@/components/docs/collection-return";
import { PageHeader } from "@/components/docs/page-header";
import { ChartStudio } from "@/components/studios/chart-studio";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Chart Studio — Luc UI",
  description: "Draw your own data through a real chart, then copy the code that drew it.",
};

export default async function ChartStudioPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Studios")}
        title={tcs("Chart Studio")}
        lead={tcs(
          "Draw your own data through a real chart and take the code away. The preview and the snippet are built from the same state, so what you see is what you copy.",
        )}
        actions={<CollectionReturn to="/blocks" label="Build" />}
      />

      <ChartStudio />
    </DocPage>
  );
}
