/**
 * Ad-hoc probe: what is the accessible name of every control in the shell?
 *
 * Phase 10A added a small-viewport search button whose visible label is hidden
 * below `sm`. The full axe sweep reported a nameless button on thirty-five mobile
 * routes, and a class-name selector in the report is not enough to know *which*
 * element — so this probe prints, for one route and one viewport, every button's
 * computed accessible name and the markup behind it.
 *
 *   node qa/probe-header-a11y.mjs --route=/components/buttons --width=390
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

import { navigateAndReady } from "./readiness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

function arg(name, fallback) {
  const hit = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const route = arg("route", "/components/buttons");
const width = Number.parseInt(arg("width", "390"), 10);
const baseUrl = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch();
/* A context rather than `newPage`: axe's Playwright binding requires one. */
const context = await browser.newContext({ viewport: { width, height: 900 } });
const page = await context.newPage();
await navigateAndReady(page, `${baseUrl}${route}`);

const controls = await page.evaluate(() => {
  const name = (node) => {
    const label = node.getAttribute("aria-label");
    if (label?.trim()) return label.trim();
    const text = node.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
    const title = node.getAttribute("title");
    return title ? `(title) ${title}` : "";
  };
  return Array.from(document.querySelectorAll("button")).map((node) => ({
    name: name(node),
    classes: node.className.toString().slice(0, 90),
    visible: node.getBoundingClientRect().width > 0,
  }));
});

for (const control of controls) {
  console.log(
    `${control.visible ? "visible" : "hidden "} | ${control.name ? `"${control.name}"` : "(NO NAME)"} | ${control.classes}`,
  );
}
console.log(`\n${controls.filter((control) => !control.name).length} control(s) without a name at ${width}px`);

/*
 * The same question asked by axe, because a control can be *named* and still fail
 * a name rule when the name lives on a wrapper, or when an ancestor is hidden from
 * the accessibility tree.
 */
const results = await new AxeBuilder({ page }).analyze();
const nameless = results.violations.filter((violation) => violation.id === "button-name");
for (const violation of nameless) {
  for (const node of violation.nodes) {
    console.log(`\naxe ${violation.id} (${violation.impact})\n  target: ${JSON.stringify(node.target)}\n  html: ${node.html.slice(0, 260)}`);
  }
}
console.log(`\naxe button-name violations: ${nameless.length}`);

await browser.close();
