//#region src/charts/components/position-charts.d.ts
/**
 * Historical-position / percentile readout.
 *
 * A rolling return's *percentile* answers a different question from its level:
 * "is this reading high or ordinary for this asset's own history?" A generic
 * line chart of the same series cannot say that, and a gauge/dial implies a
 * recommendation the number does not carry. This component draws the honest
 * thing — a 0–100 track with the conventional quantile ticks and a single marker
 * at the served percentile — so a research page can state "the current 90-day
 * return sits at the 78th percentile of its own history" at a glance.
 *
 * It is presentation only and deliberately engine-free: the percentile and the
 * formatted value are provided by the caller (from the served payload); nothing
 * here computes a statistic, and nothing interprets the position as bullish or
 * bearish.
 */
export type HistoricalPositionTone = "accent" | "positive" | "negative" | "neutral" | "warning";
export interface HistoricalPositionChartProps {
  /** The served percentile, 0–100. Values outside the range are clamped. */
  percentile: number | null | undefined;
  /** The formatted current reading, shown beside the marker. */
  value?: string | null;
  /** The quantile ticks to label. Defaults to the conventional deciles. */
  ticks?: readonly number[];
  /** A spoken label for the current percentile, e.g. "78th percentile". */
  percentileLabel?: string | null;
  tone?: HistoricalPositionTone;
  /** Box height, in CSS pixels. Defaults to the compact readout band. */
  height?: number;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
}
export declare function HistoricalPositionChart({ percentile, value, ticks, percentileLabel, tone, height, ariaLabel, ariaDescription, className }: HistoricalPositionChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=position-charts.d.ts.map