import { YScaleMode } from "./core/axis.js";
import { CardFooter } from "../components/card.js";
import { ReactNode } from "react";
//#region src/charts/chart-card.d.ts
export interface ChartCardProps extends React.ComponentPropsWithRef<"div"> {
  /** Height of the plot area. Charts need a bounded box, always. */
  height?: number | string;
}
export declare function ChartCard({ className, height, children, ...props }: ChartCardProps): import("react").JSX.Element;
export interface ChartHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Segmented range control, timeframe, or custom actions. */
  toolbar?: ReactNode;
  /** Right-aligned readout slot, e.g. current value + delta. */
  readout?: ReactNode;
}
export declare function ChartHeader({ className, title, description, toolbar, readout, ...props }: ChartHeaderProps): import("react").JSX.Element;
export declare function ChartPlot({ className, children, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export interface RangeSelectorProps {
  ranges: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}
export declare function RangeSelector({ ranges, value, onValueChange, className }: RangeSelectorProps): import("react").JSX.Element;
export interface ScaleSelectorProps {
  /**
   * Which scale modes this chart may offer. A chart that can only be linear
   * renders **nothing** — a one-option control is noise, not a setting.
   */
  allowed?: readonly YScaleMode[];
  /** The mode currently drawn. */
  value: YScaleMode;
  onValueChange: (value: YScaleMode) => void;
  labels?: Partial<Record<YScaleMode, string>>;
  className?: string;
}
/**
 * The Linear / Log control.
 *
 * A chart's scale is a *presentation* choice: switching it re-maps the same
 * values and never reloads, re-queries or mutates them. It is a segmented
 * toggle group, so it carries radio semantics (`aria-pressed` per item) and is
 * fully keyboard operable; the selected mode is never communicated by colour
 * alone. The copy comes from the caller so a localized page stays localized.
 */
export declare function ScaleSelector({ allowed, value, onValueChange, labels, className }: ScaleSelectorProps): import("react").JSX.Element | null;
export interface SeriesToggleProps {
  /**
   * The series the control can show or hide.
   *
   * `tone` resolves through the semantic tone vocabulary. A caller that already
   * holds the *exact* colour its engine drew - a palette slot, a categorical
   * identity — passes it as `color` instead, so the swatch is the mark's own
   * colour rather than a near-match.
   *
   * A caller that also knows *how* the series is drawn (`mark`, `line`,
   * `weight`, `muted`) gets a sample of that encoding instead of a flat chip: a
   * bar is not shown as a line, and a dashed threshold is not shown as a solid
   * series. The legend is the plot's decoding key, so it reproduces the plot.
   */
  series: readonly ChartLegendItem[];
  visible: readonly string[];
  onToggle: (id: string) => void;
  className?: string;
}
/** One entry of a chart legend: the series and the encoding it was drawn with. */
export interface ChartLegendItem {
  id: string;
  label: string;
  tone?: string;
  color?: string;
  /** The mark kind the engine drew. */
  mark?: "line" | "area" | "bar";
  /** The dash treatment the engine drew. */
  line?: "solid" | "dashed" | "dotted";
  /** Relative stroke weight (the series being read reads heavier). */
  weight?: "thin" | "regular" | "strong";
  /** A faint context series is drawn - and shown - more quietly. */
  muted?: boolean;
  /** Extra attributes on the control element (QA/diagnostic hooks). */
  attributes?: Record<string, string>;
}
/** Legend doubles as the series visibility control. One control, two jobs. */
export declare function ChartLegend({ series, visible, onToggle, className }: SeriesToggleProps): import("react").JSX.Element;
export declare function ChartToolbar({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export interface ChartTooltipSurfaceProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title?: ReactNode;
}
/** Positioned by the engine; styled by LUC. Pass it down as the tooltip node. */
export declare function ChartTooltipSurface({ className, title, children, ...props }: ChartTooltipSurfaceProps): import("react").JSX.Element;
export declare function ChartTooltipRow({ label, value, tone, className }: {
  label: ReactNode;
  value: ReactNode;
  tone?: string;
  className?: string;
}): import("react").JSX.Element;
export interface FullscreenButtonProps {
  onClick: () => void;
  className?: string;
  /**
   * Accessible name for the button. The library's default is English; a
   * product that ships another language passes its own string rather than
   * patching a translated copy of the component.
   */
  label?: string;
  /** Tooltip text. Defaults to the accessible name's short form. */
  tooltip?: string;
}
export declare function FullscreenButton({ onClick, className, label, tooltip }: FullscreenButtonProps): import("react").JSX.Element;
export declare function ChartSkeleton({ height, className }: {
  height?: number | string;
  className?: string;
}): import("react").JSX.Element;
export interface ChartStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "negative";
  className?: string;
  /**
   * Size the state to its own content instead of filling the plot rectangle.
   *
   * A chart that *has nothing to draw* must not reserve the space it would have
   * used to draw something: a 400-pixel plot holding one "No data" line is
   * whitespace, not information. Callers that own a fixed surface (a card body
   * that must keep its height) leave this off.
   */
  compact?: boolean;
}
export declare function ChartEmptyState(props: Omit<ChartStateProps, "tone">): import("react").JSX.Element;
export declare function ChartErrorState(props: Omit<ChartStateProps, "tone">): import("react").JSX.Element;
export interface SyncGroupProps {
  /** Charts in the same group share crosshair and visible range. */
  groupId: string;
  children: ReactNode;
  className?: string;
}
/**
 * Declares a sync group and makes its id inherit to the charts inside.
 *
 * The live crosshair/range state lives in the sync bus (`core/sync.ts`), not
 * here — this component only scopes the group id, so a chart inside it that does
 * not name its own `syncGroup` joins the surrounding group automatically.
 */
export declare function ChartSyncGroup({ groupId, children, className }: SyncGroupProps): import("react").JSX.Element;
/** Small helper for local UI state in chart toolbars. */
export declare function useRangeState(defaultRange: string): readonly [string, import("react").Dispatch<import("react").SetStateAction<string>>];
//#endregion
export { CardFooter as ChartFooter };
//# sourceMappingURL=chart-card.d.ts.map