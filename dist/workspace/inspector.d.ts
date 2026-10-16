import { WorkspacePaneProps } from "./workspace.js";
import { ReactNode } from "react";
//#region src/workspace/inspector.d.ts
export interface InspectorPaneProps extends Omit<WorkspacePaneProps, "id" | "collapsible" | "collapsedSize" | "children" | "title"> {
  /**
   * Pane id. Required: it keys the saved layout, so an implicit id would make
   * the stored layout depend on render order.
   */
  id: string;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Rendered under the inspector body, e.g. a primary action row. */
  footer?: ReactNode;
  children: ReactNode;
  /** Which edge the pane sits on. Affects only the border it draws. */
  side?: "start" | "end";
}
export declare function InspectorPane({ id, open: openProp, defaultOpen, onOpenChange, title, description, actions, footer, side, minSize, defaultSize, className, children, ...props }: InspectorPaneProps): import("react").JSX.Element;
export interface InspectorToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name. Defaults to open/close wording. */
  label?: string;
  className?: string;
}
/**
 * The control that reopens a collapsed inspector.
 *
 * A collapsed pane has no header, so the way back has to live somewhere the
 * reader can still reach — usually the main pane's header or the topbar.
 */
export declare function InspectorToggle({ open, onOpenChange, label, className }: InspectorToggleProps): import("react").JSX.Element;
export interface InspectorSectionProps extends React.ComponentPropsWithRef<"section"> {
  label: ReactNode;
}
/** A titled block inside the inspector. */
export declare function InspectorSection({ label, className, children, ...props }: InspectorSectionProps): import("react").JSX.Element;
export interface InspectorRowProps extends React.ComponentPropsWithRef<"div"> {
  label: ReactNode;
  value: ReactNode;
  /** Use tabular figures for the value. */
  numeric?: boolean;
}
/** One label/value pair. Numeric values never jitter. */
export declare function InspectorRow({ label, value, numeric, className, ...props }: InspectorRowProps): import("react").JSX.Element;
/** Placeholder for an inspector that is still resolving its subject. */
export declare function InspectorSkeleton(): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=inspector.d.ts.map