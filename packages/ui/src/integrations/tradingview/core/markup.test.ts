import { describe, expect, it } from "vitest";
import { tradingViewWidgetById } from "./catalog";
import {
  assertTradingViewSymbol,
  buildWebComponentAttributes,
  isValidTradingViewSymbol,
  serializeAttribute,
  serializeSymbolSectors,
  tradingViewSymbolHref,
} from "./markup";

const spec = (encoding: Parameters<typeof serializeAttribute>[0]["encoding"]) => ({
  attribute: "x",
  encoding,
});

describe("attribute serialisation", () => {
  it("matches the provider's converters", () => {
    expect(serializeAttribute(spec("upper"), "nasdaq:aapl")).toBe("NASDAQ:AAPL");
    expect(serializeAttribute(spec("lower"), "Horizontal")).toBe("horizontal");
    expect(serializeAttribute(spec("list"), [" a ", "b", ""])).toBe("a,b");
    expect(serializeAttribute(spec("json"), [{ sectionName: "Indices", symbols: ["X"] }])).toBe(
      '[{"sectionName":"Indices","symbols":["X"]}]',
    );
    expect(serializeAttribute(spec("boolean"), true)).toBe(true);
    expect(serializeAttribute(spec("boolean"), false)).toBeUndefined();
    expect(serializeAttribute(spec("string"), "")).toBeUndefined();
    expect(serializeAttribute(spec("string"), undefined)).toBeUndefined();
  });

  it("omits an empty list rather than writing an empty attribute", () => {
    expect(serializeAttribute(spec("list"), [])).toBeUndefined();
    expect(serializeAttribute(spec("json"), [])).toBeUndefined();
  });
});

describe("buildWebComponentAttributes", () => {
  const definition = tradingViewWidgetById("mini-chart")!;

  it("only emits attributes the widget declares", () => {
    const attributes = buildWebComponentAttributes({
      definition,
      props: { symbol: "nasdaq:aapl", chartOnly: true, notAProviderSetting: "nope" },
      extras: { symbolUrl: "https://example.com/{tvsymbol}" },
    });
    expect(attributes).toEqual({
      symbol: "NASDAQ:AAPL",
      "chart-only": true,
    });
    // A generic provider attribute (`symbol-url`) is applied by the wrapper, not
    // through a widget's settings map — so it must not appear here.
    expect(attributes).not.toHaveProperty("symbol-url");
    expect(attributes).not.toHaveProperty("not-a-provider-setting");
  });

  it("lets the escape hatch set provider keys but never LUC-controlled ones", () => {
    const attributes = buildWebComponentAttributes({
      definition,
      props: { symbol: "NASDAQ:AAPL" },
      config: { symbol: "NASDAQ:MSFT", chartOnly: true, element: "tv-other" },
    });
    // The typed prop wins over the raw config…
    expect(attributes.symbol).toBe("NASDAQ:AAPL");
    // …and the config may still fill a setting LUC did not set. `true` marks a
    // presence attribute; the wrapper renders it as `attr=""`.
    expect(attributes["chart-only"]).toBe(true);
    // A config key that is not a widget setting cannot leak an attribute.
    expect(attributes).not.toHaveProperty("element");
  });

  it("serialises symbol sectors through the widget's own JSON attribute", () => {
    const marketData = tradingViewWidgetById("market-data")!;
    const sectors = serializeSymbolSectors([{ sectionName: "FX", symbols: ["FX:EURUSD", "  "] }]);
    const attributes = buildWebComponentAttributes({ definition: marketData, props: { symbolSectors: sectors } });
    expect(attributes["symbol-sectors"]).toBe('[{"sectionName":"FX","symbols":["FX:EURUSD"]}]');
  });
});

describe("symbol handling", () => {
  it("accepts the provider's EXCHANGE:TICKER form and rejects junk", () => {
    expect(isValidTradingViewSymbol("NASDAQ:AAPL")).toBe(true);
    expect(isValidTradingViewSymbol("BINANCE:BTCUSDT")).toBe(true);
    expect(isValidTradingViewSymbol("CMCMARKETS:GOLD")).toBe(true);
    expect(isValidTradingViewSymbol("TVC:USOIL")).toBe(true);
    expect(isValidTradingViewSymbol("")).toBe(false);
    expect(isValidTradingViewSymbol("   ")).toBe(false);
    expect(isValidTradingViewSymbol("NASDAQ AAPL")).toBe(false);
    expect(() => assertTradingViewSymbol("")).toThrow(/not a valid TradingView symbol/);
  });

  it("builds the provider's symbol page URL", () => {
    expect(tradingViewSymbolHref("NASDAQ:AAPL")).toBe("https://www.tradingview.com/symbols/NASDAQ-AAPL/");
    expect(tradingViewSymbolHref("NASDAQ:AAPL", "financials-overview/")).toBe(
      "https://www.tradingview.com/symbols/NASDAQ-AAPL/financials-overview/",
    );
  });
});
