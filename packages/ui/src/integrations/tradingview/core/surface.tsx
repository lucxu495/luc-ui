"use client";

import type { ReactNode } from "react";
import { Button } from "../../../components/button";
import { Skeleton } from "../../../components/skeleton";
import { cn } from "../../../utils/cn";

/**
 * Loading surface for an external widget.
 *
 * It reserves the widget's own geometry — a title line, a plot band, a footer
 * line — so the page does not jump when TradingView takes over. No spinner: the
 * provider's content arrives as a block, not as a status.
 */
export function TradingViewWidgetSkeleton({
  className,
  label = "Loading market widget",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("flex h-full w-full flex-col gap-3 p-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-7 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="min-h-0 flex-1 rounded-md" />
    </div>
  );
}

/**
 * Failure surface.
 *
 * Deliberately does not invent market data: when the provider is unreachable
 * the honest answer is "unavailable", with a retry, and the rest of the page
 * keeps working.
 */
export function TradingViewWidgetError({
  className,
  title = "Market widget unavailable",
  description = "TradingView could not be reached. The rest of this page is unaffected.",
  action,
}: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center",
        className,
      )}
      role="alert"
    >
      <p className="text-label font-medium text-fg-primary">{title}</p>
      <p className="max-w-[32ch] text-caption text-fg-muted">{description}</p>
      {action}
    </div>
  );
}

export interface TradingViewWidgetFrameProps {
  /** Panel title. Omit for a bare widget. */
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered opposite the title. Keep to secondary actions. */
  actions?: ReactNode;
  /** The widget itself. */
  children: ReactNode;
  className?: string;
}

/**
 * Optional outer surface for a provider widget.
 *
 * Two rules: it never overlaps the widget box (so the provider's attribution
 * can never be covered), and it never adds its own background behind the widget
 * — a double-framed widget looks like a mistake, which is why this is opt-in and
 * the wrappers themselves render bare.
 */
export function TradingViewWidgetFrame({
  title,
  description,
  actions,
  children,
  className,
}: TradingViewWidgetFrameProps) {
  return (
    <section className={cn("flex min-h-0 flex-col gap-3", className)}>
      {title || description || actions ? (
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? <h3 className="text-label font-medium text-fg-primary">{title}</h3> : null}
            {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className="min-h-0">{children}</div>
    </section>
  );
}

/** Retry affordance shared by both wrapper formats. */
export function TradingViewRetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <Button size="sm" variant="secondary" onClick={onRetry} className="mt-1">
      Try again
    </Button>
  );
}

/**
 * Construction fallback for a symbol the provider cannot accept.
 *
 * The typed widgets reject an obviously malformed symbol (empty, or characters
 * that cannot appear in `EXCHANGE:TICKER`) *before* anything is requested from
 * TradingView. That is a bounded state, not a crash: the widget renders this
 * surface and the rest of the page keeps working. It deliberately does not echo
 * the offending value back into the UI.
 */
export function TradingViewSymbolError({ className, title }: { className?: string; title?: ReactNode }) {
  return (
    <TradingViewWidgetError
      className={className}
      title={title ?? "Market widget unavailable"}
      description="This widget needs a valid TradingView symbol in EXCHANGE:TICKER form, so nothing was requested from the provider."
    />
  );
}
