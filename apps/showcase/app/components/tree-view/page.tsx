/*
 * The server half of the TreeView page.
 *
 * The body is a client component: every specimen on this page is a control with
 * state — a selection, an expansion set the reader's own buttons drive — and a
 * tree is operated, not looked at. The API reference arrives ready-rendered from
 * the documentation registry, which the browser must never download.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { TreeViewPage } from "./page-client";

export default function Page() {
  return (
    <TreeViewPage
      apiSection={
        <EntryApiSection
          entryId="tree-view"
          primary="TreeView"
          {...(ENTRY_NOTES["tree-view"]?.api?.note
            ? { note: ENTRY_NOTES["tree-view"].api.note }
            : {})}
        />
      }
    />
  );
}
