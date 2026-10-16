import { afterEach, describe, expect, it, vi } from "vitest";
import { WHEEL_GESTURE_IDLE_MS, watchPlateGesture } from "./gesture";

/*
 * Reader-gesture attribution.
 *
 * This is the mechanism that decides whether an engine's own range change may
 * move a sync group. Its contract is deliberately narrow: *only* a wheel or a
 * pointer drag counts, and a programmatic `setVisibleRange`/`fitContent` — which
 * emits no DOM input at all — never does.
 */

afterEach(() => {
  vi.useRealTimers();
});

function plate() {
  const host = document.createElement("div");
  document.body.append(host);
  const gesture = watchPlateGesture(host);
  return { host, gesture };
}

describe("plate gesture attribution", () => {
  it("is idle until the reader actually touches the plate", () => {
    const { gesture } = plate();
    expect(gesture.active()).toBe(false);
    gesture.dispose();
  });

  it("counts a wheel stream as one gesture and ends it after the wheel stops", () => {
    vi.useFakeTimers();
    const { host, gesture } = plate();
    host.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
    expect(gesture.active()).toBe(true);
    // A second wheel inside the window keeps it open…
    vi.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS - 10);
    host.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
    vi.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS - 10);
    expect(gesture.active()).toBe(true);
    // …and the gesture ends when the reader stops.
    vi.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS + 10);
    expect(gesture.active()).toBe(false);
    gesture.dispose();
  });

  it("counts a pointer drag from press to release, even if the pointer leaves the plate", () => {
    const { host, gesture } = plate();
    host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(gesture.active()).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(gesture.active()).toBe(false);
    gesture.dispose();
  });

  it("stops observing after dispose", () => {
    const { host, gesture } = plate();
    gesture.dispose();
    host.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(gesture.active()).toBe(false);
  });
});
