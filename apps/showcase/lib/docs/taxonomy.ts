/*
 * The handwritten half of the documentation registry.
 *
 * `scripts/docs-registry.mjs` combines this file with the *generated* export
 * catalog (`luc-ui/docs/component-catalog.json`) and the verified chart
 * registry (`components/charts/chart-catalog-data.ts`) to produce
 * `lib/docs/generated/registry.json`. Nothing here states an export name, an
 * import path or a signature — those come from the catalog, so they cannot be
 * wrong. What lives here is judgement: which family a module belongs to, what
 * page it deserves, and how it reads in the sidebar.
 *
 * The unit of a component page is the **source module**, because that is the
 * unit the public API actually has: `packages/ui/src/components/dropdown-menu.tsx`
 * is one import and one contract, even though it exports fifteen symbols. A
 * chart is the exception — every chart is its own page, because a chart is a
 * distinct scientific claim and not a part of a composite.
 */

import type { DocGroup } from "./types";

/** A module key is its path under `packages/ui/src`, without the extension. */
export type ModuleKey = string;

export interface FamilySpec {
  id: string;
  title: string;
  summary: string;
  group: DocGroup;
  /** Modules in reading order. Order is the sidebar order. */
  modules: ModuleKey[];
}

export interface RouteOverride {
  /** Canonical id, when it differs from the module basename. */
  id?: string;
  /** Explicit route, when a real page already exists at a different path. */
  route?: string;
  /** Display title, when the module name is not the public name. */
  title?: string;
  /** One sentence, replacing the module's derived summary. */
  summary?: string;
  /** Skip the page; keep the exports visible on a family page. */
  referenceOnly?: boolean;
}

export const DOC_GROUPS: DocGroup[] = ["components", "charts", "motion", "integrations"];

export const GROUP_META: Record<DocGroup, { title: string; route: string; summary: string }> = {
  components: {
    title: "Components",
    route: "/components",
    summary:
      "Every public primitive and composite, organised by the job it does — actions, forms, navigation, feedback, overlays and data display.",
  },
  charts: {
    title: "Charts",
    route: "/charts",
    summary:
      "The charting surface: general time series, distributions, statistics, financial risk, scientific fields, matrices and networks.",
  },
  motion: {
    title: "Motion",
    route: "/motion",
    summary:
      "Spatial and expressive motion — typographic effects, surfaces that respond to a pointer, depth and layered composition.",
  },
  integrations: {
    title: "Integrations",
    route: "/integrations/tradingview",
    summary:
      "Third-party surfaces wrapped behind a LUC contract. Today: the TradingView widget catalogue.",
  },
};

/*
 * Component families.
 *
 * A family is a sidebar heading, not a route: it has no page of its own beyond
 * the group index. Three levels is the maximum the sidebar can carry before it
 * stops being a map (group → family → component).
 */
export const COMPONENT_FAMILIES: FamilySpec[] = [
  {
    id: "actions",
    title: "Actions",
    summary: "Things a person presses, and the chrome that gathers them.",
    group: "components",
    modules: [
      "components/button-base",
      "components/icon-button",
      "components/icon",
      "components/float-button",
      "components/button-group",
      "components/toggle",
      "components/link",
      "components/kbd",
    ],
  },
  {
    id: "forms",
    title: "Forms",
    summary: "Inputs, their validation surfaces and the form lifecycle around them.",
    group: "components",
    modules: [
      "components/input",
      "components/textarea",
      "components/native-select",
      "components/select",
      "components/combobox",
      "components/checkbox",
      "components/radio-group",
      "components/switch",
      "components/slider",
      "components/segmented-control",
      "components/rating",
      "components/search-input",
      "components/input-group",
      "components/file-upload",
      "forms/form",
      "forms/sections",
      "forms/inputs/number-input",
      "forms/inputs/password-input",
      "forms/inputs/otp-input",
      "forms/inputs/file-input",
      "forms/inputs/tag-input",
      "components/color-picker",
      "components/field",
      "components/label",
    ],
  },
  {
    id: "date-time",
    title: "Date and time",
    summary:
      "Wall-clock values with explicit types — a date is never a `Date`, and a time zone is never implicit.",
    group: "components",
    modules: [
      "datetime/calendar",
      "datetime/date-picker",
      "datetime/datetime-picker",
      "datetime/month-year-picker",
      "datetime/time-picker",
    ],
  },
  {
    id: "layout",
    title: "Layout",
    summary: "Space, rhythm and the surfaces a page is made of.",
    group: "components",
    modules: [
      "layout/container",
      "layout/grid",
      "layout/inline",
      "layout/stack",
      "layout/section",
      "components/card",
      "components/panel",
      "components/separator",
      "components/scroll-area",
      "components/aspect-ratio",
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    summary: "Where am I, and how do I get somewhere else without losing my place.",
    group: "components",
    modules: [
      "app-shell/app-shell",
      "app-shell/sidebar",
      "app-shell/breadcrumbs",
      "app-shell/page-header",
      "components/tabs",
      "components/pagination",
      "components/stepper",
      "components/tree-view",
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    summary: "What the product says when something happened, is happening, or did not.",
    group: "components",
    modules: [
      "components/alert",
      "components/progress",
      "components/spinner",
      "components/skeleton",
      "components/empty-state",
      "components/result",
      "data/status-badge",
      "components/toast",
      "components/notification-center",
      "components/guided-tour",
    ],
  },
  {
    id: "overlays",
    title: "Overlays",
    summary:
      "Content that leaves the flow, or reveals itself in place — and the focus contract that has to come with it.",
    group: "components",
    modules: [
      "components/accordion",
      "components/dialog",
      "components/alert-dialog",
      "components/sheet",
      "components/popover",
      "components/hover-card",
      "components/tooltip",
      "components/dropdown-menu",
      "components/context-menu",
      "components/command",
    ],
  },
  {
    id: "data-display",
    title: "Data display",
    summary: "Dense, sortable, scannable: the surfaces a real product reads numbers from.",
    group: "components",
    modules: [
      "table/data-table",
      "table/virtual-data-table",
      "table/data-table-toolbar",
      "table/data-table-pagination",
      "table/facet-filter",
      "table/column-visibility-menu",
      "components/timeline",
      "components/list",
      "components/transfer-list",
      "components/kanban-board",
      "components/sortable-list",
      "data/metric",
      "data/delta",
      "data/stat-card",
      "data/timestamp",
      "data/data-details",
      "components/badge",
    ],
  },
  {
    id: "media",
    title: "Media",
    summary: "People, pictures and the surfaces that present them.",
    group: "components",
    modules: [
      "components/avatar",
      "components/carousel",
      "components/image-gallery",
      "components/image-compare",
    ],
  },
  {
    id: "application",
    title: "Application",
    summary:
      "The frame a product lives in: shell, resizable panes, inspectors, providers and URL state.",
    group: "components",
    modules: [
      "workspace/workspace",
      "workspace/inspector",
      "workspace/outline-drawer",
      "app-shell/navigation-context",
      "url-state/index",
      "providers/luc-provider",
      "providers/theme-provider",
      "providers/locale-provider",
    ],
  },
  {
    id: "ai",
    title: "AI",
    summary:
      "The conversation surface: messages, streaming text, tool calls and the activity a user has to be able to interrupt.",
    group: "components",
    modules: ["components/ai"],
  },
  {
    id: "typography",
    title: "Typography",
    summary: "Roles rather than sizes, and numerals that never lie about their alignment.",
    group: "components",
    modules: ["components/typography"],
  },
  {
    id: "experiences",
    title: "Experiences",
    summary:
      "Assemblies a personal site is actually made of — hero, timeline, projects, publications, reading, `/now`.",
    group: "components",
    modules: [
      "experiences/profile-hero",
      "experiences/social-links",
      "experiences/experience-timeline",
      "experiences/project-showcase",
      "experiences/publication-list",
      "experiences/reading-shelf",
      "experiences/now-section",
    ],
  },
];

/*
 * Motion families.
 *
 * Grouped by what the effect acts on, because that is how a developer looks for
 * one: "something that moves my text", "something that reacts to the pointer",
 * "something that adds depth".
 */
export const MOTION_FAMILIES: FamilySpec[] = [
  {
    id: "motion-typography",
    title: "Typography",
    summary: "Words that arrive, resolve or count themselves into place.",
    group: "motion",
    modules: [
      "motion/kinetic-headline",
      "motion/text-reveal",
      "motion/number-ticker",
      "motion/shimmer",
    ],
  },
  {
    id: "motion-surfaces",
    title: "Surfaces",
    summary: "Panels that respond to a pointer, a scroll or a state change.",
    group: "motion",
    modules: [
      "motion/spotlight-surface",
      "motion/glare-surface",
      "motion/tilt-surface",
      "motion/border-glow",
      "motion/border-trail",
      "motion/aurora-surface",
      "motion/motion-surface",
      "motion/interactive-grid",
      "motion/beam-flow",
      "motion/marquee",
    ],
  },
  {
    id: "motion-spatial",
    title: "Spatial",
    summary: "Depth, layering and geometry — motion that reads as physical space.",
    group: "motion",
    modules: [
      "motion/card-stack",
      "motion/morphing-dialog",
      "motion/morphing-popover",
      "motion/parallax-scene",
      "motion/magnify-dock",
      "motion/orbit-field",
    ],
  },
  {
    id: "motion-feedback",
    title: "Feedback",
    summary: "A press, a change, a selection — acknowledged without shouting.",
    group: "motion",
    modules: [
      "motion/pressable",
      "motion/press-ripple",
      "motion/click-burst",
      "motion/data-change-flash",
      "motion/selection-beam",
      "motion/shared-highlight",
      "motion/icon-morph",
      "motion/presence",
      "motion/collapse",
      "motion/stagger",
      "motion/reveal",
      "motion/transition-panel",
      "motion/expandable-surface",
      "motion/magnetic",
      "motion/intensity",
    ],
  },
];

/*
 * Integrations are page-level, not module-level: the TradingView widget
 * catalogue is already documented as ten category pages, and a developer looks
 * for "heatmaps", not for `heatmaps.ts`.
 */
export interface IntegrationPage {
  id: string;
  title: string;
  route: string;
  summary: string;
  /** Modules whose exports the page documents. */
  modules: ModuleKey[];
}

export const INTEGRATION_PAGES: IntegrationPage[] = [
  {
    id: "tradingview-charts",
    title: "Charts",
    route: "/integrations/tradingview/charts",
    summary: "Advanced chart, mini chart, symbol overview and seasonal chart widgets.",
    modules: ["integrations/tradingview/widgets/charts"],
  },
  {
    id: "tradingview-watchlists",
    title: "Watchlists and market data",
    route: "/integrations/tradingview/watchlists",
    summary: "Watchlist, market overview, market summary and world market summary.",
    modules: ["integrations/tradingview/widgets/watchlists"],
  },
  {
    id: "tradingview-tickers",
    title: "Tickers",
    route: "/integrations/tradingview/tickers",
    summary: "Ticker tape, single ticker, the tickers composition and a symbol tag.",
    modules: ["integrations/tradingview/widgets/tickers"],
  },
  {
    id: "tradingview-heatmaps",
    title: "Heatmaps",
    route: "/integrations/tradingview/heatmaps",
    summary: "Stock, crypto, ETF and forex heatmaps in one comparison.",
    modules: ["integrations/tradingview/widgets/heatmaps"],
  },
  {
    id: "tradingview-screeners",
    title: "Screeners",
    route: "/integrations/tradingview/screeners",
    summary: "The market screener and the cryptocurrency market widget.",
    modules: ["integrations/tradingview/widgets/screeners"],
  },
  {
    id: "tradingview-symbol-details",
    title: "Symbol details",
    route: "/integrations/tradingview/symbol-details",
    summary: "Symbol info, company profile, fundamentals, technicals and broker reviews.",
    modules: [
      "integrations/tradingview/widgets/symbol-details",
      "integrations/tradingview/widgets/brokers",
    ],
  },
  {
    id: "tradingview-news-calendars",
    title: "News and calendars",
    route: "/integrations/tradingview/news-calendars",
    summary: "Top stories, the economic calendar and the economic map.",
    modules: [
      "integrations/tradingview/widgets/news",
      "integrations/tradingview/widgets/calendars",
      "integrations/tradingview/widgets/economics",
    ],
  },
  {
    id: "tradingview-themes",
    title: "Theme bridge",
    route: "/integrations/tradingview/themes",
    summary: "How LUC tokens reach a provider surface, and what cannot cross the boundary.",
    modules: ["integrations/tradingview/core/theme"],
  },
  {
    id: "tradingview-patterns",
    title: "Patterns",
    route: "/integrations/tradingview/patterns",
    summary: "Whole-page recipes that combine provider widgets with LUC components.",
    modules: [],
  },
];

/*
 * Route overrides.
 *
 * Two kinds, and both are about not shipping a second page for the same thing:
 *
 *  - a module whose real, richer page already exists at a different path
 *    (`components/select` → `/components/select` needs none; `components/card`
 *    → `/components/cards` does);
 *  - a module that should not have a page at all, because it is a part or a
 *    helper (`components/callout` lives inside `components/alert`).
 */
export const ROUTE_OVERRIDES: Record<ModuleKey, RouteOverride> = {
  "components/accordion": {
    id: "accordion",
    route: "/components/accordion",
    title: "Accordion",
  },
  "components/badge": {
    id: "badge",
    route: "/components/badges",
    title: "Badge",
  },
  "components/file-upload": {
    id: "file-upload",
    route: "/components/file-upload",
    title: "FileUpload",
  },
  "motion/kinetic-headline": {
    id: "kinetic-headline",
    route: "/motion/kinetic",
    title: "KineticHeadline",
  },
  "motion/spotlight-surface": {
    id: "spotlight-surface",
    route: "/motion/spotlight",
    title: "SpotlightSurface",
  },
  "forms/inputs/otp-input": {
    id: "otp-input",
    route: "/components/otp",
    title: "OtpInput",
  },
  "forms/inputs/password-input": {
    id: "password-input",
    route: "/components/password",
    title: "PasswordInput",
  },
  "components/button-base": {
    id: "button",
    route: "/components/buttons",
    title: "Button",
  },
  "components/card": {
    id: "card",
    route: "/components/cards",
    title: "Card",
  },
  "components/input": {
    id: "input",
    route: "/components/inputs",
    title: "Input",
  },
  "components/dropdown-menu": { id: "dropdown-menu", route: "/components/menus" },
  "components/context-menu": { id: "context-menu", route: "/components/menus" },
  "components/kanban-board": {
    id: "kanban-board",
    route: "/components/board",
    title: "KanbanBoard",
  },
  "components/notification-center": {
    id: "notification-center",
    route: "/components/notifications",
    title: "NotificationCenter",
  },
  "forms/inputs/number-input": {
    id: "number-input",
    route: "/components/number",
    title: "NumberInput",
  },
  "forms/inputs/tag-input": {
    id: "tag-input",
    route: "/components/tags",
    title: "TagInput",
  },
  "forms/inputs/file-input": {
    id: "file-input",
    route: "/components/file-upload",
    title: "FileInput",
  },
  "components/field": {
    id: "field",
    route: "/components/field-parts",
    title: "Field",
  },
  "datetime/calendar": {
    id: "calendar",
    route: "/date-time/calendar",
    title: "Calendar",
  },
  "datetime/date-picker": {
    id: "date-picker",
    route: "/date-time/date-picker",
    title: "DatePicker",
  },
  "datetime/datetime-picker": {
    id: "datetime-picker",
    route: "/date-time/date-picker",
    title: "DateTimePicker",
    referenceOnly: true,
  },
  "datetime/time-picker": {
    id: "time-picker",
    route: "/date-time/time",
    title: "TimePicker",
  },
  "datetime/month-year-picker": {
    id: "month-year-picker",
    route: "/date-time/calendar",
    title: "MonthPicker and YearPicker",
    referenceOnly: true,
  },
  "table/virtual-data-table": {
    id: "virtual-data-table",
    route: "/data/table-virtualized",
    title: "VirtualDataTable",
  },
  "table/data-table": { id: "data-table", route: "/data/table", title: "DataTable" },
  "data/metric": { id: "metric", route: "/data/metrics", title: "Metric" },
  "data/status-badge": { id: "status-badge", route: "/data/statuses", title: "StatusBadge" },
  "components/typography": {
    id: "typography",
    title: "Typography",
  },
  "components/ai": { id: "ai", route: "/components/ai", title: "AI surfaces" },
  "forms/form": { id: "form", route: "/forms", title: "Form" },
  "workspace/workspace": {
    id: "workspace",
    route: "/application/workspace",
    title: "Workspace",
  },
  "app-shell/app-shell": {
    id: "app-shell",
    route: "/application/navigation",
    title: "AppShell",
  },
  "app-shell/sidebar": {
    id: "sidebar",
    route: "/application/navigation",
    title: "Sidebar",
    referenceOnly: true,
  },
  "app-shell/breadcrumbs": {
    id: "breadcrumbs",
    route: "/application/navigation",
    title: "Breadcrumbs",
    referenceOnly: true,
  },
  "app-shell/page-header": {
    id: "page-header",
    route: "/application/navigation",
    title: "PageHeader",
    referenceOnly: true,
  },
  "app-shell/navigation-context": {
    id: "navigation",
    route: "/application/navigation",
    title: "Navigation model",
    referenceOnly: true,
  },
  "url-state/index": {
    id: "url-state",
    route: "/application/url-state",
    title: "URL state",
  },
  "providers/luc-provider": {
    id: "luc-provider",
    route: "/application/packaging",
    title: "LucProvider",
    referenceOnly: true,
  },
  "providers/theme-provider": {
    id: "theme-provider",
    route: "/foundations/themes",
    title: "ThemeProvider",
    referenceOnly: true,
  },
  "providers/locale-provider": {
    id: "locale-provider",
    route: "/date-time/calendar",
    title: "LocaleProvider",
    referenceOnly: true,
  },
  "workspace/inspector": {
    id: "inspector-pane",
    route: "/application/workspace",
    title: "InspectorPane",
    referenceOnly: true,
  },
  "workspace/outline-drawer": {
    id: "outline-drawer",
    route: "/application/outline-drawer",
    title: "OutlineDrawer",
  },
};

/** Everything a module is allowed to key on, for the generator's validation. */
export const KNOWN_MODULE_KEYS = new Set<string>([
  ...COMPONENT_FAMILIES.flatMap((family) => family.modules),
  ...MOTION_FAMILIES.flatMap((family) => family.modules),
  ...INTEGRATION_PAGES.flatMap((page) => page.modules),
]);

/*
 * Chart families come from the *verified* chart registry
 * (`components/charts/chart-catalog-data.ts`, checked against the real exports
 * by `catalog:charts`), so the family list is not written twice. What is
 * handwritten is where each family's landing page already lives: the Showcase
 * has documented charts by topic since V0.2, and those pages keep their URLs.
 */
export const CHART_GROUP_LANDING: Record<string, string> = {
  general: "/charts/catalog",
  statistical: "/charts/statistical",
  scientific: "/charts/scientific",
  diagnostics: "/charts/diagnostics",
  financial: "/charts/financial",
  multidimensional: "/charts/multidimensional",
  workflow: "/charts/workflow",
  time: "/charts/timeseries",
  geographic: "/charts/geospatial",
};
