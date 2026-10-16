/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { DatePickerPage } from "./page-client";

export default function Page() {
  /*
   * Two registry rows, one page.
   *
   * `datetime-picker` is a reference row — the zoned instant this page's picker
   * composes — and it is documented here, where a reader meets it, rather than on
   * a page of its own. (The month and year grids live on `/date-time/calendar`,
   * which is the page a reader opens for them.)
   */
  return (
    <DatePickerPage
      apiSection={
        <EntryApiSection
          entryId={["date-picker", "datetime-picker"]}
          heading="API"
          primary={["DatePicker", "DateTimePicker"]}
        />
      }
    />
  );
}
