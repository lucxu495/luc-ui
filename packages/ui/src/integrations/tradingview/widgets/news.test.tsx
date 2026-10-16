import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TradingViewSymbolInfo } from "./symbol-details";
import { TradingViewTopStories } from "./news";

/**
 * The provider config an embed actually receives.
 *
 * The iframe adapter writes the provider's JSON into the embed script's own text
 * content, so the script is the read-back of what the widget was configured
 * with — the same thing TradingView reads when the script executes.
 *
 * A widget unmounted by the previous test is parked (hidden) for a short grace
 * period so the provider's own teardown is safe — parked nodes are not "the
 * widget under test".
 */
function liveEmbedScript(): HTMLScriptElement | null {
  return (
    [...document.querySelectorAll<HTMLScriptElement>("script[src*='embed-widget']")].find(
      (node) => !node.closest("#luc-tv-teardown-lot"),
    ) ?? null
  );
}

async function providerConfigOf(): Promise<Record<string, unknown>> {
  await waitFor(() => {
    expect(liveEmbedScript()).not.toBeNull();
  });
  return JSON.parse(liveEmbedScript()!.textContent ?? "{}") as Record<string, unknown>;
}

describe("TradingViewTopStories", () => {
  it("follows ONE instrument when the feed mode is `symbol`", async () => {
    render(
      <TradingViewTopStories feedMode="symbol" symbol="BINANCE:BTCUSDT" height={420} loading="eager" />,
    );
    const config = await providerConfigOf();
    /*
     * `feedMode` is the provider's enum, never a symbol: passing the instrument
     * as the mode was silently ignored and the widget fell back to the global
     * timeline (a BTC page full of S&P and DXY headlines).
     */
    expect(config.feedMode).toBe("symbol");
    expect(config.symbol).toBe("BINANCE:BTCUSDT");
  });

  it("defaults to the provider's global timeline", async () => {
    render(<TradingViewTopStories height={420} loading="eager" />);
    const config = await providerConfigOf();
    expect(config.feedMode).toBe("all_symbols");
    expect(config.symbol).toBeUndefined();
  });

  it("refuses a symbol feed with no usable symbol instead of showing all markets", () => {
    render(<TradingViewTopStories feedMode="symbol" height={420} loading="eager" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(liveEmbedScript()).toBeNull();
  });
});

describe("iframe widget locale", () => {
  it("passes the caller's provider locale into the embed config", async () => {
    render(<TradingViewSymbolInfo symbol="BINANCE:BTCUSDT" locale="zh_CN" height={300} loading="eager" />);
    const config = await providerConfigOf();
    expect(config.locale).toBe("zh_CN");
    expect(config.symbol).toBe("BINANCE:BTCUSDT");
  });

  it("falls back to English when no locale is given", async () => {
    render(<TradingViewSymbolInfo symbol="BINANCE:BTCUSDT" height={300} loading="eager" />);
    const config = await providerConfigOf();
    expect(config.locale).toBe("en");
  });
});
