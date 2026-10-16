/**
 * Demo-block screenshotter (Phase 7 visual review).
 *
 * A full-page capture of a documentation route is unreadable once it is
 * downscaled into a review window, and a screenshot of the page is not evidence
 * that any individual component was exercised. This captures each `Demo` block
 * on its own, named after the route and its position, so a defect can be
 * pointed at rather than described.
 *
 *   node qa/shots.mjs --routes=components-tree-view,components-board
 *   node qa/shots.mjs --route-groups=charts --limit=6
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { DESKTOP } from "./constants.mjs";
import { parseOptions } from "./config.mjs";
import { navigateAndReady, readThrough } from "./readiness.mjs";
import { ROUTES, selectRoutes, slugsInGroup } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const limit = Number.parseInt(process.env.LUC_SHOTS_LIMIT ?? "0", 10) || Infinity;
  const selected = options.slugs.length
    ? options.slugs
    : options.routeGroups.length
      ? options.routeGroups.flatMap((group) => slugsInGroup(group))
      : ROUTES.map((route) => route.slug);
  const routes = selectRoutes(selected);
  const outRoot = path.join(packageRoot, "artifacts/phase7");
  await mkdir(outRoot, { recursive: true });

  const browser = await chromium.launch();
  const written = [];
  for (const route of routes) {
    const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
      await navigateAndReady(page, `${options.baseUrl}${route.path}`);
      await readThrough(page, { stepDelayMs: 40, tailMs: 120, endMs: 80 });
      const count = await page.locator('[data-slot="demo"]').count();
      const dir = path.join(outRoot, route.slug);
      await mkdir(dir, { recursive: true });
      let taken = 0;
      for (let index = 0; index < count && taken < limit; index += 1) {
        const demo = page.locator('[data-slot="demo"]').nth(index);
        if (!(await demo.isVisible().catch(() => false))) continue;
        const file = path.join(dir, `demo-${String(index).padStart(2, "0")}.png`);
        const ok = await demo
          .screenshot({ path: file, animations: "disabled", caret: "hide" })
          .then(() => true)
          .catch(() => false);
        if (ok) {
          written.push(path.relative(packageRoot, file));
          taken += 1;
        }
      }
      console.log(`  ${route.slug.padEnd(34)} demos ${taken}/${count}`);
    } catch (error) {
      console.log(`  ${route.slug.padEnd(34)} ERROR ${error}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
  await writeFile(path.join(outRoot, "shots.json"), JSON.stringify(written, null, 2));
  console.log(`\n${written.length} demo captures → ${path.relative(packageRoot, outRoot)}`);
}

await main();
