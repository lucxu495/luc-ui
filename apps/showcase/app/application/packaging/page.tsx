/*
 * The server half of the Packaging page.
 *
 * `luc-provider` is a reference row whose host page is this one, so the API area
 * arrives as a node: the page itself is a client component (it is a table of
 * measured bundle sizes with an interactive disclosure), and the compiler's
 * tables are far too large to ship to a browser.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { PackagingPage } from "./page-client";

export default function Page() {
  return (
    <PackagingPage
      apiSection={
        <EntryApiSection
          entryId="luc-provider"
          heading="API"
          primary="LucProvider"
        />
      }
    />
  );
}
