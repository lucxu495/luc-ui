"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  AppShellMobileTrigger,
  AppShellStatusBar,
  AppShellTopbar,
  Badge,
  Kbd,
  SearchInput,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarToggle,
  Text,
  Toaster,
  cn,
  filterNavigation,
  isNavigationItemActive,
  useCommandHotkey,
  useTheme,
  type NavigationGroup,
  type NavigationItem,
} from "@luc/ui";
import { RiSearchLine } from "@remixicon/react";
import { findNavItem, localizeNavGroups, navGroups, sidebarForArea } from "@/lib/navigation";
import { NAV_AREAS, areaById, areaForRoute, nestedAreasOf } from "@/lib/discovery/areas";
import { discoveryStats } from "@/lib/discovery/catalog";
import { useAppearance } from "@/lib/use-appearance";
import { stripLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { AppearanceControl } from "./appearance-control";
import { CommandPalette } from "./command-palette";
import { SearchProvider } from "./search-context";
import { GlobalNav } from "./global-nav";
import { LanguageControl } from "./language-control";
import { MotionControl } from "./motion-control";
import { ThemeControl } from "./theme-control";

/**
 * The Showcase's own frame.
 *
 * It is built from `@luc/ui`'s AppShell rather than from page-local CSS, which is
 * the point of V0.5: the system's own product uses the system. Everything
 * Next-specific lives here — the router adapter, the pathname, the command
 * palette — because `@luc/ui` never imports a router.
 *
 * Phase 10A splits navigation into the two jobs it had been doing at once:
 *
 *   **the header** answers "where else can I go" — one entry per area
 *   (`lib/discovery/areas.ts`), each with a panel listing that area's own
 *   families;
 *
 *   **the sidebar** answers "where am I", and renders only the groups the current
 *   area declares. Before this, `/charts/line-chart` and `/components/buttons`
 *   showed the identical ten groups, so the sidebar was a directory of the
 *   repository rather than a map of the page you were on.
 *
 * The ⌘K palette still reads the *whole* tree: searching is explicitly a global
 * act, and a search that only found things in the section you were already in
 * would be a poor search.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  /*
   * The router may hand back either the browser path (`/zh/components`) or the
   * rewritten one (`/components`); `stripLocale` normalises both, so active
   * state, the header and the command palette agree in every locale.
   */
  const pathname = stripLocale(usePathname() ?? "/").route;
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const current = findNavItem(pathname);
  const area = areaForRoute(pathname);
  const { resolvedTheme } = useTheme();
  const { palette, typeface, personality } = useAppearance();
  const { t, tn, tcs, href } = useI18n();
  /*
   * The front door is a landing page, not a documentation page.
   *
   * NAV-002: it used to carry the same sidebar column as every other route — the
   * way in, plus a twelve-row site map that repeated the header. That made `/`
   * look like a section of the docs and put a 256px directory beside a page whose
   * whole argument is "look at the system". The area decides the shell shape here,
   * exactly as it decides the sidebar's groups: one declaration, one consumer.
   */
  const isLanding = area.id === "home";

  /*
   * Hydration readiness marker for browser QA.
   *
   * Effects run after React has committed the whole tree, so this attribute
   * means "the application is hydrated" — a condition LUC owns. QA waits for it
   * instead of `networkidle`, which on a provider page never arrives. It is an
   * attribute only: nothing styles it and no component reads it.
   */
  useEffect(() => {
    document.documentElement.dataset.lucHydrated = "1";
  }, []);

  useCommandHotkey(() => setPaletteOpen(true), pathname !== "/patterns/command-palette");

  /*
   * One localisation pass, two consumers: the header panels and the sidebar
   * render the same groups, so a family cannot be named differently in the two
   * places. The second lookup (`tcs`) resolves the labels that come from the
   * discovery taxonomy rather than from `lib/navigation.ts` — the eight use cases
   * and the six art directions — through the documentation dictionary.
   */
  const localizedGroups = useMemo(() => localizeNavGroups(navGroups, tn, tcs), [tn, tcs]);

  /**
   * The front door's sidebar: the way in, plus a map of the whole site.
   *
   * Built from `NAV_AREAS` rather than from a group in `navigation.ts`, because
   * the areas are chrome: adding them to the navigation tree would let them claim
   * routes from the groups that actually document those pages.
   */
  const siteMap: NavigationGroup = useMemo(
    () => ({
      id: "areas",
      label: t("shell.siteMap"),
      items: NAV_AREAS.filter(
        (entry) => entry.id !== "home" && !isParentOnly(entry),
      ).map<NavigationItem>((entry) => ({
        id: entry.href,
        label: tn(entry.label),
        href: entry.href,
        description: tn(entry.description),
      })),
    }),
    [t, tn],
  );

  /*
   * Deliberately not memoised.
   *
   * Selecting the current area's groups is a filter over about twenty groups and
   * a text filter over the result — cheaper than the bookkeeping that memoising it
   * would need, and the React Compiler's rule set is explicit that a manual memo
   * whose dependency is a mutable object is worse than no memo: it either gets
   * skipped or it hides a real change.
   */
  const areaGroups = sidebarForArea(area, localizedGroups, tn);
  /*
   * A nested area states its owner in one row.
   *
   * Motion is a family of the component library but a route area of its own, and
   * the sidebar has to say so without listing the thirteen component families —
   * which is precisely what made a reader think the sidebar had switched to
   * Components when they opened a Motion page. The relationship is declared once,
   * in `lib/discovery/areas.ts` (`parent`), and this is where it is shown, so the
   * header, the sidebar and the breadcrumbs are all reading the same fact.
   */
  const parentArea = area.parent ? areaById.get(area.parent) : undefined;
  const siblings = area.parent ? nestedAreasOf(area.parent) : [];
  /*
   * A nested area states its family in one group, and how it states it depends on
   * how many siblings there are.
   *
   *   one sibling   (Motion under Components)    "Part of" → Components
   *   several       (Build's four subareas)      "Build"   → Blocks, Templates,
   *                                                          Patterns, Experiences
   *
   * The one-sibling case names the parent because there is nothing to compare it
   * with. The several-sibling case names the *family* and lists it, because that
   * is the question a reader on `/patterns` is asking — "where am I, and what else
   * is in here with me" — and because the parent itself is not a page to link to.
   * Both are derived from `parent` in `lib/discovery/areas.ts`; neither is written
   * per page.
   */
  const parentGroup: NavigationGroup | undefined = parentArea
    ? siblings.length > 1
      ? {
          id: `family-${parentArea.id}`,
          label: tn(parentArea.label),
          items: siblings.map<NavigationItem>((entry) => ({
            id: entry.href,
            label: tn(entry.label),
            href: entry.href,
            description: tn(entry.description),
          })),
        }
      : {
          id: `parent-${parentArea.id}`,
          label: t("shell.partOf"),
          items: [
            {
              id: parentArea.href,
              label: tn(parentArea.label),
              href: parentArea.href,
              description: tn(parentArea.description),
            },
          ],
        }
    : undefined;
  /*
   * An empty group is not a section.
   *
   * `claimRoutes` in `lib/navigation.ts` gives each route to the first group that
   * names it, so a handwritten group can lose every one of its rows to a generated
   * one — Docs' "Data display" does exactly that. It used to render as a heading
   * with nothing under it, which reads as a broken menu. A search already drops
   * empty groups (`filterNavigation`); this makes the unfiltered tree agree.
   */
  const groups = filterNavigation(
    area.id === "home"
      ? [...areaGroups, siteMap]
      : parentGroup
        ? [...areaGroups, parentGroup]
        : areaGroups,
    query,
  ).filter((group) => group.items.length > 0);

  /*
   * How much of the tree to unfold, and which groups may be folded.
   *
   * A sidebar is a map, and a map that is always fully unfolded is a directory:
   * Docs declares about forty rows across eight sections. So a long tree opens
   * only the group the reader is standing in — plus the first group when the
   * current route lives in none of them, which is what an area landing page looks
   * like — and a short tree (Motion's four rows, Visuals' four) opens whole,
   * because folding five rows saves nothing.
   *
   * The count is over rendered rows, so the front door's site map is measured the
   * same way as a component family.
   */
  const rowCount = groups.reduce((total, group) => total + group.items.length, 0);
  const LONG_TREE_ROWS = 12;
  const longTree = rowCount > LONG_TREE_ROWS;
  const activeGroupId = groups.find((group) =>
    group.items.some(
      (item) =>
        isNavigationItemActive(pathname, item.href) ||
        (item.children ?? []).some((child) => isNavigationItemActive(pathname, child.href)),
    ),
  )?.id;
  const groupOpensByDefault = (groupId: string, index: number): boolean =>
    !longTree ||
    groupId === activeGroupId ||
    (activeGroupId === undefined &&
      (area.defaultSection !== undefined ? groupId === area.defaultSection : index === 0));
  /*
   * The status bar reports the size of the *catalog*, not of the navigation tree.
   *
   * It used to count navigation items and call them routes, which was already
   * approximate and became misleading when the areas reduced every visible tree:
   * "103 routes" sat in the bar of a site serving 176. The catalog is the honest
   * number, it comes from the same projection everything else reads, and a reader
   * can check it on `/explore/browse`.
   */
  const entryCount = discoveryStats.total;

  /*
   * Stable for the life of the frame, because it is only the setter.
   *
   * A page consumes this through context; a new object on every render would
   * re-render every consumer whenever the shell re-rendered for an unrelated
   * reason — the sidebar filter, a theme change.
   */
  const launcher = useMemo(() => ({ openSearch: () => setPaletteOpen(true) }), []);

  return (
    <>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {/* One toast viewport for the whole Showcase, mounted at the shell. */}
      <Toaster />
      <AppShell
        pathname={pathname}
        /*
         * One place localises every link the shell renders — header panels,
         * sidebar items, nested items and the skip link — because the shell asks
         * the host for a link rather than importing a router.
         */
        renderLink={(props) => <Link {...props} href={href(props.href)} />}
        sidebarPersistKey="luc-ui:showcase:sidebar"
        /* No column on the landing route; the same contents still back the
         * drawer, which is the only navigation below `lg`. */
        sidebarColumn={!isLanding}
        collapsibleSidebar={!isLanding}
        sidebar={
          <>
            <SidebarHeader>
              <Brand hideOnRail />
              <SidebarToggle className="ml-auto" />
            </SidebarHeader>

            {/*
              * Which area this sidebar belongs to, stated at the top of it. The
              * header establishes location; this is the sidebar agreeing with it,
              * so a reader who scrolled the header away still knows what they are
              * looking at.
              */}
            <Link
              href={href(area.href)}
              className="luc-transition luc-focus flex flex-wrap items-baseline gap-x-2 rounded-md px-2 py-1.5 group-data-[state=collapsed]/sidebar:hidden"
            >
              <span className="text-label text-fg-primary">{tn(area.label)}</span>
              {/*
               * The description is a wide-sidebar affordance, not a phone one: at
               * 390px it truncated mid-word ("what it contains an…"), which reads as
               * a layout bug. The area label stays; the sentence lives in the header
               * panel, where there is room for it.
               */}
              <span className="hidden min-w-0 flex-1 truncate text-micro text-fg-muted sm:inline">
                {tn(area.description)}
              </span>
            </Link>

            <div className="flex items-center gap-2 group-data-[state=collapsed]/sidebar:hidden">
              <SearchInput
                size="sm"
                placeholder={t("nav.filterPlaceholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t("nav.filterLabel")}
                clearLabel={t("nav.clearFilter")}
              />
            </div>

            <SidebarContent ariaLabel={t("nav.sections")} className="gap-3">
              {groups.length === 0 ? (
                <Text variant="caption" tone="muted" className="px-2">
                  {t("nav.noMatch", { query })}
                </Text>
              ) : null}
              {groups.map((group, index) => (
                <SidebarGroup
                  /*
                   * `defaultOpen` is part of the key on purpose.
                   *
                   * A nested group folds behind a disclosure only where the tree is
                   * long, and the route decides which one is unfolded. Folding the
                   * route-derived default into the key means entering a section
                   * unfolds it (the group remounts with its new default) while a
                   * reader's own fold survives navigation that does not change
                   * which section holds them — both without an effect that syncs
                   * state to state.
                   */
                  key={`${group.id}:${groupOpensByDefault(group.id, index) ? "open" : "closed"}`}
                  label={group.label}
                  /*
                   * A search result is never hidden behind a fold: the reader
                   * typed a question and every answer has to be visible. The
                   * unfiltered tree folds, but only where it is worth it.
                   */
                  collapsible={!query}
                  defaultOpen={groupOpensByDefault(group.id, index)}
                  /* A hairline between sections, so the groups are separated by
                   * something other than whitespace alone. */
                  className={index > 0 ? "border-t border-line-subtle pt-3" : undefined}
                >
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.id}
                        label={item.label}
                        href={item.children?.length ? undefined : item.href}
                        /*
                         * A group opens itself when the current route lives
                         * inside it. Without this, arriving on a nested page by
                         * link or by ⌘K leaves the tree closed and the page you
                         * are actually on invisible in the sidebar.
                         */
                        defaultOpen={Boolean(
                          item.children?.some(
                            (child) => child.href && pathname.startsWith(child.href),
                          ),
                        )}
                      >
                        {item.children?.map((child) => (
                          <SidebarItem
                            key={child.id}
                            label={child.label}
                            href={child.href}
                            className="h-7 pl-0 text-caption"
                          />
                        ))}
                      </SidebarItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter>
              {/* One control surface, not two: the theme and motion controls live
                  in the topbar, so the footer carries identity and a way out. */}
              <div className="flex items-center gap-2 px-1 group-data-[state=collapsed]/sidebar:hidden">
                <Badge size="sm" tone="neutral">
                  v1.0
                </Badge>
                <Text variant="caption" tone="muted" className="truncate">
                  {t("shell.tokens")}
                </Text>
              </div>
            </SidebarFooter>
          </>
        }
        topbar={
          <AppShellTopbar>
            {/*
              * The wordmark lives in the sidebar header on a documentation page
              * and in the topbar on the landing page, where there is no sidebar —
              * the logo is how a reader gets home, so it has to exist on every
              * route, not only where a sidebar happens to be.
              */}
            {isLanding ? <Brand className="mr-1" /> : null}
            <AppShellMobileTrigger />
            {/*
              * The primary navigation. It hides itself below `lg`, where the
              * drawer is the navigation — the drawer carries the current area's
              * groups and, on the front door, the whole site map.
              */}
            <GlobalNav
              pathname={pathname}
              groups={localizedGroups}
              onOpenSearch={() => setPaletteOpen(true)}
            />
            <div className="ml-auto flex items-center gap-2">
              <div className="lg:hidden">
                <CommandTrigger onOpen={() => setPaletteOpen(true)} />
              </div>
              <LanguageControl />
              {/* IA-005: the motion preference is a reviewer's control, and the
                * header has to spend its width on the product's own shape first.
                * It returns at 1280px, where the four primaries fit alongside
                * it — `qa/navigation.mjs` asserts both halves. */}
              <div className="hidden xl:block">
                <MotionControl />
              </div>
              <AppearanceControl />
              <div className="hidden sm:block">
                <ThemeControl />
              </div>
            </div>
          </AppShellTopbar>
        }
        statusBar={
          /*
           * Named, because it is a scrollable region and therefore a tab stop.
           * An unnamed focusable region announces nothing when a keyboard user
           * lands on it.
           */
          <AppShellStatusBar aria-label={t("shell.status")}>
            <span className="shrink-0">{t("shell.version")}</span>
            <Separator />
            {/*
              * The title is the only segment allowed to shrink: a long page name
              * ellipsizes instead of pushing the bar into horizontal scroll. A
              * scrollable strip that a keyboard user cannot reach is an a11y
              * defect, so the bar stays within the viewport by design.
            */}
            <span className="min-w-0 truncate">{current ? tn(current.title) : t("shell.home")}</span>
            <span className="hidden shrink-0 items-center gap-3 xs:inline-flex">
              <Separator />
              <span>{t("shell.entries", { count: entryCount })}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-3">
              <Separator />
              <span>{t("shell.theme", { theme: resolvedTheme })}</span>
            </span>
            {/*
              * The palette and type roles are review information, not navigation.
              * On a narrow viewport they are hidden so the status bar never turns
              * into a horizontally scrollable strip — a scrollable region that a
              * keyboard user cannot reach is an accessibility defect, not a
              * cosmetic one.
            */}
            <span className="hidden shrink-0 items-center gap-3 sm:inline-flex">
              <Separator />
              <span>{t("shell.appearance", { palette, typeface })}</span>
              {personality !== "instrument" ? (
                <>
                  <Separator />
                  <span>{personality}</span>
                </>
              ) : null}
            </span>
          </AppShellStatusBar>
        }
      >
        {/*
          * The palette's open state belongs to the shell, so the shell is what
          * publishes it. A page that offers search asks for this and gets the
          * real control — see `search-context.tsx` for why a button dressed as a
          * search box was not an option.
          */}
        <SearchProvider launcher={launcher}>{children}</SearchProvider>
      </AppShell>
    </>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="shrink-0 text-fg-disabled">
      ·
    </span>
  );
}

/**
 * Is this area a parent rather than a destination?
 *
 * True when another area declares the same landing — Build shares `/blocks` with
 * Blocks, because Build is the family and Blocks is the page. Such an area keeps
 * its identity, its header word and its description, and hands its landing to the
 * subarea; the site map lists the destinations, so listing both would send two
 * rows to one URL under two different names.
 */
function isParentOnly(area: { id: string; href: string }): boolean {
  return NAV_AREAS.some((candidate) => candidate.id !== area.id && candidate.href === area.href);
}

/**
 * The wordmark, and the way home.
 *
 * One component rather than two copies of the same markup: it renders in the
 * sidebar header on every documentation route and in the topbar on the landing
 * route, and a reader who cannot find it on one of them has lost the way back.
 *
 * `hideOnRail` is only meaningful in the sidebar, where the collapsed rail has no
 * room for a wordmark and the mark alone carries the link.
 */
function Brand({ className, hideOnRail = false }: { className?: string; hideOnRail?: boolean }) {
  const { t, href } = useI18n();
  return (
    <Link
      href={href("/")}
      className={cn(
        "luc-focus group/logo flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1",
        className,
      )}
    >
      <Image
        src="/brand/luc-ui-logo-light-64.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="size-7 shrink-0 dark:hidden"
      />
      <Image
        src="/brand/luc-ui-logo-dark-64.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="hidden size-7 shrink-0 dark:block"
      />
      <span
        className={cn(
          "flex min-w-0 flex-col leading-none",
          hideOnRail && "group-data-[state=collapsed]/sidebar:hidden",
        )}
      >
        <span className="font-display text-[15px] font-semibold tracking-[-0.02em] text-fg-primary">
          Luc UI
        </span>
        <span className="mt-0.5 text-micro text-fg-muted uppercase">{t("nav.designSystem")}</span>
      </span>
    </Link>
  );
}

/** The small-viewport search affordance; the header's own trigger covers `lg`. */
function CommandTrigger({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onOpen}
      /*
       * The accessible name is explicit because the visible label is hidden below
       * `sm`: without this the control is an icon with no name, which is what the
       * mobile axe sweep caught on thirty-five routes. The string is the same one
       * the label shows, so the visible and accessible names agree where both are
       * present.
       */
      aria-label={t("shell.search")}
      className={cn(
        "luc-transition luc-focus inline-flex h-control-sm items-center gap-2 rounded-sm",
        "border border-line-default bg-surface-sunken px-2.5 text-caption text-fg-muted",
        "hover:border-line-strong hover:text-fg-secondary",
      )}
    >
      <RiSearchLine aria-hidden="true" className="size-3.5" />
      <span className="hidden sm:inline">{t("shell.search")}</span>
      <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
    </button>
  );
}
