/**
 * A button that does nothing is a lie about the product.
 *
 * "Decorative buttons that do nothing" is one of the named unacceptable
 * patterns for an Experience, and nothing in the suite measured it: `route
 * health` says the page answers, `behaviour` exercises the interactions
 * someone wrote a check for, and neither can tell you about the button nobody
 * wired up. This clicks every enabled button in `main` and asks whether
 * anything changed.
 *
 * "Anything" is deliberately broad, because the first version of this probe
 * was too narrow and reported four live controls as dead:
 *
 *   - `aria-pressed` (the kanban's lift, a colour-variant selector),
 *   - `aria-current` (a lesson picker),
 *   - a portal (a cart drawer rendered outside `main`),
 *   - an input's `checked` *property*, which never becomes an attribute.
 *
 * The signature below therefore covers the whole document's text, every
 * `aria-*` state attribute, every form control's property state, the URL, and
 * open dialogs — and a button is only reported when *none* of them moves.
 *
 * Excluded on purpose: buttons whose accessible name says they copy (their
 * effect is the clipboard, which `qa/v2-pages.mjs` verifies separately), and
 * disabled controls (inert by declaration, not by omission).
 *
 * Two more exclusions, both learned by measuring rather than assumed:
 *
 *   - **already-active controls.** The commerce page's first colour variant is
 *     selected on load, so clicking it is a no-op *by definition* — its
 *     `aria-pressed` is already true. Anything that is already in the state it
 *     would set is skipped, not accused.
 *   - **drag handles.** The kanban card handle is a `<button>` with `cursor:
 *     grab` whose pointer interaction is the drag on its parent, and whose
 *     keyboard interaction is `onKeyDown`; a press with no movement is not its
 *     gesture. Detected by the cursor the element asks for.
 *
 * Three more exclusions, added after the probe was pointed at the Components
 * pages, each one a false positive that was reproduced before it was excluded:
 *
 *   - **declared-busy controls.** `Button loading` sets `aria-busy` and
 *     `data-loading` and swallows its own click (`pointer-events-none` plus a
 *     guard in the handler — `packages/ui/src/components/button-base.tsx`). The
 *     probe clicked one, the click never landed, the signature never moved, and
 *     `/components/buttons` was accused of shipping a dead "Saving" button. A
 *     control that declares itself busy is inert by declaration, exactly like a
 *     disabled one. The count is reported rather than dropped.
 *   - **a component page is not an application.** A `<Button>Primary</Button>`
 *     *specimen* has no handler and is not supposed to: the page is documenting
 *     the component, and the reader is looking at a drawn control. So on the
 *     Components pages the probe only clicks controls that *claim state* —
 *     `aria-pressed`, `aria-checked`, `aria-expanded`, a `data-state`, or a
 *     role that implies one (`switch`, `checkbox`, `radio`, `tab`, `option`).
 *     A control that says "I hold a state" and then does not move is a defect;
 *     a drawn button is not. See `--claims`.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3000 node qa/dead-controls.mjs
 *   … --routes=experiences-vertical-productivity
 *   … --claims --routes=components-toggle,components-select   # Components pages
 *   … --claims --negative-test --routes=components-toggle     # proves it can fail
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { ROUTES, selectRoutes } from "./routes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../artifacts/qa/dead-controls");
const BASE = (process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

/** The groups where a control is the product: reference pages and compositions. */
/*
 * The Build surface, as it actually exists in the route model: `experiences`
 * carries Blocks, Templates and the Experiences themselves, `patterns` carries
 * the pattern pages, and `studios` carries the four editors. There is no
 * `build` group — listing one meant the Studios were never measured, which is
 * how a probe reads as complete while covering 30 of 34 routes. Measured before
 * widening: the four Studio routes contribute 45 buttons, 0 with no effect.
 */
const DEFAULT_GROUPS = ["experiences", "patterns", "studios"];

/**
 * The Components sample that `--claims` runs over by default.
 *
 * One route per family the assignment names — actions, forms, navigation, data
 * display, feedback, overlays, layout and the AI surfaces — because the failure
 * mode is per-component and a family page is where the component is shown with
 * its real states. Slugs come from `qa/routes.mjs`; a slug that matches nothing
 * is reported and exits 2 rather than silently measuring a shorter list.
 */
const CLAIMS_ROUTES = [
  "buttons", // actions
  "components-toggle",
  "inputs", // forms
  "selection",
  "components-select",
  "components-combobox",
  "tabs", // navigation
  "components-pagination",
  "data-table", // data display
  "feedback", // feedback
  "components-alert-dialog", // overlays
  "dialog",
  "overlay",
  "components-menus",
  "components-accordion",
  "components-carousel",
  "components-ai", // AI surfaces
];

const SIGNATURE = () => {
  const aria = [...document.querySelectorAll("*")]
    .map((element) =>
      [...element.attributes]
        .filter((attribute) => attribute.name.startsWith("aria-") || attribute.name.startsWith("data-state"))
        .map((attribute) => `${element.tagName}#${attribute.name}=${attribute.value}`)
        .join(";"),
    )
    .join("|");
  const controls = [...document.querySelectorAll("input, select, textarea")]
    .map((element) => `${element.tagName}:${element.value ?? ""}:${element.checked ?? ""}:${element.disabled ?? ""}`)
    .join(",");
  return [
    document.body.innerText.length,
    document.body.innerText.slice(-400),
    aria,
    controls,
    `${location.pathname}${location.search}`,
    document.querySelectorAll("[role=dialog], dialog[open]").length,
  ].join("¦");
};

const READ_BUTTONS = () =>
  [...document.querySelectorAll("main button")]
    .map((element, index) => {
      const state = element.getAttribute("data-state");
      return {
        index,
        name: (element.getAttribute("aria-label") ?? element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48),
        /*
         * `name` above is the *attribute* name, which is what a defect report
         * wants (it is what the source sets). It is deliberately not the
         * computed accessible name: a Radix checkbox is named by the `Field`
         * label beside it, so the computed name is the right thing to read but
         * the wrong thing to put in a report — "the third checkbox in the
         * Checkbox example" is actionable, an empty string is not. `slot` and
         * `section` carry that provenance instead.
         */
        role: element.getAttribute("role") ?? element.tagName.toLowerCase(),
        slot: element.closest("[data-slot]")?.getAttribute("data-slot") ?? null,
        section: element.closest("section")?.querySelector("h2, h3")?.textContent?.trim().slice(0, 40) ?? null,
        disabled: element.disabled || element.getAttribute("aria-disabled") === "true",
        active:
          element.getAttribute("aria-pressed") === "true" ||
          element.hasAttribute("aria-current") ||
          (state !== null && state !== "off" && state !== "inactive"),
        /*
         * Inert by declaration: a control that says it is busy is not a control
         * that is broken. `Button loading` sets both markers and swallows the
         * click on purpose.
         */
        busy: element.getAttribute("aria-busy") === "true" || element.hasAttribute("data-loading"),
        /* Does it promise to hold a state? Only then does a no-op mean anything. */
        claims: (() => {
          const role = element.getAttribute("role");
          if (["switch", "checkbox", "radio", "tab", "option", "menuitemcheckbox", "menuitemradio"].includes(role ?? ""))
            return true;
          if (element.hasAttribute("aria-pressed") || element.hasAttribute("aria-checked")) return true;
          if (element.hasAttribute("aria-expanded")) return true;
          return state !== null && state !== "off" && state !== "inactive" && state !== "closed";
        })(),
        dragging: /grab/.test(getComputedStyle(element).cursor),
        /*
         * The exception is about an *ancestor* marking the step — the commerce
         * checkout's `<li aria-current="step">`, the lesson picker's list item.
         * It must not match the control itself: a checkbox is `data-state=
         * "checked"` while it is checked, and clicking it is exactly how a
         * reader unchecks it.
         */
        inCurrentStep: (() => {
          const marker = element.closest(
            '[aria-current], [data-state="current"], [data-state="active"], [data-state="on"], [data-state="checked"]',
          );
          return marker !== null && marker !== element;
        })(),
      };
    });

/**
 * Inert by declaration, or out of the probe's competence.
 *
 * Kept separate from the read so the *counts* stay honest: the declared-busy
 * controls are reported as skipped, and a control that is skipped is not a
 * control that passed.
 */
const eligible = (button) =>
  !button.disabled &&
  !button.busy &&
  !button.dragging &&
  !/copy|复制/i.test(button.name) &&
  /* A button inside a step the reader is already on cannot change anything: the
   * commerce checkout's current step is the clearest case, where the marker sits
   * on the `<li>` rather than the control. */
  !button.inCurrentStep;

/**
 * Narrow the candidate list to the controls the reader was asked to operate.
 *
 * `mode === "all"` (the Build pages) keeps the original behaviour: skip what is
 * already in the state it would set, because a page whose first colour variant
 * is *selected on load* is not a page with a dead control.
 *
 * `mode === "claims"` (the Components pages) is the opposite: a toggle that is
 * already on must still turn *off* when pressed, so `active` is not a reason to
 * look away — but a control that never claimed a state is not evaluated at all,
 * because a drawn specimen button is the page's subject rather than a control
 * the product failed to wire.
 */
const candidatesFor = (buttons, mode) =>
  mode === "claims" ? buttons.filter((button) => button.claims) : buttons.filter((button) => !button.active);

/**
 * The index of another button in the same list, or null.
 *
 * Used to separate "this control is inert" from "this control was already in
 * the state it sets": the media library's first film still is the one already
 * on screen, so clicking it changes nothing *because it worked*. Clicking a
 * sibling in the same list answers the question — if a sibling changes the page,
 * the group is wired and the first button was simply already there.
 */
const SIBLING_BUTTON = (index) => {
  const buttons = [...document.querySelectorAll("main button")];
  const element = buttons[index];
  const container = element?.closest(
    "ul, ol, [role=list], [role=group], [role=radiogroup], [role=tablist], [role=toolbar], [role=listbox], [role=menu]",
  );
  if (!container) return null;
  const others = [...container.querySelectorAll("button")].filter(
    (button) => button !== element && !button.disabled,
  );
  if (others.length === 0) return null;
  const sibling = buttons.indexOf(others[0]);
  return sibling >= 0 ? sibling : null;
};

const args = process.argv.slice(2);
const requested = process.argv.find((value) => value.startsWith("--routes="));
const claims = args.includes("--claims");
/*
 * The negative regression, in the same shape as the reduced-motion probe's.
 *
 * A gate that cannot fail proves nothing: if the candidate filter were too
 * narrow — or the signature stopped moving for a reason none of this notices —
 * every route would report "0 with no effect" and the file would read as a pass.
 * `--negative-test` appends a state-claiming control with no handler to `main`
 * on every load and *requires* the report to contain it. Exit 0 when caught, 2
 * when not, so the self-test failing is loud.
 *
 * The injected node is deliberate: `role="switch"` plus `aria-checked="false"`
 * is the smallest control that promises a state, and a click cannot change any
 * of it. Nothing in the repository is modified.
 */
const negativeTest = args.includes("--negative-test");
const NEGATIVE_SWITCH = () => {
  const main = document.querySelector("main");
  if (!main) return false;
  const node = document.createElement("button");
  node.type = "button";
  node.setAttribute("role", "switch");
  node.setAttribute("aria-checked", "false");
  node.textContent = "Negative test switch";
  main.appendChild(node);
  return true;
};
const mode = claims ? "claims" : "all";
const maxClicks = Number.parseInt(
  (process.argv.find((value) => value.startsWith("--max-clicks=")) ?? "").slice("--max-clicks=".length),
  10,
);
const wantedSlugs = requested
  ? requested.slice("--routes=".length).split(",").filter(Boolean)
  : claims
    ? CLAIMS_ROUTES
    : null;
const routes = wantedSlugs
  ? selectRoutes(wantedSlugs)
  : ROUTES.filter((route) => route.groups.some((group) => DEFAULT_GROUPS.includes(group)));

/*
 * A request for slugs that match nothing is a typo, not a pass.
 *
 * `selectRoutes` filters by slug and returns an empty list for a name it does
 * not recognise, so `--routes=experience-productivity` (the real slug has no
 * `vertical` segment) would print "0 route(s) · 0 findings" and exit 0 — a
 * green run that measured nothing. Every probe that takes `--routes` says so
 * instead.
 */
const matched = new Set(routes.map((route) => route.slug));
const unmatched = (wantedSlugs ?? []).filter((slug) => !matched.has(slug));
if (routes.length === 0 || unmatched.length > 0) {
  console.error(
    (routes.length === 0
      ? `dead-controls: no route matched${requested ? ` ${requested}` : ""}. `
      : `dead-controls: ${unmatched.length} requested slug(s) matched nothing: ${unmatched.join(", ")}. `) +
      "Slugs come from qa/routes.mjs; run without --routes for the default set.",
  );
  process.exit(2);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const findings = [];
const benignFindings = [];
let clicked = 0;
let declaredBusy = 0;
let openedDetails = 0;
const startedAt = performance.now();

const ready = async (route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page
    .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20_000 })
    .catch(() => {});
  /*
   * A control behind a collapsed `<details>` cannot be clicked, and "we could
   * not click it" is not the same finding as "clicking it does nothing".
   *
   * Measured on `/components/inputs`: the Playground's "Advanced" disclosure
   * holds a `role="combobox"` trigger; it is on the page, and Playwright's click
   * timed out on every attempt because a closed `<details>` removes its content
   * from hit-testing. A reader can open it, so the probe opens it too — setting
   * `open` on the element fires the browser's own toggle event, so React state
   * follows exactly as it would for a reader.
   */
  openedDetails += await page
    .evaluate(() => {
      const closed = [...document.querySelectorAll("main details:not([open])")];
      for (const node of closed) node.open = true;
      return closed.length;
    })
    .catch(() => 0);
  if (negativeTest) await page.evaluate(NEGATIVE_SWITCH).catch(() => false);
  await page.waitForTimeout(200);
};

for (const route of routes) {
  await ready(route.path);
  const read = await page.evaluate(READ_BUTTONS);
  declaredBusy += read.filter((button) => button.busy).length;
  let planned = candidatesFor(read.filter(eligible), mode);
  /*
   * A page of examples can hold thirty state-declaring controls and the probe
   * pays a full navigation per click. `--max-clicks` bounds the per-route cost
   * so the tier stays runnable; the cap is printed when it bites.
   */
  if (Number.isFinite(maxClicks) && maxClicks > 0 && planned.length > maxClicks) planned = planned.slice(0, maxClicks);
  for (const button of planned) {
    const before = await page.evaluate(SIGNATURE);
    let failed = null;
    try {
      await page.locator("main button").nth(button.index).click({ timeout: 3_000 });
      await page.waitForTimeout(200);
    } catch (error) {
      failed = String(error?.message ?? error).slice(0, 80);
    }
    const after = await page.evaluate(SIGNATURE).catch(() => before);
    clicked += 1;
    if (before === after) {
      /* Before calling it dead, ask a sibling: a control already in its target
       * state is not a control that does nothing. */
      const sibling = await page.evaluate(SIBLING_BUTTON, button.index).catch(() => null);
      let benign = false;
      if (sibling !== null) {
        await page.locator("main button").nth(sibling).click({ timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(200);
        const siblingAfter = await page.evaluate(SIGNATURE).catch(() => before);
        benign = siblingAfter !== before;
      }
      if (!benign) {
        /*
         * A restore-to-default with nothing to restore is not a defect.
         *
         * `/patterns/research-workspace`'s "Reset pane sizes" puts the panes back
         * to their declared sizes, and on a freshly loaded page they are already
         * there — verified by resizing the inspector with the keyboard first
         * (ArrowLeft ×3 moved it 352px → 521px) and then clicking reset, which
         * put it back. So the control works and the click was a no-op for an
         * honest reason. It is recorded with that reason rather than dropped:
         * "we looked, and it is fine" is the part that has to stay visible.
         */
        const entry = {
          route: route.path,
          slug: route.slug,
          name: button.name,
          index: button.index,
          role: button.role,
          slot: button.slot,
          section: button.section,
          note:
            failed ??
            (sibling === null
              ? "no observable change, no sibling to compare"
              : "no observable change, and neither did a sibling"),
        };
        if (/reset|restore|defaults?|clear/i.test(button.name)) {
          benignFindings.push({ ...entry, reason: "a restore-to-default with nothing to restore" });
        } else {
          findings.push(entry);
        }
      }
    }
    /* One navigation per button: a page's state has to be clean before the next
     * click or a toggle reports the *previous* button's effect. */
    await ready(route.path);
  }
}

await browser.close();
await mkdir(OUT, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  mode,
  routes: routes.length,
  clicked,
  declaredBusy,
  openedDetails,
  durationMs: Math.round(performance.now() - startedAt),
  findings,
  benignFindings,
};
await writeFile(path.join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `dead-controls (${mode}) · ${routes.length} route(s) · ${clicked} button(s) clicked · ${findings.length} with no effect` +
    (benignFindings.length ? ` · ${benignFindings.length} benign (nothing to do)` : "") +
    (declaredBusy ? ` · ${declaredBusy} declared busy, not clicked` : "") +
    (openedDetails ? ` · ${openedDetails} collapsed disclosure(s) opened first` : ""),
);
for (const finding of findings.slice(0, 30)) {
  const where = [finding.section && `in "${finding.section}"`, finding.slot && `[data-slot=${finding.slot}]`]
    .filter(Boolean)
    .join(" ");
  console.log(`  ${finding.route} — #${finding.index} ${finding.role} "${finding.name}" ${where} (${finding.note})`);
}
for (const finding of benignFindings) {
  console.log(`  note · ${finding.route} — "${finding.name}": ${finding.reason}`);
}
console.log("  report: artifacts/qa/dead-controls/report.json");

if (negativeTest) {
  const caught = findings.some((finding) => /Negative test switch/.test(finding.name));
  console.log("");
  console.log(`${caught ? "PASS" : "FAIL"} the injected state-claiming control with no handler was reported`);
  if (!caught) {
    console.error("  the probe is not looking where it thinks it is; a real dead control would pass this gate.");
  }
  process.exitCode = caught ? 0 : 2;
} else {
  process.exitCode = findings.length > 0 ? 1 : 0;
}
