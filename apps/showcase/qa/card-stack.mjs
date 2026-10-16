/**
 * MOT-001 — Card Stack: reproduce the reported failure, or record a sound
 * negative. Read-only.
 *
 * `05_QUALITY_GATE.md` §5 makes this protocol mandatory for Card Stack because
 * the user reports it as broken while earlier checks could not reproduce that.
 * The output is an environment record plus intended-vs-observed for every
 * interaction the component claims, at two viewports, so the result is a
 * *finding* whether or not a defect appears.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3100 node qa/card-stack.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const SHOTS = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";
const ROUTES = ["/motion/card-stack", "/motion/spatial"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "narrow", width: 390, height: 844 },
];

const GEOMETRY = () => {
  const deck = document.querySelector('[data-slot="card-stack"]');
  if (!deck) return null;
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const style = getComputedStyle(deck);
  const controls = deck.querySelector('[data-slot="card-stack-controls"]');
  const status = deck.querySelector('[role="status"]');
  return {
    active: deck.getAttribute("data-active"),
    deck: box(deck),
    deckHeightCss: style.height,
    minHeight: style.minHeight,
    layers: [...deck.querySelectorAll('[data-slot="card-stack-layer"]')].map((layer) => ({
      position: layer.getAttribute("data-position"),
      ariaHidden: layer.getAttribute("aria-hidden"),
      inert: layer.hasAttribute("inert"),
      pointerEvents: getComputedStyle(layer).pointerEvents,
      opacity: getComputedStyle(layer).opacity,
      box: box(layer),
      /*
       * The *card*, not the positioning wrapper.
       *
       * The layer is `absolute inset-0` and always transparent — the surface
       * belongs to whatever the caller put inside it. Measuring the layer was how
       * the original "all three cards are transparent" defect stayed invisible:
       * every layer reported `rgba(0,0,0,0)` whether or not the card had a
       * background.
       */
      card: (() => {
        const item = layer.querySelector('[data-slot="card-stack-item"]');
        const card = item?.firstElementChild ?? item;
        if (!card) return null;
        const cardStyle = getComputedStyle(card);
        return {
          background: cardStyle.backgroundColor,
          transparent: /rgba?\([^)]*,\s*0(\.0+)?\)$/.test(cardStyle.backgroundColor.replace(/\s/g, "")) ||
            cardStyle.backgroundColor === "transparent",
          box: box(card),
        };
      })(),
      /* Every text-bearing leaf in this layer, in viewport coordinates. */
      text: [...layer.querySelectorAll("p, span, h1, h2, h3, dt, dd, li")]
        .filter((node) => (node.textContent ?? "").trim().length > 0 && node.children.length === 0)
        .map((node) => ({ text: (node.textContent ?? "").trim().slice(0, 24), box: box(node) })),
    })),
    controls: box(controls),
    buttons: controls
      ? [...controls.querySelectorAll("button")].map((b) => ({
          label: b.getAttribute("aria-label"),
          disabled: b.disabled,
        }))
      : [],
    status: status?.textContent?.trim() ?? null,
  };
};

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  browser: "chromium (playwright 1.63.0)",
  platform: `${process.platform} ${process.arch}`,
  reducedMotion: "no-preference",
  runs: [],
  findings: [],
};

const browser = await chromium.launch();
await mkdir(EVIDENCE, { recursive: true });
await mkdir(SHOTS, { recursive: true });

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 160)}`));

    const run = { route, viewport: viewport.name, observations: [], problems: [] };
    const record = (name, intended, observed) => {
      run.observations.push({ name, intended, observed });
      if (JSON.stringify(intended) !== JSON.stringify(observed)) run.problems.push(name);
    };

    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 20000 });
      const deck = page.locator('[data-slot="card-stack"]').first();
      if ((await deck.count()) === 0) {
        run.problems.push("no card-stack on the page");
        report.runs.push(run);
        await context.close();
        continue;
      }
      await deck.scrollIntoViewIfNeeded();
      const initial = await page.evaluate(GEOMETRY);
      run.initial = initial;
      await page.screenshot({ path: path.join(SHOTS, `card-stack__${route.split("/").pop()}__${viewport.name}.png`) });

      /* 1. The deck starts on the first card and says so. */
      const cards = initial?.layers?.length ?? 3;
      record(
        "initial index",
        { active: "0", status: `1 / ${cards}` },
        { active: initial?.active, status: initial?.status },
      );
      /* 2. The deck has a real box, and every control is the topmost element at
       *    its own centre — a card that paints over a control is the defect the
       *    user reported, and only a hit test answers it. */
      const hit = await page.evaluate(() => {
        const controls = document.querySelector('[data-slot="card-stack-controls"]');
        if (!controls) return null;
        return [...controls.querySelectorAll("button")].map((button) => {
          const r = button.getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { hit: top === button || button.contains(top), label: button.getAttribute("aria-label") };
        });
      });
      record("deck has a non-zero box", true, (initial?.deck?.h ?? 0) > 0);
      record("controls are the topmost element at their centre", true, hit !== null && hit.every((h) => h.hit));
      /* 3. Only the active layer is focusable. */
      const inactiveInert = (initial?.layers ?? []).filter((l) => l.position !== "0");
      record("hidden layers are inert", true, inactiveInert.every((l) => l.inert || l.ariaHidden === "true"));

      /* 4. Next / Previous step and clamp. */
      const before = initial?.active;
      /*
       * Scoped to the page's first deck.
       *
       * MOT-002 put two more CardStack configurations on `/motion/card-stack`, so
       * an unscoped locator now matches three "Next card" buttons and Playwright
       * refuses the click. The assertion is unchanged — the page's own specimen
       * still has to step and the hidden layers still have to stay inert — but it
       * has to name the deck it is talking about, because a page may show more
       * than one configuration of the same component.
       */
      await deck.locator('[data-slot="card-stack-controls"] button[aria-label="Next card"]').click();
      await page.waitForTimeout(600);
      const afterNext = await page.evaluate(GEOMETRY);
      record("Next steps the deck", "1", afterNext?.active);
      record("live region follows the card", `2 / ${afterNext?.layers?.length ?? cards}`, afterNext?.status);

      /* 5. Clicking the card body must not navigate. */
      const url = page.url();
      await page.locator('[data-position="0"] [data-slot="card-stack-item"]').first().click({
        position: { x: 30, y: 18 },
        force: true,
      });
      await page.waitForTimeout(400);
      record("card-body click does not navigate", { navigated: false }, { navigated: page.url() !== url });

      /* 6. Keyboard: arrows, Home, End. */
      await deck.focus();
      await page.keyboard.press("Home");
      await page.waitForTimeout(400);
      record("Home returns to the first card", "0", (await page.evaluate(GEOMETRY))?.active);
      await page.keyboard.press("End");
      await page.waitForTimeout(400);
      const end = await page.evaluate(GEOMETRY);
      record("End reaches the last card", "2", end?.active);
      record(
        "Next is disabled at the end",
        true,
        end?.buttons?.find((b) => b.label === "Next card")?.disabled,
      );
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(400);
      record("ArrowLeft steps back", "1", (await page.evaluate(GEOMETRY))?.active);

      /* 7. Pointer drag of >= 48 px steps; a short drag does not. */
      await page.keyboard.press("Home");
      await page.waitForTimeout(400);
      const box = await deck.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.72, box.y + 30);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.72 - 12, box.y + 30, { steps: 4 });
        await page.mouse.up();
        await page.waitForTimeout(400);
        record("a short drag does not step", "0", (await page.evaluate(GEOMETRY))?.active);

        await page.mouse.move(box.x + box.width * 0.72, box.y + 30);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.22, box.y + 30, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(600);
        record("a long drag left steps forward", "1", (await page.evaluate(GEOMETRY))?.active);
      }

      /* 8. Rapid repeated actions settle on a legal index. */
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press("ArrowRight");
      }
      await page.waitForTimeout(900);
      const settled = await page.evaluate(GEOMETRY);
      record("rapid key repeats settle on a legal card", true, ["0", "1", "2"].includes(settled?.active ?? ""));

      /* 9. Return navigation: leaving and coming back resets to the first card. */
      await page.goto(`${BASE}/motion`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 45000 });
      await page
        .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 15000 })
        .catch(() => {});
      const returned = await page.evaluate(GEOMETRY);
      record("return navigation lands on a legal card", true, ["0", "1", "2"].includes(returned?.active ?? ""));
      record("no console errors", [], errors);

      /*
       * 10. Visual geometry — the half that interaction tests never checked.
       *
       * The independent audit reproduced the user's complaint with three
       * transparent cards whose labels laddered down the deck, while every
       * interaction assertion above passed. These four records are what make that
       * failure impossible to ship again.
       */
      await page.keyboard.press("Home");
      await page.waitForTimeout(500);
      const geometry = await page.evaluate(GEOMETRY);
      const byPosition = new Map((geometry?.layers ?? []).map((layer) => [layer.position, layer]));
      const front = byPosition.get("0");
      const back = ["1", "2"].map((position) => byPosition.get(position)).filter(Boolean);

      record(
        "the active card has an opaque surface",
        true,
        front?.card ? front.card.transparent === false : null,
      );
      record(
        "each layer behind the active one is dimmer than the one in front of it",
        true,
        (() => {
          const opacities = ["0", "1", "2"].map((position) => Number(byPosition.get(position)?.opacity ?? NaN));
          return opacities.every((value) => Number.isFinite(value)) &&
            opacities[0] > opacities[1] && opacities[1] > opacities[2];
        })(),
      );
      record(
        "no back-card text pokes out below the active card",
        true,
        (() => {
          if (!front?.card?.box) return null;
          const frame = front.card.box;
          const leaking = [];
          for (const layer of back) {
            for (const entry of layer.text ?? []) {
              const textBox = entry.box;
              if (!textBox || textBox.h === 0) continue;
              const insideFront =
                textBox.y >= frame.y - 1 &&
                textBox.x >= frame.x - 1 &&
                textBox.y + textBox.h <= frame.y + frame.h + 1 &&
                textBox.x + textBox.w <= frame.x + frame.w + 1;
              if (!insideFront) leaking.push(`${entry.text}@${textBox.y}`);
            }
          }
          /* Either no text in a back layer, or all of it hidden behind the front
           * card. Anything else is the ladder. */
          return leaking.length === 0 ? true : leaking;
        })(),
      );
      record(
        "the controls sit within 56px of the deck",
        true,
        (() => {
          const deepest = back[back.length - 1]?.card?.box;
          if (!deepest || !geometry?.controls) return null;
          const gap = geometry.controls.y - (deepest.y + deepest.h);
          return gap >= -8 && gap <= 56 ? true : `gap ${Math.round(gap)}px`;
        })(),
      );

      /* 11. Reduced motion keeps the arrangement and drops the travel. */
      await page.evaluate(() => {
        document.documentElement.dataset.motion = "reduced";
      });
      await page.waitForTimeout(500);
      const reducedGeometry = await page.evaluate(GEOMETRY);
      const reducedOffsets = (reducedGeometry?.layers ?? []).map((layer) => layer.box?.y ?? 0);
      record(
        "reduced motion keeps the deck arrangement",
        true,
        new Set(reducedOffsets).size >= 2,
      );
    } catch (error) {
      run.problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
    }
    report.runs.push(run);
    await context.close();
  }
}

await browser.close();
report.reproduced = report.runs.some((run) => run.problems.length > 0);
await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "card-stack-probe.json");
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);

for (const run of report.runs) {
  process.stdout.write(
    `${run.problems.length === 0 ? "PASS" : "FAIL"} ${run.route} @${run.viewport}\n`,
  );
  for (const problem of run.problems) {
    const observation = run.observations.find((o) => o.name === problem);
    process.stdout.write(
      `     - ${problem}: expected ${JSON.stringify(observation?.intended)}, observed ${JSON.stringify(observation?.observed)}\n`,
    );
  }
}
process.stdout.write(`\nreport: ${outFile}\n`);
