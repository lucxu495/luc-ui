import { DataTableDensity, DataTableState } from "./types.js";
import { DataTableCoreProps } from "./table-core.js";
import { ReactNode } from "react";
import { RowData } from "@tanstack/react-table";
//#region src/table/virtual-data-table.d.ts
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
export interface VirtualDataTableProps<TData extends RowData> extends Omit<DataTableCoreProps<TData>, "enableExpansion" | "expanded" | "defaultExpanded" | "onExpandedChange"> {
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
export declare function VirtualDataTable<TData extends RowData>({ ariaLabel, ariaDescription, caption, state: tableState, emptyState, errorState, density, rowHeight, overscan, height, stickyHeader, showColumnBorders, toolbar, footer, onRowClick, onRenderedRowCountChange, className, ...core }: VirtualDataTableProps<TData>): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=virtual-data-table.d.ts.map