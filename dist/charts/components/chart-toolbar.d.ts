import { ReactNode } from "react";
//#region src/charts/components/chart-toolbar.d.ts
export interface ChartExportButtonProps {
  /** Returns the live engine instance. `null` before the chart is ready. */
  getTarget: () => unknown;
  filename: string;
  label?: string;
  className?: string;
}
/**
 * Image export. Disabled until the chart reports an instance, so a click can
 * never produce a blank file.
 */
export declare function ChartExportButton({ getTarget, filename, label, className }: ChartExportButtonProps): import("react").JSX.Element;
export interface ChartResetButtonProps {
  onReset: () => void;
  label?: string;
  className?: string;
}
/** Reset zoom / visible range. Appears only when the caller tracks that state. */
export declare function ChartResetButton({ onReset, label, className }: ChartResetButtonProps): import("react").JSX.Element;
export interface ChartTabsProps {
  children: ReactNode;
  className?: string;
}
/** Thin wrapper so a chart toolbar's item spacing stays consistent. */
export declare function ChartToolbarGroup({ children, className }: ChartTabsProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=chart-toolbar.d.ts.map