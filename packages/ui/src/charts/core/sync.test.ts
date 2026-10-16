import { afterEach, describe, expect, it, vi } from "vitest";
import { createChartSyncBus, normalizeCursorX, normalizeRange } from "./sync";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normalizeCursorX", () => {
  it("promotes ten-digit second timestamps to milliseconds", () => {
    expect(normalizeCursorX(1_726_000_000)).toBe(1_726_000_000_000);
    expect(normalizeCursorX(1_726_000_000_000)).toBe(1_726_000_000_000);
  });

  it("accepts dates and ISO strings, and rejects the unparseable", () => {
    expect(normalizeCursorX(new Date("2026-09-25T00:00:00Z"))).toBe(Date.UTC(2026, 8, 25));
    expect(normalizeCursorX("2026-09-25T00:00:00Z")).toBe(Date.UTC(2026, 8, 25));
    expect(normalizeCursorX(Number.NaN)).toBeNull();
    expect(normalizeCursorX(null)).toBeNull();
    expect(normalizeCursorX("not a date")).toBeNull();
  });
});

describe("normalizeRange", () => {
  it("rejects degenerate windows", () => {
    expect(normalizeRange({ from: 100, to: 100 })).toBeNull();
    expect(normalizeRange({ from: 200, to: 100 })).toBeNull();
    expect(normalizeRange(null)).toBeNull();
  });

  it("normalises both ends to milliseconds", () => {
    expect(normalizeRange({ from: 1_726_000_000, to: 1_726_600_000 })).toEqual({
      from: 1_726_000_000_000,
      to: 1_726_600_000_000,
    });
  });
});

describe("chart sync bus", () => {
  function busWithRaf() {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const bus = createChartSyncBus();
    const flush = () => {
      const queued = callbacks.splice(0, callbacks.length);
      queued.forEach((callback) => callback(0));
    };
    return { bus, flush };
  }

  it("never delivers an event back to its origin", () => {
    const { bus, flush } = busWithRaf();
    const onCursorA = vi.fn();
    const onCursorB = vi.fn();
    bus.subscribe("g", { id: "a", onCursor: onCursorA });
    bus.subscribe("g", { id: "b", onCursor: onCursorB });

    bus.publishCursor("g", 1_000, "a");
    flush();

    expect(onCursorA).not.toHaveBeenCalled();
    expect(onCursorB).toHaveBeenCalledWith(1_000);
  });

  it("coalesces rapid cursor moves into one delivery per frame", () => {
    const { bus, flush } = busWithRaf();
    const onCursor = vi.fn();
    bus.subscribe("g", { id: "b", onCursor });

    bus.publishCursor("g", 1, "a");
    bus.publishCursor("g", 2, "a");
    bus.publishCursor("g", 3, "a");
    flush();

    expect(onCursor).toHaveBeenCalledTimes(1);
    expect(onCursor).toHaveBeenCalledWith(3);
  });

  /*
   * Delivery is coalesced to one frame (a drag emits a window per pointer move),
   * while the stored window is updated synchronously so a reader of the bus sees
   * the truth immediately.
   */
  it("delivers the latest range once per frame and skips the origin", () => {
    const { bus, flush } = busWithRaf();
    const onRangeA = vi.fn();
    const onRangeB = vi.fn();
    bus.subscribe("g", { id: "a", onRange: onRangeA });
    bus.subscribe("g", { id: "b", onRange: onRangeB });

    bus.publishRange("g", { from: 10, to: 20 }, "a");
    // The stored window is visible before the frame lands.
    expect(bus.getRange("g")).toEqual({ from: 10, to: 20 });
    expect(bus.hasRange("g")).toBe(true);
    bus.publishRange("g", { from: 12, to: 20 }, "a");
    expect(bus.getRange("g")).toEqual({ from: 12, to: 20 });
    flush();

    expect(onRangeA).not.toHaveBeenCalled();
    expect(onRangeB).toHaveBeenCalledTimes(1);
    expect(onRangeB).toHaveBeenCalledWith({ from: 12, to: 20 }, { intent: "default", preset: undefined, originId: "a" });
  });

  it("hands the current range to a late subscriber so charts start aligned", () => {
    const { bus } = busWithRaf();
    bus.subscribe("g", { id: "a" });
    bus.publishRange("g", { from: 5, to: 9 }, "a", { intent: "preset", preset: "1y" });

    const onRange = vi.fn();
    bus.subscribe("g", { id: "b", onRange });

    expect(onRange).toHaveBeenCalledWith({ from: 5, to: 9 }, { intent: "preset", preset: "1y", originId: "a" });
  });

  /*
   * A published `null` is `max`, not "nothing happened".
   *
   * Treating it as an absence is what let a `max` click leave the previous window
   * on screen; a member must instead be told to show its whole loaded domain.
   */
  it("delivers a `null` window as a real instruction, including to a late subscriber", () => {
    const { bus, flush } = busWithRaf();
    const onRange = vi.fn();
    bus.subscribe("g", { id: "a", onRange });
    bus.subscribe("g", { id: "b" });
    bus.publishRange("g", null, "b", { intent: "preset", preset: "max" });
    flush();
    expect(onRange).toHaveBeenCalledWith(null, { intent: "preset", preset: "max", originId: "b" });
    expect(bus.hasRange("g")).toBe(true);
    expect(bus.getRange("g")).toBeNull();

    const late = vi.fn();
    bus.subscribe("g", { id: "c", onRange: late });
    expect(late).toHaveBeenCalledWith(null, { intent: "preset", preset: "max", originId: "b" });
  });

  it("stops delivering after unsubscribe, and reset clears every group", () => {
    const { bus, flush } = busWithRaf();
    const onCursor = vi.fn();
    const unsubscribe = bus.subscribe("g", { id: "b", onCursor });
    unsubscribe();

    bus.publishCursor("g", 42, "a");
    flush();
    expect(onCursor).not.toHaveBeenCalled();

    const after = vi.fn();
    bus.subscribe("g", { id: "c" });
    bus.reset();
    expect(bus.getRange("g")).toBeNull();
    bus.publishRange("g", { from: 1, to: 2 }, "a");
    expect(after).not.toHaveBeenCalled();
  });

  /*
   * A group with no members holds no state.
   *
   * The window on the bus is shared *session* state, not history: if it outlived
   * the charts that published it, the next surface to reuse the id — an
   * inspection dialog reopened with a fresh session, a chart remounted by a view
   * switch — would inherit a window nobody chose. Ending the session must end its
   * window too.
   */
  it("drops a group's window, cursor and pin when its last member leaves", () => {
    const { bus, flush } = busWithRaf();
    const unsubscribe = bus.subscribe("solo", { id: "a" });
    bus.publishRange("solo", { from: 1, to: 2 }, "a");
    bus.publishPinned("solo", 42, "a");
    expect(bus.getRange("solo")).toEqual({ from: 1, to: 2 });
    expect(bus.getPinned("solo")).toBe(42);

    unsubscribe();
    expect(bus.getRange("solo")).toBeNull();
    expect(bus.getPinned("solo")).toBeNull();
    expect(bus.getCursor("solo")).toBeNull();

    // A late subscriber starts clean instead of adopting the dead session.
    const onRange = vi.fn();
    const onCursor = vi.fn();
    bus.subscribe("solo", { id: "b", onRange, onCursor });
    expect(onRange).not.toHaveBeenCalled();
    expect(onCursor).not.toHaveBeenCalled();
    bus.publishCursor("solo", 7, "a");
    flush();
    expect(onCursor).toHaveBeenCalledWith(7);
  });
});

describe("pinned inspection on the bus", () => {
  function busWithRaf() {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const bus = createChartSyncBus();
    const flush = () => {
      const queued = callbacks.splice(0, callbacks.length);
      queued.forEach((callback) => callback(0));
    };
    return { bus, flush };
  }

  it("delivers a pin to every chart, including the one that set it", () => {
    const { bus } = busWithRaf();
    const onA = vi.fn();
    const onB = vi.fn();
    bus.subscribe("g", { id: "a", onCursor: onA });
    bus.subscribe("g", { id: "b", onCursor: onB });

    bus.publishPinned("g", 1_700, "a");
    expect(bus.getPinned("g")).toBe(1_700);
    expect(onA).toHaveBeenCalledWith(1_700);
    expect(onB).toHaveBeenCalledWith(1_700);
  });

  it("ignores transient hover while a pin is set, and resumes after clearing", () => {
    const { bus, flush } = busWithRaf();
    const onCursor = vi.fn();
    bus.subscribe("g", { id: "b", onCursor });

    bus.publishPinned("g", 1_700, "provider");
    bus.publishCursor("g", 2_000, "a");
    bus.publishCursor("g", null, "a");
    flush();
    expect(onCursor).toHaveBeenCalledTimes(1);
    expect(onCursor).toHaveBeenCalledWith(1_700);

    bus.publishPinned("g", null, "provider");
    expect(bus.getPinned("g")).toBeNull();
    expect(onCursor).toHaveBeenLastCalledWith(null);

    bus.publishCursor("g", 2_100, "a");
    flush();
    expect(onCursor).toHaveBeenLastCalledWith(2_100);
  });

  it("hands the current pin to a late subscriber", () => {
    const { bus } = busWithRaf();
    bus.publishPinned("g", 1_234, "provider");
    const onCursor = vi.fn();
    bus.subscribe("g", { id: "late", onCursor });
    expect(onCursor).toHaveBeenCalledWith(1_234);
  });

  it("clears the pin on reset", () => {
    const { bus } = busWithRaf();
    bus.publishPinned("g", 1_234, "provider");
    bus.reset();
    expect(bus.getPinned("g")).toBeNull();
  });
});
