import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertTradingViewUrl,
  createTradingViewEmbed,
  getTradingViewLoadState,
  loadTradingViewElement,
  resetTradingViewLoad,
  subscribeTradingViewLoad,
} from "./loader";
import { TRADINGVIEW_MODULE_HOST, TRADINGVIEW_SCRIPT_HOST } from "./catalog";

afterEach(() => {
  vi.restoreAllMocks();
  resetTradingViewLoad(`${TRADINGVIEW_MODULE_HOST}/w/en/tv-test-widget.js`);
});

describe("URL allow list", () => {
  it("accepts the three official hosts over https", () => {
    expect(assertTradingViewUrl(`${TRADINGVIEW_MODULE_HOST}/w/en/tv-mini-chart.js`).host).toBe(
      "widgets.tradingview-widget.com",
    );
    expect(assertTradingViewUrl(`${TRADINGVIEW_SCRIPT_HOST}/embed-widget-timeline.js`).host).toBe("s3.tradingview.com");
    expect(assertTradingViewUrl("https://www.tradingview-widget.com/widget/broker-rating.js").host).toBe(
      "www.tradingview-widget.com",
    );
  });

  it("refuses anything else, including http and lookalike hosts", () => {
    expect(() => assertTradingViewUrl("https://evil.example.com/tv.js")).toThrow(/Refusing to load/);
    expect(() => assertTradingViewUrl("http://widgets.tradingview-widget.com/w/en/tv-mini-chart.js")).toThrow(
      /Refusing to load/,
    );
    expect(() => assertTradingViewUrl("https://widgets.tradingview-widget.com.evil.example/tv.js")).toThrow(
      /Refusing to load/,
    );
    expect(() => assertTradingViewUrl("javascript:alert(1)")).toThrow();
    expect(() => assertTradingViewUrl("not a url")).toThrow();
  });
});

describe("web component loading", () => {
  it("deduplicates concurrent requests for the same module", async () => {
    // Pretend the element is already registered: no import is needed and the
    // promise resolves immediately.
    vi.spyOn(window.customElements, "get").mockImplementation((tag: string) =>
      tag === "tv-test-widget" ? (class extends HTMLElement {}) : undefined,
    );
    const url = `${TRADINGVIEW_MODULE_HOST}/w/en/tv-test-widget.js`;
    resetTradingViewLoad(url);
    const first = loadTradingViewElement(url, { tag: "tv-test-widget" });
    const second = loadTradingViewElement(url, { tag: "tv-test-widget" });
    expect(first).toBe(second);
    await first;
    expect(getTradingViewLoadState(url)).toBe("ready");
  });

  it("reports a registration that never arrives, then recovers when it does", async () => {
    vi.spyOn(window.customElements, "get").mockReturnValue(undefined);
    let resolveDefined: () => void = () => {};
    const defined = new Promise<CustomElementConstructor>((resolve) => {
      resolveDefined = () => resolve(class extends HTMLElement {});
    });
    vi.spyOn(window.customElements, "whenDefined").mockReturnValue(defined);
    const url = `${TRADINGVIEW_MODULE_HOST}/w/en/tv-test-widget.js`;
    resetTradingViewLoad(url);

    // The module loads, but the element never registers: the timeout is what
    // reports the failure, and a late registration still wins.
    await loadTradingViewElement(url, {
      tag: "tv-test-widget",
      timeoutMs: 5,
      loadModule: async () => undefined,
    });
    expect(getTradingViewLoadState(url)).toBe("failed");

    resolveDefined();
    await defined;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getTradingViewLoadState(url)).toBe("ready");
  });

  it("reports a module that cannot be imported", async () => {
    vi.spyOn(window.customElements, "get").mockReturnValue(undefined);
    const url = `${TRADINGVIEW_MODULE_HOST}/w/en/tv-test-widget.js`;
    resetTradingViewLoad(url);
    await loadTradingViewElement(url, {
      tag: "tv-test-widget",
      timeoutMs: 50,
      loadModule: async () => {
        throw new Error("network");
      },
    });
    expect(getTradingViewLoadState(url)).toBe("failed");
  });

  it("notifies subscribers on every transition", async () => {
    vi.spyOn(window.customElements, "get").mockImplementation((tag: string) =>
      tag === "tv-test-widget" ? (class extends HTMLElement {}) : undefined,
    );
    const url = `${TRADINGVIEW_MODULE_HOST}/w/en/tv-test-widget.js`;
    resetTradingViewLoad(url);
    const seen: string[] = [];
    const unsubscribe = subscribeTradingViewLoad(url, () => seen.push(getTradingViewLoadState(url)));
    await loadTradingViewElement(url, { tag: "tv-test-widget" });
    unsubscribe();
    expect(seen).toContain("pending");
    expect(seen).toContain("ready");
  });
});

describe("iframe embeds", () => {
  function build() {
    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    const target = document.createElement("div");
    container.append(target);
    document.body.append(container);
    return { container, target };
  }

  it("writes the provider's config as the script's own text content", () => {
    const { container, target } = build();
    const embed = createTradingViewEmbed({
      scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-info.js`,
      container,
      target,
      config: { symbol: "NASDAQ:AAPL", colorTheme: "dark" },
    });
    const script = container.querySelector("script")!;
    expect(script.getAttribute("src")).toBe(`${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-info.js`);
    expect(script.getAttribute("async")).not.toBeNull();
    expect(JSON.parse(script.textContent ?? "{}")).toEqual({ symbol: "NASDAQ:AAPL", colorTheme: "dark" });
    embed.destroy();
  });

  it("parks the provider's container on destroy, then releases it", async () => {
    vi.useFakeTimers();
    const { container, target } = build();
    const embed = createTradingViewEmbed({
      scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-info.js`,
      container,
      target,
      config: {},
    });
    // Stand in for the iframe the provider self-replaces with.
    const iframe = document.createElement("iframe");
    container.append(iframe);
    embed.destroy();
    /*
     * Teardown parks the container first: a provider script addresses its own
     * container through the running script's `parentNode` and keeps addressing
     * the iframe it created, so detaching immediately made the provider throw
     * during a client-side navigation.
     */
    expect(container.isConnected).toBe(true);
    expect(container.parentElement?.id).toBe("luc-tv-teardown-lot");
    expect(iframe.isConnected).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.isConnected).toBe(false);
    vi.useRealTimers();
    container.remove();
  });

  it("refuses a script URL outside the provider's hosts without throwing at the call site", async () => {
    const { container, target } = build();
    const onError = vi.fn();
    // A refused URL is reported through the handle, not thrown: the caller is a
    // `useEffect`, where a synchronous throw would unmount the page.
    const embed = createTradingViewEmbed({
      scriptUrl: "https://evil.example/embed.js",
      container,
      target,
      config: {},
      onError,
    });
    await expect(embed.ready).rejects.toThrow(/Refusing to load/);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(container.querySelector("script")).toBeNull();
    embed.destroy();
    container.remove();
  });

  it("reports a failed script load through onError and the ready promise", async () => {
    const { container, target } = build();
    const onError = vi.fn();
    const embed = createTradingViewEmbed({
      scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-info.js`,
      container,
      target,
      config: {},
      onError,
    });
    embed.script.dispatchEvent(new Event("error"));
    expect(onError).toHaveBeenCalledTimes(1);
    await expect(embed.ready).rejects.toThrow(/failed to load/);
    container.remove();
  });
});
