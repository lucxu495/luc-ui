//#region src/charts/core/gesture.d.ts
/**
 * Was this plate driven by the reader, or by the code?
 *
 * A charting engine emits "the visible range changed" for a pointer gesture and
 * for a hundred programmatic reasons — the first fit, a clamp to the history a
 * series actually holds, a resize, a series replacement, a rebuild after new
 * data. The engine does not say which, and the group must only ever follow the
 * first. So the *input* is observed instead of the output: while a wheel or a
 * pointer drag is in flight on this plate, a range change is the reader's.
 *
 * Two properties make this safe rather than clever:
 *
 * - **It fails closed.** No gesture in flight ⇒ nothing is published. A missed
 *   gesture costs the reader a synchronised pan; a false positive would move
 *   every sibling to a window nobody asked for.
 * - **No suppression timers.** Nothing is "ignored for the next frame". A
 *   programmatic apply is not a gesture at any moment, and a gesture's own
 *   trailing engine event is attributed by the gesture itself, not by a delay.
 *
 * The wheel window exists because a wheel has no "up": it is a stream of events,
 * so the gesture ends a short grace period after the last one. Everything the
 * wheel produces lands inside that window, and the window carries no authority
 * beyond attributing a *reader* input — a programmatic apply that happens to
 * land inside it re-publishes a window that is already the group's, which the
 * group controller treats as a no-op.
 */
/** How long a wheel stream keeps counting as one gesture. */
export declare const WHEEL_GESTURE_IDLE_MS = 250;
export interface PlateGesture {
  /** True while the reader is driving this plate. */
  active(): boolean;
  /** Detach every listener. */
  dispose(): void;
}
/**
 * Watch a chart host element for reader gestures.
 *
 * The listeners are passive and capture-phase: they observe, they never
 * interfere with the engine's own handling of the same events.
 */
export declare function watchPlateGesture(host: HTMLElement, options?: {
  idleMs?: number;
}): PlateGesture;
//#endregion
//# sourceMappingURL=gesture.d.ts.map