"use client";

import { RiLayoutColumnLine } from "@remixicon/react";
import { Checkbox } from "../components/checkbox";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover";
import { cn } from "../utils/cn";
import { useDataTable } from "./context";

/**
 * Show/hide optional columns.
 *
 * Locked columns (`meta.locked`, or `enableHiding: false`) are listed as
 * disabled so the reader can see the whole shape of the table rather than
 * wondering where a column went. Persisting the choice is the consumer's job:
 * pass `columnVisibility` + `onColumnVisibilityChange` and store it.
 */
export interface ColumnVisibilityMenuProps {
  label?: string;
  className?: string;
}

export function ColumnVisibilityMenu({ label = "Columns", className }: ColumnVisibilityMenuProps) {
  const { table } = useDataTable();
  const columns = table.getAllLeafColumns();
  const hiddenCount = columns.filter((column) => !column.getIsVisible()).length;

  return (
    <PopoverRoot>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-control-sm items-center gap-1.5 rounded-sm border border-line-default bg-surface-sunken px-2.5 text-label text-fg-secondary",
            "luc-transition hover:border-line-strong hover:text-fg-primary luc-focus",
            className,
          )}
        >
          <RiLayoutColumnLine aria-hidden="true" className="size-3.5 text-fg-muted" />
          {label}
          {hiddenCount > 0 ? (
            <span className="luc-numeric rounded-xs bg-surface-interactive px-1 text-micro text-fg-muted">
              {hiddenCount} hidden
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent width="sm" align="end" className="flex flex-col gap-1 p-1.5">
        <p className="px-1.5 pt-1 pb-0.5 text-micro font-medium text-fg-muted uppercase">{label}</p>
        {columns.map((column) => {
          const meta = column.columnDef.meta;
          const canHide = column.getCanHide();
          const columnLabel =
            meta?.label ??
            (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id);
          return (
            <label
              key={column.id}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1.5 luc-transition",
                canHide ? "cursor-pointer hover:bg-surface-interactive-hover" : "cursor-default opacity-70",
              )}
            >
              <Checkbox
                checked={column.getIsVisible()}
                disabled={!canHide}
                onCheckedChange={() => column.toggleVisibility()}
              />
              <span className="min-w-0 flex-1 truncate text-label text-fg-secondary">{columnLabel}</span>
              {!canHide ? <span className="text-micro text-fg-disabled uppercase">fixed</span> : null}
            </label>
          );
        })}
        <div className="mt-0.5 flex items-center justify-between border-t border-line-subtle px-1.5 pt-2">
          <span className="text-caption text-fg-muted">
            {columns.length - hiddenCount} of {columns.length} shown
          </span>
          <button
            type="button"
            onClick={() => table.toggleAllColumnsVisible(true)}
            className="rounded-xs text-caption text-fg-muted luc-transition hover:text-fg-primary luc-focus"
          >
            Show all
          </button>
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}
