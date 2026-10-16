import { KeyValueStorage } from "../utils/storage.js";
import { ReactNode } from "react";
import { Layout, PanelImperativeHandle } from "react-resizable-panels";
//#region src/workspace/workspace.d.ts
type WorkspaceMode = "panes" | "stacked";
interface WorkspaceContextValue {
  mode: WorkspaceMode;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  /** True when panes can actually be resized in the current mode. */
  resizable: boolean;
}
export declare function useWorkspace(): WorkspaceContextValue;
export interface WorkspaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Force a mode. By default the viewport decides: panes at 64rem and up. */
  mode?: WorkspaceMode;
  /** Controlled focus-mode pane. */
  focusedId?: string | null;
  onFocusedIdChange?: (id: string | null) => void;
  density?: "comfortable" | "compact";
}
export declare function Workspace({ className, mode: modeProp, focusedId: focusedIdProp, onFocusedIdChange, density, children, ...props }: WorkspaceProps): import("react").JSX.Element;
interface WorkspaceGroupContextValue {
  resetLayout: () => void;
  persistenceEnabled: boolean;
  /** True only while the children are rendered through the engine's Group. */
  engine: boolean;
}
export declare function useWorkspaceGroup(): WorkspaceGroupContextValue;
export interface WorkspaceGroupProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  /** Horizontal splits side by side; vertical splits stack. */
  orientation?: "horizontal" | "vertical";
  /**
   * Persist this group's layout locally under this key. Omit to keep the layout
   * for the session only.
   */
  persistKey?: string;
  persistVersion?: number;
  storage?: KeyValueStorage;
  /** Explicit starting layout, keyed by pane id. */
  defaultLayout?: Layout;
  /** Panel ids the stored layout must match. Derived from the children by default. */
  panelIds?: readonly string[];
  /** Disable dragging entirely. */
  locked?: boolean;
}
export declare function WorkspaceGroup({ className, orientation, persistKey, persistVersion, storage, defaultLayout, panelIds, locked, children, ...props }: WorkspaceGroupProps): import("react").JSX.Element;
export interface WorkspacePaneProps extends Omit<React.ComponentPropsWithRef<"div">, "id"> {
  /** Required: pane ids key the saved layout. */
  id: string;
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  /** Allow the pane to be dragged down to `collapsedSize`. */
  collapsible?: boolean;
  collapsedSize?: number | string;
  /** Remove the pane instead of stacking it on a narrow viewport. */
  hideOnStacked?: boolean;
  /** Forwarded to the engine so a consumer can expand or collapse the pane. */
  panelRef?: React.Ref<PanelImperativeHandle | null>;
  /** Reports collapse crossing zero. Used by `InspectorPane`. */
  onSizeChange?: (collapsed: boolean) => void;
}
/**
 * One resizable pane.
 *
 * It renders the engine's Panel directly, without a wrapper element, because
 * the engine requires its children to be its own direct DOM children and sets
 * the flex geometry inline.
 */
export declare function WorkspacePane({ id, defaultSize, minSize, maxSize, collapsible, collapsedSize, hideOnStacked, panelRef, onSizeChange, className, children, ...props }: WorkspacePaneProps): import("react").JSX.Element | null;
export interface WorkspaceResizeHandleProps extends Omit<React.ComponentPropsWithRef<"div">, "role" | "tabIndex"> {
  /** Accessible name; a separator without one is hard to use by voice. */
  label?: string;
}
/**
 * The drag target between two panes.
 *
 * The visible rule is a hairline; the hit area is wide enough to grab. The
 * engine supplies the separator role, the aria values and arrow-key resizing,
 * and marks its state as `data-separator` = active, focus or inactive. The
 * classes below read that attribute instead of inventing a second state machine.
 */
export declare function WorkspaceResizeHandle({ className, label, ...props }: WorkspaceResizeHandleProps): import("react").JSX.Element | null;
export interface WorkspacePaneHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Leading marker, e.g. an icon. Decorative. */
  icon?: ReactNode;
  /** Trailing controls. */
  actions?: ReactNode;
  /** Adds a focus-mode toggle for this pane. */
  paneId?: string;
  /** Adds a reset action when the group persists its layout. */
  showReset?: boolean;
}
/** The persistent strip at the top of a pane. */
export declare function WorkspacePaneHeader({ title, description, icon, actions, paneId, showReset, className, children, ...props }: WorkspacePaneHeaderProps): import("react").JSX.Element;
export interface WorkspacePaneBodyProps extends React.ComponentPropsWithRef<"div"> {
  /** Remove the padding for a pane that fills itself, e.g. a chart or a table. */
  flush?: boolean;
  /** Accessible name for the scrollable region. */
  ariaLabel?: string;
}
/**
 * The scrolling region of a pane. Header and footer stay put.
 *
 * It is focusable on purpose: a scroll region that cannot be reached by
 * keyboard is a defect, and a pane's content can be taller than its box. Give
 * it an `ariaLabel` when it is a named region rather than the pane's only body.
 */
export declare function WorkspacePaneBody({ className, flush, ariaLabel, ...props }: WorkspacePaneBodyProps): import("react").JSX.Element;
/** A pane's footer row. Opaque, because it sits over scrolling content. */
export declare function WorkspacePaneFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export interface WorkspaceFocusBannerProps {
  /** Wording for the banner. */
  label?: string;
}
/** A quiet banner shown while a pane is in focus mode, so Escape has a target. */
export declare function WorkspaceFocusBanner({ label }: WorkspaceFocusBannerProps): import("react").JSX.Element | null;
//#endregion
export {};
//# sourceMappingURL=workspace.d.ts.map