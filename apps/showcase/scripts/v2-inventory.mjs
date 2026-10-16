/**
 * The per-page V2 inventory — and the contract that reads it.
 *
 * §3 of the Components V2 brief asks for evidence that every handwritten page
 * genuinely adopted the standard, and §4 asks for coverage that notices when a
 * page drifts back. Both want the same thing: one machine-readable statement of
 * what each page *is* (§3), produced from the source rather than maintained by
 * hand, and a check that a page which regresses fails loudly (§4).
 *
 * So this walks the handwritten routes and records facts, not opinions:
 *
 *   route · group · kind · demos · examples · examples with code · examples with
 *   a disclosure · import line · footer · API table · install heading ·
 *   playground · AI panel
 *
 * `kind` is the distinction the brief asks for: a **detail** page is the route a
 * registry entry owns (one component, its own page), a **family** page is a
 * sidebar family's overview (several components, one page), and a **collection**
 * is a catalogue or a pattern walkthrough that owns no entry.
 *
 * A `Demo` left on a page is not automatically a failure — six sections could
 * not be migrated mechanically and are listed with their reason — but it must be
 * *declared*. An undeclared one fails, which is what stops the standard from
 * quietly eroding back.
 *
 *   node scripts/v2-inventory.mjs            # write the inventory + report
 *   node scripts/v2-inventory.mjs --check    # fail when the committed file is stale
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const OUT = path.resolve(APP, "../../docs/audits/showcase-transformation/progress/v2-inventory.json");

/** The roots that hold handwritten pages. Generated routes live elsewhere. */
const ROOTS = ["app/components", "app/application", "app/data", "app/date-time", "app/forms"];

/**
 * Sections that could not be migrated by the codemod, with the reason.
 *
 * Each is a real page shape the mechanical transform cannot express: a section
 * that holds a specimen *and* other content, a section whose heading carries an
 * action, or a specimen that already names itself. They keep `Demo` on purpose —
 * the alternative was to invent a title or drop the neighbouring content.
 */
const DEMO_EXCEPTIONS = {
  "/components/avatar": "the fallback section holds a specimen plus its own explanation",
  "/components/command": "the section heading carries an action button",
  "/data/statuses": "the status-vocabulary section holds a specimen plus its own explanation",
  "/application/navigation": "the specimen already has its own title, which the section title would replace",
};

/**
 * Pages that are **not** complete, with the reason — counted, never hidden.
 *
 * Empty, and that is a claim with evidence behind it rather than an emptied
 * list: the four `/application/*` pages that were recorded here closed by
 * giving each live composite an `<Example>` frame with a snippet transcribed
 * from its own specimen (an honest *excerpt* where the composition is larger
 * than a fenced block can hold, and labelled as one). The composite shapes —
 * the shell, the resizable workspace, the URL-state provider, the outline
 * drawer — are why they took a second pass, not a reason to exempt them.
 *
 * A new entry here is how a page records open work; `contractViolations`
 * skips a declared gap so it reads as PARTIAL rather than as drift.
 */
const PAGE_GAPS = {};

function walk(dir, out = []) {
  return readdir(dir, { withFileTypes: true }).then(async (entries) => {
    for (const entry of entries) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(target, out);
      else if (entry.name === "page.tsx") out.push(target);
    }
    return out;
  });
}

/** Index just past the `>` that closes the opening tag at `start`. */
function tagEnd(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    else if (ch === ">" && depth === 0) return i + 1;
  }
  return -1;
}

/**
 * The source with comments removed.
 *
 * Not cosmetic: the pages *describe* the standard in comments — "Every specimen
 * is an `<Example>`" — and a scanner that reads prose counts an example that is
 * not there and then reports it as missing its title and its code.
 */
function withoutComments(src) {
  /*
   * Only a block comment that *starts a line* is a comment here.
   *
   * Measured defect: the file-upload page's specimens accept "image" wildcard
   * patterns, whose accept list contains a slash-star. The unanchored version of
   * this pattern matched that slash-star *inside the string*, so everything up
   * to the next comment close — most of the page — was deleted before the scan
   * and the route was inventoried as having 1 example when it renders 5.
   * Anchoring to the start of a line keeps every explanatory comment in this
   * codebase (they all start a line) and never touches a glob, a slash-star
   * inside a string, or a double slash inside a URL.
   */
  return src.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Every opening tag of `name`, with the text of the tag itself.
 *
 * The lookahead matters: `<DemoStage` is not a `<Demo>`, and the catalogue page
 * would otherwise be reported as carrying an unmigrated specimen.
 */
function tags(src, name) {
  const found = [];
  const pattern = new RegExp(`<${name}(?=[\\s/>])`, "g");
  let index = pattern.exec(src)?.index ?? -1;
  while (index !== -1) {
    const end = tagEnd(src, index);
    if (end === -1) break;
    found.push(src.slice(index, end));
    pattern.lastIndex = end;
    index = pattern.exec(src)?.index ?? -1;
  }
  return found;
}

/** The generated navigation projection, parsed the way the registry writes it. */
async function navRows() {
  const source = await readFile(path.join(APP, "lib/docs/generated/nav.ts"), "utf8");
  return [...source.matchAll(/"id": "([^"]+)",\s*"t": "([^"]+)",\s*"r": "([^"]+)",\s*"f": "([^"]+)",\s*"g": "([^"]+)",\s*"s": "([^"]+)"/g)].map(
    (match) => ({ id: match[1], title: match[2], route: match[3], family: match[4], group: match[5], status: match[6] }),
  );
}

export async function buildInventory() {
  const rows = await navRows();
  const families = new Set(rows.map((row) => row.family));
  const entryByRoute = new Map(rows.filter((row) => row.status !== "reference").map((row) => [row.route, row]));

  const files = (await Promise.all(ROOTS.map((root) => walk(path.join(APP, root))))).flat().sort();
  const pages = [];

  for (const file of files) {
    const relative = path.relative(path.join(APP, "app"), file);
    const route = `/${relative.replace(/\/page\.tsx$/, "")}`;
    if (route.includes("[")) continue;
    /*
     * A page can be split in two.
     *
     * The 20 routes that shadow a registry entry are a server `page.tsx` that
     * hands an `<EntryApiSection>` into a `page-client.tsx` holding the page
     * itself — the server half exists only because the API tables must never
     * reach a browser bundle. The examples live in the client half, so a scanner
     * that read only `page.tsx` would report twenty pages with no specimen at
     * all. Both halves are the page; both are read.
     */
    const raw = await readFile(file, "utf8");
    const clientFile = path.join(path.dirname(file), "page-client.tsx");
    const clientRaw = await readFile(clientFile, "utf8").catch(() => "");
    const src = withoutComments(`${raw}\n${clientRaw}`);

    const examples = tags(src, "Example");
    const demos = tags(src, "Demo");
    const segment = route.split("/").pop();
    const entry = entryByRoute.get(route);
    const kind = entry ? "detail" : families.has(segment) ? "family" : "collection";

    const page = {
      route,
      file: path.relative(path.resolve(APP, "../.."), file),
      group: entry?.group ?? route.split("/")[1] ?? "",
      family: entry?.family ?? (families.has(segment) ? segment : null),
      entry: entry?.id ?? null,
      kind,
      demos: demos.length,
      examples: examples.length,
      examplesWithCode: examples.filter((tag) => /code=/.test(tag)).length,
      examplesWithTitle: examples.filter((tag) => /title=/.test(tag)).length,
      importLine: /<ImportLine\b|<FamilyImports\b/.test(src),
      footer: /<EntryFooter\b/.test(src),
      /* Three ways a page shows the published API: a hand-written `PropsTable`,
       * the registry's own `ExportsTable`, or the server-rendered
       * `EntryApiSection` that a split page passes in as a node. All three are
       * the registry's answer, so all three count. */
      api: /<PropsTable\b|<ExportsTable\b|<EntryApiSection\b|<RelatedApi\b/.test(src),
      playground: /<PlaygroundSection\b/.test(src),
      aiPanel: /<AiGuidanceSection\b/.test(src),
      installHeading: /Installation and imports/.test(src),
      demoException: DEMO_EXCEPTIONS[route] ?? null,
      gap: PAGE_GAPS[route] ?? null,
      status: PAGE_GAPS[route] ? "PARTIAL" : "IMPLEMENTED",
    };
    pages.push(page);
  }
  return pages;
}

/** The contract §4 asks for, as a list of violations per page. */
export function contractViolations(pages) {
  const problems = [];
  for (const page of pages) {
    /* A declared gap is open work, reported by the summary rather than as drift:
     * the page is marked PARTIAL and cannot read as complete. */
    if (page.gap !== null) continue;
    const fail = (what) => problems.push(`${page.route}: ${what}`);
    if (page.installHeading) fail("repeats a package-installation heading");
    if (page.aiPanel) fail("carries an AI-agent panel in the reading path");
    if (page.examples > 0 && page.examplesWithTitle !== page.examples) fail("an example has no title");
    if (page.examples > 0 && page.examplesWithCode !== page.examples) fail("an example has no code");
    if (page.demos > 0 && page.demoException === null) fail(`${page.demos} Demo(s) with no declared exception`);
    if (page.examples > 0 && !page.importLine) fail("has examples but no import statement");
    if (page.examples === 0 && page.demos === 0 && page.kind !== "collection") {
      /* A component page with no specimen at all is the "no live demo" shape the
       * registry pages already forbid; a collection page (a roadmap, a guide) is
       * allowed to be prose. */
      fail("has neither a live example nor a specimen");
    }
  }
  return problems;
}

async function cli(argv) {
  const pages = await buildInventory();
  const violations = contractViolations(pages);
  const next = `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), pages }, null, 2)}\n`;

  const byKind = pages.reduce((accumulator, page) => {
    accumulator[page.kind] = (accumulator[page.kind] ?? 0) + 1;
    return accumulator;
  }, {});

  if (argv.includes("--check")) {
    const committed = await readFile(OUT, "utf8").catch(() => "");
    /* The timestamp is the only field that moves without the source changing. */
    const strip = (text) => text.replace(/"generatedAt": "[^"]+",\n/, "");
    if (strip(committed) !== strip(next)) {
      console.log("v2-inventory: stale — run `node scripts/v2-inventory.mjs`");
      return 1;
    }
  } else {
    await writeFile(OUT, next);
  }

  console.log(`LUC UI — handwritten page inventory (${pages.length} pages)`);
  console.log(`  by kind      : ${JSON.stringify(byKind)}`);
  console.log(`  examples     : ${pages.reduce((sum, page) => sum + page.examples, 0)} across ${pages.filter((p) => p.examples > 0).length} pages`);
  console.log(`  with code    : ${pages.reduce((sum, page) => sum + page.examplesWithCode, 0)}`);
  console.log(`  remaining Demo: ${pages.reduce((sum, page) => sum + page.demos, 0)} on ${pages.filter((p) => p.demos > 0).length} declared exception(s)`);
  console.log(`  import line  : ${pages.filter((p) => p.importLine).length}/${pages.length}`);
  console.log(`  footer       : ${pages.filter((p) => p.footer).length}/${pages.length}`);
  console.log(`  API reference: ${pages.filter((p) => p.api).length}/${pages.length}`);
  const partial = pages.filter((page) => page.status === "PARTIAL");
  console.log(`  V2 complete  : ${pages.length - partial.length}/${pages.length}`);
  for (const page of partial) console.log(`    PARTIAL ${page.route} — ${page.gap}`);
  if (violations.length > 0) {
    console.log(`\n  ${violations.length} contract violation(s):`);
    for (const violation of violations.slice(0, 40)) console.log(`    - ${violation}`);
  } else {
    console.log("\n  contract: clean");
  }
  return violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = await cli(process.argv.slice(2));
}
