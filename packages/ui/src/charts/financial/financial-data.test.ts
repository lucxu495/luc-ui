import {
  FinancialDataError,
  financialTimeToMs,
  prepareCandles,
  prepareOverlay,
  preparePriceSeries,
  validateFinancialRange,
  type Candle,
  type FinancialOverlay,
  type PriceSeriesData,
} from "./financial-data";

const START = Date.UTC(2026, 0, 1);

function candle(index: number, patch: Partial<Candle> = {}): Candle {
  return {
    time: START + index * 60_000,
    open: 100 + index,
    high: 103 + index,
    low: 99 + index,
    close: 102 + index,
    ...patch,
  };
}

describe("financial data contract", () => {
  it("parses explicit ISO timezones deterministically and rejects timezone-less datetimes", () => {
    const utc = financialTimeToMs("2026-01-01T00:00:00.500Z");
    const offset = financialTimeToMs("2026-01-01T08:00:00.500+08:00");
    expect(utc).toBe(Date.UTC(2026, 0, 1, 0, 0, 0, 500));
    expect(offset).toBe(utc);
    expect(() => financialTimeToMs("2026-01-01T00:00:00")).toThrow(FinancialDataError);
    expect(() => financialTimeToMs("01/01/2026")).toThrow(/ISO/);
  });

  it("preserves legal OHLC values and validates ordering without sorting", () => {
    const input = [candle(0), candle(1)];
    const prepared = prepareCandles(input);
    expect(prepared.data).toEqual([
      { time: 1_767_225_600, open: 100, high: 103, low: 99, close: 102 },
      { time: 1_767_225_660, open: 101, high: 104, low: 100, close: 103 },
    ]);
    expect(input[0]).toEqual(candle(0));
    expect(() => prepareCandles([candle(1), candle(0)])).toThrow(/ordered/);
  });

  it("rejects collisions after second truncation rather than dropping a row", () => {
    expect(() =>
      prepareCandles([
        candle(0, { time: 10_000 }),
        candle(1, { time: 10_999 }),
      ]),
    ).toThrow(/same second/);
  });

  it("rejects non-finite prices and malformed OHLC instead of repairing them", () => {
    expect(() => prepareCandles([candle(0, { close: Number.NaN })])).toThrow(/finite/);
    expect(() => prepareCandles([candle(0, { high: 98 })])).toThrow(/low <= open\/close <= high/);
    expect(() => prepareCandles([candle(0, { low: 104 })])).toThrow(/low <= open\/close <= high/);
  });

  it("maps null to official whitespace and keeps a real zero", () => {
    const overlay: FinancialOverlay = {
      id: "signal",
      label: "Signal",
      data: [
        { time: START, value: null },
        { time: START + 60_000, value: 0 },
      ],
    };
    expect(prepareOverlay(overlay, 0).data).toEqual([
      { time: 1_767_225_600 },
      { time: 1_767_225_660, value: 0 },
    ]);
  });

  it("rejects duplicate, unordered, NaN and Infinity values in prepared series", () => {
    const valid: FinancialOverlay = {
      id: "signal",
      label: "Signal",
      data: [
        { time: START, value: 1 },
        { time: START + 60_000, value: 2 },
      ],
    };
    expect(() =>
      prepareOverlay(
        { ...valid, data: [{ time: START, value: 1 }, { time: START, value: 2 }] },
        0,
      ),
    ).toThrow(/same second/);
    expect(() =>
      prepareOverlay(
        {
          ...valid,
          data: [
            { time: START + 60_000, value: 2 },
            { time: START, value: 1 },
          ],
        },
        0,
      ),
    ).toThrow(/ordered/);
    expect(() =>
      prepareOverlay({ ...valid, data: [{ time: START, value: Number.POSITIVE_INFINITY }] }, 0),
    ).toThrow(/finite/);
  });

  it("supports close-only series and rejects non-finite closes", () => {
    const source: PriceSeriesData = {
      id: "portfolio",
      data: [
        { time: "2026-01-01", close: 0 },
        { time: "2026-01-02", close: 101.25 },
      ],
    };
    expect(preparePriceSeries(source, 0)).toMatchObject({
      id: "portfolio",
      label: "portfolio",
      kind: "line",
      data: [
        { time: Date.UTC(2026, 0, 1) / 1000, value: 0 },
        { time: Date.UTC(2026, 0, 2) / 1000, value: 101.25 },
      ],
    });
    expect(() =>
      preparePriceSeries(
        { ...source, data: [{ time: START, close: Number.NEGATIVE_INFINITY }] },
        0,
      ),
    ).toThrow(/finite/);
  });

  it("validates controlled ranges without treating malformed input as fit-all", () => {
    expect(() => validateFinancialRange(null)).not.toThrow();
    expect(() => validateFinancialRange({ from: 10, to: 20 })).not.toThrow();
    expect(() => validateFinancialRange({ from: 20, to: 20 })).toThrow(/to > from/);
    expect(() => validateFinancialRange({ from: 10, to: Number.NaN })).toThrow(/finite/);
  });
});
