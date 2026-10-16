/*
 * The server half of the NotificationCenter page.
 *
 * The body is a client component — the whole subject is a list whose read state
 * changes as the reader works through it — and the API reference arrives
 * ready-rendered from the documentation registry, which the browser must never
 * download.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { NotificationsPage } from "./page-client";

export default function Page() {
  return (
    <NotificationsPage
      apiSection={
        <EntryApiSection
          entryId="notification-center"
          primary="NotificationCenter"
          {...(ENTRY_NOTES["notification-center"]?.api?.note
            ? { note: ENTRY_NOTES["notification-center"].api.note }
            : {})}
        />
      }
    />
  );
}
