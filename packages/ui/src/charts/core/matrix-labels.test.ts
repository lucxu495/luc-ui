import { describe, expect, it } from "vitest";
import {
  CORRELATION_PLOT_INSET,
  HEATMAP_PLOT_INSET,
  MATRIX_LABEL_MIN_CELL,
  correlationPlotArea,
  heatmapPlotArea,
  shouldShowMatrixValues,
} from "./matrix-labels";

describe("shouldShowMatrixValues", () => {
  it("honours never and always without measuring anything", () => {
    const unmeasured = { rows: 0, columns: 0, plotWidth: 0, plotHeight: 0 };
    expect(shouldShowMatrixValues({ mode: "never", ...unmeasured })).toBe(false);
    expect(shouldShowMatrixValues({ mode: "always", ...unmeasured })).toBe(true);
  });

  it("stays silent until the chart has been measured", () => {
    expect(shouldShowMatrixValues({ mode: "auto", rows: 10, columns: 10 })).toBe(false);
    expect(
      shouldShowMatrixValues({ mode: "auto", rows: 10, columns: 10, plotWidth: 900, plotHeight: Number.NaN }),
    ).toBe(false);
    expect(
      shouldShowMatrixValues({ mode: "auto", rows: 10, columns: 10, plotWidth: 900, plotHeight: 0 }),
    ).toBe(false);
    expect(shouldShowMatrixValues({ mode: "auto", rows: 0, columns: 0, plotWidth: 900, plotHeight: 400 })).toBe(false);
  });

  it("decides from the rendered cell, not the row count", () => {
    const wide = { plotWidth: 980, plotHeight: 368 };
    // Ten assets in a research card: 98 × 37 cells. Values.
    expect(shouldShowMatrixValues({ mode: "auto", rows: 10, columns: 10, ...wide })).toBe(true);
    // The same ten assets squeezed into a phone: 38 × 37 cells. No values.
    expect(shouldShowMatrixValues({ mode: "auto", rows: 10, columns: 10, plotWidth: 380, plotHeight: 368 })).toBe(
      false,
    );
    // Twenty assets in the wide card still clear the floor at 49 × 18.
    expect(shouldShowMatrixValues({ mode: "auto", rows: 20, columns: 20, ...wide })).toBe(true);
    // …but not when the card is narrow.
    expect(shouldShowMatrixValues({ mode: "auto", rows: 20, columns: 20, plotWidth: 500, plotHeight: 368 })).toBe(
      false,
    );
  });

  it("lets a caller tune the floor", () => {
    const area = { rows: 10, columns: 10, plotWidth: 400, plotHeight: 180 };
    expect(shouldShowMatrixValues({ mode: "auto", ...area })).toBe(false);
    expect(shouldShowMatrixValues({ mode: "auto", ...area, minCellWidth: 30, minCellHeight: 12 })).toBe(true);
  });

  it("documents a readable floor rather than an arbitrary one", () => {
    // "-0.42" at 11px mono is ~33px of glyphs; the floor keeps padding around it.
    expect(MATRIX_LABEL_MIN_CELL.width).toBeGreaterThanOrEqual(36);
    expect(MATRIX_LABEL_MIN_CELL.height).toBeGreaterThanOrEqual(14);
  });
});

describe("correlationPlotArea", () => {
  it("subtracts the axis gutters from the chart box", () => {
    const area = correlationPlotArea(1088, 420, 10, 10);
    expect(area.plotWidth).toBe(1088 - CORRELATION_PLOT_INSET.left - CORRELATION_PLOT_INSET.right);
    expect(area.plotHeight).toBe(420 - CORRELATION_PLOT_INSET.top - CORRELATION_PLOT_INSET.bottom);
  });

  it("reports a negative area instead of clamping it, so the policy can reject it", () => {
    const area = correlationPlotArea(40, 40, 10, 10);
    expect(area.plotWidth).toBeLessThan(0);
    expect(shouldShowMatrixValues({ mode: "auto", ...area })).toBe(false);
  });
});

describe("heatmapPlotArea", () => {
  it("subtracts the heatmap gutters", () => {
    const area = heatmapPlotArea(920, 420, 12, 12);
    expect(area.plotWidth).toBe(920 - HEATMAP_PLOT_INSET.left - HEATMAP_PLOT_INSET.right);
    expect(area.plotHeight).toBe(420 - HEATMAP_PLOT_INSET.top - HEATMAP_PLOT_INSET.bottom);
  });

  it("lets a 12-month calendar print its values when the card is wide enough", () => {
    // A 12-year × 12-month calendar in a research-width card.
    const area = heatmapPlotArea(1040, 440, 12, 12);
    expect(shouldShowMatrixValues({ mode: "auto", ...area })).toBe(true);
  });

  it("keeps the labels off when the same calendar is squeezed to a phone", () => {
    const area = heatmapPlotArea(360, 440, 12, 12);
    expect(shouldShowMatrixValues({ mode: "auto", ...area })).toBe(false);
  });
});
