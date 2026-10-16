"use client";

/*
 * `SearchInput` with the handler it exists for.
 *
 * `onValueChange` is the point of this component — a caller filters as the reader
 * types — and a handler cannot be printed as JSX by the structured printer or
 * serialised across the RSC boundary, so the specimen lives in an island and its
 * snippet is written by hand beside it.
 *
 * The bind tag is rendered from the same state the field shows, so the two cannot
 * disagree.
 */

import { useState } from "react";
import { Code, SearchInput, Text } from "@luc/ui";

export function SearchInputDemo() {
  const [query, setQuery] = useState("sharpe");

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <SearchInput
        placeholder="Search runs"
        value={query}
        onValueChange={setQuery}
        aria-label="Search runs"
      />
      <Text variant="caption" tone="muted">
        Bound value: <Code>{query || "—"}</Code>
      </Text>
    </div>
  );
}
