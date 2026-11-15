import { darkChartTheme } from "../../core/theme-tokens";
import { createLightweightController } from "./chart-controller";
import type { LightweightChart, LightweightModule } from "./runtime";

function fakeSeries() {
  return {
    applyOptions: vi.fn(),
    setData: vi.fn(),
    update: vi.fn(),
    createPriceLine: vi.fn(),
    removePriceLine: vi.fn(),
  };
}

function setup() {
  const created: ReturnType<typeof fakeSeries>[] = [];
  const range = { from: 1_767_225_600, to: 1_767_225_900 };
  const timeScale = {
    getVisibleRange: vi.fn(() => range),
    setVisibleRange: vi.fn(),
    fitContent: vi.fn(),
  };
  const chart = {
    timeScale: vi.fn(() => timeScale),
    addSeries: vi.fn(() => {
      const series = fakeSeries();
      created.push(series);
      return series;
    }),
    removeSeries: vi.fn(),
  } as unknown as LightweightChart;
  const module = {
    CandlestickSeries: {},
    LineSeries: {},
    AreaSeries: {},
    HistogramSeries: {},
    BaselineSeries: {},
    BarSeries: {},
  } as unknown as LightweightModule;
  return {
    ...createLightweightController(chart, module, darkChartTheme),
    chart,
    created,
    range,
    timeScale,
  };
}

describe("Lightweight controller", () => {
  it("updates options in place and skips setData when the data reference is unchanged", () => {
    const { controller, chart, created } = setup();
    const data = [{ time: 1_767_225_600 as never, value: 1 }];
    const first = controller.upsertSeries("price", "line", { color: "red" }, data, 0);
    const second = controller.upsertSeries("price", "line", { color: "blue" }, data, 0);

    expect(first).toBe(second);
    expect(chart.addSeries).toHaveBeenCalledTimes(1);
    expect(created[0]!.applyOptions).toHaveBeenLastCalledWith({ color: "blue" });
    expect(created[0]!.setData).toHaveBeenCalledTimes(1);
  });

  it("writes history once when the prepared data reference changes", () => {
    const { controller, created } = setup();
    const first = [{ time: 1_767_225_600 as never, value: 1 }];
    const next = [{ time: 1_767_225_600 as never, value: 2 }];
    controller.upsertSeries("price", "line", {}, first, 0);
    controller.upsertSeries("price", "line", {}, next, 0);

    expect(created[0]!.setData).toHaveBeenCalledTimes(2);
    expect(created[0]!.setData).toHaveBeenLastCalledWith(next);
  });

  it("replaces only a pane-changing series and restores its visible time range", () => {
    const { controller, chart, created, range, timeScale } = setup();
    const data = [{ time: 1_767_225_600 as never, value: 1 }];
    const first = controller.upsertSeries("indicator", "line", {}, data, 1);
    const second = controller.upsertSeries("indicator", "histogram", {}, data, 2);

    expect(second).not.toBe(first);
    expect(chart.removeSeries).toHaveBeenCalledWith(first);
    expect(chart.addSeries).toHaveBeenCalledTimes(2);
    expect(chart.addSeries).toHaveBeenLastCalledWith(
      expect.anything(),
      {},
      2,
    );
    expect(created[1]!.setData).toHaveBeenCalledWith(data);
    expect(timeScale.setVisibleRange).toHaveBeenCalledWith(range);
    expect(timeScale.fitContent).not.toHaveBeenCalled();
  });

  it("exposes setData replacement and official update() without changing ids", () => {
    const { controller, created } = setup();
    const first = { time: 1_767_225_600 as never, value: 1 };
    controller.upsertSeries("price", "line", {}, [first], 0);
    const history = [first, { time: 1_767_225_660 as never, value: 2 }];
    const latest = { time: 1_767_225_720 as never, value: 3 };

    expect(controller.setSeriesData("price", history)).toBe(
      controller.getSeries("price"),
    );
    expect(created[0]!.setData).toHaveBeenLastCalledWith(history);
    expect(controller.updateSeries("price", latest)).toBe(
      controller.getSeries("price"),
    );
    expect(created[0]!.update).toHaveBeenCalledWith(latest);
  });

  it("throws for an unknown incremental id instead of silently succeeding", () => {
    const { controller } = setup();
    expect(() =>
      controller.updateSeries("missing", { time: 1 as never, value: 1 }),
    ).toThrow(/Unknown Lightweight Charts series/);
  });
});
