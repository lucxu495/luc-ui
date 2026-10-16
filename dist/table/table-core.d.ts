import { DataTableColumn } from "./types.js";
import { ColumnFiltersState, ColumnPinningState, ColumnVisibilityState, ExpandedState, PaginationState, RowData, RowSelectionState, SortingState } from "@tanstack/react-table";
//#region src/table/table-core.d.ts
/**
 * The data half of a table: state, columns and the TanStack instance.
 *
 * `DataTable` and `VirtualDataTable` differ only in how they paint rows, so
 * they share this. That keeps a controllable-state contract from drifting
 * between the two — a bug fixed here is fixed in both.
 */
export interface DataTableCoreProps<TData extends RowData> {
  columns: ReadonlyArray<DataTableColumn<TData>>;
  data: TData[];
  /** Stable row identity. Required for selection to survive sorting/filtering. */
  getRowId?: (row: TData, index: number) => string;
  sorting?: SortingState;
  defaultSorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  defaultColumnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  globalFilter?: string;
  defaultGlobalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  rowSelection?: RowSelectionState;
  defaultRowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  columnVisibility?: ColumnVisibilityState;
  defaultColumnVisibility?: ColumnVisibilityState;
  onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void;
  columnPinning?: ColumnPinningState;
  defaultColumnPinning?: ColumnPinningState;
  onColumnPinningChange?: (pinning: ColumnPinningState) => void;
  expanded?: ExpandedState;
  defaultExpanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;
  pagination?: PaginationState;
  defaultPagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGlobalFilter?: boolean;
  /** Adds a leading checkbox column. `"single"` restricts to one row. */
  enableRowSelection?: boolean | "single";
  enableExpansion?: boolean;
  enableColumnVisibility?: boolean;
  /** Default page size when the caller does not control pagination. */
  pageSize?: number;
  /** Server-side modes: the table stops slicing and expects prepared data. */
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  /** Total pages / rows known to the server. */
  pageCount?: number;
  rowCount?: number;
}
//#endregion
//# sourceMappingURL=table-core.d.ts.map