/**
 * WB-001 / WB-003 / WB-004 — what the panel must do.
 *
 *  - **WB-001** asks for a labelled Reset on every playground that restores the
 *    documented defaults *and* regenerates the code from the same state the
 *    specimen renders from. That is a behaviour, not a button, so this probe
 *    drives it: change a control, read the code, press Reset, read it again.
 *  - **WB-003** asks for bands and derived presets: the advanced band starts
 *    collapsed, and a preset is derived from the adapter's own option list —
 *    so pressing one must change the generated code and become the pressed one.
 *  - **WB-004** asks that an invalid combination is explained. The assertion is
 *    deliberately blunt: **every disabled control in the panel carries a
 *    sentence**, because a disabled control with no reason is exactly the
 *    silent fallback the item forbids.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/playground.mjs
 *   node qa/playground.mjs --routes=/components/buttons,/charts/line-chart
 *
 * A route with no playground is reported as `no-playground` rather than passing
 * silently, because "no panel" and "a panel that works" are different facts.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = resolveBaseUrl();
const ROUTES = (
  process.argv.find((a) => a.startsWith("--routes="))?.slice("--routes=".length) ??
  "/components/ai,/charts/line-chart,/motion/kinetic"
).split(",");

const CODE_TEXT = () => {
  const pre = document.querySelector('[data-slot="playground"] details pre code');
  return pre?.textContent ?? null;
};

/**
 * Disabled controls that say nothing about why.
 *
 * A disabled input is `<button disabled>`, `<input disabled>` or an
 * `aria-disabled` element depending on the primitive. Each one lives inside the
 * `FieldFrame` wrapper that owns its label, its control and its explanation, so
 * "does this control explain itself" is "does its wrapper contain a sentence".
 */
const INERT_WITHOUT_REASON = () => {
  const panel = document.querySelector('[data-slot="playground-controls"]');
  if (!panel) return { total: 0, silent: [] };
  const silent = [];
  const disabled = panel.querySelectorAll('[disabled], [aria-disabled="true"], [data-disabled]');
  for (const control of disabled) {
    let wrapper = control;
    while (wrapper.parentElement && wrapper.parentElement !== panel) wrapper = wrapper.parentElement;
    const sentence = [...wrapper.querySelectorAll("p")].some(
      (paragraph) => (paragraph.textContent ?? "").trim().length >= 30,
    );
    if (!sentence) silent.push((control.getAttribute("aria-label") ?? control.textContent ?? "?").trim().slice(0, 40));
  }
  /* `total` is reported so a run cannot pass vacuously: "no disabled control had
   * no reason" is only evidence if there were disabled controls to check. */
  return { total: disabled.length, silent };
};

/**
 * Change one control, whatever shape it is.
 *
 * The controls are LUC primitives — a Radix combobox for an enum, a switch, a
 * segmented control, a slider — so each is driven the way a reader drives it.
 */
async function changeFirstControl(page) {
  const panel = page.locator('[data-slot="playground-controls"]');
  const combo = panel.locator('button[role="combobox"]').first();
  if ((await combo.count()) > 0) {
    const name = await combo.getAttribute("aria-label");
    await combo.click();
    const option = page.locator('[role="option"][aria-selected="false"]').first();
    if ((await option.count()) > 0) {
      await option.click();
      return `combobox:${name}`;
    }
    await page.keyboard.press("Escape");
  }
  const check = panel.locator('input[type="checkbox"]').first();
  if ((await check.count()) > 0) {
    await check.click({ force: true });
    return "switch";
  }
  const radio = panel.locator('button[role="radio"][aria-checked="false"]').first();
  if ((await radio.count()) > 0) {
    await radio.click();
    return "segmented";
  }
  const slider = panel.locator('[role="slider"]').first();
  if ((await slider.count()) > 0) {
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    return "slider";
  }
  return null;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const report = { generatedAt: new Date().toISOString(), base: BASE, routes: {}, failures: [] };

for (const route of ROUTES) {
  const entry = { problems: [], changedControl: null, codeChanged: false, resetRestored: false };
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 20000 });
    const hasPanel = (await page.locator('[data-slot="playground"]').count()) > 0;
    entry.playground = hasPanel;
    if (!hasPanel) {
      entry.problems.push("no-playground");
    } else {
      const before = await page.evaluate(CODE_TEXT);
      const changed = await changeFirstControl(page);
      entry.changedControl = changed;
      if (changed === null) entry.problems.push("no controllable input found");
      await page.waitForTimeout(350);
      const after = await page.evaluate(CODE_TEXT);
      entry.codeChanged = before !== null && after !== null && before !== after;
      if (!entry.codeChanged) entry.problems.push("changing a control did not change the generated code");

      const reset = page.getByRole("button", { name: /reset to defaults/i });
      if ((await reset.count()) === 0) entry.problems.push("no Reset control");
      else if (await reset.isDisabled()) entry.problems.push("Reset is still disabled after a change");
      else {
        await reset.click({ timeout: 5000 });
        await page.waitForTimeout(350);
        const restored = await page.evaluate(CODE_TEXT);
        entry.resetRestored = restored === before;
        if (!entry.resetRestored) entry.problems.push("Reset did not restore the generated code");
      }

      /* --- WB-003: presets ------------------------------------------------- */
      const presets = page.locator('[data-slot="playground-controls"] button[aria-pressed]');
      entry.presets = await presets.count();
      if (entry.presets < 2) {
        entry.problems.push(`no preset row (${entry.presets} preset button(s))`);
      } else {
        const target = presets.nth(entry.presets - 1);
        const beforePreset = await page.evaluate(CODE_TEXT);
        await target.click();
        await page.waitForTimeout(350);
        const afterPreset = await page.evaluate(CODE_TEXT);
        entry.presetApplied = beforePreset !== afterPreset;
        if (!entry.presetApplied) entry.problems.push("pressing a preset did not change the generated code");
        if ((await target.getAttribute("aria-pressed")) !== "true")
          entry.problems.push("the pressed preset did not become the active one");
      }

      /* --- WB-003: the advanced band is a closed disclosure ---------------- */
      const advanced = page.locator('[data-slot="playground-advanced"]');
      entry.advanced = await advanced.count();
      if (entry.advanced > 0) {
        const open = await advanced.first().evaluate((node) => node.hasAttribute("open"));
        entry.advancedOpenByDefault = open;
        if (open) entry.problems.push("the advanced band is open by default");
      } else {
        entry.problems.push("no advanced band declared");
      }

      /* --- WB-004: no disabled control is silent --------------------------- */
      const inert = await page.evaluate(INERT_WITHOUT_REASON);
      entry.disabledControls = inert.total;
      entry.silentDisabled = inert.silent;
      if (inert.silent.length > 0)
        entry.problems.push(
          `${inert.silent.length} of ${inert.total} disabled control(s) with no reason: ${inert.silent.join(" / ")}`,
        );

      /* Evidence, not decoration: the reviewer sees the panel in the state the
       * assertions were made in (a preset applied, an advanced band closed). */
      await page.screenshot({
        path: path.join(EVIDENCE, `playground-${route.replace(/\//g, "_").replace(/^_/, "")}.png`),
      });
    }
  } catch (error) {
    entry.problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  report.routes[route] = entry;
  if (entry.problems.length > 0) report.failures.push({ route, problems: entry.problems });
}

await context.close();
await browser.close();
await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "playground-probe.json");
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);

for (const [route, data] of Object.entries(report.routes)) {
  process.stdout.write(
    `${data.problems.length === 0 ? "PASS" : "SKIP"} ${route}  control=${data.changedControl ?? "-"} ` +
      `codeChanged=${data.codeChanged} reset=${data.resetRestored} presets=${data.presets ?? 0} ` +
      `advanced=${data.advanced ?? 0} disabled=${data.disabledControls ?? 0} silent=${data.silentDisabled?.length ?? 0}\n`,
  );
  for (const problem of data.problems) process.stdout.write(`     - ${problem}\n`);
}
process.stdout.write(`\nreport: ${outFile}\n`);
if (report.failures.some((f) => !f.problems.includes("no-playground"))) {
  process.exit(1);
}
