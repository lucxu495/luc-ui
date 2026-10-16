/*
 * The server half of this page.
 *
 * The API reference is read from the documentation registry, which carries the
 * compiler's own reading of the published package — and is far too large to ship
 * to a browser. So the page stays a client component and the table arrives as a
 * node, already rendered. Delivered JavaScript for the API data: zero bytes.
 */

import { EntryApiSection } from "@/components/docs/entry-api";
import { FileUploadPage } from "./page-client";

export default function Page() {
  /*
   * Two registry ids, one page.
   *
   * `/components/file-upload` is where both `file-input` (FileInput, DropZone)
   * and `file-upload` (FileUpload) are documented — the sidebar carries a row for
   * each — so the page's one API area has to publish both modules. Passing only
   * `file-upload` left `FileInput`'s and `DropZone`'s compiled prop tables
   * reachable nowhere on the site, which is the opposite of what an API section
   * is for.
   */
  return (
    <FileUploadPage
      apiSection={
        <EntryApiSection
          entryId={["file-upload", "file-input"]}
          heading="API"
          primary="FileUpload"
          note="This page documents two sibling modules: `FileInput` with its `DropZone` variant, which selects and validates files, and `FileUpload` beside it, which renders a transfer you own."
        />
      }
    />
  );
}
