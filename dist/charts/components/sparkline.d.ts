//#region src/charts/components/sparkline.d.ts
export type SparkTone = "accent" | "positive" | "negative" | "warning" | "neutral";
export interface SparklineProps {
  values: readonly (number | null)[];
  tone?: SparkTone;
  /** Derive the tone from the first/last values — the dashboard convention. */
  autoTone?: boolean;
  fill?: boolean;
  marker?: boolean;
  strokeWidth?: number;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}
/**
 * Sparkline.
 *
 * No engine, no axis, no interaction: 8–60 points drawn as an SVG path. Keeping
 * this out of ECharts means a table of sixty rows costs sixty cheap SVG paths
 * rather than sixty chart instances.
 */
export declare function Sparkline({ values, tone, autoTone, fill, marker, strokeWidth, width, height, className, ariaLabel }: SparklineProps): import("react").JSX.Element;
/** Sparkline with a soft fill — the stat-card default. */
export declare function SparkArea(props: SparklineProps): import("react").JSX.Element;
export interface MiniBarProps {
  values: readonly (number | null)[];
  tone?: SparkTone;
  autoTone?: boolean;
  height?: number;
  className?: string;
  ariaLabel?: string;
  /** Fraction of the slot the bar occupies. */
  gap?: number;
}
/**
 * Mini bar chart for watchlist rows and table cells. Values are scaled from
 * zero, because a bar chart with a non-zero baseline lies.
 */
export declare function MiniBar({ values, tone, autoTone, height, className, ariaLabel, gap }: MiniBarProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=sparkline.d.ts.map