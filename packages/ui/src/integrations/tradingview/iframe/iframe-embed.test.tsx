import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tradingViewWidgetById, type TradingViewWidgetDefinition } from "../core/catalog";
import { TradingViewAdvancedChart } from "../widgets";
import { TradingViewIframe } from "./iframe-embed";

const symbolInfo = tradingViewWidgetById("symbol-info")!;

function containerOf() {
  return liveContainers()[0] ?? null;
}

/**
 * The provider containers that are **still in use**.
 *
 * A torn-down embed is parked (hidden) for a short grace period so the
 * provider's own teardown callbacks do not address removed nodes — see
 * `parkProviderContainer` in `core/loader`. Parked nodes are not "the widget".
 */
function liveContainers() {
  return [...document.querySelectorAll(".tradingview-widget-container")].filter(
    (node) => !node.closest("#luc-tv-teardown-lot"),
  );
}

describe("TradingViewIframe", () => {
  it("bounds a rejected provider URL instead of unmounting the page", async () => {
    const broken = {
      ...symbolInfo,
      id: "broken",
      scriptUrl: "https://not-tradingview.example/x.js",
    } satisfies TradingViewWidgetDefinition;
    render(
      <>
        <TradingViewIframe
          definition={broken}
          providerConfig={{ symbol: "NASDAQ:AAPL" }}
          attribution={{ href: "", label: "AAPL performance" }}
          loading="eager"
        />
        <p>page content</p>
      </>,
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("writes the provider's own container, attribution block and config", async () => {
    render(<TradingViewAdvancedChart symbol="NASDAQ:AAPL" preset="minimal" loading="eager" height={400} />);
    await waitFor(() => expect(containerOf()).not.toBeNull());

    const container = containerOf()!;
    expect(container.querySelector(".tradingview-widget-container__widget")).not.toBeNull();

    const script = container.querySelector("script")!;
    expect(script.getAttribute("src")).toContain("/embed-widget-advanced-chart.js");
    const config = JSON.parse(script.textContent ?? "{}");
    expect(config.symbol).toBe("NASDAQ:AAPL");
    expect(config.autosize).toBe(true);
    expect(config.support_host).toBe("https://www.tradingview.com");
    // `minimal` is a LUC preset over the provider's own booleans.
    expect(config.hide_top_toolbar).toBe(true);
    expect(config.hide_side_toolbar).toBe(true);
  });

  it("renders the provider's attribution link, never overlaying it", async () => {
    render(
      <TradingViewIframe
        definition={symbolInfo}
        providerConfig={{ symbol: "NASDAQ:AAPL" }}
        attribution={{ href: "https://www.tradingview.com/symbols/NASDAQ-AAPL/", label: "AAPL performance" }}
        loading="eager"
      />,
    );
    await waitFor(() => expect(containerOf()).not.toBeNull());
    const link = containerOf()!.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://www.tradingview.com/symbols/NASDAQ-AAPL/");
    expect(link.getAttribute("rel")).toBe("noopener nofollow");
    expect(link.textContent).toBe("AAPL performance");
    expect(containerOf()!.textContent).toContain("by TradingView");
  });

  it("removes the provider's markup from the page on unmount", async () => {
    const view = render(<TradingViewAdvancedChart symbol="NASDAQ:AAPL" loading="eager" height={400} />);
    await waitFor(() => expect(containerOf()).not.toBeNull());
    view.unmount();
    // Nothing the widget wrote is left where it was rendered…
    expect(liveContainers()).toHaveLength(0);
    // …and what the provider still owns is parked out of the layout, inside a
    // host React never reuses, until the grace period releases it.
    const parked = document.querySelector("#luc-tv-teardown-lot .tradingview-widget-container");
    expect(parked).not.toBeNull();
    expect(parked?.closest("[data-slot]")).toBeNull();
  });

  it("does not stack two widgets under StrictMode's double mount", async () => {
    render(
      <StrictMode>
        <TradingViewAdvancedChart symbol="NASDAQ:AAPL" loading="eager" height={400} />
      </StrictMode>,
    );
    await waitFor(() => expect(containerOf()).not.toBeNull());
    expect(liveContainers()).toHaveLength(1);
    expect(
      [...document.querySelectorAll("script[src*='embed-widget']")].filter(
        (node) => !node.closest("#luc-tv-teardown-lot"),
      ),
    ).toHaveLength(1);
  });

  it("reserves the box before the provider arrives, so the page cannot jump", () => {
    const view = render(<TradingViewAdvancedChart symbol="NASDAQ:AAPL" height={512} />);
    const box = view.container.firstElementChild as HTMLElement;
    expect(box.style.height).toBe("512px");
    expect(box.getAttribute("role")).toBe("group");
    expect(box.getAttribute("aria-label")).toBeTruthy();
  });
});
