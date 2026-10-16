import { ReactNode } from "react";
//#region src/workspace/outline-drawer.d.ts
/**
 * A collapsible, right-edge navigation outline.
 *
 * It is **navigation**, not an inspector: a report's table of contents with one
 * level of grouping — a group navigates somewhere (a domain, a chapter), and its
 * items jump down the page to an anchor. Exactly one group is expanded, the
 * group the reader is in, so a nine-domain report stays a short list instead of
 * a wall of links.
 *
 * Three states matter and none of them is a card:
 *
 *  - **collapsed** — a hairline rail of group ordinals, so the page keeps its
 *    full width and the navigator is still one click away;
 *  - **expanded** — groups with their items, the active item marked;
 *  - **mobile** — the caller wraps the same tree in a sheet (see the Showcase);
 *    the drawer itself never assumes it is on the right of a wide screen.
 *
 * It is presentation only: the caller owns the ids, the scrollspy and what a
 * click to a group means. This component never fetches and never measures.
 */
export interface OutlineNavItem {
  /** Stable anchor id. The label is localized; the id never is. */
  id: string;
  label: string;
}
/** One sub-group of a group: a report section and the anchors inside it. */
export interface OutlineNavSection {
  id: string;
  label: string;
  items?: readonly OutlineNavItem[];
}
export interface OutlineNavGroup {
  id: string;
  label: string;
  /** A leading ordinal (`"01"`), rendered muted before the label. */
  index?: string;
  /** Where the group itself goes. Omitted for a non-navigating group. */
  href?: string;
  /** A flat list of anchors, shown when the group is expanded. */
  items?: readonly OutlineNavItem[];
  /**
   * A second level — a domain's report sections, each with its own anchors.
   * Use this *or* `items`, not both.
   */
  sections?: readonly OutlineNavSection[];
}
export interface OutlineDrawerProps {
  /** Accessible name of the whole navigator (e.g. "Contents"). */
  label: string;
  /** The groups, in document order. */
  groups: readonly OutlineNavGroup[];
  /** Controlled open (expanded) state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The group shown expanded. Defaults to the first group with items. */
  expandedGroupId?: string | null;
  /**
   * The group the reader just picked, before its page has loaded.
   *
   * A domain switch is a server navigation; the navigator highlights the pick
   * optimistically (`aria-current` + `data-pending`) so the click is
   * acknowledged instantly instead of looking frozen.
   */
  pendingGroupId?: string | null;
  /** The active item id (usually from `useScrollSpy`). */
  activeItemId?: string | null;
  /**
   * The section the active item belongs to, when the caller tracks both levels.
   *
   * The reading position is a *chart*; its section is the context around it. So
   * a report outline marks the leaf (the card the reader is on) and, separately,
   * the section that contains it — instead of one id doing duty for both.
   */
  activeSectionId?: string | null;
  /** Anchor id → href. Defaults to `#<id>`. */
  anchorHref?: (id: string) => string;
  /** A group click; return `false` to let the browser follow the link. */
  onSelectGroup?: (group: OutlineNavGroup) => boolean | undefined;
  /**
   * An item click, e.g. to lock the scrollspy before the jump lands.
   *
   * Return `false` to take the jump over (the caller scrolls with the right
   * offset and acknowledges the landing); anything else lets the browser follow
   * the href.
   */
  onSelectItem?: (id: string) => boolean | void;
  /** Whether the drawer can collapse. Default true. */
  collapsible?: boolean;
  /** Extra content under the groups (a footer action row). */
  footer?: ReactNode;
  className?: string;
}
export declare function OutlineDrawer({ label, groups, open: openProp, defaultOpen, onOpenChange, expandedGroupId, pendingGroupId, activeItemId, activeSectionId, anchorHref, onSelectGroup, onSelectItem, collapsible, footer, className }: OutlineDrawerProps): import("react").JSX.Element | null;
/** Collapse/expand control a header can host when the drawer starts collapsed. */
export declare function OutlineDrawerToggle({ open, onOpenChange, label }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
}): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=outline-drawer.d.ts.map