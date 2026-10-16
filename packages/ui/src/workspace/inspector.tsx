"use client";

import { useEffect, type ReactNode } from "react";
import { usePanelRef } from "react-resizable-panels";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";
import { Skeleton } from "../components/skeleton";
import { IconButton } from "../components/icon-button";
import { WorkspacePane, WorkspacePaneHeader, type WorkspacePaneProps } from "./workspace";

/* =============================================================================
 * Inspector
 *
 * A detail pane for the thing that is currently selected: a table row, a pinned
 * chart timestamp, a dataset, a property list. It is a `WorkspacePane` with an
 * opinion: it can be collapsed to zero width without unmounting, so reopening
 * restores the previous size and the workspace never jumps.
 *
 * Open state is controlled or uncontrolled, and the same state drives the
 * `InspectorToggle` a page puts in its header.
 * ========================================================================== */

export interface InspectorPaneProps
  extends Omit<WorkspacePaneProps, "id" | "collapsible" | "collapsedSize" | "children" | "title"> {
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

export function InspectorPane({
  id,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  title = "Inspector",
  description,
  actions,
  footer,
  side = "end",
  minSize = "18rem",
  defaultSize = "22rem",
  className,
  children,
  ...props
}: InspectorPaneProps) {
  const panelRef = usePanelRef();
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  useEffect(() => {
    const handle = panelRef.current;
    if (!handle) return;
    if (open) handle.expand();
    else handle.collapse();
  }, [open, panelRef]);

  return (
    <WorkspacePane
      id={id}
      minSize={minSize}
      defaultSize={defaultSize}
      collapsible
      collapsedSize="0%"
      panelRef={panelRef}
      onSizeChange={(collapsed) => {
        if (collapsed === open) return;
        setOpen(!collapsed);
      }}
      className={cn("bg-surface-default", side === "start" ? "border-r" : "border-l", "border-line-subtle", className)}
      {...props}
    >
      <WorkspacePaneHeader
        data-slot="inspector-header"
        title={title}
        description={description}
        paneId={id}
        actions={
          <>
            {actions}
            <IconButton
              label="Collapse inspector"
              size="sm"
              variant="ghost"
              icon={side === "start" ? <RiArrowLeftSLine /> : <RiArrowRightSLine />}
              onClick={() => setOpen(false)}
            />
          </>
        }
      />
      <div
        data-slot="inspector-body"
        className="luc-table-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 text-body text-fg-secondary"
      >
        {children}
      </div>
      {footer ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-line-subtle bg-surface-raised px-3 py-2">
          {footer}
        </div>
      ) : null}
    </WorkspacePane>
  );
}

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
export function InspectorToggle({ open, onOpenChange, label, className }: InspectorToggleProps) {
  const text = label ?? (open ? "Hide inspector" : "Show inspector");
  return (
    <IconButton
      label={text}
      size="sm"
      variant={open ? "ghost" : "solid"}
      aria-pressed={open}
      className={className}
      icon={open ? <RiArrowRightSLine /> : <RiArrowLeftSLine />}
      onClick={() => onOpenChange(!open)}
    />
  );
}

export interface InspectorSectionProps extends React.ComponentPropsWithRef<"section"> {
  label: ReactNode;
}

/** A titled block inside the inspector. */
export function InspectorSection({ label, className, children, ...props }: InspectorSectionProps) {
  return (
    <section data-slot="inspector-section" className={cn("flex flex-col gap-2", className)} {...props}>
      <h3 className="text-micro text-fg-muted uppercase">{label}</h3>
      {children}
    </section>
  );
}

export interface InspectorRowProps extends React.ComponentPropsWithRef<"div"> {
  label: ReactNode;
  value: ReactNode;
  /** Use tabular figures for the value. */
  numeric?: boolean;
}

/** One label/value pair. Numeric values never jitter. */
export function InspectorRow({ label, value, numeric = false, className, ...props }: InspectorRowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 text-label", className)} {...props}>
      <span className="text-fg-muted">{label}</span>
      <span className={cn("text-fg-primary", numeric && "luc-numeric")}>{value}</span>
    </div>
  );
}

/** Placeholder for an inspector that is still resolving its subject. */
export function InspectorSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading details</span>
      <Skeleton variant="text" className="w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}
