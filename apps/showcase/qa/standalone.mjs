/**
 * DEV-002 — the Showcase is standalone.
 *
 * The Showcase is a design-system reference, not a product surface. It must
 * build and run with no LUC server, no database and no network: everything it
 * renders comes from a fixture in this repository. That is what makes the Docker
 * preview safe to run, and it is also the property a single careless import
 * destroys — one `import type … from "luc-web"` and the review image needs a
 * product checkout to compile.
 *
 * Three assertions, all on source:
 *
 *   1. no import crosses into another LUC product (`luc-web`, `luc-api`,
 *      `luc-jobs`, `luc-cron`, `luc-injest`, `luc-research`, `luc-artifact`);
 *   2. application code performs no network request of its own — no `fetch(`,
 *      no `XMLHttpRequest`, no `axios`;
 *   3. no production deployment variable is read (`LUC_API_*`, `LUC_WEB_*`,
 *      `REDIS_*`, `CLICKHOUSE_*`, `PREFECT_*`).
 *
 *   node qa/standalone.mjs
 *   node qa/standalone.mjs --json
 *
 * QA, scripts and tests are excluded from (2): a capture script may drive a
 * browser, and a test may assert on a URL. They are *not* excluded from (1) —
 * nothing in this app may reach a product module.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");

/** Directories whose source is application code. */
const SOURCE_ROOTS = ["app", "components", "lib"].map((dir) => path.join(APP, dir));

/** Directories that ship with the app but are tooling, not application code. */
const TOOLING_SEGMENTS = ["/qa/", "/scripts/", "/tests/"];

const FORBIDDEN_IMPORT = /(?:from|import)\s*\(?\s*["']((?:@luc\/)?(?:luc-web|luc-api|luc-jobs|luc-cron|luc-injest|luc-research|luc-artifact)(?:\/[^"']*)?)["']/g;
const FORBIDDEN_NETWORK = /\b(fetch\s*\(|new\s+XMLHttpRequest|from\s+["']axios["'])/;
const FORBIDDEN_ENV = /process\.env\.(LUC_API_[A-Z_]*|LUC_WEB_[A-Z_]*|REDIS_[A-Z_]*|CLICKHOUSE_[A-Z_]*|PREFECT_[A-Z_]*)/g;

async function collect(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "artifacts") continue;
    if (entry.isDirectory()) found.push(...(await collect(full)));
    else if (/\.(ts|tsx|mjs|js|jsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) found.push(full);
  }
  return found;
}

const files = (await Promise.all(SOURCE_ROOTS.map(collect))).flat();
const importViolations = [];
const networkViolations = [];
const envViolations = [];

for (const file of files) {
  const relative = path.relative(APP, file);
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(FORBIDDEN_IMPORT)) {
    importViolations.push(`${relative}: imports "${match[1]}"`);
  }
  for (const match of source.matchAll(FORBIDDEN_ENV)) {
    envViolations.push(`${relative}: reads ${match[1]}`);
  }
  const tooling = TOOLING_SEGMENTS.some((segment) => file.includes(segment));
  if (!tooling) {
    const line = source.split("\n").findIndex((text) => FORBIDDEN_NETWORK.test(text));
    if (line >= 0) networkViolations.push(`${relative}:${line + 1}: ${source.split("\n")[line].trim().slice(0, 90)}`);
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  files: files.length,
  imports: importViolations,
  network: networkViolations,
  environment: envViolations,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`standalone scan: ${files.length} source files under app/, components/, lib/\n`);
  process.stdout.write(`  product imports : ${importViolations.length}\n`);
  process.stdout.write(`  network calls   : ${networkViolations.length}\n`);
  process.stdout.write(`  deployment env  : ${envViolations.length}\n`);
  for (const line of [...importViolations, ...networkViolations, ...envViolations]) process.stdout.write(`  - ${line}\n`);
  process.stdout.write(
    importViolations.length + networkViolations.length + envViolations.length === 0
      ? "\nThe Showcase is standalone: no product import, no request, no deployment variable.\n"
      : "\nThe Showcase is no longer standalone.\n",
  );
}

process.exit(importViolations.length + networkViolations.length + envViolations.length === 0 ? 0 : 1);
