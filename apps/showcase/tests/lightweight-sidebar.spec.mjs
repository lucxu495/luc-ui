import { expect, test } from "@playwright/test";

const samples = ["candles", "line", "area", "comparison", "panes", "sharpe"];

test("Lightweight Charts sidebar exposes six real examples", async ({ page }) => {
  await page.goto("/charts/lightweight");
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1");
  await expect(page.getByRole("heading", { name: "Lightweight Charts Gallery" })).toBeVisible();
  // Navigation is derived from the same group used by desktop sidebar and mobile drawer.
  const links = page.locator('a[href^="/charts/lightweight/"]');
  for (const slug of samples) {
    await expect(page.locator(`a[href="/charts/lightweight/${slug}"]`).first()).toBeVisible();
  }
  expect(await links.count()).toBeGreaterThanOrEqual(6);

  // The actual global Sidebar — not just cards in the gallery — must expose the section.
  const sidebar = page.locator('[data-slot="sidebar-content"]');
  const group = sidebar.locator('[data-slot="sidebar-group"]').filter({ hasText: "Lightweight Charts" }).first();
  await expect(group.locator('[data-slot="sidebar-group-label"]')).toHaveText("Lightweight Charts");
  await expect(group.getByRole("link", { name: "Gallery overview" })).toHaveAttribute("href", "/charts/lightweight");
  await expect(group.getByRole("link", { name: "Official plugins roadmap" })).toHaveAttribute("href", "/charts/lightweight/plugins");

  // Disclose all six nested example links and navigate using Sidebar itself.
  await group.getByRole("button", { name: "Live examples" }).click();
  for (const slug of samples) {
    await expect(group.locator(`a[href="/charts/lightweight/${slug}"]`)).toBeVisible();
  }
  await group.locator('a[href="/charts/lightweight/panes"]').click();
  await expect(page.locator('[data-qa="lightweight-panes"]')).toBeVisible();
});

test("plugin roadmap lists all published upstream packages without fake demos", async ({ page }) => {
  await page.goto("/charts/lightweight/plugins");
  await expect(page.getByRole("heading", { name: "Official Plugins Roadmap" })).toBeVisible();
  await expect(page.locator("[data-plugin-id]")).toHaveCount(19);
  await expect(page.getByText(/Not integrated/)).toHaveCount(19);
  await expect(page.locator('a[href="/charts/lightweight/heatmap-series"]')).toHaveCount(0);
});

for (const slug of samples) {
  test(`Lightweight Charts ${slug}: real canvas, controls and responsive plot`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/charts/lightweight/${slug}`);
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1");
    const example = page.locator(`[data-qa="lightweight-${slug}"]`);
    await expect(example).toBeVisible();
    const chart = example.locator('[data-slot="lightweight-surface"]').first();
    await expect(chart).toBeVisible();
    await expect(chart.locator("canvas").first()).toBeVisible();
    const box = await chart.boundingBox();
    expect(box?.height).toBeGreaterThan(250);
    expect(box?.width).toBeGreaterThan(280);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await example.getByRole("button", { name: "Toggle last price" }).click();
    await example.getByRole("button", { name: "Toggle Mocha theme" }).click();
    await expect(chart).toBeVisible();
    expect(errors).toEqual([]);
  });
}
