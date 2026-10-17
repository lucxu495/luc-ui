/**
 * `prefers-reduced-motion: reduce` — measured, not assumed.
 *
 * Accessibility guidance is easy to satisfy on paper and easy to break in
 * practice: a component that starts at `opacity: 0` and animates in renders as
 * *nothing* once the animation is suppressed, and a marquee whose infinite
 * transform is only "disabled" by a flag can still be running. Neither shows up
 * in axe, in route health, or in a screenshot of the default state.
 *
 * Four assertions per route, in the order a reader would notice them:
 *
 *   1. **It renders.** A heading with text exists under `reduce`: a page whose
 *      content arrives with an animation must show its final frame immediately.
 *   2. **Nothing moves.** Two checks, because they catch different things.
 *      First, any *running* animation whose keyframes touch `transform` /
 *      `translate` / `scale` / `rotate`. Second — and this is the one the CSS
 *      layer cannot give you — the geometry is sampled twice, half a second
 *      apart, and nothing may have moved: motion driven by `requestAnimationFrame`
 *      or the Web Animations API from JavaScript is *not* affected by the
 *      `animation-duration: 0.001ms !important` clamp in
 *      `packages/ui/src/styles/base.css`, so a spring or a rAF loop that ignores
 *      `prefers-reduced-motion` would otherwise sail straight through.
 *      Opacity, colour and outline pulses are allowed — the library replaces a
 *      spinner's rotation with a pulse on purpose
 *      (`packages/ui/src/components/spinner.tsx`), and a pulse is not motion
 *      sickness — which is why the sampling looks at position and transform
 *      rather than at every style property.
 *   3. **Nothing is hidden.** No heading, paragraph or figure caption carrying
 *      text resolves to `opacity: 0` or `visibility: hidden`. This is the
 *      failure mode that a screenshot of the animated state cannot show.
 *   4. **Reduce is actually less.** The same route is loaded a second time with
 *      motion allowed, and the reduced run may never have *more* running
 *      transform animations than the unrestricted one. Without this, a page that
 *      animates nothing anywhere would pass (1)–(3) and prove nothing at all.
 *
 * Measurement notes, so the rules are not guesses: on the sampled routes the
 * unrestricted run animates (marquee, kinetic type, tickers) and the reduced run
 * reports **zero** running transform animations, so the assertions below are the
 * shape of what the library already does. The two shapes that would have been
 * false positives were measured and excluded: `visibility: hidden` spans used to
 * *measure* text width (Tailwind's `invisible`, e.g. the number ticker's
 * duplicates), and decoration inside controls (a slider's own value glyphs) —
 * which is why (3) looks at semantic text blocks rather than every element.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/reduced-motion.mjs
 *   … --routes=motion-gallery,motion-kinetic,components-spinner
 *   … --negative-test --routes=motion-kinetic   # proves the probe can fail
 *   … --open-overlay                             # measure the overlay itself
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { ROUTES, selectRoutes } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const artifacts = path.resolve(here, "../artifacts/qa/reduced-motion");
const baseUrl = resolveBaseUrl();
const args = new Set(process.argv.slice(2));
const slugArg = (process.argv.find((arg) => arg.startsWith("--routes=")) ?? "").slice("--routes=".length);

/*
 * The negative regression, and the reason this probe is more than a claim.
 *
 * A gate that cannot fail proves nothing: if the scan looked at the wrong
 * elements, or `getAnimations()` returned an empty list under this browser
 * version, every route would report zero findings and the file would read as a
 * pass. `--negative-test` injects the two defects this probe exists to catch —
 * an infinite transform animation and copy held at `opacity: 0` — into the page
 * at runtime, and *requires* the probe to report them. It exits 0 when they are
 * caught and 2 when they are not, so the self-test failing is loud.
 *
 * Nothing in the repository is modified: the injection is a style tag in the
 * browser.
 */
const negativeTest = args.has("--negative-test");
/*
 * The movement is driven from JavaScript on purpose: it is the class of motion
 * the CSS clamp cannot suppress, so if the probe catches *this* it catches
 * everything the rule is about.
 */
const NEGATIVE_SCRIPT = () => {
  /*
   * Inject into the scope the probe actually reads.
   *
   * With `--open-overlay` the overlay is the surface under measurement, and a
   * modal correctly marks everything behind it `aria-hidden` — so the hidden-copy
   * rule skips the page *by design*, and the first version of this script looked
   * like it had not been caught when it had simply been injected into a region
   * nobody is allowed to read. Measure where the reader is looking.
   */
  const overlay = document.querySelector(
    '[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-radix-popper-content-wrapper]',
  );
  const scope = overlay ?? document.querySelector("main");
  if (!scope) return false;
  const target = scope.querySelector("h1, h2, h3") ?? scope.firstElementChild;
  if (!target) return false;
  const step = (time) => {
    target.style.transform = `translateX(${Math.sin(time / 120) * 9}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const paragraph = scope.querySelector("p") ?? (() => {
    const node = document.createElement("p");
    node.textContent = "Negative test copy that must stay visible";
    scope.appendChild(node);
    return node;
  })();
  paragraph.style.opacity = "0";
  return true;
};

/**
 * Components whose whole point is motion, so a change to them is a change to
 * this contract. The Motion area is the rest of the scope.
 */
const ANIMATED_COMPONENT_SLUGS = [
  "components-spinner",
  "components-skeleton",
  "components-progress",
  "components-toast",
  "components-dialog",
];

const requested = slugArg ? selectRoutes(slugArg.split(",")) : [];
if (slugArg && requested.length === 0) {
  console.error(`reduced-motion: no route matches "${slugArg}" — check the slug (a typo must not pass as green)`);
  process.exit(2);
}

/*
 * The overlay pass.
 *
 * Everything in this file so far measures the page *as it loads*, and an
 * overlay is exactly the surface that is not there yet: Radix mounts a dialog's
 * content when it opens and removes it when it closes, so a probe that never
 * presses the trigger has never seen the thing that animates most. The failure
 * this catches is specific and severe — a dialog whose entry keyframes start at
 * `opacity: 0` is a dialog that renders *invisible* once the reduced-motion
 * clamp suppresses the animation, and neither a closed-state screenshot nor
 * axe can see it.
 *
 * Opening the overlay also moves the hidden-copy and geometry walks outside
 * `main`, because that is where a portal puts its content.
 */
const openOverlay = args.has("--open-overlay");
const OVERLAY_ROUTES = [
  "dialog",
  "components-alert-dialog",
  "components-sheet",
  "components-popover",
  "components-menus",
  "components-command",
];
const OVERLAY_SELECTOR =
  '[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-radix-popper-content-wrapper]';
/*
 * A trigger, not any `aria-expanded` button: the example pages carry a "Show
 * code" disclosure on every card, and clicking that one opens a `<pre>`, not an
 * overlay. Radix marks the real ones (`aria-haspopup="dialog"` for Dialog and
 * Popover, `"menu"` for the menus, `"listbox"` for Select).
 */
const OVERLAY_TRIGGER = '[aria-haspopup]:not([aria-haspopup="false"])';

const routes =
  requested.length > 0
    ? requested
    : openOverlay
      ? selectRoutes(OVERLAY_ROUTES)
    : ROUTES.filter(
        (route) =>
          route.groups.includes("motion") ||
          ANIMATED_COMPONENT_SLUGS.includes(route.slug) ||
          /* The shell animates too: the mobile drawer and the modal surfaces. */
          route.slug === "components-overlay",
      );

const findings = [];
const report = [];

/** Everything the DOM will tell us about motion in the current state. */
const PROBE = () => {
  /**
   * The roots a reader is looking at: the page, plus any open overlay, which a
   * portal puts outside `main`.
   */
  const overlay = document.querySelector(
    '[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-radix-popper-content-wrapper]',
  );
  const scopes = [document.querySelector("main"), overlay].filter(Boolean);
  const describe = (element) => {
    if (!element) return "?";
    const name = element.getAttribute("data-slot") ?? element.getAttribute("aria-label") ?? element.className;
    return `${element.tagName.toLowerCase()}${name ? `.${String(name).split(/\s+/).slice(0, 2).join(".")}` : ""}`;
  };
  const animations = document.getAnimations().map((animation) => {
    const timing = animation.effect?.getTiming?.() ?? {};
    const keyframes = animation.effect?.getKeyframes?.() ?? [];
    return {
      name: String(animation.animationName ?? animation.id ?? "(script)"),
      state: animation.playState,
      duration: typeof timing.duration === "number" ? timing.duration : null,
      iterations: timing.iterations === Infinity ? "infinite" : (timing.iterations ?? null),
      target: describe(animation.effect?.target),
      moves: keyframes.some((frame) => Object.keys(frame).some((property) => /transform|translate|scale|rotate/i.test(property))),
    };
  });
  /*
   * Hidden text: semantic blocks only, and only ones a reader would otherwise
   * read. A `span` inside a control carries a control's own glyphs; a `p` or a
   * heading carrying four words is copy.
   */
  const hidden = [];
  for (const scope of scopes) {
    for (const element of scope.querySelectorAll("h1, h2, h3, p, figcaption, li, [role=menuitem], [role=option]")) {
      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length < 4) continue;
      if (element.closest("[aria-hidden='true'], [hidden], [data-state='closed'], template")) continue;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) continue;
      if (style.visibility === "hidden" || Number.parseFloat(style.opacity) === 0) {
        hidden.push(`${describe(element)} opacity=${style.opacity} visibility=${style.visibility} — "${text.slice(0, 48)}"`);
      }
    }
  }
  const heading = document.querySelector("main h1")?.textContent?.trim() ?? "";
  const overlayText = (overlay?.textContent ?? "").replace(/\s+/g, " ").trim();
  /*
   * A geometry fingerprint, for the movement check that no CSS clamp can pass
   * for you. Position and transform only: opacity pulses are explicitly allowed
   * under reduce, so including them would report the library's own documented
   * exception as a defect.
   */
  const positions = [];
  let index = 0;
  for (const scope of scopes) {
    for (const element of scope.querySelectorAll("*")) {
      index += 1;
      const box = element.getBoundingClientRect();
      if (box.width < 1 && box.height < 1) continue;
      positions.push(`${index}|${Math.round(box.x)},${Math.round(box.y)}|${getComputedStyle(element).transform}`);
    }
  }
  return { animations, hidden, heading, positions, overlayOpen: Boolean(overlay), overlayText };
};

async function loadOnce(page, route, reducedMotion) {
  await page.emulateMedia({ reducedMotion });
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(900);
  /* Let a lazily-armed region below the fold come alive before measuring. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  /*
   * Open the overlay before the settle loop, not after: the point is to measure
   * the surface a reader sees, and opening it later would measure the animation
   * instead of the state it lands in. The trigger is clicked the way a reader
   * clicks it, and the answer is recorded — a trigger that opens nothing is a
   * finding on a route a human listed as an overlay.
   */
  let overlayOpened = false;
  let overlayEntry = [];
  if (openOverlay) {
    const trigger = page.locator(`main ${OVERLAY_TRIGGER}`).first();
    if ((await trigger.count()) > 0) {
      await trigger.click({ timeout: 5_000 }).catch(() => {});
      /*
       * The entry animation, sampled *immediately* after the press.
       *
       * Waiting here and measuring later would report the state the overlay
       * lands in, which is already covered by the settle loop. This asks the
       * question the clamp in `base.css` is supposed to answer — does the
       * overlay animate in at all when motion is reduced — and it looks only at
       * animations whose target is inside the overlay, because the press also
       * starts the button's own ripple.
       */
      overlayEntry = await page
        .evaluate((selector) => {
          const root = document.querySelector(selector);
          if (!root) return [];
          return document
            .getAnimations()
            .filter((animation) => {
              if (animation.playState !== "running") return false;
              const target = animation.effect?.target;
              if (!target || !root.contains(target)) return false;
              const frames = animation.effect?.getKeyframes?.() ?? [];
              return frames.some((frame) => Object.keys(frame).some((property) => /transform|translate|scale|rotate/i.test(property)));
            })
            .map((animation) => String(animation.animationName ?? animation.id ?? "(script)"));
        }, OVERLAY_SELECTOR)
        .catch(() => []);
      await page.waitForTimeout(400);
      overlayOpened = await page.evaluate((selector) => Boolean(document.querySelector(selector)), OVERLAY_SELECTOR);
    }
  }
  /* After the overlay, so `NEGATIVE_SCRIPT` injects into the surface the probe
   * is about to read rather than into the page behind it. */
  if (negativeTest) await page.evaluate(NEGATIVE_SCRIPT);
  /*
   * Settle first, then judge.
   *
   * The first version compared two samples half a second apart and reported
   * `/motion/spatial` for three elements that had moved two pixels with
   * `transform: none` — a page still finishing its layout after a scripted
   * scroll, not motion. A probe that calls settling "movement" is a probe whose
   * findings get ignored, so the rule is now: wait until two consecutive samples
   * agree, and only then ask whether a *further* sample also agrees. A page that
   * never settles is the finding ("still moving after N seconds"), which is the
   * distinction that matters and is also what a reader with vestibular
   * sensitivity would see.
   */
  const changedIndices = (a, b) => {
    if (a.length !== b.length) return new Set(b.map((_, index) => index));
    const indices = new Set();
    for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) indices.add(index);
    return indices;
  };
  let previous = await page.evaluate(PROBE);
  let changed = new Set();
  let settled = false;
  let rounds = 0;
  for (; rounds < 10; rounds += 1) {
    await page.waitForTimeout(350);
    const next = await page.evaluate(PROBE);
    changed = changedIndices(previous.positions, next.positions);
    if (changed.size === 0) {
      /* One more sample, to be sure this is rest and not a momentary pause. */
      await page.waitForTimeout(350);
      const confirmed = await page.evaluate(PROBE);
      if (changedIndices(next.positions, confirmed.positions).size === 0) {
        settled = true;
        previous = confirmed;
        break;
      }
      previous = confirmed;
      changed = changedIndices(next.positions, confirmed.positions);
      continue;
    }
    previous = next;
  }
  /*
   * The elements that were moving, named. Taking the first few positions
   * instead was the bug that made the self-test report movement and then print
   * nothing: the list has to come from the indices that actually changed.
   */
  const moved = settled ? [] : [...changed].slice(0, 6).map((index) => previous.positions[index] ?? "?");
  return { ...previous, moved, settled, settleMs: rounds * 350, overlayOpened, overlayEntry };
}

await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  for (const route of routes) {
    const reduced = await loadOnce(page, route, "reduce").catch((error) => ({ error: String(error) }));
    const normal = await loadOnce(page, route, "no-preference").catch((error) => ({ error: String(error) }));
    if (reduced.error || normal.error) {
      findings.push(`${route.path}: could not be loaded (${reduced.error ?? normal.error})`);
      report.push({ slug: route.slug, path: route.path, error: reduced.error ?? normal.error });
      continue;
    }
    const movingReduced = reduced.animations.filter((entry) => entry.state === "running" && entry.moves);
    const movingNormal = normal.animations.filter((entry) => entry.state === "running" && entry.moves);
    if (reduced.heading.length === 0) findings.push(`${route.path}: no heading rendered under reduce`);
    /*
     * The overlay assertions. "It opened" and "it has text" are two different
     * failures: a trigger that opens nothing means the route was listed wrongly
     * or the overlay is broken, and an overlay that opens with no readable text
     * is the invisible-dialog failure this pass exists for — its copy is at
     * `opacity: 0` once the entry animation is suppressed.
     */
    if (openOverlay && !reduced.overlayOpened) {
      findings.push(`${route.path}: no overlay opened — no main button carries aria-haspopup, or the trigger is inert`);
    }
    if (openOverlay && reduced.overlayOpened && reduced.overlayText.length < 4) {
      findings.push(`${route.path}: the open overlay carries no readable text under reduce`);
    }
    for (const name of reduced.overlayEntry) {
      findings.push(`${route.path}: the overlay's entry animation still runs under reduce (${name})`);
    }
    for (const animation of movingReduced) {
      findings.push(
        `${route.path}: ${animation.name} still moves under reduce (${animation.target}, ${animation.duration}ms, ${animation.iterations})`,
      );
    }
    if (!reduced.settled) {
      findings.push(
        `${route.path}: motion continues under reduce — ${reduced.moved.length} element(s) still changing ` +
          `${(reduced.settleMs / 1000).toFixed(1)}s after load: ${reduced.moved.join(" · ") || "unidentified"}`,
      );
    }
    for (const entry of reduced.hidden) findings.push(`${route.path}: text hidden under reduce — ${entry}`);
    if (movingReduced.length > movingNormal.length) {
      findings.push(
        `${route.path}: reduce runs ${movingReduced.length} transform animation(s), the unrestricted page runs ${movingNormal.length}`,
      );
    }
    report.push({
      slug: route.slug,
      path: route.path,
      reduced: {
        moving: movingReduced.length,
        animations: reduced.animations.length,
        hidden: reduced.hidden.length,
        settled: reduced.settled,
        settleMs: reduced.settleMs,
        overlay: openOverlay ? { opened: reduced.overlayOpened, chars: reduced.overlayText.length } : undefined,
        entryAnimations: openOverlay ? { reduce: reduced.overlayEntry, normal: normal.overlayEntry } : undefined,
      },
      normal: { moving: movingNormal.length, animations: normal.animations.length, geometryChanges: normal.moved.length },
    });
  }
} finally {
  await browser.close();
}

await writeFile(path.join(artifacts, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const animated = report.filter((entry) => (entry.normal?.moving ?? 0) > 0).length;
console.log(`reduced-motion · ${report.length} route(s) · ${animated} animate when motion is allowed · ${findings.length} finding(s)`);
for (const finding of findings) console.log(`  ✗ ${finding}`);
console.log(`  report: artifacts/qa/reduced-motion/report.json`);
if (args.has("--json")) console.log(JSON.stringify(report, null, 2));

if (negativeTest) {
  const caughtMovement =
    findings.some((finding) => finding.includes("still moves under reduce")) ||
    findings.some((finding) => finding.includes("motion continues under reduce"));
  const caughtHidden = findings.some((finding) => finding.includes("text hidden under reduce"));
  console.log("");
  console.log(`${caughtMovement ? "PASS" : "FAIL"} the injected script-driven movement was caught`);
  console.log(`${caughtHidden ? "PASS" : "FAIL"} the injected hidden copy was caught`);
  process.exitCode = caughtMovement && caughtHidden ? 0 : 2;
} else {
  process.exitCode = findings.length > 0 ? 1 : 0;
}
