/**
 * QA options: CLI flags over environment over defaults.
 *
 * The flags exist so a Codex session can run a *targeted* check without editing
 * the script, and so npm scripts can encode the tiers:
 *
 *   pnpm qa:changed     -> mode=changed   providerMode=stub
 *   pnpm qa:full        -> mode=full      providerMode=stub
 *   pnpm qa:providers   -> mode=providers providerMode=live
 *   pnpm qa:behaviour   -> mode=behaviour
 */

import { BEHAVIOUR_GROUPS } from "./constants.mjs";
import { ROUTES, ROUTE_GROUPS } from "./routes.mjs";

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readArg(argv, name) {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) return argv[index + 1];
  return undefined;
}

function hasFlag(argv, name) {
  return argv.includes(`--${name}`);
}

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 */
export function parseOptions(argv = process.argv.slice(2), env = process.env) {
  const mode = readArg(argv, "mode") ?? env.LUC_QA_MODE ?? "full";
  const providerMode = readArg(argv, "provider-mode") ?? env.LUC_QA_PROVIDER_MODE ?? (mode === "providers" ? "live" : "stub");
  const skipRoutes = hasFlag(argv, "skip-routes") || env.LUC_QA_SKIP_ROUTES === "1";

  const requestedSlugs = [
    ...parseList(readArg(argv, "routes") ?? env.LUC_QA_ROUTES),
    ...parseList(readArg(argv, "route")),
  ];
  const requestedGroups = [
    ...parseList(readArg(argv, "route-groups") ?? env.LUC_QA_ROUTE_GROUPS),
  ];

  const themes = parseList(readArg(argv, "themes") ?? env.LUC_QA_THEMES);
  const viewports = parseList(readArg(argv, "viewports") ?? env.LUC_QA_VIEWPORTS);
  const behaviourGroups = parseList(readArg(argv, "group") ?? env.LUC_QA_GROUPS);

  const workersRaw = readArg(argv, "workers") ?? env.LUC_QA_WORKERS;
  const workers = workersRaw ? Number.parseInt(workersRaw, 10) : undefined;

  const unknownSlugs = requestedSlugs.filter((slug) => !ROUTES.some((route) => route.slug === slug));
  if (unknownSlugs.length > 0) {
    throw new Error(
      `[qa] Unknown route slug(s): ${unknownSlugs.join(", ")}\n    Known slugs: ${ROUTES.map((r) => r.slug).join(", ")}`,
    );
  }
  const unknownGroups = behaviourGroups.filter((group) => !BEHAVIOUR_GROUPS.includes(group));
  if (unknownGroups.length > 0) {
    throw new Error(
      `[qa] Unknown behaviour group(s): ${unknownGroups.join(", ")}\n    Known groups: ${BEHAVIOUR_GROUPS.join(", ")}`,
    );
  }
  const unknownRouteGroups = requestedGroups.filter((group) => !ROUTE_GROUPS.includes(group));
  if (unknownRouteGroups.length > 0) {
    throw new Error(
      `[qa] Unknown route group(s): ${unknownRouteGroups.join(", ")}\n    Known groups: ${ROUTE_GROUPS.join(", ")}`,
    );
  }

  return {
    baseUrl: readArg(argv, "base-url") ?? env.LUC_QA_BASE_URL ?? "http://localhost:3000",
    mode,
    providerMode,
    /** Explicit slugs from `--routes`. Empty means "decide from the mode". */
    slugs: requestedSlugs,
    /** Route-group names from `--route-groups`. */
    routeGroups: requestedGroups,
    themes: themes.length > 0 ? themes : ["dark", "light"],
    viewports: viewports.length > 0 ? viewports : ["desktop", "mobile"],
    behaviourGroups,
    skipRoutes,
    skipBehaviour: hasFlag(argv, "skip-behaviour") || env.LUC_QA_SKIP_BEHAVIOUR === "1",
    /**
     * Axe runs at dark desktop, at light desktop on the light subset, and — as
     * of Phase 9.6 — at 390 px on the mobile subset. The mobile pass is the one
     * that catches geometry rules such as `target-size`, so it is on by
     * default; the flag exists for a run that has to be as short as possible.
     */
    skipAxe: hasFlag(argv, "skip-axe") || env.LUC_QA_SKIP_AXE === "1",
    /*
     * Bounded at the frontend-QA ceiling (4), not at 8. A sweep worker is not
     * one page: it keeps a desktop context and lazily a mobile one, so the pages
     * in flight are roughly twice the worker count. `--workers` may narrow it;
     * it cannot raise it past the ceiling without changing this policy.
     */
    workers: Number.isFinite(workers) && workers > 0 ? Math.min(workers, 4) : undefined,
    changedSince: readArg(argv, "changed-since") ?? env.LUC_QA_CHANGED_SINCE ?? "HEAD",
    outDir: readArg(argv, "out") ?? env.LUC_QA_OUT,
    verbose: hasFlag(argv, "verbose") || env.LUC_QA_VERBOSE === "1",
    /** Bump every bounded wait (useful on a slow or cold host). */
    timeoutScale: Number.parseFloat(readArg(argv, "timeout-scale") ?? env.LUC_QA_TIMEOUT_SCALE ?? "1") || 1,
  };
}
