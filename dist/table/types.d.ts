import { ColumnDef, RowData } from "@tanstack/react-table";
//#region src/table/types.d.ts
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
export declare const dataTableFeatures: {
  rowSortingFeature: import("@tanstack/react-table").TableFeature;
  columnFilteringFeature: import("@tanstack/react-table").TableFeature;
  globalFilteringFeature: import("@tanstack/react-table").TableFeature;
  columnFacetingFeature: import("@tanstack/react-table").TableFeature;
  rowPaginationFeature: import("@tanstack/react-table").TableFeature;
  rowSelectionFeature: import("@tanstack/react-table").TableFeature;
  rowExpandingFeature: import("@tanstack/react-table").TableFeature;
  columnVisibilityFeature: import("@tanstack/react-table").TableFeature;
  columnOrderingFeature: import("@tanstack/react-table").TableFeature;
  columnPinningFeature: import("@tanstack/react-table").TableFeature;
  columnSizingFeature: import("@tanstack/react-table").TableFeature;
  filteredRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
  sortedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
  paginatedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
  expandedRowModel: (table: import("@tanstack/react-table").Table<any, any>) => () => import("@tanstack/react-table").RowModel<any, any>;
  facetedRowModel: (table: import("@tanstack/react-table").Table<any, any>, columnId: string) => () => import("@tanstack/react-table").RowModel<any, any>;
  facetedUniqueValues: (table: import("@tanstack/react-table").Table<import("@tanstack/react-table").TableFeatures, any>, columnId: string) => () => Map<any, number>;
  filterFns: {
    arrIncludes: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    arrIncludesAll: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    arrHas: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    arrIncludesSome: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    between: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    betweenInclusive: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    empty: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    endsWith: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    equals: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    equalsString: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    equalsStringSensitive: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    inDateRange: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    inNumberRange: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    includesString: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    includesStringSensitive: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    notEmpty: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    startsWith: import("@tanstack/react-table").CreatedFilterFn<any, any>;
    weakEquals: import("@tanstack/react-table").CreatedFilterFn<any, any>;
  };
  sortFns: {
    alphanumeric: import("@tanstack/react-table").CreatedSortFn<any, any>;
    alphanumericCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
    basic: import("@tanstack/react-table").CreatedSortFn<any, any>;
    datetime: import("@tanstack/react-table").CreatedSortFn<any, any>;
    text: import("@tanstack/react-table").CreatedSortFn<any, any>;
    textCaseSensitive: import("@tanstack/react-table").CreatedSortFn<any, any>;
  };
  columnMeta: DataTableColumnMeta;
};
export type DataTableFeatureSet = typeof dataTableFeatures;
/** A column definition bound to LUC's feature set. */
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatureSet, TData, unknown>;
export type DataTableDensity = "compact" | "comfortable";
export type DataTableState = "ready" | "loading" | "empty" | "error";
//#endregion
//# sourceMappingURL=types.d.ts.map