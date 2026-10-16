/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { CalendarPage } from "./page-client";

export default function Page() {
  /*
   * Three registry rows, one page.
   *
   * `locale-provider` and `month-year-picker` are reference rows: the calendar is
   * where a reader meets `LocaleProvider` (week start, month names, the first day
   * of the week) and the month/year grids, and naming them here is what puts their
   * props on the site at all.
   */
  return (
    <CalendarPage
      apiSection={
        <EntryApiSection
          entryId={["calendar", "locale-provider", "month-year-picker"]}
          heading="API"
          primary={["Calendar", "LocaleProvider", "MonthPicker"]}
        />
      }
    />
  );
}
