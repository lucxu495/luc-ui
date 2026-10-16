"use client";

import { useOptionalI18n } from "@/lib/i18n/provider";
import { Badge, cn, Link, Text } from "@luc/ui";
import type { TradingViewWidgetDefinition } from "@luc/ui/tradingview";
import type { ReactNode } from "react";

export interface TradingViewTileProps {
  definition: TradingViewWidgetDefinition;
  /** What this widget is for, in one sentence. */
  useCase?: ReactNode;
  /** The live wrapper. */
  children: ReactNode;
  /** Extra controls, e.g. a size switch. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Showcase frame for one provider widget.
 *
 * It exists to make the two things a reader must know explicit: which format the
 * provider ships, and that the market data comes from TradingView. The widget
 * itself renders bare underneath — no second card, no overlay over attribution.
 */
export function TradingViewTile({ definition, useCase, children, actions, className }: TradingViewTileProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  // `useCase` is usually a string, but a page may pass rich content; the
  // registry's own summary is always a sentence and always translated.
  const summary = typeof useCase === "string" ? tcs(useCase) : useCase ?? tcs(definition.summary);
  const isWebComponent = definition.format === "web-component";
  return (
    <section
      // A stable hook for the QA sweep: one element screenshot per widget id.
      data-widget={definition.id}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-line-subtle bg-surface-raised p-4",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-label font-medium text-fg-primary">{definition.name}</h3>
            <Badge size="sm" tone={isWebComponent ? "info" : "neutral"}>
              {isWebComponent ? "Web Component" : "iframe"}
            </Badge>
          </div>
          <Text as="p" variant="caption" tone="muted">
            {summary}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Link
            href={definition.docsUrl}
            target="_blank"
            rel="noopener nofollow"
            className="luc-focus text-caption text-fg-muted luc-transition hover:text-fg-primary"
          >
            Provider docs
          </Link>
        </div>
      </header>
      <div className="min-w-0">{children}</div>
      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-fg-muted">
        <span>
          Minimum {definition.minSize.width}×{definition.minSize.height}
        </span>
        <span aria-hidden="true">·</span>
        <span>Market data by TradingView</span>
        {definition.replaces?.length ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Replaces {definition.replaces.join(", ")}</span>
          </>
        ) : null}
      </footer>
    </section>
  );
}
