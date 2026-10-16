/*
 * The page for one documentation entry.
 *
 * Most of the documented components, charts and motions have no handwritten
 * page: they are one row in the registry and nothing else. This component turns
 * that row into a page a developer can use — the real import path, a real
 * example where one can be written honestly, the compiler's own signatures and
 * props — without anybody writing those pages by hand and without a second
 * source of truth to drift from the first.
 *
 * **Two shapes, and one canonical order for components.**
 *
 * `docs/COMPONENTS_V2.md` §5 fixes the order of a component page: title, one
 * sentence, the import, grouped examples, the API, notes only where a reader
 * would otherwise get something wrong, then related navigation. The registry now
 * renders exactly that, and the sections it used to render at the wrong
 * granularity are gone rather than duplicated:
 *
 *   "Live preview"      → the first titled example inside **Examples**
 *   empty "Usage"       → the real import statement plus a minimal call
 *   loose `X props`     → grouped inside the one **API** area (`entry-api.tsx`)
 *   family-wide a11y    → per entry (`curation/notes.ts`), or the family page
 *   generic SSR block   → only where the behaviour is genuinely different
 *
 * Charts and motion keep their own shape — a chart is a plotting surface with
 * documentation attached, not a description of a chart — so the two branches
 * below differ on purpose. What they share is the tail: the family card, the
 * related row and the pager.
 *
 * Two things it deliberately does not do:
 *
 *  - invent an example. The fallback specimen in `examples.tsx` is the honest
 *    one; an entry with neither says so.
 *  - invent a fact about the library. The chart engine comes from the verified
 *    chart catalogue, the accessibility and rendering paragraphs are stated per
 *    entry, per family or per group, and where nothing specific and true can be
 *    said the page says nothing rather than something generic.
 *
 * It is a server component: a documentation page is text, and the only
 * interactive parts of it (the Playground, the copy buttons, the disclosure, the
 * outline) are client islands that already exist. Keeping the page on the server
 * also keeps the API tables — hundreds of kilobytes of compiler output — out of
 * the browser bundle.
 */

import {
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Heading,
  Inline,
  Stack,
  Text,
  buttonVariants,
} from "@luc/ui";
import { RiArrowDownSLine } from "@remixicon/react";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { Demo } from "@/components/docs/demo";
import { DocPage } from "@/components/docs/doc-page";
import {
  DocEntryHeader,
  ExportsTable,
  PrevNextNav,
  PropsTable,
  RelatedEntries,
} from "@/components/docs/doc-entry";
import { ImportLine } from "@/components/docs/family-imports";
import { GuidanceCards } from "@/components/docs/guidance";
import { Playground } from "@/components/playground/boundary";
import { apiFor, entriesInFamily, familyOf, type DocEntry } from "@/lib/docs/registry";
import { importLine } from "@/lib/docs/install";
import { getServerCopy } from "@/lib/i18n/server";
import { EntryApiSection } from "@/components/docs/entry-api";
import { ENGINE_FRAGMENT, chartEngineFor } from "./chart-engine";
import {
  accessibilityCopy,
  chartAccessibilityCopy,
  chartContractCopy,
  noExampleCopy,
  renderingCopy,
} from "./copy";
import { exampleFor } from "./examples";
import { entryLead } from "@/lib/docs/lead";
import { localizeSpecimen } from "@/lib/i18n/specimen";
import type { ReactNode } from "react";

/**
 * How many related pages the footer shows, and therefore when the family card is
 * redundant.
 *
 * `RelatedEntries` fills up to four links, and the curated `RELATED_ENTRIES` rows
 * are validated to stay inside the family — so a family of five or fewer entries
 * is *named in full* by the Related row directly below the card. For those pages
 * the card repeated the same list, one line higher; for a single-entry family it
 * was worse than that, because `Open the family index` pointed at the page the
 * reader was already on (`/components/typography` linked to
 * `/components/typography`).
 *
 * The card's remaining job is real but narrower: on a large family it is the only
 * place that says how many entries there are and where the index is. So it is
 * rendered exactly when the Related row cannot name the whole family, which is the
 * Navigation review's "no repeated Related / no duplicate family block" rule
 * applied at the one place that can enforce it.
 */
const RELATED_LIMIT = 4;

/**
 * A secondary section, folded behind its own heading.
 *
 * The heading is the trigger, so the outline a reader sees in the rail is
 * unchanged; `id` and `as="h2"` keep the anchors and the level. Radix owns
 * `aria-expanded`, the keyboard contract and the panel's state attribute.
 */
function AdvancedSection({
  id,
  title,
  summary,
  children,
}: {
  id: string;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <Collapsible className="flex flex-col gap-1.5">
      {/*
        * The heading keeps its id and its level; the *button* inside it is the
        * disclosure.
        *
        * The first version made the `<h2>` itself the trigger — `role="button"`,
        * `tabindex=0`, `aria-expanded` — which is valid ARIA and looked right, and
        * which a keyboard could not operate: Enter and Space are the browser's
        * behaviour for a real `<button>`, and an `h2` styled as one does not
        * inherit it. Radix's trigger does not add a key handler, so the panel
        * opened by pointer only. Measured, then fixed: a real button inside the
        * heading has the browser's behaviour for free.
        */}
      <h2 id={id} className="text-title text-fg-primary">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="luc-focus group/advanced flex w-full cursor-pointer items-center gap-2 rounded-sm text-left luc-transition hover:text-fg-accent"
          >
            {title}
            <RiArrowDownSLine
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-muted luc-transition group-data-[state=closed]/advanced:-rotate-90"
            />
          </button>
        </CollapsibleTrigger>
      </h2>
      {/* Visible while the section is closed: a fold with no hint of what is
       * behind it is a mystery, and a reader who does not open it should still
       * know what they skipped. */}
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {summary}
      </Text>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** The curated Usage body for one entry. */
export interface EntryUsage {
  /** Symbols the minimal call needs. Defaults to the page's own component. */
  imports?: readonly string[];
  /** The minimal call, printed as code. */
  code?: string;
  /** One line about what the call needs, when it needs something. */
  note?: string;
  /** Accessible name for the snippet's copy control. */
  copyLabel?: string;
}

export interface DocEntryPageProps {
  entry: DocEntry;
  /**
   * The Playground for this entry, when the route supplies a specialised one.
   *
   * A chart page passes `<ChartPlayground>`, whose adapter registry pulls a
   * rendering engine. Passing it as a node rather than importing it here is what
   * keeps ECharts out of the *component* routes' bundles: this module is shared
   * by both route trees, so an import here would be an import everywhere.
   */
  playground?: ReactNode;
  /**
   * The Live Demo for this entry, resolved by the route that owns the group.
   *
   * Same reason as `playground`: each route imports its own demo registry, so a
   * chart page is the only page that carries the charting surface, and the
   * component registry never reaches a chart route. On a component page the node
   * is already an `<Example>` — a titled capability with its source behind a
   * disclosure — because the route is where the demo spec lives.
   */
  demo?: ReactNode;
  /**
   * The other configurations of this entry's specimen, already staged.
   *
   * Same contract as `demo` and `playground`: the route that owns the group
   * resolves the specs, so this module never imports a registry.
   */
  examples?: ReactNode;
  /**
   * The canonical import and the minimal call — the Usage section's body.
   *
   * A component entry always gets one: the import statement alone is a real
   * answer, and the curated minimal call (when there is one) is what makes the
   * section worth reading rather than a repetition of the examples above.
   */
  usage?: EntryUsage;
  /** One sentence about the module's surface, printed above the API tables. */
  apiNote?: string;
  /** Curated component-specific advice, rendered under Guidelines. */
  guidance?: { use?: readonly string[]; avoid?: readonly string[] };
  /** A statement that is true of this component rather than of its family. */
  accessibilityDetail?: string;
}

export async function DocEntryPage({
  entry,
  playground,
  demo,
  examples,
  usage,
  apiNote,
  guidance,
  accessibilityDetail,
}: DocEntryPageProps) {
  const { tcs, tn, href } = await getServerCopy();
  const family = familyOf(entry);
  const symbols = apiFor(entry.id);
  /* Only the symbols whose props the compiler read get a table; a constant or a
   * type alias would otherwise get an empty one. */
  const propTables = symbols.filter((symbol) => (symbol.props?.length ?? 0) > 0);
  const siblings = family
    ? entriesInFamily(family.id).filter((item) => item.id !== entry.id)
    : [];
  const isChart = entry.group === "charts";
  const isComponent = entry.group === "components";
  const engine = isChart ? chartEngineFor(entry.exports) : undefined;
  /*
   * A page shows a specimen once. An entry that has a Live Demo uses it; the
   * hand-written specimen in `examples.tsx` remains the fallback for the
   * entries no demo covers yet, so nothing regresses while coverage grows.
   *
   * An example may need the localizer: its `code` stays copyable and plain,
   * while the anchor it renders has to be a Chinese URL on a Chinese page.
   */
  const fallback = isComponent ? undefined : exampleFor(entry.id);
  const fallbackNode =
    fallback === undefined
      ? undefined
      : typeof fallback.node === "function"
        ? fallback.node(href)
        : fallback.node;
  const specimen =
    demo ??
    (fallback ? (
      <Demo code={fallback.code}>{localizeSpecimen(fallbackNode, tcs)}</Demo>
    ) : undefined);
  /*
   * The Usage section's import statement.
   *
   * Derived from the registry's own import path and the export that names this
   * page, so it cannot describe a different module than the title does — and a
   * curated `imports` list extends it when the minimal call needs more than one
   * symbol (a group and its item, a toggle and its group).
   */
  const primaryExport =
    entry.exports.find((name) => name === entry.title) ??
    entry.exports.find((name) => /^[A-Z]/.test(name)) ??
    entry.exports[0] ??
    entry.title;
  const usageImportLine = importLine(entry.importPath, usage?.imports ?? [primaryExport]);
  /*
   * A chart page is a plotting surface with documentation attached, not a
   * description of a chart. It asks for the widest measure the shell can give;
   * every other entry stays on the documentation measure, where a props table
   * and a live specimen share the column comfortably.
   */
  const intent = isChart || entry.group === "motion" ? "wide" : "docs";
  /*
   * The server/hydration statement, where there is a specific one.
   *
   * Keyed by *family* for components, because that is the granularity at which
   * the answer differs — an overlay mounts after hydration and a Button does not
   * — and by group for charts and motion, which have one answer each. `null`
   * means the honest answer is nothing at all, and nothing is what gets rendered
   * (Components V2 §5, and the no-empty-headings rule).
   */
  const renderingKind = isComponent && family ? family.id : entry.group;
  const rendering = renderingCopy(renderingKind, tcs);

  return (
    <DocPage intent={intent}>
      <DocEntryHeader entry={entry} lead={entryLead(entry, tcs)} tcs={tcs} />

      {isComponent ? (
        <>
          {/* ------------------------------------------------------- examples */}
          <section className="flex flex-col gap-4">
            <Heading size="title" as="h2" id="examples">
              {tcs("Examples")}
            </Heading>
            {specimen ?? (
              <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                {noExampleCopy(tcs)}
              </Text>
            )}
            {examples}
          </section>

          {/* ---------------------------------------------------------- usage */}
          <section className="flex flex-col gap-3">
            <Heading size="title" as="h2" id="usage">
              {tcs("Usage")}
            </Heading>
            <ImportLine line={usageImportLine} />
            {usage?.code ? (
              <CodeBlock code={usage.code} label={usage.copyLabel ?? tcs("Copy the minimal call")} />
            ) : null}
            {usage?.note ? (
              <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
                {tcs(usage.note)}
              </Text>
            ) : null}
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
              {tcs("Package setup — peer requirements, the stylesheet and the provider — is on")}{" "}
              <Link className="luc-focus text-fg-accent underline" href={href("/docs/installation")}>
                {tcs("installation")}
              </Link>
              .
            </Text>
          </section>

          {/* ------------------------------------------------------------ api */}
          <EntryApiSection entryId={entry.id} {...(apiNote ? { note: apiNote } : {})} />

          {/* ----------------------------------------------------- guidelines */}
          {accessibilityDetail || guidance?.use?.length || guidance?.avoid?.length ? (
            <section className="flex flex-col gap-4">
              <Heading size="title" as="h2" id="guidelines">
                {tcs("Guidelines")}
              </Heading>
              {guidance?.use?.length || guidance?.avoid?.length ? (
                <GuidanceCards use={guidance?.use ?? []} avoid={guidance?.avoid ?? []} tcs={tcs} />
              ) : null}
              {accessibilityDetail ? (
                <Stack gap="xs">
                  <Heading size="title" as="h3">
                    {tcs("Accessibility")}
                  </Heading>
                  <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                    {tcs(accessibilityDetail)}
                  </Text>
                </Stack>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <>
          {demo ? (
            <section className="flex flex-col gap-3">
              <Heading size="title" as="h2" id="preview">
                {tcs("Live preview")}
              </Heading>
              {demo}
            </section>
          ) : null}

          {examples}

          {/*
            * The playground, where a control panel is the right instrument.
            *
            * Components V2 (`docs/COMPONENTS_V2.md` §5) drops the mandatory
            * playground from an ordinary component page: a Button or a Badge is
            * *demonstrated* by examples. What remains is the case where
            * manipulating configuration has an observable result — a chart,
            * whose props change the plotted marks.
            */}
          {isChart ? (playground ?? <Playground entry={entry} contract={family?.summary} />) : null}

          {isChart || specimen ? (
            <section className="flex flex-col gap-4">
              <Heading size="title" as="h2" id="usage">
                {tcs("Usage")}
              </Heading>

              {isChart ? (
                <Stack gap="sm">
                  <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                    {chartContractCopy(tcs)}
                  </Text>
                  {engine ? (
                    <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                      {tcs("It is drawn by {engine}.").replace(
                        "{engine}",
                        tcs(ENGINE_FRAGMENT[engine]),
                      )}
                    </Text>
                  ) : null}
                  {family?.landing ? (
                    <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
                      {tcs("Worked examples with real data are on the family overview:")}{" "}
                      <Link className="text-fg-accent underline" href={href(family.landing)}>
                        {tn(family.title)}
                      </Link>
                    </Text>
                  ) : null}
                </Stack>
              ) : null}

              {/* The specimen is only repeated here when the page has no Live
               * Demo section above it — that is, when the fallback example is
               * all the page can honestly show. */}
              {!demo && specimen ? specimen : null}
              {!demo && !specimen ? (
                <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
                  {noExampleCopy(tcs)}
                </Text>
              ) : null}
            </section>
          ) : null}

          {/*
            * No installation block on an entry page (Components V2 §5).
            *
            * The header already prints this entry's import path with a copy
            * button, and the package setup — managers, peer requirements, the
            * stylesheet, the provider — is one page, `/docs/installation`.
            * Repeating four commands and three steps on every entry page was the
            * single biggest block of copy on the site.
            */}

          <section className="flex flex-col gap-4">
            <Heading size="title" as="h2" id={isChart ? "configuration" : "api"}>
              {isChart ? tcs("Configuration") : tcs("API")}
            </Heading>
            <ExportsTable entry={entry} tcs={tcs} />
          </section>

          {propTables.map((symbol) => (
            <PropsTable key={symbol.name} symbol={symbol} tcs={tcs} />
          ))}

          <section className="flex flex-col gap-3">
            <Heading size="title" as="h2" id="accessibility">
              {tcs("Accessibility")}
            </Heading>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {isChart ? chartAccessibilityCopy(tcs) : accessibilityCopy(entry.family, tcs)}
            </Text>
          </section>
        </>
      )}

      {/*
        * DOC-003 — the section a reader rarely needs before they have used the
        * component, folded. It renders only where the answer is specific to the
        * surface: a chart that measures its container, a motion primitive that
        * attaches after hydration, an overlay that does not exist in the server
        * output. A Button has nothing to add, and the identical paragraph that
        * used to sit on every component page was the largest block of duplicated
        * copy on the site.
        */}
      {rendering ? (
        <AdvancedSection
          id="rendering"
          title={tcs("SSR and rendering")}
          summary={tcs("What happens on the server, and when hydration changes it.")}
        >
          <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
            {rendering}
          </Text>
        </AdvancedSection>
      ) : null}

      {/*
        * The family card earns its place only when the Related row below it cannot
        * name the family — see `RELATED_LIMIT`. A chart or motion page keeps it
        * whenever it has siblings at all, because those routes generate entry
        * slugs only (there is no `/charts/chart-statistical`), so the card's
        * sibling links are the family index for them.
        */}
      {family && (isComponent ? siblings.length > RELATED_LIMIT : siblings.length > 0) ? (
        <Card className="gap-2 p-4">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Family")}
          </Text>
          <Inline gap="sm" align="center" wrap>
            <Text variant="body" as="p">
              {tn(family.title)}
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs(family.summary)}
            </Text>
          </Inline>
          {/*
           * Where the whole family is listed.
           *
           * A component family has an index page of its own (`/components/actions`
           * — `familiesInGroup("components")` is part of the dynamic route's
           * slugs), so the card can say how many there are and point at it
           * instead of repeating the sidebar with a button per sibling; the
           * Related row below already carries the two to four that matter. The
           * chart and motion routes generate entry slugs only — there is no
           * `/charts/chart-statistical` — so those pages keep the sibling links
           * they have always had rather than gaining a link to a 404.
           */}
          {isComponent ? (
            <Text variant="caption" tone="muted" as="p">
              {tcs("{count} documented entries in this family.").replace(
                "{count}",
                String(siblings.length + 1),
              )}{" "}
              <Link
                className="luc-focus text-fg-accent underline"
                href={href(`/components/${family.id}`)}
              >
                {tcs("Open the family index")}
              </Link>
            </Text>
          ) : siblings.length > 0 ? (
            <Inline gap="sm" wrap>
              {siblings.map((item) => (
                <Link
                  key={item.id}
                  href={href(item.route)}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {item.title}
                </Link>
              ))}
            </Inline>
          ) : null}
        </Card>
      ) : null}

      <RelatedEntries entry={entry} href={href} tcs={tcs} />
      {/*
        * No `<Separator>` here.
        *
        * `PrevNextNav` already opens with one, and both are children of
        * `DocPage`'s `gap-9` column — so this line rendered a second hairline
        * 37px below the first, with nothing between them. Measured on
        * `/components/container` before the fix: two 1px rules at y=1369 and
        * y=1406, which is exactly the "two dividers under Related" the Forms
        * review reported. The pager keeps its own rule, so the page still has
        * the one intentional separation between related links and navigation,
        * and a page that renders no pager now renders no orphan line either.
        */}
      <PrevNextNav entry={entry} href={href} tcs={tcs} />
    </DocPage>
  );
}
