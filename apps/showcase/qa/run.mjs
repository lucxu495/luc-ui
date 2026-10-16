/**
 * QA orchestrator.
 *
 * Tiers are *selections*, not different programs: one route sweep, one
 * behaviour model, and a mode that decides how much of each to run.
 *
 *   full      every route (dark desktop, plus light/mobile where the route has
 *             a variant) + every behaviour group, deterministic provider
 *   changed   only the routes a change can reach, dark + light, axe + shots
 *   behaviour only the requested behaviour groups
 *   providers the live TradingView smoke (the real provider, few routes)
 *
 * Route sweeps run in a small worker pool. Order-dependent output is avoided by
 * naming every artifact after its route, and the report re-sorts before writing,
 * so a concurrent run produces the same report as a sequential one.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

import { BEHAVIOUR_GROUPS, DESKTOP, MOBILE } from "./constants.mjs";
import { parseOptions } from "./config.mjs";
import { createCaptureSession, applyTheme } from "./capture.mjs";
import { attachDiagnostics, isProviderOrigin } from "./diagnostics.mjs";
import { runAxe } from "./a11y.mjs";
import { createRecorder, printSummary, summarise, writeReport } from "./report.mjs";
import { installProviderStub, installProviderStubOnContext, providerState } from "./provider.mjs";
import {
  navigateAndReady,
  readThrough,
  settleProviderWidgets,
  waitForAppReady,
  waitForStable,
} from "./readiness.mjs";
import { ROUTE_SLUGS, ROUTES, isProviderRoute, selectRoutes, slugsInGroup } from "./routes.mjs";
import { routesForChangedFiles } from "./route-map.mjs";
import { runBehaviour } from "./behaviour.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");
const defaultArtifactRoot = path.resolve(packageRoot, "artifacts");

const PROVIDER_SETTLE_MS = { stub: 12_000, live: 25_000 };
/*
 * Two in flight, not three.
 *
 * Each worker holds a desktop context and lazily a mobile one, so the number of
 * pages a "3 worker" sweep really opens is larger than the number in the log.
 * Frontend QA is bounded at 2 by default and 4 at the absolute ceiling (see
 * `.context/docs/decisions/ADR-036-frontend-development-and-qa-tiers.md`); a
 * wider run must be deliberate and supervised.
 */
const DEFAULT_WORKERS = 2;

/** Files changed against a git ref, plus untracked files. */
async function changedFiles(since) {
  const [diff, untracked] = await Promise.all([
    run("git", ["diff", "--name-only", since], { cwd: packageRoot }).catch(() => ({ stdout: "" })),
    run("git", ["ls-files", "--others", "--exclude-standard"], { cwd: packageRoot }).catch(() => ({ stdout: "" })),
  ]);
  const normalise = (line) => {
    const file = line.trim();
    if (!file) return undefined;
    /*
     * Git reports paths relative to the working tree it ran in, and `packageRoot`
     * is this repository's root — which used to be the `luc-ui/` directory
     * *inside* `luc-quant` and was therefore prefixed by every rule in
     * `route-map.mjs`. Since the extraction the repository root is the directory
     * the paths are already relative to, so they are used unchanged.
     */
    return file.replace(/^\.\//, "");
  };
  return [...new Set([...diff.stdout.split("\n"), ...untracked.stdout.split("\n")].map(normalise).filter(Boolean))];
}

/** Small worker pool: N tasks in flight, fixed queue order, no shared state. */
async function pool(items, workers, task) {
  const queue = items.map((item, index) => ({ item, index }));
  const results = new Array(items.length);
  let cursor = 0;

  const worker = async (workerIndex) => {
    while (cursor < queue.length) {
      const { item, index } = queue[cursor];
      cursor += 1;
      results[index] = await task(item, index, workerIndex);
    }
  };

  const count = Math.max(1, Math.min(workers, queue.length));
  await Promise.all(Array.from({ length: count }, (_, index) => worker(index)));
  return results;
}

/**
 * One route, all of its variants.
 *
 * Dark desktop is always captured. The light capture happens on the same page
 * right after the dark one — a theme flip, not a second navigation — because the
 * state the dark capture validated is exactly the state the light capture should
 * describe, and re-navigating paid for the same hydration twice. The mobile
 * variant needs its own context by definition.
 */
async function captureRoute(route, env) {
  const { recorder, options, baseUrl, capture } = env;
  const timing = {
    slug: route.slug,
    path: route.path,
    provider: isProviderRoute(route),
    totalMs: 0,
    navigationMs: 0,
    readinessMs: 0,
    providerWaitMs: 0,
    axeMs: 0,
    screenshotMs: 0,
    mobileMs: 0,
    variants: [],
  };
  const started = performance.now();

  const context = await env.browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
  const page = await context.newPage();
  let current = route.slug;
  attachDiagnostics(page, () => current, recorder);
  if (env.stubProvider) await installProviderStub(page);

  const settleProvider = async (target, timeoutMs, label = route.slug) => {
    const settled = await settleProviderWidgets(target, { timeoutMs: Math.round(timeoutMs * options.timeoutScale) });
    timing.providerWaitMs += Math.round(settled.providerWaitMs);
    recorder.counters.providerReady += settled.ready;
    recorder.counters.providerErrors += settled.error;
    if (settled.timedOut) {
      recorder.counters.providerTimeouts += 1;
      recorder.record(
        "provider-timeout",
        `${label}: ${settled.ready} ready, ${settled.error} error, ${settled.pending} pending after ${Math.round(
          settled.providerWaitMs,
        )}ms`,
      );
    }
    return settled;
  };

  try {
    // ------------------------------------------------------- dark desktop
    const ready = await navigateAndReady(page, `${baseUrl}${route.path}`, {
      timeoutMs: Math.round(20_000 * options.timeoutScale),
    });
    timing.navigationMs = Math.round(ready.navigationMs);
    timing.readinessMs = Math.round(ready.readinessMs);

    if (isProviderRoute(route)) await settleProvider(page, PROVIDER_SETTLE_MS[options.providerMode]);

    await readThrough(page);
    let shotStarted = performance.now();
    await capture.screenshot(page, `${route.slug}-dark-desktop`);
    timing.screenshotMs += performance.now() - shotStarted;
    timing.variants.push("dark-desktop");
    if (isProviderRoute(route)) await capture.captureWidgets(page, route.slug, "dark");

    let axeStarted = performance.now();
    await runAxe(page, route.slug, recorder);
    timing.axeMs += performance.now() - axeStarted;

    // ------------------------------------------------------------ light
    if (route.light && options.themes.includes("light")) {
      const applied = await applyTheme(page, "light", recorder, route.slug);
      if (applied) {
        await waitForStable(page, { settleMs: 200 });
        if (isProviderRoute(route)) await settleProvider(page, 8_000);
        shotStarted = performance.now();
        await capture.screenshot(page, `${route.slug}-light-desktop`);
        timing.screenshotMs += performance.now() - shotStarted;
        timing.variants.push("light-desktop");
        if (isProviderRoute(route)) await capture.captureWidgets(page, route.slug, "light");
        axeStarted = performance.now();
        await runAxe(page, `${route.slug}-light`, recorder);
        timing.axeMs += performance.now() - axeStarted;
      }
      await applyTheme(page, "dark", recorder, route.slug);
    }
  } finally {
    await context.close();
  }

  // ------------------------------------------------------------ mobile
  if (route.mobile && options.viewports.includes("mobile")) {
    const mobileStarted = performance.now();
    const mobileContext = await env.mobileContext();
    const mobilePage = await mobileContext.newPage();
    const mobileLabel = `${route.slug}-mobile`;
    const detach = attachDiagnostics(mobilePage, mobileLabel, recorder);
    try {
      await navigateAndReady(mobilePage, `${baseUrl}${route.path}`, {
        timeoutMs: Math.round(20_000 * options.timeoutScale),
      });
      if (isProviderRoute(route)) await settleProvider(mobilePage, 10_000, mobileLabel);
      await capture.screenshot(mobilePage, `${route.slug}-dark-mobile`, false);
      timing.variants.push("dark-mobile");
      /*
       * Axe at 390 px, not only at 1440.
       *
       * WCAG 2.2's `target-size` is a geometry rule, and geometry is exactly
       * what a narrow viewport changes. The Phase 9.5 report carried a
       * `target-size` finding it could only see because somebody scanned by
       * hand, and the first mobile sweep of this phase found three more
       * findings — two classes of defect — that 257 desktop scans had not. The
       * scan belongs in the sweep, on the mobile subset it already renders.
       */
      if (!options.skipAxe && options.viewports.includes("mobile")) {
        const mobileAxeStarted = performance.now();
        await runAxe(mobilePage, mobileLabel, recorder);
        timing.axeMs += performance.now() - mobileAxeStarted;
      }
    } finally {
      detach();
      await mobilePage.close();
    }
    timing.mobileMs = Math.round(performance.now() - mobileStarted);
  }

  timing.totalMs = Math.round(performance.now() - started);
  return timing;
}

/**
 * Wrapper for a mobile context: one per worker, created on first use, so a run
 * does not build and tear down a browser context per mobile route.
 */
function mobileContextFactory(browser) {
  let promise;
  return () =>
    (promise ??= browser.newContext({
      viewport: MOBILE,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    }));
}

/** The run's tier, as selected by the CLI/environment. */
export function resolveRun(options) {
  const sweepEnabled =
    !options.skipRoutes &&
    options.mode !== "behaviour";
  return { sweepEnabled };
}

export async function runQa(options) {
  const recorder = createRecorder();
  const startedAt = performance.now();
  const artifactRoot = options.outDir ? path.resolve(options.outDir) : defaultArtifactRoot;
  const screenshotDir = path.join(artifactRoot, "screenshots");
  await mkdir(screenshotDir, { recursive: true });
  const capture = createCaptureSession({ screenshotDir, recorder });

  // ------------------------------------------------------------- selection
  let selection = options.slugs;
  if (options.routeGroups.length > 0) {
    selection = [...new Set([...selection, ...options.routeGroups.flatMap((group) => slugsInGroup(group))])];
  }
  let selectionReason = "";
  if (selection.length === 0 && options.mode === "changed") {
    const files = await changedFiles(options.changedSince);
    const mapped = routesForChangedFiles(files);
    selection = mapped.slugs;
    selectionReason = mapped.nothingVisual
      ? `${files.length} changed file(s) cannot affect the rendered UI → no routes`
      : mapped.unmatched.length > 0
        ? `${files.length} changed file(s); ${mapped.unmatched.length} unmapped → broad smoke set (${mapped.slugs.length} routes)`
        : `${files.length} changed file(s) → ${mapped.slugs.length} route(s)`;
  } else if (selection.length === 0 && options.mode === "full") {
    selection = ROUTE_SLUGS;
    selectionReason = "full sweep";
  }

  /*
   * `--mode=providers` is the live tier: it sweeps the provider routes against
   * the real provider *and* runs the wrapper-contract behaviour group. Explicit
   * routes narrow the sweep (a single widget, checked live) without dropping the
   * contract checks. Measured cost for all ten routes: ~46 s.
   */
  const explicitSelection = selection.length > 0;
  if (!explicitSelection && options.mode === "providers") selection = slugsInGroup("providers");
  const { sweepEnabled } = resolveRun(options);
  const selectedRoutes = sweepEnabled ? selectRoutes(selection) : [];

  let groups;
  if (options.skipBehaviour) groups = [];
  else if (options.mode === "providers") groups = ["providers"];
  else if (options.mode === "full" || options.mode === "behaviour") {
    // `--mode=behaviour` with no `--group` means "every group": the complete
    // V1.0 acceptance set, which is what `pnpm qa:behaviour` stands for.
    groups = options.behaviourGroups.length > 0 ? options.behaviourGroups : BEHAVIOUR_GROUPS;
  } else groups = options.behaviourGroups;

  const workers = options.workers ?? Math.min(DEFAULT_WORKERS, Math.max(1, selectedRoutes.length));
  const stubProvider = options.providerMode === "stub";

  console.log(
    `LUC UI QA · mode=${options.mode} · provider=${options.providerMode} · ` +
      `routes=${selectedRoutes.length} · behaviour=${groups.length > 0 ? groups.join("+") : "off"} · workers=${workers}`,
  );
  if (selectionReason) console.log(`  selection   : ${selectionReason}`);

  const rawBrowser = await chromium.launch();
  /*
   * Every context the run creates — including the ones the behaviour groups
   * build for themselves — shares one provider policy. Wrapping `newContext` is
   * what keeps the deterministic tier deterministic without every group having
   * to remember to install the stub itself.
   */
  const browser = wrapBrowser(rawBrowser, stubProvider);
  const routeTimings = [];

  try {
    if (selectedRoutes.length > 0) {
      await recorder.phase("routes", async () => {
        const mobileContexts = new Map();
        const timings = await pool(selectedRoutes, workers, async (route, _index, workerIndex) => {
          if (!mobileContexts.has(workerIndex)) mobileContexts.set(workerIndex, mobileContextFactory(browser));
          return captureRoute(route, {
            browser,
            recorder,
            options,
            baseUrl: options.baseUrl,
            capture,
            stubProvider,
            mobileContext: mobileContexts.get(workerIndex),
          });
        });
        routeTimings.push(...timings);
      });
    } else if (options.mode === "full" || options.mode === "changed") {
      console.log("  routes      : none selected");
    }

    if (groups.length > 0) {
      await recorder.phase("behaviour", () =>
        runBehaviour(
          {
            browser,
            recorder,
            options,
            baseUrl: options.baseUrl,
            capture,
            routes: selectedRoutes.length > 0 ? selectedRoutes : ROUTES,
            navigateAndReady,
            waitForAppReady,
            waitForStable,
            readThrough,
            settleProviderWidgets,
            providerState,
            applyTheme,
            isProviderOrigin,
          },
          groups,
        ),
      );
    }
  } finally {
    await browser.close();
  }

  routeTimings.sort((a, b) => ROUTE_SLUGS.indexOf(a.slug) - ROUTE_SLUGS.indexOf(b.slug));
  recorder.axe.sort((a, b) => ROUTE_SLUGS.indexOf(a.slug) - ROUTE_SLUGS.indexOf(b.slug));

  await writeReport(
    recorder,
    options,
    {
      startedAt,
      routeCount: selectedRoutes.length,
      selectedRoutes: selectedRoutes.map((route) => route.slug),
      routeTimings,
      workers,
    },
    { artifactRoot },
  );

  printSummary(recorder, {
    mode: options.mode,
    providerMode: options.providerMode,
    workers,
    routeCount: selectedRoutes.length,
    selectedRoutes: selectedRoutes.map((route) => route.slug),
    routeTimings,
  });

  const { ok, hardFailures, failedBehaviour } = summarise(recorder);
  console.log(`  report      : ${path.relative(packageRoot, path.join(artifactRoot, "qa-report.json"))}`);
  if (!ok) {
    const parts = [];
    if (failedBehaviour.length > 0) parts.push(`${failedBehaviour.length} behaviour check(s) failed`);
    if (hardFailures.length > 0) parts.push(`${hardFailures.length} console/a11y problem(s)`);
    console.error(`\n  ${parts.join("; ")}; see qa-report.json.`);
    process.exitCode = 1;
  }
  return { ok, recorder, routeTimings, workers };
}

/**
 * Wrap `newContext` so every context obeys the run's provider policy. A thin
 * proxy keeps the Playwright surface identical for every caller.
 */
function wrapBrowser(browser, stubProvider) {
  if (!stubProvider) return browser;
  const original = browser.newContext.bind(browser);
  return new Proxy(browser, {
    get(target, property) {
      if (property === "newContext") {
        return async (...args) => {
          const context = await original(...args);
          await installProviderStubOnContext(context);
          return context;
        };
      }
      const value = target[property];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

/** CLI entry point. */
export async function main(argv = process.argv.slice(2), env_ = process.env) {
  const options = parseOptions(argv, env_);
  return runQa(options);
}
