import { describe, expect, it } from "vitest";
import {
  createFormatter,
  formatChartValue,
  formatDuration,
  numericAxisFormatter,
  resolveFormatter,
  timeAxisFormatter,
  timeAxisLabelScale,
  timeAxisTickPlan,
  timeSpanMs,
} from "./formatters";

describe("time axis labels follow the visible span", () => {
  const DAY = 86_400_000;
  const winter = Date.UTC(2026, 0, 15);
  const autumn = Date.UTC(2026, 8, 25);

  it("buckets a span into the granularity its ticks need", () => {
    expect(timeAxisLabelScale(6 * 60 * 60 * 1000)).toBe("time");
    expect(timeAxisLabelScale(5 * DAY)).toBe("day");
    expect(timeAxisLabelScale(90 * DAY)).toBe("month");
    expect(timeAxisLabelScale(700 * DAY)).toBe("month-year");
    expect(timeAxisLabelScale(15 * 365 * DAY)).toBe("year");
  });

  it("labels a two-year window with month AND year, never a bare repeated year", () => {
    // The defect: a 2Y window of a 15-year history printed "2025 2025 2025".
    const label = timeAxisFormatter(730 * DAY);
    expect(label(autumn)).toBe("Sep 26");
    expect(label(winter)).toBe("Jan 26");
  });

  it("keeps a long/MAX window year-oriented", () => {
    const label = timeAxisFormatter(15 * 365 * DAY);
    expect(label(autumn)).toBe("2026");
    expect(label(winter)).toBe("2026");
  });

  it("gives a sub-year window a month (and a day once close enough)", () => {
    expect(timeAxisFormatter(90 * DAY)(autumn)).toBe("Sep");
    expect(timeAxisFormatter(5 * DAY)(autumn)).toBe("Sep 25");
  });

  it("is total for an axis pointer that has no valid coordinate yet", () => {
    expect(timeAxisFormatter(5 * DAY)(Number.NaN)).toBe("");
    expect(timeAxisFormatter(5 * DAY)(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("formatChartValue", () => {
  it("renders an em dash for null, NaN and Infinity instead of leaking them", () => {
    expect(formatChartValue(null)).toBe("—");
    expect(formatChartValue(undefined)).toBe("—");
    expect(formatChartValue(Number.NaN)).toBe("—");
    expect(formatChartValue(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("treats percent as an already-scaled value", () => {
    expect(formatChartValue(12.4, { kind: "percent" })).toBe("12.4%");
    expect(formatChartValue(12.4, { kind: "percent", signed: true })).toBe("+12.4%");
  });

  it("formats currency, basis points and ratios with their own units", () => {
    expect(formatChartValue(128_431, { kind: "currency" })).toBe("$128,431");
    expect(formatChartValue(38.4, { kind: "bps" })).toBe("38.4 bps");
    expect(formatChartValue(1.84, { kind: "ratio" })).toBe("1.84×");
  });

  it("formats timestamps in UTC so screenshots stay stable", () => {
    const value = Date.UTC(2026, 8, 25, 14, 5);
    expect(formatChartValue(value, { kind: "date" })).toBe("Sep 25, 2026");
    expect(formatChartValue(value, { kind: "datetime" })).toBe("Sep 25, 2026, 14:05");
  });

  it("does not silently scale a value the caller did not scale", () => {
    // 0.0001 is a ratio, not 0.01%. Only the formatter decides presentation.
    expect(formatChartValue(0.0001, { kind: "decimal", decimals: 4 })).toBe("0.0001");
  });

  it("never labels a rounded-away value as negative", () => {
    // Engines land on `-0` and on dust when they compute ticks; an axis that
    // reads "-0.0%" claims a reading the data does not have.
    expect(formatChartValue(-0, { kind: "percent", decimals: 1 })).toBe("0.0%");
    expect(formatChartValue(-1e-12, { kind: "percent", decimals: 1 })).toBe("0.0%");
    expect(formatChartValue(-1e-12, { kind: "currency" })).toBe("$0");
    // A value that survives the requested precision keeps its sign…
    expect(formatChartValue(-0.06, { kind: "percent", decimals: 1 })).toBe("-0.1%");
    // …and one that does not rounds to plain zero rather than "-0.0%".
    expect(formatChartValue(-0.04, { kind: "percent", decimals: 1 })).toBe("0.0%");
    expect(formatChartValue(-12.4, { kind: "percent", decimals: 1 })).toBe("-12.4%");
  });
});

describe("numericAxisFormatter", () => {
  it("abbreviates a large tick but keeps its unit", () => {
    const axis = numericAxisFormatter({ kind: "currency", currency: "USD" });
    expect(axis(124_658)).toBe("$124.7K");
    expect(axis(20_000)).toBe("$20K");
    // Below the abbreviation threshold the exact figure stays.
    expect(axis(4_000)).toBe("$4,000");
    expect(axis(800)).toBe("$800");
  });

  it("abbreviates a percentage axis the same way, without inventing a currency", () => {
    const axis = numericAxisFormatter({ kind: "percent", decimals: 1 });
    expect(axis(-84.86)).toBe("-84.9%");
    expect(axis(0)).toBe("0.0%");
  });
});

describe("a time axis pairs its label granularity with its tick spacing", () => {
  const DAY = 86_400_000;

  it("asks for one tick per label unit, so the engine cannot out-fill the labels", () => {
    // Four months of daily data: four month ticks, not the twelve the canvas
    // width would have allowed under a month-name formatter.
    expect(timeAxisTickPlan(119 * DAY)).toEqual({ scale: "month", splitNumber: 4 });
    expect(timeAxisTickPlan(30 * DAY)).toEqual({ scale: "day", splitNumber: 13 });
    expect(timeAxisTickPlan(2 * DAY)).toEqual({ scale: "day", splitNumber: 2 });
    // A twelve-hour window: one tick an hour, all of them distinct clock times.
    expect(timeAxisTickPlan(12 * 3_600_000)).toEqual({ scale: "time", splitNumber: 13 });
    expect(timeAxisTickPlan(6 * 365 * DAY)).toEqual({ scale: "year", splitNumber: 6 });
  });

  it("never asks for fewer than two ticks, however short the window", () => {
    expect(timeAxisTickPlan(90_000).splitNumber).toBe(2);
  });

  it("gives a year-long window the year, because twelve month names cannot be unique", () => {
    expect(timeAxisLabelScale(365 * DAY)).toBe("month-year");
    expect(timeAxisLabelScale(329 * DAY)).toBe("month");
  });
});

describe("timeSpanMs reads the extent a set of timestamps covers", () => {
  const DAY = 86_400_000;

  it("accepts ms numbers, Dates and ISO strings", () => {
    const base = Date.UTC(2026, 0, 1);
    expect(timeSpanMs([base, base + 5 * DAY])).toBe(5 * DAY);
    expect(timeSpanMs([new Date(base), new Date(base + 5 * DAY)])).toBe(5 * DAY);
    expect(timeSpanMs(["2026-01-01T00:00:00Z", "2026-01-06T00:00:00Z"])).toBe(5 * DAY);
  });

  it("skips gaps and refuses to invent a span from one point", () => {
    const base = Date.UTC(2026, 0, 1);
    expect(timeSpanMs([base, null, undefined, Number.NaN, base + 3 * DAY])).toBe(3 * DAY);
    expect(timeSpanMs([base])).toBeUndefined();
    expect(timeSpanMs([base, base])).toBeUndefined();
    expect(timeSpanMs([])).toBeUndefined();
  });
});

describe("formatDuration", () => {
  it("picks a unit that keeps the number short", () => {
    expect(formatDuration(450)).toBe("450ms");
    expect(formatDuration(1_500)).toBe("1.50s");
    expect(formatDuration(90_000)).toBe("1.5m");
    expect(formatDuration(7_200_000)).toBe("2.0h");
  });
});

describe("resolveFormatter", () => {
  it("prefers a series formatter, then the series format, then the fallback", () => {
    const own = resolveFormatter({ formatter: (value) => `own:${value}` });
    expect(own(3)).toBe("own:3");
    expect(own(null)).toBe("—");

    const withFormat = resolveFormatter({ format: { kind: "percent" } }, { kind: "currency" });
    expect(withFormat(9)).toBe("9.0%");

    const fallback = resolveFormatter({}, { kind: "currency" });
    expect(fallback(1_000)).toBe("$1,000");
  });
});

describe("createFormatter", () => {
  it("is a pure closure over its format", () => {
    const formatter = createFormatter({ kind: "compact" });
    expect(formatter(1_500_000)).toBe("1.5M");
    expect(formatter(1_500_000)).toBe("1.5M");
  });
});
