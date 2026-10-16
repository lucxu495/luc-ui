/*
 * One page per documented component (or per component family).
 *
 * The Showcase used to document components by topic — `/components/inputs`
 * covered six of them — which is fine for a gallery and useless for a reference:
 * a developer looking for `Rating` should be able to open `/components/rating`
 * and read about Rating. There are 200-odd components, so the page is generated
 * from the documentation registry rather than written by hand; the registry is
 * itself generated from the real package exports.
 *
 * Two kinds of URL resolve here, in this order:
 *
 *  1. an entry whose canonical URL is `/components/<id>` (a curated page at a
 *     different path is served by its own static route, and the id URL 301s to
 *     it — see `next.config.ts`);
 *  2. a family, for the families that have no handwritten overview page.
 *
 * A static directory always wins over this dynamic route in Next's resolution
 * order, which is what keeps the hand-written pages canonical: `/components/ai`
 * is a real page, so the route here never sees that slug.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocEntryPage } from "@/components/doc-pages/entry-page";
import { DocFamilyPage } from "@/components/doc-pages/family-page";
import { DemoExamples } from "@/components/docs/demo-examples";
import { Example } from "@/components/docs/example";
import { componentDemoFor } from "@/lib/demo/registry";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { localizeSpecimen } from "@/lib/i18n/specimen";
import { getServerCopy } from "@/lib/i18n/server";
import {
  docEntries,
  entriesInFamily,
  familiesInGroup,
} from "@/lib/docs/registry";

/*
 * Every slug this route can serve, resolved at build time.
 *
 * `dynamicParams = false` makes the list authoritative: a URL that is not in it
 * is a 404 rather than a page rendered from an unknown parameter, which is the
 * honest behaviour for a documentation site whose contents are known.
 */
const componentSlugs = docEntries
  .filter(
    (entry) =>
      entry.group === "components" &&
      entry.status !== "reference" &&
      entry.pageFile === undefined &&
      entry.route === `/components/${entry.id}`,
  )
  .map((entry) => entry.id);

const familySlugs = familiesInGroup("components").map((family) => family.id);

export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set([...componentSlugs, ...familySlugs])].map((component) => ({ component }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ component: string }>;
}): Promise<Metadata> {
  const { component } = await params;
  const entry = docEntries.find((candidate) => candidate.route === `/components/${component}`);
  if (entry) {
    return { title: `${entry.title} — LUC UI`, description: entry.summary };
  }
  const family = familiesInGroup("components").find((candidate) => candidate.id === component);
  if (family) {
    return { title: `${family.title} — LUC UI`, description: family.summary };
  }
  return {};
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ component: string }>;
}) {
  const { component } = await params;

  const entry = docEntries.find(
    (candidate) =>
      candidate.route === `/components/${component}` && candidate.status !== "reference",
  );
  if (entry) {
    const demo = componentDemoFor(entry.id);
    /*
     * The two halves of the canonical Examples section.
     *
     * The first half is the page's own specimen, now framed as an `<Example>`:
     * a titled capability with its source behind a disclosure, exactly like the
     * configurations beneath it. It used to be a `Demo` under an `h2` reading
     * "Live preview", which made the page's own specimen a different kind of
     * object from its variants and put the code in the reading path on every
     * component page.
     *
     * The second half is the author's declared configurations — "Variants",
     * "Three sizes" — folded into the same section (`heading={false}`) rather
     * than repeated under a second heading called "Other configurations", which
     * named the same idea twice and made a page of eight examples read as two
     * lists. Only an entry whose author declared examples gets this half.
     */
    const { tcs } = await getServerCopy();
    const notes = ENTRY_NOTES[entry.id];
    const specimen = demo ? (
      <Example
        title={tcs(demo.title ?? "Default")}
        {...(demo.note === undefined ? {} : { description: demo.note })}
        code={demo.code}
        layout={demo.layout ?? "inline"}
        {...(demo.bare ? { padding: "none" as const } : {})}
        {...(demo.height === undefined ? {} : { stageClassName: `min-h-[${demo.height}px]` })}
      >
        {/*
          * The page's own specimen, translated. Its `node` is a server-created
          * element tree, so the `Example` frame cannot reach the strings inside
          * it — see `lib/i18n/specimen.tsx` for the rule and for what is
          * deliberately left in English (code, identifiers, behaviour).
          */}
        {localizeSpecimen(demo.node, tcs)}
      </Example>
    ) : undefined;
    const examples = demo?.examples?.length ? (
      <DemoExamples
        examples={demo.examples}
        frame="example"
        heading={false}
        title={tcs("Other configurations")}
        /* The same sentence Motion uses for the same section: one idea, one
         * dictionary entry, so the two pages cannot drift apart. */
        description={tcs(
          "The same primitive, arranged differently. Each snippet is printed from the props its preview above was rendered with.",
        )}
      />
    ) : undefined;
    return (
      <DocEntryPage
        entry={entry}
        {...(specimen ? { demo: specimen } : {})}
        {...(examples ? { examples } : {})}
        {...(notes?.usage ? { usage: notes.usage } : {})}
        {...(notes?.api?.note ? { apiNote: notes.api.note } : {})}
        {...(notes?.guidance ? { guidance: notes.guidance } : {})}
        {...(notes?.accessibility?.detail
          ? { accessibilityDetail: notes.accessibility.detail }
          : {})}
      />
    );
  }

  const family = familiesInGroup("components").find((candidate) => candidate.id === component);
  if (family) {
    return <DocFamilyPage family={family} entries={entriesInFamily(family.id)} />;
  }

  return notFound();
}
