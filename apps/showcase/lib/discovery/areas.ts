/*
 * The site's top-level areas.
 *
 * An *area* is the answer to "which part of this site am I in", and it has
 * exactly two jobs:
 *
 *   1. the global header renders one entry per area, so the site's shape is
 *      visible without scrolling anything;
 *   2. the sidebar renders only the groups the current area declares, so a chart
 *      page is not surrounded by form guides and TradingView widgets.
 *
 * It is deliberately **not** a second navigation tree. An area names existing
 * navigation groups by id (see `lib/navigation.ts`), and a route belongs to an
 * area because its prefix matches — so a page cannot be listed in one area's
 * sidebar and reachable only from another area's header entry.
 *
 * `areaForRoute` falls back to the documentation area rather than throwing: an
 * area declaration that misses a prefix should degrade to "the whole site map",
 * not to an empty sidebar. `tests/unit/discovery-areas.test.ts` asserts the
 * fallback is never reached for a real route, which is what turns this safety
 * net into a checked invariant.
 *
 * Dependency-free (type-only imports) so `scripts/docs-registry.mjs` can
 * transpile it standalone and stamp each catalog row with its area.
 */

export type NavAreaId =
  | "home"
  | "explore"
  | "components"
  | "charts"
  | "build"
  | "blocks"
  | "templates"
  | "patterns"
  | "experiences"
  | "studios"
  | "docs";

export interface NavArea {
  id: NavAreaId;
  /**
   * Which tier the global header puts this area in.
   *
   * `primary` is the product's own shape: Components, Charts and Visuals.
   * Everything else is real and remains reachable, but it is not a capability
   * family: Explore, Build and Docs live behind one disclosure instead of
   * competing for the same row, and Build's subareas state their parent.
   */
  tier: "primary" | "secondary" | "nested";
  /**
   * The area this one belongs to, for an area that is not a destination.
   *
   * `nested` areas keep their own prefix — `/patterns` still routes, still owns
   * its breadcrumb and still selects its sidebar — but they are not listed in the
   * header. They are reached from the area named here: one place to find them,
   * not two competing ones.
   *
   * Motion used to be one of these, and that was the NAV-004 defect. Being
   * *conceptually* a Components family was declared here as a parent link while
   * the shell still swapped the whole sidebar for Motion's own — the reader saw
   * "Motion / Part of Components" and lost the four sections they had been
   * browsing. Motion is now what the product model says it is: a section of
   * Components, with `/motion/**` in that area's prefix list.
   */
  parent?: NavAreaId;
  /** Header and sidebar label. Translated through the navigation dictionary. */
  label: string;
  /** The area's landing route. Every one of these is a real page. */
  href: string;
  /** One sentence for the header panel and the site map. */
  description: string;
  /**
   * Route prefixes that place a page in this area. The **longest** match wins, so
   * a future nested area can declare `/charts/financial` without renumbering
   * anything.
   */
  prefixes: readonly string[];
  /** Sidebar group ids from `lib/navigation.ts`, in the order they render. */
  sidebar: readonly string[];
  /**
   * Section headings for this area's sidebar, keyed by group id.
   *
   * An area names its own sections, because the same group reads differently
   * depending on what it sits beside: `components` is the *whole* product on
   * `/charts`, and "UI components" — one of four sections — inside Components.
   * Writing the heading into the group instead would rename the group everywhere,
   * including the breadcrumb, where the area's own name is the right word.
   *
   * Translated through the navigation dictionary like every other label.
   */
  sectionLabels?: Readonly<Record<string, string>>;
  /**
   * Which section the sidebar unfolds when the reader is on the area's landing.
   *
   * A long tree opens the group the current route lives in; on a landing route
   * there is no such group, and the shell falls back to the first one. That is
   * right when the first section *is* the subject — Foundations on `/foundations`
   * — and wrong when it is not: `/components` opened "Design foundations" and hid
   * the thirteen families the page is actually about.
   */
  defaultSection?: string;
}

/*
 * Declared as a Record keyed by area id rather than as a bare array: the type
 * then guarantees every area exists exactly once, `HOME_AREA` and the fallback
 * are lookups rather than indices, and `NAV_AREAS` below fixes the order the
 * header and the site map render in.
 */
const AREAS: Record<NavAreaId, NavArea> = {
  home: {
    id: "home",
    tier: "secondary",
    label: "Home",
    href: "/",
    description: "What Luc UI is, what it contains and where to start.",
    prefixes: [],
    /* The front door shows the way in; the site map is rendered beside it. */
    sidebar: ["start-here"],
  },
  explore: {
    id: "explore",
    tier: "secondary",
    label: "Explore",
    href: "/explore",
    /*
     * DOC-004's budget applies to an area's sentence too: the sidebar header
     * prints it in a 256px column and truncates it, so a full clause is a row a
     * reader cannot finish. These three were 13–16 words.
     */
    description: "Find the right thing by name, use case or art direction.",
    prefixes: ["/explore"],
    sidebar: ["explore", "explore-use-cases", "explore-art-directions"],
  },
  components: {
    id: "components",
    tier: "primary",
    label: "Components",
    href: "/components",
    description: "Every public component, by the job it does.",
    /*
     * One design system, eight route prefixes — and this list is the whole
     * ownership rule.
     *
     * Foundations, the application frame, the form and data guides, date and
     * time, the provider integrations and **motion** all document the same
     * library, and the first six used to live in the Docs area — so opening
     * Calendar from Components replaced the sidebar with the documentation
     * taxonomy and marked no row current. Motion went the other way: it was
     * declared a Components family and a separate area at the same time, so
     * `/motion/**` rendered its own four-row tree and the reader lost the four
     * sections. A prefix belongs to exactly one area, and a route's sidebar is
     * decided here rather than restated in the shell.
     */
    prefixes: [
      "/components",
      "/foundations",
      "/application",
      "/forms",
      "/data",
      "/date-time",
      "/integrations",
      "/motion",
    ],
    /* Motion is the third section, so `/motion/**` renders this list like every
     * other section does. */
    sidebar: ["foundations", "components", "motion", "integrations"],
    /*
     * The four sections, in the order a reader needs them: what the system is
     * made of, what it gives you, how it moves, and what it connects to. The
     * group ids keep their own names — "components" is the group's id in the
     * generated taxonomy — so only the *heading* changes here.
     */
    sectionLabels: {
      foundations: "Design foundations",
      components: "UI components",
      motion: "Motion and interaction",
    },
    defaultSection: "components",
  },
  charts: {
    id: "charts",
    tier: "primary",
    label: "Charts",
    href: "/charts",
    description:
      "The charting surface — time series, distributions, statistics, finance, geospatial and science.",
    prefixes: ["/charts"],
    sidebar: ["charts"],
  },
  build: {
    id: "build",
    tier: "secondary",
    label: "Build",
    href: "/blocks",
    description: "Page sections, templates, patterns and reference products.",
    /*
     * Build is a parent, not a prefix (IA-007).
     *
     * One area used to own `/blocks`, `/templates`, `/patterns` and
     * `/experiences`, which meant the sidebar on a pattern read "Build with it /
     * Experiences / Patterns" and marked the *Blocks* row current — the page said
     * one thing and the navigation said another. Each subarea now declares its own
     * prefix and its own navigation, and this entry carries the identity they
     * share: the word in the header, the heading over the switcher, and the parent
     * the four link back to.
     *
     * It has no prefixes because it has no route: `/build` is not a page, and
     * inventing one to satisfy a taxonomy would be a landing page nobody asked
     * for. Its `href` is the subarea that best answers "show me Build".
     */
    prefixes: [],
    sidebar: [],
  },
  blocks: {
    id: "blocks",
    tier: "nested",
    parent: "build",
    label: "Blocks",
    href: "/blocks",
    /* The same sentence the Blocks row in `lib/navigation.ts` uses: one fact, one
     * Chinese rendering, one place to change it. */
    description: "Page sections: a hero, a pricing band, a feed.",
    prefixes: ["/blocks"],
    /* One gallery page, so the sidebar is the Build switcher and nothing else: a
     * group with a single row that repeats its own heading is not navigation. */
    sidebar: [],
  },
  templates: {
    id: "templates",
    tier: "nested",
    parent: "build",
    label: "Templates",
    href: "/templates",
    description: "Whole-page starters: personal site, marketing page, product console.",
    prefixes: ["/templates"],
    sidebar: [],
  },
  patterns: {
    id: "patterns",
    tier: "nested",
    parent: "build",
    label: "Patterns",
    href: "/patterns",
    description: "Compositions that solve a whole problem.",
    prefixes: ["/patterns"],
    sidebar: ["patterns"],
  },
  experiences: {
    id: "experiences",
    tier: "nested",
    parent: "build",
    label: "Experiences",
    href: "/experiences",
    description: "Sixteen working reference products built from the public API.",
    prefixes: ["/experiences"],
    sidebar: ["experiences"],
  },
  studios: {
    id: "studios",
    /*
     * A tool inside Build, not a fifth product beside it.
     *
     * Studios shipped as its own secondary area, which put "Studios" next to
     * "Build" in the header menu as though a page composer were a different kind
     * of thing from a template. It is the thing you *use* to arrange the blocks
     * and templates Build documents, so it states Build as its parent: one row in
     * the family switcher, one area in the header, and `/studios/**` still routes
     * and still selects its own sidebar (NAV-001).
     */
    tier: "nested",
    parent: "build",
    label: "Studios",
    href: "/studios/charts",
    description:
      "Workspaces that configure the real components: charts, motion, theme and page composition.",
    prefixes: ["/studios"],
    sidebar: ["studios"],
  },
  docs: {
    id: "docs",
    tier: "secondary",
    label: "Docs",
    href: "/docs",
    description:
      "Installation, theming, the generated API reference, and the design laboratory.",
    /*
     * Documentation, and only documentation.
     *
     * Docs was the catch-all area: eight other prefixes landed here, so every
     * guide and every foundation rendered the documentation taxonomy. What is
     * left is what a reader means by "the docs" — how to install it, how to
     * theme it, the API reference, and one study that is not a component.
     */
    prefixes: ["/docs", "/experiments"],
    sidebar: ["start-here", "experiments"],
  },
};

/**
 * Every area, in the order the header and the site map list them.
 *
 * The front door is first because it owns `/`; everything after it is a
 * destination a reader can enter from the header.
 */
export const NAV_AREAS: readonly NavArea[] = [
  AREAS.home,
  AREAS.explore,
  AREAS.components,
  AREAS.charts,
  AREAS.build,
  /*
   * Build's five subareas. Order matters: they come after the area that owns the
   * header entry, and `areaForRoute` gives the *longest* prefix the route, so
   * `/patterns/workspace` resolves to Patterns rather than to Build.
   */
  AREAS.blocks,
  AREAS.templates,
  AREAS.patterns,
  AREAS.experiences,
  AREAS.studios,
  AREAS.docs,
];

/** The front door. */
export const HOME_AREA: NavArea = AREAS.home;

/** The area a route falls back to when no prefix matches. */
export const DOCS_FALLBACK: NavArea = AREAS.docs;

/**
 * Where a route belongs.
 *
 * Longest prefix wins. `/charts/line-chart` matches `/charts`; a future area that
 * declares `/charts/financial` would win for that subtree, which is the
 * behaviour a reader expects from a nested area.
 */
export function areaForRoute(route: string): NavArea {
  const normalized = route.length > 1 ? route.replace(/\/+$/, "") : route;
  /* The front door belongs to the home area, which has no prefix to match. */
  if (normalized === "/") return HOME_AREA;
  let best: NavArea | undefined;
  let bestLength = -1;
  for (const area of NAV_AREAS) {
    for (const prefix of area.prefixes) {
      const matches = normalized === prefix || normalized.startsWith(`${prefix}/`);
      if (!matches || prefix.length <= bestLength) continue;
      best = area;
      bestLength = prefix.length;
    }
  }
  return best ?? DOCS_FALLBACK;
}

export const areaById: ReadonlyMap<string, NavArea> = new Map(
  NAV_AREAS.map((area) => [area.id as string, area]),
);

/** The areas the header lists — everything except the front door itself. */
/** Kept for compatibility: every area except Home, in header order. */
export const HEADER_AREAS: readonly NavArea[] = NAV_AREAS.filter((area) => area.id !== "home");

/**
 * The header's two tiers.
 *
 * `PRIMARY_AREAS` is the product's shape and is always visible. The rest are
 * real routes that keep working, behind one disclosure — the alternative was a
 * header where "Studios" competed with "Charts" for the same glance.
 */
export const PRIMARY_AREAS: readonly NavArea[] = NAV_AREAS.filter((area) => area.tier === "primary");
export const SECONDARY_AREAS: readonly NavArea[] = NAV_AREAS.filter(
  (area) => area.tier === "secondary" && area.id !== "home",
);
/**
 * Areas that are reachable but not destinations.
 *
 * They have a route prefix, a sidebar and a breadcrumb; they are simply found
 * through the area in `parent` instead of competing in the header.
 */
export const NESTED_AREAS: readonly NavArea[] = NAV_AREAS.filter((area) => area.tier === "nested");

/**
 * The areas nested inside one area, in header order.
 *
 * The shell uses this to decide what a nested area's sidebar says about where it
 * sits: one child is a parent link, several are a switcher (IA-007).
 */
export function nestedAreasOf(parent: NavAreaId): readonly NavArea[] {
  return NESTED_AREAS.filter((area) => area.parent === parent);
}
