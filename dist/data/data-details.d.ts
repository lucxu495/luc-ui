//#region src/data/data-details.d.ts
/**
 * "Data" — the exact rows behind a surface, one click away and out of the way.
 *
 * A canvas or a heatmap is a *reading* of a dataset: it answers a question the
 * reader came with, and the exact rows answer a different one ("what was the
 * value on that date?"). Putting the second question's answer in the vertical
 * reading flow costs every reader a full-width disclosure after every chart —
 * which is what this control replaces.
 *
 * The control is *chrome*, not content: a compact trigger that belongs in a
 * surface's header, and a panel that is bounded to the viewport instead of
 * pushing the page down. Desktop opens a right-hand panel (`Sheet`, `side
 * "right"`), mobile a bottom one — the same primitive and the same focus trap,
 * Escape handling and focus restore, chosen by the browsing context rather than
 * by a per-domain branch.
 *
 * The panel content is the caller's: LUC UI decides *where* exact data lives,
 * never *what* it is. Nothing here recomputes, sorts, dedupes or formats a
 * served value — the table passed in is rendered as given.
 */
export interface DataDetailsProps {
  /** Panel heading — name the dataset, e.g. "Rolling 30-day return". */
  title: string;
  /** One line naming what the rows are and where they came from. */
  description?: string;
  /** The exact rows, rendered by the caller (usually a table). */
  children: React.ReactNode;
  /** Trigger text. Default `Data`. */
  label?: string;
  /** Panel size on the anchored edge. Default `xl`. */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  /** Extra hook for QA selectors; rendered on the trigger wrapper. */
  slot?: string;
}
export declare function DataDetails({ title, description, children, label, size, className, slot }: DataDetailsProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=data-details.d.ts.map