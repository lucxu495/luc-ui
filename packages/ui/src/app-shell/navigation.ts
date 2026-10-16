/**
 * LUC navigation model.
 *
 * One typed structure feeds the sidebar, the mobile navigation and the command
 * palette, so a product never maintains three parallel lists that drift apart.
 * The model is data — icons and badges are the only React values in it — which
 * keeps `filterNavigation` and the command entries pure and testable.
 *
 * It contains no routing. An item has an `href`; whether that `href` becomes a
 * Next `Link`, a React Router `NavLink` or a plain `<a>` is the consumer's
 * decision, injected through `NavigationProvider`.
 */

import type { ReactNode } from "react";

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
export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery === "" ? "/" : withoutQuery;
}

/**
 * Is `href` the current location?
 *
 * A prefix only counts on a path *segment* boundary, so `/charts` is active on
 * `/charts/timeseries` but not on `/charts-archive`.
 */
export function isNavigationItemActive(pathname: string | null | undefined, href: string | undefined): boolean {
  if (!href) return false;
  const current = normalizePathname(pathname ?? "");
  const target = normalizePathname(href);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

/**
 * Is this item the *page the reader is on*, rather than a section containing it?
 *
 * `isNavigationItemActive` lights a section while a detail page is open, which
 * is what a sidebar map should do. `aria-current="page"` is a stronger claim:
 * exactly one navigation link may make it, so this is the exact-match test.
 */
export function isNavigationItemCurrent(
  pathname: string | null | undefined,
  href: string | undefined,
): boolean {
  if (!href) return false;
  return normalizePathname(pathname ?? "") === normalizePathname(href);
}

/**
 * The most specific active ancestor in a tree — the item a sidebar should
 * highlight when the current route is a detail page.
 */
export function findActiveNavigationItem(
  groups: readonly NavigationGroup[],
  pathname: string | null | undefined,
): NavigationItem | undefined {
  let match: NavigationItem | undefined;
  let matchLength = -1;
  for (const group of groups) {
    for (const item of group.items) {
      for (const candidate of [item, ...(item.children ?? [])]) {
        if (!isNavigationItemActive(pathname, candidate.href)) continue;
        const length = normalizePathname(candidate.href ?? "").length;
        if (length > matchLength) {
          match = candidate;
          matchLength = length;
        }
      }
    }
  }
  return match;
}

/** Flatten a tree depth-first, preserving order. */
export function flattenNavigation(groups: readonly NavigationGroup[]): NavigationItem[] {
  const out: NavigationItem[] = [];
  const visit = (items: readonly NavigationItem[]) => {
    for (const item of items) {
      out.push(item);
      if (item.children) visit(item.children);
    }
  };
  for (const group of groups) visit(group.items);
  return out;
}

/**
 * Turn the navigation model into command-palette entries.
 *
 * This is the shared-metadata rule: the palette does not keep its own copy of
 * the routes. A product adds command-only rows by passing `extras`.
 */
export function navigationCommandEntries(
  groups: readonly NavigationGroup[],
  extras: readonly NavigationItem[] = [],
): NavigationCommandEntry[] {
  const entries: NavigationCommandEntry[] = [];
  for (const group of groups) {
    for (const item of flattenNavigation([{ id: group.id, label: group.label, items: group.items }])) {
      /*
       * Only items with a destination become entries. That keeps three things
       * out of the palette: a parent whose only job is to disclose its children,
       * an inert item, and a command-only action (those are passed in as
       * `extras` by the caller that owns the action).
       */
      if (!item.href) continue;
      entries.push(toEntry(item, group.label));
    }
  }
  for (const item of extras) entries.push(toEntry(item));
  return entries;
}

function toEntry(item: NavigationItem, groupLabel?: string): NavigationCommandEntry {
  return {
    id: item.id,
    label: item.label,
    href: item.href,
    description: item.description,
    groupLabel,
    action: item.action,
    disabled: item.disabled,
    haystack: [item.label, item.description, groupLabel, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

/**
 * Case-insensitive filter across a navigation tree.
 *
 * A parent survives when any of its children match, so a search for a nested
 * page never hides the path to it.
 */
export function filterNavigation(
  groups: readonly NavigationGroup[],
  query: string,
): NavigationGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups as NavigationGroup[];
  const matches = (item: NavigationItem) =>
    [item.label, item.description, ...(item.keywords ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);

  return groups
    .map((group) => {
      const items: NavigationItem[] = [];
      for (const item of group.items) {
        const children = item.children?.filter(matches);
        if (matches(item) || (children && children.length > 0)) {
          items.push({ ...item, children: children && children.length > 0 ? children : undefined });
        }
      }
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);
}
