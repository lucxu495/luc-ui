/*
 * The server half of this page.
 *
 * `TransferList` gained a written page in the Forms review: it used to be
 * documented as the second half of `/components/color-picker` ("Colour and
 * transfer") *and* as a generated row of its own, so the same component had two
 * pages and neither demonstrated more than one configuration. It keeps its
 * registry entry, its family (Data display — it moves items between two sets, it
 * is not a form control) and its URL; what changed is that it now has one page
 * with the canonical structure.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { TransferListPage } from "./page-client";

export default function Page() {
  return <TransferListPage apiSection={<EntryApiSection entryId="transfer-list" />} />;
}
