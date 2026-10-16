"use client";

/*
 * The catalog browser.
 *
 * One client island over the discovery projection: a search field, three filter
 * axes (kind, use case, art direction) and the result list. Every piece of state
 * is in the URL, so a filtered view can be linked, refreshed, shared and — this
 * is the part that matters for a *library* — reproduced when someone reports a
 * problem with it.
 *
 * It imports the catalog itself rather than receiving it as props: the data is a
 * client-safe generated module, so passing ~300 rows through the RSC payload
 * would ship the same bytes twice and make the island's props the biggest thing
 * on the page.
 */

import Link from "next/link";
import { useMemo } from "react";
import { useQueryStates } from "nuqs";
import { Badge, Button, Inline, SearchInput, Text, cn } from "@luc/ui";
import {
  discoveryEntries,
  entriesOfKind,
  kindLabel,
  searchDiscovery,
} from "@/lib/discovery/catalog";
import type { DiscoveryEntry } from "@/lib/discovery/types";
import {
  BROWSE_ART_DIRECTIONS,
  BROWSE_USE_CASES,
  browseParams,
  isFiltered,
  type BrowseState,
} from "@/lib/discovery/browse-params";
import { ART_DIRECTIONS, DISCOVERY_KINDS, useCaseById } from "@/lib/discovery/taxonomy";
import { nuqsParser } from "@/lib/luc-nuqs";
import { useI18n } from "@/lib/i18n/provider";

/** The unfiltered view caps each kind so the page stays scannable. */
const KIND_PREVIEW_LIMIT = 24;

export function BrowseExplorer() {
  const { tcs, href } = useI18n();
  const [state, setState] = useQueryStates(
    {
      q: nuqsParser(browseParams.q.codec, browseParams.q.default),
      kind: nuqsParser(browseParams.kind.codec, browseParams.kind.default),
      use: nuqsParser(browseParams.use.codec, browseParams.use.default),
      art: nuqsParser(browseParams.art.codec, browseParams.art.default),
    },
    { history: "replace", shallow: true, scroll: false, clearOnDefault: true },
  );

  const filters = state as BrowseState;
  const active = isFiltered(filters);

  const results = useMemo(() => {
    const needle = filters.q.trim();
    const matches = (entry: DiscoveryEntry): boolean =>
      (filters.kind === "all" || entry.kind === filters.kind) &&
      (filters.use === "all" || entry.useCases.includes(filters.use)) &&
      (filters.art === "all" || entry.artDirections.includes(filters.art));
    if (needle) {
      return searchDiscovery(needle, 200)
        .map((hit) => hit.entry)
        .filter(matches);
    }
    return discoveryEntries.filter(matches);
  }, [filters.q, filters.kind, filters.use, filters.art]);

  const grouped = useMemo(() => {
    if (active) return [];
    return DISCOVERY_KINDS.map((kind) => ({
      kind,
      entries: entriesOfKind(kind.id).slice(0, KIND_PREVIEW_LIMIT),
      total: entriesOfKind(kind.id).length,
    })).filter((group) => group.total > 0);
  }, [active]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-default p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <label className="mb-1 block text-micro text-fg-muted uppercase" htmlFor="browse-search">
              {tcs("Search by name, Chinese name or alias")}
            </label>
            <SearchInput
              id="browse-search"
              size="md"
              value={filters.q}
              placeholder={tcs("Rating, 折线图, kanban, datagrid…")}
              clearLabel={tcs("Clear the search")}
              onChange={(event) => setState({ q: event.target.value })}
            />
          </div>
          <Text variant="caption" tone="muted" as="p" aria-live="polite" className="pb-2">
            {tcs("{count} entries").replace("{count}", String(results.length))}
          </Text>
          {active ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setState({ q: "", kind: "all", use: "all", art: "all" })}
            >
              {tcs("Clear filters")}
            </Button>
          ) : null}
        </div>

        {/*
          * Kind labels come from the navigation dictionary rather than from the
          * prose dictionary: "Components", "Charts", "Motion" and "Blocks" are
          * the words the sidebar already shows, so a reader meets one Chinese
          * rendering of each instead of two.
          */}
        <FilterAxis
          label={tcs("Kind")}
          value={filters.kind}
          options={[
            { value: "all", label: tcs("Everything"), count: discoveryEntries.length },
            ...DISCOVERY_KINDS.map((kind) => ({
              value: kind.id as string,
              label: tcs(kindLabel(kind.id)),
              count: entriesOfKind(kind.id).length,
            })),
          ]}
          onChange={(value) => setState({ kind: value as BrowseState["kind"] })}
        />
        <FilterAxis
          label={tcs("Use case")}
          value={filters.use}
          options={BROWSE_USE_CASES.map((useCase) => ({
            value: useCase,
            label: useCase === "all" ? tcs("Any use case") : tcs(useCaseById.get(useCase)?.label ?? useCase),
          }))}
          onChange={(value) => setState({ use: value as BrowseState["use"] })}
        />
        <FilterAxis
          label={tcs("Art direction")}
          value={filters.art}
          options={BROWSE_ART_DIRECTIONS.map((direction) => ({
            value: direction,
            label:
              direction === "all"
                ? tcs("Any direction")
                : tcs(ART_DIRECTIONS.find((entry) => entry.id === direction)?.label ?? direction),
          }))}
          onChange={(value) => setState({ art: value as BrowseState["art"] })}
        />
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-sunken p-5">
          <Text variant="body" tone="primary" as="p">
            {tcs("Nothing matches those filters.")}
          </Text>
          <Text variant="caption" tone="muted" as="p">
            {tcs(
              "Search matches a component's identifier, its Chinese alias, its family and its tags. Clearing the filters shows the whole catalog.",
            )}
          </Text>
        </div>
      ) : active ? (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((entry) => (
            <ResultRow key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        grouped.map((group) => (
          <section key={group.kind.id} className="flex flex-col gap-2">
            <Inline gap="sm" align="baseline" wrap>
              <h2 className="text-title text-fg-primary" id={group.kind.id}>
                {tcs(group.kind.label)}
              </h2>
              <Text variant="caption" tone="muted" as="span">
                {tcs("{shown} of {total}").replace("{shown}", String(group.entries.length)).replace(
                  "{total}",
                  String(group.total),
                )}
              </Text>
              <Link
                href={href(`/explore?kind=${group.kind.id}`)}
                className="rounded-sm text-caption text-fg-accent underline luc-focus"
              >
                {tcs("See all")}
              </Link>
            </Inline>
            <ul className="flex flex-wrap gap-2">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={href(entry.route)}
                    className="inline-flex items-center gap-2 rounded-lg border border-line-subtle px-3 py-1.5 text-label text-fg-primary luc-transition hover:border-line-strong luc-focus"
                  >
                    {/*
                      * `tcs`, like the kind label beside it. A discovery title is
                      * either an identifier (`DataTable`, returned unchanged) or a
                      * name the taxonomy wrote in English ("Chart with a date
                      * range"), whose Chinese has been in the dictionary since
                      * Phase 9 — this span and the result card below were the two
                      * places still printing the raw field, so a Chinese reader
                      * saw a handful of English chips under a Chinese heading.
                      */}
                    {tcs(entry.title)}
                    {entry.status === "study" ? (
                      <Badge tone="outline" size="sm">
                        {tcs("Study")}
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FilterAxis({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string; count?: number }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-micro text-fg-muted uppercase">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "luc-transition luc-focus h-control-sm rounded-sm border px-2.5 text-caption",
              value === option.value
                ? "border-line-accent bg-surface-selected text-fg-primary"
                : "border-line-subtle text-fg-secondary hover:border-line-strong hover:text-fg-primary",
            )}
          >
            {option.label}
            {option.count === undefined ? null : (
              <span className="ml-1.5 text-fg-muted luc-numeric">{option.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultRow({ entry }: { entry: DiscoveryEntry }) {
  const { tcs, href } = useI18n();
  return (
    <li>
      <Link
        href={href(entry.route)}
        className="flex h-full flex-col gap-1 rounded-lg border border-line-subtle bg-surface-default p-3 luc-transition hover:border-line-strong luc-focus"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-label text-fg-primary">{tcs(entry.title)}</span>
          <span className="shrink-0 font-mono text-micro text-fg-muted">
            {tcs(kindLabel(entry.kind))}
          </span>
        </span>
        <span className="font-mono text-micro text-fg-muted">{entry.route}</span>
        {entry.aliases.length > 0 ? (
          <span className="text-caption text-fg-secondary">
            {tcs("also known as")} {entry.aliases.slice(0, 4).join(" · ")}
          </span>
        ) : null}
        {entry.status === "study" ? (
          <span className="text-caption text-fg-accent">{tcs("Design study — not installable")}</span>
        ) : null}
      </Link>
    </li>
  );
}
