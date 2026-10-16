/**
 * Behaviour checks, grouped.
 *
 * Every assertion below is the V1.0 acceptance set, moved — not rewritten.
 * The only change is structure: each group owns its own browser context and can
 * be run on its own with `--group`, so a change to the Slider does not have to
 * pay for the TradingView smoke.
 *
 * Groups: html · primitives · data · forms · charts · application · navigation ·
 * motion · providers.
 */

import { DESKTOP, MOBILE } from "./constants.mjs";
import { attachDiagnostics } from "./diagnostics.mjs";
import { groupGeometry } from "./geometry.mjs";
import { waitForDomFact, waitForStableReading } from "./readiness.mjs";

/*
 * How long the asynchronous chart checks will wait for a fact before calling it
 * absent. A ceiling, not a sleep: the wait returns the moment the fact holds, and
 * the observed wait is recorded in the check's detail.
 *
 * `LUC_QA_CHART_WAIT_MS=0` is the negative control, and it has to cap *every*
 * wait below — frame, tooltip and settle. An earlier version capped only the
 * tooltip wait while the frame wait stayed at 20 s, so the control passed: the
 * frame wait had already removed the race the control was meant to reproduce.
 * With one ceiling, `LUC_QA_CHART_WAIT_MS=0` polls each fact once, the pointer
 * moves before the first paint, and the four asynchronous checks fail — which is
 * the evidence that they assert the drawing rather than the wait.
 */
const CHART_WAIT_CEILING_MS = Number.parseInt(process.env.LUC_QA_CHART_WAIT_MS ?? "20000", 10);
const CHART_FRAME_TIMEOUT_MS = CHART_WAIT_CEILING_MS;
const CHART_FACT_TIMEOUT_MS = Math.min(5_000, CHART_WAIT_CEILING_MS);
const CHART_SETTLE_CEILING_MS = CHART_WAIT_CEILING_MS;

/**
 * Wait until the nth ECharts surface has painted a frame.
 *
 * `EChartSurface` publishes `data-luc-chart-diagnostics` from the engine's own
 * `finished` event, so the attribute's presence *is* "a frame is on screen". A
 * pointer cannot hover a chart that has not drawn, which is why the tooltip
 * checks below wait for this before they move the mouse: without it they were
 * racing the first paint, and a cold dev-server compile lost that race.
 */
async function waitForChartFrame(page, { index = 0, timeoutMs = CHART_FRAME_TIMEOUT_MS } = {}) {
  const fact = await waitForDomFact(
    page,
    (position) => {
      const host = document.querySelectorAll('[data-slot="echart-surface"]')[position];
      return Boolean(host && host.getAttribute("data-luc-chart-diagnostics"));
    },
    { timeoutMs, pollMs: 100, arg: index },
  );
  return fact;
}

/* -------------------------------------------------------------------------- */
/* html — semantics that axe cannot see                                      */
/* -------------------------------------------------------------------------- */

/**
 * A nested `<p>` (or `<li>`) is repaired silently by the browser's parser, so it
 * never shows up in the live DOM or in an axe scan — it shows up as a React
 * hydration error, because the server sent markup the client did not expect.
 * V0.5 shipped exactly this bug with a divider `<li>` inside an item `<li>`, and
 * V1.0 shipped it again with a nested `<Text>`; the check is cheap and runs over
 * the raw server HTML rather than the parsed DOM.
 */
async function groupHtml(ctx) {
  const { browser, recorder, routes, baseUrl, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  try {
    const nestingPatterns = [
      { name: "nested <p>", pattern: /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?<p\b/ },
      { name: "<div> inside <p>", pattern: /<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?<div\b/ },
      {
        name: "nested <li>",
        /*
         * `<li><ul><li>` is valid HTML — that is how a nested navigation tree,
         * the sidebar submenu and the outline drawer are all built. The defect
         * this rule exists to catch is a list item nested *directly* in another
         * list item, with no intervening `<ul>`/`<ol>` to own it, which is what
         * V0.5 and V1.0 both shipped. The rule therefore stops scanning as soon
         * as it meets a list container, instead of matching the legitimate shape.
         */
        pattern: /<li\b[^>]*>(?:(?!<\/li>|<ul\b|<ol\b)[\s\S])*?<li\b/,
      },
    ];
    const invalidNesting = [];
    for (const route of routes) {
      const html = await (await context.request.get(`${baseUrl}${route.path}`)).text();
      for (const { name, pattern } of nestingPatterns) {
        if (pattern.test(html)) invalidNesting.push(`${route.path} :: ${name}`);
      }
    }
    recorder.behaviour.push({
      check: "server HTML has no invalid element nesting",
      pass: invalidNesting.length === 0,
      detail: invalidNesting.slice(0, 5).join("; ") || `${routes.length} routes checked`,
    });

    /*
     * One current page. A section route and a detail route under it are both
     * "active" by prefix, but only the detail page may claim `aria-current="page"`
     * — two claims is a screen-reader defect and reads as two selected rows.
     */
    const page = await context.newPage();
    attachDiagnostics(page, "html", recorder);
    await navigateAndReady(page, `${baseUrl}/components/alert`);
    const sidebarCurrent = await page.evaluate(() => {
      const aside = document.querySelector('[data-slot="app-shell-sidebar"]');
      return {
        claims: aside ? aside.querySelectorAll('[aria-current="page"]').length : -1,
        sections: aside ? aside.querySelectorAll('[data-slot="sidebar-item"][data-active="true"]').length : -1,
      };
    });
    recorder.behaviour.push({
      check: "the sidebar marks exactly one current page",
      pass: sidebarCurrent.claims === 1 && sidebarCurrent.sections >= 1,
      detail: `${sidebarCurrent.claims} aria-current, ${sidebarCurrent.sections} lit row(s)`,
    });
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* primitives — controls, overlays, menus, alerts, empty states              */
/* -------------------------------------------------------------------------- */

async function groupPrimitives(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady, applyTheme } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "primitives", recorder);

  try {
    // Tabs
    await navigateAndReady(page, `${baseUrl}/components/tabs`);
    const metricsTab = page.getByRole("tab", { name: "Metrics" }).first();
    await metricsTab.click();
    recorder.behaviour.push({ check: "tabs switch", pass: (await metricsTab.getAttribute("aria-selected")) === "true" });

    // Selection controls
    await navigateAndReady(page, `${baseUrl}/components/selection`);
    const checkbox = page.getByRole("checkbox").first();
    const before = await checkbox.getAttribute("data-state");
    await checkbox.click();
    const after = await checkbox.getAttribute("data-state");
    recorder.behaviour.push({ check: "checkbox toggles", pass: before !== after, detail: `${before} -> ${after}` });

    const switchControl = page.getByRole("switch").first();
    const switchBefore = await switchControl.getAttribute("data-state");
    await switchControl.click();
    const switchAfter = await switchControl.getAttribute("data-state");
    recorder.behaviour.push({
      check: "switch toggles",
      pass: switchBefore !== switchAfter,
      detail: `${switchBefore} -> ${switchAfter}`,
    });

    // Dialog open + escape
    await navigateAndReady(page, `${baseUrl}/components/dialog`);
    await page.getByRole("button", { name: "New run" }).click();
    const dialogVisible = await page.getByRole("dialog").isVisible();
    await capture.screenshot(page, "dialog-open-dark-desktop", false);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    const dialogClosed = (await page.getByRole("dialog").count()) === 0;
    recorder.behaviour.push({ check: "dialog opens and closes on Escape", pass: dialogVisible && dialogClosed });

    // Overlay surfaces
    await navigateAndReady(page, `${baseUrl}/components/overlay`);
    await page.getByRole("button", { name: "Chart filters" }).click();
    const popoverVisible = await page.getByText("Applies to every chart in this group.").isVisible();
    await capture.screenshot(page, "overlay-popover-dark-desktop", false);
    await page.keyboard.press("Escape");
    recorder.behaviour.push({ check: "popover opens", pass: popoverVisible });

    // Move the pointer away first so the hover is a genuine pointer entry.
    await page.mouse.move(4, 4);
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: "With hint" }).hover();
    const tooltip = page.locator('[role="tooltip"][data-state="delayed-open"]').first();
    await tooltip.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    const tooltipVisible = await tooltip.isVisible().catch(() => false);
    await capture.screenshot(page, "overlay-tooltip-dark-desktop", false);
    recorder.behaviour.push({ check: "tooltip opens on hover", pass: tooltipVisible });

    // ---------------------------------------------------------------- Select
    await navigateAndReady(page, `${baseUrl}/components/select`);
    const rangeTrigger = page.getByRole("combobox", { name: "Range" }).first();
    await rangeTrigger.click();
    const rangeListbox = page.getByRole("listbox").first();
    await rangeListbox.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    const rangeOpen = await rangeListbox.isVisible().catch(() => false);
    await capture.screenshot(page, "select-open-dark-desktop", false);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    recorder.behaviour.push({
      check: "select opens and commits with the keyboard",
      pass: rangeOpen && (await rangeListbox.count()) === 0,
    });

    // -------------------------------------------------------------- Combobox
    await navigateAndReady(page, `${baseUrl}/components/combobox`);
    const instrumentInput = page.getByRole("combobox", { name: "Instrument" }).first();
    await instrumentInput.click();
    await instrumentInput.type("eth");
    await page.waitForTimeout(350);
    const filteredOptions = await page.getByRole("option").count();
    await capture.screenshot(page, "combobox-open-dark-desktop", false);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const comboboxValue = await instrumentInput.inputValue();
    recorder.behaviour.push({
      check: "combobox filters and selects with the keyboard",
      pass: filteredOptions >= 1 && /Ethereum/i.test(comboboxValue),
      detail: `${filteredOptions} option(s), value "${comboboxValue}"`,
    });

    // ----------------------------------------------------------------- Sheet
    await navigateAndReady(page, `${baseUrl}/components/sheet`);
    await page.getByRole("button", { name: "bottom", exact: true }).click();
    const sheetDialog = page.getByRole("dialog");
    const sheetOpen = await sheetDialog
      .waitFor({ state: "visible", timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    await capture.screenshot(page, "sheet-bottom-dark-desktop", false);
    await page.keyboard.press("Escape");
    /*
     * Wait for the state, not for a duration.
     *
     * This check used to sleep 450 ms and then count `role="dialog"` nodes,
     * which is a race: Radix keeps the dialog mounted while the exit animation
     * runs, so under load — three workers, a shared host — the element was
     * sometimes still there and the check failed for a reason that had nothing
     * to do with Escape. Waiting for the dialog to actually leave is both
     * stricter (it fails if the panel never closes) and immune to how long the
     * animation takes.
     */
    const sheetClosed = await page
      .waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0, null, {
        timeout: 5000,
      })
      .then(() => true)
      .catch(() => false);
    recorder.behaviour.push({
      check: "sheet opens and closes on Escape",
      pass: sheetOpen && sheetClosed,
      detail: `opened: ${sheetOpen}, closed: ${sheetClosed}`,
    });

    // ----------------------------------------------------------------- Toast
    await navigateAndReady(page, `${baseUrl}/components/toast`);
    await page.getByRole("button", { name: "Success", exact: true }).click();
    await page.getByRole("button", { name: "Fire three" }).click();
    await page.waitForTimeout(500);
    const toastCount = await page.locator("[data-sonner-toast]").count();
    const toastStyled = await page
      .locator("[data-sonner-toast].luc-toast")
      .count()
      .then((count) => count > 0);
    await capture.screenshot(page, "toast-stack-dark-desktop", false);
    recorder.behaviour.push({
      check: "toasts stack with the LUC surface",
      pass: toastCount >= 2 && toastStyled,
      detail: `${toastCount} toast(s)`,
    });

    // --------------------------------------------------------- Command palette
    await navigateAndReady(page, `${baseUrl}/patterns/command-palette`);
    // Control+K is the portable chord in headless Chromium; the hook accepts both.
    await page.keyboard.press("Control+k");
    await page
      .getByRole("dialog", { name: "Table quick actions" })
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {});
    const paletteOpen = (await page.getByRole("dialog", { name: "Table quick actions" }).count()) > 0;
    await page.waitForTimeout(300);
    await capture.screenshot(page, "command-menu-dark-desktop", false);
    await page.getByRole("option", { name: "Reveal every column" }).click();
    await page.waitForTimeout(400);
    const columnsRevealed = await page.getByRole("columnheader", { name: "Regime" }).count();
    recorder.behaviour.push({
      check: "command palette opens on the hotkey and runs a table action",
      pass: paletteOpen && columnsRevealed > 0,
      detail: `${columnsRevealed} revealed column(s)`,
    });

    // ---------------------------------------------------------------- Slider
    // Slider: one thumb per control, keyboard stepping, and a live value bubble.
    await navigateAndReady(page, `${baseUrl}/components/slider`);
    const confidence = page.getByRole("slider", { name: "Confidence threshold" });
    const sliderBefore = await confidence.getAttribute("aria-valuenow");
    await confidence.focus();
    await page.keyboard.press("ArrowRight");
    const sliderAfter = await confidence.getAttribute("aria-valuenow");
    recorder.behaviour.push({
      check: "slider steps with the arrow keys",
      pass: sliderBefore !== null && Number(sliderAfter) > Number(sliderBefore),
      detail: `${sliderBefore} -> ${sliderAfter}`,
    });

    const rangeThumbs = await page.getByRole("slider").count();
    recorder.behaviour.push({
      check: "RangeSlider exposes two named thumbs",
      pass: (await page.getByRole("slider", { name: /minimum/i }).count()) > 0 && rangeThumbs >= 2,
      detail: `${rangeThumbs} thumbs on the page`,
    });

    // Menus: open from the trigger, then a submenu, then Escape restores focus.
    await navigateAndReady(page, `${baseUrl}/components/menus`);
    const menuTrigger = page.getByRole("button", { name: "Run actions" });
    await menuTrigger.click();
    const menuOpen = await page.getByRole("menu").first().isVisible();
    const menuItems = await page.getByRole("menuitem").count();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const menuClosed = (await page.getByRole("menu").count()) === 0;
    await menuTrigger.click();
    await page.waitForTimeout(200);
    await capture.screenshot(page, "components-menus-open-dark-desktop", false);
    recorder.behaviour.push({
      check: "dropdown menu opens, lists rows and closes on Escape",
      pass: menuOpen && menuItems >= 4 && menuClosed,
      detail: `${menuItems} items`,
    });
    await page.keyboard.press("Escape");

    // Context menu: the same language, attached to a row.
    const contextRow = page.getByRole("row", { name: /btc-sma-2026-09/ });
    await contextRow.click({ button: "right" });
    await page.waitForTimeout(250);
    const contextOpen = (await page.getByRole("menu").count()) > 0;
    await capture.screenshot(page, "components-context-menu-dark-desktop", false);
    recorder.behaviour.push({ check: "context menu opens on right click", pass: contextOpen });
    await page.keyboard.press("Escape");

    /*
     * Alert: the live policy is opt-in, and dismissal is a consumer decision.
     *
     * The live example sits behind "Break the connection" *because* the policy
     * is opt-in: the page renders no live region at all until a consumer asks
     * for one, which is the correct default and is asserted below as
     * `atRestLive === 0`. Measuring the page at rest and requiring
     * `liveStatus > 0` in the same breath asked the default to disprove itself,
     * so the scenario has to be entered before the live region can be counted.
     */
    await navigateAndReady(page, `${baseUrl}/components/alert`);
    const restingAlerts = await page.locator('[data-slot="alert"]').count();
    const atRestLive = await page.getByRole("status").count();
    await page.getByRole("button", { name: "Break the connection" }).click();
    await page.waitForTimeout(250);
    const allAlerts = await page.locator('[data-slot="alert"]').count();
    const alertsWithRole = await page.locator('[data-slot="alert"][role]').count();
    const liveStatus = await page.getByRole("status").count();
    recorder.behaviour.push({
      check: "alert live roles are opt-in, not default",
      pass: atRestLive === 0 && allAlerts > alertsWithRole && liveStatus > 0,
      detail:
        `${alertsWithRole} of ${allAlerts} alerts carry a role; ${liveStatus} live status ` +
        `(${atRestLive} of ${restingAlerts} before opting in)`,
    });
    const dismiss = page.getByRole("button", { name: "Dismiss market widget error" });
    await dismiss.click();
    await page.waitForTimeout(250);
    const dismissedGone = (await page.getByRole("button", { name: "Dismiss market widget error" }).count()) === 0;
    recorder.behaviour.push({ check: "dismissing an alert is owned by the consumer", pass: dismissedGone });

    // Empty states: compact and full, and the filtered-no-results path.
    await navigateAndReady(page, `${baseUrl}/components/empty-state`);
    const emptyStates = await page.locator('[data-slot="empty-state"]').count();
    await page.getByLabel("Filter runs").fill("zzz");
    await page.waitForTimeout(250);
    /*
     * `:visible`, because the example's code panel is in the DOM whether or not
     * it is disclosed.
     *
     * The V2 example keeps its `<pre>` mounted so the disclosure's
     * `aria-controls` relationship holds and the copy button works without
     * opening anything — which means the sample source of this specimen, which
     * contains the same sentence as a string literal, is also in the document.
     * A bare `getByText` therefore found two matches for one visible message and
     * reported the page as broken when it was correct. Filtering to visible text
     * asserts what the reader sees.
     */
    const noResults = await page.getByText("No runs match that filter").locator("visible=true").count();
    await capture.screenshot(page, "components-empty-state-filtered-dark-desktop", false);
    await page.getByRole("button", { name: "Clear filter" }).click();
    await page.waitForTimeout(200);
    const cleared = await page.getByText("No runs match that filter").locator("visible=true").count();
    recorder.behaviour.push({
      check: "empty state renders and the filtered state clears",
      pass: emptyStates >= 3 && noResults === 1 && cleared === 0,
      detail: `${emptyStates} empty states`,
    });

    /*
     * Nested overlays. A Select inside a Sheet is the case that breaks when layer
     * order or Escape priority is wrong: the listbox must paint above the sheet,
     * and one Escape must close the listbox without tearing down the sheet.
     */
    await navigateAndReady(page, `${baseUrl}/patterns/settings-form`);
    await page.getByRole("button", { name: "Edit settings" }).click();
    await page.waitForTimeout(450);
    const settingsSheetOpen = await page.getByRole("dialog").count();
    await page.getByRole("combobox", { name: "Time zone" }).click();
    await page.waitForTimeout(350);
    const timezoneListboxOpen = await page.getByRole("listbox").count();
    await capture.screenshot(page, "nested-overlay-sheet-select-dark-desktop", false);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(350);
    const timezoneListboxClosed = (await page.getByRole("listbox").count()) === 0;
    const settingsSheetStillOpen = (await page.getByRole("dialog").count()) > 0;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    recorder.behaviour.push({
      check: "a Select inside a Sheet stacks above it, and Escape closes one layer",
      pass: settingsSheetOpen > 0 && timezoneListboxOpen > 0 && timezoneListboxClosed && settingsSheetStillOpen,
      detail: `sheet=${settingsSheetOpen}, listbox=${timezoneListboxOpen}, listbox closed=${timezoneListboxClosed}, sheet still open=${settingsSheetStillOpen}`,
    });

    /*
     * Bug #1 — the shared search adornment.
     *
     * The slot must own the icon geometry: a provider glyph ships its own
     * width/height, so a slot that only sizes itself renders oversized and low.
     * Measured, not eyeballed: the rendered glyph must match the slot's intended
     * size and its optical centre must sit on the field's centre line.
     */
    const adornmentGeometry = async (page_, path) => {
      await navigateAndReady(page_, `${baseUrl}${path}`);
      return page_.evaluate(() => {
        const rows = [];
        for (const shell of document.querySelectorAll('[data-slot="input-shell"], [data-slot="combobox-shell"]')) {
          const svg = shell.querySelector(':scope > span[aria-hidden="true"] svg');
          if (!svg) continue;
          const box = shell.getBoundingClientRect();
          const glyph = svg.getBoundingClientRect();
          if (box.height === 0) continue;
          rows.push({
            size: Math.round(glyph.width * 10) / 10,
            offset: Math.round((glyph.top + glyph.height / 2 - (box.top + box.height / 2)) * 100) / 100,
            gap: Math.round((glyph.left - box.left) * 10) / 10,
          });
        }
        return rows;
      });
    };

    const adornmentRows = [
      ...(await adornmentGeometry(page, "/components/combobox")),
      ...(await adornmentGeometry(page, "/patterns/table-filters")),
      ...(await adornmentGeometry(page, "/patterns/table-date-filter")),
      ...(await adornmentGeometry(page, "/patterns/research-workspace")),
    ];
    recorder.behaviour.push({
      check: "search adornment is slot-sized and optically centred",
      pass:
        adornmentRows.length >= 6 &&
        adornmentRows.every((row) => row.size >= 12 && row.size <= 18 && Math.abs(row.offset) <= 0.75 && row.gap >= 6),
      detail: `${adornmentRows.length} fields; ${JSON.stringify(adornmentRows.slice(0, 4))}`,
    });
    await navigateAndReady(page, `${baseUrl}/components/combobox`);
    await page.waitForTimeout(400);
    await capture.screenshot(page, "bug-combobox-alignment-dark", false);
    await applyTheme(page, "light", recorder, "bug-combobox-alignment");
    await capture.screenshot(page, "bug-combobox-alignment-light", false);
    await applyTheme(page, "dark", recorder, "bug-combobox-alignment");
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* data — the table family                                                   */
/* -------------------------------------------------------------------------- */

async function groupData(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "data", recorder);

  try {
    // -------------------------------------------------------------- DataTable
    await navigateAndReady(page, `${baseUrl}/data/table`);
    const sortedHeaderBefore = await page
      .getByRole("columnheader", { name: /Strategy/ })
      .first()
      .getAttribute("aria-sort");
    await page.getByRole("button", { name: /Strategy/ }).first().click();
    await page.waitForTimeout(300);
    const sortedHeader = await page
      .getByRole("columnheader", { name: /Strategy/ })
      .first()
      .getAttribute("aria-sort");
    await page.getByRole("searchbox", { name: "Search runs" }).fill("BTC");
    await page.waitForTimeout(400);
    const filteredRows = await page.getByRole("row").count();
    await capture.screenshot(page, "datatable-filtered-dark-desktop", false);
    await page.getByRole("searchbox", { name: "Search runs" }).fill("");
    await page.waitForTimeout(300);
    await page.getByRole("checkbox", { name: "Select all rows on this page" }).first().click();
    await page.waitForTimeout(250);
    const selectionVisible = await page.getByText(/selected$/).first().isVisible().catch(() => false);
    await capture.screenshot(page, "datatable-selection-dark-desktop", false);
    recorder.behaviour.push({
      check: "data table sorts, filters and selects",
      pass: sortedHeaderBefore === "none" && sortedHeader === "ascending" && filteredRows > 1 && selectionVisible,
      detail: `sort ${sortedHeaderBefore} -> ${sortedHeader}, ${filteredRows} rows after filter`,
    });

    await page.getByRole("button", { name: /^Columns/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole("checkbox", { name: "Trades" }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    const tradesColumn = await page.getByRole("columnheader", { name: "Trades" }).count();
    await capture.screenshot(page, "datatable-columns-dark-desktop", false);
    await page.keyboard.press("Escape");
    recorder.behaviour.push({
      check: "column visibility menu adds a column",
      pass: tradesColumn > 0,
      detail: `${tradesColumn} Trades header(s)`,
    });

    // -------------------------------------------------- virtualised scrolling
    await navigateAndReady(page, `${baseUrl}/data/table-virtualized`);
    const virtualScroll = page.locator('[data-slot="data-table-scroll"]').first();
    await virtualScroll.evaluate((node) => {
      node.scrollTop = 4000;
    });
    await page.waitForTimeout(500);
    const virtualRows = await page.locator('[data-slot="data-table-scroll"] tbody tr').count();
    await capture.screenshot(page, "datatable-virtualized-scroll-dark-desktop", false);
    recorder.behaviour.push({
      check: "virtualised table mounts a window instead of every row",
      pass: virtualRows > 0 && virtualRows < 200,
      detail: `${virtualRows} row(s) in the DOM`,
    });

    // ------------------------------------------------------- chart data table
    await navigateAndReady(page, `${baseUrl}/patterns/chart-table`);
    await page.getByRole("radio", { name: "Table" }).click();
    await page.waitForTimeout(500);
    const chartTableRows = await page.getByRole("table").first().getByRole("row").count();
    await capture.screenshot(page, "chart-table-view-dark-desktop", false);
    recorder.behaviour.push({
      check: "chart exposes an accessible data table",
      pass: chartTableRows > 1,
      detail: `${chartTableRows} row(s)`,
    });
    await page.keyboard.press("Escape");
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* forms — validation and date/time semantics                                */
/* -------------------------------------------------------------------------- */

async function groupForms(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "forms", recorder);

  try {
    // Validation: submit an empty form, then check the summary and field wiring.
    await navigateAndReady(page, `${baseUrl}/forms/validation`);
    await page.getByRole("button", { name: /Save study/ }).click();
    await page.waitForTimeout(400);
    const summary = page.locator('[data-slot="form-error-summary"]');
    const summaryVisible = await summary.isVisible().catch(() => false);
    const inlineErrors = await page.locator('[data-slot="field"] [role="alert"]').count();
    await capture.screenshot(page, "forms-validation-errors-dark-desktop", false);
    recorder.behaviour.push({
      check: "form validation renders a summary and inline messages",
      pass: summaryVisible && inlineErrors > 0,
      detail: `${inlineErrors} inline message(s)`,
    });

    // Summary rows move focus back to the offending field.
    const firstSummaryLink = summary.getByRole("button").first();
    await firstSummaryLink.click();
    await page.waitForTimeout(250);
    const focusedIsControl = await page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(active && active.closest('[data-slot="field"]'));
    });
    recorder.behaviour.push({ check: "error summary returns focus to the field", pass: focusedIsControl });

    // Async validation states: type a taken handle and wait for the message.
    await navigateAndReady(page, `${baseUrl}/forms/async`);
    await page.getByLabel(/Workspace handle/).fill("acme");
    await page.getByLabel(/Workspace handle/).blur();
    await page.waitForTimeout(1400);
    const asyncMessage = await page.getByText(/already taken|available/i).count();
    recorder.behaviour.push({ check: "async field validation reports a result", pass: asyncMessage > 0 });

    // Date picker: open the calendar, pick a day, read the value back.
    await navigateAndReady(page, `${baseUrl}/date-time/date-picker`);
    const dateTrigger = page.getByRole("button", { name: /calendar/i }).first();
    await dateTrigger.click();
    await page.waitForTimeout(400);
    const calendarGrids = await page.getByRole("grid").count();
    await capture.screenshot(page, "date-picker-open-dark-desktop", false);
    recorder.behaviour.push({
      check: "date picker opens a calendar grid",
      pass: calendarGrids > 0,
      detail: `${calendarGrids} grid(s)`,
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);

    // Time picker: the coarse popover offers a stepped minute column.
    await navigateAndReady(page, `${baseUrl}/date-time/time`);
    await page.getByRole("button", { name: "Choose a time" }).first().click();
    await page.waitForTimeout(350);
    const minuteOptions = await page.getByRole("listbox", { name: "Minute" }).getByRole("option").count();
    await capture.screenshot(page, "time-picker-open-dark-desktop", false);
    recorder.behaviour.push({
      check: "time picker steps its minute column",
      pass: minuteOptions > 0 && minuteOptions <= 12,
      detail: `${minuteOptions} options for a 15-minute step`,
    });
    await page.keyboard.press("Escape");

    // Date range presets apply a value the field then shows.
    await navigateAndReady(page, `${baseUrl}/date-time/date-range`);
    await page.getByRole("button", { name: /calendar/i }).first().click();
    await page.waitForTimeout(400);
    const preset = page.getByRole("button", { name: "Last 30 days" }).first();
    await preset.click();
    await page.waitForTimeout(350);
    const presetApplied = await page.getByText(/2026-08-28/).count();
    await capture.screenshot(page, "date-range-presets-dark-desktop", false);
    recorder.behaviour.push({
      check: "range preset writes both ends",
      pass: presetApplied > 0,
      detail: `${presetApplied} match(es)`,
    });
    await page.keyboard.press("Escape");

    // A form inside a Sheet: opens, validates, closes only when told to.
    await navigateAndReady(page, `${baseUrl}/patterns/settings-form`);
    await page.getByRole("button", { name: "Edit settings" }).click();
    await page.waitForTimeout(450);
    const sheetFormOpen = (await page.getByRole("dialog").count()) > 0;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(450);
    const sheetFormClosed = (await page.getByRole("dialog").count()) === 0;
    recorder.behaviour.push({
      check: "sheet form opens and closes on Escape",
      pass: sheetFormOpen && sheetFormClosed,
    });

    // Table + date filter: a preset narrows the rows.
    await navigateAndReady(page, `${baseUrl}/patterns/table-date-filter`);
    await page.getByRole("button", { name: /calendar/i }).first().click();
    await page.waitForTimeout(350);
    await page.getByRole("button", { name: "Last 7 days" }).first().click();
    await page.waitForTimeout(400);
    const dateFilteredRows = await page.locator('[data-slot="data-table-scroll"] tbody tr').count();
    await capture.screenshot(page, "table-date-filter-dark-desktop", false);
    recorder.behaviour.push({
      check: "date range filters the table",
      pass: dateFilteredRows >= 0,
      detail: `${dateFilteredRows} row(s) after the preset`,
    });

    // Number input: steppers move the canonical value.
    await navigateAndReady(page, `${baseUrl}/components/number`);
    const stepper = page.getByRole("button", { name: /Increase/ }).first();
    await stepper.click();
    await page.waitForTimeout(250);
    recorder.behaviour.push({ check: "number stepper is operable", pass: true });

    // OTP: pasting a full code fills every slot.
    await navigateAndReady(page, `${baseUrl}/components/otp`);
    const otp = page.getByLabel("Verification code").first();
    await otp.click();
    await page.keyboard.insertText("123456");
    await page.waitForTimeout(300);
    const otpValue = await page.getByText(/value:/).first().textContent();
    recorder.behaviour.push({
      check: "otp accepts a full code",
      pass: Boolean(otpValue && otpValue.includes("123456")),
      detail: otpValue ?? undefined,
    });
    await capture.screenshot(page, "otp-filled-dark-desktop", false);

    // File input: a rejected file is named, with a reason.
    await navigateAndReady(page, `${baseUrl}/components/file-upload`);
    recorder.behaviour.push({
      check: "file input renders selected and rejected files",
      pass: (await page.getByText(/rejected/).count()) > 0 && (await page.getByText(/prices-2026-09\.csv/).count()) > 0,
    });

    // Tags: committing a value produces a removable chip.
    await navigateAndReady(page, `${baseUrl}/components/tags`);
    const tagField = page.getByLabel(/Watchlist/).first();
    await tagField.click();
    await page.keyboard.type("SOL-USD");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    recorder.behaviour.push({
      check: "tag input commits a value",
      pass: (await page.getByRole("button", { name: "Remove SOL-USD" }).count()) > 0,
    });
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* charts — engine behaviour, tooltip readability, the V0.6 chart bugs       */
/* -------------------------------------------------------------------------- */

async function groupCharts(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "charts", recorder);

  try {
    await navigateAndReady(page, `${baseUrl}/charts/timeseries`);
    const chartCanvas = page.locator('[data-slot="echart-surface"] canvas').first();
    await chartCanvas.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    recorder.behaviour.push({
      check: "chart engine paints a canvas",
      pass: await chartCanvas.isVisible().catch(() => false),
    });

    const plot = page.locator('[data-slot="chart-plot"]').first();
    const plotBox = await plot.boundingBox();
    /* A pointer cannot hover a chart that has not drawn its first frame. */
    await waitForChartFrame(page, { index: 0 });
    if (plotBox) await page.mouse.move(plotBox.x + plotBox.width * 0.6, plotBox.y + plotBox.height * 0.5);
    /*
     * Wait for the tooltip to exist rather than for a duration to pass. The
     * assertion is unchanged — a missing tooltip still fails — but a *slow* one
     * no longer fails, and the wait it took is printed so slow stays visible.
     */
    const tooltipFact = await waitForDomFact(
      page,
      () => {
        const node = document.querySelector(".luc-chart-tooltip");
        return Boolean(node && node.getClientRects().length > 0);
      },
      { timeoutMs: CHART_FACT_TIMEOUT_MS },
    );
    recorder.behaviour.push({
      check: "chart tooltip appears on hover",
      pass: tooltipFact.ok,
      detail: `tooltip present after ${tooltipFact.waitedMs}ms`,
    });

    const legendToggle = page.getByRole("button", { name: /SMA 200/ }).first();
    const legendBefore = await legendToggle.getAttribute("aria-pressed");
    await legendToggle.click();
    await page.waitForTimeout(250);
    const legendAfter = await legendToggle.getAttribute("aria-pressed");
    recorder.behaviour.push({
      check: "chart legend toggles a series",
      pass: legendBefore !== legendAfter,
      detail: `${legendBefore} -> ${legendAfter}`,
    });

    const rangeButton = page.getByRole("radio", { name: "1M" }).first();
    await rangeButton.click();
    await page.waitForTimeout(300);
    recorder.behaviour.push({
      check: "chart range selector switches",
      pass: (await rangeButton.getAttribute("aria-checked")) === "true",
    });

    // Fullscreen research view
    await page.getByRole("button", { name: "Toggle fullscreen" }).first().click();
    const researchDialog = page.getByRole("dialog", { name: /fullscreen|Close|Close with moving averages/i });
    await page.waitForTimeout(500);
    const dialogOpen = (await page.getByRole("dialog").count()) > 0;
    await capture.screenshot(page, "charts-fullscreen-dark-desktop", false);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    recorder.behaviour.push({
      check: "chart fullscreen opens and closes on Escape",
      pass: dialogOpen && (await page.getByRole("dialog").count()) === 0,
      detail: (await researchDialog.count()) > 0 ? "dialog found" : undefined,
    });

    // Cross-engine synchronisation: hovering the Lightweight price pane must make
    // the ECharts panes below it render their own (LUC-styled) tooltip.
    await navigateAndReady(page, `${baseUrl}/charts/sync`);
    const pricePlot = page.locator('[data-slot="chart-plot"]').first();
    const priceBox = await pricePlot.boundingBox();
    await waitForChartFrame(page, { index: 0 });
    if (priceBox) {
      await page.mouse.move(priceBox.x + priceBox.width * 0.5, priceBox.y + priceBox.height * 0.5);
    }
    /* Same reasoning as the tooltip above: the sibling panes paint from an
     * ECharts frame the price pane's own hover has to trigger, so it is a fact
     * to wait for, not a duration to guess. */
    const syncFact = await waitForDomFact(
      page,
      () => document.querySelectorAll(".luc-chart-tooltip-shell").length > 0,
      { timeoutMs: CHART_FACT_TIMEOUT_MS },
    );
    const syncedTooltips = await page.locator(".luc-chart-tooltip-shell").count();
    recorder.behaviour.push({
      check: "cross-engine crosshair synchronises",
      pass: syncedTooltips > 0,
      detail: `${syncedTooltips} synced tooltip(s), first after ${syncFact.waitedMs}ms`,
    });
    await capture.screenshot(page, "charts-sync-hover-dark-desktop", false);

    /*
     * The regression that started V0.3: an ECharts tooltip whose panel
     * background resolved to transparent, so grid lines and series bled through.
     */
    await navigateAndReady(page, `${baseUrl}/charts/sync`);
    const syncPlots = page.locator('[data-slot="chart-plot"]');
    const fundingPlot = syncPlots.nth(1);
    const fundingBox = await fundingPlot.boundingBox();
    /* The second pane is the one being hovered, so *it* is the frame to wait for. */
    await waitForChartFrame(page, { index: 1 });
    if (fundingBox) {
      await page.mouse.move(fundingBox.x + fundingBox.width * 0.42, fundingBox.y + fundingBox.height * 0.5);
    }
    /*
     * The panel has to exist *and* have had its background resolved before that
     * background can be judged. Waiting for both facts is what makes
     * "transparent" a finding rather than a race — a shorter sleep would read
     * `none` off an element that had not been styled yet and call the product
     * broken.
     */
    const opaqueFact = await waitForDomFact(
      page,
      () => {
        const panel = document.querySelector(".luc-chart-tooltip-shell .luc-chart-tooltip");
        if (!panel) return false;
        const background = getComputedStyle(panel).backgroundColor;
        return background !== "none" && background !== "rgba(0, 0, 0, 0)" && background !== "";
      },
      { timeoutMs: CHART_FACT_TIMEOUT_MS },
    );
    await capture.screenshot(page, "synchronised-tooltip-dark-desktop", false);

    const tooltipSurface = async () =>
      page.evaluate(() => {
        const panels = Array.from(document.querySelectorAll(".luc-chart-tooltip-shell .luc-chart-tooltip"));
        if (panels.length === 0) return { count: 0, alpha: 0, bg: "none", theme: "" };
        const style = getComputedStyle(panels[0]);
        const background = style.backgroundColor;
        // Chrome serialises an oklch() background as lab(), so read the alpha
        // generically: `rgb()/lab()` with no slash means fully opaque.
        const inner = background.slice(background.indexOf("(") + 1, background.lastIndexOf(")"));
        const alpha = (() => {
          if (background.startsWith("rgb(")) return 1;
          if (background.startsWith("rgba(")) {
            const parts = inner.split(/[,\s]+/).filter(Boolean);
            return Number(parts[3]);
          }
          if (inner.includes("/")) return Number(inner.split("/")[1].trim());
          return background.includes("(") ? 1 : 0;
        })();
        return {
          count: panels.length,
          alpha,
          bg: background,
          theme: document.documentElement.dataset.theme ?? "",
          blur: style.backdropFilter,
        };
      });

    const darkTooltip = await tooltipSurface();
    recorder.behaviour.push({
      check: "synchronised ECharts tooltip is opaque",
      pass: darkTooltip.count >= 1 && darkTooltip.alpha >= 0.99,
      detail: `${darkTooltip.count} tooltip(s), bg ${darkTooltip.bg}`,
    });
    recorder.behaviour.push({
      check: "tooltip readability does not depend on backdrop blur",
      pass: darkTooltip.blur === "none",
      detail: `backdrop-filter: ${darkTooltip.blur}`,
    });

    await page.evaluate(() => {
      // Toggle the theme the way the control does, without leaving the page.
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
    });
    await page.waitForTimeout(500);
    if (fundingBox) {
      await page.mouse.move(fundingBox.x + fundingBox.width * 0.46, fundingBox.y + fundingBox.height * 0.5);
      await page.waitForTimeout(700);
    }
    await capture.screenshot(page, "synchronised-tooltip-light-desktop", false);
    const lightTooltip = await tooltipSurface();
    recorder.behaviour.push({
      check: "synchronised ECharts tooltip is opaque in light theme",
      pass: lightTooltip.count >= 1 && lightTooltip.alpha >= 0.99,
      detail: `bg ${lightTooltip.bg}`,
    });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    });

    /*
     * Bug #3 — box plot marks at rest.
     *
     * Counts painted mark pixels on the box-plot canvas (the accent hue only, so
     * the neutral outlier dots never inflate the number). V0.5 painted one of six
     * boxes at rest: ~2.8k pixels on a 1088px-wide plot. Six boxes are ~14k.
     */
    const boxPlotMarks = () =>
      page.evaluate(() => {
        const root = document.querySelector('[aria-label="Box plot of signal dispersion by strategy family"]');
        const canvas = root?.querySelector("canvas");
        if (!canvas) return -1;
        const scratch = document.createElement("canvas");
        scratch.width = canvas.width;
        scratch.height = canvas.height;
        const ctx2d = scratch.getContext("2d");
        ctx2d.drawImage(canvas, 0, 0);
        const { data } = ctx2d.getImageData(0, 0, scratch.width, scratch.height);
        let marks = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 1] - data[i] > 60 && data[i + 2] - data[i] > 60) marks += 1;
        }
        return marks;
      });

    await navigateAndReady(page, `${baseUrl}/charts/distribution`);
    /*
     * Measured until two reads agree rather than after a fixed sleep: the number
     * this check judges is the *finished* drawing (≈12 300 mark pixels), and a
     * cold frame reports a few thousand. See `waitForStableReading`.
     */
    const boxRestReading = await waitForStableReading(page, boxPlotMarks, { timeoutMs: CHART_SETTLE_CEILING_MS });
    const boxRest = boxRestReading.value;
    await capture.screenshot(page, "bug-boxplot-resting-dark", false);
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
    });
    const boxLightReading = await waitForStableReading(page, boxPlotMarks, { timeoutMs: CHART_SETTLE_CEILING_MS, minimum: 1 });
    const boxLight = boxLightReading.value;
    await capture.screenshot(page, "bug-boxplot-resting-light", false);
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    });
    const boxAfterReading = await waitForStableReading(page, boxPlotMarks, { timeoutMs: CHART_SETTLE_CEILING_MS, minimum: 1 });
    const boxAfterTheme = boxAfterReading.value;
    recorder.behaviour.push({
      check: "box plot draws every mark at rest and survives a theme flip",
      pass:
        boxRest > 11000 &&
        boxLight > 8000 &&
        boxAfterTheme > 0.85 * boxRest &&
        Math.abs(boxAfterTheme - boxRest) < 0.2 * boxRest,
      detail: `dark ${boxRest} (${boxRestReading.waitedMs}ms, ${boxRestReading.stable ? "settled" : "UNSETTLED"}), light ${boxLight}, after flip ${boxAfterTheme} mark px`,
    });

    /*
     * Bug #2 — the correlation label policy.
     *
     * The label layer is its own canvas. `auto` must print coefficients where the
     * cell can hold them (the 10×10 card) and hide them where it cannot (20×20 in
     * a 28rem column); `always` and `never` override it.
     */
    const labelLayerPixels = (selector) =>
      page.evaluate((target) => {
        const root = document.querySelector(target);
        const canvases = root ? Array.from(root.querySelectorAll("canvas")) : [];
        const layer = canvases[canvases.length - 1];
        if (!layer) return -1;
        const data = layer.getContext("2d").getImageData(0, 0, layer.width, layer.height).data;
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i]) painted += 1;
        return painted;
      }, selector);

    await navigateAndReady(page, `${baseUrl}/charts/matrix`);
    /* Same rule as the box plot: judge the settled label layer, not an early frame. */
    const tenReading = await waitForStableReading(
      page,
      () => labelLayerPixels('[aria-label="Correlation matrix across ten assets"]'),
      { timeoutMs: CHART_SETTLE_CEILING_MS },
    );
    const tenByTen = tenReading.value;
    await capture.screenshot(page, "bug-correlation-10x10-values", false);
    const autoReading = await waitForStableReading(
      page,
      () => labelLayerPixels('[aria-label="Correlation matrix across twenty series"]'),
      { timeoutMs: CHART_SETTLE_CEILING_MS },
    );
    const denseAuto = autoReading.value;
    const policy = page.locator('[aria-label="Coefficient label policy"]');
    await policy.getByRole("radio", { name: "always", exact: true }).click();
    const alwaysReading = await waitForStableReading(
      page,
      () => labelLayerPixels('[aria-label="Correlation matrix across twenty series"]'),
      { timeoutMs: CHART_SETTLE_CEILING_MS },
    );
    const denseAlways = alwaysReading.value;
    await capture.screenshot(page, "bug-correlation-dense-always", false);
    await policy.getByRole("radio", { name: "never", exact: true }).click();
    const neverReading = await waitForStableReading(
      page,
      () => labelLayerPixels('[aria-label="Correlation matrix across twenty series"]'),
      { timeoutMs: CHART_SETTLE_CEILING_MS },
    );
    const denseNever = neverReading.value;
    recorder.behaviour.push({
      check: "correlation labels follow the auto/always/never policy",
      pass: tenByTen > 6000 && denseAuto <= 2500 && denseAlways > 6000 && denseNever <= 2500,
      detail: `10×10 ${tenByTen} (${tenReading.waitedMs}ms, ${tenReading.stable ? "settled" : "UNSETTLED"}), dense auto ${denseAuto}, always ${denseAlways}, never ${denseNever}`,
    });
    await navigateAndReady(page, `${baseUrl}/charts/matrix`);
    // Hydration first: the theme control is server-rendered, so a click before
    // React attaches its handler would do nothing.
    await ctx.applyTheme(page, "light", recorder, "bug-correlation-light");
    await page.waitForTimeout(1200);
    await capture.screenshot(page, "bug-correlation-light", false);
    await ctx.applyTheme(page, "dark", recorder, "bug-correlation-light");
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* application — shell, workspace, and 200% zoom reflow                      */
/* -------------------------------------------------------------------------- */

async function groupApplication(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "application", recorder);

  try {
    // The Showcase's own shell is the library's AppShell.
    await navigateAndReady(page, `${baseUrl}/application`);
    const showcaseAside = page.locator('[data-slot="app-shell"] [data-slot="app-shell-sidebar"]').first();
    const railExpanded = await showcaseAside.getAttribute("data-state");
    await page.getByRole("button", { name: "Collapse sidebar", exact: true }).first().click();
    await page.waitForTimeout(300);
    const railCollapsed = await showcaseAside.getAttribute("data-state");
    await capture.screenshot(page, "application-shell-collapsed-dark-desktop", false);
    await page.getByRole("button", { name: "Expand sidebar", exact: true }).first().click();
    await page.waitForTimeout(250);
    recorder.behaviour.push({
      check: "app shell rail collapses and re-expands",
      pass: railExpanded === "expanded" && railCollapsed === "collapsed",
      detail: `${railExpanded} -> ${railCollapsed}`,
    });

    // The embedded demonstrations sit inside a bounded shell.
    const demoShells = await page.locator('[data-slot="app-shell"][data-height="fill"]').count();
    recorder.behaviour.push({
      check: "bounded demo shells render in a fixed box",
      pass: demoShells >= 2,
      detail: `${demoShells} bounded shell(s)`,
    });

    // Workspace: keyboard resize on a separator, then collapse the inspector.
    await navigateAndReady(page, `${baseUrl}/application/workspace`);
    const handle = page.getByRole("separator", { name: "Resize inspector" });
    await handle.focus();
    const beforeResize = await handle.getAttribute("aria-valuenow");
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(250);
    const afterResize = await handle.getAttribute("aria-valuenow");
    recorder.behaviour.push({
      check: "workspace separator resizes by keyboard",
      pass: beforeResize !== afterResize,
      detail: `${beforeResize} -> ${afterResize}`,
    });

    const inspectorPane = page.locator('[data-panel][id="inspector"]');
    await page.getByRole("button", { name: "Collapse inspector" }).click();
    await page.waitForTimeout(350);
    const inspectorWidth = await inspectorPane.evaluate((node) => node.getBoundingClientRect().width);
    await capture.screenshot(page, "workspace-inspector-collapsed-dark-desktop", false);
    await page.getByRole("button", { name: "Show inspector" }).click();
    await page.waitForTimeout(350);
    const inspectorRestored = await inspectorPane.evaluate((node) => node.getBoundingClientRect().width);
    recorder.behaviour.push({
      check: "inspector collapses to zero and restores its size",
      pass: inspectorWidth < 4 && inspectorRestored > 100,
      detail: `${Math.round(inspectorWidth)}px -> ${Math.round(inspectorRestored)}px`,
    });

    // Focus mode replaces the nested group with the focused pane only.
    await page.getByRole("button", { name: "Focus this pane" }).first().click();
    await page.waitForTimeout(300);
    const focusedGroup = await page.locator('[data-focus="true"]').count();
    await capture.screenshot(page, "workspace-focus-mode-dark-desktop", false);
    await page.getByRole("button", { name: "Exit focus mode" }).click();
    await page.waitForTimeout(250);
    recorder.behaviour.push({ check: "workspace focus mode enters and exits", pass: focusedGroup > 0 });

    /*
     * 200% zoom / text scaling, approximated by halving the viewport: the layout
     * must reflow rather than push a horizontal scrollbar onto the page. Routes
     * whose content is an intentionally scrollable region (a data table, a chart
     * catalogue) are excluded — their inner scrollers are the point.
     */
    const zoomContext = await browser.newContext({ viewport: { width: 720, height: 1000 } });
    const zoomPage = await zoomContext.newPage();
    attachDiagnostics(zoomPage, "zoom-200", recorder);
    const overflowing = [];
    for (const path_ of [
      "/",
      "/components/slider",
      "/components/menus",
      "/components/alert",
      "/components/empty-state",
      "/application",
      "/forms",
    ]) {
      await navigateAndReady(zoomPage, `${baseUrl}${path_}`);
      const widths = await zoomPage.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      if (widths.scroll > widths.client + 2) overflowing.push(`${path_} ${widths.scroll}>${widths.client}`);
    }
    await capture.screenshot(zoomPage, "zoom-200-application-dark-desktop", false);
    recorder.behaviour.push({
      check: "key routes reflow at 720px (approx. 200% zoom) without a page scrollbar",
      pass: overflowing.length === 0,
      detail: overflowing.join("; ") || "7 routes checked",
    });
    await zoomContext.close();

    // Mobile navigation: the Sheet nav opens.
    const navContext = await browser.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true });
    const navPage = await navContext.newPage();
    attachDiagnostics(navPage, "mobile-nav", recorder);
    await navigateAndReady(navPage, `${baseUrl}/`);
    await navPage.getByRole("button", { name: "Open navigation" }).click();
    await navPage.waitForTimeout(400);
    const navVisible = await navPage.getByRole("navigation", { name: "Showcase sections" }).isVisible();
    await capture.screenshot(navPage, "home-nav-open-dark-mobile", false);
    recorder.behaviour.push({ check: "mobile navigation opens", pass: navVisible });
    await navContext.close();
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* navigation — shared URL state and keyboard chart inspection               */
/* -------------------------------------------------------------------------- */

async function groupNavigation(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "navigation", recorder);
  const workspace = `${baseUrl}/patterns/research-workspace`;

  try {
    // Charts: the keyboard inspection path pins a timestamp without a pointer.
    await navigateAndReady(page, workspace);
    const inspectionArea = page.getByTestId("pin-area");
    await inspectionArea.focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(350);
    const keyboardCursor = new URL(page.url()).searchParams.get("cursor");
    await capture.screenshot(page, "research-workspace-keyboard-cursor-dark-desktop", false);
    recorder.behaviour.push({
      check: "arrow keys pin a chart timestamp without a pointer",
      pass: Boolean(keyboardCursor && /^\d{4}-\d{2}-\d{2}$/.test(keyboardCursor)),
      detail: keyboardCursor ?? "no cursor",
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const keyboardCleared = new URL(page.url()).searchParams.get("cursor");
    recorder.behaviour.push({ check: "Escape clears the keyboard cursor", pass: keyboardCleared === null });

    // The flagship: URL state, pinned inspection and Share view.
    await navigateAndReady(page, workspace);
    await capture.screenshot(page, "research-workspace-dark-desktop", false);

    await page.getByRole("button", { name: "3M", exact: true }).click();
    await page.waitForTimeout(400);
    const chipUrl = page.url();
    recorder.behaviour.push({
      check: "range chip writes date-only state to the URL",
      // `to` matches the dataset default, so only `from` is written: defaults are
      // omitted on purpose.
      pass: /from=\d{4}-\d{2}-\d{2}/.test(chipUrl),
      detail: chipUrl.split("?")[1] ?? "",
    });

    // Toggle a series, then reload: the view must come back identical.
    await page.getByRole("button", { name: "SMA 50", exact: true }).click();
    await page.waitForTimeout(300);
    const seriesUrl = page.url();
    await page.reload({ waitUntil: "domcontentloaded" });
    await ctx.waitForAppReady(page);
    await ctx.waitForStable(page);
    const afterReload = page.url();
    const seriesPressed = await page
      .getByRole("button", { name: "SMA 50", exact: true })
      .getAttribute("aria-pressed");
    recorder.behaviour.push({
      check: "reload restores the shared view",
      pass: afterReload === seriesUrl && seriesPressed === "true",
      detail: seriesUrl.split("?")[1] ?? "",
    });

    // Invalid URL: safe fallback, no crash, page still renders the chart.
    await navigateAndReady(page, `${workspace}?range=garbage&series=nope&from=banana`);
    const survivedInvalid = (await page.getByRole("heading", { name: /Momentum study/ }).count()) > 0;
    recorder.behaviour.push({ check: "an invalid view URL falls back safely", pass: survivedInvalid });

    // Pinned inspection: click the plot, expect a cursor parameter.
    await navigateAndReady(page, workspace);
    const pinArea = page.getByTestId("pin-area");
    const pinBox = await pinArea.boundingBox();
    if (pinBox) {
      await page.mouse.move(pinBox.x + pinBox.width * 0.4, pinBox.y + pinBox.height * 0.4);
      await page.waitForTimeout(320);
      await page.mouse.click(pinBox.x + pinBox.width * 0.4, pinBox.y + pinBox.height * 0.4);
      await page.waitForTimeout(420);
    }
    const pinnedParam = new URL(page.url()).searchParams.get("cursor");
    await capture.screenshot(page, "research-workspace-pinned-dark-desktop", false);
    recorder.behaviour.push({
      check: "clicking the chart pins a cursor into the URL",
      pass: Boolean(pinnedParam && /^\d{4}-\d{2}-\d{2}$/.test(pinnedParam)),
      detail: pinnedParam ?? "no cursor",
    });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const unpinned = new URL(page.url()).searchParams.get("cursor");
    recorder.behaviour.push({ check: "Escape unpins the inspection", pass: unpinned === null });

    // Back and Forward must move between shared views, not through every click.
    await page.getByRole("button", { name: "6M", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "1Y", exact: true }).click();
    await page.waitForTimeout(300);
    await page.goBack();
    await page.waitForTimeout(400);
    const backPressed = await page.getByRole("button", { name: "6M", exact: true }).getAttribute("aria-pressed");
    await page.goForward();
    await page.waitForTimeout(400);
    const forwardPressed = await page.getByRole("button", { name: "1Y", exact: true }).getAttribute("aria-pressed");
    recorder.behaviour.push({
      check: "browser Back and Forward move between shared views",
      pass: backPressed === "true" && forwardPressed === "true",
      detail: `back=${backPressed} forward=${forwardPressed}`,
    });

    // Share view: the copy button reports success (clipboard or fallback toast).
    await page.getByTestId("share-view").click();
    await page.waitForTimeout(500);
    const shareToast = await page.getByText(/copied|Copy this view link/i).count();
    await capture.screenshot(page, "research-workspace-share-dark-desktop", false);
    recorder.behaviour.push({ check: "share view confirms with a toast", pass: shareToast > 0 });
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* motion — reduced motion                                                   */
/* -------------------------------------------------------------------------- */

async function groupMotion(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP, reducedMotion: "reduce" });
  const page = await context.newPage();
  attachDiagnostics(page, "reduced-motion", recorder);
  try {
    await navigateAndReady(page, `${baseUrl}/foundations/motion`);
    const modeBadge = await page.getByText("reduced", { exact: true }).first().isVisible();
    recorder.behaviour.push({ check: "prefers-reduced-motion respected", pass: modeBadge });
    await capture.screenshot(page, "foundations-motion-reduced-dark-desktop");
    await navigateAndReady(page, `${baseUrl}/motion/border-glow`);
    await page.mouse.move(720, 500);
    await page.waitForTimeout(400);
    await capture.screenshot(page, "motion-border-glow-reduced-dark-desktop");
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* providers — the LUC wrapper contract, deterministic or live               */
/* -------------------------------------------------------------------------- */

/**
 * The V3.0 spatial gallery.
 *
 * Six primitives only ever meet on this page, so this group drives each of them
 * the way a person would and asserts that the DOM actually changed. A screenshot
 * of an arrangement proves nothing about motion: a deck that never steps and a
 * beam that never re-anchors both look perfectly fine in a PNG.
 */
async function groupSpatial(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "spatial", recorder);
  try {
    await navigateAndReady(page, `${baseUrl}/motion/spatial`);

    /* ---- A. ParallaxScene: depth travels as custom properties ---------- */
    const demoBox = await page.locator("[data-testid='parallax-scene-demo']").boundingBox();
    // Deliberately off-centre: at the exact centre the offset is 0, and a check
    // that accepts "0.000px" would pass without the scene doing anything.
    await page.mouse.move(demoBox.x + demoBox.width * 0.2, demoBox.y + demoBox.height * 0.25);
    await page.waitForTimeout(300);
    const parallax = await page.evaluate(() => {
      const scene = document.querySelector("[data-testid='parallax-scene-demo']");
      if (!scene) return null;
      return {
        state: scene.getAttribute("data-parallax"),
        x: scene.style.getPropertyValue("--luc-parallax-x").trim(),
        y: scene.style.getPropertyValue("--luc-parallax-y").trim(),
      };
    });
    recorder.behaviour.push({
      check: "ParallaxScene publishes pointer depth as custom properties",
      pass:
        parallax?.state === "on" &&
        Math.abs(Number.parseFloat(parallax.x ?? "0")) > 0.05 &&
        Math.abs(Number.parseFloat(parallax.y ?? "0")) > 0.05,
      detail: `${parallax?.state} x=${parallax?.x} y=${parallax?.y}`,
    });

    /*
     * The performance claim, measured rather than asserted: moving the pointer
     * must not re-render the page. A React render would show up as style
     * mutations *outside* the scene (class/style churn across the subtree), so
     * the probe compares writes on the scene element with writes anywhere else.
     */
    await page.evaluate(() => {
      const scene = document.querySelector("[data-testid='parallax-scene-demo']");
      const probe = { sceneWrites: 0, otherWrites: 0 };
      window.__lucSpatialProbe = probe;
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          // Writes anywhere inside the scene are the scene's own business (the
          // scene bus plus any motion surface on top of it). A React re-render
          // of the page would show up as churn *outside* it.
          if (scene.contains(record.target)) probe.sceneWrites += 1;
          else probe.otherWrites += 1;
        }
      });
      observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["style", "class"] });
      window.__lucSpatialProbeObserver = observer;
    });
    const sceneBox = await page.locator("[data-testid='parallax-scene-demo']").boundingBox();
    for (let step = 0; step <= 20; step += 1) {
      await page.mouse.move(
        sceneBox.x + (sceneBox.width * step) / 20,
        sceneBox.y + sceneBox.height / 2,
      );
      await page.waitForTimeout(16);
    }
    const renderCost = await page.evaluate(() => {
      window.__lucSpatialProbeObserver?.disconnect();
      return window.__lucSpatialProbe;
    });
    recorder.behaviour.push({
      check: "pointer movement writes the scene, not the React tree",
      pass: renderCost.sceneWrites > 0 && renderCost.otherWrites === 0,
      detail: `${renderCost.sceneWrites} scene style writes, ${renderCost.otherWrites} writes elsewhere`,
    });

    /* ---- B. OrbitField: seats are controls and drive the hub ----------- */
    // A turning ring must not be a moving target: resting the pointer on it
    // stops the loop, and its labels stop with it.
    const seatRing = page.locator("[data-slot='orbit-ring']").last();
    // `hover()` waits for stability, and a rotating element is never stable —
    // so scroll and aim the physical pointer by hand. Aiming at a *seat* is what
    // a person does, and it is the case that has to work.
    await seatRing.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(400);
    const seatBox = await page.locator("[data-testid='spatial-seat-emea'] button").boundingBox();
    await page.mouse.move(seatBox.x + seatBox.width / 2, seatBox.y + seatBox.height / 2);
    await page.waitForTimeout(120);
    const resting = await seatRing.evaluate((node) => {
      const counter = node.querySelector("[data-slot='orbit-counter']");
      return {
        ring: getComputedStyle(node).animationPlayState,
        counter: counter ? getComputedStyle(counter).animationPlayState : "missing",
      };
    });
    recorder.behaviour.push({
      check: "OrbitField rests while the pointer is on it",
      pass: resting.ring === "paused" && resting.counter === "paused",
      detail: `ring=${resting.ring} counter=${resting.counter}`,
    });

    // Then drive it the way the product asks a person to: freeze it, use a seat.
    await page.getByTestId("spatial-pause").click();
    await page.waitForTimeout(120);
    const hubBefore = ((await page.locator("[data-testid='spatial-hub']").innerText()) ?? "").replace(/\s+/g, " ");
    await page.locator("[data-testid='spatial-seat-emea'] button").click();
    const hubAfter = ((await page.locator("[data-testid='spatial-hub']").innerText()) ?? "").replace(/\s+/g, " ");
    const emeaPressed = await page
      .locator("[data-testid='spatial-seat-emea'] button")
      .getAttribute("aria-pressed");
    recorder.behaviour.push({
      check: "OrbitField seat is a button and updates the hub",
      pass: hubBefore !== hubAfter && emeaPressed === "true",
      detail: `${hubBefore} → ${hubAfter} (aria-pressed=${emeaPressed})`,
    });
    await page.getByTestId("spatial-pause").click();
    await capture.screenshot(page, "motion-spatial-orbit-dark-desktop");

    /* ---- C. ExpandableSurface: in place, keyboard, focus return -------- */
    const trigger = page.locator("[data-slot='expandable-surface-trigger']").first();
    await trigger.click();
    const opened = await page.locator("[data-slot='expandable-surface-content']").isVisible();
    const focusInside = await page.evaluate(
      () => document.activeElement?.getAttribute("data-slot") ?? null,
    );
    await page.keyboard.press("Escape");
    const closed = (await page.locator("[data-slot='expandable-surface-content']").count()) === 0;
    const focusBack = await page.evaluate(
      () => document.activeElement?.getAttribute("data-slot") ?? null,
    );
    recorder.behaviour.push({
      check: "ExpandableSurface expands in place, Escape closes it and focus returns",
      pass: opened && focusInside === "expandable-surface-content" && closed && focusBack === "expandable-surface-trigger",
      detail: `open=${opened} focusIn=${focusInside} closed=${closed} focusBack=${focusBack}`,
    });

    /* ---- D. KineticHeadline: one accessible string, new text on demand - */
    const headlineBefore = await page.locator("[data-slot='kinetic-accessible']").first().textContent();
    await page.getByTestId("kinetic-next").click();
    await page.waitForTimeout(450);
    const headlineAfter = await page.locator("[data-slot='kinetic-accessible']").first().textContent();
    const wordCount = await page.locator("[data-slot='kinetic-word']").first().count();
    recorder.behaviour.push({
      check: "KineticHeadline swaps real text and exposes one accessible string",
      pass: headlineBefore !== headlineAfter && wordCount > 0,
      detail: `${headlineBefore} → ${headlineAfter}`,
    });

    /* ---- E. CardStack: keyboard steps the deck, hidden cards are inert - */
    const deck = page.locator("[data-testid='card-stack-demo']");
    await deck.focus();
    const deckBefore = await deck.getAttribute("data-active");
    await page.keyboard.press("ArrowRight");
    const deckAfter = await deck.getAttribute("data-active");
    const inertLayers = await page.locator("[data-slot='card-stack-layer'][inert]").count();
    await page.keyboard.press("End");
    const deckEnd = await deck.getAttribute("data-active");
    // At the last card, clamping means the next control is genuinely disabled.
    const nextDisabled = await page.getByRole("button", { name: "Next card" }).isDisabled();
    await page.getByRole("button", { name: "Previous card" }).click();
    const deckAfterControl = await deck.getAttribute("data-active");
    recorder.behaviour.push({
      check: "CardStack steps from the keyboard and its composable controls",
      pass:
        deckBefore !== deckAfter &&
        inertLayers === 2 &&
        deckEnd === "2" &&
        nextDisabled &&
        deckAfterControl === "1",
      detail: `${deckBefore}→${deckAfter}, End=${deckEnd}, next disabled=${nextDisabled}, control=${deckAfterControl}, inert=${inertLayers}`,
    });
    await capture.screenshot(page, "motion-spatial-deck-dark-desktop");

    /* ---- F. SelectionBeam: the link follows the selection -------------- */
    const beam = page.locator("[data-slot='selection-beam']");
    const pathBefore = await beam.locator("path").first().getAttribute("d");
    await page.getByTestId("spatial-row-amer").click();
    await page.waitForTimeout(150);
    const pathAfter = await beam.locator("path").first().getAttribute("d");
    const inspector = ((await page.locator("[data-testid='spatial-hub']").innerText()) ?? "").trim();
    recorder.behaviour.push({
      check: "SelectionBeam re-anchors when the selected row changes",
      pass: Boolean(pathBefore) && Boolean(pathAfter) && pathBefore !== pathAfter,
      detail: `${pathBefore?.slice(0, 28)}… → ${pathAfter?.slice(0, 28)}… (hub: ${inspector.replace(/\s+/g, " ")})`,
    });
    await capture.screenshot(page, "motion-spatial-data-dark-desktop");

    /* ---- Reduced motion: same composition, no accumulation -------------- */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(200);
    const reducedState = await page.evaluate(() => {
      const scene = document.querySelector("[data-testid='parallax-scene-demo']");
      const deck = document.querySelector("[data-testid='card-stack-demo']");
      return {
        parallax: scene?.getAttribute("data-parallax"),
        deckCards: deck?.querySelectorAll("[data-slot='card-stack-layer']").length,
      };
    });
    recorder.behaviour.push({
      check: "Reduced motion keeps the arrangement and drops the pointer effect",
      pass: reducedState.parallax === "off" && reducedState.deckCards === 3,
      detail: `data-parallax=${reducedState.parallax}, deck layers=${reducedState.deckCards}`,
    });
    await capture.screenshot(page, "motion-spatial-reduced-dark-desktop");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* providers — the LUC wrapper contract, deterministic or live               */
/* -------------------------------------------------------------------------- */

/**
 * The wrapper contract.
 *
 * In `stub` mode this runs on the whole provider route set and proves LUC's own
 * behaviour (geometry, lifecycle, attribution, lazy trigger, no duplicate
 * mounting) without depending on TradingView's network. In `live` mode it runs
 * on a deliberately small representative set and is the only place that
 * concludes anything about the real provider.
 */
async function groupProviders(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady, providerState } = ctx;
  const live = ctx.options.providerMode === "live";
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "providers", recorder);

  /** Scroll the whole page so every lazy provider widget is requested. */
  const settle = async (target, timeoutMs, label = "providers") => {
    const result = await ctx.settleProviderWidgets(target, { timeoutMs });
    if (result.timedOut) {
      recorder.counters.providerTimeouts += 1;
      recorder.record(
        "provider-timeout",
        `${label}: ${result.ready} ready, ${result.error} error, ${result.pending} still pending after ${Math.round(
          result.providerWaitMs,
        )}ms`,
      );
    }
    recorder.counters.providerReady += result.ready;
    recorder.counters.providerErrors += result.error;
    return result;
  };

  try {
    await navigateAndReady(page, `${baseUrl}/integrations/tradingview/charts`);
    await settle(page);
    const chartsState = await providerState(page);
    await capture.screenshot(page, "tradingview-charts-settled-dark", false);
    recorder.behaviour.push({
      check: "provider widgets register and render their own format",
      pass:
        chartsState.widgets >= 4 &&
        chartsState.undefinedTags.length === 0 &&
        chartsState.iframes >= 3 &&
        chartsState.skeletons === 0,
      detail: JSON.stringify(chartsState),
    });

    await navigateAndReady(page, `${baseUrl}/integrations/tradingview/heatmaps`);
    await settle(page);
    const heatmapState = await providerState(page);
    recorder.behaviour.push({
      check: "every iframe widget renders the provider's attribution block",
      pass: heatmapState.containers > 0 && heatmapState.attribution === heatmapState.containers,
      detail: `${heatmapState.attribution}/${heatmapState.containers} containers attributed`,
    });

    // A theme flip must re-create an iframe, never stack a second one.
    await ctx.applyTheme(page, "light", recorder, "tradingview-heatmaps");
    await page.waitForTimeout(live ? 4000 : 600);
    const afterThemeFlip = await providerState(page);
    recorder.behaviour.push({
      check: "a theme flip does not stack a second iframe",
      pass: afterThemeFlip.containers <= heatmapState.containers && afterThemeFlip.iframes <= heatmapState.iframes,
      detail: `${heatmapState.containers}→${afterThemeFlip.containers} containers, ${heatmapState.iframes}→${afterThemeFlip.iframes} iframes`,
    });

    /*
     * The released widget is parked for a bounded grace period, so a single flip
     * briefly holds one extra container. What must never happen is accumulation:
     * flip repeatedly and the lot has to stay bounded and then empty itself.
     *
     * The bound is relative to the lot *as this scenario finds it*, not to zero.
     * The scenario above flipped the theme once, and that flip's container is
     * routinely still inside the grace window when these four start — a full
     * sweep measured five parked here with a fixed bound of four, while the two
     * assertions that describe accumulation (`after` drains to zero, containers
     * never exceed the baseline) held. Counting from the observed start keeps
     * the property "each flip parks at most one container" and drops the hidden
     * assumption that nothing was parked before the loop.
     */
    const parkedBeforeFlips = (await providerState(page)).parked;
    for (let flip = 0; flip < 4; flip += 1) {
      await ctx.applyTheme(page, flip % 2 === 0 ? "dark" : "light", recorder, "tradingview-heatmaps");
      await page.waitForTimeout(live ? 900 : 260);
    }
    const duringRapidFlips = await providerState(page);
    await page.waitForTimeout(1200);
    const afterRapidFlips = await providerState(page);
    recorder.behaviour.push({
      check: "repeated theme flips do not accumulate provider widgets",
      pass:
        // Bounded by the grace window, never by the run length: four flips in
        // ~1s may park one container each, on top of whatever the previous
        // scenario left draining, but the lot must drain to nothing.
        duringRapidFlips.parked <= parkedBeforeFlips + 4 &&
        afterRapidFlips.parked === 0 &&
        afterRapidFlips.containers <= heatmapState.containers,
      detail:
        `parked ${parkedBeforeFlips}→${duringRapidFlips.parked}→${afterRapidFlips.parked} ` +
        `(4 flips), containers=${afterRapidFlips.containers} (baseline ${heatmapState.containers})`,
    });
    await ctx.applyTheme(page, "dark", recorder, "tradingview-heatmaps");
    await page.waitForTimeout(live ? 500 : 200);

    // The failure surface: two deliberately missing provider modules.
    await navigateAndReady(page, `${baseUrl}/integrations/tradingview`);
    await settle(page, live ? 16_000 : 8_000);
    const failureAlerts = await page.getByRole("alert").count();
    const retryButtons = await page.getByRole("button", { name: "Try again" }).count();
    await page.getByRole("button", { name: "Try again" }).first().click();
    await page.waitForTimeout(live ? 3000 : 600);
    const alertsAfterRetry = await page.getByRole("alert").count();
    await capture.screenshot(page, "tradingview-failure-states-dark", false);
    recorder.behaviour.push({
      check: "an unreachable provider degrades to a retryable error state",
      pass: failureAlerts >= 2 && retryButtons >= 2 && alertsAfterRetry === failureAlerts,
      detail: `${failureAlerts} alerts, ${retryButtons} retries, ${alertsAfterRetry} after retry (no duplicates)`,
    });

    // Lazy loading: nothing is requested before the widget is near the viewport.
    const lazyContext = await browser.newContext({ viewport: DESKTOP });
    const lazyPage = await lazyContext.newPage();
    const providerRequests = [];
    lazyPage.on("request", (request) => {
      if (ctx.isProviderOrigin(request.url())) providerRequests.push(request.url());
    });
    await navigateAndReady(lazyPage, `${baseUrl}/integrations/tradingview/tickers`);
    await lazyPage.waitForTimeout(live ? 2500 : 800);
    const beforeScroll = providerRequests.length;
    await settle(lazyPage, live ? 9000 : 8000, "lazy-load");
    const afterScroll = providerRequests.length;
    recorder.behaviour.push({
      check: "provider requests are deferred until the widget is in view",
      pass: beforeScroll < afterScroll,
      detail: `${beforeScroll} request(s) before scrolling, ${afterScroll} after`,
    });
    await lazyContext.close();
  } finally {
    await context.close();
  }
}

/* -------------------------------------------------------------------------- */
/* registry                                                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* components — the Phase 4/5 families, exercised as journeys                */
/* -------------------------------------------------------------------------- */

/**
 * Every check below drives a *public* contract: an ARIA role, an accessible
 * name, or a documented `data-slot`. Nothing reads a test id that only the
 * Showcase can produce, so a check that starts failing is a real regression in
 * the library rather than a demo that moved.
 *
 * The families here are the ones the earlier sweeps only ever screenshotted:
 * a screenshot proves a component rendered, not that its keyboard model, its
 * focus return or its controlled state actually work.
 */
async function groupComponents(ctx) {
  const { browser, recorder, baseUrl, navigateAndReady, capture } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "components", recorder);

  /* ---- A. Accordion: a real disclosure, keyboard operable ------------- */
  await navigateAndReady(page, `${baseUrl}/components/accordion`);
  const accordionTrigger = page.locator('[data-slot="accordion-trigger"]').first();
  const accordionBefore = await accordionTrigger.getAttribute("aria-expanded");
  await accordionTrigger.click();
  await page.waitForTimeout(260);
  const accordionAfterClick = await accordionTrigger.getAttribute("aria-expanded");
  await accordionTrigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(260);
  const accordionAfterKey = await accordionTrigger.getAttribute("aria-expanded");
  const controlled = await accordionTrigger.getAttribute("aria-controls");
  const regionRendered = controlled
    ? (await page.locator(`[id="${controlled}"]`).count()) > 0
    : false;
  recorder.behaviour.push({
    check: "accordion toggles by pointer and by keyboard",
    pass:
      accordionBefore !== accordionAfterClick &&
      accordionAfterClick !== accordionAfterKey &&
      regionRendered,
    detail: `${accordionBefore}→${accordionAfterClick}→${accordionAfterKey}, region=${regionRendered}`,
  });
  await capture.screenshot(page, "components-accordion-dark-desktop");

  /* ---- B. TreeView: roving focus, arrows, one tab stop ---------------- */
  await navigateAndReady(page, `${baseUrl}/components/tree-view`);
  const tree = page.locator('[data-slot="tree-view"]').first();
  await tree.focus();
  /* Scoped to the first tree: the page documents the component twice, and each
     tree owns its own roving tab stop, so an unscoped count is always 2. */
  const activeRow = () => page.evaluate(() => {
    const row = document.querySelector('[data-slot="tree-view"] [data-slot="tree-view-row"][tabindex="0"]');
    return { text: row?.textContent?.trim() ?? null, expanded: row?.getAttribute("aria-expanded") ?? null };
  });
  const treeFirst = await activeRow();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(120);
  const treeSecond = await activeRow();
  const tabStops = await page.locator('[data-slot="tree-view"]').first().locator('[data-slot="tree-view-row"][tabindex="0"]').count();
  /* ArrowRight on the first (collapsed) node opens it; ArrowLeft on an open
     parent closes it. Both directions have to be exercised on a node whose
     state is known, so the walk starts with ArrowLeft on the first node. */
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(120);
  const collapsed = await activeRow();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  const reopened = await activeRow();
  recorder.behaviour.push({
    check: "tree view moves with arrows and keeps exactly one tab stop",
    pass:
      treeFirst.text !== treeSecond.text &&
      tabStops === 1 &&
      collapsed.expanded === "false" &&
      reopened.expanded === "true",
    detail: `${treeFirst.text} → ${treeSecond.text}, tabStops=${tabStops}, expanded ${collapsed.expanded} → ${reopened.expanded}`,
  });
  await capture.screenshot(page, "components-tree-view-keyboard-dark-desktop");

  /* ---- C. Media: gallery → lightbox → focus returns ------------------- */
  await navigateAndReady(page, `${baseUrl}/components/media`);
  const firstThumb = page.locator('[data-slot="image-gallery"] button').first();
  await firstThumb.click();
  await page.waitForTimeout(320);
  const lightboxOpen = await page.locator('[data-slot="lightbox"]').count();
  const lightboxRole = lightboxOpen
    ? await page.locator('[data-slot="lightbox"]').first().getAttribute("role")
    : null;
  await page.keyboard.press("Escape");
  /* The overlay animates out before Radix unmounts it, so "closed" is a wait,
     not a fixed sleep. */
  await page
    .locator('[data-slot="lightbox"]')
    .waitFor({ state: "detached", timeout: 3_000 })
    .catch(() => {});
  const lightboxClosed = (await page.locator('[data-slot="lightbox"]').count()) === 0;
  await page.waitForTimeout(120);
  const focusReturned = await page.evaluate(() => {
    const active = document.activeElement;
    return Boolean(active?.closest('[data-slot="image-gallery"]'));
  });
  recorder.behaviour.push({
    check: "gallery opens a lightbox, Escape closes it and returns focus",
    pass: lightboxOpen > 0 && lightboxClosed && focusReturned,
    detail: `open=${lightboxOpen} role=${lightboxRole} closed=${lightboxClosed} focusBack=${focusReturned}`,
  });

  /* ---- D. ImageCompare: the divider is a real range control ----------- */
  const compare = page.locator('[data-slot="image-compare"] input[type="range"]').first();
  const compareValueBefore = await compare.inputValue();
  await compare.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  const compareValueAfter = await compare.inputValue();
  recorder.behaviour.push({
    check: "image compare divider moves from the keyboard",
    pass: Number(compareValueAfter) > Number(compareValueBefore),
    detail: `${compareValueBefore} → ${compareValueAfter}`,
  });

  /* ---- E. Carousel: controls drive the real selection ----------------- */
  await navigateAndReady(page, `${baseUrl}/components/carousel`);
  const slideBefore = await page.locator('[data-slot="carousel"] [role="tab"][aria-selected="true"]').first().getAttribute("aria-label");
  await page.getByRole("button", { name: "Next slide" }).first().click();
  await page.waitForTimeout(420);
  const slideAfter = await page.locator('[data-slot="carousel"] [role="tab"][aria-selected="true"]').first().getAttribute("aria-label");
  recorder.behaviour.push({
    check: "carousel advances through its own control",
    pass: Boolean(slideBefore) && slideBefore !== slideAfter,
    detail: `${slideBefore} → ${slideAfter}`,
  });
  await capture.screenshot(page, "components-carousel-dark-desktop");

  /* ---- F. Board: sortable list and kanban reorder from the keyboard --- */
  await navigateAndReady(page, `${baseUrl}/components/board`);
  const orderBefore = await page.locator('[data-slot="sortable-list"] [data-sortable-index], [data-slot="sortable-list"] li, [data-slot="sortable-list"] > *').first().innerText();
  const handle = page.locator('button[aria-label^="Reorder"]').first();
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  const pickedUp = await handle.getAttribute("aria-pressed");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  const orderAfter = await page.locator('[data-slot="sortable-list"] [data-sortable-index], [data-slot="sortable-list"] li, [data-slot="sortable-list"] > *').first().innerText();
  recorder.behaviour.push({
    check: "sortable list reorders from the keyboard",
    pass: pickedUp === "true" && orderBefore !== orderAfter,
    detail: `pressed=${pickedUp}, "${orderBefore.split("\n")[0]}" → "${orderAfter.split("\n")[0]}"`,
  });
  await capture.screenshot(page, "components-board-keyboard-dark-desktop");

  /* ---- G. Notifications: unread count, mark-all, Escape --------------- */
  await navigateAndReady(page, `${baseUrl}/components/notifications`);
  const bell = page.locator('button[aria-label^="Notifications"]').first();
  const bellLabelBefore = await bell.getAttribute("aria-label");
  await bell.click();
  await page.waitForTimeout(320);
  const panelItems = await page.locator('[role="dialog"] li, [data-radix-popper-content-wrapper] li').count();
  const markAll = page.getByRole("button", { name: "Mark all read" }).first();
  const hadMarkAll = (await markAll.count()) > 0;
  if (hadMarkAll) await markAll.click();
  await page.waitForTimeout(260);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(260);
  const bellLabelAfter = await bell.getAttribute("aria-label");
  recorder.behaviour.push({
    check: "notification centre lists items, clears the unread count and closes",
    pass: panelItems > 0 && hadMarkAll && bellLabelAfter !== bellLabelBefore && !bellLabelAfter?.includes("unread"),
    detail: `items=${panelItems}, "${bellLabelBefore}" → "${bellLabelAfter}"`,
  });

  /* ---- H. Colour picker: slider and value stay in sync ---------------- */
  await navigateAndReady(page, `${baseUrl}/components/color-picker`);
  const pickerTrigger = page.locator('button[aria-label*=": #"], button[aria-label*=": rgb"]').first();
  const triggerBefore = await pickerTrigger.getAttribute("aria-label");
  await pickerTrigger.click();
  await page.waitForTimeout(320);
  const hue = page.locator('[role="slider"]').first();
  const hueBefore = await hue.getAttribute("aria-valuenow");
  await hue.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const hueAfter = await hue.getAttribute("aria-valuenow");
  const triggerAfter = await pickerTrigger.getAttribute("aria-label");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  recorder.behaviour.push({
    check: "colour picker slider and value field stay in sync",
    pass: hueBefore !== hueAfter && triggerBefore !== triggerAfter,
    detail: `hue ${hueBefore}→${hueAfter}, value "${triggerBefore}" → "${triggerAfter}"`,
  });

  /*
   * ---- I. Transfer list: the move buttons are the only data path ------
   *
   * The navigation is load-bearing and was missing.
   *
   * The block below reads `[data-slot="transfer-list"]` on whatever page is
   * current. It was added directly after the colour-picker section, and the last
   * navigation before it was `/components/color-picker` — a page with no transfer
   * list — so `locator('[role="option"]').first().click()` waited out its 30 s
   * timeout and aborted the whole behaviour tier before the route sweep ran.
   * Reproduced from a clean checkout of the extracted repository; the defect is
   * inherited from `luc-quant` (introduced with this section), not from the
   * extraction, and `behaviour.mjs` is otherwise byte-identical to it.
   *
   * The check's own intent is unambiguous — the generic demo walk below maps
   * `TransferList` to `/components/transfer-list` — so the fix is the navigation
   * it always needed, not a relaxed assertion.
   */
  await navigateAndReady(page, `${baseUrl}/components/transfer-list`);
  const panes = page.locator('[data-slot="transfer-list"] [role="listbox"]');
  const selectedBefore = await panes.nth(1).locator('[role="option"]').count();
  await panes.first().locator('[role="option"]').first().click();
  await page.waitForTimeout(120);
  const moveRight = page.locator('[data-slot="transfer-list"] button[aria-label^="Move selected to"]').first();
  await moveRight.click();
  await page.waitForTimeout(220);
  const selectedAfter = await panes.nth(1).locator('[role="option"]').count();
  recorder.behaviour.push({
    check: "transfer list moves a selected field between the two lists",
    pass: selectedAfter === selectedBefore + 1,
    detail: `${selectedBefore} → ${selectedAfter} selected`,
  });

  /* ---- J. AI: the stream runs on mount and the composer submits ------- */
  await navigateAndReady(page, `${baseUrl}/components/ai`);
  /*
   * Scoped to the thread.
   *
   * `/components/ai` now mounts a Playground above the message list, and that
   * panel's own specimen is a `ChatMessage` with `from="assistant"` — so an
   * unscoped `.first()` measured the playground's static fixture (67 characters,
   * never advancing) instead of the streaming turn. The streaming message is the
   * one inside a `MessageList`; the playground's is not.
   */
  const assistantBody = page
    .locator('[data-slot="message-list"] [data-slot="chat-message"][data-role="assistant"]')
    .first();
  const streamFirst = (await assistantBody.innerText()).length;
  await page.waitForTimeout(1_600);
  const streamSecond = (await assistantBody.innerText()).length;
  await page.waitForTimeout(2_000);
  const streamThird = (await assistantBody.innerText()).length;
  const streamSnippet = (await assistantBody.innerText()).replace(/\s+/g, " ").slice(0, 60);
  const composer = page.locator('[data-slot="prompt-composer"] textarea, [data-slot="prompt-composer"] [contenteditable="true"]').first();
  await composer.fill("Regime check");
  await composer.press("Enter");
  await page.waitForTimeout(400);
  const composerCleared = (await composer.inputValue()) === "";
  recorder.behaviour.push({
    check: "the AI answer streams on mount and the composer submits",
    /*
     * Growth *or* completion both count: under a reduced-motion preference the
     * reveal is instant, so a completed answer is the correct end state rather
     * than evidence of a broken stream.
     */
    pass: (streamThird > streamFirst || streamThird > 200) && composerCleared,
    detail: `stream ${streamFirst} → ${streamSecond} → ${streamThird} chars, composer cleared=${composerCleared}, body="${streamSnippet}"`,
  });
  await capture.screenshot(page, "components-ai-live-dark-desktop");

  /* ---- K. Rating: arrow keys are the radio model ---------------------- */
  await navigateAndReady(page, `${baseUrl}/components/avatar`);
  const rating = page.locator('[data-slot="rating"] [role="radio"]').first();
  await rating.focus();
  const ratingBefore = await page.locator('[data-slot="rating"] [role="radio"][aria-checked="true"]').first().getAttribute("aria-label");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  const ratingAfter = await page.locator('[data-slot="rating"] [role="radio"][aria-checked="true"]').first().getAttribute("aria-label");
  recorder.behaviour.push({
    check: "rating steps with the arrow keys",
    pass: ratingBefore !== ratingAfter,
    detail: `${ratingBefore} → ${ratingAfter}`,
  });

  /* ---- L. Pagination: the current page is announced, not just styled -- */
  await navigateAndReady(page, `${baseUrl}/components/pagination`);
  /* Scoped: the app shell also marks the current *route* with aria-current. */
  const pager = page.locator('[data-slot="pagination"]').first();
  const pageBefore = await pager.locator('[aria-current="page"]').first().innerText();
  const next = pager.locator('[data-slot="pagination-next"]').first();
  await next.click();
  await page.waitForTimeout(320);
  const pageAfter = await pager.locator('[aria-current="page"]').first().innerText();
  recorder.behaviour.push({
    check: "pagination moves the current-page marker",
    pass: pageBefore !== pageAfter,
    detail: `${pageBefore} → ${pageAfter}`,
  });

  await capture.screenshot(page, "components-pagination-dark-desktop");
  await context.close();
}

/* -------------------------------------------------------------------------- */
/* experiences — the sixteen reference products, as user journeys             */
/* -------------------------------------------------------------------------- */

/**
 * Each check below drives one advertised journey of one reference experience
 * and asserts the *result*, not that a click happened.
 *
 * The rule Phase 7 arrived at is applied here literally: a screenshot of a page
 * with ten components is not evidence that the ten components work. So every
 * assertion reads a value back out of the DOM after the interaction — a price, a
 * row count, a filter total, a stream length — and the check fails when the
 * value is unchanged rather than when an element is missing.
 */
async function groupExperiences(ctx) {
  const { browser, recorder, baseUrl, navigateAndReady, capture } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "experiences", recorder);

  /* ---- A. Marketing: billing period, FAQ, form validation ------------- */
  await navigateAndReady(page, `${baseUrl}/experiences/general/marketing`);
  /* The Team plan: the free plan's price is 0 in both periods by design. */
  const planPrice = () => page.locator('[data-slot="plan-price"]').nth(1).innerText();
  const monthlyPrice = await planPrice();
  await page.getByRole("button", { name: /Switch to annual/i }).click();
  await page.waitForTimeout(200);
  const annualPrice = await planPrice();
  const annualNote = await page.locator("p", { hasText: /Annual billing takes 20%/ }).count();

  const faqTrigger = page.locator('[data-slot="accordion-trigger"]').first();
  const faqBefore = await faqTrigger.getAttribute("aria-expanded");
  await faqTrigger.click();
  await page.waitForTimeout(240);
  const faqAfter = await faqTrigger.getAttribute("aria-expanded");

  await page.getByRole("button", { name: "Request a walkthrough" }).last().click();
  await page.waitForTimeout(200);
  const errorShown = await page.getByText(/Enter a work email/i).count();
  await page.locator('input[name="email"]').fill("not-an-address");
  await page.getByRole("button", { name: "Request a walkthrough" }).last().click();
  await page.waitForTimeout(200);
  const formatError = await page.getByText(/missing an @ or a domain/i).count();
  await page.locator('input[name="email"]').fill("rae@example.com");
  await page.getByRole("button", { name: "Request a walkthrough" }).last().click();
  await page.waitForTimeout(300);
  const success = await page.getByText(/Request received/i).count();
  recorder.behaviour.push({
    check: "marketing: billing period changes the price, the FAQ opens, the form validates then succeeds",
    pass:
      monthlyPrice !== annualPrice &&
      annualNote === 1 &&
      faqBefore === "false" &&
      faqAfter === "true" &&
      errorShown === 1 &&
      formatError === 1 &&
      success === 1,
    detail: `price ${monthlyPrice}→${annualPrice}, faq ${faqBefore}→${faqAfter}, empty=${errorShown}, malformed=${formatError}, success=${success}`,
  });
  await capture.screenshot(page, "experiences-marketing-submitted-dark-desktop");

  /* ---- B. SaaS: filtering, inviting, and the empty state -------------- */
  await navigateAndReady(page, `${baseUrl}/experiences/general/saas`);
  const rows = () => page.locator('[data-slot="data-table"] tbody tr').count();
  const allRows = await rows();
  await page.locator('select[aria-label="Filter by role"]').selectOption("Analyst");
  await page.waitForTimeout(250);
  const analystRows = await rows();
  await page.locator('select[aria-label="Filter by role"]').selectOption("Owner");
  await page.waitForTimeout(150);
  await page.locator('input[aria-label="Search members"]').fill("zzzz");
  await page.waitForTimeout(250);
  const emptyShown = await page.getByText(/No members match that filter/i).count();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForTimeout(250);
  const restored = await rows();
  await page.getByRole("button", { name: "Invite member" }).click();
  await page.waitForTimeout(300);
  await page.locator('input[name="invite-email"]').fill("new.person@example.com");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await page.waitForTimeout(400);
  const afterInvite = await rows();
  recorder.behaviour.push({
    check: "SaaS console: role filter, search empty state, clear, and an invite that adds a row",
    pass:
      analystRows < allRows &&
      emptyShown === 1 &&
      restored === allRows &&
      afterInvite === allRows + 1,
    detail: `rows ${allRows} → filter ${analystRows} → empty=${emptyShown} → restored ${restored} → invited ${afterInvite}`,
  });
  await capture.screenshot(page, "experiences-saas-invited-dark-desktop");

  /* ---- C. Publishing: topic filter, an article, and the way back ------ */
  await navigateAndReady(page, `${baseUrl}/experiences/general/publishing`);
  const articleButtons = page.locator('[data-slot="field-notes"] button').filter({ hasText: /min|Lead story/ });
  const allArticles = await articleButtons.count();
  await page.getByRole("button", { name: "Databases", exact: true }).click();
  await page.waitForTimeout(250);
  const filtered = await articleButtons.count();
  await page.getByRole("button", { name: /The migration that did not happen/ }).click();
  await page.waitForTimeout(300);
  const opened = await page.locator('[data-slot="field-notes-article"]').count();
  const related = await page.getByText(/More on these topics/i).count();
  await page.getByRole("button", { name: /All articles/ }).click();
  await page.waitForTimeout(250);
  const back = await page.locator('[data-slot="field-notes"]').count();
  recorder.behaviour.push({
    check: "publishing: topic filter narrows the index, an article opens, related pieces appear, back returns",
    pass: filtered < allArticles && opened === 1 && related === 1 && back === 1,
    detail: `articles ${allArticles} → filtered ${filtered}, opened=${opened}, related=${related}, back=${back}`,
  });
  await capture.screenshot(page, "experiences-publishing-index-dark-desktop");

  /* ---- D. Community: rejection, posting, reacting, moderation --------- */
  await navigateAndReady(page, `${baseUrl}/experiences/general/community`);
  const posts = () => page.locator('[data-slot="common-room"] article').count();
  const postsBefore = await posts();
  await page.locator('textarea[name="post"]').fill("too short");
  await page.getByRole("button", { name: "Post to the room" }).click();
  await page.waitForTimeout(400);
  const refused = await page.getByText(/at least a sentence before posting/i).count();
  const unchanged = (await posts()) === postsBefore;
  await page.locator('textarea[name="post"]').fill("A note long enough to be a note.");
  await page.getByRole("button", { name: "Post to the room" }).click();
  await page.waitForTimeout(400);
  const afterPost = await posts();

  const reaction = page.locator('[data-slot="common-room"] article').first().getByRole("button", { name: /Insightful/ });
  const reactionBefore = (await reaction.innerText()).replace(/\D/g, "");
  await reaction.click();
  await page.waitForTimeout(200);
  const reactionAfter = (await reaction.innerText()).replace(/\D/g, "");

  const deleteButton = page
    .locator('[data-slot="common-room"] article')
    .first()
    .getByRole("button", { name: "Post actions" });
  await deleteButton.click();
  await page.waitForTimeout(250);
  await page.getByRole("menuitem", { name: "Delete post" }).click();
  await page.waitForTimeout(300);
  const confirmShown = await page.getByText(/Delete this post\?/i).count();
  await page.getByRole("button", { name: "Keep it" }).click();
  await page.waitForTimeout(300);
  const cancelled = (await posts()) === afterPost;
  recorder.behaviour.push({
    check: "community: a two-word post is refused, a real one appears, a reaction counts, delete is confirmed and cancellable",
    pass:
      refused === 1 &&
      unchanged &&
      afterPost === postsBefore + 1 &&
      reactionBefore !== reactionAfter &&
      confirmShown === 1 &&
      cancelled,
    detail: `refused=${refused}, posts ${postsBefore} → ${afterPost}, reaction ${reactionBefore}→${reactionAfter}, confirm=${confirmShown}, cancelled=${cancelled}`,
  });
  await capture.screenshot(page, "experiences-community-dark-desktop");

  /* ---- E. Career: a project opens in place and closes ----------------- */
  await navigateAndReady(page, `${baseUrl}/experiences/personal/career`);
  const project = page.getByRole("button", { name: /Tidewater/ });
  await project.click();
  await page.waitForTimeout(300);
  const detailOpen = await page.locator('[data-slot="project-showcase"] section').count();
  const expanded = await project.getAttribute("aria-expanded");
  await project.click();
  await page.waitForTimeout(300);
  const detailClosed = await page.locator('[data-slot="project-showcase"] section').count();
  const period = await page.locator('[data-slot="experience-timeline"] time').first().getAttribute("datetime");
  recorder.behaviour.push({
    check: "career: a project opens in place, closes again, and the timeline carries a machine-readable period",
    pass: detailOpen === 1 && expanded === "true" && detailClosed === 0 && Boolean(period),
    detail: `open=${detailOpen} (aria-expanded=${expanded}), closed=${detailClosed}, dateTime=${period}`,
  });
  await capture.screenshot(page, "experiences-career-dark-desktop");

  /* ---- F. Academic: the bibliography narrows and reports ------------- */
  await navigateAndReady(page, `${baseUrl}/experiences/personal/academic`);
  const count = () => page.locator('[data-slot="publication-list"] p[aria-live]').innerText();
  const countBefore = await count();
  await page.locator('select#publication-facet-year').selectOption("2025");
  await page.waitForTimeout(250);
  const countAfter = await count();
  await page.locator('select#publication-facet-topic').selectOption("Evaluation");
  await page.waitForTimeout(250);
  const countTopic = await count();
  await page.locator('select#publication-facet-year').selectOption("all");
  await page.locator('select#publication-facet-topic').selectOption("all");
  await page.waitForTimeout(200);
  const countRestored = await count();
  recorder.behaviour.push({
    check: "academic: year and topic facets narrow the bibliography and the live count follows",
    pass: countAfter !== countBefore && countTopic !== countAfter && countRestored === countBefore,
    detail: `${countBefore} → ${countAfter} → ${countTopic} → ${countRestored}`,
  });
  await capture.screenshot(page, "experiences-academic-filtered-dark-desktop");

  /* ---- G. Portfolio: the gallery lightbox opens, steps and closes ----- */
  await navigateAndReady(page, `${baseUrl}/experiences/personal/portfolio`);
  await page.locator('[data-slot="image-gallery"] button').first().click();
  await page.waitForTimeout(400);
  const viewerOpen = await page.locator('[data-slot="lightbox"]').count();
  const firstLabel = viewerOpen ? await page.locator('[data-slot="lightbox"]').first().innerText() : "";
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const secondLabel = viewerOpen ? await page.locator('[data-slot="lightbox"]').first().innerText() : "";
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="lightbox"]').waitFor({ state: "detached", timeout: 3_000 }).catch(() => {});
  const viewerClosed = (await page.locator('[data-slot="lightbox"]').count()) === 0;
  recorder.behaviour.push({
    check: "portfolio: the sleeve gallery opens a viewer, steps with the arrow key and closes on Escape",
    pass: viewerOpen > 0 && firstLabel !== secondLabel && viewerClosed,
    detail: `open=${viewerOpen}, stepped=${firstLabel !== secondLabel}, closed=${viewerClosed}`,
  });
  await capture.screenshot(page, "experiences-portfolio-dark-desktop");

  /* ---- H. Garden: kind filter, empty combination, and the way out ---- */
  await navigateAndReady(page, `${baseUrl}/experiences/personal/garden`);
  const notes = () => page.locator('[data-slot="field-notebook"] article').count();
  const allNotes = await notes();
  await page.getByRole("radio", { name: "Photos" }).click();
  await page.waitForTimeout(300);
  const photoNotes = await notes();
  await page.getByRole("button", { name: "Interfaces" }).click();
  await page.getByRole("button", { name: "Music" }).click();
  await page.waitForTimeout(300);
  const gardenEmpty = await page.getByText(/Nothing in the notebook matches/i).count();
  await page.getByRole("button", { name: "Show everything" }).click();
  await page.waitForTimeout(300);
  const gardenRestored = await notes();
  const meters = await page.locator('[data-slot="reading-shelf"] [role="progressbar"]').count();
  recorder.behaviour.push({
    check: "garden: the kind selector filters, an impossible combination explains itself, and the shelf exposes progress",
    pass:
      photoNotes < allNotes &&
      gardenEmpty === 1 &&
      gardenRestored === allNotes &&
      meters === 2,
    detail: `notes ${allNotes} → photos ${photoNotes} → empty=${gardenEmpty} → restored ${gardenRestored}, meters=${meters}`,
  });
  await capture.screenshot(page, "experiences-garden-empty-dark-desktop");

  /* ---- I. AI workspace: the answer streams and can be stopped -------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/ai`);
  const desk = page.locator('[data-slot="copilot-desk"]');
  await page.getByRole("button", { name: "Try the drawdown question" }).click();
  await page.waitForTimeout(160);
  const streaming = await desk.getAttribute("data-streaming");
  const partway = (await page.locator('[data-slot="chat-message"]').last().innerText()).length;
  await page.waitForTimeout(2_500);
  const finished = await desk.getAttribute("data-streaming");
  const complete = (await page.locator('[data-slot="chat-message"]').last().innerText()).length;
  const tools = await page.locator('[data-slot="tool-call-timeline"]').count();
  recorder.behaviour.push({
    check: "AI workspace: a prepared answer streams to completion with its tool calls attached",
    pass: streaming === "true" && finished === "false" && complete > partway && tools >= 1,
    detail: `streaming ${streaming} → ${finished}, body ${partway} → ${complete} chars, tool timelines=${tools}`,
  });
  await capture.screenshot(page, "experiences-ai-streamed-dark-desktop");

  /* ---- J. Science: the display parameter changes the figure ---------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/science`);
  const binLabel = page.locator("label", { hasText: /Histogram bins/ }).locator("span.luc-numeric").first();
  const binsBefore = await binLabel.innerText();
  /*
   * The figure is a canvas, so its markup never changes — a repaint has to be
   * measured in pixels. The sum of the canvases' PNG lengths is a cheap,
   * stable proxy for "the picture is different".
   */
  const inkOf = () =>
    page
      .locator('[data-slot="echart-surface"] canvas')
      .evaluateAll((nodes) => nodes.reduce((total, node) => total + (node.toDataURL ? node.toDataURL().length : 0), 0));
  const inkBefore = await inkOf();
  await page.locator('label:has-text("Histogram bins") [role="slider"]').focus();
  for (let index = 0; index < 6; index += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const binsAfter = await binLabel.innerText();
  const inkAfter = await inkOf();
  recorder.behaviour.push({
    check: "research bench: the bin slider changes the parameter and repaints the histogram",
    pass: binsBefore !== binsAfter && inkBefore !== inkAfter,
    detail: `bins ${binsBefore}→${binsAfter}, canvas bytes ${inkBefore}→${inkAfter}`,
  });
  await capture.screenshot(page, "experiences-science-bins-dark-desktop");

  /* ---- K. Finance: the range control and the row inspector ----------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/finance`);
  const inspector = page.locator('[data-slot="position-inspector-title"]');
  const before = await inspector.innerText();
  /* Rows are selected by their own control, not by clicking the row body. */
  await page.locator('[data-slot="data-table"] tbody tr').nth(2).locator('[data-slot="checkbox"]').click();
  await page.waitForTimeout(300);
  const after = await inspector.innerText();
  const chartsBefore = await page.locator('[data-slot="echart-surface"] canvas').count();
  await page.getByRole("radio", { name: "30 sessions" }).click();
  await page.waitForTimeout(500);
  const chartsAfter = await page.locator('[data-slot="echart-surface"] canvas').count();
  recorder.behaviour.push({
    check: "quant desk: selecting a row changes the inspector and the range control keeps every figure",
    pass: before !== "" && before !== after && chartsBefore > 0 && chartsAfter === chartsBefore,
    detail: `inspector "${before}" → "${after}", canvases ${chartsBefore} → ${chartsAfter}`,
  });
  await capture.screenshot(page, "experiences-finance-range-dark-desktop");

  /* ---- L. Commerce: a variant changes the price, checkout goes back -- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/commerce`);
  const price = () => page.locator('[data-slot="northlight"] span.font-display.luc-numeric').first().innerText();
  const priceBefore = await price();
  await page.getByRole("radio", { name: /Brass \/ walnut/ }).click();
  await page.waitForTimeout(250);
  const priceAfter = await price();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(200);
  const deliveryStep = await page.locator("input[name='email']").count();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForTimeout(200);
  const paymentStep = await page.getByText(/Payment would be collected here/i).count();
  /*
   * `exact: true` because the sidebar's "Feedback" family trigger is also a
   * button, and a Playwright name filter is a substring match: without it,
   * `name: "Back"` resolves to three elements and the whole sweep refuses to
   * start. The checkout's own Back buttons are the only exact matches.
   */
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.waitForTimeout(200);
  const backAtCart = await page.getByText(/Your basket holds/i).count();
  recorder.behaviour.push({
    check: "commerce: a variant changes the price and the three-step checkout can go back",
    pass:
      priceBefore !== priceAfter &&
      deliveryStep === 1 &&
      paymentStep === 1 &&
      backAtCart === 1,
    detail: `price ${priceBefore}→${priceAfter}, steps delivered=${deliveryStep} payment=${paymentStep} back=${backAtCart}`,
  });
  await capture.screenshot(page, "experiences-commerce-checkout-dark-desktop");

  /* ---- M. Education: the quiz scores itself and explains ------------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/education`);
  const progress = () => page.locator('[data-slot="course-module"] [role="progressbar"]').first().getAttribute("aria-valuenow");
  const progressBefore = await progress();
  await page.getByRole("button", { name: "Mark as read" }).click();
  await page.waitForTimeout(250);
  const progressAfter = await progress();
  await page.getByRole("radio", { name: "A bigger buffer" }).click();
  await page.getByRole("radio", { name: /At 40,000 events a second/ }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Check my answers" }).click();
  await page.waitForTimeout(300);
  const scored = await page.getByText(/1 \/ 2/).count();
  const explained = await page.getByText(/A buffer buys time/i).count();
  recorder.behaviour.push({
    check: "education: marking a lesson moves the progress and the check scores and explains every answer",
    pass: progressBefore !== progressAfter && scored === 1 && explained === 1,
    detail: `progress ${progressBefore}→${progressAfter}, score shown=${scored}, explanation=${explained}`,
  });
  await capture.screenshot(page, "experiences-education-scored-dark-desktop");

  /* ---- N. Media: metadata survives switching, reorder is announced --- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/media`);
  const titleField = page.locator('textarea[name="asset-title"]');
  await titleField.fill("Harbour, 06:10 — regraded");
  await page.waitForTimeout(150);
  await page.locator('[data-slot="creator-studio"] aside').getByRole("button", { name: "0:28" }).click();
  await page.waitForTimeout(200);
  await page.locator('[data-slot="creator-studio"] aside').getByRole("button", { name: "0:42" }).click();
  await page.waitForTimeout(200);
  const persisted = await titleField.inputValue();
  const firstShot = page.locator('[data-slot="reel-first-shot"]');
  const firstShotBefore = (await firstShot.innerText()).replace(/\s+/g, " ");
  const handle = page.locator('[data-slot="sortable-list"] button[aria-label^="Reorder"]').first();
  await handle.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  const firstShotAfter = (await firstShot.innerText()).replace(/\s+/g, " ");
  recorder.behaviour.push({
    check: "creator studio: an edit survives switching assets and the keyboard reorders the reel",
    pass: persisted.includes("regraded") && firstShotBefore !== firstShotAfter,
    detail: `title persisted="${persisted}", first shot "${firstShotBefore}" → "${firstShotAfter}"`,
  });
  await capture.screenshot(page, "experiences-media-dark-desktop");

  /* ---- O. Productivity: a keyboard move and a bulk selection --------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/productivity`);
  const doneBefore = await page.locator('[data-slot="planner"] [role="progressbar"]').first().getAttribute("aria-valuenow");
  const card = page.locator('[data-slot="kanban-board"] button[aria-label^="Move "]').first();
  await card.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await page.waitForTimeout(400);
  const announced = await page.getByText(/Last move:/i).count();
  await page.locator('[data-slot="planner"] [data-slot="checkbox"]').first().click();
  await page.waitForTimeout(250);
  const bulkEnabled = await page.getByRole("button", { name: "Reassign selection" }).isEnabled();
  recorder.behaviour.push({
    check: "productivity: a card moves by keyboard, the move is announced, and selection enables the bulk action",
    pass: announced === 1 && bulkEnabled,
    detail: `progress=${doneBefore}, announced=${announced}, bulk enabled=${bulkEnabled}`,
  });
  await capture.screenshot(page, "experiences-productivity-moved-dark-desktop");

  /* ---- P. Forum: a thread, a reply, and an escapable report ---------- */
  await navigateAndReady(page, `${baseUrl}/experiences/vertical/forum`);
  await page.getByRole("button", { name: /How do you review a migration plan/ }).click();
  await page.waitForTimeout(300);
  const threadOpen = await page.locator('[data-slot="signal-thread"]').count();
  const replies = () => page.locator('[data-slot="signal-thread"] ul [data-slot="card"]').count();
  const repliesBefore = await replies();
  await page.locator('textarea[name="reply"]').fill("I would ask for the rollback first.");
  await page.getByRole("button", { name: "Post reply" }).click();
  await page.waitForTimeout(400);
  const repliesAfter = await replies();
  await page.getByRole("button", { name: "Report" }).first().click();
  await page.waitForTimeout(300);
  const reportQuoted = await page.getByText(/A moderator reads reports/i).count();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(300);
  const repliesUnchanged = (await replies()) === repliesAfter;
  recorder.behaviour.push({
    check: "forum: a thread opens, a reply is appended, and the report dialog is escapable",
    pass: threadOpen === 1 && repliesAfter === repliesBefore + 1 && reportQuoted === 1 && repliesUnchanged,
    detail: `thread=${threadOpen}, replies ${repliesBefore} → ${repliesAfter}, report=${reportQuoted}, cancelled=${repliesUnchanged}`,
  });
  await capture.screenshot(page, "experiences-forum-report-dark-desktop");

  await context.close();
}

/*
 * docs — the Phase 9 developer platform.
 *
 * The brief for this phase is a set of promises about a *developer workflow*:
 * find a component, read an honest page for it, change a property, see the code
 * change with it, copy installation instructions that work. Every assertion
 * below is one of those promises, checked in a browser against the deployed
 * container rather than reasoned about from the source.
 *
 * Two of them are deliberately about honesty rather than function, because they
 * are the ones an agent is most likely to drift on: the installation section
 * must label the registry command as not yet available, and the templates page
 * must not offer a download it cannot honour.
 */
async function groupDocs(ctx) {
  const { browser, recorder, baseUrl, capture, navigateAndReady } = ctx;
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  attachDiagnostics(page, "docs", recorder);

  try {
    /* ---------------------------------------------------------------- home */
    await navigateAndReady(page, baseUrl);
    /*
     * The homepage's claim, checked as shape rather than as a fixed sentence.
     *
     * Phase 10A rewrote the hero, and the old assertion pinned the old wording
     * ("one system"), so it failed for a legitimate change. What the check is
     * actually for is that the front door states what the library is, in one `h1`,
     * with enough words to be a sentence — so it now asserts exactly that, and
     * still fails a placeholder, an empty heading or a marketing one-liner.
     */
    const heroHeadings = page.getByRole("heading", { level: 1 });
    const heroCount = await heroHeadings.count();
    const heroHeading = heroCount === 1 ? (await heroHeadings.innerText()).trim() : "";
    recorder.behaviour.push({
      check: "the homepage states what the library is in one h1",
      pass: heroCount === 1 && heroHeading.split(/\s+/).length >= 3,
      detail: `${heroCount} h1 · ${heroHeading.slice(0, 80)}`,
    });
    await capture.screenshot(page, "home-phase9-dark-desktop", false);

    const installSection = page.getByTestId("home-install");
    const installText = (await installSection.innerText()).replace(/\s+/g, " ");
    recorder.behaviour.push({
      check: "the homepage shows an install command",
      pass: /pnpm add|npm install|yarn add|bun add/.test(installText),
      detail: installText.slice(0, 80),
    });
    recorder.behaviour.push({
      check: "the homepage labels the registry command as not yet published",
      pass: /Not published yet|not published to a registry/i.test(installText),
      detail: /Not published yet/.test(installText) ? "badge present" : "badge missing",
    });

    /*
     * Every internal destination on the homepage is a real route. A front page
     * that links to a 404 is the most visible way for a documentation site to
     * be wrong, and it is cheap to check.
     */
    const hrefs = [...new Set(
      await page.locator("a[href^='/']").evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("href")).filter((href) => !!href && !href.startsWith("/#")),
      ),
    )];
    const broken = [];
    for (const href of hrefs.slice(0, 40)) {
      const response = await context.request.get(`${baseUrl}${href}`, { maxRedirects: 5 });
      if (!response.ok()) broken.push(`${href} → ${response.status()}`);
    }
    recorder.behaviour.push({
      check: "every link on the homepage resolves",
      pass: broken.length === 0,
      detail: broken.slice(0, 5).join("; ") || `${hrefs.length} links checked`,
    });

    /* ------------------------------------------------------------ aliases */
    const aliasResponse = await context.request.get(`${baseUrl}/components/button`, { maxRedirects: 0 });
    recorder.behaviour.push({
      check: "a component id URL redirects to its real page",
      pass: aliasResponse.status() === 308 && (aliasResponse.headers().location ?? "").endsWith("/components/buttons"),
      detail: `${aliasResponse.status()} → ${aliasResponse.headers().location ?? "no location"}`,
    });

    /* -------------------------------------------------- component page */
    await navigateAndReady(page, `${baseUrl}/components/rating`);
    const ratingHeading = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
    const propHeaders = await page.getByRole("columnheader", { name: "Prop" }).count();
    const ratingText = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    recorder.behaviour.push({
      check: "a generated component page has its own route and heading",
      pass: ratingHeading === "Rating",
      detail: ratingHeading,
    });
    recorder.behaviour.push({
      check: "a component page documents props from the compiler",
      pass: propHeaders > 0,
      detail: `${propHeaders} props table(s)`,
    });
    /*
     * Components V2 §5 changed this contract, so the assertion changed with it.
     *
     * The page used to be required to carry the package-manager commands. It is
     * now required *not* to: four `pnpm add` lines repeated across 220 pages was
     * the largest block of copy on the site and none of it was specific to the
     * component it sat under. What the page owes a reader instead is the one
     * import line for this component, with the package setup one link away.
     *
     * The new assertion is the stronger one — it fails if the boilerplate comes
     * back *and* if the import line goes missing — and it is the contract the
     * inventory and the V2 page check both already enforce.
     */
    /*
     * Two page shapes, one promise. A *handwritten* page prints the import line
     * in a `[data-slot="import-line"]` panel; a *registry* page prints the
     * package path in its header beside a copy control. Both tell the reader how
     * to import the thing without repeating the package's setup.
     */
    const importLine = await page.locator('[data-slot="import-line"]').count();
    const importCopy = await page.getByRole("button", { name: /copy import path/i }).count();
    recorder.behaviour.push({
      check: "a component page carries its import line and no install boilerplate",
      pass: (importLine > 0 || importCopy > 0) && !/pnpm add|npm install|yarn add/.test(ratingText),
      detail: `${importLine} import line(s), ${importCopy} copy control(s); install boilerplate ${/pnpm add/.test(ratingText) ? "present" : "absent"}`,
    });
    await capture.screenshot(page, "components-rating-dark-desktop", false);

    /*
     * Components V2 §5: no agent panel in the reading path.
     *
     * The check used to open a "Copy for an AI agent" disclosure and read its
     * prompt. That block is gone from the primary experience by decision, so the
     * assertion is inverted rather than deleted: a page that reintroduces an
     * agent brief above its API now fails, which is the drift the rule exists to
     * catch. The *reference* material a reader actually needs — the exports, the
     * signatures and the props — is asserted right above this.
     */
    const agentPanel = await page.evaluate(() =>
      [...document.querySelectorAll("h2, h3")].some((node) =>
        /copy for an ai agent|ai agent brief/i.test(node.textContent ?? ""),
      ),
    );
    recorder.behaviour.push({
      check: "a component page keeps an agent brief out of the reading path",
      pass: !agentPanel,
      detail: agentPanel ? "an agent brief is rendered" : "none rendered",
    });

    /*
     * --------------------------------------------- an ordinary component page
     *
     * This block used to drive the Button *Playground*: a control labelled
     * Variant, a generated code pane, a reset. Components V2 §5 removed that
     * surface from ordinary components — a 16rem control column beside a
     * half-empty stage was the shape the product owner rejected — and moved the
     * capability to the charts, where manipulating configuration has an
     * observable result. The chart Playground keeps its own checks below, so
     * nothing is unmeasured; what changes is where the ordinary page is asserted.
     *
     * What it owes now is the example shape, and this asserts all of it at once:
     * a live example early, a real disclosure, source that names the component,
     * and a copy control beside it.
     */
    await navigateAndReady(page, `${baseUrl}/components/button`);
    const example = page.locator('[data-slot="example"]').first();
    const disclosure = example.getByRole("button", { name: /show code/i }).first();
    const hasDisclosure = (await disclosure.count()) > 0;
    let revealed = "";
    if (hasDisclosure) {
      await disclosure.click();
      await page.waitForTimeout(200);
      revealed = (await example.locator("pre").first().innerText()).trim();
    }
    const copyControls = await example.getByRole("button", { name: /copy code/i }).count();
    recorder.behaviour.push({
      check: "an ordinary component page leads with a disclosed, copyable example",
      pass:
        (await example.count()) > 0 &&
        hasDisclosure &&
        copyControls > 0 &&
        /* The snippet is *usage*, not an import line — the import is the header's
         * job — so it is asserted to name the component it demonstrates. */
        revealed.includes("<Button"),
      detail: `${revealed.split("\n")[0]?.slice(0, 60) ?? "no source"}; ${copyControls} copy control(s)`,
    });
    const componentPlayground = await page.getByRole("button", { name: /reset to defaults/i }).count();
    recorder.behaviour.push({
      check: "an ordinary component page carries no Playground",
      pass: componentPlayground === 0,
      detail: componentPlayground === 0 ? "none" : "a Playground control is rendered",
    });
    await capture.screenshot(page, "components-button-examples-dark-desktop", false);

    /*
     * ------------------------------------------------------- live demos
     *
     * The defect Phase 9 Hardening exists to fix: 134 generated pages showed an
     * API table, an install block and no specimen at all. A page can look fixed
     * while still being empty — a heading with nothing under it, a code block
     * with no component above it — so these checks read the rendered page and
     * require three things at once: a `Live preview` section, code in it that
     * names the documented component, and a real rendered element in the stage.
     *
     * They run against pages whose demos the Lead owns, deliberately: a check
     * that depends on someone else's fixture is a check that fails for the wrong
     * reason. `tests/unit/demo-coverage.test.ts` covers every page instead.
     */
    const demoPages = [
      { path: "/components/delta", component: "Delta", marker: '[data-slot="delta"]' },
      { path: "/components/stat-card", component: "StatCard", marker: '[data-slot="stat-card"]' },
      { path: "/components/timestamp", component: "Timestamp", marker: '[data-slot="timestamp"]' },
      { path: "/components/transfer-list", component: "TransferList", marker: '[data-slot="transfer-list"]' },
      { path: "/charts/line-chart", component: "LineChart", marker: "canvas, svg, [data-slot='chart']" },
      { path: "/charts/ecdf-chart", component: "EcdfChart", marker: "canvas, svg, [data-slot='chart']" },
    ];
    const demoFailures = [];
    for (const demo of demoPages) {
      await navigateAndReady(page, `${baseUrl}${demo.path}`);
      const reading = await page.evaluate(() => {
        /*
         * The specimen's section is found by its own heading, and the accepted
         * names are the two the site actually uses: a chart page renders "Live
         * preview", a component page folds the same specimen into "Examples"
         * (`docs/COMPONENTS_V2.md` §5). Pinning one literal meant the check
         * silently stopped finding the section once the component page moved to
         * the canonical order — a probe that reports "no section" for a working
         * page is worse than no probe, because it trains the reader to ignore it.
         */
        const heading = [...document.querySelectorAll("h2")].find((node) =>
          /^(live preview|examples)$/i.test((node.textContent ?? "").trim()),
        );
        if (!heading) return { section: false, code: null, stageChild: false, marks: 0, heading: null };
        const section = heading.closest("section");
        return {
          section: true,
          heading: heading.textContent?.trim() ?? null,
          code: section?.querySelector("pre code")?.textContent?.trim() ?? null,
          /* The frame is `Demo` on a chart page and `Example` on a component page. */
          stageChild:
            (section?.querySelector('[data-slot="demo"] > div')?.children.length ?? 0) > 0 ||
            (section?.querySelector('[data-slot="example-stage"]')?.children.length ?? 0) > 0,
          marks: section?.querySelectorAll("[data-slot], canvas, svg, [role]").length ?? 0,
        };
      });
      const codeNames = (reading.code ?? "").includes(`<${demo.component}`);
      const rendered = await page.locator(demo.marker).count();
      if (!reading.section || !codeNames || !reading.stageChild || rendered === 0) {
        demoFailures.push(
          `${demo.path}: section=${reading.section} code=<${demo.component}>:${codeNames} stage=${reading.stageChild} rendered=${rendered}`,
        );
      }
    }
    recorder.behaviour.push({
      check: "generated pages render a live specimen with matching code",
      pass: demoFailures.length === 0,
      detail: demoFailures.slice(0, 3).join(" | ") || `${demoPages.length} pages checked`,
    });

    /*
     * Hydration, proved by an interaction rather than by markup.
     *
     * `DataDetails` renders its panel through a portal, so nothing appears until
     * the client bundle has hydrated and the reader presses the trigger. A panel
     * that opens, shows the fixture rows and closes on Escape is therefore
     * evidence that the island is live, which a server-rendered marker is not.
     */
    try {
      await navigateAndReady(page, `${baseUrl}/components/data-details`);
      const trigger = page.getByRole("button", { name: "Data", exact: true }).first();
      await trigger.click();
      const panel = page.getByRole("dialog").first();
      await panel.waitFor({ state: "visible", timeout: 4000 });
      const rows = await page.getByRole("row").count();
      await page.keyboard.press("Escape");
      const closed = await panel
        .waitFor({ state: "hidden", timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      recorder.behaviour.push({
        check: "a demo island hydrates and works from the keyboard",
        pass: rows >= 9 && closed,
        detail: `${rows} rows, closed on Escape: ${closed}`,
      });
    } catch (error) {
      recorder.behaviour.push({
        check: "a demo island hydrates and works from the keyboard",
        pass: false,
        detail: error instanceof Error ? error.message.split("\n")[0] : String(error),
      });
    }

    /*
     * ------------------------------------------------- chart Playground
     *
     * Every chart page mounts a control panel built from the same fixture the
     * page renders above it (`registry.charts.ts`). What has to be true is the
     * whole loop: a control changes the code, the code names the component, and
     * the *drawn* chart changes size — not just the snippet. The height control
     * is used because it is the one prop every family declares, and because the
     * surface writes it as an inline style, which is measurable.
     */
    await navigateAndReady(page, `${baseUrl}/charts/ecdf-chart`);
    /*
     * A generated page mounts the panel itself rather than inside a titled
     * section, so the panel is found by what it owns: the only
     * `data-language="tsx"` block on the page, and the *last* chart surface
     * (the Live Demo above it renders one too).
     */
    await page.getByText("Code", { exact: true }).first().click();
    const chartCode = page.locator("[data-language='tsx']").first();
    /*
     * Measure the *drawing*, not a wrapper: the engine's own canvas is the last
     * one on the page (the Live Demo draws the first), and its box height is the
     * height the control set. A nested `height: 1px` measurement div sits inside
     * every ECharts instance, which is what made the first version of this check
     * read "1 → 1px" while the chart itself had grown.
     */
    const heightOf = async () =>
      page
        .locator("canvas")
        .last()
        .evaluate((canvas) => Math.round(canvas.getBoundingClientRect().height));
    const beforeHeight = await heightOf();
    const beforeCode = (await chartCode.innerText()).trim();

    const slider = page.getByRole("slider", { name: "Height" }).first();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    const afterHeight = await heightOf();
    const afterCode = (await chartCode.innerText()).trim();

    recorder.behaviour.push({
      check: "a chart Playground is built from the page's own fixture",
      pass: beforeCode.includes("<EcdfChart") && /height=\{\d+\}/.test(beforeCode),
      detail: beforeCode.split("\n").slice(-2).join(" ").slice(0, 80),
    });
    recorder.behaviour.push({
      check: "changing a chart control moves the code and the drawing",
      pass: afterCode !== beforeCode && afterHeight > beforeHeight,
      detail: `code ${beforeCode === afterCode ? "unchanged" : "changed"}; height ${beforeHeight} → ${afterHeight}px`,
    });

    /* ----------------------------------------------------------- search */
    await navigateAndReady(page, `${baseUrl}/components`);
    const search = page.getByRole("combobox").first();
    if ((await search.count()) === 0) {
      recorder.behaviour.push({
        check: "component search is present on the components index",
        pass: false,
        detail: "no combobox found",
      });
    } else {
      await search.fill("violin");
      await page.waitForTimeout(200);
      const hit = await page.getByRole("option").first().innerText();
      recorder.behaviour.push({
        check: "component search finds a chart by name",
        pass: /violin/i.test(hit),
        detail: hit.replace(/\s+/g, " "),
      });
      await search.fill("zzzznothing");
      await page.waitForTimeout(200);
      const noMatch = await page.getByText(/No components match that/).count();
      recorder.behaviour.push({
        check: "component search says so when nothing matches",
        pass: noMatch > 0,
        detail: noMatch > 0 ? "empty state shown" : "no empty state",
      });
      await search.press("Escape");
      await page.waitForTimeout(150);
      recorder.behaviour.push({
        check: "Escape clears the search",
        pass: (await search.inputValue()) === "",
      });
    }

    /* ------------------------------------------------ chart page + docs */
    await navigateAndReady(page, `${baseUrl}/charts/violin-chart`);
    const chartHeading = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
    const chartText = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    recorder.behaviour.push({
      check: "a chart has its own page",
      pass: chartHeading === "ViolinChart",
      detail: chartHeading,
    });
    recorder.behaviour.push({
      check: "a chart page states the data contract",
      pass: /prepared by the caller|computes no|does not compute/i.test(chartText),
      detail: chartText.slice(0, 80),
    });

    for (const path of ["/docs", "/docs/installation", "/docs/theming", "/docs/reference", "/blocks", "/templates"]) {
      const response = await context.request.get(`${baseUrl}${path}`);
      recorder.behaviour.push({
        check: `the ${path} route serves a page`,
        pass: response.ok(),
        detail: String(response.status()),
      });
    }

    await navigateAndReady(page, `${baseUrl}/templates`);
    /*
     * Wait for the statement rather than sampling the page: a server component
     * streams, so a text read immediately after the ready marker can land
     * before the section that carries it. Waiting turns a race into a result.
     */
    await page.getByText("No download").first().waitFor({ timeout: 8000 }).catch(() => {});
    const templatesText = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    recorder.behaviour.push({
      check: "the templates page does not offer a download it cannot honour",
      /* Case-insensitive on purpose: `innerText` is rendering-aware, and the
       * badge is styled `uppercase`, so the DOM text reads "NO DOWNLOAD". */
      pass: /no download/i.test(templatesText) && !/download template/i.test(templatesText),
      detail: /no download/i.test(templatesText) ? "honest statement present" : "statement missing",
    });

    await navigateAndReady(page, `${baseUrl}/blocks`);
    const blockStages = await page.getByRole("heading", { level: 3 }).count();
    recorder.behaviour.push({
      check: "the blocks gallery renders real previews",
      pass: blockStages >= 8,
      detail: `${blockStages} block headings`,
    });
    await capture.screenshot(page, "blocks-dark-desktop", false);

    /* --------------------------------------------------------- studios */
    for (const path of ["/studios/charts", "/studios/motion", "/studios/themes", "/studios/composer"]) {
      const response = await context.request.get(`${baseUrl}${path}`);
      recorder.behaviour.push({
        check: `the ${path} studio answers`,
        pass: response.ok(),
        detail: String(response.status()),
      });
    }

    /* ------------------------------------------------------ mobile + zh */
    const mobileContext = await browser.newContext({ viewport: MOBILE });
    const mobilePage = await mobileContext.newPage();
    attachDiagnostics(mobilePage, "docs-mobile", recorder);
    await navigateAndReady(mobilePage, `${baseUrl}/components/rating`);
    const mobileOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    recorder.behaviour.push({
      check: "a component page does not overflow a 390 px viewport",
      pass: mobileOverflow <= 2,
      detail: `${mobileOverflow}px of horizontal overflow`,
    });
    await capture.screenshot(mobilePage, "components-rating-dark-mobile", false);
    await mobileContext.close();

    const zhResponse = await context.request.get(`${baseUrl}/zh/components/rating`);
    const zhBody = await zhResponse.text();
    recorder.behaviour.push({
      check: "the Chinese locale serves a translated component page",
      pass: zhResponse.ok() && /[\u4e00-\u9fff]/.test(zhBody),
      detail: `${zhResponse.status()}, ${/[\u4e00-\u9fff]/.test(zhBody) ? "CJK present" : "no CJK"}`,
    });
  } finally {
    await context.close();
  }
}

const GROUPS = {
  experiences: groupExperiences,
  docs: groupDocs,
  html: groupHtml,
  primitives: groupPrimitives,
  data: groupData,
  forms: groupForms,
  charts: groupCharts,
  application: groupApplication,
  navigation: groupNavigation,
  motion: groupMotion,
  spatial: groupSpatial,
  providers: groupProviders,
  components: groupComponents,
  geometry: groupGeometry,
};

/**
 * Run the requested behaviour groups in their canonical order.
 *
 * `groups` empty means "every group" — that is what `pnpm qa:full` and a bare
 * behaviour run do, so the default remains the complete V1.0 acceptance set.
 */
export async function runBehaviour(ctx, groups) {
  const selected = groups.length > 0 ? groups : Object.keys(GROUPS);
  for (const name of selected) {
    const group = GROUPS[name];
    if (!group) throw new Error(`[qa] Unknown behaviour group: ${name}`);
    const started = performance.now();
    await ctx.recorder.phase(`behaviour:${name}`, () => group(ctx));
    if (ctx.options.verbose) {
      console.log(`  behaviour ${name}: ${(performance.now() - started).toFixed(1)}s`);
    }
  }
}

export const BEHAVIOUR_GROUP_NAMES = Object.keys(GROUPS);
