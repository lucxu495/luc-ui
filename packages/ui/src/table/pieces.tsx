"use client";

import { flexRender, type Column, type RowData } from "@tanstack/react-table";
import { RiArrowDownSLine, RiArrowUpDownLine, RiArrowUpSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import type { DataTableInstance } from "./context";
import type { DataTableDensity, DataTableFeatureSet } from "./types";

/**
 * Small shared pieces of the table chrome. `DataTable` and `VirtualDataTable`
 * must be indistinguishable to the reader, so the rhythm, the sort affordance
 * and the sticky/pinned surface rules live here once.
 */

export const densityRow: Record<DataTableDensity, string> = {
  compact: "h-8",
  comfortable: "h-10",
};

export const densityCell: Record<DataTableDensity, string> = {
  compact: "px-3 py-1",
  comfortable: "px-3.5 py-2",
};

export type AnyColumn<TData extends RowData = RowData> = Column<DataTableFeatureSet, TData, unknown>;

/** Sort state as one icon, not three competing chevrons. */
export function SortIndicator<TData extends RowData>({ column }: { column: AnyColumn<TData> }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <RiArrowUpSLine aria-hidden="true" className="size-3.5 text-fg-accent" />;
  if (sorted === "desc") return <RiArrowDownSLine aria-hidden="true" className="size-3.5 text-fg-accent" />;
  return (
    <RiArrowUpDownLine
      aria-hidden="true"
      className="size-3.5 text-fg-disabled luc-transition group-hover/head:text-fg-muted"
    />
  );
}

/**
 * A pinned cell is a sticky information surface, so it must stay opaque: a
 * translucent one lets scrolled content show through underneath (the chart
 * tooltip lesson, applied to tables). Hover and selection are mirrored here
 * because the row background cannot paint beneath a sticky cell.
 */
export function pinnedCellClass<TData extends RowData>(column: AnyColumn<TData>): string {
  const pinned = column.getIsPinned();
  if (!pinned) return "";
  return cn(
    "sticky z-[var(--z-raised)] bg-surface-default",
    "group-hover/row:bg-surface-interactive-hover group-data-[selected=true]/row:bg-surface-selected",
    pinned === "start" ? "border-r border-line-subtle" : "border-l border-line-subtle",
  );
}

export function pinnedStyle<TData extends RowData>(column: AnyColumn<TData>): React.CSSProperties | undefined {
  const pinned = column.getIsPinned();
  if (!pinned) return undefined;
  return pinned === "start"
    ? { left: column.getStart("start") }
    : { right: column.getAfter("end") };
}

export interface TableHeadProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  density: DataTableDensity;
  stickyHeader: boolean;
  showColumnBorders: boolean;
}

/**
 * The header row. Sorting is a real `<button>` inside a `<th scope="col">` with
 * `aria-sort`, so the affordance is keyboard reachable and announced. A column
 * that cannot sort renders as plain text — no fake clickable headers.
 */
export function TableHead<TData extends RowData>({
  table,
  density,
  stickyHeader,
  showColumnBorders,
}: TableHeadProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const column = header.column;
            const canSort = column.getCanSort();
            const meta = column.columnDef.meta;
            const sorted = column.getIsSorted();
            const pinned = column.getIsPinned();
            return (
              <th
                key={header.id}
                scope="col"
                aria-sort={
                  canSort
                    ? sorted === "asc"
                      ? "ascending"
                      : sorted === "desc"
                        ? "descending"
                        : "none"
                    : undefined
                }
                style={{ width: header.getSize(), ...pinnedStyle(column) }}
                className={cn(
                  "group/head border-b border-line-subtle text-micro font-medium text-fg-muted",
                  densityCell[density],
                  meta?.align === "right" && "text-right",
                  meta?.align === "center" && "text-center",
                  stickyHeader && "sticky top-0 z-[var(--z-sticky)] bg-surface-raised",
                  pinned &&
                    cn(
                      "sticky z-[var(--z-sticky)] bg-surface-raised",
                      pinned === "start" ? "border-r border-line-subtle" : "border-l border-line-subtle",
                    ),
                  showColumnBorders && "border-r border-line-subtle last:border-r-0",
                  meta?.headerClassName,
                )}
              >
                {header.isPlaceholder ? null : canSort ? (
                  <button
                    type="button"
                    onClick={column.getToggleSortingHandler()}
                    className={cn(
                      /*
                       * `luc-hit`: a column header's text-height button is
                       * ~19 px tall, and a header row has no vertical spacing to
                       * fall back on. The hit area reaches 24 px; the header
                       * geometry is unchanged.
                       */
                      "-mx-1 luc-hit inline-flex w-[calc(100%+0.5rem)] items-center gap-1 rounded-xs px-1 py-0.5 uppercase luc-transition",
                      "hover:bg-surface-interactive-hover hover:text-fg-secondary luc-focus-inset",
                      meta?.align === "right" && "justify-end",
                      meta?.align === "center" && "justify-center",
                      sorted && "text-fg-secondary",
                    )}
                  >
                    <span className="truncate">{flexRender(column.columnDef.header, header.getContext())}</span>
                    <SortIndicator column={column} />
                  </button>
                ) : (
                  <span className="block truncate">
                    {flexRender(column.columnDef.header, header.getContext())}
                  </span>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
