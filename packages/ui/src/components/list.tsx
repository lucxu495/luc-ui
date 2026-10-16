import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/**
 * LUC List — a sequence of comparable rows.
 *
 * The library had three answers to "show me several of the same thing" — a Card
 * per item, a `TransferList`, a `SortableList` — and none of them for the plain
 * case: recent runs, changed files, matching symbols, the audit trail down the
 * side of a panel. Built out of Cards it reads as a gallery, and a reader cannot
 * scan a column of things that each arrive in their own box.
 *
 * So this is the semantics first: a real `<ul>` with real `<li>` children, one
 * hairline between rows instead of a border around each, and a fixed slot order
 * — leading mark, title, description, meta, actions — so that ten rows line up
 * with each other. That alignment is the whole point of a list; a list whose
 * rows each lay themselves out is a column of cards.
 *
 * `ListHeader` and `ListFooter` are the same surface's edges: a title and the
 * one action the list is about, and a "showing 20 of 1,284" line. They exist so
 * a consumer does not assemble those from `Heading`, `Text` and `Inline` and get
 * the spacing subtly different on each page.
 */

export interface ListProps extends React.ComponentPropsWithRef<"ul"> {
  /** One hairline between rows, and none before the first. */
  divided?: boolean;
  /** A border and a radius around the whole list, for a standalone surface. */
  bordered?: boolean;
}

export function List({ className, divided = false, bordered = false, ...props }: ListProps) {
  return (
    <ul
      data-slot="list"
      className={cn(
        "m-0 flex list-none flex-col p-0",
        bordered && "overflow-hidden rounded-lg border border-line-subtle bg-surface-default",
        /* `data-divided` is on the list and the rule is on the row, so a row
         * never has to know whether it is the first one. */
        divided && "[&>[data-slot=list-item]+[data-slot=list-item]]:border-t [&>[data-slot=list-item]+[data-slot=list-item]]:border-line-subtle",
        className,
      )}
      {...props}
    />
  );
}

export interface ListItemProps extends Omit<React.ComponentPropsWithRef<"li">, "title"> {
  /** A mark, an avatar, an ordinal — anything that identifies the row at a glance. */
  leading?: ReactNode;
  title: ReactNode;
  /** One line of what the row is. Wraps, but is not a paragraph. */
  description?: ReactNode;
  /** Right-aligned secondary value: a timestamp, a count, a change. */
  meta?: ReactNode;
  /** Controls at the end of the row — a badge, a button, a menu. */
  trailing?: ReactNode;
}

export function ListItem({
  className,
  leading,
  title,
  description,
  meta,
  trailing,
  children,
  ...props
}: ListItemProps) {
  return (
    <li
      data-slot="list-item"
      className={cn(
        "flex items-start gap-3 px-3.5 py-3",
        className,
      )}
      {...props}
    >
      {leading ? (
        <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center text-fg-muted [&_svg]:size-4">
          {leading}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-label text-fg-primary">{title}</p>
        {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
        {children}
      </div>
      {meta ? <span className="shrink-0 text-caption text-fg-muted luc-numeric">{meta}</span> : null}
      {trailing ? <span className="flex shrink-0 items-center gap-1">{trailing}</span> : null}
    </li>
  );
}

export interface ListHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** The one action this list is about — a "New run", a "View all". */
  actions?: ReactNode;
}

export function ListHeader({ className, title, description, actions, ...props }: ListHeaderProps) {
  return (
    <div
      data-slot="list-header"
      className={cn("flex flex-wrap items-start justify-between gap-2 border-b border-line-subtle px-3.5 py-3", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-label font-medium text-fg-primary">{title}</p>
        {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

export type ListFooterProps = React.ComponentPropsWithRef<"div">;

export function ListFooter({ className, ...props }: ListFooterProps) {
  return (
    <div
      data-slot="list-footer"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle px-3.5 py-2.5 text-caption text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
