"use client";

import { cn } from "@luc/ui";
import { useRouteCopy } from "@/lib/i18n/provider";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, lead, actions, className }: PageHeaderProps) {
  /*
   * Localisation without touching ninety-seven page files.
   *
   * The page keeps owning its English copy — that is the fallback and the
   * source of truth — and the dictionary may override `title`/`lead` for the
   * current route. A page that has not been translated renders exactly as
   * before, which is what makes partial coverage honest instead of broken.
   */
  const copy = useRouteCopy({ title, lead });

  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-line-subtle pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow ? <p className="text-micro text-fg-accent uppercase">{eyebrow}</p> : null}
        {/*
          * `id="overview"` — the same anchor the registry's own header carries.
          *
          * Every section on a documentation page has a stable anchor so a link
          * survives an edit, and the title block was the one that did not: a
          * generated page had `#overview` and a handwritten page had nothing, so
          * "read from the top" meant two different URLs depending on which page
          * kind the reader happened to be on.
          */}
        {/*
          * `wrap-anywhere` for the same reason `DocEntryHeader` carries it: a
          * title with no space in it (`DataTableSelectionCount`) is wider than a
          * phone at `text-display-sm`, and `overflow-wrap: normal` would push
          * that width into every ancestor. No handwritten page has such a title
          * today; the guard is here because the two header components render the
          * same thing and only one of them was fixed is how a defect comes back.
          */}
        <h1 id="overview" className="wrap-anywhere font-display text-display-sm font-semibold tracking-[-0.026em] text-fg-primary text-balance">
          {copy.title}
        </h1>
        {copy.lead ? (
          <p className="max-w-[52ch] text-body text-fg-secondary text-pretty">{copy.lead}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
