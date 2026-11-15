import {
  tooltipGridHtml,
  tooltipRowHtml,
  safeCssColor,
} from "../core/tooltip-html";
import { darkChartTheme } from "../core/theme-tokens";
import { catppuccinMochaChartTheme } from "../core/theme-tokens-catppuccin";
import { buildLightweightChartOptions } from "../adapters/lightweight/lightweight-surface";
import {
  createLatestFrameBatch,
  isLocalPointerEvent,
  subscribeLatestCrosshair,
  type CrosshairEventLike,
} from "./crosshair-subscription";
import { IndicatorReferenceLines } from "./reference-lines";

describe("indicator reference lines", () => {
  it("creates once, reuses exact objects, updates theme and removes only stale levels", () => {
    const lines = new IndicatorReferenceLines();
    const created = [
      { applyOptions: vi.fn() },
      { applyOptions: vi.fn() },
      { applyOptions: vi.fn() },
    ];
    const series = {
      createPriceLine: vi.fn(() => created.shift()!),
      removePriceLine: vi.fn(),
    };

    lines.sync("rsi:rsi", series, [30, 70], "red");
    lines.sync("rsi:rsi", series, [30, 70], "blue");
    expect(series.createPriceLine).toHaveBeenCalledTimes(2);
    expect(lines.size("rsi:rsi")).toBe(2);

    lines.sync("rsi:rsi", series, [30, 80], "green");
    expect(series.createPriceLine).toHaveBeenCalledTimes(3);
    expect(series.removePriceLine).toHaveBeenCalledTimes(1);
    expect(series.removePriceLine).toHaveBeenCalledWith(
      expect.objectContaining({ applyOptions: expect.any(Function) }),
    );

    lines.dispose("rsi:rsi", series);
    expect(series.removePriceLine).toHaveBeenCalledTimes(3);
    expect(lines.size("rsi:rsi")).toBe(0);
  });

  it("forgets replaced series handles without touching a removed engine series", () => {
    const lines = new IndicatorReferenceLines();
    const series = {
      createPriceLine: vi.fn(() => ({ applyOptions: vi.fn() })),
      removePriceLine: vi.fn(),
    };
    lines.sync("pane:series", series, [0, 1], "red");
    lines.forget("pane:series");
    expect(series.removePriceLine).not.toHaveBeenCalled();
    expect(lines.size("pane:series")).toBe(0);
  });
});

describe("stable crosshair and safe tooltip markup", () => {
  it("reads the latest state and unsubscribes the exact handler", () => {
    let handler: ((event: CrosshairEventLike) => void) | undefined;
    const chart = {
      subscribeCrosshairMove: vi.fn((next: typeof handler) => {
        handler = next;
      }),
      unsubscribeCrosshairMove: vi.fn(),
    };
    let state = { mode: "candlestick", visible: ["sma50"] };
    const seen: typeof state[] = [];
    const unsubscribe = subscribeLatestCrosshair(chart, () => state, (_event, latest) => {
      seen.push(latest);
    });
    state = { mode: "line", visible: ["sma200"] };
    handler?.({ sourceEvent: {} });
    expect(seen).toEqual([{ mode: "line", visible: ["sma200"] }]);

    unsubscribe();
    expect(chart.unsubscribeCrosshairMove).toHaveBeenCalledWith(handler);
  });

  it("excludes programmatic remote crosshairs from a local tooltip", () => {
    expect(isLocalPointerEvent({ sourceEvent: {} })).toBe(true);
    expect(isLocalPointerEvent({})).toBe(false);
  });

  it("coalesces pointer events to the latest payload on one frame", () => {
    let nextFrame = 1;
    const callbacks = new Map<number, () => void>();
    const run = vi.fn();
    const batch = createLatestFrameBatch<number>(run, {
      request(callback) {
        const frame = nextFrame++;
        callbacks.set(frame, callback);
        return frame;
      },
      cancel(frame) {
        callbacks.delete(frame);
      },
    });

    for (let event = 0; event < 10_000; event += 1) batch.schedule(event);
    expect(callbacks.size).toBe(1);
    callbacks.values().next().value?.();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenLastCalledWith(9_999);
  });

  it("cancels a pending frame without running stale tooltip work", () => {
    let callback: (() => void) | undefined;
    const run = vi.fn();
    const batch = createLatestFrameBatch(run, {
      request(next) {
        callback = next;
        return 1;
      },
      cancel: vi.fn(),
    });
    batch.schedule("stale");
    batch.cancel();
    callback?.();
    expect(run).not.toHaveBeenCalled();
  });

  it("prevents untrusted colours from entering style attributes", () => {
    const payload = `red" onmouseover="alert(1)`;
    expect(safeCssColor(payload)).toBeNull();
    const host = document.createElement("div");
    host.innerHTML = tooltipRowHtml("Series", "1", payload) + tooltipGridHtml([["A", "1"]], payload);
    expect(host.querySelector("[onmouseover]")).toBeNull();
    expect(host.querySelector(".luc-chart-tooltip__swatch")?.hasAttribute("style")).toBe(false);
    expect(host.querySelector("dd")?.hasAttribute("style")).toBe(false);

    host.innerHTML = tooltipRowHtml("Series", "1", "rgb(137, 180, 250)");
    expect(host.querySelector(".luc-chart-tooltip__swatch")?.getAttribute("style")).toContain(
      "rgb(137, 180, 250)",
    );
  });
});

describe("Lightweight 5.3 contract", () => {
  it("keeps attribution visible, disables pane resize and maps log scale", () => {
    const options = buildLightweightChartOptions(
      catppuccinMochaChartTheme,
      { side: "right", mode: "log" },
    );
    expect(options.layout.attributionLogo).toBe(true);
    expect(options.layout.panes.enableResize).toBe(false);
    expect(options.rightPriceScale.mode).toBe(1);
    expect(options.rightPriceScale.textColor).toBe(catppuccinMochaChartTheme.axisLabel);
  });

  it("exposes Catppuccin Mocha through the same ChartTheme contract", () => {
    expect(catppuccinMochaChartTheme.mode).toBe("dark");
    expect(catppuccinMochaChartTheme.surface).toBe("#1e1e2e");
    expect(catppuccinMochaChartTheme.positive).toBe("#a6e3a1");
    expect(darkChartTheme.positive).not.toBe(catppuccinMochaChartTheme.positive);
  });
});
