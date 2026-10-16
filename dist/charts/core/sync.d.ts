//#region src/charts/core/sync.d.ts
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
  publishRange(group: string, range: ChartRangeState | null, originId: string, meta?: Omit<ChartRangeMeta, "originId">): void;
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
export declare function normalizeCursorX(value: number | string | Date | null | undefined): number | null;
/** Normalise a visible range, or `null` when it is degenerate. */
export declare function normalizeRange(range: {
  from: number | string | Date;
  to: number | string | Date;
} | null | undefined): ChartRangeState | null;
export declare function createChartSyncBus(): ChartSyncBus;
/** The default, module-level bus shared by every chart on the page. */
export declare const chartSyncBus: ChartSyncBus;
//#endregion
//# sourceMappingURL=sync.d.ts.map