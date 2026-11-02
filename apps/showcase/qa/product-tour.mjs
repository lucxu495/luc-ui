/**
 * Focused Product Tour interaction sweep.
 *
 * The unit suite covers the engine and lifecycle in jsdom. This browser pass
 * proves the parts jsdom cannot: viewport geometry, nested scrolling, a target
 * that appears after the tour has opened, and the reduced-motion CSS path.
 */

import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.env.LUC_QA_URL ?? "http://localhost:3000";
const route = `${base}/components/product-tour`;
const browser = await chromium.launch({ headless: true });
const results = [];

async function check(name, contextOptions, run) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  try {
    await page.goto(route, { waitUntil: "networkidle" });
    await run(page);
    results.push({ name, status: "passed" });
  } catch (error) {
    results.push({ name, status: "failed", error: String(error) });
  } finally {
    await context.close();
  }
}

async function start(page, scenario) {
  if (scenario) {
    await page
      .getByRole("radio", { name: scenario, exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: /^(Start tour|Replay tour|Preview welcome)$/ })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(450);
}

async function targetBox(page) {
  const box = await page.locator('[data-slot="product-tour-target"]').boundingBox();
  assert.ok(box, "the spotlight target should be measurable");
  return box;
}

await check("manual steps and spotlight movement", { viewport: { width: 1440, height: 900 } }, async (page) => {
  await start(page);
  const first = await targetBox(page);
  assert.match(await page.getByRole("dialog").innerText(), /Find the signal/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(
      "Keep the next idea",
    ),
  );
  await page.waitForTimeout(350);
  const second = await targetBox(page);
  assert.ok(Math.abs(first.x - second.x) > 1 || Math.abs(first.y - second.y) > 1);
});

await check("welcome intro before step one", { viewport: { width: 1440, height: 900 } }, async (page) => {
  await start(page, "Welcome");
  const dialog = page.getByRole("dialog");
  assert.match(await dialog.innerText(), /Let’s take a tour\?/);
  assert.match(await dialog.innerText(), /5 quiet steps/);
  await page.getByRole("button", { name: "Take the tour" }).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(
      "WORKSPACE · 01",
    ),
  );
  await page.getByRole("button", { name: "Close tour" }).click();
  await page.getByRole("button", { name: "Preview welcome" }).click();
  await page.getByRole("button", { name: "I’ll explore on my own" }).click();
  await page.waitForFunction(() => !document.querySelector('[data-slot="product-tour-bubble"]'));
});

await check("auto pause, resume and final-step stop", { viewport: { width: 1440, height: 900 } }, async (page) => {
  await start(page, "Auto · 2s");
  const dialog = page.getByRole("dialog");
  const box = await dialog.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const pausedCopy = await dialog.innerText();
  await page.waitForTimeout(2300);
  assert.equal(await dialog.innerText(), pausedCopy, "hover should pause auto advance");
  await page.mouse.move(2, 2);
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(
      "WORKSPACE · 02",
    ),
  );
  for (const label of ["WORKSPACE · 03", "WORKSPACE · 04", "WORKSPACE · 05"]) {
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForFunction(
      (expected) =>
        document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(expected),
      label,
    );
  }
  await page.waitForTimeout(2300);
  assert.match(await dialog.innerText(), /WORKSPACE · 05/, "the final auto step must stop");
});

await check("nested scroll and edge collision", { viewport: { width: 390, height: 844 } }, async (page) => {
  await start(page, "Nested");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(
      "The next step lives below the fold",
    ),
  );
  const nestedTarget = await page.locator("#tour-nested-row-7").boundingBox();
  assert.ok(nestedTarget);
  assert.ok(nestedTarget.y >= 0 && nestedTarget.y + nestedTarget.height <= 844);

  await page.getByRole("button", { name: "Close tour" }).click();
  await page.getByRole("radio", { name: "Edge", exact: true }).click();
  await page.getByRole("button", { name: "Replay tour" }).click();
  await page.waitForTimeout(450);
  const bubble = await page.getByRole("dialog").boundingBox();
  assert.ok(bubble);
  assert.ok(bubble.x >= 0 && bubble.y >= 0);
  assert.ok(bubble.x + bubble.width <= 390);
  assert.ok(bubble.y + bubble.height <= 844);
});

await check("dynamic target recovery", { viewport: { width: 390, height: 844 } }, async (page) => {
  await start(page, "Recovery");
  assert.match(await page.getByRole("dialog").innerText(), /The anchor moved/);
  await page.waitForFunction(
    () =>
      document.querySelector('[data-slot="product-tour-bubble"]')?.textContent?.includes(
        "The description waits",
      ),
    { timeout: 4000 },
  );
  const target = await page.locator("#tour-recovery-anchor").boundingBox();
  assert.ok(target && target.height > 0);
});

await check(
  "reduced motion removes travel",
  { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" },
  async (page) => {
    await start(page);
    const durations = await page.evaluate(() => {
      const bubble = document.querySelector('[data-slot="product-tour-bubble"]');
      const target = document.querySelector('[data-slot="product-tour-target"]');
      return [bubble, target].map((node) =>
        node ? parseFloat(getComputedStyle(node).transitionDuration) : Infinity,
      );
    });
    assert.ok(durations.every((duration) => duration <= 0.01));
  },
);

await browser.close();

for (const result of results) {
  console.log(`${result.status === "passed" ? "PASS" : "FAIL"} ${result.name}`);
  if (result.error) console.error(`     ${result.error}`);
}
if (results.some((result) => result.status === "failed")) process.exitCode = 1;
