import { cn } from "../utils/cn";

/**
 * LUC ReadingShelf — what someone is reading, and how far in.
 *
 * A shelf is not a list of finished things. The information a visitor wants is
 * the split: what is being read now, what is waiting, what is done — and a
 * half-finished book is the most interesting row on the page. So the component
 * groups by status rather than sorting by date, and progress is a real meter
 * (`role="progressbar"`) instead of a coloured bar with a number floating next
 * to it.
 *
 *   Digital garden    currently reading + queue + finished
 *   Author page       research sources with a page marker
 *   Learning log      courses and papers, with a status
 */

export type ReadingStatus = "reading" | "queued" | "finished" | "paused" | "abandoned";

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  status: ReadingStatus;
  /** 0–1. Only rendered for `reading` and `paused`. */
  progress?: number;
  /** Where the reader is: "p. 142 of 380", "Chapter 6". */
  progressLabel?: string;
  /** A line of the reader's own note. */
  note?: string;
  /** Year, edition, translator — anything that distinguishes the copy. */
  edition?: string;
  /** Cover art. Falls back to a typographic spine. */
  cover?: React.ReactNode;
  url?: string;
}

export interface ReadingShelfProps extends Omit<React.ComponentPropsWithRef<"div">, "children"> {
  items: readonly ReadingItem[];
  /** Which statuses to render, and in what order. */
  statuses?: readonly ReadingStatus[];
  /** Heading for each group. Override to localise. */
  statusLabels?: Partial<Record<ReadingStatus, string>>;
  /** `grid` puts covers beside each other; `list` reads like an index. */
  layout?: "list" | "grid";
  /** Accessible name for the shelf. Default "Reading shelf". */
  label?: string;
  /** Wording of the empty group. Set to `null` to hide empty groups. */
  emptyGroupText?: string | null;
}

const DEFAULT_STATUS_ORDER: readonly ReadingStatus[] = ["reading", "queued", "finished"];

const DEFAULT_STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: "Reading now",
  queued: "Up next",
  finished: "Finished",
  paused: "Paused",
  abandoned: "Set aside",
};

export function ReadingShelf({
  items,
  statuses = DEFAULT_STATUS_ORDER,
  statusLabels,
  layout = "list",
  label = "Reading shelf",
  emptyGroupText = null,
  className,
  ...props
}: ReadingShelfProps) {
  const groups = statuses
    .map((status) => ({ status, entries: items.filter((item) => item.status === status) }))
    .filter((group) => group.entries.length > 0 || emptyGroupText !== null);

  return (
    <div
      data-slot="reading-shelf"
      data-layout={layout}
      aria-label={label}
      className={cn("flex flex-col gap-8", className)}
      {...props}
    >
      {groups.map((group) => (
        <section key={group.status} aria-label={statusLabels?.[group.status] ?? DEFAULT_STATUS_LABELS[group.status]} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4 border-b border-line-subtle pb-2">
            <h3 className="text-label font-semibold text-fg-primary">
              {statusLabels?.[group.status] ?? DEFAULT_STATUS_LABELS[group.status]}
            </h3>
            <span className="text-micro text-fg-muted luc-numeric">{group.entries.length}</span>
          </div>
          {group.entries.length === 0 ? (
            <p className="text-body text-fg-muted">{emptyGroupText}</p>
          ) : (
            <ul
              className={cn(
                "grid list-none gap-4",
                layout === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1",
              )}
            >
              {group.entries.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "min-w-0",
                    layout === "grid"
                      ? "flex flex-col gap-2"
                      : "luc-rest flex flex-row items-start gap-4 rounded-sm border border-line-subtle bg-surface-raised p-3",
                  )}
                >
                  {item.cover ? (
                    <div
                      className={cn(
                        "shrink-0 overflow-hidden rounded-xs bg-surface-sunken",
                        layout === "grid" ? "aspect-[2/3] w-full" : "aspect-[2/3] w-14",
                      )}
                    >
                      {item.cover}
                    </div>
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-title font-semibold text-fg-primary text-pretty">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="luc-focus rounded-xs underline decoration-line-subtle underline-offset-4 hover:decoration-accent-default"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </p>
                    <p className="text-caption text-fg-secondary">
                      {item.author}
                      {item.edition ? (
                        <>
                          <span aria-hidden="true" className="px-1.5 text-fg-muted">
                            ·
                          </span>
                          <span className="text-fg-muted">{item.edition}</span>
                        </>
                      ) : null}
                    </p>
                    {item.progress !== undefined &&
                    (item.status === "reading" || item.status === "paused") ? (
                      <div className="flex flex-col gap-1 pt-0.5">
                        <div
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(Math.min(1, Math.max(0, item.progress)) * 100)}
                          aria-label={`${item.title} — progress`}
                          className="luc-well h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
                        >
                          <div
                            className="h-full rounded-full bg-accent-default"
                            style={{ width: `${Math.min(1, Math.max(0, item.progress)) * 100}%` }}
                          />
                        </div>
                        {item.progressLabel ? (
                          <p className="text-micro text-fg-muted luc-numeric">{item.progressLabel}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {item.note ? (
                      <p className="max-w-[62ch] text-caption text-fg-secondary text-pretty">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
