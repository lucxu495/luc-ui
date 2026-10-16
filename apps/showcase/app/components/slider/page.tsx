/*
 * The server half of the Slider page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 *
 * This replaced a hand-written `PropsTable` and a separate "Rules" section. The
 * prose table stated nine rows of props the compiler already knows, and the two
 * said the same three things twice; the rows are now the real declarations, and
 * the advice lives in `curation/notes.ts` with the rest of the curated copy.
 *
 * `primary="Slider"` puts the single-value component's table first — it is the
 * one most readers arrive for — and folds `RangeSlider`'s behind one disclosure.
 * Every public prop of both is still on the page.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { SliderPage } from "./page-client";

export default function Page() {
  return <SliderPage apiSection={<EntryApiSection entryId="slider" heading="API" primary="Slider" />} />;
}
