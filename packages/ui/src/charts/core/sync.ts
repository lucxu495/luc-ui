/**
 * Chart sync groups.
 *
 * A sync group shares *normalised* interaction state between charts, whatever
 * engine draws them: a cursor x value (epoch milliseconds) and a visible range
 * (epoch milliseconds). Nothing in the public surface mentions an engine, an
 * axis pointer or a logical range — that is the point of the layer.
 *
 * Two rules keep it honest:
 *
 *  1. **Origin is explicit.** Every publish carries the publishing chart's id,
 *     and a subscriber never receives its own event back. That alone prevents
 *     the simplest feedback loop.
 *  2. **Remote application is silent.** Adapters set an `applying` flag while
 *     they push a remote value into their engine, so the engine's resulting
 *     event is not re-published. That prevents the *indirect* loop, where
 *     applying a crosshair makes the engine emit its own crosshair event.
 *  3. **A range publication carries its intent.** An engine emits a visible
 *     range for many reasons that are not a reader's choice — the initial fit, a
 *     clamp to shorter history, a resize, a series swap, a data update. An
 *     adapter therefore publishes a range **only** for a real pointer gesture on
 *     its own plate (`intent: "gesture"`), and a control publishes a preset
 *     (`intent: "preset"`). Nothing else may move a group's window; see
 *     `core/range-group.ts` for the group-owned state.
 *
 * A module-level bus is the default so that charts sharing a `syncGroup` sync
 * without a provider. `ChartSyncProvider` swaps in a scoped bus for tests or
 * for a page that must isolate two research grids.
 */

export interface ChartRangeState {
  from: number;
  to: number;
}

/**
 * Who caused a range change.
 *
 * The distinction is the whole correctness of a synchronised group, so it is
 * carried by the channel itself instead of being inferred from timing:
 *
 * - `gesture` — a reader wheeled/dragged this plate. Only the engine's own
 *   surface can report it, and only while a real pointer gesture is in flight.
 * - `preset` — a reader picked a range preset on a control. The group's
 *   controller reports it; the window is the preset's concrete window (`null`
 *   for `max`, which means "every member shows its whole loaded domain").
 * - `default` — a member's configured opening window. Never a reader's choice.
 *
 * A member's engine emitting a range for *any other* reason — an initial fit, a
 * clamp to shorter history, a resize, a series replacement, a data update, a
 * rebuild — is not an event on this channel at all. That is what stops a late
 * mount or a `fitContent()` from moving the group.
 */
export type ChartRangeIntent = "gesture" | "preset" | "default";

export interface ChartRangeMeta {
  intent: ChartRangeIntent;
  /** The preset a `preset` publication selected (`max`, `2y`, …). */
  preset?: string;
  /** The subscriber that published it. */
  originId: string;
}

export interface ChartSyncSubscriber {
  id: string;
  onCursor?: (x: number | null) => void;
  onRange?: (range: ChartRangeState | null, meta: ChartRangeMeta) => void;
}

export interface ChartSyncBus {
  subscribe(group: string, subscriber: ChartSyncSubscriber): () => void;
  publishCursor(group: string, x: number | null, originId: string): void;
  /**
   * Publish the group's window.
   *
   * `range === null` means "no explicit window": every member shows its whole
   * loaded domain. It is a real instruction (that is `max`), not a no-op, so a
   * member must apply it by fitting its own extent.
   */
  publishRange(
    group: string,
    range: ChartRangeState | null,
    originId: string,
    meta?: Omit<ChartRangeMeta, "originId">,
  ): void;
  /**
   * Pin the group's cursor at `x`, or clear the pin with `null`.
   *
   * While a pin is set, transient `publishCursor` calls are ignored, so the
   * crosshair stays where the reader clicked instead of following the pointer
   * out of the chart. The pin is delivered through the same `onCursor` channel
   * as a hover, which is why no engine needs to learn a second concept.
   */
  publishPinned(group: string, x: number | null, originId: string): void;
  getCursor(group: string): number | null;
  getRange(group: string): ChartRangeState | null;
  /** Whether the group has a published window at all (a `null` window counts). */
  hasRange(group: string): boolean;
  /** Who published the group's window and why. */
  getRangeMeta(group: string): ChartRangeMeta | null;
  getPinned(group: string): number | null;
  /** Drop every subscriber. Used by tests. */
  reset(): void;
}

/**
 * Normalise a cursor value to epoch milliseconds.
 *
 * Engines disagree about what "time" is: ECharts uses milliseconds, Lightweight
 * Charts uses seconds. Ten-digit values are therefore read as seconds and
 * promoted; anything unparseable becomes `null` (a cursor leave).
 */
export function normalizeCursorX(value: number | string | Date | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  let ms: number;
  if (value instanceof Date) {
    ms = value.getTime();
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    ms = Math.abs(value) < 1e11 ? value * 1000 : value;
  } else {
    ms = Date.parse(value);
  }
  return Number.isFinite(ms) ? ms : null;
}

/** Normalise a visible range, or `null` when it is degenerate. */
export function normalizeRange(
  range: { from: number | string | Date; to: number | string | Date } | null | undefined,
): ChartRangeState | null {
  if (!range) return null;
  const from = normalizeCursorX(range.from);
  const to = normalizeCursorX(range.to);
  if (from === null || to === null || to <= from) return null;
  return { from, to };
}

export function createChartSyncBus(): ChartSyncBus {
  const subscribers = new Map<string, Map<string, ChartSyncSubscriber>>();
  const cursors = new Map<string, number | null>();
  const ranges = new Map<string, ChartRangeState | null>();
  const rangeMetas = new Map<string, ChartRangeMeta>();
  const pinned = new Map<string, number | null>();
  let frame: number | null = null;
  const pendingCursor = new Map<string, { x: number | null; originId: string }>();
  const pendingRange = new Map<string, { range: ChartRangeState | null; meta: ChartRangeMeta }>();

  function group(groupId: string): Map<string, ChartSyncSubscriber> {
    let entry = subscribers.get(groupId);
    if (!entry) {
      entry = new Map();
      subscribers.set(groupId, entry);
    }
    return entry;
  }

  function flush() {
    frame = null;
    for (const [groupId, payload] of pendingCursor) {
      const entry = subscribers.get(groupId);
      if (!entry) continue;
      for (const subscriber of entry.values()) {
        if (subscriber.id === payload.originId) continue;
        subscriber.onCursor?.(payload.x);
      }
    }
    pendingCursor.clear();
    for (const [groupId, payload] of pendingRange) {
      const entry = subscribers.get(groupId);
      if (!entry) continue;
      for (const subscriber of entry.values()) {
        if (subscriber.id === payload.meta.originId) continue;
        subscriber.onRange?.(payload.range, payload.meta);
      }
    }
    pendingRange.clear();
  }

  function schedule() {
    if (typeof requestAnimationFrame !== "function") {
      flush();
      return;
    }
    if (frame !== null) return;
    frame = requestAnimationFrame(flush);
  }

  return {
    subscribe(groupId, subscriber) {
      const entry = group(groupId);
      entry.set(subscriber.id, subscriber);
      // A chart joining late adopts the group's current state so a freshly
      // mounted chart does not sit on a different window than its siblings. A
      // published `null` counts: it is `max`, and the member must fit itself.
      if (ranges.has(groupId) && subscriber.onRange) {
        subscriber.onRange(ranges.get(groupId) ?? null, rangeMetas.get(groupId) ?? { intent: "default", originId: "bus" });
      }
      const currentPin = pinned.get(groupId);
      if (currentPin != null && subscriber.onCursor) subscriber.onCursor(currentPin);
      return () => {
        entry.delete(subscriber.id);
        if (entry.size === 0) {
          subscribers.delete(groupId);
          /*
           * A group with no members holds no state.
           *
           * The window, cursor and pin are *shared session* state, not history:
           * keeping them for a group nobody is in would let a stale window leak
           * into the next surface that happens to reuse the id — and an
           * inspection session that has ended must leave nothing behind (its
           * group id is unique per session, so its state must die with it).
           *
           * A window a reader actually chose is *not* lost with its members:
           * the group's controller (`core/range-group.ts`) owns user intent and
           * restores it when the group is rendered again — a tab remount, a view
           * switch, a reopened session.
           */
          ranges.delete(groupId);
          rangeMetas.delete(groupId);
          cursors.delete(groupId);
          pinned.delete(groupId);
          pendingCursor.delete(groupId);
          pendingRange.delete(groupId);
        }
      };
    },
    publishCursor(groupId, x, originId) {
      // A pin outranks a hover: once the reader has pinned a moment, moving the
      // pointer must not move the inspection.
      if (pinned.get(groupId) != null) return;
      cursors.set(groupId, x);
      pendingCursor.set(groupId, { x, originId });
      schedule();
    },
    publishPinned(groupId, x, originId) {
      pinned.set(groupId, x);
      cursors.set(groupId, x);
      // Apply to every subscriber, including the origin, so the chart the reader
      // clicked looks exactly like its siblings.
      for (const subscriber of group(groupId).values()) {
        if (subscriber.id === originId && x === null) continue;
        subscriber.onCursor?.(x);
      }
    },
    publishRange(groupId, range, originId, meta) {
      const resolved: ChartRangeMeta = { intent: meta?.intent ?? "default", preset: meta?.preset, originId };
      ranges.set(groupId, range);
      rangeMetas.set(groupId, resolved);
      /*
       * Delivery is coalesced to one frame.
       *
       * A drag emits a window per pointer move; applying every one of them to
       * every sibling is a synchronous cascade the reader never sees, because
       * only the last frame's window is on screen. `getRange`/`hasRange` are
       * updated immediately, so a synchronous reader still sees the truth.
       */
      pendingRange.set(groupId, { range, meta: resolved });
      schedule();
    },
    getCursor(groupId) {
      return cursors.get(groupId) ?? null;
    },
    getRange(groupId) {
      return ranges.get(groupId) ?? null;
    },
    hasRange(groupId) {
      return ranges.has(groupId);
    },
    getRangeMeta(groupId) {
      return rangeMetas.get(groupId) ?? null;
    },
    getPinned(groupId) {
      return pinned.get(groupId) ?? null;
    },
    reset() {
      subscribers.clear();
      cursors.clear();
      ranges.clear();
      rangeMetas.clear();
      pinned.clear();
      pendingCursor.clear();
      pendingRange.clear();
      frame = null;
    },
  };
}

/** The default, module-level bus shared by every chart on the page. */
export const chartSyncBus: ChartSyncBus = createChartSyncBus();
