export interface CrosshairEventLike {
  /** Present for real pointer events. Programmatic remote crosshairs omit it. */
  sourceEvent?: unknown;
}

export interface CrosshairSubscriptionApi<TEvent extends CrosshairEventLike> {
  subscribeCrosshairMove(handler: (event: TEvent) => void): void;
  unsubscribeCrosshairMove(handler: (event: TEvent) => void): void;
}

export function isLocalPointerEvent(event: CrosshairEventLike): boolean {
  return event.sourceEvent !== undefined;
}

/**
 * Event callbacks live for the lifetime of the engine, while React state is
 * replaced on every render. Read the latest state at event time and remove the
 * exact handler on destroy, rather than capturing one render's props forever.
 */
export function subscribeLatestCrosshair<TEvent extends CrosshairEventLike, TState>(
  chart: CrosshairSubscriptionApi<TEvent>,
  getState: () => TState,
  onEvent: (event: TEvent, state: TState) => void,
): () => void {
  const handler = (event: TEvent) => {
    onEvent(event, getState());
  };
  chart.subscribeCrosshairMove(handler);
  return () => chart.unsubscribeCrosshairMove(handler);
}

export interface FrameScheduler {
  request: (callback: () => void) => number;
  cancel: (handle: number) => void;
}

const browserFrameScheduler: FrameScheduler = {
  request(callback) {
    if (typeof requestAnimationFrame === "function") {
      return requestAnimationFrame(callback);
    }
    return setTimeout(callback, 0) as unknown as number;
  },
  cancel(handle) {
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(handle);
      return;
    }
    clearTimeout(handle);
  },
};

/**
 * Coalesce a high-frequency stream to the browser's paint cadence.
 *
 * Crosshair events can arrive more often than the browser paints. Only the
 * latest payload matters because each payload contains the complete tooltip
 * state, so one frame callback is enough regardless of how many events arrived.
 */
export function createLatestFrameBatch<TPayload>(
  run: (payload: TPayload) => void,
  scheduler: FrameScheduler = browserFrameScheduler,
): {
  schedule: (payload: TPayload) => void;
  flush: () => void;
  cancel: () => void;
} {
  let frame: number | null = null;
  let latest: TPayload | undefined;
  let pending = false;

  const flush = () => {
    if (frame !== null) {
      scheduler.cancel(frame);
      frame = null;
    }
    if (!pending) return;
    const payload = latest as TPayload;
    latest = undefined;
    pending = false;
    run(payload);
  };

  const schedule = (payload: TPayload) => {
    latest = payload;
    pending = true;
    if (frame === null) frame = scheduler.request(flush);
  };

  const cancel = () => {
    if (frame !== null) scheduler.cancel(frame);
    frame = null;
    latest = undefined;
    pending = false;
  };

  return { schedule, flush, cancel };
}
