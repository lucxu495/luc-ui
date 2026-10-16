"use client";

import { RiArrowDownSLine, RiFilter3Line } from "@remixicon/react";
import { useState } from "react";
import { Checkbox } from "../components/checkbox";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover";
import { SearchInput } from "../components/search-input";
import { cn } from "../utils/cn";
import { useDataTable } from "./context";

/**
 * Faceted multi-select filter for one column.
 *
 * The semantics are honest: this is a group of checkboxes inside a popover, not
 * a listbox pretending to be multi-selectable (ARIA has no multi-select listbox
 * that reports counts the way a facet filter needs to). Search narrows the
 * visible options; it does not change the filter.
 *
 * The column must be `filterable: true` with `filterFn: "arrHas"` — the built-in
 * that keeps rows whose *scalar* value equals one of the selected values.
 * (`arrIncludesSome` is for columns whose cell value is itself an array.)
 */

export interface FacetFilterProps {
  /** Column id to filter. */
  columnId: string;
  /** Button label, e.g. "Status". */
  label: string;
  /** Render a raw facet value. Defaults to the value itself. */
  formatValue?: (value: string) => string;
  /** Hide options that would return zero rows. Default `true`. */
  hideEmpty?: boolean;
  /** Show the option search field. Default `true` from 8 options upward. */
  searchable?: boolean;
  className?: string;
}

export function FacetFilter({
  columnId,
  label,
  formatValue,
  hideEmpty = true,
  searchable,
  className,
}: FacetFilterProps) {
  const { table } = useDataTable();
  const [query, setQuery] = useState("");
  const column = table.getColumn(columnId);

  /*
   * Computed per render rather than memoised on `[column]`: the filter value,
   * the facet counts and the highlight all live in table state, and a memo
   * keyed on the column object would show the reader a stale menu.
   */
  const filterValue = column?.getFilterValue();
  const selected = Array.isArray(filterValue) ? (filterValue as string[]) : [];

  const counts = column?.getFacetedUniqueValues() ?? new Map<unknown, number>();
  const options = Array.from(counts.entries())
    .filter(([value]) => value !== null && value !== undefined && value !== "")
    .filter(([, count]) => !hideEmpty || count > 0)
    .map(([value, count]) => ({ value: String(value), count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => (formatValue?.(option.value) ?? option.value).toLowerCase().includes(needle))
    : options;

  const showSearch = searchable ?? options.length >= 8;

  const toggle = (value: string, checked: boolean) => {
    const next = checked ? [...selected, value] : selected.filter((item) => item !== value);
    column?.setFilterValue(next.length > 0 ? next : undefined);
  };

  if (!column) return null;

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${label}`}
          className={cn(
            "inline-flex h-control-sm items-center gap-1.5 rounded-sm border px-2.5 text-label luc-transition luc-focus",
            selected.length > 0
              ? "border-line-accent bg-surface-selected text-fg-primary"
              : "border-line-default bg-surface-sunken text-fg-secondary hover:border-line-strong hover:text-fg-primary",
            className,
          )}
        >
          <RiFilter3Line aria-hidden="true" className="size-3.5 text-fg-muted" />
          {label}
          {selected.length > 0 ? (
            <span className="luc-numeric rounded-xs bg-accent-soft px-1 text-micro text-fg-accent">
              {selected.length}
            </span>
          ) : null}
          <RiArrowDownSLine aria-hidden="true" className="size-3.5 text-fg-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent width="sm" align="start" className="flex flex-col gap-1 p-0">
        {showSearch ? (
          <div className="border-b border-line-subtle p-2">
            <SearchInput
              size="sm"
              placeholder={`Filter ${label.toLowerCase()}…`}
              aria-label={`Filter ${label.toLowerCase()} options`}
              value={query}
              onValueChange={setQuery}
            />
          </div>
        ) : null}
        <div
          role="group"
          aria-label={`${label} filter`}
          className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
        >
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-caption text-fg-muted">No options match “{query}”.</p>
          ) : (
            visible.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 luc-transition hover:bg-surface-interactive-hover"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) => toggle(option.value, checked === true)}
                />
                <span className="min-w-0 flex-1 truncate text-label text-fg-secondary">
                  {formatValue?.(option.value) ?? option.value}
                </span>
                {/* The count is context, not the option's name — keeping it out
                    of the accessible name leaves "live", not "live 2". */}
                <span aria-hidden="true" className="luc-numeric shrink-0 text-caption text-fg-disabled">
                  {option.count}
                </span>
              </label>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line-subtle px-2.5 py-2">
          <span className="text-caption text-fg-muted">
            {selected.length > 0 ? `${selected.length} selected` : "All rows"}
          </span>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => column.setFilterValue(undefined)}
            className="rounded-xs text-caption text-fg-muted luc-transition hover:text-fg-primary disabled:pointer-events-none disabled:text-fg-disabled luc-focus"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}
