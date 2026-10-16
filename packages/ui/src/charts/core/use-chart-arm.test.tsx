import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRef } from "react";
import { isWithinPrefetchBand, useChartArm } from "./use-chart-arm";

/**
 * The engine gate.
 *
 * jsdom has no `requestIdleCallback`, so the module's documented fallback —
 * "arm on the next macrotask" — is what these tests exercise. That is also the
 * behaviour a browser without the idle API gets, so the test covers a real path
 * rather than a mock.
 */
function Probe({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const armed = useChartArm(ref, enabled);
  return <div ref={ref}>{armed ? "armed" : "waiting"}</div>;
}

describe("useChartArm", () => {
  it("holds the engine back until a slot is available, then arms once", async () => {
    render(<Probe />);
    expect(screen.getByText("waiting")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("armed")).toBeInTheDocument());
  });

  it("arms immediately when the caller disables the gate", () => {
    render(<Probe enabled={false} />);
    expect(screen.getByText("armed")).toBeInTheDocument();
  });
});

/**
 * The idle queue is bounded by distance.
 *
 * A valuation domain mounts 46 canvases; building the ones five screens down
 * costs the reader main-thread time for a chart they are not looking at. Only
 * the near band joins the queue — everything else arms on approach through the
 * `IntersectionObserver` that every surface has anyway.
 */
describe("isWithinPrefetchBand", () => {
  const viewport = () => window.innerHeight;
  /** A 400 px tall surface whose top edge sits `top` px from the viewport top. */
  const host = (top: number) =>
    ({ getBoundingClientRect: () => ({ top, bottom: top + 400 }) }) as unknown as Element;

  it("accepts a surface on screen or just below it", () => {
    expect(isWithinPrefetchBand(host(0))).toBe(true);
    expect(isWithinPrefetchBand(host(viewport() + 1))).toBe(true);
    // Two screens up is still within the band.
    expect(isWithinPrefetchBand(host(-viewport() * 2))).toBe(true);
  });

  it("rejects a surface the reader would have to scroll screens to reach", () => {
    expect(isWithinPrefetchBand(host(viewport() * 6))).toBe(false);
    expect(isWithinPrefetchBand(host(-viewport() * 6))).toBe(false);
  });
});
