/*
 * The generic table used by the documentation pages.
 *
 * Deliberately **not** a client component: a page hands it `render` functions,
 * and a function cannot cross the server/client boundary. The locale-aware
 * tables (`PropsTable`, `TokenTable`) live in `tables.tsx`, which is a client
 * module, and take only serialisable rows.
 *
 * `caption` therefore arrives already translated — the wrapper looks it up —
 * and the English default below is the library-level fallback for a page that
 * renders a raw `DataTable` with no caption at all.
 */

import { cn } from "@luc/ui";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  caption?: string;
  className?: string;
}) {
  return (
    /*
     * A horizontally scrollable region must be reachable from the keyboard, or
     * the columns past the fold are mouse-only. `role="region"` with a name
     * turns a generic scroll box into something a screen reader announces, and
     * `tabIndex={0}` makes it part of the tab order.
     */
    <div
      role="region"
      aria-label={caption ?? "Table"}
      tabIndex={0}
      className={cn("luc-table-scroll overflow-x-auto rounded-lg border border-line-subtle", className)}
    >
      <table className="w-full border-collapse text-left text-caption">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line-subtle bg-surface-sunken">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-3 py-2 text-micro font-medium text-fg-muted uppercase", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-line-subtle last:border-b-0 hover:bg-surface-interactive-hover"
            >
              {columns.map((column) => (
                <td key={column.key} className={cn("px-3 py-2 align-top text-fg-secondary", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
