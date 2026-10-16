"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { RowData } from "@tanstack/react-table";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { DataTableContext, type DataTableInstance } from "./context";
import { TableHead, pinnedCellClass, pinnedStyle } from "./pieces";
import { RowFragment } from "./row-fragment";
import { useDataTableCore, type DataTableCoreProps } from "./table-core";
import type { DataTableDensity, DataTableState } from "./types";

/**
 * Opt-in virtualisation.
 *
 * Only reach for this when the row count makes the DOM, not the data, the
 * bottleneck — thousands of rows, not twenty. Normal tables stay a plain
 * semantic `<table>`; here the *visible* rows are still real `<tr>` elements,
 * spaced by two hidden spacer rows, so the table keeps its structure instead of
 * degrading into absolutely-positioned divs.
 *
 * Row expansion is deliberately unsupported: an expanded strip would break the
 * fixed-height measurement this depends on.
 */

export interface VirtualDataTableProps<TData extends RowData>
  extends Omit<DataTableCoreProps<TData>, "enableExpansion" | "expanded" | "defaultExpanded" | "onExpandedChange"> {
  ariaLabel: string;
  ariaDescription?: string;
  caption?: ReactNode;
  state?: DataTableState;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  density?: DataTableDensity;
  /** Row height in pixels. Must match the rendered row for correct scrolling. */
  rowHeight?: number;
  /** Rows rendered beyond the viewport. 12 is smooth without wasting frames. */
  overscan?: number;
  /** Viewport height of the scroll area. Default `32rem`. */
  height?: number | string;
  /** Sticky headers are the point of a virtual table; on by default. */
  stickyHeader?: boolean;
  showColumnBorders?: boolean;
  toolbar?: ReactNode;
  footer?: ReactNode;
  onRowClick?: (row: TData) => void;
  /** Reports how many rows are actually in the DOM, for honest status text. */
  onRenderedRowCountChange?: (count: number) => void;
  className?: string;
}

export function VirtualDataTable<TData extends RowData>({
  ariaLabel,
  ariaDescription,
  caption,
  state: tableState = "ready",
  emptyState,
  errorState,
  density = "comfortable",
  rowHeight,
  overscan = 12,
  height = "32rem",
  stickyHeader = true,
  showColumnBorders = false,
  toolbar,
  footer,
  onRowClick,
  onRenderedRowCountChange,
  className,
  ...core
}: VirtualDataTableProps<TData>) {
  const table = useDataTableCore<TData>({ ...core, enableExpansion: false });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(table.getVisibleLeafColumns().length, 1);
  const estimate = rowHeight ?? (density === "compact" ? 32 : 40);

  // TanStack Virtual hands back non-memoizable refs by design; the compiler note
  // is expected and the component opts out of memoisation for that reason.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimate,
    overscan,
  });

  const items = virtualizer.getVirtualItems();
  const first = items[0];
  const last = items[items.length - 1];
  const paddingTop = first ? first.start : 0;
  const paddingBottom = last ? virtualizer.getTotalSize() - last.end : 0;

  useEffect(() => {
    onRenderedRowCountChange?.(items.length);
  }, [items.length, onRenderedRowCountChange]);

  const interactive = Boolean(onRowClick);
  const isEmpty = tableState === "empty" || tableState === "error" || rows.length === 0;

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
        data-virtualized="true"
        className={cn("flex min-w-0 flex-col", className)}
      >
        {toolbar}
        <div
          ref={scrollRef}
          data-slot="data-table-scroll"
          style={{ height }}
          className="relative min-h-0 overflow-auto overscroll-x-contain isolate rounded-lg border border-line-subtle bg-surface-default"
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
            <tbody>
              {isEmpty ? (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {tableState === "error"
                        ? (errorState ?? (
                            <>
                              <p className="text-label font-medium text-fg-primary">Could not load rows</p>
                              <p className="text-caption text-fg-muted">The request failed.</p>
                            </>
                          ))
                        : (emptyState ?? (
                            <>
                              <p className="text-label font-medium text-fg-primary">No rows</p>
                              <p className="text-caption text-fg-muted">Nothing matches the current filters.</p>
                            </>
                          ))}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paddingTop > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={columnCount} style={{ height: paddingTop, padding: 0 }} />
                    </tr>
                  ) : null}
                  {items.map((item) => {
                    const row = rows[item.index];
                    if (!row) return null;
                    return (
                      <RowFragment
                        key={row.id}
                        row={row}
                        density={density}
                        interactive={interactive}
                        showColumnBorders={showColumnBorders}
                        pinnedCellClass={pinnedCellClass}
                        pinnedStyle={pinnedStyle}
                        onRowClick={onRowClick}
                        rowHeight={estimate}
                      />
                    );
                  })}
                  {paddingBottom > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={columnCount} style={{ height: paddingBottom, padding: 0 }} />
                    </tr>
                  ) : null}
                </>
              )}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    </DataTableContext.Provider>
  );
}
