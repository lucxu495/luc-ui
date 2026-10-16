/**
 * LUC DataTable.
 *
 * `DataTable` for a semantic table; `VirtualDataTable` when the row count makes
 * the DOM the bottleneck. Columns are described with the formatting helpers,
 * and every piece of state is controllable for server-driven screens.
 */

export {
  DataTable,
  type DataTableProps,
} from "./data-table";
export {
  VirtualDataTable,
  type VirtualDataTableProps,
} from "./virtual-data-table";
export {
  DataTableToolbar,
  DataTableSelectionCount,
  type DataTableToolbarProps,
  type DataTableSelectionCountProps,
} from "./data-table-toolbar";
export { FacetFilter, type FacetFilterProps } from "./facet-filter";
export { ColumnVisibilityMenu, type ColumnVisibilityMenuProps } from "./column-visibility-menu";
export { DataTablePagination, type DataTablePaginationProps } from "./data-table-pagination";
export {
  booleanColumn,
  compactColumn,
  currencyColumn,
  dateColumn,
  displayColumn,
  integerColumn,
  linkColumn,
  numericColumn,
  percentColumn,
  sparklineColumn,
  statusColumn,
  textColumn,
  type BaseColumnOptions,
  type BooleanColumnOptions,
  type DataTableFilterFn,
  type DateColumnOptions,
  type DisplayColumnOptions,
  type LinkColumnOptions,
  type NumericColumnOptions,
  type SparklineColumnOptions,
  type StatusColumnOptions,
  type TextColumnOptions,
} from "./columns";
export {
  dataTableFeatures,
  type ColumnAlign,
  type DataTableColumn,
  type DataTableColumnMeta,
  type DataTableDensity,
  type DataTableFeatureSet,
  type DataTableState,
} from "./types";
export {
  DataTableContext,
  useDataTable,
  useOptionalDataTable,
  type DataTableContextValue,
  type DataTableInstance,
} from "./context";
