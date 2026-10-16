import { describe, expect, it } from "vitest";
import {
  TRADINGVIEW_CATALOG,
  TRADINGVIEW_CATEGORIES,
  TRADINGVIEW_LEGACY_EMBEDS,
  TRADINGVIEW_MODULE_HOST,
  TRADINGVIEW_SCRIPT_HOST,
  TRADINGVIEW_WIDGET_HOST,
  tradingViewModuleUrl,
  tradingViewWidgetById,
  tradingViewWidgetsByCategory,
} from "./catalog";
import { assertTradingViewUrl } from "./loader";

describe("the TradingView catalog", () => {
  it("gives every widget a script URL on an official host", () => {
    for (const widget of TRADINGVIEW_CATALOG) {
      if (widget.format === "iframe") {
        expect(widget.scriptUrl, widget.id).toBeTruthy();
        expect(() => assertTradingViewUrl(widget.scriptUrl!)).not.toThrow();
        continue;
      }
      expect(widget.moduleUrl, widget.id).toBeTruthy();
      const resolved = tradingViewModuleUrl(widget, "en", { broker: "sample" });
      expect(resolved, widget.id).not.toContain("{");
      expect(() => assertTradingViewUrl(resolved)).not.toThrow();
    }
  });

  it("classifies the format from the provider, not from preference", () => {
    const webComponents = TRADINGVIEW_CATALOG.filter((widget) => widget.format === "web-component");
    const iframes = TRADINGVIEW_CATALOG.filter((widget) => widget.format === "iframe");

    expect(webComponents.length).toBeGreaterThan(0);
    expect(iframes.length).toBeGreaterThan(0);
    for (const widget of webComponents) {
      expect(widget.element, widget.id).toMatch(/^tv-[a-z-]+$/);
      // The broker partner widgets register their element from a script on the
      // widget host rather than a module on the module host.
      expect(
        widget.moduleUrl!.startsWith(TRADINGVIEW_MODULE_HOST) || widget.moduleUrl!.startsWith(TRADINGVIEW_WIDGET_HOST),
        widget.id,
      ).toBe(true);
    }
    for (const widget of iframes) {
      expect(widget.scriptUrl).toContain(TRADINGVIEW_SCRIPT_HOST);
      expect(widget.element).toBeUndefined();
    }
  });

  it("covers every category the provider publishes", () => {
    for (const category of TRADINGVIEW_CATEGORIES) {
      expect(tradingViewWidgetsByCategory(category.id).length, category.id).toBeGreaterThan(0);
    }
  });

  it("keeps ids unique so a wrapper cannot shadow another", () => {
    const ids = TRADINGVIEW_CATALOG.map((widget) => widget.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("describes the two broker partner widgets without pretending they are market widgets", () => {
    const rating = tradingViewWidgetById("broker-rating")!;
    expect(rating.moduleUrl).toContain(TRADINGVIEW_WIDGET_HOST);
    expect(rating.moduleUrl).toContain("{broker}");
    expect(rating.supports.symbol).toBe(false);
  });

  it("points every legacy embed at a canonical replacement that exists", () => {
    for (const legacy of TRADINGVIEW_LEGACY_EMBEDS) {
      expect(tradingViewWidgetById(legacy.replacedBy), legacy.script).toBeTruthy();
    }
  });

  it("records what each canonical widget replaced, where the provider still serves it", () => {
    const miniChart = tradingViewWidgetById("mini-chart")!;
    expect(miniChart.replaces).toContain("embed-widget-mini-symbol-overview.js");
    expect(tradingViewWidgetById("advanced-chart")!.replaces).toBeUndefined();
  });

  it("resolves the module URL for a locale and rejects a missing placeholder", () => {
    const miniChart = tradingViewWidgetById("mini-chart")!;
    expect(tradingViewModuleUrl(miniChart, "de_DE")).toContain("/w/de_DE/tv-mini-chart.js");
    const rating = tradingViewWidgetById("broker-rating")!;
    expect(tradingViewModuleUrl(rating, "en", { broker: "acme" })).toContain("broker=acme");
    // An unresolved placeholder stays visible rather than producing a broken URL.
    expect(tradingViewModuleUrl(rating, "en")).toContain("{broker}");
  });

  it("declares the attribute encoding the provider's schema uses", () => {
    const miniAttributes = tradingViewWidgetById("mini-chart")!.attributes!;
    expect(miniAttributes["symbol"]).toEqual({ attribute: "symbol", encoding: "upper" });
    expect(miniAttributes["showTimeRange"]).toEqual({ attribute: "show-time-range", encoding: "boolean" });

    const tapeAttributes = tradingViewWidgetById("ticker-tape")!.attributes!;
    expect(tapeAttributes["symbols"]!.encoding).toBe("list");
    expect(tapeAttributes["hideChart"]!.encoding).toBe("boolean");

    const marketDataAttributes = tradingViewWidgetById("market-data")!.attributes!;
    expect(marketDataAttributes["symbolSectors"]).toEqual({ attribute: "symbol-sectors", encoding: "json" });
  });

  it("carries a usable minimum size for every widget", () => {
    for (const widget of TRADINGVIEW_CATALOG) {
      expect(widget.minSize.width, widget.id).toBeGreaterThan(0);
      expect(widget.minSize.height, widget.id).toBeGreaterThan(0);
      expect(widget.defaultHeight, widget.id).toBeGreaterThanOrEqual(widget.minSize.height);
    }
  });
});
