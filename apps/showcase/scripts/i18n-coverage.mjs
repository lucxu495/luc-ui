/**
 * Measure bilingual coverage — and refuse to round it up.
 *
 * The temptation with i18n is to count what is *shipped* (a locale switcher, a
 * dictionary file) as if it were coverage. This script counts what a
 * Chinese-speaking visitor actually receives, per surface, from the real
 * registries: the route list, the navigation model, the dictionary and the
 * pages on disk.
 *
 * Usage:
 *
 *   node apps/showcase/scripts/i18n-coverage.mjs            # human summary
 *   node apps/showcase/scripts/i18n-coverage.mjs --json     # machine-readable
 *   node apps/showcase/scripts/i18n-coverage.mjs --missing  # list the gaps
 *
 * It is deliberately conservative. Two independent things are measured:
 *
 *   1. **Every sentence.** `i18n-prose.mjs` defines what documentation prose is
 *      and extracts it from each page; a sentence is covered only when the
 *      Chinese dictionary holds a rendering for it. A page whose title and
 *      introduction are translated therefore does not count as translated.
 *   2. **Every route.** A route is fully bilingual when every sentence it
 *      renders is translated *and* its header is localised.
 *
 * The script exits non-zero on any gap, so "we are at 100%" is a command that
 * either passes or does not.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { extractProse, normalize } from "./i18n-prose.mjs";
import { loadCatalogProse, loadRegistryProse, loadTradingViewProse } from "./chart-catalog-strings.mjs";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const messagesPath = path.join(appRoot, "lib/i18n/messages.ts");
const routesPath = path.join(appRoot, "lib/i18n/routes.zh.ts");
const navigationPath = path.join(appRoot, "lib/navigation.ts");
const qaRoutesPath = path.join(appRoot, "qa/routes.mjs");
const proseZhPath = path.join(appRoot, "lib/i18n/prose.zh.ts");

/**
 * How many routes the QA registry actually covers.
 *
 * Asked of the registry module rather than counted in its source: `ROUTES` is the
 * handwritten policy list *plus* discovery, so a regex over the file sees only the
 * policy half. Falls back to the literal count if the module cannot be imported —
 * a smaller true number is a worse report, but a crashed check is a worse one
 * still, and the fallback is what this line used to do.
 */
async function loadRegisteredRouteCount(modulePath, fallback) {
  try {
    const { ROUTES } = await import(modulePath);
    return Array.isArray(ROUTES) ? ROUTES.length : fallback;
  } catch {
    return fallback;
  }
}

/** Walk `app/**\/page.tsx` and return a route path for each one. */
async function collectRoutes(dir = path.join(appRoot, "app"), base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("(") || entry.name.startsWith("[") ? "" : `/${entry.name}`;
      found.push(...(await collectRoutes(full, `${base}${segment}`)));
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      found.push({ route: base === "" ? "/" : base, file: full });
    }
  }
  return found;
}

/**
 * Every `.tsx` under `dir`, because a page can live beside a helper component.
 *
 * `generated/` is skipped deliberately. Phase 9 generates the documentation
 * registry and its API tables from the package's real exports and its real
 * TypeScript declarations, which means those files contain the *library's* own
 * JSDoc — prop descriptions, type signatures, export names. That is API text,
 * not Showcase copy: a prop name and a `type` are identifiers a developer reads
 * in either language, and translating a signature would make it wrong. Counting
 * them as documentation prose would have inflated the denominator by ten
 * thousand sentences and buried the sentences that genuinely need rendering.
 */
async function collectTsx(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.name === "generated") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectTsx(full, out);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) out.push(full);
  }
  return out;
}

/**
 * The package sources a Showcase page prints through `tcs()`.
 *
 * This is a *witness* set, not a prose source: it is read only to answer "does
 * this English sentence exist anywhere in the product?", never to enlarge the
 * denominator. The distinction matters. `@luc/visuals` and `@luc/ui` hold
 * hundreds of contract strings — prop docs, diagnostic text, enum members — that
 * no page renders, and feeding them into `extractProse` would bury the sentences
 * that do need a rendering (see `collectTsx` above for the same reasoning about
 * `generated/`).
 *
 * Why it has to exist at all: the 10B.22 handoff translated every element
 * `limitations` sentence, and those sentences live in
 * `packages/visuals/src/elements/<family>/contracts.ts`. Nothing else in this scan
 * can see them, so all 513 translations were reported as "prose with no source
 * anywhere" — an accusation that the translations were invented, which is the
 * opposite of the truth.
 */
async function collectWitnessSources() {
  const roots = [path.resolve(appRoot, "../../packages/ui/src")];
  const found = [];
  for (const root of roots) found.push(...(await collectTsx(root)));
  return found;
}

/** Keys of the prose dictionary, read from source so no build step is needed. */
function proseKeys(source) {
  const start = source.indexOf("export const proseZh");
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  const body = source.slice(open, end);
  const keys = new Set();
  // Keys are either `"…":` or, for a key that is a bare identifier, `name:`.
  for (const match of body.matchAll(/^\s{2}"((?:[^"\\]|\\.)*)"\s*:\s*"/gm)) {
    keys.add(match[1].replace(/\\(["\\])/g, "$1"));
  }
  return keys;
}

/** Keys of a `const name: Record<string, string> = { ... }` block. */
function keysOf(source, name) {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) return [];
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  const body = source.slice(open, end);
  return Array.from(body.matchAll(/^\s{2}(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/gm)).map(
    (match) => match[1] ?? match[2],
  );
}

function countMatches(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const [messages, routeCopy, navigation] = await Promise.all([
    readFile(messagesPath, "utf8"),
    readFile(routesPath, "utf8"),
    readFile(navigationPath, "utf8"),
  ]);

  const contentEn = new Set(keysOf(messages, "contentEn"));
  const contentZh = new Set(keysOf(messages, "contentZh"));
  const uiEn = keysOf(messages, "uiEn");
  const uiZh = keysOf(messages, "uiZh");
  const navZh = keysOf(messages, "navZh");

  const translatedRoutes = new Set(
    Array.from(routeCopy.matchAll(/^\s{2}"([^"]+)":\s*\{/gm)).map((match) => match[1]),
  );

  /*
   * Navigation labels include the family and group headings the sidebar renders
   * from the generated documentation registry. Those titles are not written in
   * `navigation.ts` — the registry supplies them — so a checker that only read
   * the handwritten file would silently stop counting them, and an untranslated
   * family heading would pass. Component names are excluded on purpose: an
   * export name is an identifier a developer types in either language.
   */
  const registrySource = await readFile(
    path.join(appRoot, "lib/docs/generated/registry.ts"),
    "utf8",
  ).catch(() => "");
  const registryHeadings = ["generatedGroups", "generatedFamilies"].flatMap((name) => {
    const start = registrySource.indexOf(`export const ${name}`);
    if (start < 0) return [];
    const open = registrySource.indexOf("[", start);
    const close = registrySource.indexOf("] as const satisfies", open);
    const body = registrySource.slice(open, close);
    return Array.from(body.matchAll(/"title":\s*"([^"]+)"/g)).map((match) => match[1]);
  });

  /*
   * The area declarations are a third source of navigation copy.
   *
   * Phase 10A added `lib/discovery/areas.ts`, whose labels and descriptions are
   * rendered by the header, the sidebar's area row and the front door's site map —
   * all through `tn()`. A checker that read only `navigation.ts` would have
   * stopped counting twenty-four sentences and reported 100% coverage of a site
   * whose header was half English.
   */
  const areaSource = await readFile(path.join(appRoot, "lib/discovery/areas.ts"), "utf8").catch(() => "");
  const discoveryLabels = await readFile(
    path.join(appRoot, "lib/discovery/taxonomy.ts"),
    "utf8",
  ).catch(() => "");

  const navLabels = [
    ...Array.from(navigation.matchAll(/title:\s*"([^"]+)"/g)).map((match) => match[1]),
    ...Array.from(areaSource.matchAll(/label:\s*"([^"]+)"/g)).map((match) => match[1]),
    /*
     * An area's own sidebar section headings (IA V3).
     *
     * `sectionLabels: { components: "UI components" }` is neither a `label:` nor a
     * `title:`, so the two patterns above miss it — and a heading that is not
     * counted is a heading that can stay English on the Chinese pages while this
     * report says 100%. Reading the block explicitly is the same fix the area
     * labels needed one phase earlier.
     */
    ...Array.from(areaSource.matchAll(/sectionLabels:\s*\{([\s\S]*?)\}/g)).flatMap((match) =>
      Array.from(match[1].matchAll(/:\s*"([^"]+)"/g)).map((pair) => pair[1]),
    ),
    ...registryHeadings,
  ];
  const navDescriptions = [
    ...Array.from(navigation.matchAll(/description:\s*"([^"]+)"/g)).map((match) => match[1]),
    ...Array.from(areaSource.matchAll(/description:\s*"([^"]+)"/g)).map((match) => match[1]),
  ];

  /*
   * The discovery taxonomy's own labels are rendered as *prose* (`tcs`), not as
   * navigation, so they are counted by the sentence check below. They are read here
   * only so the report can name the count rather than hiding it in the prose total.
   */
  const discoveryLabelCount = Array.from(discoveryLabels.matchAll(/label:\s*"([^"]+)"/g)).length;

  const routes = await collectRoutes();
  const sourceCache = new Map();
  for (const entry of routes) sourceCache.set(entry.file, await readFile(entry.file, "utf8"));

  /*
   * A page that carries its body through the symbol dictionary (`tc`). Reported
   * for information only: the measure that decides pass or fail is the
   * sentence-level one below, because a page can put an entire body on screen
   * through the symbol dictionary and still leave half of it in English.
   */
  const symbolBodies = routes
    .filter((entry) => /\btc\(/.test(sourceCache.get(entry.file) ?? ""))
    .map((entry) => entry.route);

  /* ---- sentence-level coverage ------------------------------------------- */

  const prose = proseKeys(await readFile(proseZhPath, "utf8"));
  /*
   * A duplicate key is not a coverage gap — it is a silent overwrite, and
   * TypeScript only catches it once the file is compiled. Counted here so the
   * dictionary cannot accumulate two renderings of the same sentence.
   */
  const proseSource = await readFile(proseZhPath, "utf8");
  const proseKeyList = [...proseSource.matchAll(/^ {2}"((?:[^"\\]|\\.)*)"\s*:\s*"/gm)].map(
    (match) => match[1].replace(/\\(["\\])/g, "$1"),
  );
  const duplicateProse = [
    ...new Set(proseKeyList.filter((key, index) => proseKeyList.indexOf(key) !== index)),
  ];
  /** Sentences each route renders, whether wrapped in `tcs` or not. */
  const perRoute = new Map(routes.map((entry) => [entry.route, new Set()]));
  /**
   * A component that is not a page (a shared block beside `page.tsx`) is
   * attributed to the routes in its own directory — `app/charts/chart-panel.tsx`
   * reaches the chart pages, not the whole Showcase.
   */
  const sharedByPrefix = new Map();
  const routeOfPageFile = new Map(routes.map((entry) => [entry.file, entry.route]));
  /*
   * The Live Demo registries.
   *
   * `lib/demo/**` is data the pages render: a demo's `note` is a sentence a
   * reader sees above the specimen, and a chart demo's accessible name is read
   * aloud. Before Phase 9 Hardening this tree did not exist, and the generic
   * rule below attributed a `lib/` file to a route prefix derived from its own
   * directory — which for `lib/demo/charts` matches nothing, so demo prose would
   * have been invisible to the checker and could have shipped in English on
   * every page without the number moving.
   *
   * The mapping is deliberately coarse: every demo in `lib/demo/charts` is
   * required by every chart route. A demo's note is rendered on exactly one
   * page, so this over-attributes — and over-attributing is the safe direction,
   * because the failure it produces is "this sentence must be translated", not
   * "this English sentence is fine".
   */
  const demoRoutePrefixes = [
    { dir: path.join("lib", "demo", "components"), route: "/components" },
    { dir: path.join("lib", "demo", "charts"), route: "/charts" },
    { dir: path.join("lib", "demo", "motion"), route: "/motion" },
  ];
  /*
   * Two library directories whose copy is rendered by every route, or by a route
   * family, without living in `app/`:
   *
   *   `lib/discovery/**`  the eight use cases, six art directions and six visual
   *                       categories. They are rendered by the header panels, the
   *                       sidebar of three areas, the browse filters, the Explore
   *                       hub and the Visuals galleries — so an untranslated one is
   *                       an English label on nearly every page.
   * Without this mapping the generic rule below derived a prefix from the file's
   * own directory (`/lib/discovery`), matched no route, and dropped the sentences
   * entirely — a checker that silently stops counting is the failure mode this
   * whole script exists to prevent.
   */
  const chromeDirs = [path.join("lib", "discovery")];
  /*
   * Empty since Phase 2: it used to carry `lib/visuals/**` → `/visuals`, and the
   * Visuals tree now lives in its own repository. The mechanism stays because the
   * next library directory with rendered copy will need exactly this mapping.
   */
  const libRoutePrefixes = [];
  /*
   * Both trees are scanned. `app/` holds the pages; `components/` holds the
   * Showcase's own documentation chrome — the props table, the demo frame, the
   * chart panel — which appears on every page and was English until Phase 6.
   */
  const sources = [
    ...(await collectTsx(path.join(appRoot, "app"))),
    ...(await collectTsx(path.join(appRoot, "components"))),
    // The appearance registry is data with its own labels; it renders on the
    // appearance control and on the Themes page.
    ...(await collectTsx(path.join(appRoot, "lib"))),
  ];
  for (const file of sources) {
    const source = await readFile(file, "utf8");
    const items = extractProse(ts, source, file);
    if (items.length === 0) continue;
    const owner = routeOfPageFile.get(file);
    if (owner) {
      for (const item of items) perRoute.get(owner).add(item.text);
    } else if (file.startsWith(path.join(appRoot, "components"))) {
      // Showcase chrome is rendered by every route.
      for (const set of perRoute.values()) {
        for (const item of items) set.add(item.text);
      }
    } else {
      const fromApp = path.relative(path.join(appRoot, "app"), path.dirname(file));
      const fromRoot = path.relative(appRoot, path.dirname(file));
      if (chromeDirs.some((dir) => fromRoot === dir || fromRoot.startsWith(`${dir}${path.sep}`))) {
        for (const set of perRoute.values()) {
          for (const item of items) set.add(item.text);
        }
        continue;
      }
      const libPrefix = libRoutePrefixes.find(
        (candidate) => fromRoot === candidate.dir || fromRoot.startsWith(`${candidate.dir}${path.sep}`),
      );
      if (libPrefix) {
        for (const [route, set] of perRoute) {
          if (route === libPrefix.route || route.startsWith(`${libPrefix.route}/`)) {
            for (const item of items) set.add(item.text);
          }
        }
        continue;
      }
      const demo = demoRoutePrefixes.find(
        (candidate) => fromRoot === candidate.dir || fromRoot.startsWith(`${candidate.dir}${path.sep}`),
      );
      if (demo) {
        for (const [route, set] of perRoute) {
          if (route === demo.route || route.startsWith(`${demo.route}/`)) {
            for (const item of items) set.add(item.text);
          }
        }
        continue;
      }
      const dir = fromApp;
      const prefix = dir === "" || dir === "." ? "/" : `/${dir}`;
      const set = sharedByPrefix.get(prefix) ?? new Set();
      for (const item of items) set.add(item.text);
      sharedByPrefix.set(prefix, set);
    }
  }
  /*
   * The chart registry is data, not JSX: its prose fields are collected from
   * the module itself and attributed to `/charts/catalog`, the route that
   * renders them.
   */
  const catalog = await loadCatalogProse();
  for (const text of catalog.strings) perRoute.get("/charts/catalog")?.add(text);

  /*
   * The per-entry page notes are data, and each one renders on exactly one route.
   *
   * `lib/docs/curation/notes.ts` holds prose — the Usage sentence, the Do/Don't
   * rows, the accessibility statement — keyed by the canonical entry id. No page
   * names those sentences, so they land in no route's set on their own: their
   * Chinese renderings would be reported as "ahead of the extractor", the
   * tolerated bucket, and a note could ship in English on the Chinese page while
   * this gate said 100%.
   *
   * Attributing them to every route (the cheap fix) would have inflated each
   * route's denominator with sentences the reader never sees there. So the ids are
   * read from the curation file and resolved to routes through the navigation
   * projection — the same two-source check the rest of this script performs, with
   * a guard: a file that mentions `ENTRY_NOTES` and yields no ids is a scanner
   * that stopped reading, which is the failure mode this whole module exists to
   * prevent.
   */
  const notesSource = await readFile(path.join(appRoot, "lib/docs/curation/notes.ts"), "utf8").catch(
    () => "",
  );
  if (notesSource.includes("ENTRY_NOTES")) {
    const noteIds = [...notesSource.matchAll(/^ {2}(?:"([^"]+)"|([A-Za-z][\w-]*)):\s*\{/gm)].map(
      (match) => match[1] ?? match[2],
    );
    const navSource = await readFile(path.join(appRoot, "lib/docs/generated/nav.ts"), "utf8").catch(
      () => "",
    );
    const routeById = new Map(
      [...navSource.matchAll(/"id": "([^"]+)",\s*"t": "[^"]*",\s*"r": "([^"]+)"/g)].map((match) => [
        match[1],
        match[2],
      ]),
    );
    const notesProse = extractProse(
      ts,
      notesSource,
      path.join(appRoot, "lib/docs/curation/notes.ts"),
    );
    if (noteIds.length === 0 || notesProse.length === 0) {
      throw new Error(
        `i18n: ${noteIds.length} note id(s) and ${notesProse.length} sentence(s) read from notes.ts — the scanner stopped working`,
      );
    }
    const noteRoutes = [...new Set(noteIds.map((id) => routeById.get(id)).filter(Boolean))];
    if (noteRoutes.length === 0) {
      throw new Error("i18n: no documented route matches an id in curation/notes.ts");
    }
    for (const route of noteRoutes) {
      for (const item of notesProse) perRoute.get(route)?.add(item.text);
    }
  }

  /*
   * The registry's own lead sentences. They render as the first line of every
   * registry page, so they are attributed to the route they belong to — a
   * missing one is a Chinese page that opens in English, not a cosmetic gap.
   */
  for (const { route, summary } of await loadRegistryProse()) {
    perRoute.get(route)?.add(summary);
  }

  // The library owns the widget registry; the Showcase owns its Chinese.
  const providerStrings = await loadTradingViewProse();
  for (const [route, set] of perRoute) {
    if (route.startsWith("/integrations/tradingview")) {
      for (const text of providerStrings) set.add(text);
    }
  }

  for (const [prefix, sentences] of sharedByPrefix) {
    for (const [route, set] of perRoute) {
      if (prefix === "/" || route === prefix || route.startsWith(`${prefix}/`)) {
        for (const text of sentences) set.add(text);
      }
    }
  }

  const routeProse = {};
  const fullyBilingual = [];
  const incompleteRoutes = [];
  const missingSentences = new Map();
  let totalSentences = 0;
  let translatedSentences = 0;
  for (const [route, sentences] of perRoute) {
    const missing = [...sentences].filter((sentence) => !prose.has(sentence));
    routeProse[route] = { total: sentences.size, missing: missing.length };
    totalSentences += sentences.size;
    translatedSentences += sentences.size - missing.length;
    if (missing.length === 0 && translatedRoutes.has(route)) fullyBilingual.push(route);
    else incompleteRoutes.push(route);
    if (missing.length > 0) missingSentences.set(route, missing);
  }
  const orphanProse = [...prose].filter(
    (key) => ![...perRoute.values()].some((sentences) => sentences.has(key)),
  );
  /*
   * Not every orphan is a lie. A sentence that sits *beside* an inline element —
   * `… a hairline (` <Code/> `) when two levels …` — is split into fragments that
   * the sentence extractor does not reassemble, and one that lives in a data
   * module the extractor does not walk is still real. So an orphan is only a
   * failure when the string cannot be found anywhere in the scanned sources;
   * the rest are reported as extractor gaps.
   *
   * Two kinds of witness are accepted, and both are needed:
   *
   *   - the sentence appears verbatim in a scanned source, and
   *   - the sentence appears in its **TypeScript-escaped** form. This one is not
   *     a convenience. A limitation sentence that quotes a term —
   *     `… whether two intervals are "different" is a study's judgement …` — is
   *     stored as `\"different\"`, so a raw `includes` never matched it and the
   *     10B.22 merge was reported as four invented translations. That was the
   *     escaping, not the translation.
   *
   * Known limit, stated rather than hidden: `sources` contains the dictionary
   * itself, so a key that is present but *stale* — reworded upstream and never
   * removed — is witnessed by its own entry and is reported as `unextracted`
   * rather than `unfindable`. Measured on 2026-10-14: 273 of the 1842
   * unextracted keys have no source outside the dictionary. Making that class a
   * failure is a separate piece of work, deliberately not attempted here: a stale
   * key renders nothing and so cannot produce an English page, while a false
   * failure here does (it accuses a correct translation).
   */
  const sourceText = (
    await Promise.all(
      [
        ...new Set([
          ...sources,
          ...(await collectTsx(path.join(appRoot, "components"))),
          ...(await collectWitnessSources()),
        ]),
      ].map(async (file) => {
        try {
          return await readFile(file, "utf8");
        } catch {
          return "";
        }
      }),
    )
  ).join("\n");
  const escapedKey = (key) => JSON.stringify(key).slice(1, -1);
  const witnessed = (key) => sourceText.includes(key) || sourceText.includes(escapedKey(key));
  const unfindableProse = orphanProse.filter((key) => !witnessed(key));
  const unextractedProse = orphanProse.filter((key) => witnessed(key));

  const qaRoutes = (await readFile(qaRoutesPath, "utf8")).match(/path:\s*"/g)?.length ?? 0;

  /*
   * Distinct routes, not page files — they are not the same number, and using
   * the wrong one made this report lie in both directions.
   *
   * `collectRoutes` walks `app/` and strips route groups and dynamic segments, so
   * `charts/[chart]/page.tsx` and `charts/page.tsx` both arrive as `/charts`. It
   * returns 165 entries for 161 routes: the four dynamic families
   * (`[chart]`, `[component]`, `[family]`, `[motion]`) are counted twice. The
   * header line then read "165/165" (a file count over a file count, reported as
   * if it were coverage) and the body line read "161/165 (98%)" — a *correct*
   * numerator over an inflated denominator, so a fully bilingual site looked like
   * it had four gaps. Neither number was checkable by reading it.
   *
   * Both denominators are the distinct set now, and the page-file count is
   * printed beside it rather than folded into it.
   */
  const routeKeys = [...new Set(routes.map((entry) => entry.route))];

  const report = {
    generatedAt: new Date().toISOString(),
    routes: {
      total: routeKeys.length,
      pageFiles: routes.length,
      headerTranslated: routeKeys.filter((route) => translatedRoutes.has(route)).length,
      symbolBodies: symbolBodies.length,
      /*
       * The QA registry itself, not the count of `path:` literals in the policy
       * file. `qa/routes.mjs` exports `ROUTES` = the handwritten policy list plus
       * everything discovery found on disk, so counting the literals reported 156
       * of 357 registered routes and read as if two hundred pages were untested.
       */
      registeredInQa: await loadRegisteredRouteCount(qaRoutesPath, qaRoutes),
    },
    navigation: {
      labels: navLabels.length,
      labelsTranslated: navLabels.filter((label) => navZh.includes(label)).length,
      descriptions: navDescriptions.length,
      descriptionsTranslated: navDescriptions.filter((label) => navZh.includes(label)).length,
    },
    chrome: {
      keys: uiEn.length,
      translated: uiEn.filter((key) => uiZh.includes(key)).length,
    },
    content: {
      keys: contentEn.size,
      translated: Array.from(contentEn).filter((key) => contentZh.has(key)).length,
      missing: Array.from(contentEn).filter((key) => !contentZh.has(key)),
      orphans: Array.from(contentZh).filter((key) => !contentEn.has(key)),
    },
    prose: {
      sentences: totalSentences,
      translated: translatedSentences,
      keys: prose.size,
      routesFullyBilingual: fullyBilingual.length,
      routeCount: routeKeys.length,
      routesIncomplete: incompleteRoutes.sort(),
      perRoute: routeProse,
      missing: Object.fromEntries([...missingSentences].map(([route, list]) => [route, list])),
      orphans: orphanProse,
      duplicates: duplicateProse,
      unfindable: unfindableProse,
      unextracted: unextractedProse,
    },
    symbolBodyRoutes: symbolBodies,
  };

  if (args.has("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const pct = (part, whole) => (whole === 0 ? "n/a" : `${Math.round((part / whole) * 100)}%`);
  console.log("LUC UI Showcase — bilingual coverage (en → zh-CN)");
  console.log(
    `  routes on disk          : ${report.routes.total} (${report.routes.pageFiles} page files, ${report.routes.registeredInQa} registered in QA)`,
  );
  console.log(
    `  page headers            : ${report.routes.headerTranslated}/${report.routes.total} (${pct(report.routes.headerTranslated, report.routes.total)})`,
  );
  console.log(
    `  page bodies (sentence)  : ${report.prose.routesFullyBilingual}/${report.routes.total} (${pct(report.prose.routesFullyBilingual, report.routes.total)})`,
  );
  console.log(
    `  navigation labels       : ${report.navigation.labelsTranslated}/${report.navigation.labels} (${pct(report.navigation.labelsTranslated, report.navigation.labels)})`,
  );
  console.log(
    `  navigation descriptions : ${report.navigation.descriptionsTranslated}/${report.navigation.descriptions} (${pct(report.navigation.descriptionsTranslated, report.navigation.descriptions)})`,
  );
  console.log(
    `  chrome strings          : ${report.chrome.translated}/${report.chrome.keys} (${pct(report.chrome.translated, report.chrome.keys)})`,
  );
  console.log(
    `  long-form content keys  : ${report.content.translated}/${report.content.keys} (${pct(report.content.translated, report.content.keys)})`,
  );
  console.log(
    `  prose sentences         : ${report.prose.translated}/${report.prose.sentences} (${pct(report.prose.translated, report.prose.sentences)})`,
  );
  console.log(`  pages on the symbol dictionary   : ${report.routes.symbolBodies}`);
  if (report.prose.unextracted.length > 0) {
    console.log(
      `  prose ahead of the extractor     : ${report.prose.unextracted.length} (translated sentences the sentence splitter cannot reassemble)`,
    );
  }
  if (report.content.missing.length > 0) {
    console.log(`  missing zh keys         : ${report.content.missing.join(", ")}`);
  }
  if (report.content.orphans.length > 0) {
    console.log(`  zh keys with no English : ${report.content.orphans.join(", ")}`);
  }
  if (args.has("--missing")) {
    console.log("\nRoutes that are not yet fully bilingual:");
    for (const route of report.prose.routesIncomplete) {
      const detail = report.prose.perRoute[route];
      const header = translatedRoutes.has(route) ? "" : " (header)";
      console.log(`  ${route} — ${detail.missing}/${detail.total} sentences${header}`);
    }
    if (args.has("--sentences")) {
      console.log("\nMissing sentences:");
      for (const [route, list] of Object.entries(report.prose.missing)) {
        console.log(`  ${route}`);
        for (const sentence of list) console.log(`      ${sentence}`);
      }
    }
  }

  const problems = [];
  if (report.content.missing.length > 0) problems.push(`${report.content.missing.length} English content key(s) without a translation`);
  if (report.content.orphans.length > 0) problems.push(`${report.content.orphans.length} translation(s) with no English source key`);
  /*
   * Navigation copy is a gate, not a statistic.
   *
   * Phase 9 Hardening left this category at 12/51 without failing a build, and the
   * gap survived a whole phase because the number was printed and nothing read it.
   * A header label is the first Chinese a visitor sees; it belongs with the other
   * hard failures.
   */
  const untranslatedNavLabels = navLabels.filter((label) => !navZh.includes(label));
  const untranslatedNavDescriptions = navDescriptions.filter((label) => !navZh.includes(label));
  if (untranslatedNavLabels.length > 0) {
    problems.push(
      `${untranslatedNavLabels.length} navigation label(s) without a translation: ${untranslatedNavLabels.slice(0, 5).join(" | ")}`,
    );
  }
  if (untranslatedNavDescriptions.length > 0) {
    problems.push(
      `${untranslatedNavDescriptions.length} navigation description(s) without a translation: ${untranslatedNavDescriptions.slice(0, 3).join(" | ")}`,
    );
  }
  const untranslated = report.prose.sentences - report.prose.translated;
  if (untranslated > 0) problems.push(`${untranslated} documentation sentence(s) without a translation`);
  if (report.prose.unfindable.length > 0) {
    problems.push(
      `${report.prose.unfindable.length} prose translation(s) with no source anywhere: ${report.prose.unfindable.slice(0, 5).join(" | ")}`,
    );
  }
  if (report.prose.duplicates.length > 0) problems.push(`${report.prose.duplicates.length} duplicate prose key(s): ${report.prose.duplicates.join(", ")}`);
  const headerGap = routeKeys.filter((route) => !translatedRoutes.has(route));
  if (headerGap.length > 0) problems.push(`${headerGap.length} route header(s) without a translation`);
  if (problems.length > 0) {
    console.error(`\n  ${problems.join("; ")}`);
    process.exitCode = 1;
  }
}

await main();
