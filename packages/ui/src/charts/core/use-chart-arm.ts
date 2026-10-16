"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Arm an engine-backed surface **when it is worth the main thread**.
 *
 * A research domain mounts twenty to forty chart surfaces at once — a valuation
 * page is 45 canvases — and every one of them creates its engine in an effect.
 * That work is real, but most of it is for charts the reader cannot see yet, and
 * it lands in exactly the window where the reader is waiting for the page in
 * front of them to become usable.
 *
 * So a surface arms in one of two ways:
 *
 * - **by proximity** — an `IntersectionObserver` with a generous margin arms it
 *   as soon as it is within about one screen of the viewport, so scrolling never
 *   waits for an engine;
 * - **by idle** — a surface that is *close* but not yet inside that margin joins
 *   a module-level queue that arms **one engine per idle period**. A single
 *   engine's `init` + `setOption` is not resumable, so a time-budget loop could
 *   not split it; one per callback is the granularity that actually keeps the
 *   main thread painting between charts.
 *
 * A surface **far** below the fold is not queued at all. `CHART_ARM_MARGIN_PX`
 * proximity already covers "about to scroll into view", and building an engine
 * five screens away buys the reader nothing while costing the main thread they
 * are reading on: a valuation domain has 46 canvases, and a trace of one
 * navigation shows the thread saturated from first paint to ~5 s when every one
 * of them is built regardless of where the reader is. Such a surface arms on
 * approach instead — the placeholder keeps its height, so nothing shifts.
 *
 * Nothing is skipped and nothing is truncated: every mounted surface arms, the
 * queue simply decides *when*. Callers that must be ready immediately (a hero
 * chart, or any surface the reader is already looking at) get that for free from
 * the proximity path, and a caller can bypass the gate entirely.
 *
 * The queue is module-level on purpose: twenty surfaces share one drain loop, so
 * the cost is spread evenly rather than each surface scheduling its own work.
 */

/** How far outside the viewport a surface still arms immediately. */
export const CHART_ARM_MARGIN_PX = 900;

/**
 * How far outside the viewport a surface still joins the idle queue.
 *
 * Beyond this it arms on approach only. Expressed in viewport heights because
 * the question is "how far is the reader from scrolling here?", not a pixel
 * distance that a tall monitor changes the meaning of.
 */
export const CHART_ARM_PREFETCH_SCREENS = 3;

/**
 * The longest a queued surface waits for an idle period.
 *
 * A busy main thread must not starve the queue: after this, the browser runs the
 * callback regardless of idle time. It is the backstop that keeps every chart
 * present on a page that is never idle.
 */
export const CHART_ARM_IDLE_TIMEOUT_MS = 600;

const queue: Array<() => void> = [];
let draining = false;

interface IdleDeadlineLike {
  timeRemaining?: () => number;
}

function scheduleIdle(callback: (deadline?: IdleDeadlineLike) => void): void {
  const requestIdle = (
    globalThis as unknown as {
      requestIdleCallback?: (cb: (deadline?: IdleDeadlineLike) => void, options?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof requestIdle === "function") {
    requestIdle(callback, { timeout: CHART_ARM_IDLE_TIMEOUT_MS });
    return;
  }
  // No idle API (older browsers, jsdom): arm on the next macrotask instead of
  // leaving the surface un-armed forever.
  setTimeout(() => callback(undefined), 0);
}

function drain(): void {
  const next = queue.shift();
  if (next) next();
  if (queue.length > 0) {
    scheduleIdle(drain);
  } else {
    draining = false;
  }
}

function enqueueArm(arm: () => void): void {
  queue.push(arm);
  if (draining) return;
  draining = true;
  scheduleIdle(drain);
}

/** Is this host close enough to be worth building before it is approached? */
export function isWithinPrefetchBand(host: Element): boolean {
  const viewport = globalThis.innerHeight || 0;
  if (viewport <= 0) return true;
  const rect = host.getBoundingClientRect();
  const band = viewport * CHART_ARM_PREFETCH_SCREENS;
  return rect.top < viewport + band && rect.bottom > -band;
}

/** Test seam: how many surfaces are still waiting for their idle slot. */
export function pendingChartArms(): number {
  return queue.length;
}

/**
 * `true` once this element's chart engine may be created.
 *
 * `enabled = false` arms immediately — the escape hatch for a surface whose
 * caller knows it must be ready without an idle period.
 */
export function useChartArm(
  ref: RefObject<Element | null>,
  enabled = true,
): boolean {
  const [armed, setArmed] = useState(!enabled);

  useEffect(() => {
    if (!enabled || armed) return;
    const host = ref.current;
    if (!host || typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setArmed(true);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          arm();
        }
      },
      { rootMargin: `${CHART_ARM_MARGIN_PX}px 0px ${CHART_ARM_MARGIN_PX}px 0px` },
    );
    observer.observe(host);
    // The idle queue is for the near band only — see the module note.
    if (isWithinPrefetchBand(host)) {
      enqueueArm(() => {
        observer.disconnect();
        arm();
      });
    }
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [armed, enabled, ref]);

  return armed;
}
