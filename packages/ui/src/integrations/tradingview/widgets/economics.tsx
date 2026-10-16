"use client";

import { tradingViewWidgetById } from "../core/catalog";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewWebComponent } from "../web-components/web-component";

const ECONOMIC_MAP = tradingViewWidgetById("economic-map")!;

/**
 * Region keys the provider's data actually defines.
 *
 * Taken from the widget's own region map, not guessed: an unknown key makes the
 * widget throw (`D[this.region] is not iterable`) while it renders, which is why
 * this is a closed union and not a string.
 */
export type TradingViewEconomicRegion =
  | "global"
  | "africa"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "oceania";

/** The five indicators the widget defines, with the provider's own labels. */
export type TradingViewEconomicMetric = "gdp" | "ur" | "gdg" | "intr" | "iryy";

export const TRADINGVIEW_ECONOMIC_METRIC_LABELS: Readonly<Record<TradingViewEconomicMetric, string>> = {
  gdp: "GDP",
  ur: "Unemployment Rate",
  gdg: "Government Debt to GDP",
  intr: "Interest Rate",
  iryy: "Inflation Rate",
};

export interface TradingViewEconomicMapProps extends TradingViewWidgetBaseProps {
  region?: TradingViewEconomicRegion;
  metric?: TradingViewEconomicMetric;
  /** Extra metrics to show alongside the primary one. */
  metrics?: readonly TradingViewEconomicMetric[];
  hideLegend?: boolean;
  hideSelection?: boolean;
  symbolUrl?: string;
}

/**
 * A world map of macro indicators.
 *
 * The geography and the indicator data are the provider's; LUC does not draw its
 * own map and does not model macro series.
 */
export function TradingViewEconomicMap({
  region,
  metric,
  metrics,
  hideLegend,
  hideSelection,
  symbolUrl,
  theme,
  ...base
}: TradingViewEconomicMapProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={ECONOMIC_MAP}
      settings={{
        region,
        metric,
        metrics: metrics ? [...metrics] : undefined,
        hideLegend,
        hideSelection,
      }}
      symbolUrl={symbolUrl}
      theme={theme}
    />
  );
}
