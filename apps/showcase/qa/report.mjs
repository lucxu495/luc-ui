/**
 * Run recorder + `artifacts/qa-report.json` writer.
 *
 * The report is the *diagnostic* artifact: it must be possible to answer "why
 * was this run slow?" from the file alone. Filesystem timestamps are not a
 * substitute, so every phase, every route and every bounded wait that could
 * have timed out is recorded with an explicit duration.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function createRecorder() {
  return {
    startedAt: new Date(),
    problems: [],
    axe: [],
    captured: [],
    routes: [],
    phases: [],
    behaviour: [],
    counters: {
      navigationTimeouts: 0,
      readinessTimeouts: 0,
      providerTimeouts: 0,
      providerReady: 0,
      providerErrors: 0,
      consoleErrors: 0,
      pageErrors: 0,
      failedRequests: 0,
      themeMisses: 0,
      axeScans: 0,
      axeErrors: 0,
    },
    record(channel, message) {
      this.problems.push({ channel, message });
    },
    /** Time a named phase. Everything inside is awaited. */
    async phase(name, fn) {
      const started = performance.now();
      try {
        return await fn();
      } finally {
        this.phases.push({ name, durationMs: Math.round(performance.now() - started) });
      }
    },
  };
}

/** Stable ordering so a concurrent run produces a deterministic report. */
function sortProblems(problems) {
  return [...problems].sort((a, b) =>
    a.channel === b.channel ? a.message.localeCompare(b.message) : a.channel.localeCompare(b.channel),
  );
}

export function summarise(recorder) {
  const failedBehaviour = recorder.behaviour.filter((item) => !item.pass);
  const axeViolations = recorder.axe.reduce((total, entry) => total + entry.violations.length, 0);
  const hardFailures = recorder.problems.filter((problem) => problem.channel !== "a11y");
  return {
    failedBehaviour,
    axeViolations,
    hardFailures,
    ok: failedBehaviour.length === 0 && hardFailures.length === 0,
  };
}

/**
 * Write the machine-readable report next to the screenshots.
 *
 * `screenshots` is kept as relative paths (the historical contract); the
 * timings are additive so existing consumers keep working.
 */
export async function writeReport(recorder, options, extra, { artifactRoot }) {
  const report = {
    baseUrl: options.baseUrl,
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    providerMode: options.providerMode,
    workers: extra.workers ?? 1,
    routes: extra.routeCount,
    selectedRoutes: extra.selectedRoutes,
    screenshots: recorder.captured.map((file) => path.relative(artifactRoot, file)),
    screenshotsCount: recorder.captured.length,
    durations: {
      totalMs: Math.round(performance.now() - extra.startedAt),
      phases: recorder.phases,
      routes: extra.routeTimings,
    },
    counters: recorder.counters,
    behaviour: recorder.behaviour,
    axe: recorder.axe,
    problems: sortProblems(recorder.problems),
  };
  await mkdir(artifactRoot, { recursive: true });
  const json = JSON.stringify(report, null, 2);
  await writeFile(path.join(artifactRoot, "qa-report.json"), json, "utf8");
  /*
   * A release run is several QA commands in sequence, and each one overwrites
   * the single "latest" report — which used to mean the live provider smoke
   * erased the full-sweep timings. Keep one report per mode as well, so the
   * expensive run's evidence survives the cheap one that follows it.
   */
  const perMode = path.join(artifactRoot, "reports", `${options.mode}.json`);
  await mkdir(path.dirname(perMode), { recursive: true });
  await writeFile(perMode, json, "utf8");
  return report;
}

/** Human-readable tail for the console: short, and only what a reader needs. */
export function printSummary(recorder, extra) {
  const { failedBehaviour, axeViolations, hardFailures } = summarise(recorder);
  const problems = sortProblems(recorder.problems);

  console.log(`\nLUC UI QA — mode=${extra.mode} provider=${extra.providerMode} workers=${extra.workers}`);
  if (extra.selectedRoutes?.length) {
    console.log(`  routes      : ${extra.selectedRoutes.join(", ")}`);
  } else if (extra.routeCount !== undefined) {
    console.log(`  routes      : ${extra.routeCount}`);
  }
  if (recorder.captured.length > 0) console.log(`  screenshots : ${recorder.captured.length}`);
  if (recorder.behaviour.length > 0) {
    console.log(`  behaviour   : ${recorder.behaviour.length - failedBehaviour.length}/${recorder.behaviour.length} passed`);
    for (const item of failedBehaviour) {
      console.log(`    FAIL  ${item.check}${item.detail ? ` (${item.detail})` : ""}`);
    }
  }
  if (recorder.axe.length > 0) {
    console.log(`  a11y        : ${axeViolations} violation(s) across ${recorder.axe.length} scans`);
  }
  const phaseLine = recorder.phases.map((phase) => `${phase.name} ${(phase.durationMs / 1000).toFixed(1)}s`).join(" · ");
  if (phaseLine) console.log(`  timings     : ${phaseLine}`);
  const slowest = [...extra.routeTimings].sort((a, b) => b.totalMs - a.totalMs).slice(0, 5);
  if (slowest.length > 0) {
    console.log(`  slowest     : ${slowest.map((route) => `${route.slug} ${(route.totalMs / 1000).toFixed(1)}s`).join(" · ")}`);
  }
  const counters = Object.entries(recorder.counters).filter(([, value]) => value > 0);
  if (counters.length > 0) {
    console.log(`  counters    : ${counters.map(([key, value]) => `${key}=${value}`).join(" · ")}`);
  }
  if (problems.length > 0) {
    console.log(`  problems (${problems.length}):`);
    for (const problem of problems.slice(0, 40)) console.log(`    ${problem.channel}: ${problem.message}`);
  } else {
    console.log("  problems    : none");
  }
}
