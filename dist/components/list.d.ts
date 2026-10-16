import { ReactNode } from "react";
//#region src/components/list.d.ts
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
export declare function List({ className, divided, bordered, ...props }: ListProps): import("react").JSX.Element;
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
export declare function ListItem({ className, leading, title, description, meta, trailing, children, ...props }: ListItemProps): import("react").JSX.Element;
export interface ListHeaderProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** The one action this list is about — a "New run", a "View all". */
  actions?: ReactNode;
}
export declare function ListHeader({ className, title, description, actions, ...props }: ListHeaderProps): import("react").JSX.Element;
export type ListFooterProps = React.ComponentPropsWithRef<"div">;
export declare function ListFooter({ className, ...props }: ListFooterProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=list.d.ts.map