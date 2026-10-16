/*
 * The server half of the Alert page.
 *
 * The API reference is read from the documentation registry — the compiler's own
 * reading of the published package, far too large for a browser bundle — while the
 * body stays a client component, because three of its examples hold real state
 * (a dismissal, a live announcement, a form's error summary).
 *
 * `primary` names the two public components: `Alert` is the status surface and
 * `Callout` is the same implementation with the persistent intent, so both tables
 * are open and the three parts are the ones folded underneath.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { AlertPage } from "./page-client";

export default function Page() {
  return (
    <AlertPage
      apiSection={
        <EntryApiSection
          entryId="alert"
          primary={["Alert", "Callout"]}
          {...(ENTRY_NOTES.alert?.api?.note ? { note: ENTRY_NOTES.alert.api.note } : {})}
        />
      }
    />
  );
}
