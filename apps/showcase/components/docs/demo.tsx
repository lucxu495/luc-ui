"use client";

import { cn } from "@luc/ui";
import { CopyButton } from "./copy-button";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface DemoProps {
  title?: string;
  description?: string;
  /** The live sample. */
  children: React.ReactNode;
  /** Source shown under the stage, with a copy affordance. */
  code?: string;
  /** Layout of the stage. */
  layout?: "inline" | "grid" | "block";
  /** Extra classes for the stage only. */
  stageClassName?: string;
  className?: string;
  /** Hide the stage chrome when the sample brings its own surface. */
  bare?: boolean;
}

/**
 * The Showcase's unit of documentation: live sample, optional source, always
 * the real component from `@luc/ui` — nothing here is re-implemented.
 */
export function Demo({
  title,
  description,
  children,
  code,
  layout = "inline",
  stageClassName,
  className,
  bare = false,
}: DemoProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);

  return (
    <section data-slot="demo" className={cn("flex flex-col gap-2.5", className)}>
      {title || description ? (
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title ? <h3 className="text-label font-medium text-fg-primary">{tcs(title)}</h3> : null}
            {description ? (
              <p className="max-w-[64ch] text-caption text-fg-muted">{tcs(description)}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative",
          !bare && "rounded-lg border border-line-subtle bg-surface-canvas",
          !bare && "p-5",
          /*
           * `[&>*]:min-w-0`: a specimen may hold something intrinsically wide —
           * a data table, a chart legend, a wide chart surface — and a flex or
           * grid item's automatic minimum size is its min-content. Without this
           * the specimen takes the page with it: `/patterns/table-date-filter`
           * measured 1094px inside a 350px frame, so the document scrolled 724px
           * sideways at a 390px viewport. The specimen frame is the right place
           * to stop that, because the specimen is what knows how to scroll
           * internally.
           */
          layout === "inline" && "flex flex-wrap items-center gap-3 [&>*]:min-w-0",
          layout === "grid" && "grid gap-4 [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-3",
          layout === "block" && "flex flex-col gap-4 [&>*]:min-w-0",
          stageClassName,
        )}
      >
        {children}
      </div>

      {code ? (
        <div className="group/code relative overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken">
          <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover/code:opacity-100 focus-within:opacity-100">
            <CopyButton value={code} label={tcs("Copy code")} className="bg-surface-overlay/80 backdrop-blur-sm" />
          </div>
          {/*
           * Focusable on purpose: a horizontally scrollable code block is
           * unreachable by keyboard otherwise (`scrollable-region-focusable`).
           */}
          <pre
            tabIndex={0}
            className="luc-table-scroll overflow-x-auto px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
          >
            <code>{code}</code>
          </pre>
        </div>
      ) : null}
    </section>
  );
}
