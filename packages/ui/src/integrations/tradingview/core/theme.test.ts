import { describe, expect, it } from "vitest";
import { TRADINGVIEW_TOKEN_BRIDGE, resolveTradingViewTheme, tradingViewTokenStyle } from "./theme";

describe("the TradingView theme bridge", () => {
  it("resolves auto from Luc UI's theme and honours an explicit override", () => {
    expect(resolveTradingViewTheme("auto", "dark")).toBe("dark");
    expect(resolveTradingViewTheme("auto", "light")).toBe("light");
    expect(resolveTradingViewTheme("light", "dark")).toBe("light");
    expect(resolveTradingViewTheme("dark", "light")).toBe("dark");
  });

  it("maps only semantic tokens the provider documents", () => {
    expect(TRADINGVIEW_TOKEN_BRIDGE["--tv-widget-background-color"]).toBe("var(--surface-raised)");
    expect(TRADINGVIEW_TOKEN_BRIDGE["--tv-widget-text-color"]).toBe("var(--fg-primary)");
    expect(TRADINGVIEW_TOKEN_BRIDGE["--tv-widget-font-family"]).toBe("var(--font-sans)");
    expect(TRADINGVIEW_TOKEN_BRIDGE["--tv-widget-positive-color"]).toBe("var(--chart-positive)");
    // Every key is one of the provider's published custom properties.
    for (const token of Object.keys(TRADINGVIEW_TOKEN_BRIDGE)) {
      expect(token.startsWith("--tv-widget-")).toBe(true);
    }
  });

  it("returns no style when the caller opts out", () => {
    expect(tradingViewTokenStyle({ inheritTheme: false })).toBeUndefined();
    expect(tradingViewTokenStyle({ inheritTheme: false, transparent: true })).toEqual({
      "--tv-widget-background-color": "transparent",
    });
    const style = tradingViewTokenStyle({
      inheritTheme: true,
      transparent: true,
      colors: { "--surface-raised": "rgb(255, 255, 255)", "--fg-primary": "rgb(12, 13, 16)" },
    }) as Record<string, string>;
    expect(style["--tv-widget-background-color"]).toBe("transparent");
    expect(style["--tv-widget-text-color"]).toBe("rgb(12, 13, 16)");
    // A colour the page has not resolved yet is omitted, never handed over as a
    // `var(…)` the provider cannot parse.
    expect(style["--tv-widget-accent-color"]).toBeUndefined();
    // The font family is a literal reference, not a colour.
    expect(style["--tv-widget-font-family"]).toBe("var(--font-sans)");
  });

  it("emits no colour overrides before the page has resolved its tokens", () => {
    // Server render / hydration: the provider keeps its own themed defaults
    // instead of receiving a `var(…)` that resolves to `lab(…)`.
    expect(tradingViewTokenStyle({ inheritTheme: true })).toBeUndefined();
  });
});
