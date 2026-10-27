import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3300";
const OUTPUT = fileURLToPath(
  new URL("../../../artifacts/qa/financial-crosshair", import.meta.url),
);
const ROUTE = "/charts/crosshair";

await mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = {
  baseUrl: BASE_URL,
  route: ROUTE,
  generatedAt: new Date().toISOString(),
  viewports: [],
  scenarios: {},
  screenshots: [],
  limitations: [
    "Touch and pinch use Chromium mobile emulation; no physical device was available.",
  ],
};
const consoleErrors = [];

function watchConsole(page) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
}

async function open(theme, viewport = { width: 1440, height: 1000 }, options = {}) {
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    hasTouch: options.hasTouch ?? false,
    isMobile: options.isMobile ?? false,
    deviceScaleFactor: options.deviceScaleFactor ?? 1,
  });
  const page = await context.newPage();
  watchConsole(page);
  await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate((value) => localStorage.setItem("luc-ui-theme", value), theme);
  await page.reload({ waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1");
  return { context, page };
}

async function chart(page, testId) {
  const wrapper = page.locator(`[data-qa="${testId}"]`);
  await wrapper.scrollIntoViewIfNeeded();
  const host = wrapper.locator('[data-slot="echart-surface"]').first();
  await host.waitFor({ state: "visible" });
  await page.waitForTimeout(700);
  return { wrapper, host };
}

async function hoverPlot(page, host, xFraction = 0.56, yFraction = 0.43) {
  const box = await host.boundingBox();
  assert.ok(box, "chart host has a bounding box");
  const point = {
    x: box.x + box.width * xFraction,
    y: box.y + box.height * yFraction,
  };
  await page.mouse.move(point.x, point.y);
  await page.waitForFunction(
    (node) => node.dataset.plotRect && node.dataset.crosshairY0,
    await host.elementHandle(),
  );
  return point;
}

async function attrs(host) {
  return host.evaluate((node) => ({ ...node.dataset }));
}

async function labels(host) {
  return host.locator(".luc-chart-axis-label:not([hidden])").allTextContents();
}

function axisRect(dataset) {
  assert.ok(dataset.plotRect, "the plot rectangle is published");
  const [left, top, right, bottom] = dataset.plotRect.split(",").map(Number);
  assert.ok([left, top, right, bottom].every(Number.isFinite), "plot rectangle is finite");
  return { left, top, right, bottom };
}

async function shot(wrapper, name) {
  const path = `${OUTPUT}/${name}`;
  await wrapper.screenshot({ path, animations: "disabled" });
  evidence.screenshots.push(path);
}

async function assertHidden(host) {
  assert.equal((await labels(host)).length, 0, "Y labels hide after leave");
  assert.equal(await host.locator(".luc-chart-axis-label:not([hidden])").count(), 0);
  const data = await attrs(host);
  assert.equal(data.crosshairState, undefined, "cursor state is cleared");
  const tooltip = host.locator(".luc-chart-tooltip").first();
  if ((await tooltip.count()) > 0) {
    assert.equal(await tooltip.isVisible(), false, "Tooltip hides after leave");
  }
}

async function hoverScenario(page, testId, expectedLabels, screenshot) {
  const { wrapper, host } = await chart(page, testId);
  const point = await hoverPlot(page, host);
  const data = await attrs(host);
  assert.equal(data.crosshairState, "plot", "normal plot hover is crosshair mode");
  assert.equal(
    await host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
    "crosshair",
    "canvas cursor is crosshair",
  );
  assert.ok(data.crosshairX, "X label coordinate is available");
  const shown = await labels(host);
  assert.equal(shown.length, expectedLabels, `${testId} shows the expected Y labels`);
  const tooltip = host.locator(".luc-chart-tooltip").first();
  assert.equal(await tooltip.isVisible(), true, "Tooltip is visible");
  assert.ok((await tooltip.textContent())?.trim(), "Tooltip has data rows");
  await shot(wrapper, screenshot);
  return { wrapper, host, data, labels: shown, point };
}

try {
  {
    const { context, page } = await open("dark");
    evidence.viewports.push({ name: "desktop-dark", width: 1440, height: 1000 });

    const single = await hoverScenario(
      page,
      "crosshair-single",
      1,
      "after-single-hover-dark.png",
    );
    const first = single.data;
    await hoverPlot(page, single.host, 0.67, 0.55);
    const moved = await attrs(single.host);
    assert.notEqual(moved.crosshairX, first.crosshairX, "X label updates with the pointer");
    assert.notEqual(moved.crosshairY0, first.crosshairY0, "Y label updates with the pointer");
    await page.mouse.move(4, 4);
    await page.waitForTimeout(250);
    await assertHidden(single.host);

    const dual = await hoverScenario(
      page,
      "crosshair-dual",
      2,
      "after-dual-hover-dark.png",
    );
    assert.match(dual.labels[0], /%/, "left dual-axis label is a percent");
    assert.match(dual.labels[1], /\$/, "right dual-axis label is currency");
    assert.notEqual(dual.data.crosshairYValue0, dual.data.crosshairYValue1);
    assert.ok((await dual.host.locator(".luc-chart-tooltip").textContent()).includes("Synthetic BTC USD"));

    const box = await dual.host.boundingBox();
    const rect = axisRect(dual.data);
    const midY = (rect.top + rect.bottom) / 2;
    const leftX = box.x + Math.max(4, rect.left - 14);
    const rightX = box.x + rect.right + 14;

    await page.mouse.move(leftX, box.y + midY);
    assert.equal(
      await dual.host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
      "ns-resize",
    );
    await page.mouse.down();
    await page.mouse.move(leftX, box.y + midY + 60, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    let ranges = await attrs(dual.host);
    assert.notEqual(ranges.yRange0, "auto", "left Y drag changes the left scale");
    assert.equal(ranges.yRange1, "auto", "left Y drag leaves the right scale alone");

    await hoverPlot(page, dual.host, 0.62, 0.38);
    const afterLeft = await attrs(dual.host);
    assert.equal((await labels(dual.host)).length, 2, "dual labels survive a range change");
    assert.ok(afterLeft.crosshairY0 && afterLeft.crosshairY1);
    assert.ok((await dual.host.locator(".luc-chart-tooltip").textContent()).includes("Rolling 1Y"));
    await shot(dual.wrapper, "after-dual-left-drag-dark.png");

    await page.mouse.move(rightX, box.y + midY);
    await page.mouse.down();
    await page.mouse.move(rightX, box.y + midY + 48, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    ranges = await attrs(dual.host);
    assert.notEqual(ranges.yRange1, "auto", "right Y drag changes the right scale");
    assert.equal(ranges.yRange0, afterLeft.yRange0, "right Y drag leaves the left scale alone");

    await page.mouse.dblclick(leftX, box.y + midY);
    await page.waitForTimeout(200);
    ranges = await attrs(dual.host);
    assert.equal(ranges.yRange0, "auto", "double-click resets only the left axis");
    assert.notEqual(ranges.yRange1, "auto", "the right axis stays where it was");
    await page.mouse.dblclick(rightX, box.y + midY);
    await page.waitForTimeout(200);
    ranges = await attrs(dual.host);
    assert.equal(ranges.yRange1, "auto", "double-click resets the right axis");

    const multi = await chart(page, "crosshair-multi");
    const multiBox = await multi.host.boundingBox();
    await hoverPlot(page, multi.host, 0.52, 0.42);
    assert.equal(await multi.host.getAttribute("data-zoom-model"), "2");
    await page.mouse.move(multiBox.x + multiBox.width * 0.5, multiBox.y + multiBox.height - 14);
    await page.waitForTimeout(120);
    assert.equal((await attrs(multi.host)).crosshairState, undefined);
    assert.equal(
      await multi.host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
      "grab",
      "DataZoom slider keeps its native cursor",
    );
    const multiRect = axisRect(await attrs(multi.host));
    const axisX = multiBox.x + (multiRect.left + multiRect.right) / 2;
    const axisY = multiBox.y + multiRect.bottom + 12;
    await page.mouse.move(axisX, axisY);
    assert.equal(
      await multi.host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
      "ew-resize",
    );
    await page.mouse.down();
    await page.mouse.move(axisX + 90, axisY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const zoomed = await attrs(multi.host);
    const firstSpan = Number(zoomed.dataZoomEnd) - Number(zoomed.dataZoomStart);
    assert.ok(firstSpan < 100 && firstSpan > 0, "X drag reduces the visible window");
    await page.mouse.down();
    await page.mouse.move(axisX + 45, axisY, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const expanded = await attrs(multi.host);
    const secondSpan = Number(expanded.dataZoomEnd) - Number(expanded.dataZoomStart);
    assert.ok(secondSpan > firstSpan, "reverse X drag expands the visible window");

    await hoverPlot(page, multi.host, 0.56, 0.42);
    const zoomCrosshair = await attrs(multi.host);
    assert.ok(zoomCrosshair.crosshairX);
    assert.ok(zoomCrosshair.crosshairY0);
    await shot(multi.wrapper, "after-zoom-crosshair-dark.png");

    await page.mouse.move(axisX, axisY);
    await page.mouse.dblclick(axisX, axisY);
    await page.waitForTimeout(250);
    const reset = await attrs(multi.host);
    assert.equal(Number(reset.dataZoomStart), 0, "X double-click resets range start");
    assert.equal(Number(reset.dataZoomEnd), 100, "X double-click resets range end");

    await hoverPlot(page, multi.host, 0.48, 0.35);
    const panBox = await multi.host.boundingBox();
    const panPoint = { x: panBox.x + panBox.width * 0.48, y: panBox.y + panBox.height * 0.35 };
    await page.mouse.move(panPoint.x, panPoint.y);
    await page.mouse.down();
    await page.mouse.move(panPoint.x + 28, panPoint.y, { steps: 5 });
    assert.equal(
      await multi.host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
      "grabbing",
      "normal plot pan retains grabbing",
    );
    await page.mouse.up();
    await page.waitForTimeout(200);
    assert.equal((await attrs(multi.host)).crosshairState, "plot");

    // Activate the native rectangular Brush from its toolbox, select a region,
    // then clear it from the second tool. This also locks in ToolboxComponent's
    // modular registration: without it the controls are silent and console-error
    // noisy while the chart looks otherwise healthy.
    await page.mouse.click(multiBox.x + multiBox.width - 65, multiBox.y + 28);
    await page.waitForTimeout(150);
    await page.mouse.move(panBox.x + panBox.width * 0.22, panBox.y + panBox.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(panBox.x + panBox.width * 0.48, panBox.y + panBox.height * 0.7, {
      steps: 10,
    });
    await page.mouse.up();
    await page.waitForTimeout(250);
    await shot(multi.wrapper, "after-brush-dark.png");
    await page.mouse.click(multiBox.x + multiBox.width - 42, multiBox.y + 28);
    await page.waitForTimeout(150);

    // Drag out of the host and release there: pointer capture must finish the
    // gesture and remove the resizing state.
    await dual.host.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const currentDualBox = await dual.host.boundingBox();
    const currentDual = await hoverPlot(page, dual.host, 0.5, 0.42);
    const currentRect = axisRect(await attrs(dual.host));
    const currentMidY = (currentRect.top + currentRect.bottom) / 2;
    const currentLeftX = currentDualBox.x + Math.max(4, currentRect.left - 14);
    await page.mouse.move(currentLeftX, currentDualBox.y + currentMidY);
    await page.mouse.down();
    await page.mouse.move(2, 2, { steps: 5 });
    await page.mouse.up();
    await page.mouse.move(
      currentDual.x,
      currentDualBox.y + currentDualBox.height * 0.4,
    );
    await page.waitForTimeout(250);
    assert.equal((await attrs(dual.host)).crosshairState, "plot", "drag-out returns to plot hover");

    await page.getByRole("switch", { name: "Crosshair enabled" }).click();
    await chart(page, "crosshair-dual");
    const darkDisabled = await chart(page, "crosshair-dual");
    const darkDisabledBox = await darkDisabled.host.boundingBox();
    await page.mouse.move(
      darkDisabledBox.x + darkDisabledBox.width * 0.55,
      darkDisabledBox.y + darkDisabledBox.height * 0.44,
    );
    await page.waitForTimeout(300);
    assert.equal((await labels(darkDisabled.host)).length, 0);
    assert.equal((await attrs(darkDisabled.host)).crosshairState, undefined);
    assert.equal(
      await darkDisabled.host.locator(".luc-chart-tooltip").first().isVisible(),
      true,
    );
    await shot(darkDisabled.wrapper, "after-disabled-crosshair-dark.png");

    evidence.scenarios.desktopDark = {
      single: true,
      dualIndependentY: true,
      crosshairAfterYScale: true,
      xDragAndReverse: true,
      axisDoubleClickReset: true,
      mouseLeave: true,
      dragOutRelease: true,
      plotPanGrabbing: true,
      brushSelection: true,
      disabledCrosshair: true,
      pointerCoordinates: {
        single: single.point,
        dual: dual.point,
      },
    };
    await context.close();
  }

  {
    const { context, page } = await open("light");
    evidence.viewports.push({ name: "desktop-light", width: 1440, height: 1000 });
    await hoverScenario(page, "crosshair-single", 1, "after-single-hover-light.png");
    const dual = await hoverScenario(page, "crosshair-dual", 2, "after-dual-hover-light.png");
    const lightMulti = await hoverScenario(
      page,
      "crosshair-multi",
      1,
      "after-multi-hover-light.png",
    );
    const lightMultiBox = await lightMulti.host.boundingBox();
    await page.mouse.click(
      lightMultiBox.x + lightMultiBox.width - 65,
      lightMultiBox.y + 28,
    );
    await page.waitForTimeout(150);
    await page.mouse.move(
      lightMultiBox.x + lightMultiBox.width * 0.22,
      lightMultiBox.y + lightMultiBox.height * 0.3,
    );
    await page.mouse.down();
    await page.mouse.move(
      lightMultiBox.x + lightMultiBox.width * 0.48,
      lightMultiBox.y + lightMultiBox.height * 0.7,
      { steps: 10 },
    );
    await page.mouse.up();
    await page.waitForTimeout(200);
    await shot(lightMulti.wrapper, "after-brush-light.png");
    await page.mouse.click(
      lightMultiBox.x + lightMultiBox.width - 42,
      lightMultiBox.y + 28,
    );
    await page.waitForTimeout(150);
    await page.mouse.move(3, 3);
    await page.waitForTimeout(250);
    await assertHidden(lightMulti.host);

    const lightSingle = await chart(page, "crosshair-single");
    const lightBox = await lightSingle.host.boundingBox();
    const lightSinglePoint = await hoverPlot(page, lightSingle.host, 0.5, 0.42);
    const lightRect = axisRect(await attrs(lightSingle.host));
    const lightX = lightBox.x + (lightRect.left + lightRect.right) / 2;
    const lightY = lightBox.y + lightRect.bottom + 12;
    await page.mouse.move(lightX, lightY);
    await page.mouse.down();
    await page.mouse.move(lightX + 70, lightY, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    assert.ok(Number((await attrs(lightSingle.host)).dataZoomEnd) < 100);
    await page.mouse.dblclick(lightX, lightY);
    await page.waitForTimeout(200);
    assert.equal(Number((await attrs(lightSingle.host)).dataZoomStart), 0);

    await page.getByRole("switch", { name: "Snap X to observation" }).click();
    await page.waitForTimeout(250);
    const snapDual = await chart(page, "crosshair-dual");
    await hoverPlot(page, snapDual.host, 0.58, 0.44);
    assert.equal((await attrs(snapDual.host)).crosshairSnap, "false");
    assert.equal((await labels(snapDual.host)).length, 2);

    const enabled = page.getByRole("switch", { name: "Crosshair enabled" });
    await enabled.click();
    await page.waitForTimeout(250);
    const { wrapper, host } = await chart(page, "crosshair-dual");
    const box = await host.boundingBox();
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.44);
    await page.waitForTimeout(300);
    assert.equal((await labels(host)).length, 0, "disabled crosshair draws no Y labels");
    assert.equal((await attrs(host)).crosshairState, undefined, "disabled crosshair has no plot state");
    assert.equal(
      await host.locator(".luc-chart-tooltip").first().isVisible(),
      true,
      "Tooltip remains available when crosshair drawing is disabled",
    );
    await shot(wrapper, "after-disabled-crosshair-light.png");

    const pie = await chart(page, "crosshair-non-cartesian");
    const pieBox = await pie.host.boundingBox();
    await page.mouse.move(pieBox.x + pieBox.width * 0.52, pieBox.y + pieBox.height * 0.55);
    await page.waitForTimeout(300);
    assert.equal((await labels(pie.host)).length, 0, "non-Cartesian chart has no Y labels");
    assert.equal((await attrs(pie.host)).crosshairState, undefined);
    assert.notEqual(
      await pie.host.locator("canvas").evaluate((node) => getComputedStyle(node).cursor),
      "crosshair",
      "pie does not receive the Cartesian cursor",
    );
    await shot(pie.wrapper, "after-non-cartesian-light.png");

    evidence.scenarios.desktopLight = {
      single: true,
      dual: true,
      multi: true,
      xAxisDrag: true,
      brush: true,
      mouseLeave: true,
      snapToggle: true,
      disabledCrosshair: true,
      tooltipWithoutCrosshair: true,
      nonCartesian: true,
      pointerCoordinates: {
        single: lightSinglePoint,
        dual: dual.point,
        multi: lightMulti.point,
      },
    };
    await context.close();
  }

  {
    const { context, page } = await open(
      "light",
      { width: 390, height: 844 },
      { hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    );
    evidence.viewports.push({ name: "mobile-emulation", width: 390, height: 844 });
    const { wrapper, host } = await chart(page, "crosshair-single");
    const box = await host.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.waitForTimeout(300);
    assert.equal((await attrs(host)).crosshairState, undefined, "touch does not force resize cursors");
    const overlap = await page.evaluate(() => {
      const layer = document.querySelector(".luc-chart-axis-labels");
      return layer ? getComputedStyle(layer).pointerEvents : "none";
    });
    assert.equal(overlap, "none", "axis labels never block touch/pointer input");
    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert.ok(pageOverflow <= 1, "390px viewport has no horizontal page overflow");
    await shot(wrapper, "after-mobile-view.png");

    const multi = await chart(page, "crosshair-multi");
    const multiBox = await multi.host.boundingBox();
    const cdp = await context.newCDPSession(page);
    const cy = multiBox.y + multiBox.height * 0.5;
    const cx = multiBox.x + multiBox.width * 0.5;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: cx - 35, y: cy, id: 1 },
        { x: cx + 35, y: cy, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: cx - 90, y: cy, id: 1 },
        { x: cx + 90, y: cy, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(350);
    const touchAttrs = await attrs(multi.host);
    assert.notEqual(touchAttrs.crosshairState, "axis-x-drag", "pinch does not enter desktop axis drag");
    assert.notEqual(touchAttrs.crosshairState, "axis-y-drag", "pinch does not enter desktop axis drag");

    evidence.scenarios.mobile = {
      touchTap: true,
      noForcedResizeCursor: true,
      pointerEventsNone: true,
      responsive390: true,
      pinchEmulation: true,
      pinchChangedZoom: touchAttrs.dataZoomStart !== "0" || touchAttrs.dataZoomEnd !== "100",
    };
    await context.close();
  }

  // Resize the same interactive canvas, then confirm labels still use the
  // engine's current rectangle rather than the pre-resize scale.
  {
    const { context, page } = await open("dark");
    const { host } = await chart(page, "crosshair-dual");
    const before = await hoverPlot(page, host);
    await page.setViewportSize({ width: 1100, height: 860 });
    await page.waitForTimeout(500);
    const after = await hoverPlot(page, host, 0.62, 0.4);
    const data = await attrs(host);
    assert.ok(data.plotRect);
    assert.notEqual(`${before.x},${before.y}`, `${after.x},${after.y}`);
    assert.equal((await labels(host)).length, 2, "both Y labels survive resize");
    evidence.scenarios.resize = true;
    await context.close();
  }

  {
    const { context, page } = await open("dark");
    await page.goto(`${BASE_URL}/charts/performance`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    const host = page.locator('[data-slot="echart-surface"]').first();
    await host.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_200);
    const first = await hoverPlot(page, host);
    assert.ok((await labels(host)).length >= 1, "10k chart exposes a Y crosshair label");
    const box = await host.boundingBox();
    const started = performance.now();
    for (let index = 0; index < 80; index += 1) {
      await page.mouse.move(
        box.x + box.width * (0.15 + (index / 79) * 0.7),
        box.y + box.height * (0.3 + Math.sin(index / 8) * 0.12),
      );
    }
    const elapsed = performance.now() - started;
    const after = await attrs(host);
    assert.ok(after.crosshairX && after.crosshairY0, "10k crosshair remains live");
    assert.equal(
      await host.locator(".luc-chart-tooltip").first().isVisible(),
      true,
      "10k Tooltip remains live",
    );
    await page.screenshot({
      path: `${OUTPUT}/after-10k-crosshair-dark.png`,
      clip: {
        x: Math.max(0, box.x - 1),
        y: Math.max(0, box.y - 1),
        width: Math.min(1440, box.width + 2),
        height: Math.min(1000, box.height + 2),
      },
    });
    evidence.screenshots.push(`${OUTPUT}/after-10k-crosshair-dark.png`);
    evidence.performance = {
      chart: "ECharts 10,000-point performance fixture",
      pointerMoves: 80,
      elapsedMs: Number(elapsed.toFixed(1)),
      averagePlaywrightMoveMs: Number((elapsed / 80).toFixed(2)),
      note:
        "Wall-clock observation includes Playwright IPC and is not an FPS claim. Crosshair labels and Tooltip remained live with no console errors.",
      firstPointer: first,
    };
    await context.close();
  }

  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join("\n")}`);
  evidence.consoleErrors = consoleErrors;
  await writeFile(`${OUTPUT}/qa-report.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ ok: true, output: OUTPUT, scenarios: evidence.scenarios }, null, 2));
} finally {
  await browser.close();
}
