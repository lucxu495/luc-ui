/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { NumberInputPage } from "./page-client";

export default function Page() {
  return <NumberInputPage apiSection={<EntryApiSection entryId="number-input" heading="API" primary="NumberInput" />} />;
}
