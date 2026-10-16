//#region src/hooks/use-scroll-spy.d.ts
/**
 * Scroll position → the id of the target the reader is looking at.
 *
 * A jump-to navigator (an outline, a table of contents, a reading rail) needs to
 * know which anchor owns the viewport as the reader scrolls. Two mechanisms
 * answer that together:
 *
 *  - a **reading line** — the sticky header's bottom plus a small offset — and a
 *    deterministic rule: the active target is the *first substantive card that
 *    has started above the line* (equivalently, the card the reader is inside,
 *    or the nearest one above it when the line falls in a gap);
 *  - cached document-space offsets, re-measured only when the document actually
 *    changes (a streamed section resolving, a resize), so the passive `scroll`
 *    listener is arithmetic on numbers it already has — never a layout read per
 *    frame and never a React update per raw scroll event.
 *
 * The decision itself is pure (`resolveActiveTarget`) so it is unit-testable and
 * a product can reuse it with its own DOM plumbing.
 *
 * Why a line and not "the largest visible ratio": a report is a stack of tall
 * cards, so the largest ratio is frequently a card *below* the one being read
 * (a short snapshot card fully in view beats the tall chart the reader is
 * looking at), and it flickers between two neighbours at their boundary. A line
 * has one answer, and it is the answer the reader would give.
 */
/** One measured reading target, in document order. */
export interface ScrollSpyTarget {
  id: string;
  /** Document-space top (`getBoundingClientRect().top + window.scrollY`). */
  top: number;
  /**
   * A **substantive** target: the metric/chart card the reader is reading.
   *
   * A section heading is context, not a reading position, so a section only wins
   * when it has no chart of its own — otherwise a heading passing the line would
   * steal the highlight from the chart the reader is actually on.
   */
  primary: boolean;
}
export interface ActiveTargetState {
  /** Targets, in document order. */
  targets: readonly ScrollSpyTarget[];
  scrollY: number;
  viewportHeight: number;
  /** `document.documentElement.scrollHeight`. */
  documentHeight: number;
  /** Distance from the viewport top that counts as the reading line. */
  readingOffset: number;
  /** Slack (px) below which a page counts as not scrollable. Default 8. */
  scrollableSlack?: number;
  /** Distance (px) from the bottom that counts as "at the bottom". Default 4. */
  bottomSlack?: number;
}
/**
 * The active target for a scroll state.
 *
 * The reading line sits below the sticky chrome. The reader is on the last
 * substantive card that started above it; before the first card reaches the line
 * the report has not begun, so the first card is the reader's place. At the very
 * bottom the last card wins even if it is too short to reach the line.
 */
export declare function resolveActiveTarget(state: ActiveTargetState): string | null;
export interface UseScrollSpyOptions {
  /** Element attribute carrying the anchor id. Default `data-anchor-id`. */
  attribute?: string;
  /**
   * The ids that are substantive reading targets (metric/chart cards).
   *
   * Defaults to every id, which makes every anchor primary. A report outline
   * passes its leaf anchors here so a section heading never outranks the chart
   * the reader is on.
   */
  primaryIds?: readonly string[];
  /** Distance (px) below the sticky header that counts as the reading line. */
  readingOffset?: number;
  /** A click on an anchor holds the highlight this long (ms) while it scrolls. */
  lockMs?: number;
}
export interface ScrollSpy {
  /** The active anchor id, or `null` before the first measurement. */
  activeId: string | null;
  /**
   * Highlight an anchor immediately (a click sets navigation *intent*, so the
   * observer must not steal the highlight back before the jump lands).
   */
  lock: (id: string, holdMs?: number) => void;
  /**
   * Hand control back to the scroll position (the jump has landed), so a stale
   * lock never keeps a card lit after the reader has scrolled on.
   */
  release: () => void;
}
/**
 * Track which of `ids` owns the viewport.
 *
 * `ids` must be stable across renders (memoize it at the call site); the hook
 * re-subscribes only when the set of anchors actually changes.
 *
 * A *streamed* page replaces an anchor's node when a Suspense boundary resolves
 * (a section placeholder swapping for the real content, which also adds the
 * metrics inside it) and every card can change its height as a chart lays out.
 * The hook therefore re-measures on mutation and on resize (and an
 * `IntersectionObserver` gives it a cheap signal that geometry moved), keeping
 * the offsets it needs for the arithmetic between measurements.
 */
export declare function useScrollSpy(ids: readonly string[], options?: UseScrollSpyOptions): ScrollSpy;
//#endregion
//# sourceMappingURL=use-scroll-spy.d.ts.map