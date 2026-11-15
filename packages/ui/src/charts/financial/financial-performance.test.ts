import { prepareCandles, preparePriceSeries, type Candle } from "./financial-data";

function rows(count: number): Candle[] {
  const start = Date.UTC(2020, 0, 1);
  return Array.from({ length: count }, (_, index) => {
    const open = 100 + Math.sin(index / 17) * 4;
    const close = open + Math.cos(index / 11);
    return {
      time: start + index * 60_000,
      open,
      high: Math.max(open, close) + 1,
      low: Math.min(open, close) - 1,
      close,
    };
  });
}

function measure(run: () => void): number {
  const started = performance.now();
  run();
  return performance.now() - started;
}

describe("financial preparation pressure checks", () => {
  it("prepares the 10k interaction benchmark without pathological cost", () => {
    const input = rows(10_000);
    let outputLength = 0;
    const duration = measure(() => {
      outputLength = prepareCandles(input).data.length;
    });
    process.stdout.write(`[financial] 10k OHLC preparation: ${duration.toFixed(2)}ms\n`);
    expect(outputLength).toBe(10_000);
    expect(duration).toBeLessThan(2_000);
  });

  it("keeps the isolated 100k close-only pressure check bounded", () => {
    const source = rows(100_000);
    let outputLength = 0;
    const duration = measure(() => {
      outputLength = preparePriceSeries(
        {
          id: "pressure",
          data: source.map(({ time, close }) => ({ time, close })),
        },
        0,
      ).data.length;
    });
    process.stdout.write(
      `[financial] 100k close-only preparation: ${duration.toFixed(2)}ms\n`,
    );
    expect(outputLength).toBe(100_000);
    expect(duration).toBeLessThan(15_000);
  });
});
