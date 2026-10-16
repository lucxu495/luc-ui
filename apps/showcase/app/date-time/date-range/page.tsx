/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 *
 * `DateRangePicker` is exported from `datetime/date-picker.tsx`, which the
 * registry documents as the `date-picker` entry — so this page renders that
 * entry's tables with `DateRangePicker` first. Its props were previously not on
 * this page at all: the page ended in `RelatedApi`, a list of links, which is
 * the right instrument for a page that exports nothing of its own but the wrong
 * one for a page whose component has its own props.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { DateRangePage } from "./page-client";

export default function Page() {
  return (
    <DateRangePage
      apiSection={
        <EntryApiSection
          entryId="date-picker"
          primary="DateRangePicker"
          note="DateRangePicker shares its module with DatePicker, so the exports table below is the shared one; its own props table comes first, and the rest of the module is folded underneath it."
        />
      }
    />
  );
}
