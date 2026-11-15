import { expect, test } from "@playwright/test";

async function openFinancial(page) {
  await page.goto("/charts/financial", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.documentElement.dataset.lucHydrated === "1",
    null,
    { timeout: 20_000 },
  );
  await expect(page.getByRole("heading", { name: "Price, volume, panes" })).toBeVisible();
  await expect(page.locator('[data-slot="lightweight-surface"]').first()).toBeVisible();
}

test("financial charts: controls, crosshair, themes and viewport", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openFinancial(page);

  const firstSurface = page.locator('[data-slot="lightweight-surface"]').first();
  await expect(firstSurface).toHaveAttribute("tabindex", "0");
  await expect(page.locator('a[href*="tradingview.com"]').first()).toBeVisible();

  const box = await firstSurface.boundingBox();
  expect(box?.width).toBeGreaterThan(320);
  expect(box?.height).toBeGreaterThan(280);
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.4);
  await expect(page.locator('[data-slot="financial-chart-tooltip"]').first()).toBeVisible();

  const volume = page.getByRole("button", { name: "Toggle volume" }).first();
  await volume.click();
  await expect(volume).toHaveAttribute("aria-pressed", "false");
  await volume.click();
  await expect(volume).toHaveAttribute("aria-pressed", "true");

  const sharpe = page.getByRole("button", { name: "Toggle Sharpe pane" });
  await sharpe.click();
  await expect(sharpe).toHaveAttribute("aria-pressed", "false");
  await sharpe.click();

  const linear = page.getByRole("radio", { name: "Linear" });
  const log = page.getByRole("radio", { name: "Log" });
  await linear.click();
  await expect(linear).toHaveAttribute("data-state", "on");
  await log.click();
  await expect(log).toHaveAttribute("data-state", "on");

  await page.getByLabel("Light theme", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await expect(page.getByRole("heading", { name: "Price, volume, panes" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("financial charts: phone layout has a usable plot without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFinancial(page);

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1);

  const surface = page.locator('[data-slot="lightweight-surface"]').first();
  const box = await surface.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(280);
  await expect(page.getByRole("button", { name: "Reset viewport" }).first()).toBeVisible();
});
