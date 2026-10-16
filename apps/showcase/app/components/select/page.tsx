/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { SelectPage } from "./page-client";

/*
 * `primary="Select"` because this module publishes nine symbols.
 *
 * The Forms review found the API area "excessively long": `SelectTrigger`,
 * `SelectContent`, `SelectItem` and the rest each carry inherited Radix props, so
 * the page ran for several screens of tables before a reader reached its own
 * examples' reference point. The primary table renders first and unfolded and the
 * other eight fold behind a native disclosure — every prop is still on the page,
 * compiled from the declarations, one click away.
 */
export default function Page() {
  return (
    <SelectPage
      apiSection={<EntryApiSection entryId="select" heading="API" primary="Select" />}
    />
  );
}
