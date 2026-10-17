/**
 * Charts and provider-integration documentation content contract.
 *
 * The static unit test proves the structured curation exists. This probe proves
 * the reader can actually reach it: every canonical chart route renders the
 * purpose, data contract, important configuration, Guidelines, Usage, API and
 * accessibility sections; every integration route renders public usage snippets,
 * provider boundaries, Guidelines and an API/reference area.
 *
 * Routes are derived from the generated navigation projection, not hard-coded,
 * so a new chart or widget page enters this gate automatically.
 *
 *   node qa/content-contract.mjs
 *   node qa/content-contract.mjs --json
 *   node qa/content-contract.mjs --limit=10
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const OUT = path.resolve(APP, "artifacts/qa/content-contract");
const BASE = resolveBaseUrl();
const args = new Set(process.argv.slice(2));
const limit = Number.parseInt(
  process.argv.find((value) => value.startsWith("--limit="))?.slice("--limit=".length) ?? "0",
  10,
);

async function documentedRoutes() {
  const nav = await readFile(path.join(APP, "lib/docs/generated/nav.ts"), "utf8");
  return [...nav.matchAll(
    /"id": "([^"]+)",\s*"t": "[^"]*",\s*"r": "([^"]+)",\s*"f": "[^"]*",\s*"g": "(charts|integrations)"/g,
  )].map((match) => ({ id: match[1], route: match[2], group: match[3] }));
}

const all = await documentedRoutes();
const routes = limit > 0 ? all.slice(0, limit) : all;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const findings = [];

for (const entry of routes) {
  const problems = [];
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 220));
  };
  const onPageError = (error) => pageErrors.push(String(error.message).slice(0, 220));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    const response = await page.goto(`${BASE}${entry.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    if ((response?.status() ?? 0) !== 200) problems.push(`HTTP ${response?.status() ?? 0}`);
    await page
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20_000 })
      .catch(() => problems.push("not hydrated"));

    const content = await page.evaluate(() => {
      const section = (id) => document.getElementById(id)?.closest("section") ?? null;
      const text = (id) => section(id)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const codes = [...(section("usage")?.querySelectorAll("pre code") ?? [])].map(
        (node) => node.textContent ?? "",
      );
      return {
        headings: ["what-it-shows", "data-contract", "guidelines", "usage", "configuration", "accessibility", "api", "provider-configuration"]
          .filter((id) => document.getElementById(id) !== null),
        purpose: text("what-it-shows"),
        contract: text("data-contract"),
        usage: text("usage"),
        integrations: text("provider-configuration"),
        guidelines: text("guidelines"),
        codes,
        duplicateIds: [...document.querySelectorAll("[id]")]
          .map((node) => node.id)
          .filter((id, index, ids) => ids.indexOf(id) !== index),
      };
    });

    if (entry.group === "charts") {
      for (const id of ["what-it-shows", "data-contract", "guidelines", "usage", "configuration", "accessibility"]) {
        if (!content.headings.includes(id)) problems.push(`missing #${id}`);
      }
      if (content.purpose.length < 35) problems.push("purpose is missing or too short");
      if (content.contract.length < 60) problems.push("data contract is missing or too short");
      if (content.guidelines.length < 35) problems.push("Guidelines are missing or too short");
      if (content.codes.length === 0 || !content.codes.some((code) => code.length > 60)) {
        problems.push("Usage has no copyable chart call");
      }
    } else {
      for (const id of ["usage", "provider-configuration", "guidelines", "api"]) {
        if (!content.headings.includes(id)) problems.push(`missing #${id}`);
      }
      if (!content.usage.includes("@luc/ui/tradingview")) problems.push("Usage does not show the public import");
      if (content.codes.length === 0 || !content.codes.some((code) => code.includes("<TradingView"))) {
        problems.push("Usage has no public widget JSX");
      }
      if (!content.integrations.includes("TradingView")) problems.push("provider boundary copy is absent");
      if (!content.guidelines.includes("Do") && !content.guidelines.includes("Use")) {
        problems.push("Guidelines are absent");
      }
    }
    if (content.duplicateIds.length > 0) problems.push(`duplicate id(s): ${[...new Set(content.duplicateIds)].join(", ")}`);
  } catch (error) {
    problems.push(`probe failed: ${String(error?.message ?? error).slice(0, 180)}`);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
  if (consoleErrors.length > 0) problems.push(`${consoleErrors.length} console error(s): ${consoleErrors[0]}`);
  if (pageErrors.length > 0) problems.push(`${pageErrors.length} page error(s): ${pageErrors[0]}`);
  if (problems.length > 0) findings.push({ ...entry, problems });
}

await browser.close();
await mkdir(OUT, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  routeCount: routes.length,
  charts: routes.filter((entry) => entry.group === "charts").length,
  integrations: routes.filter((entry) => entry.group === "integrations").length,
  scanned: routes.length - findings.length,
  findings,
};
await writeFile(path.join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (args.has("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(
    `content contract · ${report.charts} chart(s) + ${report.integrations} integration page(s) · ${report.scanned}/${report.routeCount} passed`,
  );
  for (const finding of findings) console.log(`  FAIL ${finding.route} — ${finding.problems.join("; ")}`);
  console.log(`  report: ${path.relative(process.cwd(), path.join(OUT, "report.json"))}`);
}

process.exitCode = findings.length > 0 ? 1 : 0;
