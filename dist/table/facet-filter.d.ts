//#region src/table/facet-filter.d.ts
/**
 * Faceted multi-select filter for one column.
 *
 * The semantics are honest: this is a group of checkboxes inside a popover, not
 * a listbox pretending to be multi-selectable (ARIA has no multi-select listbox
 * that reports counts the way a facet filter needs to). Search narrows the
 * visible options; it does not change the filter.
 *
 * The column must be `filterable: true` with `filterFn: "arrHas"` — the built-in
 * that keeps rows whose *scalar* value equals one of the selected values.
 * (`arrIncludesSome` is for columns whose cell value is itself an array.)
 */
export interface FacetFilterProps {
  /** Column id to filter. */
  columnId: string;
  /** Button label, e.g. "Status". */
  label: string;
  /** Render a raw facet value. Defaults to the value itself. */
  formatValue?: (value: string) => string;
  /** Hide options that would return zero rows. Default `true`. */
  hideEmpty?: boolean;
  /** Show the option search field. Default `true` from 8 options upward. */
  searchable?: boolean;
  className?: string;
}
export declare function FacetFilter({ columnId, label, formatValue, hideEmpty, searchable, className }: FacetFilterProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=facet-filter.d.ts.map