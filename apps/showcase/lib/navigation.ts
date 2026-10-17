/*
 * The Showcase's navigation model.
 *
 * One tree, four consumers: the global header, the contextual sidebar, the
 * mobile drawer and the ⌘K command palette all render this, so they cannot
 * disagree about where a page lives.
 *
 * What changed in Phase 9, and why it matters for a public library:
 *
 *  - **The library sections are derived, not written.** Components, Charts and
 *    Motion come from `lib/docs/nav.ts`, which is generated from the real
 *    package exports. A component added to `@luc/ui` appears in the sidebar
 *    because it exists, not because someone remembered to add a line — and a
 *    component removed from the library cannot linger in a menu.
 *  - **The editorial sections stay handwritten.** Foundations, Patterns,
 *    Application and Integrations are essays about a system, not a list of
 *    exports; their titles and one-line descriptions are written by a person.
 *  - **Depth is capped at two levels** (group → item, with one nested level
 *    inside a family). Deeper than that and a sidebar stops being a map.
 *
 * What changed in Phase 10A:
 *
 *  - **Every group has an explicit id.** It used to be derived from the English
 *    title, which meant renaming a heading silently broke the area that named
 *    it. An id is now a contract; the title is presentation.
 *  - **Areas choose which groups the sidebar shows** (`lib/discovery/areas.ts`).
 *    The full tree is still built here — the command palette searches all of it
 *    — while a reader on a chart page sees chart families instead of the site.
 *  - **Four new groups close real gaps.** `/forms/**`, `/data/**`,
 *    `/date-time/**`, `/experiments/**`, four `/patterns/**` pages and the whole
 *    `/experiences/**` gallery had no navigation entry at all before this phase;
 *    they were reachable only by typing a URL.
 *
 * This module is imported by client components, so it reads the *compact*
 * projection in `lib/docs/nav.ts` and never the API tables in
 * `lib/docs/registry.ts`.
 */

import type { NavigationGroup, NavigationItem } from "@luc/ui/app-shell";
import { navFamiliesInGroup, navGroupMeta, type NavFamily } from "./docs/nav";
import { ART_DIRECTIONS, USE_CASES } from "./discovery/taxonomy";

export interface NavItem {
  title: string;
  /** Omitted for a parent whose only job is to disclose its children. */
  href?: string;
  /** Short description used on index pages. */
  description?: string;
  /** One nested level. Deeper than that and the sidebar stops being a map. */
  children?: NavItem[];
}

export interface NavGroup {
  /**
   * Stable id, and a contract: `lib/discovery/areas.ts` names groups by id and
   * `components/shell/app-frame.tsx` renders the groups an area selects. Never
   * derive it from the title — a heading can be reworded, an id cannot.
   */
  id: string;
  title: string;
  items: NavItem[];
}

/**
 * The pages a reader meets before any component: what the library is, how to
 * install it, how theming works, and the API index.
 */
const startGroup: NavGroup = {
  id: "start-here",
  title: "Start here",
  items: [
    {
      title: "Documentation",
      href: "/docs",
      description: "What Luc UI is, and how to find the thing you need.",
    },
    {
      title: "Installation",
      href: "/docs/installation",
      description: "Install, import the styles, install the provider.",
    },
    {
      title: "Theming",
      href: "/docs/theming",
      description: "Palettes, type voices, personality and depth.",
    },
    {
      title: "API reference",
      href: "/docs/reference",
      description: "Every public export, grouped by family and generated from the package.",
    },
  ],
};

/**
 * Collection pages from earlier phases.
 *
 * These are real pages that explain a family as a whole, written before Phase 9
 * documented each component on its own. They stay in the menu — under the
 * family they belong to — rather than being orphaned or duplicated at the top
 * level.
 */
const COLLECTIONS: Record<string, NavItem[]> = {
  /*
   * The handwritten pages that document a *family* rather than one export.
   *
   * These used to be four standalone groups — Application, Forms, Data display,
   * Date and time — sitting beside the thirteen generated families in the sidebar
   * and repeating their routes: Calendar appeared under "Date and time" and again
   * under the date-time family, `DataTable` twice, `Form` twice. Two menus for one
   * destination is what made the product read as several documentation systems
   * stitched together, so the groups are gone and their pages appear where the
   * reader is already looking, under the family they belong to.
   *
   * A row that duplicates a route the family already lists is filtered out below,
   * so `/forms` stays the single "Form" row and only the pages with no registry
   * entry of their own are added.
   */
  application: [
    {
      title: "Overview",
      href: "/application",
      description: "The frame a product lives in.",
    },
  ],
  forms: [
    {
      title: "Selection controls",
      href: "/components/selection",
      description: "Checkbox, radio, switch and segmented control compared.",
    },
    {
      title: "Validation",
      href: "/forms/validation",
      description: "Errors where the field is, not in a summary.",
    },
    {
      /* The dictionary already carries this row's sentence; a shorter label
       * would have read better in a 256px column and cost a translation for no
       * gain, so it stays as written. */
      title: "Async validation and submission",
      href: "/forms/async",
      description: "Work that travels, and what the field shows while it does.",
    },
    {
      title: "Sections and repeating groups",
      href: "/forms/sections",
      description: "Long forms, addressed as parts.",
    },
  ],
  "date-time": [
    {
      title: "Date range",
      href: "/date-time/date-range",
      description: "Two ends, one control.",
    },
  ],
  overlays: [
    {
      title: "Overlay patterns",
      href: "/components/overlay",
      description: "Which surface for which job.",
    },
    {
      title: "Menus",
      href: "/components/menus",
      description: "Dropdown and context menus side by side.",
    },
  ],
  media: [
    {
      title: "Media overview",
      href: "/components/media",
      description: "Avatars, galleries and comparison.",
    },
  ],
  feedback: [
    {
      title: "Feedback overview",
      href: "/components/feedback",
      description: "Alerts, progress and the quiet states.",
    },
  ],
};

/**
 * A family as a collapsible sidebar parent.
 *
 * A collection page from an earlier phase is only listed when the family does
 * not already link that route: `/components/menus` is documented by the
 * `DropdownMenu` page, so a second "Menus" row would be the same destination
 * twice — and the integrity test in `tests/unit/navigation-integrity.test.ts`
 * fails the build if one appears.
 */
function familyItem(family: NavFamily): NavItem {
  const claimed = new Set<string>([
    ...(family.landing ? [family.landing] : []),
    ...family.entries.map((entry) => entry.route),
  ]);
  const collections = (COLLECTIONS[family.id] ?? []).filter(
    (item) => !item.href || !claimed.has(item.href),
  );
  /*
   * The family's own landing page is the parent link, not a child row: a parent
   * and its first child pointing at the same URL is the duplicate the integrity
   * test catches. A family without a landing is a disclosure only.
   */
  const children: NavItem[] = [
    ...family.entries.map((entry) => ({
      title: entry.title,
      href: entry.route,
    })),
    ...collections,
  ];
  const href = family.landing ?? undefined;
  return href ? { title: family.title, href, children } : { title: family.title, children };
}

/** The library sections, derived from the generated registry projection. */
const libraryGroups: NavGroup[] = navGroupMeta
  .filter((group) => group.id === "components" || group.id === "charts" || group.id === "motion")
  .map((group) => ({
    id: group.id,
    title: group.title,
    items: [
      /*
       * The Motion gallery is a destination of its own, so it is a row.
       *
       * Every other Motion row is a family or an entry, which left `/motion`
       * itself with no active row: a reader on the gallery could see the
       * navigation but not their place in it. It is declared here rather than
       * synthesized in the shell so `tests/unit/navigation-integrity.test.ts`
       * checks its target like any other link.
       */
      ...(group.id === "motion"
        ? [
            {
              title: "Motion gallery",
              href: "/motion",
              description: "Every kinetic primitive, grouped by what it is for.",
            } satisfies NavItem,
          ]
        : []),
      ...navFamiliesInGroup(group.id).map(familyItem),
    ],
  }));

/* -------------------------------------------------------------------------- */
/* Explore                                                                     */
/* -------------------------------------------------------------------------- */

const exploreGroup: NavGroup = {
  id: "explore",
  title: "Explore",
  items: [
    {
      title: "Overview",
      href: "/explore",
      description: "Featured work, the two browsing axes, and what is new.",
    },
  ],
};

/*
 * The two browsing axes are *derived* from the taxonomy rather than retyped
 * here: one source, so a use case cannot exist in the filter and be missing from
 * the sidebar. Their labels are data rather than navigation literals, so they
 * are translated through the documentation dictionary at render time
 * (`localizeNavGroups`'s second argument) — and `scripts/i18n-coverage.mjs`
 * attributes `lib/discovery/**` to every route, so a missing rendering still
 * fails the bilingual gate.
 */
const useCaseGroup: NavGroup = {
  id: "explore-use-cases",
  title: "By use case",
  items: USE_CASES.map((useCase) => ({
    title: useCase.label,
    href: `/explore?use=${useCase.id}`,
  })),
};

/*
 * The art-direction axis is a *filter* over the catalogue, not a set of pages.
 *
 * It used to link six Phase 10A study pages under `/visuals/art-direction/**`;
 * those pages and their study compositions were retired, so the rows now point
 * at the browse filter that has always been the readable expression of the same
 * axis — the same pattern the use-case rows beside them use.
 */
const artDirectionNavGroup: NavGroup = {
  id: "explore-art-directions",
  title: "By art direction",
  items: ART_DIRECTIONS.map((direction) => ({
    title: direction.label,
    href: `/explore?art=${direction.id}`,
  })),
};

/* -------------------------------------------------------------------------- */
/* Build with it                                                               */
/* -------------------------------------------------------------------------- */

const buildWithGroup: NavGroup = {
  id: "build-with-it",
  title: "Build with it",
  items: [
    {
      title: "Blocks",
      href: "/blocks",
      description: "Page sections: a hero, a pricing band, a feed.",
    },
    {
      title: "Templates",
      href: "/templates",
      description: "Whole-page starters: personal site, marketing page, product console.",
    },
  ],
};

/**
 * The sixteen reference products, as one collapsible entry.
 *
 * They are the largest single body of content in the Showcase and they had no
 * navigation entry at all before this phase. The titles are the pages' own
 * headings, so the sidebar, the index card and the page agree.
 */
const experiencesGroup: NavGroup = {
  id: "experiences",
  title: "Experiences",
  items: [
    {
      title: "All experiences",
      href: "/experiences",
      description: "Sixteen working products built from the public API.",
      children: [
        { title: "Marketing site", href: "/experiences/general/marketing" },
        { title: "SaaS console", href: "/experiences/general/saas" },
        { title: "Publishing platform", href: "/experiences/general/publishing" },
        { title: "Community product", href: "/experiences/general/community" },
        { title: "Career profile", href: "/experiences/personal/career" },
        { title: "Academic profile", href: "/experiences/personal/academic" },
        { title: "Creative portfolio", href: "/experiences/personal/portfolio" },
        { title: "Journal & digital garden", href: "/experiences/personal/garden" },
        { title: "AI workspace", href: "/experiences/vertical/ai" },
        { title: "Research bench", href: "/experiences/vertical/science" },
        { title: "Quantitative analytics", href: "/experiences/vertical/finance" },
        { title: "Commerce flow", href: "/experiences/vertical/commerce" },
        { title: "Learning module", href: "/experiences/vertical/education" },
        { title: "Creator studio", href: "/experiences/vertical/media" },
        { title: "Productivity board", href: "/experiences/vertical/productivity" },
        { title: "Discussion forum", href: "/experiences/vertical/forum" },
      ],
    },
  ],
};

/** Composition patterns: the pages that solve a whole problem. */
const patternsGroup: NavGroup = {
  id: "patterns",
  title: "Patterns",
  items: [
    {
      title: "Overview",
      href: "/patterns",
      description: "Compositions that solve a whole problem.",
    },
    {
      title: "Research workspace",
      href: "/patterns/research-workspace",
      description: "The flagship composition: shell, table, chart, inspector, URL state.",
    },
    {
      title: "Command palette",
      href: "/patterns/command-palette",
      description: "⌘K over your own pages.",
    },
    {
      title: "Table filters",
      href: "/patterns/table-filters",
      description: "Facets, search and column control.",
    },
    {
      title: "Chart and table",
      href: "/patterns/chart-table",
      description: "A chart with its data view.",
    },
    {
      title: "Industries",
      href: "/patterns/industries",
      description: "The same primitives in three domains.",
    },
    {
      title: "Data details",
      href: "/patterns/data-details",
      description: "A master list and its detail pane.",
    },
    {
      title: "Settings in a sheet",
      href: "/patterns/settings-form",
      description: "A long form kept out of the page it configures.",
    },
    {
      title: "Table with a date range",
      href: "/patterns/table-date-filter",
      description: "A range that filters rows rather than columns.",
    },
    {
      title: "Chart with a date range",
      href: "/patterns/chart-date-filter",
      description: "The same range, driving the x domain instead of a filter.",
    },
    {
      title: "Workspace",
      href: "/patterns/workspace",
      description: "Resizable panes with a real keyboard contract.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Studios, foundations and guides                                             */
/* -------------------------------------------------------------------------- */

const studiosGroup: NavGroup = {
  id: "studios",
  title: "Studios",
  items: [
    {
      title: "Chart Studio",
      href: "/studios/charts",
      description: "Configure a chart from real data, then copy the code.",
    },
    {
      title: "Motion Studio",
      href: "/studios/motion",
      description: "Tune duration, spring, depth and intensity against the real props.",
    },
    {
      title: "Theme Studio",
      href: "/studios/themes",
      description: "Palette, type voice, personality, depth and radius — live.",
    },
    {
      title: "Template Composer",
      href: "/studios/composer",
      description: "Rearrange real Blocks into a page and copy the result.",
    },
  ],
};

/** Foundations: the principles and tokens the components are built from. */
const foundationsGroup: NavGroup = {
  id: "foundations",
  title: "Foundations",
  items: [
    { title: "Overview", href: "/foundations", description: "The principles behind Luc UI." },
    {
      title: "Colors",
      href: "/foundations/colors",
      description: "Semantic surfaces, text and accents.",
    },
    {
      title: "Typography",
      href: "/foundations/typography",
      description: "Roles, scale and numeric text.",
    },
    {
      title: "Spacing",
      href: "/foundations/spacing",
      description: "The 4pt rhythm and density modes.",
    },
    {
      title: "Radius",
      href: "/foundations/radius",
      description: "One radius scale, applied with intent.",
    },
    { title: "Surface", href: "/foundations/surface", description: "The luminance hierarchy." },
    { title: "Shadow", href: "/foundations/shadow", description: "Restrained elevation levels." },
    { title: "Glow", href: "/foundations/glow", description: "Where the accent is allowed to shine." },
    { title: "Motion", href: "/foundations/motion", description: "Duration and easing vocabulary." },
    {
      title: "Spatial language",
      href: "/foundations/spatial",
      description: "Depth, elevation rungs and the press gesture — library-wide.",
    },
    {
      title: "Themes and type",
      href: "/foundations/themes",
      description: "Seven brand palettes and four type voices, live.",
    },
    {
      title: "Personality",
      href: "/foundations/personality",
      description: "Geometry, density and motion physics as one attribute.",
    },
  ],
};

const integrationsGroup: NavGroup = {
  id: "integrations",
  title: "Integrations",
  items: [
    {
      title: "Overview",
      href: "/integrations/tradingview",
      description: "Provider widgets behind a LUC contract.",
    },
    {
      title: "Charts",
      href: "/integrations/tradingview/charts",
      description: "Advanced, mini and seasonal charts.",
    },
    {
      title: "Watchlists",
      href: "/integrations/tradingview/watchlists",
      description: "Watchlist and market summaries.",
    },
    {
      title: "Tickers",
      href: "/integrations/tradingview/tickers",
      description: "Tape, single ticker and tags.",
    },
    {
      title: "Heatmaps",
      href: "/integrations/tradingview/heatmaps",
      description: "Stock, crypto, ETF and forex.",
    },
    {
      title: "Screeners",
      href: "/integrations/tradingview/screeners",
      description: "Market and crypto screeners.",
    },
    {
      title: "Symbol details",
      href: "/integrations/tradingview/symbol-details",
      description: "Info, fundamentals and technicals.",
    },
    {
      title: "News and calendars",
      href: "/integrations/tradingview/news-calendars",
      description: "Top stories, calendar and economic map.",
    },
    {
      title: "Theme bridge",
      href: "/integrations/tradingview/themes",
      description: "How LUC tokens reach a widget.",
    },
    {
      title: "Patterns",
      href: "/integrations/tradingview/patterns",
      description: "Whole-page recipes.",
    },
  ],
};

/** The design laboratory: three treatments of one interaction. */
const experimentsGroup: NavGroup = {
  id: "experiments",
  title: "Experiments",
  items: [
    {
      title: "Design lab",
      href: "/experiments/design-lab",
      description: "Three treatments of the same observations and the same selection model.",
    },
    {
      title: "Precision instrument",
      href: "/experiments/design-lab/precision-instrument",
      description: "Calibrated lines and exact feedback put the measurements first.",
    },
    {
      title: "Editorial research",
      href: "/experiments/design-lab/editorial-research",
      description: "A clear question and a readable finding lead into the evidence.",
    },
    {
      title: "Focused workspace",
      href: "/experiments/design-lab/focused-workspace",
      description: "Select an observation to link its row, chart cursor and context.",
    },
  ],
};

/**
 * The one navigation tree.
 *
 * One rule makes it unambiguous: **the first group to claim a route owns it.**
 * The registry-derived library groups come first, so a page the generated
 * catalogue already documents is not repeated by a handwritten group — the
 * Application family documents `/application/workspace`, so the handwritten
 * Application group keeps only the pages the registry does not cover. Without
 * this, a reader sees the same destination twice and cannot tell which entry is
 * canonical; with it, "which one wins" is decided by the order below rather than
 * by which file was edited last.
 */
function claimRoutes(groups: NavGroup[]): NavGroup[] {
  const claimed = new Set<string>();
  const take = (href: string | undefined): boolean => {
    if (!href) return true;
    if (claimed.has(href)) return false;
    claimed.add(href);
    return true;
  };
  return groups.map((group) => ({
    ...group,
    items: group.items.flatMap((item) => {
      const children = item.children;
      if (take(item.href)) {
        return [
          {
            ...item,
            ...(children ? { children: children.filter((child) => take(child.href)) } : {}),
          },
        ];
      }
      /*
       * A parent whose own href is already claimed keeps its children.
       *
       * Dropping the item dropped the whole subtree with it. Motion's Feedback
       * family declares `/motion` as its landing, the "Motion gallery" row above
       * it claims `/motion` first, and fifteen documented entries — everything
       * from PressRipple to TransitionPanel, and CardStack's four siblings — were
       * unreachable from the sidebar as a result. A "landing" is a convenience
       * link to the first thing in the family; the family *is* its children, so
       * the row stays and only the link goes.
       *
       * An item with no children is a plain duplicate destination (`/components/
       * menus` is documented by two entries) and is still dropped.
       */
      if (!children || children.length === 0) return [];
      return [{ ...item, href: undefined, children: children.filter((child) => take(child.href)) }];
    }),
  }));
}

export const navigation: NavGroup[] = claimRoutes([
  startGroup,
  exploreGroup,
  useCaseGroup,
  artDirectionNavGroup,
  ...libraryGroups,
  studiosGroup,
  buildWithGroup,
  experiencesGroup,
  patternsGroup,
  foundationsGroup,
  integrationsGroup,
  experimentsGroup,
]);

/** Foundations' own section list, without the brittle `navigation[0]` index. */
export const foundationItems: NavItem[] =
  navigation.find((group) => group.id === "foundations")?.items ?? [];

export const flatNavigation: NavItem[] = [
  { title: "Home", href: "/" },
  ...navigation
    .flatMap((group) => group.items.flatMap((item) => [item, ...(item.children ?? [])]))
    .filter((item): item is NavItem & { href: string } => typeof item.href === "string"),
];

/**
 * The shell's navigation model.
 *
 * Derived from `navigation` rather than written twice, so the sidebar and the
 * command palette cannot disagree about where a page lives. Entries carry a
 * route as their id, which is what the shell uses for active state.
 */
const toNavigationItem = (item: NavItem, groupTitle: string): NavigationItem => ({
  id: item.href ?? `group:${item.title}`,
  label: item.title,
  href: item.href,
  description: item.description,
  keywords: [groupTitle],
  children: item.children?.map((child) => toNavigationItem(child, groupTitle)),
});

export const navGroups: NavigationGroup[] = navigation.map((group) => ({
  id: group.id,
  label: group.title,
  items: group.items.map((item) => toNavigationItem(item, group.title)),
}));

/**
 * The same navigation model, in another language.
 *
 * Translation happens at render time rather than in the source arrays so the
 * English model stays the single description of the information architecture: a
 * component added to the library appears in both languages immediately, and only
 * its family label needs a dictionary entry. Ids and hrefs are untouched — they
 * are the contract the shell uses for active state and routing. A component's own
 * name is never translated: `LineChart` is an identifier a developer types in
 * either language.
 *
 * `translateProse` is the second lookup, and it exists for one case: the rows
 * derived from `lib/discovery/taxonomy.ts` (eight use cases, six art directions)
 * are *data*, not navigation literals, so the navigation dictionary has no entry
 * for them. They are looked up in the documentation dictionary instead — the same
 * one the browse page renders them through — which keeps a single Chinese
 * rendering of "Finance and analytics" for the whole site.
 */
export function localizeNavGroups(
  groups: NavigationGroup[],
  translate: (source: string) => string,
  translateProse: (source: string) => string = (source) => source,
): NavigationGroup[] {
  /*
   * One lookup, then the other — never both, and never the second one on a
   * string the first one already answered.
   *
   * The two dictionaries exist for two kinds of row: `translate` (`tn`) is keyed
   * by a navigation label, and `translateProse` (`tcs`) by a sentence from
   * `lib/discovery/taxonomy.ts` — the eight use cases and six art directions —
   * which the navigation dictionary has never heard of. Chaining them
   * unconditionally meant `tcs` was asked for the Chinese of a string that was
   * *already* Chinese, missed, and reported the miss: a Chinese render logged
   * about four hundred "missing zh-CN prose string" warnings for labels that were
   * rendering correctly in Chinese, which is the fastest way to make a real
   * missing translation invisible.
   *
   * The test is value equality, because that is what the localizer can see: a hit
   * that returns the source unchanged is indistinguishable from a miss here, and
   * only two labels in the whole dictionary are like that ("AI", "TradingView") —
   * identifiers that are deliberately the same in both languages.
   */
  const localize = (source: string): string => {
    const viaNavigation = translate(source);
    return viaNavigation === source ? translateProse(source) : viaNavigation;
  };
  const localizeItem = (item: NavigationItem): NavigationItem => ({
    ...item,
    label: localize(item.label),
    description: item.description ? localize(item.description) : item.description,
    children: item.children?.map(localizeItem),
  });
  return groups.map((group) => ({
    ...group,
    label: group.label ? localize(group.label) : group.label,
    items: group.items.map(localizeItem),
  }));
}

export const navItemById = new Map(
  navGroups.flatMap((group) =>
    group.items.flatMap((item) => [
      [item.id, item] as const,
      ...(item.children ?? []).map((child) => [child.id, child] as const),
    ]),
  ),
);

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return flatNavigation[0];
  /* Longest match wins so `/components/tabs` beats `/components`. */
  return flatNavigation
    .filter(
      (item): item is NavItem & { href: string } =>
        !!item.href &&
        item.href !== "/" &&
        pathname.startsWith(item.href.split("?")[0] ?? item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * The groups a sidebar shows in one area.
 *
 * A pure function of the area's `sidebar` list and the (already localised)
 * groups, so it has no state and can be tested without a DOM. A group id the
 * area names but that does not exist is dropped silently here — and asserted
 * against the real group list by `tests/unit/discovery-areas.test.ts`, which is
 * the check that matters, because it runs at build time rather than at render
 * time.
 */
export function sidebarForArea(
  area: {
    sidebar: readonly string[];
    /** See `NavArea.sectionLabels`: the area's own heading for a group. */
    sectionLabels?: Readonly<Record<string, string>>;
  },
  groups: NavigationGroup[],
  /**
   * The same lookup the rest of the navigation uses (`tn` in the shell).
   *
   * Defaulted to the identity so a caller that only needs the group *ids* — the
   * area test, a probe — does not have to build one. A section heading is a
   * navigation label like any other, so it goes through the same dictionary
   * rather than being the one string in the sidebar that never gets translated.
   */
  localize: (source: string) => string = (source) => source,
): NavigationGroup[] {
  const byId = new Map(groups.map((group) => [group.id, group]));
  return area.sidebar.flatMap((id) => {
    const group = byId.get(id);
    if (!group) return [];
    const label = area.sectionLabels?.[id];
    return [label ? { ...group, label: localize(label) } : group];
  });
}

/** Every group id the site defines — used by the area-integrity test. */
export const navGroupIds: readonly string[] = navGroups.map((group) => group.id);
