"use client";

import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
  RiMoreLine,
} from "@remixicon/react";
import { cn } from "../utils/cn";
import { formatNumber } from "../utils/format";

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

export interface PaginationProps
  extends Omit<React.ComponentPropsWithRef<"nav">, "onChange" | "children"> {
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
export function paginationWindow(page: number, pageCount: number, siblings = 1): PageToken[] {
  const total = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const radius = Math.max(0, siblings);
  const first = Math.max(2, current - radius);
  const last = Math.min(total - 1, current + radius);

  const tokens: PageToken[] = [1];
  if (first > 2) tokens.push("start-gap");
  for (let index = first; index <= last; index += 1) tokens.push(index);
  if (last < total - 1) tokens.push("end-gap");
  if (total > 1) tokens.push(total);
  return tokens;
}

function pageButtonClass(active: boolean) {
  return cn(
    "inline-flex h-control-sm min-w-8 items-center justify-center rounded-md px-2 text-label luc-numeric",
    "cursor-pointer select-none luc-transition luc-focus luc-press",
    active
      ? "border border-line-accent bg-surface-selected text-fg-accent shadow-[var(--elevation-rest),var(--glow-subtle)]"
      : "border border-transparent text-fg-secondary hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest",
  );
}

export function Pagination({
  className,
  page,
  pageCount,
  siblings = 1,
  edges = true,
  compact = false,
  onPageChange,
  label = "Pagination",
  previousLabel = "Previous",
  nextLabel = "Next",
  ...props
}: PaginationProps) {
  const total = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const tokens = paginationWindow(current, total, siblings);

  const go = (next: number) => {
    const target = Math.min(Math.max(1, next), total);
    if (target !== current) onPageChange?.(target);
  };

  return (
    <nav
      data-slot="pagination"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1", className)}
      {...props}
    >
      {edges ? (
        <button
          type="button"
          data-slot="pagination-first"
          aria-label="First page"
          disabled={current <= 1}
          onClick={() => go(1)}
          className={cn(
            "inline-flex h-control-sm items-center justify-center rounded-md border border-transparent px-1.5 text-fg-secondary",
            "cursor-pointer luc-transition luc-focus luc-press",
            "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest",
            "disabled:pointer-events-none disabled:text-fg-disabled",
          )}
        >
          <RiArrowLeftDoubleLine aria-hidden="true" className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        data-slot="pagination-previous"
        aria-label={previousLabel}
        disabled={current <= 1}
        onClick={() => go(current - 1)}
        className={cn(
          "inline-flex h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-label text-fg-secondary",
          "cursor-pointer luc-transition luc-focus luc-press",
          "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest",
          "disabled:pointer-events-none disabled:text-fg-disabled",
        )}
      >
        <RiArrowLeftSLine aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </button>

      {compact ? (
        <span data-slot="pagination-compact-status" className="px-2 text-label text-fg-secondary luc-numeric">
          {current} / {total}
        </span>
      ) : (
        <ul className="flex items-center gap-1">
          {tokens.map((token) =>
            typeof token === "number" ? (
              <li key={token}>
                <button
                  type="button"
                  aria-label={`Page ${token}`}
                  aria-current={token === current ? "page" : undefined}
                  onClick={() => go(token)}
                  className={pageButtonClass(token === current)}
                >
                  {token}
                </button>
              </li>
            ) : (
              <li key={token} aria-hidden="true" className="px-1 text-fg-muted">
                <RiMoreLine className="size-4" />
              </li>
            ),
          )}
        </ul>
      )}

      <button
        type="button"
        data-slot="pagination-next"
        aria-label={nextLabel}
        disabled={current >= total}
        onClick={() => go(current + 1)}
        className={cn(
          "inline-flex h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-label text-fg-secondary",
          "cursor-pointer luc-transition luc-focus luc-press",
          "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest",
          "disabled:pointer-events-none disabled:text-fg-disabled",
        )}
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <RiArrowRightSLine aria-hidden="true" className="size-4" />
      </button>

      {edges ? (
        <button
          type="button"
          data-slot="pagination-last"
          aria-label="Last page"
          disabled={current >= total}
          onClick={() => go(total)}
          className={cn(
            "inline-flex h-control-sm items-center justify-center rounded-md border border-transparent px-1.5 text-fg-secondary",
            "cursor-pointer luc-transition luc-focus luc-press",
            "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest",
            "disabled:pointer-events-none disabled:text-fg-disabled",
          )}
        >
          <RiArrowRightDoubleLine aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </nav>
  );
}

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
export function PaginationSummary({
  className,
  from,
  to,
  total,
  unit = "results",
  ...props
}: PaginationSummaryProps) {
  return (
    <p
      data-slot="pagination-summary"
      className={cn("text-caption text-fg-muted luc-numeric", className)}
      {...props}
    >
      {/* `formatNumber` is locale-fixed on purpose: a summary rendered on the
          server and re-rendered in a zh-CN browser must not group differently. */}
      {total === 0 ? (
        <>No {unit}</>
      ) : (
        <>
          <span className="text-fg-secondary">
            {formatNumber(from)}–{formatNumber(to)}
          </span>{" "}
          of {formatNumber(total)} {unit}
        </>
      )}
    </p>
  );
}
