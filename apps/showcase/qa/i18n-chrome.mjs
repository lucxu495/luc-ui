/**
 * The chrome labels a Chinese page must not show in English.
 *
 * Why this is a second *pass* and not a second engine. `i18n-live.mjs` already
 * loads every Chinese route in a browser and reads what a visitor is shown; its
 * detector looks for **sentences** — five or more words, overwhelmingly ASCII,
 * no Chinese. That rule is right for prose and blind to the class that actually
 * leaked: `/zh/blocks` rendered its category headings as "Marketing" and
 * "Product", two one-word labels the sentence rule cannot see, while
 * `verify:i18n` reported 100% because neither string was in the dictionary to
 * be missing.
 *
 * So the same walk collects a second list — headings, example and demo titles,
 * the shell's own buttons and links — and applies a rule built for *labels*:
 * short, no Chinese, and not something that is legitimately English in both
 * languages. The rules live here, pure and dependency-free, so they can be
 * tested without a browser and cannot drift away from the probe that applies
 * them.
 *
 * What is legitimately English, and therefore never a candidate:
 *
 *   - a **component or prop identifier** — `ParallaxScene`, `API`, `DataTable`.
 *     A Chinese reader types these verbatim; translating them would be a bug.
 *     This is a *source-backed* list rather than a guess: the Showcase draws its
 *     sidebar from the registry's own entry titles, so those titles are the
 *     names the product has already decided to keep in English, and
 *     `knownIdentifiers()` reads them from the generated projection instead of
 *     maintaining a second list that could drift from it.
 *   - a **proper noun** — the products and engines listed in `ALLOWED`.
 *   - **data**, not words — a figure, a currency, a unit, a locale-formatted
 *     date. "Portfolio value£" is a formatter's output.
 *
 * What is a candidate: everything else in a chrome region. The residue after a
 * review is pinned in `i18n-chrome.json` with the reason written next to it, and
 * anything new fails — which is the whole point: the failure mode being guarded
 * against is a *new* English label appearing on a Chinese page, not the ones a
 * human has already looked at and decided.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * The names this product keeps in English: every registry entry title (the
 * sidebar's own labels) and every export the registry documents.
 *
 * The export half matters because a name is not always an entry title. `Callout`
 * and `Popover` are exported alongside `Alert`, and neither is its entry's
 * title, so a heading that says "Callout" would otherwise read as a missing
 * translation. Read from the two generated projections rather than maintained by
 * hand, so a new export cannot be forgotten.
 *
 * Family titles are deliberately *not* included. A family heading is chrome
 * ("Spatial", "Feedback", "Entrance"), it is translated through the navigation
 * dictionary, and treating it as an identifier is how five of them stayed
 * English on `/zh/motion` while nothing existed to say so.
 */
export async function knownIdentifiers(file) {
  const source = file ?? path.resolve(HERE, "../lib/docs/generated/nav.ts");
  const text = await readFile(source, "utf8");
  const names = new Set([...text.matchAll(/"t": "([^"]+)"/g)].map((match) => match[1]));
  const registry = await readFile(path.resolve(HERE, "../lib/docs/generated/registry.ts"), "utf8");
  for (const match of registry.matchAll(/"exports": \[([^\]]*)\]/g)) {
    for (const name of match[1].matchAll(/"([^"]+)"/g)) names.add(name[1]);
  }
  return names;
}

/**
 * Where chrome lives.
 *
 * Deliberately narrow. A heading inside a specimen is the specimen's content —
 * a chart's axis title, a card's sample copy — and translating it would be
 * inventing data. `[data-slot="example-stage"]` and `[data-slot="demo"]` are the
 * two containers the documentation primitives wrap a live specimen in, so
 * excluding them draws the line where the primitives already draw it.
 */
export const CHROME_SELECTORS = [
  "main h1",
  "main h2",
  "[data-slot='example'] h3",
  "[data-slot='demo'] h3",
  "header button",
  "aside a",
  "aside button",
  "[data-slot='related-api'] a",
].join(", ");

/** Text inside these is a specimen, a code sample, or explicitly opted out. */
export const CHROME_SKIP = [
  "pre",
  "code",
  "kbd",
  "samp",
  ".font-mono",
  "script",
  "style",
  "template",
  "noscript",
  "[data-slot='demo']",
  "[data-slot='example-stage']",
  "[data-slot='playground']",
  "[data-i18n-skip]",
].join(", ");

/**
 * A chrome-shaped label that is part of a picture rather than of the page.
 *
 * The Visuals plates declare themselves `role="img"` with an authored
 * `aria-label`, and the label their interior carries is the composition's own
 * content — a plate headline, a region title — drawn inside a composed
 * 1080×1350 frame. That is the same boundary `CHROME_SKIP` already draws for
 * `[data-slot='demo']` and `[data-slot='example-stage']`: a live specimen is
 * excluded because its words are the sample, not the interface.
 *
 * The difference here is that the class is **counted and printed** rather than
 * dropped. A page whose chrome migrates into a `role="img"` subtree would show
 * up as a rising specimen count in every run — which is the failure this exists
 * to make impossible: an exclusion that nobody can see is how a gate turns green
 * without the product improving.
 */
export const SPECIMEN_SELECTOR = "[role='img']";

/**
 * Split the label candidates into the ones the gate judges and the ones that are
 * picture content.
 *
 * Pure, and total: every candidate comes out in exactly one of the two lists, so
 * no label can be lost between them. `i18n-chrome.test.mjs` pins that.
 *
 * One exception keeps the boundary honest: a **control** inside a picture stays
 * gated. A `role="img"` subtree may hold the drawing's words, but a `<button>`
 * or a link in there is chrome a reader can operate — and it is already an
 * accessibility defect for it to be inside an image, so the gate should say so
 * rather than file it as content.
 *
 * @param {{label: string, picture?: boolean, interactive?: boolean}[]} labels
 * @param {Set<string>} identifiers registry titles and exports that stay English
 */
export function splitSpecimenLabels(labels, identifiers) {
  const pick = (predicate) => candidates(labels.filter(predicate).map((entry) => entry.label), identifiers);
  return {
    gated: pick((entry) => entry.picture !== true || entry.interactive === true),
    specimen: pick((entry) => entry.picture === true && entry.interactive !== true),
  };
}

/**
 * Product names, engines and acronyms that stay as they are.
 *
 * A proper noun is the same in either language. This list is short on purpose:
 * an entry that is merely inconvenient to translate belongs in the baseline with
 * a reason, not here.
 */
export const ALLOWED = new Set([
  "API",
  "AI",
  "LUC UI",
  "LUC",
  "ECharts",
  "TradingView",
  "Lightweight Charts",
  "React",
  "TypeScript",
  "CSS",
  "SVG",
  "HTML",
  "ORCID",
]);

/**
 * Shapes that are identifiers rather than words.
 *
 * A single capitalised word is ambiguous — `Textarea` is an export name and
 * `Marketing` is a heading — so the shape alone cannot decide it and the
 * registry list does (see `candidates`). What the shape *can* settle is the
 * unmistakable cases: a package or prop path (`@luc/ui/data-table`,
 * `sidebar.collapsed`) and a compound name with an internal capital
 * (`ParallaxScene`, `DataTable`, `FloatButton`). An acronym is decided by
 * `ALLOWED`, so `API` and `AI` stay while a stray all-caps word is reported.
 */
const PATH_LIKE = /^@?[A-Za-z][A-Za-z0-9]*(?:[./@·-][A-Za-z0-9]+)+$/;
const COMPOUND = /^[A-Za-z]+[A-Z][A-Za-z0-9]*$/;

/** Data: a figure, a currency, a unit, a formatted measurement. */
const DATA_SHAPED = /[0-9£$€¥%°µ±]|,\s*\d/;

export const MAX_LABEL_LENGTH = 70;

/**
 * Is this chrome label a candidate for translation?
 *
 * Conservative in the direction that matters: a false positive costs a review
 * line, a false negative costs a Chinese reader an English label.
 */
export function isCandidate(label) {
  const text = label.replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_LABEL_LENGTH) return false;
  if (/[\u3400-\u9fff]/.test(text)) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (ALLOWED.has(text)) return false;
  if (!/\s/.test(text) && (PATH_LIKE.test(text) || COMPOUND.test(text))) return false;
  if (DATA_SHAPED.test(text)) return false;
  return true;
}

/**
 * The candidates in a list of labels, de-duplicated and in a stable order.
 *
 * `identifiers` is the registry's own entry titles, so a name the product keeps
 * in English in both languages is not reported as a missing translation. It is
 * passed in rather than imported so the rule stays pure and the test can supply
 * the real generated file.
 */
export function candidates(labels, identifiers = new Set()) {
  return [...new Set(labels.filter((label) => isCandidateWith(label, identifiers)))].sort();
}

/** `isCandidate`, plus the registry's own names. */
export function isCandidateWith(label, identifiers = new Set()) {
  const text = label.replace(/\s+/g, " ").trim();
  if (identifiers.has(text)) return false;
  return isCandidate(text);
}

/**
 * The candidates a route has not yet accounted for.
 *
 * `accepted` is the pinned, reviewed residue for that route: labels a human
 * looked at and decided are English on purpose, each with a reason in the
 * baseline file. A label that is new, or whose reason was removed, is reported.
 */
export function unaccounted(routeCandidates, accepted = {}) {
  return routeCandidates.filter((label) => !(label in accepted));
}

/** Every route's unaccounted labels, as flat, printable problems. */
export function chromeProblems(byRoute, baseline = {}) {
  const problems = [];
  for (const [route, labels] of Object.entries(byRoute)) {
    for (const label of unaccounted(labels, baseline[route] ?? {})) {
      problems.push(`${route}: "${label}" is English chrome on the Chinese page`);
    }
  }
  return problems;
}

/** Fresh labels that are not yet in the baseline, for `--update`. */
export function mergeBaseline(byRoute, baseline = {}) {
  const next = { ...baseline };
  for (const [route, labels] of Object.entries(byRoute)) {
    const accepted = { ...(baseline[route] ?? {}) };
    for (const label of labels) accepted[label] ??= "";
    if (Object.keys(accepted).length > 0) next[route] = accepted;
  }
  return next;
}
