import { ReactNode } from "react";
//#region src/table/data-table-toolbar.d.ts
/**
 * The table toolbar. A layout with two bound conveniences — global search and
 * the selection summary — plus free slots, so a product composes filters and
 * actions instead of the table guessing what a screen needs.
 */
export interface DataTableToolbarProps {
  className?: string;
  /** Left-of-search controls (facets, view switches). */
  children?: ReactNode;
  /** Bound global search field. `true` uses the defaults. */
  search?: boolean | {
    placeholder?: string;
    label?: string;
    className?: string;
  };
  /** Right-aligned controls: column visibility, export, density, actions. */
  actions?: ReactNode;
}
export declare function DataTableToolbar({ className, children, search, actions }: DataTableToolbarProps): import("react").JSX.Element;
export interface DataTableSelectionCountProps {
  className?: string;
  /** Noun for the selected rows. Default `"selected"`. */
  label?: string;
}
/** Live count plus a clear action. Renders nothing when the selection is empty. */
export declare function DataTableSelectionCount({ className, label }: DataTableSelectionCountProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=data-table-toolbar.d.ts.map