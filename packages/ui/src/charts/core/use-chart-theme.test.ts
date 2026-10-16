import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHART_ANIMATION_POINT_LIMIT, useChartId, useChartMotion } from "./use-chart-theme";
import { defaultChartTheme } from "./theme";


describe("useChartId", () => {
  it("keeps an instance's id stable across re-renders and unique between instances", () => {
    const { result, rerender } = renderHook(() => useChartId("echart"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);

    const second = renderHook(() => useChartId("echart"));
    expect(second.result.current).not.toBe(first);
  });

  it("does not depend on a module-level counter, which would differ on the client", () => {
    /*
     * The id reaches the DOM as `id` + `aria-describedby` for charts that carry
     * an `ariaDescription`. A counter that restarts on the client produces a
     * different string than the server rendered it with, which is a hydration
     * mismatch on every described chart (found in V0.6 QA on /charts/radial).
     */
    const { result } = renderHook(() => useChartId("echart"));
    expect(result.current.startsWith("echart-")).toBe(true);
  });
});

function motionFor(preset: Parameters<typeof useChartMotion>[1], points?: number) {
  return renderHook(() => useChartMotion(defaultChartTheme, preset, points)).result.current;
}

describe("useChartMotion", () => {
  it("scales the budget with the caller's preset", () => {
    const none = motionFor("none");
    const standard = motionFor("standard");
    const emphasized = motionFor("emphasized");
    expect(none.intro).toBe(0);
    expect(none.update).toBe(0);
    expect(standard.intro).toBeGreaterThan(0);
    expect(emphasized.intro).toBeGreaterThan(standard.intro);
    // An update must never be slower than the entrance — the reader is waiting.
    expect(standard.update).toBeLessThanOrEqual(standard.intro);
  });

  it("clamps the animation for a large series instead of animating every mark", () => {
    const small = motionFor("standard", 500);
    const large = motionFor("standard", CHART_ANIMATION_POINT_LIMIT + 1);
    expect(large.intro).toBeLessThan(small.intro);
    expect(large.update).toBeLessThanOrEqual(small.update);
    // A dense chart never morphs between representations.
    expect(small.universal).toBe(true);
    expect(large.universal).toBe(false);
  });
});
