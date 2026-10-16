//#region src/experiences/reading-shelf.d.ts
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
export declare function ReadingShelf({ items, statuses, statusLabels, layout, label, emptyGroupText, className, ...props }: ReadingShelfProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=reading-shelf.d.ts.map