import { ReactNode } from "react";
//#region src/charts/core/inspection.d.ts
export interface ChartInspectionValue {
  /** Group this inspection belongs to. */
  groupId: string;
  /** The pinned x in epoch milliseconds, or null. */
  pinned: number | null;
  /** The live pointer x in epoch milliseconds, or null. */
  hover: number | null;
  /** Pin a specific x, or the current hover when omitted. */
  pin: (x?: number | null) => void;
  unpin: () => void;
  /** Pin the current hover, or unpin when already pinned. */
  toggle: () => void;
  /** True when there is a hover to pin and nothing is pinned yet. */
  canPin: boolean;
}
export interface UseChartInspectionOptions {
  groupId: string;
  /** Controlled pinned value. */
  pinned?: number | null;
  defaultPinned?: number | null;
  onPinnedChange?: (pinned: number | null) => void;
}
export declare function useChartInspection({ groupId, pinned: pinnedProp, defaultPinned, onPinnedChange }: UseChartInspectionOptions): ChartInspectionValue;
export interface ChartInspectionProviderProps extends UseChartInspectionOptions {
  children: ReactNode;
  /**
   * Give the group its own bus. Pass this when two workspaces on one page must
   * not share an inspection, or in tests.
   */
  isolated?: boolean;
}
export declare function ChartInspectionProvider({ children, isolated, ...options }: ChartInspectionProviderProps): import("react").JSX.Element;
export declare function useChartInspectionContext(): ChartInspectionValue | null;
export interface ChartPinButtonProps {
  className?: string;
  /** Accessible name when unpinned. */
  pinLabel?: string;
  /** Accessible name when pinned. */
  unpinLabel?: string;
}
/**
 * The pin control. It reads the inspection from context, so a chart header does
 * not have to thread state through.
 */
export declare function ChartPinButton({ className, pinLabel, unpinLabel }: ChartPinButtonProps): import("react").JSX.Element | null;
/** Shows whether an inspection is pinned, as text, for a status bar. */
export declare function ChartPinStatus({ format, className }: {
  format: (x: number) => ReactNode;
  className?: string;
}): import("react").JSX.Element | null;
export interface ChartInspectionAreaProps extends Omit<React.ComponentPropsWithRef<"div">, "onKeyDown"> {
  /** Ordered x values (oldest first) the keyboard cursor steps through. */
  xValues: readonly number[];
  /** Accessible name and instructions for the region. */
  label?: string;
  /** How an x is printed in the live status line. Defaults to `String(x)`. */
  format?: (x: number) => ReactNode;
}
export declare function ChartInspectionArea({ xValues, label, format, className, children, ...props }: ChartInspectionAreaProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=inspection.d.ts.map