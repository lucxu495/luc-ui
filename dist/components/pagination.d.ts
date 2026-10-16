//#region src/components/pagination.d.ts
/**
 * LUC Pagination — page navigation for a collection that already knows its size.
 *
 * Deliberately table-free. `DataTablePagination` stays the table's own binding
 * (it owns the row count and the page-size select); this component is the
 * generic one, so a card grid, a search result list and a table can share one
 * paging rhythm.
 *
 * The window is computed, not guessed: the current page is parked in the middle
 * of `siblings` neighbours, and the two edges collapse into an ellipsis only
 * when they are actually far away. That is why the API takes `siblings` rather
 * than a ready-made page array — a caller that pre-computes the window would
 * have to re-derive it for every breakpoint.
 *
 * **`edges` is a pair of arrows, and it is not the last page number.**
 *
 * It used to render a second numbered control for the last page, beside the one
 * the window already emits — measuring `/components/pagination` showed the row
 * `1 … 3 4 5 … 24 24`, two controls named "Page 24" in the same sequence, one of
 * them additionally hidden below `sm`. `paginationWindow` always ends on the
 * last page (`[1, "start-gap", 3, 4, 5, "end-gap", 24]` for page 4 of 24), so
 * the numbered copy could only ever duplicate: the sequence is the way to page
 * `total`.
 *
 * What was missing was the jump, not the number. `edges` now renders the
 * first/last *arrows* — the double chevrons `DataTablePagination` already uses
 * for the same two actions, so the two pagination surfaces in the library say
 * the same thing the same way — outermost, disabled at the ends, and no page
 * number is ever printed twice.
 */
export interface PaginationProps extends Omit<React.ComponentPropsWithRef<"nav">, "onChange" | "children"> {
  /** Current page, 1-based. */
  page: number;
  /** Total pages. `0` and `1` both render a single, current page. */
  pageCount: number;
  /** Neighbours shown on each side of the current page. Default 1. */
  siblings?: number;
  /** Show first/last controls. Default `true`. */
  edges?: boolean;
  /**
   * Replaces the window with arrow controls only — for a narrow container or a
   * mobile toolbar.
   */
  compact?: boolean;
  onPageChange?: (page: number) => void;
  /** Accessible name. Every pagination landmark needs one. */
  label?: string;
  /** Text used inside the "previous" control; hidden below `sm`. */
  previousLabel?: string;
  nextLabel?: string;
}
type PageToken = number | "start-gap" | "end-gap";
/** The page window. Pure, exported and unit-tested — it is the whole component. */
export declare function paginationWindow(page: number, pageCount: number, siblings?: number): PageToken[];
export declare function Pagination({ className, page, pageCount, siblings, edges, compact, onPageChange, label, previousLabel, nextLabel, ...props }: PaginationProps): import("react").JSX.Element;
export interface PaginationSummaryProps extends React.ComponentPropsWithRef<"p"> {
  /** First row number on the current page, 1-based. */
  from: number;
  /** Last row number on the current page, 1-based. */
  to: number;
  /** Total rows. */
  total: number;
  /** Noun for the rows. Default "results". */
  unit?: string;
}
/**
 * The "showing 21–40 of 312" line. Separate from `Pagination` because the
 * summary belongs where the row count is known, which is not always where the
 * controls are.
 */
export declare function PaginationSummary({ className, from, to, total, unit, ...props }: PaginationSummaryProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=pagination.d.ts.map