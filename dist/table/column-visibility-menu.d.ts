//#region src/table/column-visibility-menu.d.ts
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
export declare function ColumnVisibilityMenu({ label, className }: ColumnVisibilityMenuProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=column-visibility-menu.d.ts.map