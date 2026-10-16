import { describe, expect, it } from "vitest";
import {
  AXIS_LABEL_MARGIN,
  CHART_PLOT_LAYOUT,
  DEFAULT_AXIS_PADDING,
  DEFAULT_Y_AXIS_SIDE,
  LINEAR_SCALE_CAPABILITY,
  MARKER_AXIS_PADDING,
  axisBoundFn,
  isLogEligible,
  niceStep,
  normalizeScaleCapability,
  resolveAxisBounds,
  resolveAxisDomain,
  resolveChartPlotRect,
  resolveScaleMode,
} from "./axis";

/** WCAG-free helper: a domain is only valid when it contains its data. */
function contains(domain: { min: number; max: number }, values: readonly number[]) {
  return values.every((value) => value >= domain.min && value <= domain.max);
}

describe("axis side", () => {
  it("defaults an ordinary single-axis chart to the right", () => {
    expect(DEFAULT_Y_AXIS_SIDE).toBe("right");
  });
});

describe("resolveChartPlotRect", () => {
  it("reserves the gutter on the axis side only", () => {
    expect(resolveChartPlotRect(["right"])).toEqual({
      left: CHART_PLOT_LAYOUT.edgeInset,
      right: CHART_PLOT_LAYOUT.axisGutter,
      top: CHART_PLOT_LAYOUT.topInset,
      bottom: CHART_PLOT_LAYOUT.bottomInset,
      containLabel: false,
    });
    expect(resolveChartPlotRect(["left"])).toMatchObject({
      left: CHART_PLOT_LAYOUT.axisGutter,
      right: CHART_PLOT_LAYOUT.edgeInset,
    });
  });

  it("reserves both sides for a deliberate dual-axis chart", () => {
    const rect = resolveChartPlotRect(["right", "left"]);
    expect(rect.left).toBe(CHART_PLOT_LAYOUT.axisGutter);
    expect(rect.right).toBe(CHART_PLOT_LAYOUT.axisGutter);
  });

  it("never depends on label text, so stacked charts share one plot width", () => {
    // The signature is the contract: geometry is a function of which sides carry
    // an axis and nothing else, so `$124,658` and `-33.1%` resolve identically.
    // A gutter wide enough for a compact currency tick is reserved either way.
    expect(resolveChartPlotRect(["right"])).toEqual({
      left: CHART_PLOT_LAYOUT.edgeInset,
      right: CHART_PLOT_LAYOUT.axisGutter,
      top: CHART_PLOT_LAYOUT.topInset,
      bottom: CHART_PLOT_LAYOUT.bottomInset,
      containLabel: false,
    });
    expect(CHART_PLOT_LAYOUT.axisGutter).toBeGreaterThanOrEqual(48);
    expect(AXIS_LABEL_MARGIN).toBeLessThan(CHART_PLOT_LAYOUT.axisGutter);
  });
});

describe("scale capability", () => {
  it("collapses a nonsense declaration to linear-only", () => {
    expect(normalizeScaleCapability(null)).toEqual(LINEAR_SCALE_CAPABILITY);
    expect(normalizeScaleCapability({ allowed: [] })).toEqual(LINEAR_SCALE_CAPABILITY);
    // Duplicates collapse; a default outside the allow-list is replaced.
    expect(normalizeScaleCapability({ allowed: ["log", "log"], default: "linear" })).toEqual({
      allowedScaleModes: ["log"],
      defaultScaleMode: "log",
    });
    expect(
      normalizeScaleCapability({ allowed: ["linear", "log"], default: "log" }),
    ).toEqual({ allowedScaleModes: ["linear", "log"], defaultScaleMode: "log" });
  });

  it("only calls strictly positive data log-eligible", () => {
    expect(isLogEligible([1, 2, 3])).toBe(true);
    expect(isLogEligible([1, null, 3])).toBe(true);
    expect(isLogEligible([1, 0, 3])).toBe(false);
    expect(isLogEligible([1, -2])).toBe(false);
    expect(isLogEligible([null, undefined])).toBe(false);
  });

  it("falls back to linear with a reason instead of drawing a broken axis", () => {
    const both = normalizeScaleCapability({ allowed: ["linear", "log"], default: "log" });
    expect(resolveScaleMode({ capability: both, values: [1, 2] })).toEqual({ mode: "log", fallback: null });
    expect(resolveScaleMode({ capability: both, values: [1, 0] })).toEqual({
      mode: "linear",
      fallback: "non-positive-data",
    });
    expect(resolveScaleMode({ capability: LINEAR_SCALE_CAPABILITY, requested: "log", values: [1] })).toEqual({
      mode: "linear",
      fallback: "not-allowed",
    });
    expect(resolveScaleMode({ capability: both })).toEqual({ mode: "log", fallback: null });
  });
});

describe("niceStep", () => {
  it("snaps to the 1 / 2 / 2.5 / 5 / 10 rhythm", () => {
    expect(niceStep(0.19)).toBeCloseTo(0.2, 10);
    expect(niceStep(1.4)).toBe(2);
    expect(niceStep(2.1)).toBeCloseTo(2.5, 10);
    expect(niceStep(3)).toBe(5);
    expect(niceStep(65)).toBe(100);
    expect(niceStep(0)).toBe(1);
  });
});

describe("linear domains", () => {
  it("keeps every point inside the plot and leaves headroom on both sides", () => {
    const values = [10, 40, 25, 33];
    const domain = resolveAxisDomain(values)!;
    expect(contains(domain, values)).toBe(true);
    expect(domain.min).toBeLessThan(10);
    expect(domain.max).toBeGreaterThan(40);
  });

  it("anchors a non-positive series at zero without inventing positive data", () => {
    // The drawdown case: 0 is the semantic ceiling. The plot reaches a little
    // past it so the crest keeps its stroke and glow inside the plot, and that
    // extra band is *headroom* — never a labelled value, or the axis would imply
    // drawdown can be positive.
    const drawdown = [-0.8486, -0.4, -0.1, 0];
    const domain = resolveAxisDomain(drawdown)!;
    expect(domain.max).toBeGreaterThan(0);
    expect(domain.max).toBeLessThan(0.1);
    expect(domain.maxHeadroom).toBe(true);
    expect(domain.minHeadroom).toBe(true);
    // The deepest drawdown and the crest keep the same proportional headroom,
    // so neither stroke rides the top or the bottom of the plot.
    expect(domain.min).toBeCloseTo(-0.8486 * 1.1, 6);
    expect(domain.max).toBeCloseTo(0.8486 * 0.1, 6);
  });

  it("keeps a strictly positive series out of negative territory", () => {
    const volatility = [0.123, 0.4, 3.608];
    const domain = resolveAxisDomain(volatility)!;
    expect(domain.max).toBeGreaterThan(3.608);
    expect(domain.maxHeadroom).toBe(true);
    // Volatility has no negative part: the lower headroom stops at zero, and
    // that zero is a real axis value, so it keeps its label.
    expect(domain.min).toBe(0);
    expect(domain.minHeadroom).toBe(false);
    expect(contains(domain, volatility)).toBe(true);
  });

  it("keeps zero visible for a signed series", () => {
    const signed = [-0.606, 0.2, 7.226];
    const domain = resolveAxisDomain(signed)!;
    expect(domain.min).toBeLessThan(0);
    expect(domain.max).toBeGreaterThan(0);
    expect(domain.minHeadroom).toBe(true);
    expect(domain.maxHeadroom).toBe(true);
  });

  it("gives a signed series around zero headroom on both sides", () => {
    const domain = resolveAxisDomain([-1, 0, 1])!;
    expect(domain.min).toBeLessThan(-1);
    expect(domain.max).toBeGreaterThan(1);
  });

  it("holds the baseline for a zero-based mark", () => {
    const domain = resolveAxisDomain([12, 40, 25], { zeroBaseline: true })!;
    expect(domain.min).toBe(0);
    expect(domain.max).toBeGreaterThan(40);
    const negative = resolveAxisDomain([-12, -40, -25], { zeroBaseline: true })!;
    expect(negative.max).toBe(0);
    expect(negative.min).toBeLessThan(-40);
  });

  it("turns a constant series into a readable range, never a zero-height one", () => {
    const constant = resolveAxisDomain([100, 100, 100])!;
    expect(constant.max).toBeGreaterThan(100);
    expect(constant.min).toBeLessThan(100);
    // A constant 100 lands on a round ±5 range (plus headroom), not a degenerate one.
    expect(constant.min).toBeCloseTo(94, 6);
    expect(constant.max).toBeCloseTo(106, 6);
    const zero = resolveAxisDomain([0, 0, 0])!;
    expect(zero.max).toBeGreaterThan(0);
    expect(zero.min).toBeLessThan(0);
    expect(Number.isFinite(zero.min) && Number.isFinite(zero.max)).toBe(true);
  });

  it("keeps a near-flat series legible instead of collapsing the axis", () => {
    const nearFlat = resolveAxisDomain([100, 100.000001, 100.000002])!;
    expect(nearFlat.max - nearFlat.min).toBeGreaterThan(0);
    expect(nearFlat.max - nearFlat.min).toBeLessThan(100 * 0.05);
    // The widening is a round step (0.25 here), so the axis still has readable
    // ticks instead of drifting into 100.000001 territory.
    expect(nearFlat.max - nearFlat.min).toBeCloseTo(0.3, 6);
    expect(contains(nearFlat, [100, 100.000002])).toBe(true);
  });

  it("returns null when there is nothing to plot", () => {
    expect(resolveAxisDomain([])).toBeNull();
    expect(resolveAxisDomain([null, undefined])).toBeNull();
  });

  it("keeps a declared reference level visible", () => {
    const values = [30, 45, 60];
    const withoutLevel = resolveAxisDomain(values)!;
    expect(withoutLevel.max).toBeLessThan(95);
    const withLevel = resolveAxisDomain(values, { include: [95] })!;
    expect(withLevel.max).toBeGreaterThanOrEqual(95);
  });

  it("reads a percentage exactly like the ratio it was scaled from", () => {
    // 0.331 → 33.1 is a monotonic display conversion: the domain must not care.
    const ratio = resolveAxisDomain([-0.85, -0.33, 0])!;
    const percent = resolveAxisDomain([-85, -33, 0])!;
    expect(percent.min / 100).toBeCloseTo(ratio.min, 8);
    expect(percent.max / 100).toBeCloseTo(ratio.max, 8);
  });

  it("pads an autoscaled extent but leaves a bounded one to the caller", () => {
    const domain = resolveAxisBounds({ extent: { min: 34, max: 62 }, scaleMode: "linear" });
    expect(domain.min).toBeLessThanOrEqual(34);
    expect(domain.max).toBeGreaterThanOrEqual(62);
    expect(domain.minHeadroom).toBe(true);
    // A bounded metric (RSI 0–100, a correlation −1–1) does not go through this
    // path at all: `ChartSpec.axes[].min`/`max` are passed to the engine verbatim,
    // which `buildCartesianOption` is tested for.
  });

  it("gives a marker more room than a bare stroke", () => {
    expect(MARKER_AXIS_PADDING).toBeGreaterThan(DEFAULT_AXIS_PADDING);
    const plain = resolveAxisBounds({ extent: { min: 1, max: 1.9 } });
    const marked = resolveAxisBounds({ extent: { min: 1, max: 1.9 }, marker: true });
    expect(marked.max - marked.min).toBeGreaterThan(plain.max - plain.min);
  });

  it("does not label the zero baseline of a bar chart as headroom", () => {
    const bars = resolveAxisDomain([12, 40, 25], { zeroBaseline: true })!;
    expect(bars.min).toBe(0);
    expect(bars.minHeadroom).toBe(false);
    expect(bars.maxHeadroom).toBe(true);
  });
});

describe("log domains", () => {
  it("pads multiplicatively and stays on readable decades", () => {
    const price = [2.24, 30, 900, 124_658];
    const domain = resolveAxisBounds({ extent: { min: 2.24, max: 124_658 }, scaleMode: "log" });
    expect(contains(domain, price)).toBe(true);
    expect(domain.min).toBeLessThan(2.24);
    expect(domain.max).toBeGreaterThan(124_658);
    // Headroom is proportional, not an absolute number of dollars.
    expect(domain.min).toBeGreaterThan(0.5);
    expect(domain.max / 124_658).toBeGreaterThan(1);
    expect(domain.max / 124_658).toBeLessThan(20);
  });

  it("is total even when handed non-positive values", () => {
    const domain = resolveAxisBounds({ extent: { min: 0, max: 0 }, scaleMode: "log" });
    expect(domain.min).toBeGreaterThan(0);
    expect(domain.max).toBeGreaterThan(domain.min);
  });
});

describe("axisBoundFn", () => {
  it("reads ECharts' visible extent and follows it as the window changes", () => {
    const bound = axisBoundFn("max", { scaleMode: "linear" });
    const full = bound({ min: 10, max: 600 });
    const zoomed = bound({ min: 10, max: 13 });
    expect(full).toBeGreaterThan(600);
    expect(zoomed).toBeGreaterThan(13);
    expect(zoomed).toBeLessThan(600);
  });

  it("stays finite when the engine reports an empty extent", () => {
    const bound = axisBoundFn("min", { scaleMode: "linear" });
    expect(bound({ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
