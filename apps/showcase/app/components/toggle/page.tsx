/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 *
 * This replaced a hand-written props table that had drifted from the module: it
 * documented `ButtonGroup` and the five `Toolbar*` symbols under a page titled
 * Toggle, which is where a reader would look for neither. Those symbols live in
 * one module (`components/button-group.tsx`) and are documented once, on their
 * own page; this page links to them.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { TogglePage } from "./page-client";

export default function Page() {
  return <TogglePage apiSection={<EntryApiSection entryId="toggle" />} />;
}
