import { DataTableDensity, DataTableState } from "./types.js";
import { DataTableCoreProps } from "./table-core.js";
import { ReactNode } from "react";
import { RowData } from "@tanstack/react-table";
//#region src/table/data-table.d.ts
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
export declare function DataTable<TData extends RowData>({ ariaLabel, ariaDescription, caption, state: tableState, loadingRows, emptyState, errorState, density, stickyHeader, maxHeight, showColumnBorders, toolbar, footer, renderSubRow, onRowClick, rowClassName, className, scrollClassName, ...core }: DataTableProps<TData>): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=data-table.d.ts.map