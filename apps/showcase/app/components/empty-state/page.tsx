/*
 * The server half of the EmptyState page.
 *
 * The body is a client component — one of its examples filters a list as the
 * reader types — and the API reference arrives ready-rendered from the
 * documentation registry, which the browser must never download.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { EmptyStatePage } from "./page-client";

export default function Page() {
  return (
    <EmptyStatePage
      apiSection={
        <EntryApiSection
          entryId="empty-state"
          primary="EmptyState"
          {...(ENTRY_NOTES["empty-state"]?.api?.note
            ? { note: ENTRY_NOTES["empty-state"].api.note }
            : {})}
        />
      }
    />
  );
}
