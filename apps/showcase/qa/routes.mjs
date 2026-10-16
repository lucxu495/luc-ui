/**
 * The Showcase route registry.
 *
 * One entry per documented route. `mobile` and `light` mirror the coverage the
 * original monolithic script encoded: every route is captured at dark desktop,
 * and only the routes that actually exercise a narrow/light layout are captured
 * again in those variants.
 *
 * `groups` exist so a change can select the routes that plausibly exercise it
 * (see `route-map.mjs`) instead of the whole 91-route sweep.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {{ slug: string, path: string, mobile?: boolean, light?: boolean, groups: string[] }} QaRoute */

/**
 * The coverage policy: the routes that were written by hand, with the extra
 * captures a human decided they need. `ROUTES` below is this list plus
 * everything discovery found on disk.
 *
 * @type {QaRoute[]}
 */
const POLICY = [
  { slug: "home", path: "/", mobile: true, light: true, groups: ["home", "application"] },
  {
    slug: "explore",
    path: "/explore",
    mobile: true,
    light: true,
    groups: ["home", "explore", "core"],
  },
  { slug: "explore-browse", path: "/explore/browse", mobile: true, groups: ["explore"] },
  /*
   * `/visuals/**` is gone, and its QA cases went with it.
   *
   * The Phase 10A study routes were retired in the legacy cleanup, so their
   * captures were already gone; Phase 2 moved the remaining Visuals surfaces into
   * their own repository, where they have their own sweep
   * (`luc-visuals/apps/showcase/qa/run.mjs`). A route this Showcase does not serve
   * cannot be a capture policy here.
   */
  { slug: "foundations-overview", path: "/foundations", groups: ["foundations"] },
  { slug: "foundations-colors", path: "/foundations/colors", mobile: true, light: true, groups: ["foundations"] },
  { slug: "foundations-typography", path: "/foundations/typography", mobile: true, groups: ["foundations"] },
  { slug: "foundations-spacing", path: "/foundations/spacing", groups: ["foundations"] },
  { slug: "foundations-radius", path: "/foundations/radius", groups: ["foundations"] },
  { slug: "foundations-surface", path: "/foundations/surface", groups: ["foundations"] },
  { slug: "foundations-shadow", path: "/foundations/shadow", groups: ["foundations"] },
  { slug: "foundations-glow", path: "/foundations/glow", groups: ["foundations"] },
  { slug: "foundations-motion", path: "/foundations/motion", mobile: true, groups: ["foundations", "motion"] },
  {
    slug: "foundations-spatial",
    path: "/foundations/spatial",
    mobile: true,
    light: true,
    groups: ["foundations", "motion", "core"],
  },
  {
    slug: "foundations-themes",
    path: "/foundations/themes",
    mobile: true,
    light: true,
    groups: ["foundations"],
  },
  {
    slug: "foundations-personality",
    path: "/foundations/personality",
    mobile: true,
    light: true,
    groups: ["foundations", "core"],
  },
  { slug: "buttons", path: "/components/buttons", mobile: true, light: true, groups: ["core"] },
  { slug: "components-overview", path: "/components", light: true, groups: ["core"] },
  { slug: "components-slider", path: "/components/slider", mobile: true, light: true, groups: ["core", "forms"] },
  { slug: "components-menus", path: "/components/menus", mobile: true, light: true, groups: ["core", "overlays"] },
  { slug: "components-alert", path: "/components/alert", mobile: true, light: true, groups: ["core", "feedback"] },
  {
    slug: "components-empty-state",
    path: "/components/empty-state",
    mobile: true,
    light: true,
    groups: ["core", "feedback"],
  },
  { slug: "inputs", path: "/components/inputs", mobile: true, groups: ["core", "forms"] },
  { slug: "selection", path: "/components/selection", mobile: true, light: true, groups: ["core", "forms"] },
  { slug: "tabs", path: "/components/tabs", mobile: true, light: true, groups: ["core"] },
  { slug: "badges", path: "/components/badges", groups: ["core", "data"] },
  { slug: "cards", path: "/components/cards", mobile: true, light: true, groups: ["core"] },
  { slug: "overlay", path: "/components/overlay", groups: ["core", "overlays"] },
  { slug: "dialog", path: "/components/dialog", groups: ["core", "overlays"] },
  { slug: "feedback", path: "/components/feedback", light: true, groups: ["core", "feedback"] },
  { slug: "data-metrics", path: "/data/metrics", mobile: true, light: true, groups: ["data"] },
  { slug: "data-statuses", path: "/data/statuses", mobile: true, light: true, groups: ["data"] },
  { slug: "motion-border-glow", path: "/motion/border-glow", mobile: true, light: true, groups: ["motion"] },
  { slug: "motion-kinetic", path: "/motion/kinetic", mobile: true, light: true, groups: ["motion"] },
  { slug: "motion-gallery", path: "/motion", mobile: true, light: true, groups: ["motion", "home"] },
  { slug: "motion-signature", path: "/motion/signature", mobile: true, light: true, groups: ["motion", "home"] },
  {
    slug: "motion-spatial",
    path: "/motion/spatial",
    mobile: true,
    light: true,
    groups: ["motion", "spatial"],
  },
  { slug: "motion-spotlight", path: "/motion/spotlight", groups: ["motion"] },
  { slug: "motion-shimmer", path: "/motion/shimmer", groups: ["motion"] },
  { slug: "motion-number-ticker", path: "/motion/number-ticker", mobile: true, groups: ["motion"] },
  { slug: "motion-reveal", path: "/motion/reveal", groups: ["motion"] },
  { slug: "patterns", path: "/patterns", mobile: true, light: true, groups: ["patterns"] },
  /*
   * The reference experiences.
   *
   * Every one of them is a product page with real interactions, so they are
   * captured at desktop and at 390px, and the four that are hardest on a narrow
   * screen are captured in light as well.
   */
  { slug: "experiences", path: "/experiences", mobile: true, light: true, groups: ["experiences"] },
  {
    slug: "experiences-marketing",
    path: "/experiences/general/marketing",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-saas",
    path: "/experiences/general/saas",
    mobile: true,
    light: true,
    groups: ["experiences", "table", "overlays"],
  },
  {
    slug: "experiences-publishing",
    path: "/experiences/general/publishing",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-community",
    path: "/experiences/general/community",
    mobile: true,
    light: true,
    groups: ["experiences", "overlays"],
  },
  {
    slug: "experiences-career",
    path: "/experiences/personal/career",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-academic",
    path: "/experiences/personal/academic",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-portfolio",
    path: "/experiences/personal/portfolio",
    mobile: true,
    light: true,
    groups: ["experiences", "motion"],
  },
  {
    slug: "experiences-garden",
    path: "/experiences/personal/garden",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-ai",
    path: "/experiences/vertical/ai",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-science",
    path: "/experiences/vertical/science",
    mobile: true,
    light: true,
    groups: ["experiences", "charts"],
  },
  {
    slug: "experiences-finance",
    path: "/experiences/vertical/finance",
    mobile: true,
    light: true,
    groups: ["experiences", "charts", "table"],
  },
  {
    slug: "experiences-commerce",
    path: "/experiences/vertical/commerce",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-education",
    path: "/experiences/vertical/education",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-media",
    path: "/experiences/vertical/media",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-productivity",
    path: "/experiences/vertical/productivity",
    mobile: true,
    light: true,
    groups: ["experiences"],
  },
  {
    slug: "experiences-forum",
    path: "/experiences/vertical/forum",
    mobile: true,
    light: true,
    groups: ["experiences", "overlays"],
  },
  { slug: "patterns-industries", path: "/patterns/industries", mobile: true, light: true, groups: ["patterns", "core"] },
  { slug: "components-select", path: "/components/select", mobile: true, light: true, groups: ["core", "overlays"] },
  {
    slug: "components-combobox",
    path: "/components/combobox",
    mobile: true,
    light: true,
    groups: ["core", "overlays"],
  },
  { slug: "components-sheet", path: "/components/sheet", mobile: true, groups: ["core", "overlays"] },
  { slug: "components-toast", path: "/components/toast", mobile: true, light: true, groups: ["core", "overlays", "feedback"] },
  { slug: "components-command", path: "/components/command", mobile: true, groups: ["core", "overlays"] },
  { slug: "components-accordion", path: "/components/accordion", mobile: true, light: true, groups: ["core", "overlays"] },
  { slug: "components-toggle", path: "/components/toggle", mobile: true, light: true, groups: ["core", "forms"] },
  { slug: "components-avatar", path: "/components/avatar", mobile: true, light: true, groups: ["core", "data"] },
  { slug: "components-pagination", path: "/components/pagination", light: true, groups: ["core", "data"] },
  {
    slug: "components-alert-dialog",
    path: "/components/alert-dialog",
    light: true,
    groups: ["core", "overlays", "feedback"],
  },
  { slug: "components-timeline", path: "/components/timeline", mobile: true, light: true, groups: ["core", "feedback"] },
  { slug: "components-carousel", path: "/components/carousel", mobile: true, light: true, groups: ["core"] },
  { slug: "components-field-parts", path: "/components/field-parts", mobile: true, light: true, groups: ["core", "forms"] },
  {
    slug: "components-tree-view",
    path: "/components/tree-view",
    mobile: true,
    light: true,
    groups: ["core"],
  },
  { slug: "components-board", path: "/components/board", mobile: true, light: true, groups: ["core"] },
  {
    slug: "components-color-picker",
    path: "/components/color-picker",
    mobile: true,
    light: true,
    groups: ["core", "forms"],
  },
  { slug: "components-media", path: "/components/media", mobile: true, light: true, groups: ["core"] },
  {
    slug: "components-notifications",
    path: "/components/notifications",
    mobile: true,
    light: true,
    groups: ["core", "overlays"],
  },
  { slug: "components-ai", path: "/components/ai", mobile: true, light: true, groups: ["core"] },
  { slug: "data-table", path: "/data/table", mobile: true, light: true, groups: ["data", "table"] },
  { slug: "data-table-virtualized", path: "/data/table-virtualized", groups: ["data", "table"] },
  { slug: "patterns-table-filters", path: "/patterns/table-filters", groups: ["patterns", "table"] },
  { slug: "patterns-command-palette", path: "/patterns/command-palette", groups: ["patterns", "overlays"] },
  { slug: "patterns-chart-table", path: "/patterns/chart-table", light: true, groups: ["patterns", "charts", "table"] },
  {
    slug: "patterns-data-details",
    path: "/patterns/data-details",
    mobile: true,
    light: true,
    groups: ["patterns", "charts", "overlays", "data"],
  },
  { slug: "patterns-workspace", path: "/patterns/workspace", groups: ["patterns", "application"] },
  { slug: "application-shell", path: "/application", mobile: true, light: true, groups: ["application"] },
  { slug: "application-navigation", path: "/application/navigation", light: true, groups: ["application"] },
  {
    slug: "application-workspace",
    path: "/application/workspace",
    mobile: true,
    light: true,
    groups: ["application"],
  },
  { slug: "application-url-state", path: "/application/url-state", light: true, groups: ["application"] },
  {
    slug: "application-outline-drawer",
    path: "/application/outline-drawer",
    mobile: true,
    light: true,
    groups: ["application"],
  },
  { slug: "application-packaging", path: "/application/packaging", groups: ["application"] },
  {
    slug: "patterns-research-workspace",
    path: "/patterns/research-workspace",
    mobile: true,
    light: true,
    groups: ["patterns", "application", "charts"],
  },
  { slug: "components-number", path: "/components/number", mobile: true, light: true, groups: ["forms"] },
  { slug: "components-password", path: "/components/password", light: true, groups: ["forms"] },
  { slug: "components-otp", path: "/components/otp", mobile: true, groups: ["forms"] },
  { slug: "components-file-upload", path: "/components/file-upload", light: true, groups: ["forms"] },
  { slug: "components-tags", path: "/components/tags", groups: ["forms"] },
  { slug: "forms-overview", path: "/forms", mobile: true, light: true, groups: ["forms"] },
  { slug: "forms-validation", path: "/forms/validation", light: true, groups: ["forms"] },
  { slug: "forms-async", path: "/forms/async", groups: ["forms"] },
  { slug: "forms-sections", path: "/forms/sections", mobile: true, groups: ["forms"] },
  { slug: "date-time-calendar", path: "/date-time/calendar", mobile: true, light: true, groups: ["datetime"] },
  { slug: "date-time-date-picker", path: "/date-time/date-picker", light: true, groups: ["datetime"] },
  { slug: "date-time-date-range", path: "/date-time/date-range", mobile: true, light: true, groups: ["datetime"] },
  { slug: "date-time-time", path: "/date-time/time", groups: ["datetime"] },
  {
    slug: "patterns-table-date-filter",
    path: "/patterns/table-date-filter",
    light: true,
    groups: ["patterns", "datetime", "table"],
  },
  {
    slug: "patterns-chart-date-filter",
    path: "/patterns/chart-date-filter",
    groups: ["patterns", "datetime", "charts"],
  },
  { slug: "patterns-settings-form", path: "/patterns/settings-form", light: true, groups: ["patterns", "forms"] },
  { slug: "charts-overview", path: "/charts", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-architecture", path: "/charts/architecture", groups: ["charts"] },
  { slug: "charts-timeseries", path: "/charts/timeseries", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-comparison", path: "/charts/comparison", mobile: true, groups: ["charts"] },
  { slug: "charts-distribution", path: "/charts/distribution", groups: ["charts"] },
  { slug: "charts-relationship", path: "/charts/relationship", groups: ["charts"] },
  /*
   * `/charts/uncertainty` is linked from the sidebar like every other chart
   * route, but it was missing from this registry — so it was never captured,
   * never axe-scanned and never included in a browser QA run. The registry is
   * the coverage contract: a page the navigation advertises belongs here.
   */
  { slug: "charts-uncertainty", path: "/charts/uncertainty", mobile: true, groups: ["charts"] },
  { slug: "charts-matrix", path: "/charts/matrix", light: true, groups: ["charts"] },
  { slug: "charts-composition", path: "/charts/composition", groups: ["charts"] },
  { slug: "charts-flow", path: "/charts/flow", groups: ["charts"] },
  { slug: "charts-radial", path: "/charts/radial", groups: ["charts"] },
  { slug: "charts-composed", path: "/charts/composed", groups: ["charts"] },
  { slug: "charts-research", path: "/charts/research", groups: ["charts"] },
  { slug: "charts-financial", path: "/charts/financial", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-sync", path: "/charts/sync", groups: ["charts"] },
  { slug: "charts-interaction", path: "/charts/interaction", groups: ["charts"] },
  { slug: "charts-performance", path: "/charts/performance", groups: ["charts"] },
  { slug: "charts-sizing", path: "/charts/sizing", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-statistical", path: "/charts/statistical", groups: ["charts"] },
  { slug: "charts-scientific", path: "/charts/scientific", groups: ["charts"] },
  { slug: "charts-workflow", path: "/charts/workflow", groups: ["charts"] },
  { slug: "charts-quantitative", path: "/charts/quantitative", mobile: true, groups: ["charts"] },
  { slug: "charts-multidimensional", path: "/charts/multidimensional", groups: ["charts"] },
  { slug: "charts-diagnostics", path: "/charts/diagnostics", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-networks", path: "/charts/networks", groups: ["charts"] },
  { slug: "charts-geospatial", path: "/charts/geospatial", groups: ["charts"] },
  { slug: "charts-surfaces", path: "/charts/surfaces", mobile: true, light: true, groups: ["charts"] },
  { slug: "charts-catalog", path: "/charts/catalog", mobile: true, light: true, groups: ["charts"] },
  /*
   * TradingView integrations are the only routes that depend on third-party
   * resources at runtime. `qa:full` exercises them against the deterministic
   * provider stub; `qa:providers` is the only tier that talks to the real
   * provider (see `docs/QA_WORKFLOW.md`).
   */
  {
    slug: "tradingview-overview",
    path: "/integrations/tradingview",
    mobile: true,
    light: true,
    groups: ["providers"],
  },
  {
    slug: "tradingview-charts",
    path: "/integrations/tradingview/charts",
    mobile: true,
    light: true,
    groups: ["providers"],
  },
  { slug: "tradingview-watchlists", path: "/integrations/tradingview/watchlists", groups: ["providers"] },
  { slug: "tradingview-tickers", path: "/integrations/tradingview/tickers", mobile: true, groups: ["providers"] },
  { slug: "tradingview-heatmaps", path: "/integrations/tradingview/heatmaps", light: true, groups: ["providers"] },
  { slug: "tradingview-screeners", path: "/integrations/tradingview/screeners", groups: ["providers"] },
  {
    slug: "tradingview-symbol-details",
    path: "/integrations/tradingview/symbol-details",
    mobile: true,
    groups: ["providers"],
  },
  { slug: "tradingview-news-calendars", path: "/integrations/tradingview/news-calendars", groups: ["providers"] },
  { slug: "tradingview-themes", path: "/integrations/tradingview/themes", light: true, groups: ["providers"] },
  { slug: "tradingview-patterns", path: "/integrations/tradingview/patterns", mobile: true, groups: ["providers"] },
];

/*
 * The Feedback family, and the Navigation pages the last two batches rewrote.
 *
 * Discovery sweeps a generated page at dark desktop only, on the argument that
 * a documentation page assembled from the registry "has no narrow or
 * light-specific layout to miss". Feedback is the counter-example that argument
 * was missing: a toast viewport, a notification panel and a tour card are
 * `position: fixed` layers whose whole behaviour is where they land on a small
 * screen, and a progress row is a width-sensitive control. The policy table is
 * how a route gets the two extra variants, so the family is registered by hand —
 * and so is the Navigation work, whose 390 px focusable-scroll defect was only
 * found because it was checked by hand.
 */
POLICY.push(
  { slug: "components-progress", path: "/components/progress", mobile: true, light: true, groups: ["feedback"] },
  { slug: "components-spinner", path: "/components/spinner", mobile: true, light: true, groups: ["feedback"] },
  { slug: "components-skeleton", path: "/components/skeleton", mobile: true, light: true, groups: ["feedback"] },
  { slug: "components-result", path: "/components/result", mobile: true, light: true, groups: ["feedback"] },
  {
    slug: "components-guided-tour",
    path: "/components/guided-tour",
    mobile: true,
    light: true,
    groups: ["feedback"],
  },
  { slug: "components-stepper", path: "/components/stepper", mobile: true, light: true, groups: ["core"] },
);

/** The path prefix that marks a provider-backed route. */
export const PROVIDER_PREFIX = "/integrations/tradingview";

/*
 * The Design Lab treatments.
 *
 * These used to be deliberately absent from both navigation and this registry,
 * which is exactly how they became invisible: a route nobody links is a route
 * nobody reviews. They are now first-class navigation *and* first-class QA, so
 * the standard tiers cover the experiment that Phase 2 promotes from.
 */
export const EXPERIMENT_ROUTES = [
  { slug: "design-lab", path: "/experiments/design-lab", mobile: true, light: true, groups: ["experiments"] },
  {
    slug: "design-lab-precision",
    path: "/experiments/design-lab/precision-instrument",
    mobile: true,
    light: true,
    groups: ["experiments", "table", "charts"],
  },
  {
    slug: "design-lab-editorial",
    path: "/experiments/design-lab/editorial-research",
    mobile: true,
    light: true,
    groups: ["experiments", "table", "charts"],
  },
  {
    slug: "design-lab-focused",
    path: "/experiments/design-lab/focused-workspace",
    mobile: true,
    light: true,
    groups: ["experiments", "table", "charts", "application"],
  },
];

POLICY.push(...EXPERIMENT_ROUTES);

/*
 * ---------------------------------------------------------------------------
 * Discovery
 * ---------------------------------------------------------------------------
 *
 * Every route on disk is measured. The table above is a *coverage policy*, not
 * the definition of the sweep: it says which routes deserve a narrow-screen and
 * a light-mode capture, and which families a change plausibly touches. A route
 * that is not listed here — every page Phase 9 generates from the documentation
 * registry, and anything a future phase adds — is discovered from the file
 * system and swept at dark desktop.
 *
 * That distinction is deliberate. Phase 8 registered 91 routes by hand while 148
 * existed, so a page could ship unmeasured and the summary still read "all
 * green". A registry that has to be updated by hand for a page to be tested is
 * a registry that will be out of date.
 */
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app");

/*
 * Dynamic routes are swept through one real entry, not through their literal
 * path.
 *
 * `/components/[component]` has no page of its own: discovery used to hand the
 * literal `[component]` to the browser, Next answered 404, and the run recorded
 * a console error — while the ~150 pages the segment actually serves were never
 * measured at all. A dynamic segment is a route *shape*, so it is swept with a
 * concrete id taken from the documentation registry, which is the same list the
 * `generateStaticParams` of that route is built from.
 */
const registrySource = (() => {
  try {
    return readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib/docs/generated/registry.ts"),
      "utf8",
    );
  } catch {
    return "";
  }
})();

/*
 * The compact projection, read for one fact: which families exist.
 *
 * `generated/registry.ts` carries families *and* their entries, which are entry
 * ids; the family ids are on the nav rows. Reading them here keeps
 * `/docs/reference/[family]`'s sweep derived from the registry rather than from a
 * list somebody has to remember to update.
 */
const navSource = (() => {
  try {
    return readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib/docs/generated/nav.ts"),
      "utf8",
    );
  } catch {
    return "";
  }
})();

/** Every documented route, with the coverage status the registry assigns it. */
function documentedRoutes() {
  const found = [];
  for (const match of registrySource.matchAll(
    /"route": "(\/[^"]+)",\s*\n\s*"status": "([^"]+)"/g,
  )) {
    found.push({ route: match[1], status: match[2] });
  }
  return found;
}

/**
 * Every route a *registry entry* owns, excluding the reference rows.
 *
 * This is the canonical source for the pages that have no `page.tsx` of their
 * own: `app/components/[component]`, `app/charts/[chart]` and
 * `app/motion/[motion]` are three dynamic segments that together serve ~150
 * documented pages, and before this existed the sweep measured **three of them
 * each** — a first, a middle and a last. That heuristic was defensible when the
 * generated pages were a handful of near-identical tables; it stopped being
 * defensible once those pages started carrying their own examples and their own
 * defects. `/components/stepper` is the case that proves it: a page whose
 * 390 px overflow was found by hand because the sweep never opened it.
 *
 * Reference-only rows are dropped on purpose. They are rows that exist to keep
 * a module's exports visible somewhere, they share a route with the page that
 * documents them, and a route is swept once — so they are unioned into the set
 * below by *path*, not treated as pages of their own.
 */
function registryEntryRoutes() {
  return documentedRoutes()
    .filter((entry) => entry.status !== "reference")
    .map((entry) => entry.route);
}

/**
 * The family index pages the *same* dynamic segment serves.
 *
 * `app/components/[component]/page.tsx` answers two shapes: an entry
 * (`/components/alert`) and a family index (`/components/actions`), because its
 * `generateStaticParams` is entries ∪ families. Only the entry half was swept —
 * nine family indexes were in no browser gate at all, including
 * `/components/feedback`, which is the page this batch had to rewrite. A family
 * index is a curated overview with examples on it, so it needs the same
 * treatment as any other page.
 *
 * Only the `components` group has them; the chart and motion families keep their
 * landing routes in the policy table and have no `/charts/<family>` page.
 */
function componentFamilyRoutes() {
  const header = "export const generatedFamilies = [";
  const start = registrySource.indexOf(header);
  if (start < 0) return [];
  const open = start + header.length - 1;
  const close = registrySource.indexOf("\n] as const", open);
  if (close < 0) return [];
  try {
    /* Parsed, not pattern-matched: the array is plain JSON, and a regex over it
     * silently swallowed the first family the last time this was attempted. */
    const families = JSON.parse(registrySource.slice(open, close + 2));
    return families
      .filter((family) => family.group === "components")
      .map((family) => `/components/${family.id}`);
  } catch {
    return [];
  }
}

/**
 * Representative paths for a dynamic route: up to three *generated* pages under
 * the same prefix — the first, the middle and the last in registry order, so
 * the choice is stable across runs and the sweep covers the shape at both ends
 * of the catalogue rather than one lucky entry.
 *
 * A generated page is chosen over a curated one because a curated page is
 * already in the policy table above with its own mobile/light coverage; the
 * generated page is the one that would otherwise never be swept.
 */
function representativesFor(bracketPath) {
  /*
   * `/docs/reference/[family]` is not a registry *entry* shape — the registry
   * documents components, charts and motion primitives, while this route serves
   * the 27 documentation families (DOC-002). So it is swept through every family
   * that has an entry, which is also the "nothing was lost in the split" check:
   * 27 rows and 217 symbols across them, all still answering 200.
   */
  if (bracketPath === "/docs/reference/[family]") {
    const families = [
      ...new Set([...navSource.matchAll(/"f": "([^"]+)"/g)].map((match) => match[1])),
    ].sort();
    return families.map((family) => `/docs/reference/${family}`);
  }
  const prefix = bracketPath.slice(0, bracketPath.lastIndexOf("/") + 1);
  const depth = prefix.split("/").filter(Boolean).length + 1;
  /*
   * Every registry route under this prefix, not a sample of three.
   *
   * The registry is the list `generateStaticParams` is built from, so a route
   * in it is a page that really exists; a shape with no registry routes under
   * it (the Visuals element segment) still falls back to the sample, because
   * there is no canonical list to enumerate for it.
   */
  const under = [...registryEntryRoutes(), ...componentFamilyRoutes()].filter(
    (route) =>
      route.startsWith(prefix) && route.split("/").filter(Boolean).length === depth,
  );
  if (under.length > 0) return [...new Set(under)];
  const candidates = documentedRoutes().filter(
    (entry) =>
      entry.status === "generated" &&
      entry.route.startsWith(prefix) &&
      entry.route.split("/").filter(Boolean).length === depth,
  );
  if (candidates.length === 0) return [];
  const middle = candidates[Math.floor(candidates.length / 2)];
  return [...new Set([candidates[0]?.route, middle?.route, candidates.at(-1)?.route])].filter(
    (route) => typeof route === "string",
  );
}

/** The group a discovered route belongs to, from its path. */
function groupForRoute(route) {
  if (route === "/") return "home";
  const [first] = route.slice(1).split("/");
  switch (first) {
    case "docs":
      return "docs";
    case "components":
      return "core";
    case "charts":
      return "charts";
    case "motion":
      return "motion";
    case "studios":
      return "studios";
    case "blocks":
    case "templates":
      return "experiences";
    default:
      return "auto";
  }
}

/** `page.tsx` files on disk, as route paths. */
function discoverRoutes(dir = appDir, base = "") {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      found.push(...discoverRoutes(full, `${base}${segment}`));
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      found.push(base === "" ? "/" : base);
    }
  }
  return found;
}

const registeredPaths = new Set(POLICY.map((route) => route.path));
const discovered = discoverRoutes()
  .filter((path) => !registeredPaths.has(path))
  .sort((a, b) => a.localeCompare(b))
  /*
   * A bracket path becomes the pages it really serves. An empty result means
   * the registry has no generated page of that shape, in which case there is
   * nothing concrete to measure and the shape is dropped rather than probed at
   * a URL that cannot exist.
   */
  .flatMap((path) => {
    if (!path.includes("[")) return [path];
    return representativesFor(path);
  })
  /*
   * …and the policy wins over discovery, in both directions.
   *
   * Expanding a dynamic shape can produce a route the policy table already
   * carries (`/components/alert` is a curated page *and* a registry entry), and
   * that row must keep its curated coverage flags rather than becoming a second
   * row for the same URL with dark-desktop-only defaults.
   */
  .filter((path) => !registeredPaths.has(path))
  .filter((path, index, list) => list.indexOf(path) === index)
  .map((path) => {
    const slug = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    return {
      slug,
      path,
      /* Dark desktop only: a generated documentation page has no narrow or
       * light-specific layout to miss, and 180 of them at three variants each
       * would cost more than it proves. */
      mobile: false,
      light: false,
      groups: [groupForRoute(path)],
    };
  });

/*
 * A path that is listed twice (once by hand, once discovered) would be swept
 * twice, so the union is explicit rather than assumed — and `registeredPaths`
 * contains a stale entry if a page is removed, which `i18n-coverage` reports.
 */
/** Every route on disk: the policy table plus what discovery found. */
export const ROUTES = Object.freeze([...POLICY, ...discovered]);

/** @deprecated kept so existing QA modules keep importing one name. */
export const SWEEP_ROUTES = ROUTES;

export function isProviderPath(pathname) {
  return pathname.startsWith(PROVIDER_PREFIX);
}

export function isProviderRoute(route) {
  return isProviderPath(route.path);
}

/** All route slugs, in registry order. */
export const ROUTE_SLUGS = ROUTES.map((route) => route.slug);

/** Every route slug in a named group. */
export function slugsInGroup(group) {
  return ROUTES.filter((route) => route.groups.includes(group)).map((route) => route.slug);
}


export function routeBySlug(slug) {
  return ROUTES.find((route) => route.slug === slug);
}

/**
 * Resolve a selection of slugs to routes, preserving registry order so a run's
 * output does not depend on how the selection was written.
 */
export function selectRoutes(slugs) {
  if (!slugs || slugs.length === 0) return [];
  const wanted = new Set(slugs);
  return SWEEP_ROUTES.filter((route) => wanted.has(route.slug));
}

/**
 * A broad-but-cheap default when a change cannot be mapped confidently.
 * Deliberately mixes families: foundations, a core control, an overlay, a
 * chart, a table, a form, the app shell and one provider wrapper page.
 */
export const SMOKE_SLUGS = [
  "home",
  "foundations-colors",
  "buttons",
  "components-menus",
  "data-table",
  "charts-timeseries",
  "forms-overview",
  "application-shell",
  "patterns-research-workspace",
  "tradingview-overview",
];

/** Groups a caller can pass to `--group`. */
export const ROUTE_GROUPS = [
  "home",
  "docs",
  "studios",
  "auto",
  "foundations",
  "core",
  "overlays",
  "feedback",
  "data",
  "table",
  "motion",
  "spatial",
  "charts",
  "forms",
  "datetime",
  "application",
  "patterns",
  "experiences",
  "providers",
  "experiments",
];
