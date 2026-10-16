"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiListUnordered } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { IconButton } from "../components/icon-button";

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

/** A plain left click on a link we may intercept; anything else is the browser's. */
function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function OutlineDrawer({
  label,
  groups,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  expandedGroupId,
  pendingGroupId = null,
  activeItemId = null,
  activeSectionId = null,
  anchorHref = (id) => `#${id}`,
  onSelectGroup,
  onSelectItem,
  collapsible = true,
  footer,
  className,
}: OutlineDrawerProps) {
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // The expanded list is a bounded, internally scrollable region (a nine-domain
  // report with its active domain's metrics can exceed the viewport). When the
  // active anchor changes — because the reader scrolled the page, not because
  // they clicked — keep that item visible *inside the outline*, never by
  // scrolling the document.
  const listRef = useRef<HTMLUListElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open || !activeItemId) return;
    // Defer a frame: the active item can change in the same commit that expands
    // its group or swaps a streamed section, and the geometry is only final after
    // that layout settles.
    const frame = requestAnimationFrame(() => {
      const container = listRef.current;
      const target = container?.querySelector<HTMLElement>(
        `[data-outline-target-id="${CSS.escape(activeItemId)}"]`,
      );
      if (!container || !target) return;
      const bounds = container.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      let delta = 0;
      if (item.top < bounds.top) delta = item.top - bounds.top;
      else if (item.bottom > bounds.bottom) delta = item.bottom - bounds.bottom;
      if (delta === 0) return;
      // Adjust scrollTop directly on the outline's own scroller; `scrollIntoView`
      // would walk ancestor scroll containers and move the page.
      container.scrollTo({
        top: container.scrollTop + delta,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeItemId, open, reducedMotion]);

  const hasAnchors = (group: OutlineNavGroup): boolean =>
    (group.items?.length ?? 0) > 0 || (group.sections?.length ?? 0) > 0;
  const expanded = pendingGroupId ?? expandedGroupId ?? groups.find(hasAnchors)?.id ?? groups[0]?.id ?? null;

  if (groups.length === 0) return null;

  if (!open) {
    return (
      <nav
        data-slot="outline-drawer"
        data-state="collapsed"
        aria-label={label}
        className={cn(
          "sticky top-[calc(var(--shell-topbar-height,4rem)+1.5rem)] flex w-10 shrink-0 flex-col items-center gap-1",
          className,
        )}
      >
        {collapsible ? (
          <IconButton
            label={label}
            size="sm"
            variant="ghost"
            icon={open ? <RiArrowRightSLine /> : <RiListUnordered />}
            onClick={() => setOpen(true)}
          />
        ) : null}
        <ul className="flex flex-col items-center gap-0.5">
          {groups.map((group) => {
            const current = group.id === expanded;
            return (
              <li key={group.id}>
                <a
                  href={group.href ?? anchorHref(group.id)}
                  aria-current={current ? "true" : undefined}
                  data-active={current ? "true" : undefined}
                  onClick={(event) => {
                    setOpen(true);
                    if (!group.href) return;
                    if (!isPlainLeftClick(event)) return;
                    // A caller that handles the navigation itself must stop the
                    // browser from also following the href — otherwise the
                    // router push and a full document load both run.
                    if (onSelectGroup?.(group) === false) event.preventDefault();
                  }}
                  className={cn(
                    "luc-focus luc-numeric flex size-7 items-center justify-center rounded-sm text-micro transition-colors",
                    current ? "bg-surface-sunken text-fg-primary" : "text-fg-muted hover:text-fg-secondary",
                  )}
                >
                  {group.index ?? group.label.slice(0, 2)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      data-slot="outline-drawer"
      data-state="expanded"
      aria-label={label}
      className={cn(
        "sticky top-[calc(var(--shell-topbar-height,4rem)+1.5rem)] flex w-60 shrink-0 flex-col",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-micro font-medium uppercase tracking-wide text-fg-muted">{label}</p>
        {collapsible ? (
          <IconButton
            label={label}
            size="sm"
            variant="ghost"
            icon={<RiArrowRightSLine />}
            onClick={() => setOpen(false)}
          />
        ) : null}
      </div>
      <ul
        ref={listRef}
        className="flex max-h-[calc(100dvh-var(--shell-topbar-height,4rem)-6rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1"
        data-slot="outline-drawer-groups"
      >
        {groups.map((group) => {
          const isExpanded = group.id === expanded;
          const isPending = group.id === pendingGroupId;
          const items = group.items ?? [];
          const sections = group.sections ?? [];
          const hasItems = items.length > 0 || sections.length > 0;
          return (
            <li key={group.id} data-group-id={group.id}>
              <div className="flex items-stretch">
                <a
                  href={group.href ?? anchorHref(group.id)}
                  {...(hasItems ? { "aria-expanded": isExpanded } : {})}
                  aria-current={isExpanded ? "page" : undefined}
                  data-active={isExpanded ? "true" : undefined}
                  data-pending={isPending ? "true" : undefined}
                  onClick={(event) => {
                    if (!isPlainLeftClick(event)) return;
                    // A group with items but no href is a jump to its own
                    // anchor; a group with an href is a route change the caller
                    // may intercept.
                    if (hasItems && !group.href) {
                      event.preventDefault();
                      setOpen(true);
                      onSelectItem?.(group.id);
                      return;
                    }
                    setOpen(true);
                    if (group.href && onSelectGroup?.(group) === false) event.preventDefault();
                  }}
                  className={cn(
                    "luc-focus flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 pl-2 pr-1 text-caption transition-colors",
                    isExpanded
                      ? "text-fg-primary"
                      : "text-fg-secondary hover:bg-surface-sunken hover:text-fg-primary",
                  )}
                >
                  {group.index ? (
                    <span aria-hidden="true" className="luc-numeric w-4 shrink-0 text-micro text-fg-muted">
                      {group.index}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <RiArrowRightSLine
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none",
                      isExpanded && "rotate-90",
                    )}
                  />
                </a>
              </div>
                  {isExpanded && items.length > 0 ? (
                <ul className="ml-4 flex flex-col gap-px border-l border-line-subtle" data-slot="outline-drawer-items">
                  {items.map((item) => {
                    const current = item.id === activeItemId;
                    return (
                      <li key={item.id}>
                        <a
                          href={anchorHref(item.id)}
                          data-outline-target-id={item.id}
                          aria-current={current ? "true" : undefined}
                          data-active={current ? "true" : undefined}
                          onClick={(event) => {
                            if (!isPlainLeftClick(event)) return;
                            // A caller that handles the jump itself (so it can
                            // scroll to the anchor with the right offset and
                            // flash it *on arrival*) returns `false`; the href is
                            // only the no-JS fallback then.
                            if (onSelectItem?.(item.id) === false) event.preventDefault();
                          }}
                          className={cn(
                            "luc-focus -ml-px block border-l-2 py-1 pl-3 pr-2 text-caption transition-colors",
                            current
                              ? "border-accent-default bg-surface-selected font-medium text-accent-strong"
                              : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg-secondary",
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {isExpanded && sections.length > 0 ? (
                <div className="ml-4 border-l border-line-subtle" data-slot="outline-drawer-sections">
                  {sections.map((section) => (
                    <div key={section.id} data-outline-section-id={section.id}>
                      <a
                        href={anchorHref(section.id)}
                        data-outline-target-id={section.id}
                        aria-current={
                          section.id === activeItemId || section.id === activeSectionId ? "true" : undefined
                        }
                        data-active={
                          section.id === activeItemId || section.id === activeSectionId ? "true" : undefined
                        }
                        onClick={(event) => {
                          if (!isPlainLeftClick(event)) return;
                          if (onSelectItem?.(section.id) === false) event.preventDefault();
                        }}
                        className={cn(
                          "luc-focus -ml-px block border-l-2 py-1 pl-3 pr-2 text-caption font-medium transition-colors",
                          section.id === activeItemId || section.id === activeSectionId
                            ? "border-accent-default bg-surface-selected/60 text-accent-strong"
                            : "border-transparent text-fg-secondary hover:border-line-strong hover:text-fg-primary",
                        )}
                      >
                        {section.label}
                      </a>
                      {(section.items?.length ?? 0) > 0 ? (
                        <ul className="ml-3 flex flex-col gap-px border-l border-line-subtle">
                          {section.items!.map((item) => {
                            const current = item.id === activeItemId;
                            return (
                              <li key={item.id}>
                                <a
                                  href={anchorHref(item.id)}
                                  data-outline-target-id={item.id}
                                  aria-current={current ? "true" : undefined}
                                  data-active={current ? "true" : undefined}
                                  onClick={(event) => {
                                    if (!isPlainLeftClick(event)) return;
                                    if (onSelectItem?.(item.id) === false) event.preventDefault();
                                  }}
                                  className={cn(
                                    "luc-focus -ml-px block border-l-2 py-0.5 pl-3 pr-2 text-micro transition-colors",
                                    current
                                      ? "border-accent-default bg-surface-selected font-medium text-accent-strong"
                                      : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg-secondary",
                                  )}
                                >
                                  {item.label}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {footer ? <div className="mt-3 border-t border-line-subtle pt-3">{footer}</div> : null}
    </nav>
  );
}

/** Collapse/expand control a header can host when the drawer starts collapsed. */
export function OutlineDrawerToggle({
  open,
  onOpenChange,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
}) {
  return (
    <IconButton
      label={label}
      size="sm"
      variant="ghost"
      icon={open ? <RiArrowRightSLine /> : <RiArrowLeftSLine />}
      onClick={() => onOpenChange(!open)}
    />
  );
}
