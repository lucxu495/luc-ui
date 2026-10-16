/**
 * Conservative changed-file → route mapping for `pnpm qa:changed`.
 *
 * The rule is deliberately blunt: a change selects a *family* of routes, and
 * anything unrecognised falls back to `SMOKE_SLUGS`, which touches every major
 * family. Missing coverage is a worse failure than running four extra routes,
 * so uncertainty always broadens the selection.
 *
 * Sources that are genuinely cross-cutting (tokens, the shared stylesheet, the
 * app shell, layout primitives) broaden to a wide set on purpose: a token
 * change really can move every page.
 */

import { ROUTES, SMOKE_SLUGS, slugsInGroup } from "./routes.mjs";

const everywhere = () => ROUTES.map((route) => route.slug);

/** Ordered rules; the first match wins, and every match is unioned. */
const RULES = [
  // ---- cross-cutting: broaden widely -------------------------------------
  { match: /^packages\/ui\/src\/(tokens|styles)\//, slugs: everywhere },
  { match: /^packages\/ui\/src\/(index|utils|hooks|providers|layout|motion)\//, slugs: everywhere },
  { match: /^apps\/showcase\/(app\/globals\.css|app\/layout\.tsx)$/, slugs: everywhere },
  /* Localisation is cross-cutting by construction: one dictionary entry or one
     middleware rule can change the chrome on every route in the app. */
  { match: /^apps\/showcase\/(lib\/i18n\/|middleware\.ts$)/, slugs: everywhere },
  { match: /^eslint-rules\//, slugs: everywhere },

  // ---- shell / application ---------------------------------------------
  {
    match: /^packages\/ui\/src\/(app-shell|workspace|url-state)\//,
    slugs: () => [...slugsInGroup("application"), ...slugsInGroup("patterns")],
  },
  {
    match: /^apps\/showcase\/components\/shell\//,
    slugs: () => [...slugsInGroup("application"), ...slugsInGroup("home")],
  },
  {
    match: /^apps\/showcase\/lib\/navigation\.ts$/,
    slugs: () => [...slugsInGroup("application"), ...slugsInGroup("home")],
  },

  // ---- experiments + the theme surface ---------------------------------
  /*
   * The reference experiences. A change to the published composites behind them
   * (`@luc/ui/experiences`) or to these pages reaches the experience family.
   */
  {
    match: /^packages\/ui\/src\/experiences\//,
    slugs: () => slugsInGroup("experiences"),
  },
  {
    match: /^apps\/showcase\/app\/experiences\//,
    slugs: () => slugsInGroup("experiences"),
  },
  {
    match: /^apps\/showcase\/lib\/(mock-data|chart-packs|chart-packs-v5|table-data)\.ts$/,
    slugs: () => [...slugsInGroup("charts"), ...slugsInGroup("experiences")],
  },
  {
    match: /^apps\/showcase\/(app\/experiments|components\/experiments)\//,
    slugs: () => slugsInGroup("experiments"),
  },
  {
    match: /^apps\/showcase\/(lib\/appearance|lib\/use-appearance)\.ts$/,
    slugs: () => [...slugsInGroup("foundations"), ...slugsInGroup("experiments")],
  },

  // ---- TradingView ------------------------------------------------------
  { match: /^packages\/ui\/src\/integrations\/tradingview\//, slugs: () => slugsInGroup("providers") },
  { match: /^apps\/showcase\/(app\/integrations\/tradingview|components\/integrations)\//, slugs: () => slugsInGroup("providers") },

  // ---- charts -----------------------------------------------------------
  { match: /^packages\/ui\/src\/charts\//, slugs: () => [...slugsInGroup("charts"), "patterns-chart-table", "patterns-chart-date-filter"] },
  { match: /^apps\/showcase\/app\/charts\//, slugs: () => slugsInGroup("charts") },

  // ---- data table -------------------------------------------------------
  { match: /^packages\/ui\/src\/table\//, slugs: () => slugsInGroup("table") },
  { match: /^apps\/showcase\/app\/data\//, slugs: () => [...slugsInGroup("data"), "patterns-research-workspace"] },

  // ---- forms / datetime -------------------------------------------------
  { match: /^packages\/ui\/src\/forms\//, slugs: () => [...slugsInGroup("forms"), "patterns-settings-form"] },
  { match: /^apps\/showcase\/app\/forms\//, slugs: () => slugsInGroup("forms") },
  {
    match: /^packages\/ui\/src\/datetime\//,
    slugs: () => [...slugsInGroup("datetime"), "patterns-table-date-filter", "patterns-chart-date-filter"],
  },
  { match: /^apps\/showcase\/app\/date-time\//, slugs: () => slugsInGroup("datetime") },

  // ---- individual primitives --------------------------------------------
  { match: /components\/slider\.tsx$/, slugs: () => ["components-slider"] },
  { match: /components\/(dropdown-menu|context-menu|menu-shared)\.tsx$/, slugs: () => ["components-menus"] },
  { match: /components\/alert\.tsx$/, slugs: () => ["components-alert"] },
  { match: /components\/empty-state\.tsx$/, slugs: () => ["components-empty-state"] },
  { match: /components\/(button|icon-button|link)\.tsx$/, slugs: () => ["buttons"] },
  { match: /components\/(select)\.tsx$/, slugs: () => ["components-select", "patterns-settings-form"] },
  { match: /components\/(combobox)\.tsx$/, slugs: () => ["components-combobox", "data-table"] },
  { match: /components\/(sheet|dialog|popover|tooltip)\.tsx$/, slugs: () => ["overlay", "dialog", "components-sheet"] },
  { match: /components\/(toast)\.tsx$/, slugs: () => ["components-toast", "feedback"] },
  { match: /components\/(command)\.tsx$/, slugs: () => ["components-command", "patterns-command-palette"] },
  { match: /components\/(input|textarea|search-input|checkbox|radio|switch|tabs|segmented-control)\.tsx$/, slugs: () => ["inputs", "selection", "tabs", "forms-overview"] },
  { match: /components\/(badge|tag)\.tsx$/, slugs: () => ["badges", "components-tags", "data-statuses"] },
  { match: /components\/(card|panel|separator|skeleton|spinner|progress)\.tsx$/, slugs: () => ["cards", "feedback"] },
  { match: /components\/(number-input|currency-input|percentage-input|password-input|otp-input|file-input|drop-zone)\.tsx$/, slugs: () => slugsInGroup("forms") },

  // ---- showcase pages: the page *is* the route --------------------------
  { match: /^apps\/showcase\/app\/(.*)\/page\.tsx$/, slugs: (file) => slugForPage(file) },

  // ---- packaging / docs only: nothing visual ---------------------------
  { match: /^(docs|skills)\//, slugs: () => [] },
  { match: /^(README|CHANGELOG|MIGRATION_V1|DESIGN_SYSTEM|AI_DESIGN_GUIDE)\.md$/, slugs: () => [] },
  { match: /^packages\/ui\/(package\.json|scripts|tsdown\.config|bundle-baseline)/, slugs: () => [] },
  { match: /^(package\.json|tsconfig\.base\.json)$/, slugs: () => [] },
  // Workspace-level packaging. These paths are the repository root, which is
  // also the pnpm workspace root (`pnpm-workspace.yaml`, `.npmrc`, the root
  // `package.json` and the lockfile). They were `luc-ui/…` before the extraction
  // out of the `luc-quant` monorepo; every rule in this file lost that prefix.
  { match: /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc|\.dockerignore)$/, slugs: () => [] },
  { match: /^\.gitignore$/, slugs: () => [] },
  { match: /^apps\/showcase\/(package\.json|next\.config\.ts|postcss\.config\.mjs|eslint\.config\.mjs|tsconfig\.json)$/, slugs: () => [] },
  { match: /^apps\/showcase\/(playwright\.config\.mjs|tests\/|scripts\/)/, slugs: () => [] },
  { match: /^apps\/showcase\/qa\//, slugs: () => [] },
  { match: /^artifacts\//, slugs: () => [] },
  { match: /^scripts\//, slugs: () => [] },
  { match: /^(Dockerfile|docker-compose\.yml)$/, slugs: () => [] },
];

/** Map a `app/<dir>/page.tsx` path onto the registry slug. */
function slugForPage(file) {
  const relative = file.replace(/^apps\/showcase\/app\//, "").replace(/\/page\.tsx$/, "");
  if (relative === "page.tsx" || relative === "") return ["home"];
  const directory = relative;
  const direct = ROUTES.filter((route) => route.path === `/${directory}`);
  if (direct.length > 0) return direct.map((route) => route.slug);
  // Nested route files (`app/charts/foo/page.tsx`) still live in a family.
  const family = ROUTES.filter((route) => route.path.startsWith(`/${directory}/`));
  return family.length > 0 ? family.map((route) => route.slug) : SMOKE_SLUGS;
}

/**
 * Resolve changed paths to a route selection.
 *
 * Returns `{ slugs, matched, unmatched }` so the caller can report *why* a run
 * picked the routes it did — and an empty `slugs` means "this change cannot
 * affect the rendered UI", which lets `qa:changed` skip the browser entirely.
 */
export function routesForChangedFiles(files) {
  const slugs = new Set();
  const matched = [];
  const unmatched = [];
  let sawNothingVisual = false;

  for (const file of files) {
    let hit = false;
    let emptyHit = false;
    for (const rule of RULES) {
      if (!rule.match.test(file)) continue;
      hit = true;
      const selected = rule.slugs(file);
      if (selected.length === 0) emptyHit = true;
      for (const slug of selected) slugs.add(slug);
      break;
    }
    if (hit) matched.push(file);
    else unmatched.push(file);
    if (emptyHit) sawNothingVisual = true;
  }

  if (unmatched.length > 0) {
    for (const slug of SMOKE_SLUGS) slugs.add(slug);
  }

  return {
    slugs: [...slugs],
    matched,
    unmatched,
    /** True when nothing in the change set can reach the rendered UI. */
    nothingVisual: unmatched.length === 0 && matched.length > 0 && slugs.size === 0 && sawNothingVisual,
  };
}
