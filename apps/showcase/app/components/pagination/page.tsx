/*
 * The server half of the Pagination page.
 *
 * Same split as every other curated component route: the API reference comes from
 * the documentation registry, which carries the compiler's reading of the
 * published package and is far too large to ship to a browser. The body stays a
 * client component — this page's whole subject is a control that moves — and the
 * tables arrive as a node, already rendered.
 *
 * `primary` names the two components a reader came for, so their tables are the
 * ones that are open; `paginationWindow` has no props and therefore no table.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { PaginationPage } from "./page-client";

export default function Page() {
  return (
    <PaginationPage
      apiSection={
        <EntryApiSection
          entryId="pagination"
          primary={["Pagination", "PaginationSummary"]}
          {...(ENTRY_NOTES.pagination?.api?.note
            ? { note: ENTRY_NOTES.pagination.api.note }
            : {})}
        />
      }
    />
  );
}
