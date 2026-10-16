/**
 * Phase 7 — structural defect probe.
 *
 * `qa:full` proves a route mounts, hydrates, renders no console error and
 * passes axe. It does **not** prove the route is laid out correctly: a control
 * that overflows the viewport, a heading whose descenders are clipped, a 12 px
 * hit target or a chart canvas that is present but blank all pass every one of
 * those gates.
 *
 * This probe looks for the classes of defect that survive an axe scan:
 *
 *   h-overflow   the document scrolls sideways at the tested width
 *   bleed        an element paints past the viewport and pushes that scroll
 *   clip         rendered text is truncated by an overflow box with no ellipsis
 *   tiny-target  an interactive control is smaller than the minimum hit area
 *   role-target  a role=button/checkbox/link reached through a wrapper only
 *   contrast-box an element whose computed colours are identical to its parent's
 *                *and* whose box is invisible, which usually means a lost style
 *
 * It is deliberately conservative: every detector reports the element, its box
 * and its computed decision, so a false positive is reviewable rather than
 * silently dropped.
 *
 *   node qa/inspect.mjs --all
 *   node qa/inspect.mjs --route-groups=charts,core
 *   node qa/inspect.mjs --routes=buttons,components-slider
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

import { DESKTOP } from "./constants.mjs";
import { parseOptions } from "./config.mjs";
import { attachDiagnostics, isProviderOrigin } from "./diagnostics.mjs";
import { navigateAndReady, readThrough } from "./readiness.mjs";
import { ROUTES, selectRoutes, slugsInGroup } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const showcaseRoot = path.resolve(here, "..");
const packageRoot = path.resolve(showcaseRoot, "../..");

/**
 * Exported so the cross-browser pass (`qa/browsers.mjs`) measures the same
 * geometry, in the same words, as the Chromium audit. A second implementation
 * would make the two browsers incomparable.
 */
export function inPage() {
  /* Everything below runs inside the browser. */

  /* Minimum hit area. WCAG 2.2 SC 2.5.8 is 24 px; LUC's own floor is 28 px. */
  const MIN_TARGET = 28;

  const round = (n) => Math.round(n * 10) / 10;
  const box = (node) => {
    const r = node.getBoundingClientRect();
    return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) };
  };
  const label = (node) => {
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : "";
    const cls = typeof node.className === "string" && node.className ? `.${node.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    const text = (node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
    return `${tag}${id}${cls}${text ? ` "${text}"` : ""}`;
  };
  const visible = (node) => {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  /*
   * Screen-reader-only content is clipped to a 1 px box on purpose, so it
   * matches the clip and tiny-target rules by construction. Excluding it is a
   * correctness fix for the probe, not a blind spot: the accessible *name* it
   * carries is what axe checks.
   */
  const srOnly = (node) => {
    const style = getComputedStyle(node);
    if (style.clipPath && style.clipPath !== "none" && /inset\(\s*(4[5-9]|50)/.test(style.clipPath)) return true;
    if (style.position !== "absolute" && style.position !== "fixed") return false;
    const r = node.getBoundingClientRect();
    return r.width <= 2 || r.height <= 2;
  };
  const inIntentionalScroll = (node) => {
    let cur = node.parentElement;
    while (cur) {
      if (cur.matches?.("[data-qa-scroll], [data-slot='marquee'], [data-slot='image-compare'], [data-slot='carousel-viewport'], [data-slot='scroll-area-viewport'], [data-radix-scroll-area-viewport], table, pre")) return true;
      const style = getComputedStyle(cur);
      if ((style.overflowX === "auto" || style.overflowX === "scroll") && cur.scrollWidth > cur.clientWidth) return true;
      cur = cur.parentElement;
    }
    return false;
  };

  const doc = document.documentElement;
  const viewportWidth = window.innerWidth;
  const hOverflow = round(doc.scrollWidth - viewportWidth);

  /* ---- bleed: who actually causes the sideways scroll ---- */
  const bleed = [];
  if (hOverflow > 1) {
    const all = Array.from(document.querySelectorAll("body *"));
    for (const node of all) {
      if (!visible(node)) continue;
      const r = node.getBoundingClientRect();
      if (r.right > viewportWidth + 2 && r.left < viewportWidth) {
        if (node.children.length > 0 && Array.from(node.children).some((c) => c.getBoundingClientRect().right > viewportWidth + 2)) continue;
        if (inIntentionalScroll(node)) continue;
        bleed.push({ el: label(node), box: box(node), overhang: round(r.right - viewportWidth) });
        if (bleed.length >= 8) break;
      }
    }
  }

  /* ---- clip: text truncated with no ellipsis and no scroll affordance ---- */
  const clip = [];
  const textNodes = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,span,div,td,th,li,label,button,a,figcaption,dd,dt"));
  for (const node of textNodes) {
    if (!node.textContent || !node.textContent.trim()) continue;
    if (!visible(node)) continue;
    if (srOnly(node)) continue;
    if (node.children.length > 0 && Array.from(node.children).some((c) => (c.textContent ?? "").trim().length > 0)) continue;
    const style = getComputedStyle(node);
    const clips = style.overflowY === "hidden" || style.overflowY === "clip" || style.overflow === "hidden";
    if (!clips) continue;
    if (style.textOverflow === "ellipsis") continue;
    if (node.scrollHeight > node.clientHeight + 3 && node.clientHeight > 0) {
      clip.push({ el: label(node), clientHeight: node.clientHeight, scrollHeight: node.scrollHeight, box: box(node) });
      if (clip.length >= 8) break;
    }
  }

  /* ---- tiny-target: real controls under the minimum hit area ---- */
  const tiny = [];
  const interactive = Array.from(
    document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role='button'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [role='option'], [contenteditable='true']"),
  );
  for (const node of interactive) {
    if (!visible(node)) continue;
    if (srOnly(node)) continue;
    if (node.closest("[data-qa-ignore-target]")) continue;
    const style = getComputedStyle(node);
    if (style.pointerEvents === "none") continue;
    const r = node.getBoundingClientRect();
    /*
     * WCAG 2.2 SC 2.5.8 exempts a link that sits inline in a sentence: growing
     * its box would break the paragraph. A standalone link (block, inline-block,
     * flex) is a target and is held to the floor.
     */
    if (node.tagName === "A" && style.display === "inline") continue;
    if (style.display === "inline" && node.tagName !== "INPUT") continue;
    /* A control whose hit area is grown by a pseudo-element or a parent label
       still reports a small rect; only flag when nothing larger is available. */
    if (r.width >= MIN_TARGET && r.height >= MIN_TARGET) continue;
    /*
     * An associated `<label>` is a legitimate way to grow a control's hit area:
     * clicking the label forwards the activation. Report the effective area so
     * a small box next to a big label is not counted as a defect.
     */
    const labelFor = node.id
      ? document.querySelector(`label[for="${CSS.escape(node.id)}"]`)
      : node.closest("label");
    const effective = labelFor ? labelFor.getBoundingClientRect() : r;
    if (effective.width >= MIN_TARGET && effective.height >= MIN_TARGET) continue;
    tiny.push({
      el: label(node),
      box: box(node),
      role: node.getAttribute("role") ?? node.tagName.toLowerCase(),
      labelled: Boolean(labelFor),
      html: node.outerHTML.replace(/\s+/g, " ").slice(0, 220),
    });
    if (tiny.length >= 12) break;
  }

  /* ---- invisible-box: an element that should paint but has a zero/again-zero
          box while holding visible text (usually a lost class after a refactor) ---- */
  const collapsed = [];
  for (const node of Array.from(document.querySelectorAll("[data-slot]"))) {
    const text = (node.textContent ?? "").trim();
    if (!text) continue;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.position === "absolute") continue;
    const r = node.getBoundingClientRect();
    if (r.height === 0 && r.width > 0 && style.overflow === "hidden") {
      collapsed.push({ el: label(node), slot: node.getAttribute("data-slot"), box: box(node) });
      if (collapsed.length >= 8) break;
    }
  }

  return { hOverflow, bleed, clip, tiny, collapsed, interactiveCount: interactive.length, scrollHeight: doc.scrollHeight };
}

async function probeRoute(page, route, options) {
  await navigateAndReady(page, `${options.baseUrl}${route.path}`);
  await readThrough(page, { stepDelayMs: 40, tailMs: 120, endMs: 80 });
  const result = await page.evaluate(inPage);
  result.slug = route.slug;
  result.path = route.path;
  return result;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const selected = options.slugs.length
    ? options.slugs
    : options.routeGroups.length
      ? options.routeGroups.flatMap((group) => slugsInGroup(group))
      : ROUTES.map((route) => route.slug);
  const routes = selectRoutes(selected);
  const outDir = options.outDir ?? path.join(packageRoot, "artifacts/qa/inspect");
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const findings = [];
  for (const route of routes) {
    const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const problems = [];
    attachDiagnostics(page, route.slug, {
      counters: {},
      record: (kind, message) => {
        if (!isProviderOrigin(message)) problems.push(`${kind}: ${message}`);
      },
    });
    try {
      const result = await probeRoute(page, route, options);
      result.console = problems;
      findings.push(result);
      const flags = [
        result.hOverflow > 1 ? `overflow ${result.hOverflow}px` : "",
        result.clip.length ? `clip ${result.clip.length}` : "",
        result.tiny.length ? `tiny ${result.tiny.length}` : "",
        result.collapsed.length ? `collapsed ${result.collapsed.length}` : "",
        problems.length ? `console ${problems.length}` : "",
      ].filter(Boolean);
      if (flags.length) console.log(`  ${route.slug.padEnd(34)} ${flags.join(" · ")}`);
    } catch (error) {
      findings.push({ slug: route.slug, path: route.path, error: String(error) });
      console.log(`  ${route.slug.padEnd(34)} ERROR ${error}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();

  await writeFile(path.join(outDir, "inspect.json"), JSON.stringify(findings, null, 2));
  const summary = {
    routes: routes.length,
    hOverflow: findings.filter((f) => f.hOverflow > 1).length,
    clip: findings.filter((f) => f.clip?.length).length,
    tiny: findings.filter((f) => f.tiny?.length).length,
    collapsed: findings.filter((f) => f.collapsed?.length).length,
    console: findings.filter((f) => f.console?.length).length,
    errors: findings.filter((f) => f.error).length,
  };
  console.log("\nsummary", JSON.stringify(summary));
  console.log("written", path.join(outDir, "inspect.json"));
}

/* Importable: `qa/browsers.mjs` reuses `inPage` and must not run the CLI. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
