import { DataTableDensity, DataTableFeatureSet } from "./types.js";
import { RowData, useTable } from "@tanstack/react-table";
//#region src/table/context.d.ts
/**
 * The table instance with Luc UI's feature set bound. `TSelected` defaults to the
 * full state, matching how `DataTable` subscribes.
 */
export type DataTableInstance<TData extends RowData> = ReturnType<typeof useTable<DataTableFeatureSet, TData>>;
export interface DataTableContextValue<TData extends RowData> {
  table: DataTableInstance<TData>;
  density: DataTableDensity;
  stickyHeader: boolean;
  /** Rows currently rendered, i.e. page size times page index. */
  visibleRowCount: number;
}
export declare const DataTableContext: import("react").Context<DataTableContextValue<RowData> | null>;
/**
 * Access the owning `DataTable` from a toolbar, facet filter, column menu or
 * pagination footer. Throws outside a table so a misplaced control fails loudly
 * in development instead of silently doing nothing.
 */
export declare function useDataTable<TData extends RowData = RowData>(): DataTableContextValue<TData>;
/** Optional variant for components that also stand alone. */
export declare function useOptionalDataTable<TData extends RowData = RowData>(): DataTableContextValue<TData> | null;
//#endregion
//# sourceMappingURL=context.d.ts.map