/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { WorkspacePage } from "./page-client";

export default function Page() {
  /*
   * `inspector-pane` is a reference row: the workspace's own right-hand pane,
   * documented where it is composed. Naming it here is what makes
   * `InspectorRow`'s and `InspectorSection`'s props reachable.
   */
  return (
    <WorkspacePage
      apiSection={
        <EntryApiSection
          entryId={["workspace", "inspector-pane"]}
          heading="Exports"
          primary={["Workspace", "InspectorPane"]}
        />
      }
    />
  );
}
