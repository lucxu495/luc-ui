import { resolveFinancialPaneLayout } from "./pane-layout";
import type { FinancialOverlay, IndicatorPane, PriceSeriesData } from "../../financial/financial-data";

const overlay: FinancialOverlay = {
  id: "overlay",
  label: "Overlay",
  data: [],
};
const priceSeries: PriceSeriesData = {
  id: "comparison",
  data: [],
};
const indicators: IndicatorPane[] = [
  { id: "sharpe", label: "Sharpe", stretch: 1.5, series: [] },
  { id: "drawdown", label: "Drawdown", stretch: 0.8, series: [] },
];

describe("financial pane layout", () => {
  it("keeps indicator panes continuous when volume is hidden", () => {
    const layout = resolveFinancialPaneLayout({
      showVolume: false,
      hasVolume: true,
      overlays: [overlay],
      priceSeries: [priceSeries],
      indicators,
    });
    expect(layout.volumePane).toBeNull();
    expect(layout.indicatorStart).toBe(1);
    expect(layout.paneStretches.get(1)).toBe(1.5);
    expect(layout.paneStretches.get(2)).toBe(0.8);
  });

  it("shifts logical indicators below volume without holes", () => {
    const layout = resolveFinancialPaneLayout({
      showVolume: true,
      hasVolume: true,
      overlays: [{ ...overlay, paneIndex: 2 }],
      priceSeries: [{ ...priceSeries, paneIndex: 1 }],
      indicators,
    });
    expect(layout.volumePane).toBe(1);
    expect(layout.overlayPanes.get(2)).toBe(2);
    expect(layout.priceSeriesPanes.get(1)).toBe(3);
    expect(layout.indicatorStart).toBe(4);
    expect(layout.paneStretches.get(0)).toBe(3);
    expect(layout.paneStretches.get(4)).toBe(1.5);
    expect(layout.paneStretches.get(5)).toBe(0.8);
  });
});
