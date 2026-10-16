"use client";

import type { ReactNode } from "react";
import { SearchInput } from "../components/search-input";
import { cn } from "../utils/cn";
import { useDataTable } from "./context";

/**
 * The table toolbar. A layout with two bound conveniences — global search and
 * the selection summary — plus free slots, so a product composes filters and
 * actions instead of the table guessing what a screen needs.
 */

export interface DataTableToolbarProps {
  className?: string;
  /** Left-of-search controls (facets, view switches). */
  children?: ReactNode;
  /** Bound global search field. `true` uses the defaults. */
  search?: boolean | { placeholder?: string; label?: string; className?: string };
  /** Right-aligned controls: column visibility, export, density, actions. */
  actions?: ReactNode;
}

export function DataTableToolbar({ className, children, search = false, actions }: DataTableToolbarProps) {
  const { table } = useDataTable();
  const config = typeof search === "object" ? search : {};
  const globalFilter = (table.state.globalFilter as string | undefined) ?? "";

  return (
    <div
      data-slot="data-table-toolbar"
      className={cn("flex flex-wrap items-center gap-2 border-b border-line-subtle px-3 py-2.5", className)}
    >
      {search ? (
        <SearchInput
          size="sm"
          className={cn("w-full sm:w-64", config?.className)}
          placeholder={config?.placeholder ?? "Search rows…"}
          aria-label={config?.label ?? "Search rows"}
          value={globalFilter}
          onValueChange={(value) => table.setGlobalFilter(value)}
        />
      ) : null}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface DataTableSelectionCountProps {
  className?: string;
  /** Noun for the selected rows. Default `"selected"`. */
  label?: string;
}

/** Live count plus a clear action. Renders nothing when the selection is empty. */
export function DataTableSelectionCount({ className, label = "selected" }: DataTableSelectionCountProps) {
  const { table } = useDataTable();
  const selection = table.state.rowSelection ?? {};
  const count = Object.keys(selection).length;
  if (count === 0) return null;

  return (
    <span className={cn("flex items-center gap-2 text-caption text-fg-secondary", className)}>
      <span className="luc-numeric" aria-live="polite">
        {count} {label}
      </span>
      <span aria-hidden="true" className="h-3 w-px bg-line-default" />
      <button
        type="button"
        onClick={() => table.resetRowSelection()}
        className="rounded-xs text-fg-muted luc-transition hover:text-fg-primary luc-focus"
      >
        Clear
      </button>
    </span>
  );
}
