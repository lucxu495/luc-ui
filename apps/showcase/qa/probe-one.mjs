/**
 * Ad-hoc single-route probe used during the Phase 7 audit: navigate, wait a
 * real amount of time (not a screenshot's frozen frame) and print whatever the
 * caller asks for. Kept because the defects it found in the AI stream are not
 * reproducible from a screenshot with `animations: disabled`.
 *
 *   node qa/probe-one.mjs --route=/components/ai --wait=4000 [--shot=out.png]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { DESKTOP } from "./constants.mjs";
import { navigateAndReady } from "./readiness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

function arg(name, fallback) {
  const hit = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const route = arg("route", "/");
const wait = Number.parseInt(arg("wait", "2500"), 10);
const shot = arg("shot", "");
const baseUrl = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: DESKTOP, deviceScaleFactor: 1 });
page.on("console", (message) => {
  if (message.type() === "error") console.log("console.error:", message.text());
});
page.on("pageerror", (error) => console.log("pageerror:", error.message));
await navigateAndReady(page, `${baseUrl}${route}`);
await page.waitForTimeout(wait);

const report = await page.evaluate(() => {
  const demos = Array.from(document.querySelectorAll('[data-slot="demo"]'));
  return demos.map((demo, index) => {
    const rect = demo.getBoundingClientRect();
    return {
      index,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      slots: Array.from(new Set(Array.from(demo.querySelectorAll("[data-slot]")).map((n) => n.getAttribute("data-slot")))),
      text: (demo.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 200),
    };
  });
});
console.log(JSON.stringify(report, null, 1));
if (shot) {
  const file = path.isAbsolute(shot) ? shot : path.join(packageRoot, shot);
  await page.screenshot({ path: file, fullPage: true });
  console.log("shot", file);
}
await browser.close();
