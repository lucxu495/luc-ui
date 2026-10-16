import { describe, expect, it } from "vitest";
import {
  chartSizeHeight,
  DEFAULT_CHART_SIZE_SCALE,
  DEFAULT_MATRIX_ROW_HEIGHT,
  horizontalBarHeight,
  matrixHeight,
  matrixMinReadableRows,
  rowsHeight,
} from "./sizing";

describe("chartSizeHeight", () => {
  it("maps the named sizes to increasing heights", () => {
    expect(chartSizeHeight("compact")).toBe(DEFAULT_CHART_SIZE_SCALE.compact);
    expect(chartSizeHeight("large")).toBeGreaterThan(chartSizeHeight("medium"));
    expect(chartSizeHeight("medium")).toBeGreaterThan(chartSizeHeight("compact"));
  });

  it("falls back to medium for an unknown or absent size", () => {
    expect(chartSizeHeight(undefined)).toBe(DEFAULT_CHART_SIZE_SCALE.medium);
    expect(chartSizeHeight("medium")).toBe(DEFAULT_CHART_SIZE_SCALE.medium);
  });
});

describe("rowsHeight", () => {
  it("grows monotonically with the row count", () => {
    const few = rowsHeight({ rows: 4 });
    const many = rowsHeight({ rows: 12 });
    expect(many).toBeGreaterThan(few);
  });

  it("clamps to a readable minimum and a sane maximum", () => {
    expect(rowsHeight({ rows: 0 })).toBeGreaterThanOrEqual(140);
    expect(rowsHeight({ rows: 10_000 })).toBeLessThanOrEqual(960);
  });

  it("treats a non-finite row count as one row", () => {
    expect(rowsHeight({ rows: Number.NaN })).toBe(rowsHeight({ rows: 1 }));
  });
});

describe("matrixHeight / horizontalBarHeight", () => {
  it("derives a calendar height from the year count", () => {
    // Fifteen years must be tall enough to keep every row readable.
    const height = matrixHeight(15);
    expect(height).toBeGreaterThanOrEqual(15 * DEFAULT_MATRIX_ROW_HEIGHT);
  });

  it("gives a horizontal bar chart one readable row per category", () => {
    const height = horizontalBarHeight(15);
    const perRow = (height - 24 - 48) / 15;
    expect(perRow).toBeGreaterThanOrEqual(20);
  });
});

describe("matrixMinReadableRows", () => {
  it("is at least one and scales with available height", () => {
    expect(matrixMinReadableRows(0)).toBe(1);
    expect(matrixMinReadableRows(400)).toBeGreaterThan(matrixMinReadableRows(200));
  });
});
