import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollSpy } from "./use-scroll-spy";

/**
 * The streaming / geometry regression.
 *
 * A lazily composed report replaces an anchor's node when a Suspense boundary
 * resolves, and every chart changes its own box as it lays out. The reading line
 * is computed from *measured* offsets, so the hook must re-measure when that
 * happens — an offset measured once at mount would keep the highlight frozen on
 * a card that has since moved.
 */

/** Give an element a document-space position the hook can measure. */
function place(element: HTMLElement, top: number, height = 400): HTMLElement {
  element.getBoundingClientRect = () =>
    ({ top, bottom: top + height, left: 0, right: 800, width: 800, height, x: 0, y: top }) as DOMRect;
  return element;
}

function anchor(id: string, top = 0): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("data-anchor-id", id);
  element.textContent = id;
  return place(element, top);
}

/** Move the document to `y` and let the hook's coalesced pass run. */
async function scrollTo(y: number): Promise<void> {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
}

beforeEach(() => {
  vi.stubGlobal(
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0) as unknown as number,
  );
  document.body.innerHTML = "";
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true, writable: true });
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useScrollSpy streaming", () => {
  it("follows manual scrolling to the first card below the reading line", async () => {
    document.body.append(anchor("a", 200), anchor("b", 900), anchor("c", 1600));
    const { result } = renderHook(() => useScrollSpy(["a", "b", "c"]));

    await scrollTo(0);
    expect(result.current.activeId).toBe("a");
    // Line at 700 + the 64px header default: b (900) has not crossed it yet.
    await scrollTo(600);
    expect(result.current.activeId).toBe("a");
    await scrollTo(900);
    expect(result.current.activeId).toBe("b");
    await scrollTo(1600);
    expect(result.current.activeId).toBe("c");
  });

  it("re-measures when a streamed section replaces its placeholder", async () => {
    const placeholder = anchor("a", 200);
    const second = anchor("b", 900);
    document.body.append(placeholder, second);
    const { result } = renderHook(() => useScrollSpy(["a", "b"]));

    await scrollTo(900);
    expect(result.current.activeId).toBe("b");

    // The streamed section resolves: `a` is replaced by real content and moves
    // far up the document, and `b` moves with it.
    const replacement = anchor("a", 400);
    placeholder.replaceWith(replacement);
    second.getBoundingClientRect = () =>
      ({ top: 1400, bottom: 1800, left: 0, right: 800, width: 800, height: 400, x: 0, y: 1400 }) as DOMRect;

    await waitFor(() => {
      // The mutation pass re-measures; the reader's scroll position is unchanged,
      // so the answer follows the *new* geometry.
      expect(result.current.activeId).toBe("a");
    });
  });

  it("keeps the highlight held while a click's lock is in force, then releases it", async () => {
    document.body.append(anchor("a", 200), anchor("b", 900));
    const { result } = renderHook(() => useScrollSpy(["a", "b"]));

    act(() => result.current.lock("b"));
    expect(result.current.activeId).toBe("b");
    // The page is still at the top — but the click's intent wins while it flies.
    await scrollTo(0);
    expect(result.current.activeId).toBe("b");

    // Arrival hands control back to the reading position.
    act(() => result.current.release());
    await scrollTo(0);
    expect(result.current.activeId).toBe("a");
  });

  it("treats section ids as context and metric ids as the reading target", async () => {
    document.body.append(anchor("sec.a", 100), anchor("block.a", 180), anchor("block.b", 900));
    const { result } = renderHook(() =>
      useScrollSpy(["sec.a", "block.a", "block.b"], { primaryIds: ["block.a", "block.b"] }),
    );
    await scrollTo(300);
    expect(result.current.activeId).toBe("block.a");
    await scrollTo(1200);
    expect(result.current.activeId).toBe("block.b");
  });
});
