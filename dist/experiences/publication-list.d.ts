//#region src/experiences/publication-list.d.ts
/**
 * LUC PublicationList — a bibliography you can narrow.
 *
 * An academic page has one job a CV does not: a visitor arrives looking for the
 * work on one topic, in one year, of one kind, and the page has to let them get
 * there without scrolling forty entries. So filtering is built in and derived
 * from the data — the type and topic facets are the values actually present, not
 * a list the author has to keep in sync.
 *
 * Two rules are deliberate. Nothing is invented: an entry without a DOI prints
 * no DOI, and the component never guesses a citation count. And nothing is sorted
 * behind the caller's back — entries render in the order given, because a
 * bibliography's order is a claim.
 *
 *   Faculty page      publications, filtered by year and type
 *   Lab site          the same list, grouped by year
 *   Research log      preprints and talks in one filterable stream
 */
export type PublicationKind = string;
export interface Publication {
  id: string;
  title: string;
  /** Author line, in the order the venue prints it. */
  authors: string;
  /** Journal, conference, preprint server or publisher. */
  venue: string;
  year: number;
  /** "Journal article", "Conference paper", "Preprint", "Talk". */
  kind?: PublicationKind;
  topics?: readonly string[];
  /** Digital object identifier, without the URL. Rendered as a link when present. */
  doi?: string;
  url?: string;
  /** Where the entry was cited — shown only when the caller supplies it. */
  citations?: number;
  /** Free-form note: award, equal contribution, under review. */
  note?: string;
}
export interface PublicationListProps extends Omit<React.ComponentPropsWithRef<"div">, "defaultValue"> {
  publications: readonly Publication[];
  value?: {
    year?: number | "all";
    kind?: string | "all";
    topic?: string | "all";
  };
  defaultValue?: {
    year?: number | "all";
    kind?: string | "all";
    topic?: string | "all";
  };
  onValueChange?: (next: {
    year?: number | "all";
    kind?: string | "all";
    topic?: string | "all";
  }) => void;
  /** Hide the facet bar and render everything. */
  filters?: boolean;
  /** Accessible name for the filter group. Default "Filter publications". */
  filterLabel?: string;
  /** Wording for the empty result. */
  emptyText?: string;
  /** Heading level of each entry's title. Default 3. */
  headingLevel?: 3 | 4;
}
export declare function PublicationList({ publications, value, defaultValue, onValueChange, filters, filterLabel, emptyText, headingLevel, className, ...props }: PublicationListProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=publication-list.d.ts.map