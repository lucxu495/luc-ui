"use client";

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Group,
  Panel,
  Separator,
  type Layout,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import { RiContractLine, RiExpandDiagonalLine, RiRefreshLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useMediaQuery } from "../hooks/use-media-query";
import type { KeyValueStorage } from "../utils/storage";
import { IconButton } from "../components/icon-button";
import { useWorkspaceLayout } from "./use-workspace-layout";

/* =============================================================================
 * Workspace
 *
 * A structured resizable application layout — not a drag-and-drop dashboard.
 * Panes are defined in JSX, so the layout is the component tree; the engine
 * (`react-resizable-panels`) only supplies dragging, keyboard resizing,
 * constraints and persistence.
 *
 * Three modes, one tree:
 *
 *   panes     desktop, one or more resizable panes
 *   stacked   narrow viewport, below 64rem: panes stack and handles disappear
 *   focus     one pane is temporarily expanded to fill its group
 *
 * The mode switch matters because the engine sets `display: flex` inline on its
 * roots: a pane cannot be hidden or re-flowed with a class. Choosing a different
 * composition is the honest way to change the layout.
 * ========================================================================== */

type WorkspaceMode = "panes" | "stacked";

interface WorkspaceContextValue {
  mode: WorkspaceMode;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  /** True when panes can actually be resized in the current mode. */
  resizable: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  mode: "panes",
  focusedId: null,
  setFocusedId: () => {},
  resizable: true,
});

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}

export interface WorkspaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Force a mode. By default the viewport decides: panes at 64rem and up. */
  mode?: WorkspaceMode;
  /** Controlled focus-mode pane. */
  focusedId?: string | null;
  onFocusedIdChange?: (id: string | null) => void;
  density?: "comfortable" | "compact";
}

export function Workspace({
  className,
  mode: modeProp,
  focusedId: focusedIdProp,
  onFocusedIdChange,
  density = "comfortable",
  children,
  ...props
}: WorkspaceProps) {
  const wide = useMediaQuery("(min-width: 64rem)", true);
  const [internalFocus, setInternalFocus] = useState<string | null>(null);
  const focusedId = focusedIdProp !== undefined ? focusedIdProp : internalFocus;

  const setFocusedId = useCallback(
    (next: string | null) => {
      if (focusedIdProp === undefined) setInternalFocus(next);
      onFocusedIdChange?.(next);
    },
    [focusedIdProp, onFocusedIdChange],
  );

  const mode = modeProp ?? (wide ? "panes" : "stacked");
  const value = useMemo<WorkspaceContextValue>(
    () => ({ mode, focusedId, setFocusedId, resizable: mode === "panes" && focusedId === null }),
    [focusedId, mode, setFocusedId],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      <div
        data-slot="workspace"
        data-mode={mode}
        data-density={density === "compact" ? "compact" : undefined}
        // No `flex-1` here: a workspace is often placed in a bounded box
        // (`h-[30rem]`), and `flex-1` would set `flex-basis: 0` and win over
        // that height. A consumer that wants it to fill a flex parent adds
        // `flex-1` — the shell's content area already does.
        className={cn("flex min-h-0 flex-col", className)}
        {...props}
      >
        {children}
      </div>
    </WorkspaceContext.Provider>
  );
}

interface WorkspaceGroupContextValue {
  resetLayout: () => void;
  persistenceEnabled: boolean;
  /** True only while the children are rendered through the engine's Group. */
  engine: boolean;
}

const WorkspaceGroupContext = createContext<WorkspaceGroupContextValue>({
  resetLayout: () => {},
  persistenceEnabled: false,
  engine: false,
});

export function useWorkspaceGroup(): WorkspaceGroupContextValue {
  return useContext(WorkspaceGroupContext);
}

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

export function WorkspaceGroup({
  className,
  orientation = "horizontal",
  persistKey,
  persistVersion = 1,
  storage,
  defaultLayout,
  panelIds,
  locked = false,
  children,
  ...props
}: WorkspaceGroupProps) {
  const { mode, focusedId } = useWorkspace();
  const autoId = useId();
  const groupId = persistKey ?? `luc-workspace-${autoId}`;

  const childIds = useMemo(() => {
    const ids: string[] = [];
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const id = (child.props as { id?: unknown }).id;
      if (typeof id === "string") ids.push(id);
    });
    return ids;
  }, [children]);

  const resolvedPanelIds = panelIds ?? childIds;
  const persistenceEnabled = Boolean(persistKey);

  const layout = useWorkspaceLayout({
    id: groupId,
    panelIds: resolvedPanelIds,
    version: persistVersion,
    storage,
    defaultLayout,
    persist: persistenceEnabled,
  });

  const groupContext = useMemo<WorkspaceGroupContextValue>(
    () => ({ resetLayout: layout.resetLayout, persistenceEnabled, engine: true }),
    [layout.resetLayout, persistenceEnabled],
  );
  const blockContext = useMemo<WorkspaceGroupContextValue>(
    () => ({ resetLayout: layout.resetLayout, persistenceEnabled, engine: false }),
    [layout.resetLayout, persistenceEnabled],
  );

  // Focus mode: show only the focused pane, as a plain block rather than an
  // engine Panel. The engine requires panels inside a group, so the group itself
  // steps aside and lets the pane fill it.
  const isFocusMode = focusedId !== null && resolvedPanelIds.includes(focusedId);
  if (isFocusMode) {
    return (
      <WorkspaceGroupContext.Provider value={blockContext}>
        <div
          data-slot="workspace-group"
          data-orientation={orientation}
          data-focus="true"
          className={cn("flex min-h-0 flex-1 flex-col", className)}
          {...props}
        >
          {Children.map(children, (child) => {
            if (!isValidElement(child)) return null;
            return (child.props as { id?: unknown }).id === focusedId ? child : null;
          })}
        </div>
      </WorkspaceGroupContext.Provider>
    );
  }

  // Stacked mode: a narrow viewport has no room for two 200px columns.
  if (mode === "stacked") {
    return (
      <WorkspaceGroupContext.Provider value={blockContext}>
        <div
          data-slot="workspace-group"
          data-orientation={orientation}
          data-stacked="true"
          className={cn("flex min-h-0 flex-1 flex-col", className)}
          {...props}
        >
          {children}
        </div>
      </WorkspaceGroupContext.Provider>
    );
  }

  return (
    <WorkspaceGroupContext.Provider value={groupContext}>
      <Group
        key={layout.epoch}
        id={groupId}
        orientation={orientation}
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
        disabled={locked}
        groupRef={layout.groupRef}
        data-slot="workspace-group"
        data-orientation={orientation}
        className={cn("min-h-0", className)}
        {...props}
      >
        {children}
      </Group>
    </WorkspaceGroupContext.Provider>
  );
}

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
export function WorkspacePane({
  id,
  defaultSize,
  minSize = "12rem",
  maxSize,
  collapsible = false,
  collapsedSize = "0%",
  hideOnStacked = false,
  panelRef,
  onSizeChange,
  className,
  children,
  ...props
}: WorkspacePaneProps) {
  const { mode, focusedId, setFocusedId } = useWorkspace();
  const group = useWorkspaceGroup();
  const focused = focusedId === id;

  // The engine's Panel asserts if it is rendered outside a Group, so a pane only
  // becomes a Panel when its own group is drawing engine children.
  if (mode === "stacked" || !group.engine) {
    if (hideOnStacked) return null;
    return (
      <div
        data-slot="workspace-pane"
        data-pane-id={id}
        data-focused={focused ? "true" : undefined}
        className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  const handleResize = (size: { asPercentage: number }) => {
    onSizeChange?.(size.asPercentage === 0);
    // A resize means the user has made a layout decision, so the expanded pane
    // is no longer frame-filling and focus mode should end.
    if (focused) setFocusedId(null);
  };

  return (
    <Panel
      id={id}
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      collapsedSize={collapsedSize}
      panelRef={panelRef}
      data-slot="workspace-pane"
      data-pane-id={id}
      data-focused={focused ? "true" : undefined}
      className={cn("flex min-h-0 flex-col overflow-hidden", className)}
      onResize={handleResize}
    >
      {children}
    </Panel>
  );
}

export interface WorkspaceResizeHandleProps
  extends Omit<React.ComponentPropsWithRef<"div">, "role" | "tabIndex"> {
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
export function WorkspaceResizeHandle({
  className,
  label = "Resize panes",
  ...props
}: WorkspaceResizeHandleProps) {
  const { mode } = useWorkspace();
  if (mode !== "panes") return null;
  return (
    <Separator
      aria-label={label}
      data-slot="workspace-handle"
      className={cn(
        "group/handle relative flex items-center justify-center luc-focus",
        // A separator between side-by-side panes is orientated vertically.
        "aria-[orientation=vertical]:w-[var(--workspace-handle-hit-size)] aria-[orientation=vertical]:cursor-col-resize",
        "aria-[orientation=horizontal]:h-[var(--workspace-handle-hit-size)] aria-[orientation=horizontal]:cursor-row-resize",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-line-subtle luc-transition",
          "group-aria-[orientation=vertical]/handle:h-10 group-aria-[orientation=vertical]/handle:w-[var(--workspace-handle-size)]",
          "group-aria-[orientation=horizontal]/handle:h-[var(--workspace-handle-size)] group-aria-[orientation=horizontal]/handle:w-10",
          "group-hover/handle:bg-line-strong",
          "group-data-[separator=active]/handle:bg-accent-default",
          "group-data-[separator=focus]/handle:bg-accent-default",
        )}
      />
    </Separator>
  );
}

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
export function WorkspacePaneHeader({
  title,
  description,
  icon,
  actions,
  paneId,
  showReset = false,
  className,
  children,
  ...props
}: WorkspacePaneHeaderProps) {
  const { focusedId, setFocusedId, mode } = useWorkspace();
  const group = useWorkspaceGroup();
  const focused = paneId !== undefined && focusedId === paneId;
  return (
    <div
      data-slot="workspace-pane-header"
      className={cn("flex shrink-0 items-center gap-3 border-b border-line-subtle px-3 py-2", className)}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center text-fg-muted [&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-label text-fg-primary">{title}</p>
        {description ? <p className="truncate text-caption text-fg-muted">{description}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {children}
        {showReset && group.persistenceEnabled ? (
          <IconButton
            label="Reset pane sizes"
            size="sm"
            variant="ghost"
            icon={<RiRefreshLine />}
            onClick={group.resetLayout}
          />
        ) : null}
        {mode === "panes" && paneId ? (
          <IconButton
            label={focused ? "Exit focus mode" : "Focus this pane"}
            size="sm"
            variant="ghost"
            aria-pressed={focused}
            icon={focused ? <RiContractLine /> : <RiExpandDiagonalLine />}
            onClick={() => setFocusedId(focused ? null : paneId)}
          />
        ) : null}
        {actions}
      </div>
    </div>
  );
}

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
export function WorkspacePaneBody({
  className,
  flush = false,
  ariaLabel,
  ...props
}: WorkspacePaneBodyProps) {
  return (
    <div
      data-slot="workspace-pane-body"
      tabIndex={0}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "luc-table-scroll min-h-0 flex-1 overflow-auto overscroll-contain luc-focus",
        !flush && "p-3",
        className,
      )}
      {...props}
    />
  );
}

/** A pane's footer row. Opaque, because it sits over scrolling content. */
export function WorkspacePaneFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="workspace-pane-footer"
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-line-subtle bg-surface-raised px-3 py-2 text-caption text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface WorkspaceFocusBannerProps {
  /** Wording for the banner. */
  label?: string;
}

/** A quiet banner shown while a pane is in focus mode, so Escape has a target. */
export function WorkspaceFocusBanner({ label = "Focus mode" }: WorkspaceFocusBannerProps) {
  const { focusedId, setFocusedId } = useWorkspace();
  if (!focusedId) return null;
  return (
    <div
      data-slot="workspace-focus-banner"
      className="flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-accent-soft px-3 py-1.5 text-caption text-fg-secondary"
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setFocusedId(null)}
        className="luc-focus rounded-xs px-1.5 py-0.5 text-caption text-fg-accent hover:bg-accent-soft-hover"
      >
        Exit (Esc)
      </button>
    </div>
  );
}
