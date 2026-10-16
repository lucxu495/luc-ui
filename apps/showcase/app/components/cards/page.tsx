/*
 * The server half of this page.
 *
 * Same split as every other curated component route: the API reference is read
 * from the documentation registry, which carries the compiler's own reading of
 * the published package and is far too large to ship to a browser. The page
 * stays a client component (it holds the selected-card state that one of its
 * examples toggles) and the tables arrive as a node, already rendered.
 *
 * `card` is one module with seven exports, so `primary="Card"` puts the props a
 * reader came for first and folds the sub-component tables underneath — every
 * public prop is still on the page, compiled from the declarations.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { CardsPage } from "./page-client";

export default function Page() {
  return <CardsPage apiSection={<EntryApiSection entryId="card" primary="Card" />} />;
}
