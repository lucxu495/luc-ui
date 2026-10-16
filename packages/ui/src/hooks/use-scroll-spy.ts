"use client";

import { useEffect, useRef, useState } from "react";

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
export function resolveActiveTarget(state: ActiveTargetState): string | null {
  const { targets, readingOffset } = state;
  if (targets.length === 0) return null;
  const scrollableSlack = state.scrollableSlack ?? 8;
  const bottomSlack = state.bottomSlack ?? 4;
  const primary = targets.filter((target) => target.primary);
  const pool = primary.length > 0 ? primary : targets;
  /*
   * A section can lay its cards out in rows (a tall chart beside a short
   * snapshot), so the navigator's order and the *vertical* order differ. The
   * reading line is a position on the page, so it is answered against the
   * positions — sorted by top, ties keeping document order. The sorted list is a
   * copy; the caller's order is never touched.
   */
  const ordered = [...pool].sort((left, right) => left.top - right.top);
  const scrollable = state.documentHeight - state.viewportHeight;
  if (scrollable > scrollableSlack && state.scrollY >= scrollable - bottomSlack) {
    return ordered[ordered.length - 1]?.id ?? null;
  }
  const line = state.scrollY + readingOffset;
  let active: string | null = null;
  for (const target of ordered) {
    if (target.top > line) break;
    active = target.id;
  }
  return active ?? ordered[0]?.id ?? null;
}

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

/** The sticky chrome's own height, so the reading line sits below it. */
function stickyHeaderHeight(): number {
  if (typeof window === "undefined") return 0;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--shell-topbar-height");
  const parsed = Number.parseFloat(value);
  // `--shell-topbar-height` is a rem value; the computed custom property is the
  // raw token, so convert it against the root font size.
  if (Number.isFinite(parsed)) {
    return value.trim().endsWith("rem")
      ? parsed * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
      : parsed;
  }
  return 64;
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
export function useScrollSpy(ids: readonly string[], options: UseScrollSpyOptions = {}): ScrollSpy {
  const { attribute = "data-anchor-id", primaryIds, readingOffset = 56, lockMs = 1600 } = options;
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);
  const lockUntil = useRef(0);
  const targets = useRef<readonly ScrollSpyTarget[]>([]);
  // A stable key so the effect re-subscribes only on a real change, not on a new
  // array identity with the same contents.
  const key = ids.join("\u0000");
  const primaryKey = (primaryIds ?? []).join("\u0000");

  useEffect(() => {
    if (ids.length === 0) return;
    const primary = new Set(primaryIds ?? ids);
    let disposed = false;
    let measureTimer: ReturnType<typeof setTimeout> | undefined;
    let scrollFrame = 0;

    /** Document-space offsets for every anchor currently in the document. */
    const measure = () => {
      const live: ScrollSpyTarget[] = [];
      for (const id of ids) {
        const node = document.querySelector(`[${attribute}="${CSS.escape(id)}"]`);
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        live.push({ id, top: rect.top + window.scrollY, primary: primary.has(id) });
      }
      targets.current = live;
    };

    const reconcile = () => {
      if (Date.now() < lockUntil.current) return;
      const next = resolveActiveTarget({
        targets: targets.current,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        readingOffset: stickyHeaderHeight() + readingOffset,
      });
      if (next) setActiveId(next);
    };

    /** A scroll is pure arithmetic; it never measures, so it never thrashes. */
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        reconcile();
      });
    };

    /**
     * Re-measure, then reconcile. Debounced: a streamed domain produces a burst
     * of mutations, and one measurement per burst is enough — the offsets are
     * only wrong while the layout is still moving.
     */
    const resync = (immediate = false) => {
      if (disposed) return;
      if (immediate) {
        measure();
        reconcile();
        return;
      }
      if (measureTimer) clearTimeout(measureTimer);
      measureTimer = setTimeout(() => {
        measureTimer = undefined;
        requestAnimationFrame(() => {
          if (disposed) return;
          measure();
          reconcile();
        });
      }, 100);
    };

    resync(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => resync(true));
    window.addEventListener("load", () => resync());
    // A lazily composed report replaces anchor nodes as sections stream in, and a
    // chart changes its own box as it lays out: re-measure on mutation.
    const mutations =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => resync());
    mutations?.observe(document.documentElement, { childList: true, subtree: true });
    /*
     * The observer's *entries* are not the decision (the reading line is), but a
     * new intersection is a cheap, coalesced signal that something in the layout
     * moved — which is the moment to re-measure rather than trust stale offsets.
     */
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(() => resync(), { threshold: [0, 0.25, 0.5, 1] });
    if (observer) {
      for (const id of ids) {
        for (const node of document.querySelectorAll(`[${attribute}="${CSS.escape(id)}"]`)) {
          observer.observe(node);
        }
      }
    }
    // Web fonts settle after first paint and shift every card below them.
    if (typeof document.fonts?.ready?.then === "function") {
      void document.fonts.ready.then(() => resync()).catch(() => undefined);
    }

    return () => {
      disposed = true;
      if (measureTimer) clearTimeout(measureTimer);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      observer?.disconnect();
      mutations?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // `key`/`primaryKey` are the content-stable identities of the id sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, primaryKey, attribute, readingOffset]);

  return {
    activeId,
    lock: (id: string, holdMs?: number) => {
      lockUntil.current = Date.now() + (holdMs ?? lockMs);
      setActiveId(id);
    },
    release: () => {
      lockUntil.current = 0;
    },
  };
}
