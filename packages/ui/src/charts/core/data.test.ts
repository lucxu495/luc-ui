import { describe, expect, it } from "vitest";
import {
  extent,
  isSeriesEmpty,
  nearestIndex,
  normalizeTabular,
  resolveRangeWindow,
  seriesValues,
  sliceWindow,
  toNumber,
} from "./data";

const DAY = 86_400_000;
const ROWS = [
  { time: new Date(Date.UTC(2026, 0, 1)), close: 100 },
  { time: new Date(Date.UTC(2026, 0, 2)), close: null },
  { time: new Date(Date.UTC(2026, 0, 3)), close: 104 },
];

describe("toNumber", () => {
  it("only converts what is genuinely numeric", () => {
    expect(toNumber(3.5)).toBe(3.5);
    expect(toNumber("3.5")).toBe(3.5);
    expect(toNumber("")).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(toNumber(Number.NaN)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });
});

describe("normalizeTabular", () => {
  it("infers a time axis from Date values and normalises to milliseconds", () => {
    const normalized = normalizeTabular(ROWS, "time");
    expect(normalized.kind).toBe("time");
    expect(normalized.numericX).toEqual([
      Date.UTC(2026, 0, 1),
      Date.UTC(2026, 0, 2),
      Date.UTC(2026, 0, 3),
    ]);
  });

  it("keeps strings categorical and small numbers numeric", () => {
    expect(normalizeTabular([{ x: "Q1" }, { x: "Q2" }], "x").kind).toBe("category");
    expect(normalizeTabular([{ x: 1 }, { x: 2 }], "x").kind).toBe("value");
    // Large numbers read as epoch milliseconds without an explicit axis type.
    expect(normalizeTabular([{ x: 1_700_000_000_000 }], "x").kind).toBe("time");
  });

  it("honours an explicit axis type over inference", () => {
    expect(normalizeTabular([{ x: "2026-01-01" }], "x", { type: "time" }).kind).toBe("time");
    expect(normalizeTabular([{ x: 1 }, { x: 2 }], "x", { type: "category" }).kind).toBe("category");
  });
});

describe("seriesValues", () => {
  it("preserves gaps as null instead of dropping or zeroing them", () => {
    expect(seriesValues({ key: "close" }, ROWS)).toEqual([100, null, 104]);
  });

  it("accepts inline [x, y] pairs", () => {
    expect(seriesValues({ key: "inline", data: [[1, 10], [2, 20]] }, [])).toEqual([10, 20]);
  });
});

describe("extent and empty detection", () => {
  it("ignores nulls and reports the true extent", () => {
    expect(extent([null, 3, Number.NaN, -1])).toEqual([-1, 3]);
    expect(extent([null, Number.NaN])).toBeNull();
  });

  it("calls a chart empty when no series has a single finite value", () => {
    expect(isSeriesEmpty([{ key: "close" }], ROWS)).toBe(false);
    expect(isSeriesEmpty([{ key: "missing" }], ROWS)).toBe(true);
    expect(isSeriesEmpty([{ key: "close" }], [])).toBe(true);
  });
});

describe("range window", () => {
  it("anchors the trailing window to the newest point, not wall-clock time", () => {
    const normalized = normalizeTabular(ROWS, "time");
    const window = resolveRangeWindow(normalized.numericX, "1m");
    // Data is three days long, so a one-month window covers all of it.
    expect(window!.to).toBe(Date.UTC(2026, 0, 3));
    expect(window!.from).toBe(Date.UTC(2026, 0, 3) - 30 * DAY);
  });

  it("treats an unknown or unbounded range as no window", () => {
    const normalized = normalizeTabular(ROWS, "time");
    expect(resolveRangeWindow(normalized.numericX, "all")).toBeNull();
    expect(resolveRangeWindow(normalized.numericX, "nonsense")).toBeNull();
  });

  it("slices rows to the window without reordering them", () => {
    const normalized = normalizeTabular(ROWS, "time");
    const window = resolveRangeWindow(normalized.numericX, "1d");
    const sliced = sliceWindow(ROWS, normalized.numericX, window);
    expect(sliced.map((row) => row.close)).toEqual([null, 104]);
    expect(sliceWindow(ROWS, normalized.numericX, null)).toHaveLength(3);
  });
});

describe("nearestIndex", () => {
  it("finds the closest x for a shared cursor", () => {
    const x = [0, 10, 20, 30];
    expect(nearestIndex(x, 12)).toBe(1);
    expect(nearestIndex(x, 26)).toBe(3);
    expect(nearestIndex([], 5)).toBe(-1);
  });
});
