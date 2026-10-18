/**
 * Build and exercise Luc UI from outside its pnpm workspace.
 *
 * Each fixture is copied to a temporary directory, installed with plain npm,
 * built for production, started, and loaded in Chromium. The default source is
 * the just-packed artifact; `--mode=remote` installs the public Git tag that the
 * README recommends. Workspace links, tsconfig path aliases and source imports
 * are absent from both fixtures.
 *
 *   node tests/consumers/run.mjs
 *   node tests/consumers/run.mjs --mode=remote
 *   node tests/consumers/run.mjs --mode=remote --ref=v1.0.1
 *   node tests/consumers/run.mjs --fixtures=vite
 */

import { execFile, spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";
import { ensurePack } from "../../packages/ui/scripts/lib/pack.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const fixturesRoot = path.join(here, "fixtures");
const outRoot = path.join(root, "artifacts/consumers");
const args = new Set(process.argv.slice(2));
const mode = process.argv.find((value) => value.startsWith("--mode="))?.slice("--mode=".length) ?? "artifact";
const requestedRef = process.argv.find((value) => value.startsWith("--ref="))?.slice("--ref=".length);
const requested = (process.argv.find((value) => value.startsWith("--fixtures="))?.slice("--fixtures=".length) ?? "vite,next")
  .split(",")
  .filter(Boolean);
const keep = process.env.LUC_KEEP_CONSUMER_FIXTURE === "1";

if (mode !== "artifact" && mode !== "remote") {
  throw new Error(`unknown consumer mode "${mode}"`);
}

await run("pnpm", ["--filter", "@luc/ui", "build:package"], {
  cwd: root,
  maxBuffer: 16 * 1024 * 1024,
  timeout: 300_000,
});
const tarball = await ensurePack(path.join(root, "packages/ui"));
const packageVersion = JSON.parse(await readFile(path.join(root, "packages/ui/package.json"), "utf8")).version;
const ref = requestedRef ?? `v${packageVersion}`;
const spec = mode === "remote" ? `github:lucxu495/luc-ui#${ref}` : `file:${tarball}`;

async function waitFor(url, child, logs) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`server exited ${child.exitCode}\n${logs.join("")}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* not listening yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not answer at ${url}\n${logs.join("")}`);
}

async function start(command, commandArgs, cwd, url) {
  const child = spawn(command, commandArgs, {
    cwd,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  try {
    await waitFor(url, child, logs);
    return { child, logs };
  } catch (error) {
    child.kill("SIGTERM");
    throw error;
  }
}

async function stop(server) {
  if (server === undefined) return;
  server.child.kill("SIGTERM");
  await new Promise((resolve) => {
    if (server.child.exitCode !== null) return resolve();
    server.child.once("exit", resolve);
    setTimeout(resolve, 5000);
  });
}

async function inspect(browser, name, url) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="consumer-button"]') !== null);
  await page.waitForTimeout(2500);

  const before = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    dark: document.documentElement.classList.contains("dark"),
    radius: getComputedStyle(document.querySelector('[data-testid="consumer-button"]')).borderRadius,
    canvas: document.querySelectorAll('[data-testid="chart-card"] canvas').length,
    input: document.querySelector('[data-testid="consumer-input"]')?.value,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  await page.locator('[data-testid="theme-toggle"]').click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    dark: document.documentElement.classList.contains("dark"),
    bodyBackground: getComputedStyle(document.body).backgroundColor,
  }));

  await page.screenshot({ path: path.join(outRoot, `${name}.png`), fullPage: true });
  await context.close();

  const hydration = [...consoleErrors, ...pageErrors].filter((message) =>
    /hydration|server rendered HTML|did not match/i.test(message),
  );
  const problems = [];
  if ((response?.status() ?? 0) !== 200) problems.push(`HTTP ${response?.status() ?? 0}`);
  if (before.theme !== "dark" || !before.dark) problems.push("default dark theme was not applied");
  if (after.theme === before.theme || after.dark === before.dark) problems.push("theme toggle did not change the document");
  if (before.bodyBackground === "rgba(0, 0, 0, 0)") problems.push("body background is unstyled");
  if (!(Number.parseFloat(before.radius) > 0)) problems.push("consumer button has browser-default corners");
  if (before.input !== "research-notes" && before.input !== "macro-desk") problems.push("form value did not render");
  if (before.canvas < 1) problems.push("chart rendered no canvas");
  if (before.overflow > 0) problems.push(`horizontal overflow ${before.overflow}px`);
  if (consoleErrors.length > 0) problems.push(`${consoleErrors.length} console error(s): ${consoleErrors[0]}`);
  if (pageErrors.length > 0) problems.push(`${pageErrors.length} page error(s): ${pageErrors[0]}`);
  if (hydration.length > 0) problems.push(`hydration error: ${hydration[0]}`);
  return { response: response?.status() ?? 0, before, after, consoleErrors, pageErrors, problems };
}

const cases = {
  vite: {
    fixture: path.join(fixturesRoot, "vite"),
    command: ["vite", "preview", "--host", "127.0.0.1", "--port", "4173"],
    url: "http://127.0.0.1:4173",
  },
  next: {
    fixture: path.join(fixturesRoot, "next"),
    command: ["next", "start", "--hostname", "127.0.0.1", "--port", "4174"],
    url: "http://127.0.0.1:4174",
  },
};

await mkdir(outRoot, { recursive: true });
const browser = await chromium.launch();
const results = {};
try {
  for (const name of requested) {
    const config = cases[name];
    if (!config) throw new Error(`unknown fixture "${name}"`);
    const fixture = await mkdtemp(path.join(tmpdir(), `luc-ui-${name}-consumer-`));
    const logs = [];
    let server;
    try {
      await cp(config.fixture, fixture, { recursive: true });
      const manifestPath = path.join(fixture, "package.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      manifest.dependencies["@luc/ui"] = spec;
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

      const install = await run("npm", ["install", "--no-audit", "--no-fund"], {
        cwd: fixture,
        maxBuffer: 24 * 1024 * 1024,
        timeout: 600_000,
      });
      logs.push(install.stdout, install.stderr);
      const build = await run("npm", ["run", "build"], {
        cwd: fixture,
        maxBuffer: 24 * 1024 * 1024,
        timeout: 600_000,
      });
      logs.push(build.stdout, build.stderr);

      const bin = path.join(fixture, "node_modules/.bin");
      server = await start(path.join(bin, config.command[0]), config.command.slice(1), fixture, config.url);
      const browserResult = await inspect(browser, name, config.url);
      results[name] = {
        source: spec,
        fixture,
        install: "pass",
        build: "pass",
        browser: browserResult,
        result: browserResult.problems.length === 0 ? "pass" : "fail",
      };
    } catch (error) {
      results[name] = {
        source: spec,
        fixture,
        install: results[name]?.install ?? "fail",
        build: results[name]?.build ?? "fail",
        browser: null,
        logs: [...logs, String(error?.stack ?? error)].join("\n").slice(-20_000),
        result: "fail",
      };
    } finally {
      await stop(server);
      if (!keep) await rm(fixture, { recursive: true, force: true });
      else results[name].fixture = fixture;
    }
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  mode,
  ref: mode === "remote" ? ref : null,
  packageSource: spec,
  tarball,
  results,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
await writeFile(path.join(outRoot, `report-${mode}.json`), serialized, "utf8");
await writeFile(path.join(outRoot, "report.json"), serialized, "utf8");

for (const [name, result] of Object.entries(results)) {
  console.log(`${name}: ${result.result} (${result.source})`);
  for (const problem of result.browser?.problems ?? []) console.log(`  ✗ ${problem}`);
}
console.log(`report: ${path.relative(root, path.join(outRoot, "report.json"))}`);

process.exitCode = Object.values(results).every((result) => result.result === "pass") ? 0 : 1;
