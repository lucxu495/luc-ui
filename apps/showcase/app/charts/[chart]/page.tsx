/*
 * One page per chart.
 *
 * The same generation as `/components/[component]`, for the 76 charts. They
 * matter more than the component pages in one respect: a chart is a scientific
 * claim, and a page per chart is what lets a reader see the props, the units the
 * library expects and the caveats of *that* chart instead of hunting for it in a
 * page that renders twelve of them side by side.
 *
 * The chart families already have handwritten overview pages
 * (`/charts/statistical`, `/charts/financial`, …) which render live examples;
 * those pages keep their URLs and the entry pages link to them.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoStage } from "@/components/docs/demo-stage";
import { ChartPlayground } from "@/components/playground/chart-boundary";
import { DocEntryPage } from "@/components/doc-pages/entry-page";
import { chartDemoFor } from "@/lib/demo/registry.charts";
import { docEntries } from "@/lib/docs/registry";

const chartSlugs = docEntries
  .filter(
    (entry) =>
      entry.group === "charts" &&
      entry.status !== "reference" &&
      entry.pageFile === undefined &&
      entry.route === `/charts/${entry.id}`,
  )
  .map((entry) => entry.id);

export const dynamicParams = false;

export function generateStaticParams() {
  return chartSlugs.map((chart) => ({ chart }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chart: string }>;
}): Promise<Metadata> {
  const { chart } = await params;
  const entry = docEntries.find((candidate) => candidate.route === `/charts/${chart}`);
  return entry ? { title: `${entry.title} — LUC UI`, description: entry.summary } : {};
}

export default async function ChartPage({ params }: { params: Promise<{ chart: string }> }) {
  const { chart } = await params;
  const entry = docEntries.find(
    (candidate) => candidate.route === `/charts/${chart}` && candidate.status !== "reference",
  );
  if (entry) {
    const demo = chartDemoFor(entry.id);
    return (
      <DocEntryPage
        entry={entry}
        {...(demo ? { demo: <DemoStage spec={demo} /> } : {})}
        /* Charts mount the chart boundary, so the engine is loaded by chart
         * routes only. */
        playground={<ChartPlayground entry={entry} />}
      />
    );
  }
  return notFound();
}
