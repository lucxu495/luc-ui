import { render } from "@testing-library/react";
import { darkChartTheme } from "../core/theme-tokens";
import { lightChartTheme } from "../core/theme-tokens-light";
import type { LightweightController } from "../adapters/lightweight/lightweight-surface";
import type { LightweightSeries } from "../adapters/lightweight/runtime";
import {
  FinancialChart,
  type Candle,
  type FinancialChartController,
} from "./financial-chart";
import { financialTooltipPosition } from "./tooltip-position";

const surfaceCapture = vi.hoisted(() => ({
  props: null as {
    build: (controller: LightweightController) => void;
    priceFormatter?: (value: number) => string;
    tickFormatter?: (values: number[]) => string[];
  } | null,
}));

vi.mock("../adapters/lightweight/lightweight-surface", () => ({
  LightweightSurface: (props: NonNullable<typeof surfaceCapture.props>) => {
    surfaceCapture.props = props;
    return null;
  },
}));

const START = Date.UTC(2026, 0, 1);
const candles = (offset = 0): Candle[] =>
  Array.from({ length: 4 }, (_, index) => ({
    time: START + index * 60_000,
    open: 100 + index + offset,
    high: 103 + index + offset,
    low: 99 + index + offset,
    close: 102 + index + offset,
  }));

function fakeController() {
  const series = new Map<string, ReturnType<typeof fakeSeries>>();
  const pane = {
    setPreserveEmptyPane: vi.fn(),
    setStretchFactor: vi.fn(),
  };
  const chart = {
    panes: vi.fn(() => [pane, pane, pane, pane]),
  };
  function fakeSeries() {
    return {
      applyOptions: vi.fn(),
      setData: vi.fn(),
      update: vi.fn(),
      createPriceLine: vi.fn(() => ({ applyOptions: vi.fn() })),
      removePriceLine: vi.fn(),
    };
  }
  const controller = {
    chart,
    theme: darkChartTheme,
    upsertSeries: vi.fn(
      (id: string, kind: string, options: Record<string, unknown>, data: unknown[], paneIndex = 0) => {
        const key = `${id}:${kind}:${paneIndex}`;
        let target = series.get(key) as ReturnType<typeof fakeSeries> | undefined;
        if (!target) {
          target = fakeSeries();
          series.set(key, target);
        }
        target.applyOptions(options);
        target.setData(data);
        return target;
      },
    ),
    setSeriesData: vi.fn(),
    updateSeries: vi.fn(),
    getSeries: vi.fn(() => null),
    removeSeries: vi.fn(),
    fit: vi.fn(),
    setVisibleRange: vi.fn(),
  } as unknown as LightweightController & {
    fit: ReturnType<typeof vi.fn>;
    setVisibleRange: ReturnType<typeof vi.fn>;
  };
  return { controller, chart, pane, series };
}

describe("FinancialChart build/range ownership", () => {
  beforeEach(() => {
    surfaceCapture.props = null;
  });

  it("updates data, mode, theme and visible overlays without fitting or replacing the viewport", () => {
    const onControllerReady = vi.fn();
    const { controller } = fakeController();
    const view = render(
      <FinancialChart
        candles={candles()}
        volume={candles().map((item) => ({ time: item.time, value: 1000 }))}
        overlays={[
          {
            id: "sma",
            label: "SMA",
            data: candles().map((item) => ({ time: item.time, value: item.close })),
            referenceLines: [50],
          },
        ]}
        visibleOverlays={["sma"]}
        indicators={[
          {
            id: "rsi",
            label: "RSI",
            referenceLines: [30, 70],
            series: [
              {
                id: "rsi",
                kind: "line",
                data: candles().map((item) => ({ time: item.time, value: 0 })),
              },
            ],
          },
        ]}
        range={undefined}
        themeOverride={darkChartTheme}
        onControllerReady={onControllerReady}
      />,
    );

    surfaceCapture.props!.build(controller);
    view.rerender(
      <FinancialChart
        candles={candles(2)}
        volume={candles(2).map((item) => ({ time: item.time, value: 2000 }))}
        visibleOverlays={[]}
        mode="line"
        range={undefined}
        themeOverride={lightChartTheme}
        onControllerReady={onControllerReady}
      />,
    );
    surfaceCapture.props!.build(controller);

    expect(controller.fit).not.toHaveBeenCalled();
    expect(controller.setVisibleRange).not.toHaveBeenCalled();
    expect(onControllerReady).toHaveBeenCalledWith(
      expect.objectContaining({
        controller,
        updateSeries: expect.any(Function),
        setSeriesData: expect.any(Function),
      }),
    );
  });

  it("keeps a dimensionless Sharpe Y axis and tooltip in sync without global BTC rounding", () => {
    const { controller } = fakeController();
    const dates = candles();
    render(
      <FinancialChart
        series={[{
          id: "btc-close", kind: "line",
          data: dates.map((row) => ({ time: row.time, close: 64_500 + row.close })),
        }]}
        showVolume={false}
        indicators={[{
          id: "rolling-sharpe", label: "Rolling Sharpe · 365D",
          referenceLines: [-1, 0, 1],
          series: [{
            id: "sharpe", kind: "line",
            format: { kind: "number", decimals: 3 },
            data: dates.map((row, index) => ({
              time: row.time,
              value: [-1.2344, -0.9876, 0.0254, 1.5436][index]!,
            })),
          }],
        }]}
      />,
    );
    // No chart-wide formatter can overwrite the two different Y-axis units.
    expect(surfaceCapture.props?.priceFormatter).toBeUndefined();
    expect(surfaceCapture.props?.tickFormatter).toBeUndefined();

    surfaceCapture.props!.build(controller);
    const calls = (controller.upsertSeries as ReturnType<typeof vi.fn>).mock.calls as
      Array<[string, string, Record<string, unknown>, unknown[], number]>;
    const price = calls.find((call) => call[0] === "price:btc-close");
    const sharpe = calls.find((call) => call[0] === "indicator:rolling-sharpe:sharpe");
    expect(price?.[4]).toBe(0);
    expect(sharpe?.[4]).toBe(1);

    type CustomFormat = {
      type: "custom";
      formatter: (value: number) => string;
      tickmarksFormatter: (values: number[]) => string[];
      minMove: number;
    };
    const priceFormat = price?.[2].priceFormat as CustomFormat;
    const sharpeFormat = sharpe?.[2].priceFormat as CustomFormat;
    expect(priceFormat.type).toBe("custom");
    expect(priceFormat.formatter(64_500)).toBe("64.5K");
    expect(sharpeFormat.type).toBe("custom");
    expect(sharpeFormat.minMove).toBe(0.001);
    expect(sharpeFormat.formatter(-1.2344)).toBe("-1.234");
    expect(sharpeFormat.tickmarksFormatter([-1.2344, 0.0254, 1.5436]))
      .toEqual(["-1.234", "0.025", "1.544"]);
  });

  it("keeps existing chart-wide compact ticks in single-pane charts", () => {
    render(<FinancialChart candles={candles()} />);
    expect(surfaceCapture.props?.priceFormatter).toEqual(expect.any(Function));
    expect(surfaceCapture.props?.tickFormatter).toEqual(expect.any(Function));
  });

  it("rebuilds a series only when its pane changes and keeps reference-line objects in sync", () => {
    const { controller, series } = fakeController();
    const base = candles();
    const common = {
      candles: base,
      volume: base.map((item) => ({ time: item.time, value: 1_000 })),
      indicators: [
        {
          id: "rsi",
          label: "RSI",
          referenceLines: [30, 70],
          series: [
            {
              id: "rsi",
              kind: "line" as const,
              data: base.map((item) => ({ time: item.time, value: 50 })),
            },
          ],
        },
      ],
      themeOverride: darkChartTheme,
    };
    const view = render(<FinancialChart {...common} />);
    surfaceCapture.props!.build(controller);
    const withVolume = controller.upsertSeries as ReturnType<typeof vi.fn>;
    expect(withVolume).toHaveBeenCalledWith(
      "indicator:rsi:rsi",
      "line",
      expect.objectContaining({
        priceFormat: expect.objectContaining({
          type: "custom",
          formatter: expect.any(Function),
        }),
      }),
      expect.any(Array),
      2,
    );
    expect([...series.keys()]).toContain("indicator:rsi:rsi:line:2");

    view.rerender(<FinancialChart {...common} showVolume={false} />);
    surfaceCapture.props!.build(controller);
    expect(withVolume).toHaveBeenLastCalledWith(
      "indicator:rsi:rsi",
      "line",
      expect.any(Object),
      expect.any(Array),
      1,
    );
    expect(controller.fit).not.toHaveBeenCalled();
  });

  it("provides validated official update() points without replacing history", () => {
    let api: FinancialChartController | null = null;
    const { controller } = fakeController();
    render(
      <FinancialChart
        series={[
          {
            id: "portfolio",
            data: candles().map((item) => ({ time: item.time, close: item.close })),
          },
        ]}
        onControllerReady={(next) => {
          api = next;
        }}
      />,
    );
    surfaceCapture.props!.build(controller);
    api!.updatePrice({ time: START + 5 * 60_000, close: 0 });
    expect(controller.updateSeries).toHaveBeenCalledWith(
      "price:portfolio",
      { time: Date.UTC(2026, 0, 1, 0, 5) / 1000, value: 0 },
    );
    expect(controller.setSeriesData).not.toHaveBeenCalled();
  });

  it.each(["line", "area"] as const)(
    "converts OHLC candles to valid %s series data for Lightweight Charts",
    (mode) => {
      const { controller } = fakeController();
      render(<FinancialChart candles={candles()} mode={mode} showVolume={false} />);
      surfaceCapture.props!.build(controller);
      const call = (controller.upsertSeries as ReturnType<typeof vi.fn>).mock.calls.find(
        (entry: unknown[]) => entry[0] === "price",
      );
      expect(call).toBeDefined();
      expect(call![1]).toBe(mode);
      expect(call![3]).toEqual(
        candles().map((candle) => ({ time: Number(candle.time) / 1000, value: candle.close })),
      );
      expect(call![3][0]).not.toHaveProperty("open");
    },
  );

  it("renders invalid OHLC as an explicit state instead of repairing or throwing", () => {
    const view = render(
      <FinancialChart
        candles={[
          {
            time: START,
            open: 100,
            high: 99,
            low: 98,
            close: 101,
          },
        ]}
      />,
    );
    expect(view.getByText("Invalid financial data")).toBeInTheDocument();
    expect(view.getByText(/low <= open\/close <= high/)).toBeInTheDocument();
    expect(surfaceCapture.props).toBeNull();
  });

  it("renders a themed legend for clean comparison series", () => {
    const view = render(
      <FinancialChart
        series={[
          {
            id: "portfolio",
            label: "Portfolio close",
            data: [{ time: START, close: 0 }],
          },
        ]}
      />,
    );
    expect(view.getByRole("list", { name: "Chart legend" })).toHaveTextContent(
      "Portfolio close",
    );
  });

  it("toggles the last-price line through series options without replacing data", () => {
    const { controller } = fakeController();
    const view = render(
      <FinancialChart candles={candles()} showVolume={false} showPriceLine={false} />,
    );
    surfaceCapture.props!.build(controller);
    const call = (controller.upsertSeries as ReturnType<typeof vi.fn>).mock.calls.find(
      (entry: unknown[]) => entry[0] === "price",
    );
    expect(call?.[2]).toEqual(
      expect.objectContaining({
        priceLineVisible: false,
        lastValueVisible: false,
      }),
    );

    view.rerender(
      <FinancialChart candles={candles()} showVolume={false} showPriceLine />,
    );
    surfaceCapture.props!.build(controller);
    const calls = (controller.upsertSeries as ReturnType<typeof vi.fn>).mock.calls.filter(
      (entry: unknown[]) => entry[0] === "price",
    );
    expect(calls.at(-1)?.[2]).toEqual(expect.objectContaining({ priceLineVisible: true }));
    expect(controller.fit).not.toHaveBeenCalled();
  });

  it("flips and clamps the tooltip inside the host near the bottom-right edge", () => {
    const position = financialTooltipPosition({
      pointerX: 390,
      pointerY: 295,
      hostWidth: 400,
      hostHeight: 300,
      tooltipWidth: 220,
      tooltipHeight: 140,
    });
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.top).toBeGreaterThanOrEqual(8);
    expect(position.left + 220).toBeLessThanOrEqual(392);
    expect(position.top + 140).toBeLessThanOrEqual(292);
  });
});

// Type-only assertion used by the suite above; it also keeps the exported
// series shape honest without pulling an engine instance into the test.
const _seriesType: LightweightSeries | null = null;
void _seriesType;
