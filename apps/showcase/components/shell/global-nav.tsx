"use client";

/*
 * The global header navigation.
 *
 * What was wrong before this file existed: the Showcase had *no* primary
 * navigation. Ten top-level groups lived only inside the sidebar, so "what else
 * is in here" was answered by scrolling a list of four hundred rows, and the
 * answer depended on where you happened to be.
 *
 * What this is: one entry per area (`lib/discovery/areas.ts`), each opening a
 * panel that lists the area's own navigation groups — families for Components,
 * chart families for Charts, categories for Visuals — plus a way into the area's
 * landing page. It is the same navigation model the sidebar reads, filtered by
 * the same declaration, so the two cannot disagree.
 *
 * Accessibility is explicit rather than implied:
 *
 *   - the label is a real `<Link>` (it navigates) and the disclose control is a
 *     separate `<button aria-expanded aria-controls>` with an accessible name, so
 *     "go to Charts" and "show me what is in Charts" are two different actions;
 *   - Escape closes the open panel and returns focus to its button;
 *   - focus leaving the header closes it, which is what a keyboard user expects
 *     from a disclosure that is not a modal;
 *   - a route change closes it, so a panel never outlives the page it described;
 *   - the panel is a list of ordinary links, not a `role="menu"`, because these
 *     are navigation targets rather than commands.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavigationGroup } from "@luc/ui/app-shell";
import { Kbd, cn } from "@luc/ui";
import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react";
import {
  PRIMARY_AREAS,
  SECONDARY_AREAS,
  areaForRoute,
  nestedAreasOf,
  type NavArea,
} from "@/lib/discovery/areas";
import { useI18n } from "@/lib/i18n/provider";

export interface GlobalNavProps {
  /** The route, already stripped of its locale prefix. */
  pathname: string;
  /** The same localised groups the sidebar renders. */
  groups: NavigationGroup[];
  onOpenSearch: () => void;
}

/** The synthetic area id for the secondary tier's single disclosure. */
const MORE_ID = "more";

/** How many entries a panel shows before it points at the landing page. */
const PANEL_ITEM_LIMIT = 9;

interface PanelLink {
  label: string;
  href: string;
  /** The count badge: children for a family, entries for a flat group. */
  count?: number;
}

interface PanelSection {
  label: string;
  links: PanelLink[];
  /** Shown when the panel truncated a group. */
  more?: { href: string; hidden: number };
}

export function GlobalNav({ pathname, groups, onOpenSearch }: GlobalNavProps) {
  const { t, tn, href } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const currentArea = areaForRoute(pathname);
  const panelIdPrefix = useId();

  /*
   * The open panel, and the route it was opened on.
   *
   * A route change closes the panel — it described the previous page — and that is
   * done by comparing during render rather than by an effect, because "reset state
   * when an input changes" is state *derivation*, and an effect that calls
   * `setState` on every navigation costs a cascading render for a reason React
   * already has a mechanism for.
   */
  const [panel, setPanel] = useState<{ area: string | null; route: string }>({
    area: null,
    route: pathname,
  });
  if (panel.route !== pathname) setPanel({ area: null, route: pathname });
  const openArea = panel.area;
  const openPanel = openArea ? PRIMARY_AREAS.find((entry) => entry.id === openArea) : undefined;
  const panelId = `${panelIdPrefix}-panel`;
  /* Stable across renders, so the Escape/pointer subscription is not torn down and
   * rebuilt every time React re-renders the header. */
  const setOpenArea = useCallback(
    (next: string | null) => setPanel({ area: next, route: pathname }),
    [pathname],
  );

  useEffect(() => {
    if (!openArea) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenArea(null);
      triggerRefs.current.get(openArea)?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpenArea(null);
    };
    /*
     * `pointerdown` rather than `click`, so the panel is gone before a click
     * lands on whatever is underneath it. Closing on blur is handled by
     * `onBlurCapture` below, which also covers the keyboard path.
     */
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openArea, setOpenArea]);

  const sectionsFor = (area: NavArea): PanelSection[] => {
    const byId = new Map(groups.map((group) => [group.id, group]));
    return area.sidebar.flatMap((id) => {
      const group = byId.get(id);
      if (!group) return [];
      const links: PanelLink[] = [];
      for (const item of group.items) {
        const target = item.href ?? item.children?.find((child) => child.href)?.href;
        if (!target) continue;
        links.push({
          label: item.label,
          href: target,
          ...(item.children?.length ? { count: item.children.length } : {}),
        });
      }
      const shown = links.slice(0, PANEL_ITEM_LIMIT);
      const hidden = links.length - shown.length;
      return [
        {
          /* A group's label is optional in the shell's type (a group can be a
           * bare container); the panel always needs one, and the area's own
           * label is the honest fallback. */
          label: group.label ?? area.label,
          links: shown,
          ...(hidden > 0 ? { more: { href: area.href, hidden } } : {}),
        },
      ];
    });
  };

  return (
    <div
      ref={containerRef}
      className="hidden min-w-0 items-center gap-0.5 lg:flex"
      onBlurCapture={(event) => {
        if (!openArea) return;
        const next = event.relatedTarget as Node | null;
        if (next && containerRef.current?.contains(next)) return;
        setOpenArea(null);
      }}
    >
      {/*
        * The panel is a child of the *nav*, not of the trigger.
        *
        * Anchoring it to the individual trigger looked fine for the first few
        * areas and pushed the last ones off the right edge of a 1440px window —
        * measured, not guessed: the Docs panel opened at x=909 with a 736px width.
        * One panel positioned against a stable left edge cannot do that, and it
        * removes a per-area special case at the same time.
        */}
      <nav
        aria-label={t("shell.primaryNav")}
          /* A stable hook for the header probe: the label is translated, the
           * attribute is not (`qa/navigation.mjs`). */
          data-testid="primary-nav"
        className="relative flex min-w-0 items-center gap-0.5"
      >
        {PRIMARY_AREAS.map((area) => {
          const isCurrent = area.id === currentArea.id;
          const isOpen = openArea === area.id;
          return (
            <div key={area.id}>
              <div className="flex items-center">
                <Link
                  href={href(area.href)}
                  aria-current={isCurrent ? "true" : undefined}
                  className={cn(
                    "luc-transition luc-focus rounded-sm px-2.5 py-1.5 text-label",
                    isCurrent
                      ? "bg-surface-selected text-fg-primary"
                      : "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
                  )}
                >
                  {tn(area.label)}
                </Link>
                <button
                  type="button"
                  ref={(node) => {
                    if (node) triggerRefs.current.set(area.id, node);
                    else triggerRefs.current.delete(area.id);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={t("shell.openArea", { area: tn(area.label) })}
                  onClick={() => setOpenArea(isOpen ? null : area.id)}
                  className={cn(
                    "luc-transition luc-focus -ml-1 grid size-6 place-items-center rounded-sm",
                    /*
                     * IA-005. Four primaries plus five disclosure chevrons do
                     * not fit at 1024–1279px next to the header's own controls,
                     * and clipping the fourth one is worse than not offering its
                     * panel: at that width the sidebar already lists the current
                     * area and the More menu lists the rest, so the panel is a
                     * convenience there and a duplicate. From 1280px up the row
                     * has the room and every entry can be opened.
                     */
                    "hidden xl:grid",
                    isOpen ? "text-fg-primary" : "text-fg-muted hover:text-fg-secondary",
                  )}
                >
                  <RiArrowDownSLine
                    aria-hidden="true"
                    className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                  />
                </button>
              </div>
            </div>
          );
        })}

        <div>
          <button
            type="button"
            ref={(node) => {
              if (node) triggerRefs.current.set(MORE_ID, node);
              else triggerRefs.current.delete(MORE_ID);
            }}
            aria-expanded={openArea === MORE_ID}
            aria-controls={panelId}
            aria-label={t("shell.openArea", { area: t("shell.more") })}
            onClick={() => setOpenArea(openArea === MORE_ID ? null : MORE_ID)}
            className={cn(
              "luc-transition luc-focus rounded-sm px-2.5 py-1.5 text-label",
              openArea === MORE_ID ? "bg-surface-selected text-fg-primary" : "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
            )}
          >
            {t("shell.more")}
          </button>
        </div>

        {openArea === MORE_ID ? (
          <div
            id={panelId}
            className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[min(46rem,calc(100vw-4rem))] rounded-xl border border-line-default bg-surface-overlay p-4 shadow-overlay"
          >
            <p className="mb-3 max-w-[62ch] text-caption text-fg-muted">{t("shell.morePanel")}</p>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {/*
                * A secondary area that owns subareas is listed as its family, not
                * as a link to whichever subarea happens to hold its landing.
                *
                * Build is the case (IA-007): it is a real identity with no page of
                * its own, so a single "Build → /blocks" row would tell a reader
                * that Build is Blocks. The four subareas are the destinations, and
                * listing them here is what keeps this panel and the sidebar saying
                * the same thing about the same four routes.
                */}
              {SECONDARY_AREAS.map((area) => {
                const children = nestedAreasOf(area.id);
                if (children.length > 1) {
                  return (
                    <li key={area.id} className="flex flex-col gap-1">
                      <span className="text-caption font-semibold text-fg-primary">{tn(area.label)}</span>
                      <span className="text-micro text-fg-muted text-pretty">
                        {tn(area.description)}
                      </span>
                      <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={href(child.href)}
                              className="luc-transition luc-focus rounded-sm text-caption text-fg-accent hover:underline"
                            >
                              {tn(child.label)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={area.id} className="flex flex-col gap-0.5">
                    <Link href={href(area.href)} className="luc-transition luc-focus rounded-sm text-caption text-fg-primary hover:text-fg-accent">
                      {tn(area.label)}
                    </Link>
                    <span className="text-micro text-fg-muted text-pretty">{tn(area.description)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {openPanel ? (
          <div
            id={panelId}
            className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[min(46rem,calc(100vw-4rem))] rounded-xl border border-line-default bg-surface-overlay p-4 shadow-overlay"
          >
            <p className="mb-3 max-w-[62ch] text-caption text-fg-muted">
              {tn(openPanel.description)}
            </p>
            <div className="grid max-h-[24rem] gap-x-6 gap-y-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {sectionsFor(openPanel).map((section) => (
                <div key={section.label} className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-micro text-fg-muted uppercase">{section.label}</p>
                  <ul className="flex flex-col gap-0.5">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={href(link.href)}
                          className="luc-transition luc-focus flex items-baseline justify-between gap-2 rounded-sm px-1.5 py-1 text-caption text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary"
                        >
                          <span className="min-w-0">{link.label}</span>
                          {link.count === undefined ? null : (
                            <span className="shrink-0 font-mono text-micro text-fg-muted luc-numeric">
                              {link.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {section.more ? (
                    <Link
                      href={href(section.more.href)}
                      className="luc-focus rounded-sm px-1.5 text-caption text-fg-accent underline"
                    >
                      {t("shell.andMore", { count: section.more.hidden })}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {/*
        * The search trigger sits inside the primary navigation because it *is* a
        * way of navigating — and because the header is where a developer looks
        * for it. `⌘K` still opens the same palette.
        */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="luc-transition luc-focus ml-1 hidden h-control-sm items-center gap-2 rounded-sm border border-line-default bg-surface-sunken px-2.5 text-caption text-fg-muted hover:border-line-strong hover:text-fg-secondary lg:inline-flex"
      >
        <RiSearchLine aria-hidden="true" className="size-3.5" />
        {t("shell.search")}
        <Kbd className="ml-1.5">⌘K</Kbd>
      </button>
    </div>
  );
}
