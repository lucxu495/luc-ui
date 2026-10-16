"use client";

/*
 * The row-actions control, wired.
 *
 * It used to be a `<button aria-label="Row actions">` with no handler and no
 * menu — present on four Build patterns (`/patterns/table-filters`,
 * `/patterns/table-date-filter`, `/patterns/workspace`,
 * `/patterns/command-palette`), each rendering once per visible row. Clicking it
 * did nothing at all, which is the "decorative button that does nothing" the
 * Experience rules name, and nothing in the suite could see it until
 * `qa/dead-controls.mjs` clicked every control and compared the document.
 *
 * The menu offers what a reference research table can honestly offer: the two
 * things a reader copies out of it. It does not pretend to edit, open or delete
 * anything — this dataset is a fixture, and a menu that promised an editor and
 * then did nothing would be the same defect with more words.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from "@luc/ui";
import { RiFileCopyLine, RiMore2Line } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import type { ResearchRun } from "@/lib/table-data";

/** One line a reader can paste into a note or an issue. */
function summarise(row: ResearchRun): string {
  return [
    `${row.symbol} · ${row.strategy}`,
    `status ${row.status} · regime ${row.regime}`,
    `sharpe ${row.sharpe.toFixed(2)} · cagr ${row.cagr.toFixed(1)}% · trades ${row.trades}`,
    row.id,
  ].join("\n");
}

export function RowActionsMenu({ row }: { row: ResearchRun }) {
  const { tcs } = useI18n();

  const copy = async (text: string, confirmation: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(confirmation);
    } catch {
      /* The clipboard API is unavailable on an insecure origin or without a
       * user gesture; saying so is better than a silent no-op. */
      toast.error(tcs("This browser would not let the page use the clipboard."));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={tcs("Row actions")}
          className="grid size-6 place-items-center rounded-xs text-fg-muted luc-transition hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus"
        >
          <RiMore2Line aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => copy(row.id, tcs("Run ID copied"))}>
          <RiFileCopyLine aria-hidden="true" className="size-4" />
          {tcs("Copy run ID")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => copy(summarise(row), tcs("Row copied"))}>
          <RiFileCopyLine aria-hidden="true" className="size-4" />
          {tcs("Copy row summary")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Stated rather than omitted: the reader asked "what else", and the
            honest answer is that this fixture has no backend behind it. */}
        <DropdownMenuItem disabled>{tcs("Editing is not part of this fixture")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
