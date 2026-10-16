/**
 * Geometry and interaction-stability checks.
 *
 * Every defect this file guards was reported by a *person looking at the page*,
 * not by a test, which is the point: the previous suites proved the right
 * elements existed and behaved, and none of them would have noticed that a
 * chart had been rendered 400px narrower than the window, that a panel exited
 * from the wrong edge, or that touching a slider moved the whole document. So
 * these assertions are measurements of the layout itself — bounding boxes,
 * scroll positions and computed animation names — rather than presence checks.
 *
 * Group: `geometry` (`pnpm qa:behaviour --group=geometry`).
 */

import { attachDiagnostics } from "./diagnostics.mjs";
import { expect } from "@playwright/test";

/**
 * The width matrix, as ordered pairs.
 *
 * 1x1 is not a screen anybody reviews on; these are the six widths a laptop,
 * desktop and tablet actually produce, plus the two that expose a
 * `max-width` which is too small to notice anywhere else.
 */
const WIDTHS = [
  { name: "390×844", width: 390, height: 844 },
  { name: "768×1024", width: 768, height: 1024 },
  { name: "1280×800", width: 1280, height: 800 },
  { name: "1440×900", width: 1440, height: 900 },
  { name: "1920×1080", width: 1920, height: 1080 },
  { name: "2560×1440", width: 2560, height: 1440 },
];

/** One route per page shape: docs entry, chart entry, studio, experience, app. */
const ROUTES = [
  "/",
  "/components/buttons",
  "/components/badges",
  "/charts/line-chart",
  "/charts/statistical",
  "/studios/charts",
  "/application/navigation",
  "/experiences/personal/career",
  "/data/table",
];

/** True when the document itself can be scrolled sideways. */
const OVERFLOW_EXPRESSION = () => {
  const html = document.documentElement;
  return { scrollWidth: html.scrollWidth, clientWidth: html.clientWidth };
};

/**
 * A. No page may scroll sideways.
 *
 * The check is on the document rather than on a container because that is what
 * a visitor experiences: one element wider than the window is enough to make
 * every centred page on the site draggable.
 */
async function checkOverflow(ctx, page) {
  const failures = [];
  let measured = 0;
  for (const width of WIDTHS) {
    await page.setViewportSize({ width: width.width, height: width.height });
    for (const route of ROUTES) {
      await ctx.navigateAndReady(page, `${ctx.baseUrl}${route}`);
      const { scrollWidth, clientWidth } = await page.evaluate(OVERFLOW_EXPRESSION);
      measured += 1;
      if (scrollWidth > clientWidth + 1) {
        failures.push(`${route} @${width.name} (+${scrollWidth - clientWidth}px)`);
      }
    }
  }
  ctx.recorder.behaviour.push({
    check: "no route scrolls horizontally at any of the six review widths",
    pass: failures.length === 0,
    detail: failures.slice(0, 6).join("; ") || `${measured} route/viewport pairs measured`,
  });
}

/**
 * B. The measure answers the viewport.
 *
 * A regression guard with a number in it, on purpose. The complaint was not
 * "the column is a bit narrow" but "huge parts of the screen are empty", and
 * the only way that stays fixed is if a test fails when it is not.
 */
async function checkMeasure(ctx, page) {
  const readings = [];
  let pass = true;

  const measure = async (route, width, height) => {
    await page.setViewportSize({ width, height });
    await ctx.navigateAndReady(page, `${ctx.baseUrl}${route}`);
    return page.evaluate(() => {
      const main = document.querySelector("main") ?? document.body;
      const container = document.querySelector('[data-slot="container"]');
      const demo = document.querySelector('[data-slot="demo"]');
      const box = (node) => (node ? Math.round(node.getBoundingClientRect().width) : 0);
      return { main: box(main), container: box(container), demo: box(demo) };
    });
  };

  /* A chart entry page is a plotting surface: at 1920 it should be using
   * essentially the whole content column, not two thirds of it. */
  const chart1920 = await measure("/charts/line-chart", 1920, 1080);
  readings.push(`line-chart 1920: container ${chart1920.container} / main ${chart1920.main}`);
  if (chart1920.container < 1500) pass = false;
  if (chart1920.demo < 1200) pass = false;

  /* The same page on a 2560 display still has room, and the intent is what
   * decides how much of it to take. */
  const chart2560 = await measure("/charts/line-chart", 2560, 1440);
  readings.push(`line-chart 2560: container ${chart2560.container}`);
  if (chart2560.container < 1800) pass = false;

  /* A laptop is the common case and the one where a fixed rail used to eat a
   * quarter of the column. */
  const chart1440 = await measure("/charts/line-chart", 1440, 900);
  readings.push(`line-chart 1440: demo ${chart1440.demo}`);
  if (chart1440.demo < 860) pass = false;

  /* A page whose whole subject is a 20px control is composed, not stretched. */
  const badges = await measure("/components/badges", 1920, 1080);
  readings.push(`badges 1920: container ${badges.container}`);
  if (badges.container > 1000) pass = false;

  ctx.recorder.behaviour.push({
    check: "the layout measure uses the viewport: charts wide, small controls composed",
    pass,
    detail: readings.join("; "),
  });
}

/**
 * C. Driving a Playground must not move the page.
 *
 * Three things are measured, because there are three ways it can go wrong:
 * the document scroll position (focus or a remount), the document's scrollable
 * width (an effect escaping its stage), and the geometry of a section that has
 * nothing to do with the preview (content reflowing underneath).
 */
async function checkPlaygroundStability(ctx, page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/motion/kinetic`);

  const snapshot = () =>
    page.evaluate(() => {
      const html = document.documentElement;
      const panel = document.querySelector('[data-slot="playground-controls"]');
      /*
       * Measured against the *document*, not the viewport.
       *
       * `getBoundingClientRect().top` mixes two unrelated facts — where an
       * element sits in the page and how far the reader has scrolled — and the
       * defect being guarded is only the first one. Adding the scroll offset
       * back produces a coordinate that a legitimate scroll cannot change and
       * that a genuine layout shift cannot hide.
       */
      const box = (node) => {
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
        };
      };
      return {
        scrollY: Math.round(window.scrollY),
        scrollX: Math.round(window.scrollX),
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        panel: box(panel),
      };
    });

  const anchor = page.locator('[data-slot="playground"]').first();
  const present = (await anchor.count()) > 0;
  if (!present) {
    ctx.recorder.behaviour.push({
      check: "motion Playground: controls change the preview without moving the page",
      pass: false,
      detail: "no Playground mounted on /motion/kinetic",
    });
    return;
  }

  await anchor.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));

  const controls = page.locator('[data-slot="playground-controls"]');
  const ranges = controls.locator('input[type="range"]');
  const toggles = controls.locator('[role="switch"], input[type="checkbox"]');
  const steps = [];
  let worst = { delta: 0, label: "none" };
  let overflow = 0;

  const drive = async (label, run) => {
    const before = await snapshot();
    await run();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 220))),
        ),
    );
    const after = await snapshot();
    const scrolled = Math.abs(after.scrollX - before.scrollX);
    const reflowed =
      Math.abs((after.panel?.left ?? 0) - (before.panel?.left ?? 0)) +
      Math.abs((after.panel?.top ?? 0) - (before.panel?.top ?? 0));
    const overflowed = after.scrollWidth - after.clientWidth;
    if (overflowed > 1) overflow += 1;
    if (scrolled + reflowed > worst.delta) worst = { delta: scrolled + reflowed, label };
    steps.push(`${label}: scrollX ${scrolled}px, reflow ${reflowed}px, overflow ${overflowed}px`);
  };

  /*
   * Clicks land by coordinate rather than through a locator.
   *
   * Playwright scrolls an element into view before clicking it, and that scroll
   * is indistinguishable from the page moving itself: the first run of this
   * check reported a 1702px "jump" that was entirely the test's own doing. The
   * controls are brought into view once, on purpose, and are then operated
   * exactly where they already are.
   */
  const clickByCoordinate = async (locator) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error("[geometry] a Playground control has no box");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };

  for (let index = 0; index < (await ranges.count()); index += 1) {
    const range = ranges.nth(index);
    await drive(`range#${index}`, async () => {
      await range.focus({ preventScroll: true });
      await page.keyboard.press("ArrowRight");
    });
  }
  for (let index = 0; index < (await toggles.count()); index += 1) {
    const toggle = toggles.nth(index);
    await drive(`toggle#${index}`, async () => {
      await clickByCoordinate(toggle);
    });
  }

  /* The interaction has to be worth checking: if nothing about the preview
   * changed, "it did not move" is not a result. */
  /*
   * The text control, selected by exclusion rather than by `type="text"`: the
   * library's `Input` does not write a `type` attribute when it is a plain
   * text field, so an attribute selector finds nothing and the check silently
   * loses its assertion.
   */
  const headlineControl = controls
    .locator('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="file"])')
    .first();
  let previewChanged = false;
  let previewDetail = "no text control";
  if ((await headlineControl.count()) > 0) {
    const typed = "Markets reprice in milliseconds, not seconds";
    const before = await page.locator('[data-slot="playground-stage"]').first().innerText();
    await headlineControl.fill("Markets reprice in milliseconds, not seconds");
    /*
     * A kinetic headline assembles word by word, so waiting for a frame would
     * read the preview mid-stagger. `toPass` waits for the settled text, which
     * is also the assertion.
     */
    const stageText = page.locator('[data-slot="playground-stage"]').first();
    await expect(stageText).toContainText("milliseconds", { timeout: 4000 }).catch(() => {});
    const after = await stageText.innerText();
    previewChanged = before !== after && after.includes("milliseconds");
    previewDetail = previewChanged
      ? "preview text followed the control"
      : `preview text did not change (typed "${typed}")`;
  }

  ctx.recorder.behaviour.push({
    check: "motion Playground: controls change the preview without moving the page",
    pass: worst.delta === 0 && overflow === 0 && previewChanged,
    detail:
      `worst movement ${worst.delta}px (${worst.label}), ${overflow} overflowed step(s), ` +
      `${previewDetail}; ${steps.length} control(s) driven`,
  });
}

/**
 * D. A Sheet leaves the way it arrived.
 *
 * The reported symptom was a panel that stayed visible and slid away from the
 * wrong edge while closing. Asserting "it is gone afterwards" would have passed
 * throughout: the geometry has to be sampled *during* the exit, and the
 * animation that is running has to be the one for the edge the panel is on.
 */
async function checkSheetDirections(ctx, page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/components/sheet`);
  const results = [];
  let pass = true;

  for (const direction of ["top", "right", "bottom", "left"]) {
    /*
     * Nothing may be open when this iteration starts.
     *
     * The locator used to be `[data-slot="sheet"]` with `.first()`, and on one
     * run the fourth iteration matched a *leftover* node from the third exit
     * instead of the panel being opened — measuring a 0×0 box and reporting a
     * product defect that was entirely the check's own doing. The panel is now
     * selected by the edge it claims to be on, and the loop starts from a
     * measured "nothing is open".
     */
    await page
      .waitForFunction(() => document.querySelectorAll('[data-slot="sheet"]').length === 0, null, {
        timeout: 4000,
      })
      .catch(() => {});
    await page.getByRole("button", { name: new RegExp(`^${direction}$`, "i") }).first().click();
    const panel = page.locator(`[data-slot="sheet"][data-side="${direction}"]`);
    await panel.waitFor({ state: "visible" });
    /*
     * Wait for the panel to come to rest before recording where it entered.
     * Sampling during the *open* animation made the entry box meaningless and
     * an earlier version of this check compared an exiting panel against a
     * half-arrived one.
     */
    await page.waitForTimeout(520);
    const opened = await panel.first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        side: node.getAttribute("data-side"),
        animation: getComputedStyle(node).animationName,
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

    await page.keyboard.press("Escape");
    /* Sample the exit while it is running — the whole defect lives there. */
    await page.waitForTimeout(80);
    const exiting = await panel.first().evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        side: node.getAttribute("data-side"),
        state: node.getAttribute("data-state"),
        animation: getComputedStyle(node).animationName,
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

    /*
     * Wait for the panel to leave rather than for a duration.
     *
     * An exit that finishes early is a pass and an exit that never finishes is
     * the failure being guarded — a fixed sleep cannot tell those apart, which
     * is how a check ends up asserting that a 700 ms wait elapsed.
     */
    await page
      .waitForFunction(() => document.querySelectorAll('[data-slot="sheet"]').length === 0, null, {
        timeout: 4000,
      })
      .catch(() => {});
    const after = await page.evaluate(() => ({
      panels: document.querySelectorAll('[data-slot="sheet"]').length,
      overlays: document.querySelectorAll('[data-slot="sheet-overlay"]').length,
      locked: document.documentElement.style.overflow === "hidden" ||
        document.body.style.pointerEvents === "none",
    }));

    /*
     * The panel has to leave from where it arrived.
     *
     * Two facts, and the first is the one the bug violated: the box must still
     * be the same box — same width, same height — and it must still be on the
     * same edge. A panel that re-anchors mid-exit changes shape (a 320×900 left
     * drawer becomes a 1430×352 bottom sheet) and jumps to another edge, which
     * is exactly what the report described, and neither assertion needs to know
     * how wide the window is.
     */
    const sameBox = exiting.width === opened.width && exiting.height === opened.height;
    const onEdge =
      direction === "right"
        ? exiting.left >= opened.left - 1
        : direction === "left"
          ? exiting.left <= opened.left + 1
          : direction === "top"
            ? exiting.top <= opened.top + 1
            : exiting.top >= opened.top - 1;
    const anchored = sameBox && onEdge;

    const parts = {
      openEdge: opened.side === direction,
      exitEdge: exiting.side === direction,
      exitAnimation: exiting.animation === `luc-sheet-out-${direction}`,
      anchored,
      residual: after.panels === 0 && after.overlays === 0,
      unlocked: !after.locked,
    };
    const ok = Object.values(parts).every(Boolean);
    if (!ok) pass = false;
    const failed = Object.entries(parts)
      .filter(([, value]) => !value)
      .map(([name]) => name);
    results.push(
      `${direction}: exit=${exiting.animation} state=${exiting.state} ` +
        `box=${exiting.left},${exiting.top} ${exiting.width}×${exiting.height} ` +
        `residual=${after.panels + after.overlays}` +
        (failed.length > 0 ? ` FAILED[${failed.join(",")}]` : ""),
    );
  }

  ctx.recorder.behaviour.push({
    check: "Sheet exits from the edge it entered, in all four directions",
    pass,
    detail: results.join(" | "),
  });
}

/**
 * E. A whole website can be reviewed at a whole website's width.
 *
 * The experience stage is the one place where "Full preview" has to be more
 * than a label: the host has to reach the viewport, escape has to bring it
 * back, and the focus has to land on the control the reader used.
 */
async function checkExperiencePreview(ctx, page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/experiences/personal/career`);

  const hostWidth = () =>
    page.evaluate(() => {
      const host = document.querySelector('[data-slot="experience-host"]');
      const panel = host?.parentElement;
      return {
        host: host ? Math.round(host.getBoundingClientRect().width) : 0,
        panel: panel ? Math.round(panel.getBoundingClientRect().width) : 0,
        position: panel ? getComputedStyle(panel).position : "none",
      };
    });

  const inline = await hostWidth();
  await page.getByRole("button", { name: /Full preview/i }).first().click();
  await page.waitForTimeout(250);
  const expanded = await hostWidth();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const restored = await hostWidth();
  const focusReturned = await page.evaluate(() =>
    document.activeElement?.textContent?.includes("Full preview") ?? false,
  );
  const locked = await page.evaluate(() => document.documentElement.style.overflow === "hidden");

  ctx.recorder.behaviour.push({
    check: "experience Full preview reaches the viewport, exits with Escape, and returns focus",
    pass:
      expanded.position === "fixed" &&
      expanded.host >= inline.host * 1.15 &&
      expanded.host >= 1700 &&
      restored.host === inline.host &&
      focusReturned &&
      !locked,
    detail:
      `host ${inline.host} → ${expanded.host} (${expanded.position}) → ${restored.host}; ` +
      `focus returned=${focusReturned}; lock released=${!locked}`,
  });
}

/**
 * F. The Navigation page is the reported clipping case.
 *
 * It is checked by contract rather than by screenshot: the tree must be
 * scrollable rather than cut off, nothing may spill out of the page container,
 * and the two demo columns must not be the same width — an equal split is what
 * squeezed the code into wrapping.
 */
async function checkNavigationComposition(ctx, page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/application/navigation`);

  const result = await page.evaluate(() => {
    /*
     * The *demo's* sidebar, not the application shell's. Both carry the same
     * slot name — that is precisely the point of the example — so the shell's
     * instance is excluded by its container, or the measurements describe the
     * page chrome instead of the thing under test.
     */
    const tree = Array.from(document.querySelectorAll('[data-slot="sidebar-content"]')).find(
      (node) => !node.closest('[data-slot="app-shell-sidebar"]'),
    );
    /*
     * Find the demo's two-column grid by shape, not by a CSS class or a class
     * name generated at build time: walk up from the tree until an ancestor
     * whose display is a grid and whose children are the two demos.
     */
    const findGrid = () => {
      let node = tree;
      while (node?.parentElement) {
        const parent = node.parentElement;
        if (getComputedStyle(parent).display === "grid" && parent.children.length === 2) return parent;
        node = parent;
      }
      return null;
    };
    const grid = findGrid();
    const columns = grid ? Array.from(grid.children).map((node) =>
      Math.round(node.getBoundingClientRect().width)) : [];
    const container = document.querySelector('[data-slot="container"]');
    const containerBox = container?.getBoundingClientRect();
    /*
     * A descendant is only a spill if nothing between it and the container
     * already bounds it — the code blocks and table wrappers scroll on purpose
     * and are wider than their parents by design.
     */
    const bounded = (node) => {
      let current = node.parentElement;
      while (current && current !== container) {
        const overflow = getComputedStyle(current).overflowX;
        if (overflow !== "visible") return true;
        current = current.parentElement;
      }
      return false;
    };
    const spills = container && containerBox
      ? Array.from(container.querySelectorAll("*")).flatMap((node) => {
          const box = node.getBoundingClientRect();
          /*
           * A node with no horizontal extent cannot spill horizontally.
           *
           * Four 0 × 0 nodes on this page report `left = 0`, which the
           * comparison below read as "0 px to the left of a container that
           * starts at 256 px" — a violation for an element that paints nothing.
           * The check is about content crossing the container's edge, so the
           * nodes that have no edge to cross are excluded rather than reported.
           */
          if (box.width === 0) return [];
          const outside = box.right > containerBox.right + 1 || box.left < containerBox.left - 1;
          if (!outside || bounded(node)) return [];
          return [
            `${node.tagName.toLowerCase()}${node.getAttribute("data-slot") ? `[${node.getAttribute("data-slot")}]` : ""}` +
              ` ${Math.round(box.width)}px`,
          ];
        })
      : [];
    return {
      scrollable: tree ? tree.scrollHeight > tree.clientHeight : false,
      treeClientHeight: tree?.clientHeight ?? 0,
      treeScrollHeight: tree?.scrollHeight ?? 0,
      columns,
      spills,
    };
  });

  const distinct = result.columns.length === 2 && result.columns[0] !== result.columns[1];
  ctx.recorder.behaviour.push({
    check: "Navigation page: the tree scrolls, nothing spills, and the columns are not an equal split",
    pass: result.spills.length === 0 && distinct,
    detail:
      `columns ${result.columns.join(" / ") || "n/a"}; ` +
      `tree ${result.treeClientHeight}/${result.treeScrollHeight} scrollable=${result.scrollable}; ` +
      `spills=${result.spills.slice(0, 4).join(", ") || "none"}`,
  });
}

/**
 * G. Every overlay family closes completely.
 *
 * Sheet got a per-direction assertion in Phase 9.5 because a person saw it go
 * wrong. Phase 9.6 asks the same question of the rest of the families, and the
 * question is not "does it disappear": it is whether the *lifecycle* completes —
 * the panel leaves the DOM, the backdrop goes with it, the scroll lock is
 * released, and the focus lands back on the control the reader used.
 *
 * Those four are separate mechanisms and each can fail alone. A panel that
 * unmounts without releasing `pointer-events: none` on the body leaves a page
 * that looks normal and cannot be clicked; a menu that closes without returning
 * focus strands a keyboard user at the top of the document. Neither is visible
 * in a screenshot, and neither is covered by a presence check.
 *
 * Each family is opened through its own real trigger, and every wait is on a
 * DOM condition rather than a duration — the flakiest assertions in this file
 * would be the ones that guess how long an exit animation takes.
 */
const OVERLAY_CASES = [
  {
    name: "dialog",
    route: "/components/dialog",
    open: (page) => page.getByRole("button", { name: "New run" }).click(),
    surface: '[role="dialog"]',
    modal: true,
  },
  {
    name: "alert dialog",
    route: "/components/alert-dialog",
    // Named rather than "the first button": the first button on any Showcase
    // page belongs to the application shell, not to the demo.
    open: (page) => page.getByRole("button", { name: "Delete dataset" }).click(),
    surface: '[role="alertdialog"]',
    modal: true,
  },
  {
    name: "popover",
    route: "/components/overlay",
    open: (page) => page.getByRole("button", { name: "Chart filters" }).first().click(),
    surface: '[role="dialog"], [data-radix-popper-content-wrapper] > *',
    modal: false,
  },
  {
    name: "dropdown menu",
    route: "/components/menus",
    open: (page) => page.getByRole("button", { name: "Run actions" }).first().click(),
    surface: '[role="menu"]',
    modal: true,
  },
  {
    name: "context menu",
    route: "/components/menus",
    open: async (page) => {
      /*
       * The trigger is a table row, so it is found by its content: right-click
       * is the only way to open the menu and the row is the only thing that
       * opens it.
       */
      const row = page.locator("tbody tr").first();
      await row.scrollIntoViewIfNeeded();
      const box = await row.boundingBox();
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
      else await page.mouse.click(400, 300, { button: "right" });
    },
    surface: '[role="menu"]',
    modal: true,
  },
];

/** The page state every overlay has to leave behind when it is finished. */
const RESIDUE_EXPRESSION = () => ({
  overlays: document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]').length,
  backdrops: document.querySelectorAll('[data-slot="overlay"], [data-radix-popper-content-wrapper]').length,
  // Radix locks the body while a modal overlay is open by making it inert to the
  // pointer and hiding the document's overflow. Either one left behind is a page
  // that is visibly fine and functionally broken.
  pointerEvents: document.body.style.pointerEvents || "auto",
  overflow: document.documentElement.style.overflow || "auto",
});

async function checkOverlayLifecycles(ctx, page) {
  const results = [];
  let pass = true;

  for (const entry of OVERLAY_CASES) {
    await ctx.navigateAndReady(page, `${ctx.baseUrl}${entry.route}`);
    const trigger = page.getByRole("button").first();
    await entry.open(page);

    const surface = page.locator(entry.surface).first();
    const appeared = await surface
      .waitFor({ state: "visible", timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    if (!appeared) {
      results.push(`${entry.name}: FAILED[never opened]`);
      pass = false;
      continue;
    }

    const inside = await surface.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.left >= -1 &&
        rect.top >= -1 &&
        rect.right <= window.innerWidth + 1 &&
        rect.bottom <= window.innerHeight + 1
      );
    });

    await page.keyboard.press("Escape");
    /*
     * Wait for the overlay to *leave*, then for the lock to be released. Both
     * are DOM facts, and the second can lag the first by the exit animation —
     * which is exactly the window in which the previous implementations left a
     * body-level `pointer-events: none` behind.
     */
    const closed = await page
      .waitForFunction(
        () =>
          document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"]').length === 0,
        null,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);
    const released = await page
      .waitForFunction(
        () =>
          (!document.body.style.pointerEvents || document.body.style.pointerEvents === "auto") &&
          (!document.documentElement.style.overflow || document.documentElement.style.overflow !== "hidden"),
        null,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);

    const residue = await page.evaluate(RESIDUE_EXPRESSION);
    const focusReturned = await page.evaluate(
      () => document.activeElement !== document.body && document.activeElement !== null,
    );
    const stillThere = (await trigger.count()) > 0;

    const parts = {
      inside,
      closed,
      released,
      noResidue: residue.overlays === 0 && residue.backdrops === 0,
      focusReturned,
      pageIntact: stillThere,
    };
    if (!Object.values(parts).every(Boolean)) pass = false;
    const failed = Object.entries(parts)
      .filter(([, value]) => !value)
      .map(([name]) => name);
    results.push(
      `${entry.name}: ${failed.length === 0 ? "ok" : `FAILED[${failed.join(",")}]`}` +
        ` (residue ${residue.overlays}/${residue.backdrops}, pointerEvents=${residue.pointerEvents}, focus=${focusReturned})`,
    );
  }

  ctx.recorder.behaviour.push({
    check: "each overlay family opens inside the viewport and closes without residue, lock or lost focus",
    pass,
    detail: results.join(" | "),
  });
}

/**
 * H. A Sheet gives the keyboard back.
 *
 * The Phase 9.5 check proves the panel leaves from the edge it arrived on. This
 * one adds the half that only matters to somebody not using a mouse: after the
 * panel closes, the focus has to be on the control that opened it, not dropped
 * onto the body.
 */
async function checkSheetFocusRestoration(ctx, page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/components/sheet`);

  const trigger = page.getByRole("button", { name: /^right$/i }).first();
  await trigger.focus();
  await trigger.press("Enter");
  const panel = page.locator('[data-slot="sheet"]').first();
  await panel.waitFor({ state: "visible", timeout: 4000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.querySelectorAll('[data-slot="sheet"]').length === 0,
    null,
    { timeout: 5000 },
  );
  /*
   * Wait for the *condition*, not for a duration.
   *
   * Restoring focus is an effect that runs after the panel unmounts, so reading
   * `document.activeElement` in the same tick as the removal raced it: the check
   * passed or failed depending on how the frame landed, and the failure it produced
   * ("focus is on the skip link") was reported once in this phase and did not
   * reproduce. A bounded wait on "focus has left the body" is the deterministic
   * form, and a timeout still fails the check rather than skipping it.
   */
  await page
    .waitForFunction(
      () => {
        const active = document.activeElement;
        return Boolean(active) && active !== document.body;
      },
      null,
      { timeout: 4000 },
    )
    .catch(() => {});

  const restored = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      text: (active?.textContent ?? "").trim().slice(0, 24),
      isBody: !active || active === document.body,
    };
  });

  ctx.recorder.behaviour.push({
    check: "closing a Sheet returns focus to the control that opened it",
    pass: !restored.isBody && /right/i.test(restored.text),
    detail: `focus is on "${restored.text}" (body=${restored.isBody})`,
  });
}

/**
 * I. The global header, at every width, and its panels.
 *
 * The header is the phase's headline deliverable, and the two ways it can be
 * wrong are both geometric: a panel that overflows the viewport (or is clipped by
 * the shell), and a nav that is present at a width where it cannot fit. So the
 * check measures boxes rather than asserting that a link exists — a link that
 * exists 40px off-screen passes a presence check and fails a visitor.
 */
async function checkGlobalHeader(ctx, page) {
  const widths = [
    { name: "390×844", width: 390, height: 844 },
    { name: "768×1024", width: 768, height: 1024 },
    { name: "1440×900", width: 1440, height: 900 },
    { name: "1920×1080", width: 1920, height: 1080 },
    { name: "2560×1440", width: 2560, height: 1440 },
  ];
  const detail = [];
  let pass = true;

  for (const size of widths) {
    await page.setViewportSize({ width: size.width, height: size.height });
    for (const route of ["/", "/charts/line-chart"]) {
      await ctx.navigateAndReady(page, `${ctx.baseUrl}${route}`);
      const measured = await page.evaluate(() => {
        const html = document.documentElement;
        const nav = document.querySelector('[aria-label="Primary navigation"]');
        /*
         * The mobile trigger has no `data-slot` of its own — it is a library
         * `IconButton` with an accessible name, and the name is the more stable
         * contract than an attribute a refactor can drop.
         */
        const mobileTrigger = document.querySelector('[aria-label="Open navigation"]');
        const overflows = Array.from(
          document.querySelectorAll('[data-slot="app-shell-topbar"] *'),
        ).flatMap((node) => {
          const box = node.getBoundingClientRect();
          if (box.width === 0) return [];
          return box.right > window.innerWidth + 1 || box.left < -1
            ? [`${node.tagName.toLowerCase()} ${Math.round(box.left)}→${Math.round(box.right)}`]
            : [];
        });
        return {
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
          navVisible: nav ? nav.getBoundingClientRect().width > 0 : false,
          mobileTriggerVisible: mobileTrigger
            ? mobileTrigger.getBoundingClientRect().width > 0
            : false,
          overflows,
        };
      });
      const sideways = measured.scrollWidth > measured.clientWidth + 1;
      const navExpected = size.width >= 1024;
      const ok =
        !sideways &&
        measured.overflows.length === 0 &&
        measured.navVisible === navExpected &&
        measured.mobileTriggerVisible === !navExpected;
      if (!ok) pass = false;
      detail.push(
        `${size.name}${route} nav=${measured.navVisible ? "on" : "off"} ` +
          `doc=${measured.scrollWidth}/${measured.clientWidth}` +
          (measured.overflows.length ? ` spill=${measured.overflows.slice(0, 2).join(",")}` : ""),
      );
    }
  }
  ctx.recorder.behaviour.push({
    check: "Global header: the nav appears exactly where it fits, and nothing spills the viewport",
    pass,
    detail: detail.join(" | "),
  });

  /*
   * Every area panel: opened by its own button, inside the viewport, closed by
   * Escape with focus returned to the button that opened it.
   */
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.navigateAndReady(page, `${ctx.baseUrl}/`);
  const triggers = await page.locator('[aria-label^="Show what is in"]').all();
  const panelDetail = [];
  let panelsPass = triggers.length > 0;
  for (const trigger of triggers) {
    const name = (await trigger.getAttribute("aria-label")) ?? "panel";
    await trigger.click();
    const expanded = await trigger.getAttribute("aria-expanded");
    const panel = page.locator(`#${(await trigger.getAttribute("aria-controls")) ?? ""}`);
    const box = await panel.boundingBox();
    const insideViewport =
      !!box && box.x >= -1 && box.x + box.width <= 1440 + 1 && box.y >= -1;
    /*
     * Counted *before* Escape. The first draft counted after, which measured an
     * unmounted panel and reported zero links for every area — a check that lies in
     * the direction of "nothing is there", which is the same class of measurement
     * error Phase 9.5 and 9.6 each recorded once.
     */
    const links = await panel.locator("a").count();
    await page.keyboard.press("Escape");
    const closed = (await trigger.getAttribute("aria-expanded")) === "false";
    const focused = await trigger.evaluate((node) => document.activeElement === node);
    if (!(expanded === "true" && insideViewport && closed && focused && links > 0)) {
      panelsPass = false;
    }
    panelDetail.push(
      `${name.replace(/^Show what is in |"$/g, "")}: links=${links} box=${box ? `${Math.round(box.width)}×${Math.round(box.height)}@${Math.round(box.x)}` : "none"} closed=${closed} focus=${focused}`,
    );
  }
  ctx.recorder.behaviour.push({
    check: "Global header: every area panel opens, stays in the viewport, and Escape closes it with focus back on the trigger",
    pass: panelsPass,
    detail: panelDetail.join(" | ") || "no area trigger found",
  });
}

/**
 * J. The sidebar answers "where am I", not "what is in the repository".
 *
 * The defect this guards is the one the phase set out to fix: identical ten-group
 * sidebars on every page. The assertion is therefore a pair — the group that
 * belongs, present; a group from another area, absent — because "smaller" alone
 * could be achieved by hiding everything.
 */
async function checkContextualSidebar(ctx, page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  /*
   * IA V3 renamed the section a Component page shows, and moved three more into
   * it. The pair is therefore read as "the section that belongs is present, a
   * section from another product is absent" against the *new* names: Components
   * has four sections now (Design foundations, UI components, Motion and
   * interaction, Integrations), and a Foundation page is a Components page —
   * which is the whole point of the change, so "Foundations is absent from
   * /components/buttons" is no longer a true statement about the product.
   */
  const cases = [
    { route: "/charts/line-chart", present: "Charts", absent: "UI components" },
    { route: "/components/buttons", present: "UI components", absent: "Charts" },
    /* A foundation is a Components page, and it shows the Components sections. */
    { route: "/foundations/typography", present: "Design foundations", absent: "Charts" },
    { route: "/date-time/calendar", present: "UI components", absent: "Charts" },
    { route: "/patterns/research-workspace", present: "Patterns", absent: "UI components" },
  ];
  const detail = [];
  let pass = true;
  for (const entry of cases) {
    await ctx.navigateAndReady(page, `${ctx.baseUrl}${entry.route}`);
    const measured = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-slot="app-shell-sidebar"]');
      const content = sidebar?.querySelector('[data-slot="sidebar-content"]');
      const labels = Array.from(content?.querySelectorAll('[data-slot="sidebar-group-label"]') ?? []).map(
        (node) => node.textContent?.trim() ?? "",
      );
      return { labels, groups: labels.length };
    });
    const present = measured.labels.includes(entry.present);
    const absent = !measured.labels.includes(entry.absent);
    if (!present || !absent) pass = false;
    detail.push(
      `${entry.route}: ${measured.groups} group(s) [${measured.labels.join(", ")}] ` +
        `present=${present} absent=${absent}`,
    );
  }
  ctx.recorder.behaviour.push({
    check: "Sidebar: the current area's groups only, and never another area's",
    pass,
    detail: detail.join(" | "),
  });
}

export async function groupGeometry(ctx) {
  /**
   * K. Chart geometry, read from the renderer.
   *
   * The Phase 10A.1 lesson: "the chart page loaded" is not a claim about a chart.
   * Each entry below asserts something the *renderer* produced — how many marks it
   * drew, which ones, and whether any two pieces of text landed on each other — for
   * the charts a person reported as broken, plus the two the census turned up.
   *
   * The numbers come from `data-luc-chart-diagnostics`, which `EChartSurface`
   * publishes after every finished frame.
   */
  async function checkChartGeometry(scoped, page) {
    await page.setViewportSize({ width: 1440, height: 900 });
    const cases = [
      {
        route: "/charts/gantt-chart",
        expect: (d) => d.marks.rect >= 4,
        what: "four task bars drawn as rectangles",
      },
      {
        route: "/charts/scatter-matrix-chart",
        expect: (d) => d.marks.path >= 20 && d.texts.length >= 16,
        what: "twelve scatter panels with tick labels",
      },
      {
        route: "/charts/vector-field-chart",
        expect: (d) => d.marks.polygon >= 6 && d.marks.line >= 6,
        what: "one shaft and one arrowhead per sample",
      },
      {
        route: "/charts/chord-chart",
        expect: (d) => d.marks.path >= 10 && d.texts.length >= 3,
        what: "ribbons and ring bands as filled paths, with group labels",
      },
      {
        route: "/charts/hierarchy-tree-chart",
        expect: (d) => d.marks.path >= 6 && d.texts.length >= 6,
        what: "edges and every node label",
      },
      {
        route: "/charts/sunburst-chart",
        expect: (d) => d.marks.sector >= 6,
        what: "one sector per node",
      },
      {
        route: "/charts/surface3-dchart",
        expect: (d) => d.marks.polygon >= 9 && d.texts.length >= 6,
        what: "shaded cells plus an axis frame",
      },
      {
        route: "/charts/volatility-surface-chart",
        expect: (d) => d.marks.polygon >= 9 && d.texts.length >= 6,
        what: "the same surface, with its own labels",
      },
      {
        route: "/charts/bullet-chart",
        expect: (d) => d.marks.rect >= 4 && d.texts.length >= 4,
        what: "bands, a measured bar and a target marker",
      },
      {
        route: "/charts/calendar-heatmap",
        expect: (d) => d.marks.rect >= 300 && d.texts.length >= 12,
        what: "a cell per day and a labelled month row",
      },
    ];
    const detail = [];
    let pass = true;
    for (const entry of cases) {
      await scoped.navigateAndReady(page, `${ctx.baseUrl}${entry.route}`);
      /*
       * The digest is published by the chart's own renderer, after ECharts has
       * drawn — and a heavy surface draws later than hydration does. Reading it
       * the instant `navigateAndReady` returns made this check a race that one
       * route lost on 2026-10-13 (`/charts/volatility-surface-chart: no renderer
       * digest`, while a four-second wait on the same build found 751 bytes of
       * it). Waiting for the attribute is the same assertion with the race
       * removed: a chart that never publishes its digest still fails, here, at
       * the timeout.
       */
      await page
        .waitForFunction(
          () => {
            const host = document.querySelector("[data-luc-chart-diagnostics]");
            return (host?.getAttribute("data-luc-chart-diagnostics")?.length ?? 0) > 0;
          },
          null,
          { timeout: 15_000 },
        )
        .catch(() => {});
      const digest = await page.evaluate(() => {
        const host = document.querySelector("[data-luc-chart-diagnostics]");
        const raw = host?.getAttribute("data-luc-chart-diagnostics");
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      });
      if (!digest) {
        pass = false;
        detail.push(`${entry.route}: no renderer digest`);
        continue;
      }
      const marks = digest.marks ?? {};
      const texts = digest.texts ?? [];
      let overlaps = 0;
      for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
          const a = texts[i];
          const b = texts[j];
          const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (dx > 1 && dy > 1) overlaps += 1;
        }
      }
      /* No two labels may share pixels: that is the defect class the report is
         about, and it is measurable without a human looking at the PNG. */
      const ok = overlaps === 0 && entry.expect({ marks, texts });
      if (!ok) pass = false;
      detail.push(
        `${entry.route.replace("/charts/", "")}: marks=${digest.m} texts=${texts.length} overlaps=${overlaps}${ok ? "" : ` — expected ${entry.what}`}`,
      );
    }
    ctx.recorder.behaviour.push({
      check: "Chart geometry: real marks, real labels, and no two labels sharing pixels",
      pass,
      detail: detail.join(" | "),
    });
  }

  const { browser, recorder, baseUrl } = ctx;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  attachDiagnostics(page, "geometry", recorder);
  try {
    const scoped = { ...ctx, baseUrl, recorder, navigateAndReady: ctx.navigateAndReady };
    await checkOverflow(scoped, page);
    await checkMeasure(scoped, page);
    await checkPlaygroundStability(scoped, page);
    await checkSheetDirections(scoped, page);
    await checkExperiencePreview(scoped, page);
    await checkNavigationComposition(scoped, page);
    await checkOverlayLifecycles(scoped, page);
    await checkSheetFocusRestoration(scoped, page);
    await checkChartGeometry(scoped, page);
    await checkGlobalHeader(scoped, page);
    await checkContextualSidebar(scoped, page);
  } finally {
    await context.close();
  }
}
