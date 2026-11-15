/** Lightweight Charts live examples. Each public route must render a working demo. */
export const lightweightExamples = [
  { id: "candles", title: "Candlestick & Volume", zh: "K 线与成交量", description: "OHLC, volume, moving averages, last-price and viewport controls." },
  { id: "line", title: "Close Line", zh: "收盘价折线", description: "Close-only input and an independent synchronized timeline." },
  { id: "area", title: "Price Area", zh: "价格面积图", description: "Native area-series rendering from prepared values." },
  { id: "comparison", title: "Multi-series Comparison", zh: "多序列对比", description: "Prepared portfolio and benchmark series with a shared time axis." },
  { id: "panes", title: "Multi-pane Indicators", zh: "多面板指标", description: "Volume and volatility panels on a synchronized native time scale." },
  { id: "sharpe", title: "Rolling Sharpe Research", zh: "Rolling Sharpe 研究", description: "Prepared Sharpe values in a dedicated pane; no in-library analytics." },
] as const;

export type LightweightExampleId = (typeof lightweightExamples)[number]["id"];
export const lightweightExampleIds = lightweightExamples.map(({ id }) => id);
export function lightweightExample(id: string) {
  return lightweightExamples.find((entry) => entry.id === id);
}
