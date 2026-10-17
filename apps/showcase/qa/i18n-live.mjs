/**
 * Ask the running Showcase, in the browser, whether the Chinese pages are
 * actually Chinese.
 *
 * The static check (`scripts/i18n-coverage.mjs`) proves every sentence in the
 * source has a rendering in the dictionary. It cannot prove that the rendering
 * reaches the screen: a page can look up a key and then print the English
 * anyway, a chart registry can carry its own copy, and a fixture can be prose
 * that nobody extracted. This script closes that gap the only way it can be
 * closed — by loading `/zh<route>` and reading what a visitor is shown.
 *
 * For each route it collects the text nodes of prose elements (`p`, headings,
 * `li`, `figcaption`, `caption`, table cells), drops anything inside code
 * (`pre`, `code`, `.font-mono`, the code block of a demo), and reports the
 * segments that are still English-looking. A segment is English-looking when it
 * has five or more words and its letters are overwhelmingly ASCII — the shape
 * of a sentence, not of an identifier or a number.
 *
 * The same walk makes a second pass over **chrome labels**: headings, example
 * and demo titles, and the shell's own buttons and links. The sentence rule
 * cannot see them — `/zh/blocks` showed "Marketing" and "Product", one word
 * each — so the label rule lives in `i18n-chrome.mjs` and the residue a human
 * has reviewed is pinned in `i18n-chrome.json`. Pass `--update` to re-pin after
 * a review.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/i18n-live.mjs
 *   … node qa/i18n-live.mjs --routes=charts-catalog,components-buttons
 *   … node qa/i18n-live.mjs --json > artifacts/i18n-live.json
 *
 * Exit code 1 when a route leaks more English than it is allowed to.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { ROUTES, selectRoutes } from "./routes.mjs";
import {
  CHROME_SELECTORS,
  CHROME_SKIP,
  candidates,
  chromeProblems,
  knownIdentifiers,
  mergeBaseline,
  splitSpecimenLabels,
} from "./i18n-chrome.mjs";
import { isRegisteredIdList } from "./id-lists.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const artifacts = path.resolve(here, "../artifacts/i18n-live");
const baseUrl = resolveBaseUrl();
const chromeBaselinePath = path.resolve(here, "i18n-chrome.json");

const args = new Set(process.argv.slice(2));
const slugArg = (process.argv.find((arg) => arg.startsWith("--routes=")) ?? "").slice("--routes=".length);
const limit = Number.parseInt((process.argv.find((arg) => arg.startsWith("--limit=")) ?? "").slice("--limit=".length), 10);

/**
 * English prose that a Chinese reader may legitimately see.
 *
 * Every entry is an identifier, a product name or a unit — the vocabulary the
 * library does not translate by policy. A sentence does not belong here; if one
 * turns up, either the dictionary or this list is wrong.
 */
const ALLOWED = [
  "LUC UI",
  "ECharts",
  "TradingView",
  "Lightweight Charts",
  "React",
  "TypeScript",
  "Web Component",
  "Lightweight Charts · candlestick, volume pane",
  /*
   * Library-level English defaults, listed here rather than translated because
   * the library owns them and a consumer overrides them by prop:
   *   - chart `ariaDescription` fallbacks ("A dashed line marks …")
   *   - the chart shells' internal empty/error copy, which the Showcase
   *     replaces with its own translated state in `ChartPanel`
   *   - a demonstration's component-name list and a pipeline stage list, where
   *     every token is an identifier rather than prose.
   */
  "A dashed line marks the no-skill prevalence.",
  "Arc length is the row plus column total for each group",
  "Branch height is the join height supplied by the caller's clustering.",
  "Latitude against Longitude; paths crossing the antimeridian are unwrapped",
  "Each cell is an implied volatility the caller computed",
  "raw → analytics → validation → summary",
  "：PressRipple · AuroraSurface · BeamFlow · MagnifyDock · Marquee",
  "Theme / symbol / link",
  "theme · true · symbol-url",
  "Wide review period, September to October 2026",
  "把 Evaluation 与 Robustness 的 JSON 写入 luc-data/research。",
  /*
   * A specimen's own sample values.
   *
   * The extractor draws this line explicitly — "a one-word fixture label inside a
   * live sample is not translatable" — and the runtime probe cannot see it,
   * because it walks every text node and a specimen's value is a text node like
   * any other. So the judgement is recorded here, once, with the reason: these are
   * the *contents* a reader is meant to look at (a textarea's text, a chat
   * message, a motion demo's headline, a typography specimen's paragraph), and a
   * translated specimen stops being the specimen. Every one was checked against
   * its source before being listed, and each is a value, not a label: the label
   * beside it — the field's name, the panel's title, the example's heading — is
   * translated like all the rest.
   */
  "Rebalance moved into the close.",
  "Prose width holds a line between 60 and 75 characters.",
  "Three positions were rebalanced this morning.",
  "Half the risk, the same breadth.",
  "Step one: choose a universe.",
  "Step two: choose a schedule.",
  "Read the data, not the volume",
  "Six prepared research runs with performance and metadata columns.",
  "I study how markets absorb information, and I build the tools I need to do it.",
  /*
   * `/components/tree-view`'s deepest node, deliberately long enough to show the
   * row truncating instead of pushing its metadata out. It is a *node label* —
   * the sample hierarchy the reader walks — so the English is the specimen, and
   * the same fixture supplies `Markets`, `Equities` and `Crypto` beside it.
   */
  "Momentum and trend following across global futures",
  /*
   * `/components/stepper`'s long-label fixture, for the same reason: the example
   * exists to show a label wrapping and the strip keeping its `1fr` rhythm, so
   * the labels have to be long, and they are the step names a reader looks at
   * rather than interface copy.
   */
  "Cost and slippage assumptions",
  "Per venue, in basis points",
  "Risk limits and drawdown guardrails",
  "Universe and instrument scope",
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const routes = slugArg ? selectRoutes(slugArg.split(",")) : ROUTES;
const report = [];
const chromeByRoute = {};
/* Label → element and fixture marks, so a reviewer can see what kind of label
 * each finding is without opening the page. Evidence, not a second gate. */
const chromeContext = {};
/* Chrome-shaped labels inside a declared picture: counted and printed on every
 * run, deliberately not gated. They are content, and a count that nobody can see
 * is how an exclusion stops being a decision. */
const specimenByRoute = {};
const identifiers = await knownIdentifiers();
/*
 * Registered ids that are a *list of identifiers* rather than prose.
 *
 * Empty since Phase 2: it was fed by `scripts/visuals-package-strings.mjs`, and
 * that package — with the `/visuals/**` routes it renders on — now lives in the
 * LUC Visuals repository. The mechanism stays because a page that prints a
 * column of `visual.*` ids will need it again.
 */
const registryIds = [];
/* Segments that are a list of registered ids rather than prose. Counted and
 * printed on every run; never silently dropped. */
const idLists = [];
/*
 * Segments that are English because the page's own code block prints them.
 *
 * The specimen boundary, measured instead of allow-listed: a leak is only
 * snippet-locked when the string appears verbatim in a `<pre>`/`<code>` block on
 * the same page, which is a property a reviewer can check by looking at the
 * page. Counted, sampled and printed like the id-list class, and never gated.
 */
const snippetLockedSegments = [];
/* Where each leaked sentence sits: element, nearest marked ancestor. Evidence
 * for the fix, written next to the report so the next reader does not have to
 * re-derive it in a browser. */
const proseContext = {};
let failures = 0;

await mkdir(artifacts, { recursive: true });

for (const route of routes.slice(0, limit > 0 ? limit : undefined)) {
  const target = `${baseUrl}/zh${route.path === "/" ? "" : route.path}`;
  try {
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(350);
    // Charts and long pages arm lazily; a scroll forces every region to render.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      window.scrollTo(0, 0);
    });
    const { segments, suppressed, codeText } = await page.evaluate(() => {
      /*
       * `script` is not decoration: Next embeds the RSC flight payload in the
       * body, so the English source of a *translated* string is present in the
       * document even when the reader sees Chinese. Walking it would report a
       * leak for every sentence on the page.
       *
       * The second selector is the specimen boundary, and this pass needed a
       * second look because of it. A Visuals plate is declared `role="img"` with
       * an authored `aria-label` — it *is* a picture: a composed 1080×1350
       * drawing whose text is content the library ships, in the language it was
       * authored in. That is the same category as a `<pre>` snippet, which this
       * pass has always skipped. Reading the interior as UI prose produced 294
       * "leaks" on `/visuals/artifacts`, every one of them a plate behaving
       * exactly as designed — which is how a gate stops being read.
       *
       * `aria-hidden="true"` is decoration by declaration, and `svg` is a chart
       * or an icon whose `<text>` is the drawing's own labels: data, not chrome.
       *
       * None of this is a silent exclusion. Every node a rule skips is counted
       * and sampled into `suppressed`, printed per route below, so a page that
       * hides its chrome inside a picture shows up in the output rather than
       * passing quietly.
       */
      const SKIP = "pre, code, kbd, samp, .font-mono, script, style, template, noscript, [data-skip-i18n]";
      /*
       * Three rules, counted separately, because "suppressed" on its own is the
       * kind of number that hides a mistake. `role=img` is a picture the page
       * has declared; `aria-hidden` is decoration by declaration; `svg` is a
       * drawing's own text.
       */
      const PICTURE_RULES = [
        ["role=img", "[role='img']"],
        ["aria-hidden", "[aria-hidden='true']"],
        ["svg", "svg"],
      ];
      const PICTURE = PICTURE_RULES.map(([, selector]) => selector).join(", ");
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      /*
       * Where a leaked segment sits, recorded beside it. "292 segments" is a
       * number; "292 segments, every one of them inside `figure[data-slot]`" is a
       * handoff. The first version of this probe reported only the text, and the
       * next reader had to write a second browser probe to find out which
       * container to change — which is the cost this line removes.
       */
      const locate = (element) => {
        const parts = [];
        let node = element;
        let depth = 0;
        while (node && node instanceof HTMLElement && depth < 5) {
          const classNames = typeof node.className === "string" ? node.className.split(/\s+/).slice(0, 2).join(".") : "";
          const marked = [...node.attributes]
            .filter((attribute) => attribute.name.startsWith("data-") || attribute.name === "role")
            .slice(0, 2)
            .map((attribute) => `${attribute.name}=${attribute.value.slice(0, 40)}`);
          const tag = `${node.tagName.toLowerCase()}${classNames ? `.${classNames}` : ""}`;
          parts.push([tag, ...marked].join(" "));
          node = node.parentElement;
          depth += 1;
        }
        return parts;
      };
      const out = [];
      /*
       * Every code block on the page, joined, so a finding can be tested against
       * it.
       *
       * This is the measured half of the fixture boundary
       * `lib/i18n/messages.ts` states: "specimen fixture text that a printed
       * snippet also contains stays as written", because a preview reading
       * 本季度已填满 beside a snippet reading `title="Fills this quarter"` has broken
       * the one promise a live specimen makes. A leaked segment that appears
       * verbatim in one of these blocks is *snippet-locked*: English by
       * construction, not by neglect, and reported as its own counted class
       * rather than allow-listed by hand.
       */
      const codeText = [...document.querySelectorAll("pre, code")]
        .map((element) => element.textContent ?? "")
        .join("\n");
      const suppressed = { nodes: 0, regions: new Set(), rules: {}, examples: [] };
      let node = walker.nextNode();
      while (node) {
        const element = node.parentElement;
        if (element && element.offsetParent !== null) {
          const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
          /*
           * Three exclusive outcomes, in order: not a text node a reader reads
           * (code, the flight payload), a picture or decoration, or prose to
           * judge. They must stay exclusive — an earlier version let text inside
           * `pre` fall through to the prose rule, and the gate reported 95 routes
           * leaking instead of 10, all of it code samples.
           */
          const insideSkip = element.closest(SKIP) !== null;
          const rule = insideSkip ? undefined : PICTURE_RULES.find(([, selector]) => element.closest(selector));
          if (!insideSkip && text.length > 0) {
            const picture = rule ? element.closest(rule[1]) : null;
            if (picture) {
              suppressed.nodes += 1;
              suppressed.rules[rule[0]] = (suppressed.rules[rule[0]] ?? 0) + 1;
              suppressed.regions.add(picture.getAttribute("aria-label") ?? picture.tagName.toLowerCase());
              if (suppressed.examples.length < 3) suppressed.examples.push(text.slice(0, 80));
            } else if (text.split(" ").filter(Boolean).length >= 5) {
              const letters = text.replace(/[^A-Za-z]/g, "").length;
              const ascii = text.length > 0 ? letters / text.replace(/\s/g, "").length : 0;
              // A segment that already contains Chinese is translated, whatever
              // proportion of it is an identifier.
              const cjk = /[\u3400-\u9fff]/.test(text);
              if (ascii > 0.8 && !cjk) out.push({ text, at: locate(element) });
            }
          }
        }
        node = walker.nextNode();
      }
      return { segments: out, codeText, suppressed: { ...suppressed, regions: suppressed.regions.size } };
    });
    /*
     * The chrome pass. Same page, a different question: not "is this sentence
     * translated" but "is this *label*". The selectors and the specimen
     * exclusion come from the shared rule module so the probe cannot drift from
     * the rule the test pins.
     */
    const labels = await page.evaluate(
      ({ selectors, skip }) => {
        const out = [];
        for (const element of document.querySelectorAll(selectors)) {
          if (element.closest(skip) || element.offsetParent === null) continue;
          /*
           * Decoration by declaration is not a label.
           *
           * `Marquee` renders its content twice — the second copy exists to make
           * the loop seamless and is `aria-hidden`, so a screen reader hears the
           * list once. `textContent` does not know that, so the container's label
           * came out as `Read the data, not the volumeRead the data, not the volume`
           * and was pinned as a reviewed English string. That reading was an
           * artifact of the extractor, not a defect in the component: the
           * duplication is intended, visual and silent to assistive technology.
           *
           * Two rules fix it: an element *inside* an `aria-hidden` subtree is not
           * chrome at all, and a label that contains one reads only the visible
           * copies. Neither changes what the gate accepts — it changes what the
           * page is asked to be.
           */
          if (element.closest("[aria-hidden='true']")) continue;
          const raw = element.textContent ?? "";
          const text = (
            element.querySelector("[aria-hidden='true']")
              ? (() => {
                  const clone = element.cloneNode(true);
                  for (const hidden of clone.querySelectorAll("[aria-hidden='true']")) hidden.remove();
                  return clone.textContent ?? "";
                })()
              : raw
          ).replace(/\s+/g, " ").trim();
          if (!text) continue;
          /*
           * Where the label came from, recorded beside it. A slot title and a
           * fixture's heading are identical as text, and the difference decides
           * who fixes it: the first is library vocabulary and belongs in the
           * package's own labels, the second is content and belongs to the
           * fixture. A reviewer gets the evidence rather than a guess.
           */
          const marks = [];
          const marked = element.closest("[data-composition],[data-area],[data-slot],[data-art],[data-skin]");
          if (marked) {
            for (const attribute of ["data-composition", "data-area", "data-slot", "data-art", "data-skin"]) {
              const value = marked.getAttribute(attribute);
              if (value) marks.push(`${attribute}=${value}`);
            }
          }
          out.push({
            label: text,
            element: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).split(/\s+/).slice(0, 2).join(".")}` : ""}`,
            context: marks.join(" ") || undefined,
            /* Inside a picture the page has declared, so it is content rather
             * than chrome — counted separately by `splitSpecimenLabels`. */
            /*
             * Declared specimen regions, not just pictures.
             *
             * `role="img"` was the first such region: a composed plate whose
             * interior text is content. A `Marquee` is the second — it repeats
             * its content to make the loop seamless (the copy is `aria-hidden`),
             * and the words inside are the specimen's own headline, which the
             * page's printed code also contains. Reading them as chrome produced
             * the doubled label this rule replaced, and then the single headline
             * as an untranslated label; both are the measurement, not the page.
             */
            picture: element.closest("[role='img'], [data-slot='marquee'], [data-slot='text-reveal'], [data-slot='kinetic-headline']") !== null,
            /* …unless it is a control, which stays chrome wherever it sits. */
            interactive:
              element.matches("button, a, input, select, textarea, summary, [role='button'], [role='link'], [role='tab']") ||
              element.closest("button, a, [role='button'], [role='link'], [role='tab']") !== null,
          });
        }
        return out;
      },
      { selectors: CHROME_SELECTORS, skip: CHROME_SKIP },
    );
    const { gated: routeCandidates, specimen: specimenCandidates } = splitSpecimenLabels(labels, identifiers);
    if (routeCandidates.length > 0) chromeByRoute[route.path] = routeCandidates;
    if (specimenCandidates.length > 0) specimenByRoute[route.path] = specimenCandidates;
    const evidence = labels.filter((entry) => routeCandidates.includes(entry.label));
    if (evidence.length > 0) chromeContext[route.path] = evidence;
    /* One entry per distinct sentence; the first occurrence's location is kept,
     * which is the one a reader sees first and the one a handoff should name. */
    const unique = [...new Map(segments.map((entry) => [entry.text, entry])).values()];
    const leaked = unique.filter((entry) => !ALLOWED.some((allowed) => entry.text.includes(allowed)));
    /*
     * The fixture boundary, applied after `ALLOWED` and before the id-list rule:
     * a segment the page's own code block prints is the specimen, and a specimen
     * is not translated. Counted and reported, never gated — the count is what
     * keeps this from becoming a way to hide ordinary copy.
     */
    const snippetLocked = leaked.filter((entry) => codeText.includes(entry.text));
    for (const entry of snippetLocked) {
      snippetLockedSegments.push({ route: route.path, segment: entry.text });
    }
    const unsuppressed = leaked.filter((entry) => !snippetLocked.includes(entry));
    /*
     * A reference table that prints `.join(", ")` over a capability's ids is not
     * an English page — it is nine registry keys in a row, and the policy is that
     * ids stay untranslated. `isIdList` requires *every* token to be a registered
     * id, so a sentence cannot slip through: prose always carries a word that is
     * neither id-shaped nor registered. This is the same judgement `ALLOWED`
     * makes for a single identifier, applied to a list of them.
     */
    const isIdList = (entry) => isRegisteredIdList(entry.text, registryIds);
    const idSegments = unsuppressed.filter((entry) => isIdList(entry));
    for (const entry of idSegments) idLists.push({ route: route.path, segment: entry.text });
    const leakedProse = unsuppressed.filter((entry) => !isIdList(entry));
    if (leakedProse.length > 0) failures += 1;
    if (leakedProse.length > 0) proseContext[route.path] = leakedProse;
    report.push({
      slug: route.slug,
      path: route.path,
      leaked: leakedProse.map((entry) => entry.text),
      leakedContext: leakedProse,
      snippetLocked: snippetLocked.map((entry) => entry.text),
      idLists: idSegments.map((entry) => entry.text),
      suppressed,
    });
  } catch (error) {
    failures += 1;
    report.push({ slug: route.slug, path: route.path, error: String(error) });
  }
}

await browser.close();
await writeFile(path.join(artifacts, "report.json"), JSON.stringify(report, null, 2), "utf8");
/* The chrome findings are evidence, not just an exit code: a reviewer needs the
 * list to decide whether a label is a leak or a fixture, and a handoff to
 * another owner needs it too. */
await writeFile(path.join(artifacts, "chrome.json"), `${JSON.stringify(chromeByRoute, null, 2)}\n`, "utf8");
/* What kind of label each chrome finding is, with the fixture markers around
 * it — the difference between library vocabulary and authored content. */
await writeFile(path.join(artifacts, "chrome-context.json"), `${JSON.stringify(chromeContext, null, 2)}\n`, "utf8");
/* The label class that is picture content: printed and written, never gated. */
await writeFile(path.join(artifacts, "chrome-specimen.json"), `${JSON.stringify(specimenByRoute, null, 2)}\n`, "utf8");
/* Where the residual English prose sits. `leakedContext` in the report carries
 * the same thing; this file is the one a handoff quotes. */
await writeFile(path.join(artifacts, "prose-context.json"), `${JSON.stringify(proseContext, null, 2)}\n`, "utf8");
/* The specimen boundary, in numbers: how much text each page presents as a
 * picture or as decoration, and a sample of it. A rising count is worth a look;
 * a silent exclusion is not. */
await writeFile(
  path.join(artifacts, "suppressed.json"),
  `${JSON.stringify(
    Object.fromEntries(
      report
        .filter((entry) => (entry.suppressed?.nodes ?? 0) > 0)
        .map((entry) => [entry.path, entry.suppressed]),
    ),
    null,
    2,
  )}\n`,
  "utf8",
);

/* --------------------------------------------------------- chrome baseline */
const previous = await readFile(chromeBaselinePath, "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => ({}));

let chromeFailures = [];
if (args.has("--update")) {
  const merged = mergeBaseline(chromeByRoute, previous.routes ?? {});
  await writeFile(
    chromeBaselinePath,
    `${JSON.stringify(
      {
        note: "Reviewed English chrome on the Chinese pages. Each entry is a label a human looked at and accepted; a label that is not here fails the probe.",
        routes: merged,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`  chrome baseline updated: ${Object.keys(merged).length} route(s) with accepted English`);
} else {
  chromeFailures = chromeProblems(chromeByRoute, previous.routes ?? {});
}
failures += chromeFailures.length;

if (args.has("--json")) {
  console.log(JSON.stringify({ prose: report, chrome: chromeByRoute, chromeSpecimen: specimenByRoute, chromeFailures }, null, 2));
} else {
  console.log(`LUC UI Showcase — Chinese rendering check (${report.length} routes, ${baseUrl})`);
  const clean = report.filter((entry) => (entry.leaked ?? []).length === 0 && !entry.error);
  console.log(`  routes with no English prose leak : ${clean.length}/${report.length}`);
  const suppressedNodes = report.reduce((total, entry) => total + (entry.suppressed?.nodes ?? 0), 0);
  const suppressedRegions = report.reduce((total, entry) => total + (entry.suppressed?.regions ?? 0), 0);
  const suppressedByRule = report.reduce((totals, entry) => {
    for (const [rule, count] of Object.entries(entry.suppressed?.rules ?? {})) {
      totals[rule] = (totals[rule] ?? 0) + count;
    }
    return totals;
  }, {});
  console.log(
    `  text presented as a picture or decoration, not prose : ${suppressedNodes} node(s) in ${suppressedRegions} region(s) — ${Object.entries(
      suppressedByRule,
    )
      .map(([rule, count]) => `${rule} ${count}`)
      .join(", ")}`,
  );
  for (const entry of report) {
    if (entry.error) console.log(`  ${entry.path} — FAILED TO LOAD: ${entry.error}`);
    else if (entry.leaked.length > 0) {
      console.log(`  ${entry.path} — ${entry.leaked.length} segment(s)`);
      for (const segment of entry.leaked.slice(0, 6)) console.log(`      ${segment}`);
    }
  }
  const chromeClean = report.length - Object.keys(chromeByRoute).length;
  console.log(`  routes with no English chrome label: ${chromeClean}/${report.length}`);
  /*
   * The fourth class, printed beside the other three so none of them is a
   * number only the exit code knows about: segments that are a list of
   * registered ids rather than prose (`editorial, scientific, minimal, …`).
   */
  if (idLists.length > 0) {
    console.log(
      `  registered id lists, not prose (counted, not gated): ${idLists.length} on ${
        new Set(idLists.map((entry) => entry.route)).size
      } route(s)`,
    );
    for (const entry of idLists.slice(0, 3)) {
      console.log(`      ${entry.route} — ${entry.segment.slice(0, 72)}`);
    }
  }
  const specimenLabels = Object.values(specimenByRoute).reduce((total, list) => total + list.length, 0);
  console.log(
    `  chrome-shaped labels inside a declared picture (counted, not gated): ${specimenLabels} on ${Object.keys(specimenByRoute).length} route(s)`,
  );
  /*
   * A fifth class, printed so it is not a number only the exit code knows about:
   * English that the page's own snippet prints. The rule is in
   * `lib/i18n/messages.ts`; this is its measurement.
   */
  console.log(
    `  specimen text printed by the page's own snippet (counted, not gated): ${
      snippetLockedSegments.length
    } on ${new Set(snippetLockedSegments.map((entry) => entry.route)).size} route(s)`,
  );
  for (const entry of snippetLockedSegments.slice(0, 4)) {
    console.log(`      ${entry.route} — ${entry.segment.slice(0, 72)}`);
  }
  if (!args.has("--update")) {
    for (const problem of chromeFailures) console.log(`  ${problem}`);
    if (chromeFailures.length === 0) console.log("  ✓ every chrome label is either translated or reviewed");
  }
}

process.exitCode = failures > 0 ? 1 : 0;
