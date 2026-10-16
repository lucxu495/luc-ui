/*
 * The server half of the Tabs page.
 *
 * The API reference comes from the documentation registry — the compiler's own
 * reading of the published package, far too large for a browser bundle — while the
 * body stays a client component, because every example on this page is a control
 * the reader operates.
 *
 * `Tabs` is one symbol carrying its own parts, so `primary` unfolds the one table
 * there is.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { TabsPage } from "./page-client";

export default function Page() {
  return (
    <TabsPage
      apiSection={
        <EntryApiSection
          entryId="tabs"
          primary="Tabs"
          {...(ENTRY_NOTES.tabs?.api?.note ? { note: ENTRY_NOTES.tabs.api.note } : {})}
        />
      }
    />
  );
}
