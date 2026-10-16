"use client";

/*
 * Component search.
 *
 * Reads the compact navigation projection, not the full registry, so a search
 * box does not pull 700 KB of API tables into a page. Keyboard behaviour is
 * explicit rather than implied: Down/Up move through the results, Enter follows
 * the active one, Escape clears and returns focus to the field. Results are
 * announced through a live region so a screen-reader user learns how many
 * matches exist without leaving the field.
 */

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { Kbd, Text, cn } from "@luc/ui";
import { searchNav } from "@/lib/docs/nav";
import { useI18n } from "@/lib/i18n/provider";

export function DocSearch({ className }: { className?: string }) {
  const { tcs, href } = useI18n();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchNav(query, 10), [query]);
  const open = query.trim().length > 0;
  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1);

  return (
    <div className={cn("relative", className)}>
      <label className="sr-only" htmlFor={listId}>
        {tcs("Search components and charts")}
      </label>
      <input
        ref={inputRef}
        id={listId}
        type="search"
        /*
         * `combobox` is the correct role for a text field that owns a popup
         * listbox: it is what makes `aria-expanded` and `aria-activedescendant`
         * meaningful to a screen reader. A bare `search` input cannot legally
         * carry either, which is exactly what the accessibility linter said.
         */
        role="combobox"
        value={query}
        placeholder={tcs("Search components and charts")}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${listId}-results`}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-result-${activeIndex}` : undefined
        }
        className="h-control-md w-full rounded-md border border-line-default bg-surface-interactive px-3 text-body text-fg-primary placeholder:text-fg-muted luc-focus"
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            return;
          }
          if (!open) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && activeIndex >= 0) {
            const target = results[activeIndex]?.entry;
            if (target) window.location.assign(href(target.route));
          }
        }}
      />
      <p aria-live="polite" className="sr-only">
        {open
          ? results.length === 0
            ? tcs("No matches")
            : `${results.length} ${tcs("matches")}`
          : ""}
      </p>
      {open ? (
        <div
          id={`${listId}-results`}
          role="listbox"
          aria-label={tcs("Search results")}
          className="absolute top-[calc(100%+0.375rem)] left-0 z-30 flex max-h-80 w-full flex-col overflow-y-auto rounded-lg border border-line-default bg-surface-overlay p-1 shadow-hover"
        >
          {results.length === 0 ? (
            <Text variant="caption" tone="muted" as="p" className="px-3 py-2">
              {tcs("No components match that. Try an export name such as Button or LineChart.")}
            </Text>
          ) : (
            results.map((result, index) => (
              <Link
                key={result.entry.id}
                id={`${listId}-result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                href={href(result.entry.route)}
                className={cn(
                  "flex items-baseline justify-between gap-3 rounded-sm px-3 py-2 text-body",
                  index === activeIndex
                    ? "bg-surface-interactive-hover text-fg-primary"
                    : "text-fg-secondary",
                )}
                onMouseEnter={() => setActive(index)}
              >
                <span>{result.entry.title}</span>
                <span className="font-mono text-micro text-fg-subtle">{result.entry.route}</span>
              </Link>
            ))
          )}
        </div>
      ) : null}
      <Text variant="caption" tone="muted" as="p" className="mt-1.5 flex items-center gap-1.5">
        <span>{tcs("Search the whole catalogue, including charts.")}</span>
        <Kbd>/</Kbd>
      </Text>
    </div>
  );
}
