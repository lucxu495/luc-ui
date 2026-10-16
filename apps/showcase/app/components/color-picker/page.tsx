/*
 * The server half of this page.
 *
 * The page is a client component because two of its specimens hold state; the
 * API area is rendered on the server and handed in as a node, so the compiler's
 * tables never reach a browser bundle.
 *
 * The page used to document `TransferList` as well, under a title of its own
 * ("Colour and transfer"). Picking a colour and moving items between two sets are
 * different jobs with different APIs, so the review split them: this page is
 * ColorPicker, and `/components/transfer-list` carries the other one. No public
 * export, prop or route changed — only which page documents what.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { ColorPickerPage } from "./page-client";

export default function Page() {
  return <ColorPickerPage apiSection={<EntryApiSection entryId="color-picker" />} />;
}
