import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  compositeOver,
  contrastRatio,
  defaultChartTheme,
  flattenColor,
  mixColor,
  modeOf,
  paletteColor,
  parseColor,
  readableInk,
  resolveChartTheme,
  toneColor,
  withAlpha,
} from "./theme";

/**
 * jsdom has no canvas, and the theme resolver normalises colours through a 2D
 * context. A one-property stub is enough to exercise the code path without
 * pretending to implement canvas.
 */
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ fillStyle: "#000000" }) as unknown as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
  document.documentElement.classList.remove("dark");
});

describe("modeOf", () => {
  it("reads the theme from the class or the data attribute", () => {
    document.documentElement.dataset.theme = "light";
    expect(modeOf()).toBe("light");
    document.documentElement.classList.add("dark");
    expect(modeOf()).toBe("dark");
  });
});

describe("resolveChartTheme", () => {
  it("falls back to the reference theme when no token resolves", () => {
    // jsdom does not resolve custom properties, so every token comes back empty.
    document.documentElement.classList.add("dark");
    const theme = resolveChartTheme();
    expect(theme.palette).toHaveLength(12);
    expect(theme.mode).toBe("dark");
    expect(theme.fontCaption).toBe(defaultChartTheme.fontCaption);
  });
});

describe("paletteColor", () => {
  it("wraps around the palette instead of running off the end", () => {
    expect(paletteColor(defaultChartTheme, 0)).toBe(defaultChartTheme.palette[0]);
    expect(paletteColor(defaultChartTheme, 12)).toBe(defaultChartTheme.palette[0]);
    expect(paletteColor(defaultChartTheme, 13)).toBe(defaultChartTheme.palette[1]);
  });
});

describe("toneColor", () => {
  it("maps direction to semantic colours and everything else to the palette", () => {
    expect(toneColor(defaultChartTheme, "positive", 3)).toBe(defaultChartTheme.positive);
    expect(toneColor(defaultChartTheme, "negative", 3)).toBe(defaultChartTheme.negative);
    expect(toneColor(defaultChartTheme, "warning", 3)).toBe(defaultChartTheme.warning);
    expect(toneColor(defaultChartTheme, "neutral", 3)).toBe(defaultChartTheme.neutral);
    expect(toneColor(defaultChartTheme, "accent", 4)).toBe(defaultChartTheme.palette[0]);
    expect(toneColor(defaultChartTheme, undefined, 4)).toBe(defaultChartTheme.palette[4]);
  });
});

describe("withAlpha", () => {
  it("attaches an alpha channel to hex and rgb colours", () => {
    expect(withAlpha("#7dcee2", 0.2)).toBe("rgba(125, 206, 226, 0.2)");
    expect(withAlpha("rgb(10, 20, 30)", 0.5)).toBe("rgba(10, 20, 30, 0.5)");
  });

  it("clamps out-of-range alpha and passes unknown formats through", () => {
    expect(withAlpha("#000000", 4)).toBe("rgba(0, 0, 0, 1)");
    expect(withAlpha("transparent", 0.5)).toBe("transparent");
  });
});

describe("parseColor", () => {
  it("reads the forms the chart layer produces", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseColor("rgba(10, 20, 30, 0.25)")).toEqual({ r: 10, g: 20, b: 30, a: 0.25 });
    expect(parseColor("#7dcee2")).toEqual({ r: 125, g: 206, b: 226, a: 1 });
  });

  it("refuses to guess at anything else", () => {
    expect(parseColor("color-mix(in oklab, red, blue)")).toBeNull();
    expect(parseColor("transparent")).toBeNull();
  });

  it("converts oklch — the token layer's own notation — to real channels", () => {
    // The fallback theme is authored in oklch, and a canvas cannot parse it, so
    // the ramp/hue maths must resolve it before the DOM is ready.
    const mid = parseColor("oklch(0.5 0.1 200)");
    expect(mid).not.toBeNull();
    expect(mid!.r).toBeGreaterThanOrEqual(0);
    expect(mid!.r).toBeLessThanOrEqual(255);
    expect(mid!.a).toBe(1);
    // A white oklch resolves to white, which is the sanity check that the
    // conversion is wired the right way round.
    expect(parseColor("oklch(1 0 0)")).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(parseColor("oklch(0 0 0)")).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(parseColor("oklch(0.5 0.1 200 / 0.4)")?.a).toBeCloseTo(0.4, 3);
  });
});

describe("colour maths", () => {
  it("composites a translucent colour over its surface", () => {
    const half = flattenColor("rgba(255, 255, 255, 0.5)", "rgb(0, 0, 0)");
    expect(half?.r).toBeCloseTo(127.5, 1);
    expect(half?.a).toBeCloseTo(1, 5);
    expect(compositeOver({ r: 0, g: 0, b: 0, a: 0 }, { r: 255, g: 255, b: 255, a: 1 })).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    });
  });

  it("interpolates the way a visualMap ramp does", () => {
    const mixed = mixColor({ r: 0, g: 0, b: 0, a: 1 }, { r: 100, g: 200, b: 40, a: 1 }, 0.5);
    expect(mixed).toEqual({ r: 50, g: 100, b: 20, a: 1 });
  });

  it("matches the WCAG reference ratios", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(21, 1);
    expect(contrastRatio({ r: 255, g: 255, b: 255, a: 1 }, { r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 3);
  });
});

describe("readableInk", () => {
  const inks = { dark: "rgb(20, 20, 24)", light: "rgb(250, 250, 252)" };

  it("uses dark ink on a light mark and light ink on a dark mark", () => {
    expect(readableInk("rgb(203, 204, 206)", inks)).toBe(inks.dark);
    expect(readableInk("rgb(100, 217, 156)", inks)).toBe(inks.dark);
    expect(readableInk("rgb(60, 64, 69)", inks)).toBe(inks.light);
    expect(readableInk("rgb(0, 126, 70)", inks)).toBe(inks.light);
  });

  it("composites a translucent mark over the surface behind it first", () => {
    // 16% grey over white is still light; over near-black it is still dark.
    expect(readableInk("rgba(120, 120, 120, 0.16)", { ...inks, surface: "rgb(255, 255, 255)" })).toBe(inks.dark);
    expect(readableInk("rgba(200, 200, 200, 0.16)", { ...inks, surface: "rgb(24, 27, 32)" })).toBe(inks.light);
  });

  it("keeps every step of the correlation ramp above 4:1", () => {
    // The measured worst case in both themes: the ramp crosses mid-lightness
    // where neither ink is comfortable, and the better one still clears 4:1.
    const darkTheme = { negative: "rgb(253, 129, 124)", neutral: "rgb(150, 155, 161)", positive: "rgb(100, 217, 156)", card: "rgb(24, 27, 32)" };
    const lightTheme = { negative: "rgb(200, 46, 47)", neutral: "rgb(150, 155, 161)", positive: "rgb(0, 126, 70)", card: "rgb(255, 255, 255)" };

    for (const theme of [darkTheme, lightTheme]) {
      const mid = flattenColor(withAlpha(theme.neutral, 0.34), theme.card)!;
      for (let step = 0; step <= 20; step += 1) {
        const value = -1 + (step * 2) / 20;
        const cell =
          value < 0
            ? mixColor(parseColor(theme.negative)!, mid, value + 1)
            : mixColor(mid, parseColor(theme.positive)!, value);
        const ink = readableInk(
          `rgb(${Math.round(cell.r)}, ${Math.round(cell.g)}, ${Math.round(cell.b)})`,
          { dark: inks.dark, light: inks.light, surface: theme.card },
        );
        expect(contrastRatio(cell, parseColor(ink)!)).toBeGreaterThan(4);
      }
    }
  });
});
