import { loadLightweightCharts, toChartTime, fromChartTime } from "./runtime";

describe("Lightweight runtime without a DOM", () => {
  it("imports through the deferred loader and round-trips canonical seconds", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const module = await loadLightweightCharts();
    expect(typeof module.createChart).toBe("function");
    expect(module.CandlestickSeries).toBeDefined();
    expect(module.LineSeries).toBeDefined();
    const seconds = toChartTime(1_767_225_600_999);
    expect(seconds).toBe(1_767_225_600);
    expect(fromChartTime(seconds)).toBe(1_767_225_600_000);
  });
});
