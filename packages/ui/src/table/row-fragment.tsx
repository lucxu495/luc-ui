"use client";

import { flexRender, type Row, type RowData } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { densityCell, densityRow, type pinnedCellClass, type pinnedStyle } from "./pieces";
import type { DataTableDensity, DataTableFeatureSet } from "./types";

export interface RowFragmentProps<TData extends RowData> {
  row: Row<DataTableFeatureSet, TData>;
  density: DataTableDensity;
  interactive: boolean;
  showColumnBorders: boolean;
  pinnedCellClass: typeof pinnedCellClass;
  pinnedStyle: typeof pinnedStyle;
  renderSubRow?: (row: TData) => ReactNode;
  rowClassName?: (row: TData) => string | undefined;
  onRowClick?: (row: TData) => void;
  /** Fixed row height for the virtualised path so measurement cannot drift. */
  rowHeight?: number;
}

/**
 * One body row (plus its expansion strip). Kept separate from `DataTable` so
 * the virtualised table renders byte-identical rows and the two can never
 * drift into different hover, selection or alignment behaviour.
 */
export function RowFragment<TData extends RowData>({
  row,
  density,
  interactive,
  showColumnBorders,
  pinnedCellClass,
  pinnedStyle,
  renderSubRow,
  rowClassName,
  onRowClick,
  rowHeight,
}: RowFragmentProps<TData>) {
  const selected = row.getIsSelected();
  return (
    <>
      <tr
        data-selected={selected ? true : undefined}
        style={rowHeight !== undefined ? { height: rowHeight } : undefined}
        className={cn(
          "group/row border-b border-line-subtle last:border-b-0 luc-transition",
          /*
           * Rows join the spatial language with the smallest possible gesture:
           * the surface step plus the next shadow rung, no travel. A table is
           * read, not browsed — a row that moves would break column alignment
           * for every reader in the row.
           */
          "hover:bg-surface-interactive-hover hover:shadow-xs data-[selected=true]:bg-surface-selected",
          densityRow[density],
          interactive && "cursor-pointer",
          rowClassName?.(row.original),
        )}
        {...(interactive
          ? {
              tabIndex: 0,
              onClick: () => onRowClick?.(row.original),
              onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick?.(row.original);
                }
              },
            }
          : {})}
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta;
          return (
            <td
              key={cell.id}
              style={{ width: cell.column.getSize(), ...pinnedStyle(cell.column) }}
              className={cn(
                densityCell[density],
                "align-middle text-label text-fg-secondary",
                meta?.align === "right" && "text-right",
                meta?.align === "center" && "text-center",
                showColumnBorders && "border-r border-line-subtle last:border-r-0",
                pinnedCellClass(cell.column),
                meta?.cellClassName,
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
      {renderSubRow && row.getIsExpanded() ? (
        <tr className="border-b border-line-subtle bg-surface-sunken/60">
          <td colSpan={row.getVisibleCells().length} className="px-4 py-4">
            {renderSubRow(row.original)}
          </td>
        </tr>
      ) : null}
    </>
  );
}
