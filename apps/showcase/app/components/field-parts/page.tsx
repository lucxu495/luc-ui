/*
 * The server half of the Field page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 *
 * `primary="Field"` because the module publishes four symbols (`Field`,
 * `Fieldset`, `FieldGroup`, `useField`) and the page's own subject has to be the
 * table a reader meets first; the other three fold behind one disclosure.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { FieldPartsPage } from "./page-client";

export default function Page() {
  return <FieldPartsPage apiSection={<EntryApiSection entryId="field" heading="API" primary="Field" />} />;
}
