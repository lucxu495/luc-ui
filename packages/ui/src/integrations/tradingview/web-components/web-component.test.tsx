import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as LoaderModule from "../core/loader";
import { tradingViewWidgetById } from "../core/catalog";
import { TradingViewMiniChart, TradingViewTickerTag } from "../widgets";
import { TradingViewWebComponent } from "./web-component";

const loadSpy = vi.fn(async (_url: string, _options: { tag: string; timeoutMs?: number }) => undefined);
const resetSpy = vi.fn();

vi.mock("../core/loader", async (importOriginal) => {
  const actual = await importOriginal<typeof LoaderModule>();
  return {
    ...actual,
    loadTradingViewElement: (url: string, options: { tag: string }) => loadSpy(url, options),
    resetTradingViewLoad: (url: string) => resetSpy(url),
  };
});

afterEach(() => {
  loadSpy.mockClear();
  resetSpy.mockClear();
});

const miniChart = tradingViewWidgetById("mini-chart")!;

describe("TradingViewWebComponent", () => {
  it("renders the provider's element with kebab-cased attributes and an explicit theme", () => {
    render(<TradingViewMiniChart symbol="nasdaq:aapl" timeFrame="1W" showTimeScale loading="eager" theme="dark" />);
    const element = document.querySelector("tv-mini-chart")!;
    expect(element).not.toBeNull();
    expect(element.getAttribute("symbol")).toBe("NASDAQ:AAPL");
    expect(element.getAttribute("time-frame")).toBe("1W");
    expect(element.getAttribute("show-time-scale")).toBe("");
    expect(element.getAttribute("theme")).toBe("dark");
    expect(element.getAttribute("data-luc-tv-widget")).toBe("mini-chart");
  });

  it("omits attributes the caller did not set, rather than writing empty values", () => {
    render(<TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" />);
    const element = document.querySelector("tv-mini-chart")!;
    expect(element.hasAttribute("chart-only")).toBe(false);
    expect(element.hasAttribute("show-time-range")).toBe(false);
  });

  it("applies symbol-url only when the widget supports it", () => {
    render(
      <TradingViewMiniChart
        symbol="NASDAQ:AAPL"
        symbolUrl="https://example.com/stocks/{tvexchange}/{tvsymbol}"
        loading="eager"
      />,
    );
    expect(document.querySelector("tv-mini-chart")!.getAttribute("symbol-url")).toBe(
      "https://example.com/stocks/{tvexchange}/{tvsymbol}",
    );
  });

  it("shows its placeholder until the element registers, and a skeleton-shaped one by default", () => {
    render(<TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" />);
    expect(screen.getByRole("status", { name: /loading market widget/i })).toBeInTheDocument();
  });

  it("lets an inline widget supply an inline placeholder", () => {
    render(<TradingViewTickerTag symbol="NASDAQ:AAPL" loading="eager" />);
    const element = document.querySelector("tv-ticker-tag")!;
    // A block-level skeleton inside a paragraph would be re-parented by the HTML
    // parser; the tag's placeholder is a span.
    expect(element.querySelector("div")).toBeNull();
  });

  it("never loads anything until the widget is in view", () => {
    // jsdom has no IntersectionObserver, and the hook deliberately loads
    // immediately when there is nothing to defer to. Stub one that never fires
    // to exercise the lazy path itself.
    const observers: Array<() => void> = [];
    class NeverIntersecting implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds: ReadonlyArray<number> = [];
      constructor(callback: IntersectionObserverCallback) {
        observers.push(() =>
          callback([{ isIntersecting: false } as IntersectionObserverEntry], this),
        );
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = NeverIntersecting as unknown as typeof IntersectionObserver;
    try {
      render(<TradingViewMiniChart symbol="NASDAQ:AAPL" />);
      observers.forEach((notify) => notify());
      expect(loadSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it("passes only presence attributes through for boolean settings", () => {
    render(<TradingViewMiniChart symbol="NASDAQ:AAPL" chartOnly loading="eager" />);
    const element = document.querySelector("tv-mini-chart")!;
    expect(element.getAttribute("chart-only")).toBe("");
  });

  it("bounds a malformed symbol in the widget surface instead of throwing into the page", () => {
    // A symbol the provider cannot accept used to throw during render, which
    // unmounted whatever page held the widget. It is now a widget-level state:
    // no provider request, no crash, the rest of the page untouched.
    render(
      <>
        <TradingViewMiniChart symbol=" " loading="eager" />
        <p>sibling content</p>
      </>,
    );
    expect(document.querySelector("tv-mini-chart")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent(/market widget unavailable/i);
    expect(screen.getByText("sibling content")).toBeInTheDocument();
  });

  it("intercepts the provider's symbol link event and leaves attribution alone", async () => {
    const onSymbolNavigate = vi.fn();
    render(
      <TradingViewWebComponent
        definition={miniChart}
        settings={{ symbol: "NASDAQ:AAPL" }}
        loading="eager"
        onSymbolNavigate={onSymbolNavigate}
      />,
    );
    const element = document.querySelector("tv-mini-chart")!;
    const event = new CustomEvent("tv-link-open", {
      detail: { href: "https://www.tradingview.com/symbols/NASDAQ-AAPL/", context: { symbol: "NASDAQ:AAPL" } },
      cancelable: true,
      bubbles: true,
    });
    element.dispatchEvent(event);
    await waitFor(() => expect(onSymbolNavigate).toHaveBeenCalledTimes(1));
    expect(event.defaultPrevented).toBe(true);
  });

  it("survives StrictMode's double mount without registering twice", () => {
    render(
      <StrictMode>
        <TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" />
      </StrictMode>,
    );
    expect(document.querySelectorAll("tv-mini-chart")).toHaveLength(1);
  });
});
