"use client";

import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { cn } from "../utils/cn";
import { useDataTable } from "./context";

/**
 * Pagination footer.
 *
 * Reads `manualPagination` / `pageCount` / `rowCount` from the table, so the
 * same footer drives a client-side table and a server-paged one — the only
 * difference is where the rows come from.
 */

export interface DataTablePaginationProps {
  className?: string;
  pageSizeOptions?: readonly number[];
  /** Noun for the rows being counted. Default `"rows"`. */
  rowLabel?: string;
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-sm border border-line-default bg-surface-sunken text-fg-muted",
        "luc-transition hover:border-line-strong hover:text-fg-primary luc-focus",
        "disabled:pointer-events-none disabled:opacity-45",
      )}
    >
      {children}
    </button>
  );
}

export function DataTablePagination({
  className,
  pageSizeOptions = [10, 20, 50, 100],
  rowLabel = "rows",
}: DataTablePaginationProps) {
  const { table } = useDataTable();
  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = table.getPageCount();
  const total = table.getFilteredRowModel().rows.length;
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div
      data-slot="data-table-pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle px-3 py-2.5",
        className,
      )}
    >
      <p className="text-caption text-fg-muted" aria-live="polite">
        <span className="luc-numeric">
          {first}–{last}
        </span>{" "}
        of <span className="luc-numeric">{total}</span> {rowLabel}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-caption text-fg-muted">
          <span id="luc-table-page-size">Rows per page</span>
          <Select
            size="sm"
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[4.75rem]" aria-labelledby="luc-table-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent size="sm">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <PageButton
            label="First page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.firstPage()}
          >
            <RiArrowLeftDoubleLine aria-hidden="true" className="size-3.5" />
          </PageButton>
          <PageButton
            label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <RiArrowLeftSLine aria-hidden="true" className="size-3.5" />
          </PageButton>
          <span className="px-1.5 text-caption text-fg-secondary luc-numeric">
            {pageCount > 0 ? pageIndex + 1 : 0} / {Math.max(pageCount, 0)}
          </span>
          <PageButton label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <RiArrowRightSLine aria-hidden="true" className="size-3.5" />
          </PageButton>
          <PageButton
            label="Last page"
            disabled={!table.getCanLastPage()}
            onClick={() => table.lastPage()}
          >
            <RiArrowRightDoubleLine aria-hidden="true" className="size-3.5" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}
