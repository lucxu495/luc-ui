import { YScaleMode } from "../core/axis.js";
import { ReactNode } from "react";
//#region src/charts/components/fullscreen.d.ts
/**
 * Expanded chart inspector.
 *
 * A research workbench, not a big modal:
 *
 * - **Centred on the viewport.** The portal lives on `<body>`, the positioning
 *   frame is `fixed inset-0`, and nothing about the product's shell takes part in
 *   the centring. (An earlier version padded the frame by the measured rail and
 *   outline widths to "fill the workspace" — which moved the panel's centre to
 *   the *workspace* centre: +120px to the right on a page with a left rail and no
 *   right column. The reader asked for a viewport-centred inspector and that is
 *   what this does.)
 * - **Large by default, and the reader can change it.** The opening size is a
 *   fraction of the viewport (clamped by floors and ceilings), and eight handles
 *   — four edges, four corners — resize it. The size is remembered across opens
 *   and clamped against whatever viewport the reader is on now.
 * - **Resizing is not a range change.** Nothing here touches the chart's data or
 *   its sync group: the panel gets more pixels for the same reader-selected
 *   window, which is precisely the ADR-035 semantics (a resize is not a write).
 * - **The chart is re-rendered at the larger size, never reparented.** Engines
 *   react to their own container's size (Lightweight Charts `autoSize`, ECharts'
 *   resize observer), so a drag grows the plot continuously without a remount.
 */
/** Localized accessible names for the resize controls. */
export interface InspectorResizeLabels {
  /** e.g. "Resize chart inspector width". */
  width: string;
  /** e.g. "Resize chart inspector height". */
  height: string;
}
export interface FullscreenResearchViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Accessible name of the close control (localized by the caller). */
  closeLabel?: string;
  /** Accessible names for the resize handles (localized by the caller). */
  resizeLabels?: InspectorResizeLabels;
  /**
   * Where focus returns when the view closes.
   *
   * The caller owns the trigger (it lives in the chart's own toolbar), so it
   * hands its ref over: Radix would otherwise look for a `Dialog.Trigger` this
   * view intentionally does not have, and a reader would be dropped on `<body>`
   * after pressing Escape.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
  /** Latest values, shown beside the title. */
  metrics?: ReactNode;
  /** The chart itself. The height is 100% inside the dialog. */
  renderChart: (options: {
    height: number | string;
    fullscreen: boolean;
  }) => ReactNode;
  legend?: ReactNode;
  ranges?: readonly string[];
  range?: string;
  onRangeChange?: (range: string) => void;
  /**
   * The Linear/Log control.
   *
   * The mode lives with the caller (a URL, a preference store), so opening the
   * fullscreen view shows the same scale as the inline chart and closing it
   * leaves the choice untouched.
   */
  scale?: {
    allowed: readonly YScaleMode[];
    value: YScaleMode;
    onValueChange: (mode: YScaleMode) => void;
    labels?: Partial<Record<YScaleMode, string>>;
  };
  /** Extra toolbar controls. */
  actions?: ReactNode;
  exportTarget?: () => unknown;
  exportFilename?: string;
}
export declare function FullscreenResearchView({ open, onOpenChange, title, description, closeLabel, resizeLabels, returnFocusTo, metrics, renderChart, legend, ranges, range, onRangeChange, scale, actions, exportTarget, exportFilename }: FullscreenResearchViewProps): import("react").JSX.Element;
export interface FullscreenChartProps extends Omit<FullscreenResearchViewProps, "open" | "onOpenChange"> {
  /** Trigger element; the dialog wires the click. Defaults to a fullscreen icon. */
  renderTrigger?: () => ReactNode;
  /** Render the inline copy of the chart above the trigger. Default true. */
  inline?: boolean;
  inlineHeight?: number | string;
  className?: string;
}
/**
 * Self-contained variant: renders the chart inline plus its fullscreen dialog.
 * Use FullscreenResearchView when the page already owns the chart chrome and
 * wants the trigger inside its own toolbar.
 */
export declare function FullscreenChart({ renderTrigger, inline, inlineHeight, className, ...view }: FullscreenChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=fullscreen.d.ts.map