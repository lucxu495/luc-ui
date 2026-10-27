import { describe, expect, it } from "vitest";
import {
  axisBandAt,
  axisTargetAt,
  plotRect,
  scaleValueRange,
  scaleWindow,
  windowFractions,
} from "./axis-drag";

/*
 * Direct axis manipulation, as arithmetic.
 *
 * The two semantics must never blur: a time-axis drag changes the *window*
 * (which a sync group follows), a value-axis drag changes only the visible value
 * range (which nothing outside the plate sees).
 */

const SIZE = { width: 1000, height: 600 };
const GRID = { left: 6, right: 56, top: 14, bottom: 28 };
const RECT = plotRect(GRID, SIZE);

describe("axis bands", () => {
  it("reads a pixel/percentage grid as the plot rectangle", () => {
    expect(RECT).toEqual({ left: 6, right: 944, top: 14, bottom: 572 });
    expect(plotRect({ left: "10%", right: "10%", top: 0, bottom: "20%" }, SIZE)).toEqual({
      left: 100,
      right: 900,
      top: 0,
      bottom: 480,
    });
  });

  it("resolves the exact left or right value plate in a dual-axis chart", () => {
    const grids = [{ gridIndex: 0, rect: RECT }];
    const axes = [
      { axisIndex: 0, gridIndex: 0, side: "left" as const },
      { axisIndex: 1, gridIndex: 0, side: "right" as const },
    ];
    expect(axisTargetAt({ x: 2, y: 300 }, grids, SIZE, axes)).toMatchObject({
      kind: "value",
      axisIndex: 0,
      side: "left",
    });
    expect(axisTargetAt({ x: 970, y: 300 }, grids, SIZE, axes)).toMatchObject({
      kind: "value",
      axisIndex: 1,
      side: "right",
    });
    expect(axisTargetAt({ x: 500, y: 300 }, grids, SIZE, axes)).toBeNull();
  });

  it("keeps a multi-grid pointer inside the grid it actually hit", () => {
    const upper = { left: 10, right: 900, top: 10, bottom: 250 };
    const lower = { left: 10, right: 900, top: 300, bottom: 540 };
    const grids = [
      { gridIndex: 0, rect: upper },
      { gridIndex: 1, rect: lower },
    ];
    expect(axisTargetAt({ x: 450, y: 265 }, grids, SIZE, [])).toMatchObject({
      kind: "time",
      gridIndex: 0,
    });
    expect(axisTargetAt({ x: 925, y: 420 }, grids, SIZE, [
      { axisIndex: 3, gridIndex: 1, side: "right" },
    ])).toMatchObject({ kind: "value", gridIndex: 1, axisIndex: 3 });
  });

  it("identifies the time band along the bottom and the value band on its side", () => {
    // Inside the plot: no band.
    expect(axisBandAt({ x: 500, y: 300 }, RECT, SIZE)).toBeNull();
    // Below the plot, within its horizontal extent: the time axis.
    expect(axisBandAt({ x: 500, y: 585 }, RECT, SIZE)).toBe("time");
    // Right of the plot: the value axis; left of the plot on a left-side scale.
    expect(axisBandAt({ x: 970, y: 300 }, RECT, SIZE)).toBe("value");
    expect(axisBandAt({ x: 2, y: 300 }, RECT, SIZE, { side: "left" })).toBe("value");
    expect(axisBandAt({ x: 2, y: 300 }, RECT, SIZE)).toBeNull();
  });
});

describe("time window scaling", () => {
  const window = { start: 25, end: 75 };
  const PLOT = { from: RECT.left, to: RECT.right };
  const PLOT_WIDTH = RECT.right - RECT.left;

  it("anchors on the pointer and moves the span in the expected direction", () => {
    // The plot's centre pixel is the window's centre value.
    const centre = (RECT.left + RECT.right) / 2;
    const { anchor } = windowFractions(window, centre, PLOT);
    expect(anchor).toBeCloseTo(50, 5);
    // Dragging right by the plot's own width halves the span…
    const zoomedIn = scaleWindow(window, anchor, PLOT_WIDTH, PLOT_WIDTH);
    expect(zoomedIn.end - zoomedIn.start).toBeCloseTo(25, 5);
    // …around the anchor, so the value the reader grabbed stays where it was.
    expect((zoomedIn.start + zoomedIn.end) / 2).toBeCloseTo(50, 5);
    // …and dragging left by half the width doubles the span (zoom out).
    const zoomedOut = scaleWindow(window, anchor, -PLOT_WIDTH / 2, PLOT_WIDTH);
    expect(zoomedOut.end - zoomedOut.start).toBeCloseTo(100, 5);
  });

  it("clamps into the domain and never collapses the window", () => {
    const edge = scaleWindow({ start: 0, end: 20 }, 0, 4000, 900);
    expect(edge.start).toBeGreaterThanOrEqual(0);
    expect(edge.end).toBeLessThanOrEqual(100);
    expect(edge.end).toBeGreaterThan(edge.start);
    const squeezed = scaleWindow({ start: 40, end: 60 }, 50, 1e6, 900, { minSpan: 1 });
    expect(squeezed.end - squeezed.start).toBeCloseTo(1, 5);
  });
});

describe("value range scaling", () => {
  const range = { min: 0, max: 100 };

  it("zooms in when dragging down and out when dragging up, around the anchor", () => {
    // A drag of the plot's own height halves the span…
    const zoomedIn = scaleValueRange(range, 50, 600, 600);
    expect(zoomedIn.max - zoomedIn.min).toBeCloseTo(50, 5);
    expect((zoomedIn.min + zoomedIn.max) / 2).toBeCloseTo(50, 5);
    // …and half the height the other way doubles it.
    const zoomedOut = scaleValueRange(range, 50, -300, 600);
    expect(zoomedOut.max - zoomedOut.min).toBeCloseTo(200, 5);
  });

  it("keeps the anchor value and refuses to collapse the axis", () => {
    const anchored = scaleValueRange(range, 25, 400, 600);
    // A quarter of the way in, the anchor stays a quarter of the way in.
    expect((anchored.min + (anchored.max - anchored.min) * 0.25)).toBeCloseTo(25, 5);
    const collapsed = scaleValueRange(range, 50, 1e6, 600, { minSpanRatio: 0.05 });
    expect(collapsed.max - collapsed.min).toBeCloseTo(5, 5);
    // A degenerate input (no span, no plot) is a no-op rather than a NaN.
    expect(scaleValueRange({ min: 5, max: 5 }, 5, 100, 600)).toEqual({ min: 5, max: 5 });
    expect(scaleValueRange(range, 50, 100, 0)).toEqual(range);
  });

  it("scales log ranges in log space and preserves positive bounds", () => {
    const next = scaleValueRange(
      { min: 1, max: 1_000 },
      10,
      600,
      600,
      { scaleMode: "log" },
    );
    expect(next.min).toBeGreaterThan(0);
    expect(next.max).toBeGreaterThan(next.min);
    expect(Math.log10(next.max) - Math.log10(next.min)).toBeCloseTo(1.5, 5);
  });
});
