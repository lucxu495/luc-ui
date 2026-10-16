"use client";

import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/* =============================================================================
 * PageHeader
 *
 * The top of a page: what this is, what state it is in, what you can do here.
 * Slots rather than props-with-ten-variants — a research page fills `meta` and
 * `actions`, a settings page fills `description` and nothing else, and neither
 * has to opt out of a layout it did not ask for.
 * ========================================================================== */

export interface PageHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  /** Small context line above the title, e.g. a section or a dataset kind. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Inline metadata row under the description: status, timestamp, counts. */
  meta?: ReactNode;
  /** Primary actions, right-aligned on wide screens. */
  actions?: ReactNode;
  /** Secondary controls that belong with the header, e.g. a view toggle. */
  controls?: ReactNode;
  /** Sub-navigation: a `Tabs`/`SegmentedControl` row pinned under the header. */
  tabs?: ReactNode;
  /**
   * `dense` tightens the vertical rhythm for analytical pages. It changes
   * spacing, never type size or touch targets.
   */
  density?: "comfortable" | "dense";
  /** Keep the header pinned while the page scrolls. */
  sticky?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  controls,
  tabs,
  density = "comfortable",
  sticky = false,
  className,
  children,
  ...props
}: PageHeaderProps) {
  const dense = density === "dense";
  return (
    <div
      data-slot="page-header"
      data-density={dense ? "dense" : undefined}
      className={cn(
        "flex flex-col gap-3 border-b border-line-subtle bg-surface-canvas",
        dense ? "px-4 py-3.5 sm:px-6" : "px-4 py-5 sm:px-6",
        sticky && "sticky top-[var(--shell-topbar-height)] z-[var(--z-sticky)]",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <p className="text-micro text-fg-muted uppercase">{eyebrow}</p> : null}
          <h1 className={cn("text-heading-sm text-fg-primary", dense && "text-title")}>{title}</h1>
          {description ? (
            <p className="max-w-[var(--container-prose)] text-body text-fg-secondary">{description}</p>
          ) : null}
          {meta ? <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-fg-muted">{meta}</div> : null}
        </div>
        {actions || controls ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {controls}
            {actions}
          </div>
        ) : null}
      </div>
      {children}
      {tabs ? <div className="-mb-px flex min-w-0 items-center gap-1 overflow-x-auto">{tabs}</div> : null}
    </div>
  );
}

export interface PageHeaderMetaProps extends React.ComponentPropsWithRef<"span"> {
  /** A leading marker: a status dot, an icon. Decorative. */
  marker?: ReactNode;
}

/** One quiet fact in the header's metadata row. */
export function PageHeaderMeta({ marker, className, children, ...props }: PageHeaderMetaProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} {...props}>
      {marker ? <span aria-hidden="true" className="grid place-items-center">{marker}</span> : null}
      {children}
    </span>
  );
}
