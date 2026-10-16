import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

/** Where a cell's content sits. Numeric columns are right-aligned by rule. */
export type ColumnAlign = "left" | "right" | "center";

/**
 * LUC column metadata. Declared through the `columnMeta` type slot below, so
 * `column.columnDef.meta?.align` is typed everywhere instead of `any`.
 */
export interface DataTableColumnMeta {
  align?: ColumnAlign;
  /** Tabular figures and a numeric type scale. Set automatically by `numericColumn`. */
  numeric?: boolean;
  /** Human label for menus; falls back to the header when it is a string. */
  label?: string;
  /** Column cannot be hidden — e.g. the identifier column of a research table. */
  locked?: boolean;
  /** Sticky edge for pinned columns. */
  pin?: "start" | "end";
  headerClassName?: string;
  cellClassName?: string;
}

/**
 * The feature set every LUC DataTable is built from.
 *
 * Declared once, at module scope, so the features are shared between instances
 * (TanStack's recommendation) and the row models are tree-shaken to exactly the
 * ones we render: filter → sort → expand → paginate.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filterFns,
  sortFns,
  columnMeta: {} as DataTableColumnMeta,
});

export type DataTableFeatureSet = typeof dataTableFeatures;

/** A column definition bound to LUC's feature set. */
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatureSet, TData, unknown>;

export type DataTableDensity = "compact" | "comfortable";

export type DataTableState = "ready" | "loading" | "empty" | "error";
