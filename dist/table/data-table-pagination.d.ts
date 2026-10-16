//#region src/table/data-table-pagination.d.ts
/**
 * Pagination footer.
 *
 * Reads `manualPagination` / `pageCount` / `rowCount` from the table, so the
 * same footer drives a client-side table and a server-paged one — the only
 * difference is where the rows come from.
 */
export interface DataTablePaginationProps {
  className?: string;
  pageSizeOptions?: readonly number[];
  /** Noun for the rows being counted. Default `"rows"`. */
  rowLabel?: string;
}
export declare function DataTablePagination({ className, pageSizeOptions, rowLabel }: DataTablePaginationProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=data-table-pagination.d.ts.map