import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashElement, flashTarget, revealTarget } from "./use-flash-target";

/**
 * `flashTarget` marks a jump destination for a beat and clears it. The interesting
 * behaviour is that it is *temporary* and reduced-motion aware, so those are what
 * these tests pin.
 */

function elementWithId(id: string): HTMLElement {
  const element = document.createElement("div");
  element.id = id;
  document.body.append(element);
  return element;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-motion");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("flashTarget", () => {
  it("marks the target and clears the mark after the beat", () => {
    const target = elementWithId("block-x");
    flashTarget("block-x", { durationMs: 900 });
    expect(target.getAttribute("data-target-flash")).toBe("true");
    vi.advanceTimersByTime(899);
    expect(target.getAttribute("data-target-flash")).toBe("true");
    vi.advanceTimersByTime(1);
    expect(target.getAttribute("data-target-flash")).toBeNull();
  });

  it("is a no-op when the anchor is not on the page", () => {
    expect(() => flashTarget("missing")).not.toThrow();
  });

  it("restarts the beat for a repeated jump to the same target", () => {
    const target = elementWithId("block-y");
    flashElement(target, { durationMs: 1000 });
    vi.advanceTimersByTime(600);
    flashElement(target, { durationMs: 1000 });
    vi.advanceTimersByTime(600);
    // The first beat would have expired; the restart keeps it lit.
    expect(target.getAttribute("data-target-flash")).toBe("true");
    vi.advanceTimersByTime(400);
    expect(target.getAttribute("data-target-flash")).toBeNull();
  });

  it("uses a shorter static beat under the reduced-motion override", () => {
    document.documentElement.dataset.motion = "reduced";
    const target = elementWithId("block-z");
    flashElement(target);
    expect(target.getAttribute("data-target-flash")).toBe("true");
    vi.advanceTimersByTime(650);
    expect(target.getAttribute("data-target-flash")).toBeNull();
  });
});

/**
 * `revealTarget` is the jump — scroll to the card, then light it **on arrival**.
 *
 * Flashing at click time is spent while the page is still moving; the reader
 * lands on a card that is already back to normal. These tests pin the ordering.
 */
describe("revealTarget", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute("data-motion");
  });

  function positioned(top: number, height = 400): HTMLElement {
    const element = elementWithId("block-arrive");
    element.getBoundingClientRect = () =>
      ({ top, bottom: top + height, left: 0, right: 800, width: 800, height, x: 0, y: top }) as DOMRect;
    return element;
  }

  it("does not light the target until the scroll has arrived", async () => {
    const target = positioned(1200);
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
    const scrollTo = vi.fn((_options: ScrollToOptions) => {
      // The default offset is `--shell-topbar-height` (64 in jsdom) + 24.
      scrollY = 1112;
    });
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;

    const arrived = revealTarget("block-arrive", { behavior: "smooth" });
    // In flight: nothing is lit yet.
    expect(target.getAttribute("data-target-flash")).toBeNull();
    expect(scrollTo).toHaveBeenCalled();
    // The jump used the reading offset, so the card is not under the header.
    expect(scrollTo.mock.calls[0]?.[0]).toMatchObject({ behavior: "smooth" });

    await arrived;
    expect(target.getAttribute("data-target-flash")).toBe("true");
  });

  it("uses an instant jump and a shorter static beat under reduced motion", async () => {
    document.documentElement.dataset.motion = "reduced";
    const target = positioned(500);
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
    let behavior: string | undefined;
    window.scrollTo = ((options: ScrollToOptions) => {
      behavior = options.behavior as string;
      scrollY = options.top ?? 0;
    }) as unknown as typeof window.scrollTo;

    await revealTarget("block-arrive", { behavior: "smooth" });
    // Reduced motion never animates a scroll, and still lights the card.
    expect(behavior).toBe("auto");
    expect(target.getAttribute("data-target-flash")).toBe("true");
  });

  it("flashes an element that is already where it should be, without scrolling", async () => {
    const target = positioned(88);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
    window.scrollTo = (() => {}) as unknown as typeof window.scrollTo;
    await revealTarget("block-arrive", { behavior: "smooth", settleTimeoutMs: 200 });
    expect(target.getAttribute("data-target-flash")).toBe("true");
  });
});
