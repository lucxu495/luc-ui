import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as LoaderModule from "../core/loader";
import { resetTradingViewLoad } from "../core/loader";
import { TradingViewMiniChart } from "../widgets";

/**
 * Provider-failure semantics for the shared Web Component wrapper.
 *
 * The deterministic QA stub lives in the browser suites; here the provider's
 * *bytes* are replaced at the loader's documented injection point so the real
 * lifecycle — request, registration wait, timeout, retry — still runs.
 */
const TAG = "tv-mini-chart";

type Mode = "register" | "reject" | "never";
const harness = { mode: "register" as Mode, loads: 0 };

async function loadModule() {
  if (harness.mode === "reject") throw new Error("provider module rejected");
  if (harness.mode === "never") return undefined;
  if (!customElements.get(TAG)) customElements.define(TAG, class extends HTMLElement {});
}

vi.mock("../core/loader", async (importOriginal) => {
  const actual = await importOriginal<typeof LoaderModule>();
  return {
    ...actual,
    loadTradingViewElement: (url: string, options: { tag: string; timeoutMs?: number }) => {
      harness.loads += 1;
      return actual.loadTradingViewElement(url, { ...options, loadModule });
    },
  };
});

afterEach(() => {
  harness.mode = "register";
  harness.loads = 0;
  // The loader's store is module-level: clear it so one case cannot leak.
  resetTradingViewLoad("https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js");
});

describe("TradingViewWebComponent provider failure", () => {
  it("turns a rejected provider module into the wrapper's own error surface", async () => {
    harness.mode = "reject";
    render(
      <>
        <TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" height={180} />
        <p>page content</p>
      </>,
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    // The failure stays inside the widget: the page is still mounted and usable.
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("reports a provider global that never registers as a bounded failure", async () => {
    harness.mode = "never";
    render(<TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" timeoutMs={40} height={180} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(/unavailable/i);
  });

  it("retries the load and recovers once the provider module registers", async () => {
    harness.mode = "reject";
    render(<TradingViewMiniChart symbol="NASDAQ:AAPL" loading="eager" height={180} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    const before = harness.loads;

    harness.mode = "register";
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(document.querySelector(`[data-luc-tv-status="ready"]`)).not.toBeNull());
    expect(harness.loads).toBeGreaterThan(before);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
