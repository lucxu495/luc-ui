/*
 * One page per motion primitive.
 *
 * The same generation as `/components/[component]` and `/charts/[chart]`, for
 * the motion group. It is here because the registry already treats a motion
 * entry's canonical URL as `/motion/<id>` — `docRedirects()` in
 * `lib/docs/registry.ts` sends `/motion/kinetic-headline` to `/motion/kinetic`
 * for exactly that reason — and without this route 29 documented motion
 * primitives had no page at all.
 *
 * Entries that were documented before Phase 9 keep their handwritten page:
 * `kinetic`, `reveal`, `shimmer`, `spotlight`, `border-glow` and
 * `number-ticker` are real directories under `app/motion/`, and Next resolves a
 * static segment before this dynamic one. The six motion families are
 * introduced by `/motion` and by those pages, so this route only ever serves an
 * entry, never a family.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoExamples } from "@/components/docs/demo-examples";
import { DemoStage } from "@/components/docs/demo-stage";
import { DocEntryPage } from "@/components/doc-pages/entry-page";
import { motionDemoFor } from "@/lib/demo/registry.motion";
import { docEntries } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

const motionSlugs = docEntries
  .filter(
    (entry) =>
      entry.group === "motion" &&
      entry.status !== "reference" &&
      entry.pageFile === undefined &&
      entry.route === `/motion/${entry.id}`,
  )
  .map((entry) => entry.id);

export const dynamicParams = false;

export function generateStaticParams() {
  return motionSlugs.map((motion) => ({ motion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ motion: string }>;
}): Promise<Metadata> {
  const { motion } = await params;
  const entry = docEntries.find((candidate) => candidate.route === `/motion/${motion}`);
  return entry ? { title: `${entry.title} — LUC UI`, description: entry.summary } : {};
}

export default async function MotionPage({ params }: { params: Promise<{ motion: string }> }) {
  const { motion } = await params;
  const entry = docEntries.find(
    (candidate) => candidate.route === `/motion/${motion}` && candidate.status !== "reference",
  );
  if (entry) {
    const { tcs } = await getServerCopy();
    const demo = motionDemoFor(entry.id);
    /*
     * MOT-002: the other configurations of the same primitive, each with its own
     * preview and code. Only the entries whose author declared them get a section
     * — an empty "Variants" heading on the other twenty-nine pages would be the
     * decoration the design spec forbids.
     */
    const examples = demo?.examples?.length ? (
      <DemoExamples
        examples={demo.examples}
        title={tcs("Other configurations")}
        description={tcs(
          "The same primitive, arranged differently. Each snippet is printed from the props its preview above was rendered with.",
        )}
      />
    ) : undefined;
    return (
      <DocEntryPage
        entry={entry}
        {...(demo ? { demo: <DemoStage spec={demo} /> } : {})}
        {...(examples ? { examples } : {})}
      />
    );
  }
  return notFound();
}
