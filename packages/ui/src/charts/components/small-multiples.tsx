"use client";

import { cn } from "../../utils/cn";

/**
 * LUC SmallMultiples — one grid of related charts that share an axis.
 *
 * The alternative to an overcrowded single plot. Four rolling-Sharpe windows,
 * five horizons, six cohorts: each gets its own panel, all panels share the same
 * x semantics so the eye compares shapes rather than legends.
 *
 * This is a **layout** primitive, not an engine: each `SmallMultiple` renders
 * whatever chart the caller puts inside it. That keeps the caller in control of
 * which engine is right per panel, and keeps this file free of chart logic.
 */
export interface SmallMultiplesProps extends React.ComponentPropsWithRef<"div"> {
  /** Panel count that forces a single column (useful on mobile). */
  columns?: 1 | 2 | 3 | 4;
  /** Shared caption above the grid, e.g. "Rolling Sharpe (annualised)". */
  label?: React.ReactNode;
  /** One shared legend, when every panel plots the same series. */
  legend?: React.ReactNode;
}

const COLUMN_CLASS: Record<NonNullable<SmallMultiplesProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export function SmallMultiples({
  className,
  children,
  columns = 2,
  label,
  legend,
  ...props
}: SmallMultiplesProps) {
  return (
    <div data-slot="small-multiples" className={cn("flex min-w-0 flex-col gap-3", className)} {...props}>
      {label || legend ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {label ? <span className="text-label font-medium text-fg-secondary">{label}</span> : null}
          {legend}
        </div>
      ) : null}
      <div className={cn("grid min-w-0 gap-3", COLUMN_CLASS[columns])}>{children}</div>
    </div>
  );
}

export interface SmallMultipleProps extends Omit<React.ComponentPropsWithRef<"figure">, "title"> {
  /** Panel title, e.g. "30D". */
  title: React.ReactNode;
  /** Optional caption under the panel (a value, a footnote). */
  caption?: React.ReactNode;
  /** Right-aligned title slot (a value that changes per panel). */
  aside?: React.ReactNode;
}

// One panel. A `<figure>` with a `<figcaption>` so a screen reader announces the
// panel's identity before its chart, which is the whole point of small
// multiples.
export function SmallMultiple({ className, title, caption, aside, children, ...props }: SmallMultipleProps) {
  return (
    <figure
      data-slot="small-multiple"
      className={cn(
        "m-0 flex min-w-0 flex-col gap-2 rounded-lg border border-line-subtle bg-surface-default p-3",
        className,
      )}
      {...props}
    >
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-caption font-medium text-fg-secondary">{title}</span>
        {aside ? <span className="text-caption text-fg-muted luc-numeric">{aside}</span> : null}
      </figcaption>
      <div className="min-w-0">{children}</div>
      {caption ? <p className="text-micro text-fg-muted">{caption}</p> : null}
    </figure>
  );
}
