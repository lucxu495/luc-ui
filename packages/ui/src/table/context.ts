"use client";

import { createContext, useContext } from "react";
import type { RowData } from "@tanstack/react-table";
import type { useTable } from "@tanstack/react-table";
import type { DataTableDensity, DataTableFeatureSet } from "./types";

/**
 * The table instance with LUC's feature set bound. `TSelected` defaults to the
 * full state, matching how `DataTable` subscribes.
 */
export type DataTableInstance<TData extends RowData> = ReturnType<
  typeof useTable<DataTableFeatureSet, TData>
>;

export interface DataTableContextValue<TData extends RowData> {
  table: DataTableInstance<TData>;
  density: DataTableDensity;
  stickyHeader: boolean;
  /** Rows currently rendered, i.e. page size times page index. */
  visibleRowCount: number;
}

export const DataTableContext = createContext<DataTableContextValue<RowData> | null>(null);

/**
 * Access the owning `DataTable` from a toolbar, facet filter, column menu or
 * pagination footer. Throws outside a table so a misplaced control fails loudly
 * in development instead of silently doing nothing.
 */
export function useDataTable<TData extends RowData = RowData>(): DataTableContextValue<TData> {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error("useDataTable must be used inside <DataTable> from @luc/ui.");
  }
  return context as DataTableContextValue<TData>;
}

/** Optional variant for components that also stand alone. */
export function useOptionalDataTable<TData extends RowData = RowData>(): DataTableContextValue<TData> | null {
  return useContext(DataTableContext) as DataTableContextValue<TData> | null;
}
