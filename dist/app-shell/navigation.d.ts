import { ReactNode } from "react";
//#region src/app-shell/navigation.d.ts
export interface NavigationItem {
  /** Stable identity: used for React keys, persistence and command ids. */
  id: string;
  label: string;
  href?: string;
  /** Decorative marker for the item. The label carries the accessible name. */
  icon?: ReactNode;
  /** Trailing count or status chip. */
  badge?: ReactNode;
  /** Second line, used by the command palette and long-form nav. */
  description?: string;
  disabled?: boolean;
  /**
   * One nested level. A third is a signal to use a different navigation
   * pattern — a tree, a settings page, or a search.
   */
  children?: NavigationItem[];
  /** Command-only action, e.g. "Copy view link". Never rendered in the sidebar. */
  action?: () => void;
  /** Extra words the command palette should match but the menu never shows. */
  keywords?: string[];
}
export interface NavigationGroup {
  id: string;
  /** Section heading. Omit for an ungrouped run of items. */
  label?: string;
  items: NavigationItem[];
}
export interface NavigationCommandEntry {
  id: string;
  label: string;
  href?: string;
  description?: string;
  groupLabel?: string;
  action?: () => void;
  disabled?: boolean;
  /** Matching haystack, already lower-cased. */
  haystack: string;
}
/** Normalise a pathname so `/research/` and `/research` compare equal. */
export declare function normalizePathname(pathname: string): string;
/**
 * Is `href` the current location?
 *
 * A prefix only counts on a path *segment* boundary, so `/charts` is active on
 * `/charts/timeseries` but not on `/charts-archive`.
 */
export declare function isNavigationItemActive(pathname: string | null | undefined, href: string | undefined): boolean;
/**
 * The most specific active ancestor in a tree — the item a sidebar should
 * highlight when the current route is a detail page.
 */
export declare function findActiveNavigationItem(groups: readonly NavigationGroup[], pathname: string | null | undefined): NavigationItem | undefined;
/** Flatten a tree depth-first, preserving order. */
export declare function flattenNavigation(groups: readonly NavigationGroup[]): NavigationItem[];
/**
 * Turn the navigation model into command-palette entries.
 *
 * This is the shared-metadata rule: the palette does not keep its own copy of
 * the routes. A product adds command-only rows by passing `extras`.
 */
export declare function navigationCommandEntries(groups: readonly NavigationGroup[], extras?: readonly NavigationItem[]): NavigationCommandEntry[];
/**
 * Case-insensitive filter across a navigation tree.
 *
 * A parent survives when any of its children match, so a search for a nested
 * page never hides the path to it.
 */
export declare function filterNavigation(groups: readonly NavigationGroup[], query: string): NavigationGroup[];
//#endregion
//# sourceMappingURL=navigation.d.ts.map