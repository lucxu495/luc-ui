"use client";

import {
  useTable,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ExpandedState,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Checkbox } from "../components/checkbox";
import { useControllableState } from "../hooks/use-controllable-state";
import { RiArrowRightSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { dataTableFeatures, type DataTableColumn } from "./types";

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

export function useDataTableCore<TData extends RowData>({
  columns,
  data,
  getRowId,
  sorting,
  defaultSorting,
  onSortingChange,
  columnFilters,
  defaultColumnFilters,
  onColumnFiltersChange,
  globalFilter,
  defaultGlobalFilter,
  onGlobalFilterChange,
  rowSelection,
  defaultRowSelection,
  onRowSelectionChange,
  columnVisibility,
  defaultColumnVisibility,
  onColumnVisibilityChange,
  columnPinning,
  defaultColumnPinning,
  onColumnPinningChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  pagination,
  defaultPagination,
  onPaginationChange,
  enableSorting = true,
  enableFiltering = true,
  enableGlobalFilter = true,
  enableRowSelection = false,
  enableExpansion = false,
  enableColumnVisibility = true,
  pageSize,
  manualPagination,
  manualSorting,
  manualFiltering,
  pageCount,
  rowCount,
}: DataTableCoreProps<TData>) {
  const [sortingState, setSortingState] = useControllableState<SortingState>({
    value: sorting,
    defaultValue: defaultSorting ?? [],
    onChange: onSortingChange,
  });
  const [filterState, setFilterState] = useControllableState<ColumnFiltersState>({
    value: columnFilters,
    defaultValue: defaultColumnFilters ?? [],
    onChange: onColumnFiltersChange,
  });
  const [globalFilterState, setGlobalFilterState] = useControllableState<string>({
    value: globalFilter,
    defaultValue: defaultGlobalFilter ?? "",
    onChange: onGlobalFilterChange,
  });
  const [selectionState, setSelectionState] = useControllableState<RowSelectionState>({
    value: rowSelection,
    defaultValue: defaultRowSelection ?? {},
    onChange: onRowSelectionChange,
  });
  const [visibilityState, setVisibilityState] = useControllableState<ColumnVisibilityState>({
    value: columnVisibility,
    defaultValue: defaultColumnVisibility ?? {},
    onChange: onColumnVisibilityChange,
  });
  const [pinningState, setPinningState] = useControllableState<ColumnPinningState>({
    value: columnPinning,
    defaultValue: defaultColumnPinning ?? { start: [], end: [] },
    onChange: onColumnPinningChange,
  });
  const [expandedState, setExpandedState] = useControllableState<ExpandedState>({
    value: expanded,
    defaultValue: defaultExpanded ?? {},
    onChange: onExpandedChange,
  });
  const [paginationState, setPaginationState] = useControllableState<PaginationState>({
    value: pagination,
    defaultValue: defaultPagination ?? { pageIndex: 0, pageSize: pageSize ?? 20 },
    onChange: onPaginationChange,
  });

  const selectable = enableRowSelection !== false;

  const allColumns = useMemo(() => {
    const leading: Array<DataTableColumn<TData>> = [];
    if (enableExpansion) {
      leading.push({
        id: "__expand",
        header: () => <span className="sr-only">Expand row</span>,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        size: 36,
        minSize: 36,
        maxSize: 36,
        meta: { align: "center", locked: true },
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
              aria-expanded={row.getIsExpanded()}
              onClick={row.getToggleExpandedHandler()}
              className="grid size-5 place-items-center rounded-xs text-fg-muted luc-transition hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus"
            >
              <RiArrowRightSLine
                aria-hidden="true"
                className={cn("size-4 luc-transition", row.getIsExpanded() && "rotate-90")}
              />
            </button>
          ) : null,
      } as DataTableColumn<TData>);
    }
    if (selectable) {
      leading.push({
        id: "__select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows on this page"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            disabled={table.getRowModel().rows.length === 0}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        size: 44,
        minSize: 44,
        maxSize: 44,
        meta: { align: "left", locked: true },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select row ${row.index + 1}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
          />
        ),
      } as DataTableColumn<TData>);
    }
    return [...leading, ...columns];
  }, [columns, enableExpansion, selectable]);

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data,
    ...(getRowId ? { getRowId } : {}),
    state: {
      sorting: sortingState,
      columnFilters: filterState,
      globalFilter: globalFilterState,
      rowSelection: selectionState,
      columnVisibility: visibilityState,
      columnPinning: pinningState,
      expanded: expandedState,
      pagination: paginationState,
    },
    enableSorting,
    enableFilters: enableFiltering,
    enableGlobalFilter: enableGlobalFilter && enableFiltering,
    enableRowSelection: enableRowSelection === "single" ? true : enableRowSelection,
    enableMultiRowSelection: enableRowSelection !== "single",
    enableExpanding: enableExpansion,
    // Flat row data has no `subRows`, so TanStack would report every row as
    // non-expandable. LUC expansion is a detail strip, not a tree, so any row
    // may open one.
    ...(enableExpansion ? { getRowCanExpand: () => true } : {}),
    enableColumnFilters: enableFiltering,
    enableHiding: enableColumnVisibility,
    manualPagination,
    manualSorting,
    manualFiltering,
    ...(pageCount !== undefined ? { pageCount } : {}),
    ...(rowCount !== undefined ? { rowCount } : {}),
    onSortingChange: (updater) =>
      setSortingState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onColumnFiltersChange: (updater) =>
      setFilterState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onGlobalFilterChange: (updater) =>
      setGlobalFilterState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onRowSelectionChange: (updater) =>
      setSelectionState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onColumnVisibilityChange: (updater) =>
      setVisibilityState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onColumnPinningChange: (updater) =>
      setPinningState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onExpandedChange: (updater) =>
      setExpandedState((current) => (typeof updater === "function" ? updater(current) : updater)),
    onPaginationChange: (updater) =>
      setPaginationState((current) => (typeof updater === "function" ? updater(current) : updater)),
  });

  return table;
}
