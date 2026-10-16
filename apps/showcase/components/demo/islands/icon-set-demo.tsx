"use client";

/*
 * The icon set, searchable.
 *
 * An island because the point of a set is that a person can *find* something in
 * it, and finding is a keystroke. The search reads the same `searchIcons` the
 * package exports — name and keyword matching over the curated list, in both
 * languages — so this demo cannot disagree with the library about what is in it.
 */

import { useState } from "react";
import { Icon, SearchInput, Text, iconSet, searchIcons } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

export function IconSetDemo() {
  const { tcs } = useI18n();
  const [query, setQuery] = useState("");
  const results = searchIcons(query);

  return (
    <div className="flex w-full flex-col gap-3">
      <SearchInput
        value={query}
        onValueChange={setQuery}
        /* The count is read from the set, never typed: a hardcoded "39" is the
         * stale-fact failure LEG-004 is about, one glyph at a time. */
        placeholder={tcs("Search {count} icons by name or keyword").replace("{count}", String(iconSet.length))}
        aria-label={tcs("Search the icon set")}
        clearLabel={tcs("Clear the search")}
      />
      <Text variant="caption" tone="muted" as="p">
        {tcs("{found} of {total} icons").replace("{found}", String(results.length)).replace("{total}", String(iconSet.length))}
      </Text>
      {results.length === 0 ? (
        <Text variant="caption" tone="muted" as="p">
          {tcs("No icon matches that word. Try a broader one, in English or Chinese.")}
        </Text>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {results.map((name) => (
            <li
              key={name}
              className="flex flex-col items-center gap-1.5 rounded-md border border-line-subtle bg-surface-default px-2 py-3"
            >
              <Icon name={name} size="lg" tone="secondary" />
              <code className="text-micro text-fg-muted">{name}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
