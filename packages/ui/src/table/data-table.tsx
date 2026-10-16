"use client";

import type { RowData } from "@tanstack/react-table";
import { useMemo, type ReactNode } from "react";
import { Skeleton } from "../components/skeleton";
import { cn } from "../utils/cn";
import { DataTableContext, type DataTableInstance } from "./context";
import { TableHead, densityCell, densityRow, pinnedCellClass, pinnedStyle } from "./pieces";
import { RowFragment } from "./row-fragment";
import { useDataTableCore, type DataTableCoreProps } from "./table-core";
import type { DataTableDensity, DataTableState } from "./types";

/**
 * LUC DataTable.
 *
 * A *table*, not a spreadsheet: real `table/thead/tbody/tr/th/td` semantics, so
 * screen readers and browser find-in-page both work. Cell editing, fill handles
 * and range copy belong to a future DataGrid; see DESIGN_SYSTEM.md.
 *
 * TanStack Table supplies sorting, filtering, faceting, selection, expansion,
 * visibility, pinning, sizing and pagination as headless state. Everything the
 * reader sees — row rhythm, numeric alignment, header hierarchy, hover, sticky
 * behaviour, loading/empty/error — is LUC's.
 *
 * Every state slice is controllable: pass `sorting` + `onSortingChange` (or
 * `pagination` + `onPaginationChange`) and the table stops owning it, which is
 * exactly what a server-sorted, server-paged screen needs. Nothing here
 * fetches anything.
 */

export interface DataTableProps<TData extends RowData> extends DataTableCoreProps<TData> {
  /** Accessible name for the table. Required — an unnamed table is a defect. */
  ariaLabel: string;
  /** Longer description announced with the table. */
  ariaDescription?: string;
  caption?: ReactNode;

  /** `loading` and `error` replace the body; `empty` covers zero filtered rows. */
  state?: DataTableState;
  loadingRows?: number;
  emptyState?: ReactNode;
  errorState?: ReactNode;

  density?: DataTableDensity;
  stickyHeader?: boolean;
  /** Constrains the scroll area, which is what makes a sticky header useful. */
  maxHeight?: number | string;
  /** Vertical rules between cells. Off by default — hairlines beat a grid. */
  showColumnBorders?: boolean;

  /** Rendered inside the table context, above the scroll area. */
  toolbar?: ReactNode;
  /** Rendered inside the table context, below the scroll area. */
  footer?: ReactNode;
  /** Expanded row content. Keep it short; this is a detail strip, not a page. */
  renderSubRow?: (row: TData) => ReactNode;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;

  className?: string;
  scrollClassName?: string;
}

export function DataTable<TData extends RowData>({
  ariaLabel,
  ariaDescription,
  caption,
  state: tableState = "ready",
  loadingRows = 8,
  emptyState,
  errorState,
  density = "comfortable",
  stickyHeader = false,
  maxHeight,
  showColumnBorders = false,
  toolbar,
  footer,
  renderSubRow,
  onRowClick,
  rowClassName,
  className,
  scrollClassName,
  ...core
}: DataTableProps<TData>) {
  const table = useDataTableCore<TData>(core);
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;
  const interactive = Boolean(onRowClick);

  const body = useMemo(() => {
    if (tableState === "loading") {
      return Array.from({ length: loadingRows }).map((_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`} className={densityRow[density]}>
          {table.getVisibleLeafColumns().map((column) => (
            <td key={column.id} className={densityCell[density]}>
              <Skeleton className="h-3.5 w-full max-w-[7rem]" />
            </td>
          ))}
        </tr>
      ));
    }

    if (tableState === "error" || tableState === "empty" || rows.length === 0) {
      return (
        <tr>
          <td colSpan={Math.max(columnCount, 1)} className="px-4 py-12">
            <div className="flex flex-col items-center gap-1.5 text-center">
              {tableState === "error"
                ? (errorState ?? (
                    <>
                      <p className="text-label font-medium text-fg-primary">Could not load rows</p>
                      <p className="max-w-[32rem] text-caption text-fg-muted">
                        The request failed. Retry, or widen the filters above.
                      </p>
                    </>
                  ))
                : (emptyState ?? (
                    <>
                      <p className="text-label font-medium text-fg-primary">No rows</p>
                      <p className="max-w-[32rem] text-caption text-fg-muted">
                        Nothing matches the current filters.
                      </p>
                    </>
                  ))}
            </div>
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <RowFragment
        key={row.id}
        row={row}
        density={density}
        interactive={interactive}
        showColumnBorders={showColumnBorders}
        pinnedCellClass={pinnedCellClass}
        pinnedStyle={pinnedStyle}
        renderSubRow={renderSubRow}
        rowClassName={rowClassName}
        onRowClick={onRowClick}
      />
    ));
  }, [
    columnCount,
    density,
    emptyState,
    errorState,
    interactive,
    loadingRows,
    onRowClick,
    renderSubRow,
    rowClassName,
    rows,
    showColumnBorders,
    table,
    tableState,
  ]);

  return (
    <DataTableContext.Provider
      value={{
        table: table as unknown as DataTableInstance<RowData>,
        density,
        stickyHeader,
        visibleRowCount: rows.length,
      }}
    >
      <div
        data-slot="data-table"
        className={cn("flex min-w-0 flex-col", className)}
      >
        {toolbar}
        <div
          data-slot="data-table-scroll"
          style={maxHeight !== undefined ? { maxHeight } : undefined}
          className={cn(
            "relative min-h-0 overflow-auto overscroll-x-contain",
            // Local stacking context: sticky headers and pinned columns use
            // LUC's z tokens without escaping into the page's layer order.
            "isolate rounded-lg border border-line-subtle bg-surface-default",
            scrollClassName,
          )}
        >
          <table
            aria-label={ariaLabel}
            aria-busy={tableState === "loading" || undefined}
            className="w-full table-fixed border-collapse text-left"
          >
            <caption className="sr-only">{caption ?? ariaDescription ?? ariaLabel}</caption>
            <TableHead
              table={table}
              density={density}
              stickyHeader={stickyHeader}
              showColumnBorders={showColumnBorders}
            />
            <tbody>{body}</tbody>
          </table>
        </div>
        {footer}
      </div>
    </DataTableContext.Provider>
  );
}
