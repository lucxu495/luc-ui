import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/economics.d.ts
/**
 * Region keys the provider's data actually defines.
 *
 * Taken from the widget's own region map, not guessed: an unknown key makes the
 * widget throw (`D[this.region] is not iterable`) while it renders, which is why
 * this is a closed union and not a string.
 */
export type TradingViewEconomicRegion = "global" | "africa" | "asia" | "europe" | "north-america" | "south-america" | "oceania";
/** The five indicators the widget defines, with the provider's own labels. */
export type TradingViewEconomicMetric = "gdp" | "ur" | "gdg" | "intr" | "iryy";
export declare const TRADINGVIEW_ECONOMIC_METRIC_LABELS: Readonly<Record<TradingViewEconomicMetric, string>>;
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
export declare function TradingViewEconomicMap({ region, metric, metrics, hideLegend, hideSelection, symbolUrl, theme, ...base }: TradingViewEconomicMapProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=economics.d.ts.map