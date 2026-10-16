import { describe, expect, it } from "vitest";
import { formatDelta, formatNumber, resolveDeltaTone, splitNumberParts } from "./format";

describe("formatNumber", () => {
  it("groups integers", () => {
    expect(formatNumber(128431)).toBe("128,431");
  });

  it("uses one decimal for percent values", () => {
    expect(formatNumber(12.4, { kind: "percent" })).toBe("12.4%");
    expect(formatNumber(-8.1, { kind: "percent", signed: true })).toBe("-8.1%");
  });

  it("keeps detail for sub-0.1 percent values", () => {
    expect(formatNumber(0.04, { kind: "percent" })).toBe("0.04%");
  });

  it("formats currency and compact scales", () => {
    // Currency defaults to whole units; cents are opt-in.
    expect(formatNumber(109241.42, { kind: "currency" })).toBe("$109,241");
    expect(formatNumber(109241.42, { kind: "currency", minimumFractionDigits: 2 })).toBe("$109,241.42");
    expect(formatNumber(48_291_004, { kind: "compact" })).toBe("48.3M");
  });

  it("never renders NaN", () => {
    expect(formatNumber(Number.NaN)).toBe("—");
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("splitNumberParts", () => {
  it("separates sign, integer, fraction and unit", () => {
    const parts = splitNumberParts(-1234.5, { kind: "decimal", minimumFractionDigits: 1 });
    expect(parts.sign).toBe("-");
    expect(parts.integer).toBe("1,234");
    expect(parts.fraction).toBe(".5");
  });

  it("reports an unavailable value", () => {
    expect(splitNumberParts(null).formatted).toBe("—");
  });
});

describe("delta helpers", () => {
  it("resolves tone and inverts when lower is better", () => {
    expect(resolveDeltaTone(4)).toBe("positive");
    expect(resolveDeltaTone(-4)).toBe("negative");
    expect(resolveDeltaTone(0)).toBe("neutral");
    expect(resolveDeltaTone(-4, true)).toBe("positive");
    expect(resolveDeltaTone(null)).toBe("neutral");
  });

  it("formats deltas with an explicit sign", () => {
    expect(formatDelta(12.4)).toBe("+12.4%");
    expect(formatDelta(-3.05)).toBe("-3.1%");
  });
});
