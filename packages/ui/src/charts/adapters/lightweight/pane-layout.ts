import type { FinancialOverlay, IndicatorPane, PriceSeriesData } from "../../financial/financial-data";

export interface FinancialPaneLayout {
  volumePane: number | null;
  indicatorStart: number;
  overlayPanes: ReadonlyMap<number, number>;
  priceSeriesPanes: ReadonlyMap<number, number>;
  paneStretches: ReadonlyMap<number, number>;
}

function positivePaneRequests(values: readonly (number | undefined)[]): number[] {
  return [...new Set(values.filter((value): value is number => value !== undefined && value > 0))].sort(
    (left, right) => left - right,
  );
}

/**
 * Pack non-price panes without holes when volume or an indicator disappears.
 *
 * Consumer `paneIndex` values above zero are logical additional-lane numbers,
 * not physical engine indices. This keeps an indicator immediately below price
 * when volume is disabled and shifts it down by one when volume is enabled.
 */
export function resolveFinancialPaneLayout(input: {
  showVolume: boolean;
  hasVolume: boolean;
  overlays: readonly FinancialOverlay[];
  priceSeries: readonly PriceSeriesData[];
  indicators: readonly IndicatorPane[];
}): FinancialPaneLayout {
  let nextPane = 1;
  const volumePane = input.showVolume && input.hasVolume ? nextPane++ : null;
  const overlayPanes = new Map<number, number>();
  const priceSeriesPanes = new Map<number, number>();
  const paneStretches = new Map<number, number>();

  paneStretches.set(0, 3);
  if (volumePane !== null) paneStretches.set(volumePane, 1);

  for (const requested of positivePaneRequests(input.overlays.map((overlay) => overlay.paneIndex))) {
    overlayPanes.set(requested, nextPane);
    paneStretches.set(nextPane, 1);
    nextPane += 1;
  }
  for (const requested of positivePaneRequests(input.priceSeries.map((series) => series.paneIndex))) {
    priceSeriesPanes.set(requested, nextPane);
    paneStretches.set(nextPane, 1);
    nextPane += 1;
  }

  const indicatorStart = nextPane;
  input.indicators.forEach((indicator, offset) => {
    paneStretches.set(indicatorStart + offset, indicator.stretch ?? 1);
  });

  return { volumePane, indicatorStart, overlayPanes, priceSeriesPanes, paneStretches };
}
