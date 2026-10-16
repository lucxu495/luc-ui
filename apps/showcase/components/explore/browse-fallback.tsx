/*
 * The shape of the explorer, before it hydrates.
 *
 * `BrowseExplorer` is a client island that reads the URL, and `useSearchParams`
 * needs a Suspense boundary during a prerender — the server cannot read the
 * address bar. Reserving the island's actual shape (a field, three rows of
 * chips, a grid of results) keeps the page from jumping when it arrives, which a
 * spinner in the same place does not.
 *
 * It lives beside the explorer rather than inside either route because two
 * routes now mount that explorer — `/explore`, which is the discovery surface,
 * and `/explore/browse`, which stays as the alias — and two copies of a skeleton
 * is two things to keep in step with one island.
 */

import { Skeleton } from "@luc/ui";

export function BrowseFallback() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-default p-4">
        <Skeleton variant="text" className="h-9 w-full" />
        <Skeleton variant="text" className="h-7 w-3/4" />
        <Skeleton variant="text" className="h-7 w-2/3" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    </div>
  );
}
