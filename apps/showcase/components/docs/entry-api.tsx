/*
 * The API reference for a handwritten page, rendered on the server.
 *
 * The gap this closes, measured rather than assumed: 20 of the 56 handwritten
 * routes are a *static* `page.tsx` at exactly the URL a registry entry owns
 * (`/components/select` is entry `select`'s `route`). A static route wins over
 * `/components/[component]`, so for those 20 ids the generated page — and with
 * it `ExportsTable` and the props tables — never rendered anywhere on the site.
 * The other 29 handwritten pages carry a hand-written `PropsTable`; these 20
 * carried nothing.
 *
 * The fix is a delivery decision as much as a documentation one. The registry's
 * API facts (`lib/docs/generated/api.ts`) are ~666 KB of compiler output and
 * must never reach a browser bundle, which is why `registry.ts` is server-only
 * and the client reads the compact `nav.ts` projection instead. So this module
 * is a *server* component: it reads `apiFor()` where it belongs and hands the
 * already-rendered rows into the client page as a node. Delivered JavaScript for
 * the API data is zero bytes, and there is still exactly one source of truth —
 * the compiler's reading of the published package.
 *
 * It renders the same two components the generated entry pages render, on
 * purpose: a reader who arrives on a hand-written page and one who arrives on a
 * generated page must see the same table, in the same order, from the same data.
 *
 * Usage (the second caller, and the reason the props tables moved inside the
 * section): a component entry renders *one* `#api` area holding the exports
 * table and the props table of each exported symbol, rather than an exports
 * table in one place and a column of loose `X props` headings after it. The
 * loose version read as two competing references — a reader looking for
 * `ToolbarButton`'s props found a heading that was not under the API heading at
 * all — and the outline rail listed the tables as if they were page sections.
 * One section, one area, related compound APIs inside it.
 */

import { Heading, Text } from "@luc/ui";
import { ExportsTable, PropsTable } from "@/components/docs/doc-entry";
import { apiFor, entryById } from "@/lib/docs/registry";
import { getServerCopy } from "@/lib/i18n/server";

export interface EntryApiSectionProps {
  /**
   * The registry id — or ids — this page documents.
   *
   * One id is the ordinary case. Two exist because one *page* can own two
   * registry entries: `/components/file-upload` is where both the `file-input`
   * module (`FileInput`, `DropZone`) and the `file-upload` module (`FileUpload`)
   * are documented, and the compiler's tables for one of them were reachable
   * nowhere else on the site. Rendering both into the one `#api` area keeps the
   * section singular — the reader sees one API, the page's whole surface — while
   * every public prop stays present and compiled.
   */
  entryId: string | readonly string[];
  /**
   * Heading text and anchor id.
   *
   * Defaults are the documentation convention ("API" / `#api`). A composite page
   * may prefer "Exports" — the honest word for a module whose surface is not one
   * component with props.
   */
  heading?: string;
  anchorId?: string;
  /**
   * One sentence about *this* module's surface, printed above the tables.
   *
   * Its home is `curation/notes.ts` → `api.note`. The case it exists for: a
   * module that publishes two component families at once (`button-group.tsx`
   * exports both the group and the Toolbar shell), where a reader opening the
   * tables deserves to be told why the second family is here instead of finding
   * seven unexplained prop tables.
   */
  note?: string;
  /**
   * The symbol(s) whose props table is the page's main API.
   *
   * Forms review. A module like `select.tsx` publishes nine symbols, and their
   * tables run to several screens of inherited Radix props before a reader
   * reaches the second half of the page. Naming the primary symbol renders its
   * table first and unfolded, and folds the remaining tables behind a native
   * disclosure — every public prop is still on the page, still compiled from the
   * declarations, and one click away; what changes is which table a reader meets
   * first.
   *
   * Omitted (the default), everything renders unfolded exactly as before: a page
   * opts in, so no page's behaviour changed by accident.
   */
  primary?: string | readonly string[];
}

export async function EntryApiSection({
  entryId,
  heading = "API",
  anchorId = "api",
  note,
  primary,
}: EntryApiSectionProps) {
  const ids = typeof entryId === "string" ? [entryId] : [...entryId];
  const entries = ids.flatMap((id) => {
    const candidate = entryById(id);
    return candidate ? [candidate] : [];
  });
  /* A page whose route has no registry row has no generated API to show, and
   * saying nothing is better than inventing a table. The caller decides whether
   * that is acceptable; this component does not guess. */
  if (entries.length === 0) return null;

  const { tcs } = await getServerCopy();
  const symbols = entries.flatMap((entry) => apiFor(entry.id));
  /* Only the symbols the compiler could read props for get a second table. A
   * constant or a type alias would render an empty one. */
  const propTables = symbols.filter((symbol) => (symbol.props?.length ?? 0) > 0);
  const primaryNames = primary === undefined ? [] : typeof primary === "string" ? [primary] : [...primary];
  const ordered =
    primaryNames.length === 0
      ? propTables
      : [
          ...propTables.filter((symbol) => primaryNames.includes(symbol.name)),
          ...propTables.filter((symbol) => !primaryNames.includes(symbol.name)),
        ];
  const firstFolded = primaryNames.length === 0 ? propTables.length : primaryNames.length;

  return (
    /* `data-skip-i18n` on the whole area: the description is about the tables,
     * and the tables are compiler output. See `doc-entry.tsx` for why that text
     * stays English. A curated `note` is translated before it reaches here, so a
     * Chinese page reads it in Chinese. */
    <section className="flex flex-col gap-4" data-skip-i18n>
      <Heading size="title" as="h2" id={anchorId}>
        {tcs(heading)}
      </Heading>
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {tcs(
          "Read from the published TypeScript API, so a prop that is not listed here does not exist and a default that is listed is the one the compiler sees.",
        )}
      </Text>
      {note ? (
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(note)}
        </Text>
      ) : null}
      {entries.map((entry) => (
        <ExportsTable key={entry.id} entry={entry} tcs={tcs} />
      ))}
      {ordered.map((symbol, index) =>
        index < firstFolded ? (
          <PropsTable key={symbol.name} symbol={symbol} tcs={tcs} />
        ) : (
          /*
           * A native disclosure rather than the Radix `Collapsible` the folded
           * DOC-003 sections use: this file is a server component, and `<details>`
           * is the one disclosure that needs no client bundle. It keeps the
           * keyboard contract (Enter/Space on the summary) and the panel is in
           * the DOM either way, so search and copy still find every prop.
           */
          <details key={symbol.name} className="group/api rounded-lg border border-line-subtle">
            <summary className="luc-focus flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-label text-fg-secondary luc-transition hover:text-fg-primary">
              {tcs("{name} props").replace("{name}", symbol.name)}
              <Text variant="micro" tone="muted" as="span">
                {tcs("{count} props").replace("{count}", String(symbol.props?.length ?? 0))}
              </Text>
            </summary>
            <div className="px-3 pb-3">
              <PropsTable symbol={symbol} tcs={tcs} />
            </div>
          </details>
        ),
      )}
    </section>
  );
}
