"use client";

/*
 * One copyable code block.
 *
 * The Showcase has printed this markup by hand in three places — the install
 * section, the import rows and a handful of guides — and the fourth place was
 * about to be the Usage section of every component page. Four hand-rolled
 * versions of the same block is how the site ends up with one snippet that
 * wraps, one that cannot be scrolled by keyboard and one whose copy button has
 * no accessible name, so the block moved here instead.
 *
 * What it owns, and why each part is not decoration:
 *
 *  - `tabIndex={0}` on the `<pre>`: a horizontally scrollable region with no tab
 *    stop is unreachable by keyboard, which axe reports as
 *    `scrollable-region-focusable` (serious) — the mobile sweep found this on
 *    every component page that had an API table.
 *  - a *named* copy control, so "Copy" is never an unlabelled button.
 *  - `surface-sunken` and `text-caption` mono, the same treatment the example
 *    snippets use, so a reader reads one code style rather than two.
 */

import { cn } from "@luc/ui";
import { CopyButton } from "./copy-button";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface CodeBlockProps {
  code: string;
  /** Accessible name for the copy control, e.g. "Copy the minimal call". */
  label?: string;
  className?: string;
}

export function CodeBlock({ code, label, className }: CodeBlockProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);

  return (
    <div
      className={cn(
        "group/code relative overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken",
        className,
      )}
    >
      <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-[var(--motion-fast)] group-hover/code:opacity-100 focus-within:opacity-100">
        <CopyButton value={code} label={tcs(label ?? "Copy code")} />
      </div>
      <pre
        tabIndex={0}
        className="luc-table-scroll overflow-x-auto px-3.5 py-3 font-mono text-caption leading-[1.7] text-fg-secondary"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
