import { describe, expect, it } from "vitest";
import { defaultChartTheme, paletteColor } from "./theme";
import {
  correlationPalette,
  divergingPalette,
  fanPalette,
  rampColor,
  robustSymmetricDomain,
  sequentialPalette,
  seriesColor,
  seriesSlot,
} from "./palette";

const THEME = defaultChartTheme;

describe("seriesSlot", () => {
  it("is deterministic for the same key, across calls", () => {
    expect(seriesSlot("funding")).toBe(seriesSlot("funding"));
    expect(seriesSlot("some.unpinned.metric")).toBe(seriesSlot("some.unpinned.metric"));
  });

  it("pins well-known research keys to fixed slots", () => {
    expect(seriesSlot("benchmark")).toBe(seriesSlot("reference"));
    expect(seriesSlot("price")).toBe(0);
    expect(seriesSlot("funding")).not.toBe(seriesSlot("price"));
  });

  it("lets an explicit index win, so a caller can own its own order", () => {
    expect(seriesSlot("funding", 3)).toBe(3);
  });

  it("does not collide for the pinned keys", () => {
    const pinned = ["price", "benchmark", "funding", "open_interest", "volatility", "dvol", "drawdown"];
    const slots = pinned.map((key) => seriesSlot(key));
    expect(new Set(slots).size).toBe(pinned.length);
  });
});

describe("seriesColor", () => {
  it("always resolves to a theme colour, never undefined", () => {
    for (const key of ["price", "benchmark", "unknown.key", "aa", "bb"]) {
      expect(typeof seriesColor(THEME, key)).toBe("string");
      expect(seriesColor(THEME, key).length).toBeGreaterThan(0);
    }
  });

  it("matches the categorical palette for a pinned slot", () => {
    expect(seriesColor(THEME, "price")).toBe(paletteColor(THEME, 0));
    expect(seriesColor(THEME, "benchmark")).toBe(paletteColor(THEME, seriesSlot("benchmark")));
  });
});

describe("ramps", () => {
  it("builds a sequential ramp of the requested length, low → high", () => {
    const ramp = sequentialPalette(THEME, 5);
    expect(ramp).toHaveLength(5);
    expect(new Set(ramp).size).toBe(5);
    // Same input, same ramp — a heatmap must not repaint between renders.
    expect(sequentialPalette(THEME, 5)).toEqual(ramp);
  });

  it("builds a diverging ramp with an exact midpoint colour on an odd length", () => {
    const ramp = divergingPalette(THEME, 7);
    expect(ramp).toHaveLength(7);
    expect(ramp[3]).toBe(divergingPalette(THEME, 7)[3]);
    expect(new Set(ramp).size).toBe(7);
  });

  it("keeps the correlation ramp on the sign axis, not the loss/gain pair", () => {
    // Correlation says "which side", never "good or bad": the ramp starts from
    // the correlation anchors, and those are deliberately not the loss/gain
    // tokens the general diverging ramp's warm end would imply.
    const ramp = correlationPalette(THEME, 7);
    expect(ramp).toHaveLength(7);
    expect(new Set(ramp).size).toBe(7);
    expect(ramp).not.toEqual(divergingPalette(THEME, 7));
    expect(THEME.correlationAnchors[0]).not.toBe(THEME.negative);
    expect(THEME.correlationAnchors[1]).not.toBe(THEME.neutral);
    expect(THEME.correlationAnchors[2]).not.toBe(THEME.positive);
    expect(new Set(THEME.correlationAnchors).size).toBe(3);
  });

  it("keeps a fan on one hue, widening opacity outward", () => {
    const fan = fanPalette(THEME, 3);
    expect(fan).toHaveLength(3);
    const alpha = (value: string) => Number(/rgba\([^)]*?,\s*([\d.]+)\)$/.exec(value)?.[1] ?? "1");
    // Widest band first (dimmest), centre last (most solid).
    expect(alpha(fan[0]!)).toBeLessThan(alpha(fan[2]!));
    // Every band is the same hue family — the alpha channel is the only change.
    const hue = (value: string) => value.replace(/[\d.]+\)$/, ")");
    expect(hue(fan[0]!)).toBe(hue(fan[2]!));
  });

  it("indexes a ramp by normalised position, clamped", () => {
    const ramp = sequentialPalette(THEME, 3);
    expect(rampColor(ramp, 0)).toBe(ramp[0]);
    expect(rampColor(ramp, 1)).toBe(ramp[2]);
    expect(rampColor(ramp, 5)).toBe(ramp[2]);
    expect(rampColor(ramp, -1)).toBe(ramp[0]);
  });
});

describe("robustSymmetricDomain", () => {
  it("caps the domain at a high quantile so one outlier cannot flatten the ramp", () => {
    // Nineteen ordinary months around ±10% and one 450% outlier.
    const values = [...Array.from({ length: 19 }, (_, i) => (i % 2 === 0 ? 8 : -9)), 450];
    const domain = robustSymmetricDomain(values, { percentile: 0.95 });
    expect(domain).not.toBeNull();
    // The 95th percentile of 20 values is the 19th rank (index 18), not the 450.
    expect(domain!.cap).toBeLessThan(50);
    expect(domain!.min).toBe(-domain!.max);
    expect(domain!.midpoint).toBe(0);
  });

  it("stays symmetric around a non-zero midpoint", () => {
    const domain = robustSymmetricDomain([1, 2, 3, 4, 5], { midpoint: 3, percentile: 1 });
    expect(domain).toEqual({ min: 1, max: 5, cap: 2, midpoint: 3 });
  });

  it("returns null when there is nothing finite to measure", () => {
    expect(robustSymmetricDomain([], {})).toBeNull();
    expect(robustSymmetricDomain([Number.NaN, Number.POSITIVE_INFINITY], {})).toBeNull();
  });

  it("never returns a zero-width domain", () => {
    const domain = robustSymmetricDomain([0, 0, 0], { floor: 1 });
    expect(domain).toEqual({ min: -1, max: 1, cap: 1, midpoint: 0 });
  });
});
