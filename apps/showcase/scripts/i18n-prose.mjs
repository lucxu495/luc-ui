/**
 * The Showcase's definition of "documentation prose", in one place.
 *
 * Three consumers share this module so they can never disagree about what has
 * to be translated:
 *
 *   - `i18n-coverage.mjs` — measures coverage and fails the build on a gap.
 *   - `i18n-codemod.mjs`  — wraps each string in `tcs(...)` mechanically.
 *   - `i18n-pending.mjs`  — lists exactly what a translator still owes.
 *
 * What counts as prose, and what does not
 * ---------------------------------------
 * A string is translatable when a Chinese-speaking reader would expect to read
 * it in Chinese:
 *
 *   - copy attributes (`description`, `lead`, `ariaLabel`, …) on any element
 *     that renders documentation chrome, plus any copy attribute long enough to
 *     be a sentence rather than a label;
 *   - text nodes with four or more words — captions, notes and paragraphs.
 *
 * A string is **not** translatable when it is code (`<Code>`, `<pre>`, `code`),
 * a styling or layout attribute (`className`, `variant`, `tone`, …), a
 * one-word fixture label inside a live sample ("Search"), or a value that is
 * really data (a number, a symbol, a date).
 *
 * The rule is deliberately conservative: a false negative shows an English
 * sentence in the Chinese Showcase (bad, and visible), a false positive asks a
 * translator to translate `flex items-center` (worse, and silent).
 */

/** Elements whose children are code, never prose. */
export const CODE_ELEMENTS = new Set(["Code", "code", "pre", "kbd", "samp", "var", "SyntaxHighlight"]);

/**
 * Table components whose row objects carry prose (`description`, `usage`).
 * Scoped to the element so a fixture object that happens to have a
 * `description` key in demo data is not mistaken for documentation.
 */
export const TABLE_ELEMENTS = new Set(["PropsTable", "TokenTable"]);

/**
 * Property names whose string values are prose even when they live in a
 * module-level constant rather than in JSX.
 *
 * A document page keeps its tables and card lists in arrays —
 * `{ title: "Quiet at rest, alive on interaction", body: "…" }` — and renders
 * them through a `.map()`. Those sentences are as visible as a paragraph, so the
 * coverage check has to see them. The four-or-more-word rule keeps fixture data
 * out: a chart legend entry is a label, not a sentence.
 */
export const DATA_PROSE_KEYS = new Set([
  "title",
  "description",
  "usage",
  "note",
  "body",
  "hint",
  "detail",
  "summary",
  "lead",
  "purpose",
  "dataContract",
  "configuration",
  "lifecycle",
  "limitations",
  "label",
  "error",
  "placeholder",
  // Data keys that are prose in practice across the documentation pages: a
  // capability table's `need`/`why`, a token table's `sample`, a tier's
  // `examples`/`rule`, a card's `copy`.
  "need",
  "why",
  "sample",
  "rule",
  "examples",
  "copy",
  "text",
  "use",
  "avoid",
  "premise",
  "where",
  "meaning",
  /*
   * The three sizing sentences of a visual element manifest.
   *
   * `sizing: { intrinsic, preferred, minimum }` is rendered verbatim in a study
   * frame, so it is prose a reader reads — and the key names are the manifest's own
   * vocabulary (`intrinsic` size, `preferred` size, `minimum` size), which is why
   * they are listed rather than renamed.
   */
  "intrinsic",
  "preferred",
  "minimum",
  "what",
  "case",
  "header",
  /*
   * Keys a *content* module uses for prose that is rendered verbatim.
   *
   * The list above was written for documentation tables; these were added after
   * a measurement failure. Sixteen reference products put their copy in
   * domain-shaped data files — an article's `standfirst`, a testimonial's
   * `quote`, a quiz `question`, a plan's `features` — and none of those key
   * names was watched, so the strings were never required, never translated, and
   * shipped in English on the Chinese page. The static coverage number said
   * 148/148 while the rendered page said otherwise; the live rendering check is
   * what caught it. Listing the keys is the fix that makes the static number
   * mean what it claims.
   */
  "standfirst",
  "quote",
  "question",
  "answer",
  "features",
  "prompt",
  "caption",
]);

/**
 * The explicit, reviewable escape hatch.
 *
 * A handful of strings that sit in a prose position are not prose: a code
 * sample set in the mono face, a list of token names, a fixture's timestamp and
 * instrument code. Translating them would be *wrong* — a Chinese reader needs
 * `--radius-xs` to stay `--radius-xs` — so they are listed here with the reason,
 * counted in the report, and skipped by every consumer of this module.
 *
 * Adding an entry is a deliberate act with a written justification. There is no
 * wildcard: a sentence that is merely inconvenient does not belong here.
 */
export const PROSE_EXEMPTS = new Map([
  [
    "⌘↵",
    "a key chord, set in the keyboard face — there is nothing to translate and a Chinese reader needs the keys",
  ],
  ["btc_1d_close = 109241", "a code sample, set in the mono face as a specimen"],
  ["border.focus / accent", "token names"],
  ["theme · true · symbol-url", "attribute values, not prose"],
  ["05:02 · RP01", "a fixture timestamp with a dataset code"],
  ["05:10 · Lark", "a fixture timestamp with a provider name"],
  ["plugin: llama-index", "a package identifier"],
  /*
   * Phase 9: a Playground's generated code and its fixture data.
   *
   * The extractor reaches these because a Playground builds JavaScript source
   * out of string fragments and renders sample values through real components.
   * A translated `const series = [` would be broken code, and a translated
   * metric name would be invented data — both worse than the English a
   * developer already reads in either locale.
   */
  ["const series = [", "a JavaScript fragment in a Playground's generated code"],
  ["const rows = [", "a JavaScript fragment in a Playground's generated code"],
  ["<CardTitle>Alpha decay</CardTitle>", "sample data inside a Card Playground"],
  ["<CardDescription>Rank IC</CardDescription>", "sample data inside a Card Playground"],
  ['<Text variant="caption" as="p">Updated 2026-10-09</Text>', "sample data inside a Card Playground"],
  /*
   * Phase 10A. Three strings that sit in prose positions and are not prose.
   *
   * The first three are SVG path data: the Organic Contemporary study draws its
   * terraces as paths, and a path is geometry — translating a coordinate would
   * move the drawing, which is the opposite of what translation is for. The
   * placeholder and the measurement are the other two cases: the placeholder
   * deliberately lists a search term in *both* languages (so a Chinese reader can
   * see that English words work too), and the annotation is a number with a unit,
   * where the unit is the same in either language and the number must not change.
   */
  [
    "M -40 300 C 120 232 220 268 360 214 C 470 172 560 188 680 150",
    "SVG path data in the Organic Contemporary study — geometry, not prose",
  ],
  [
    "M -40 268 C 140 214 250 240 390 182 C 486 142 570 156 680 118",
    "SVG path data in the Organic Contemporary study — geometry, not prose",
  ],
  [
    "M -40 214 C 150 176 268 196 404 138 C 496 98 578 112 680 74",
    "SVG path data in the Organic Contemporary study — geometry, not prose",
  ],
  [
    "Rating, 折线图, kanban, datagrid…",
    "a search placeholder that already shows both languages; translating it would remove the English example",
  ],
  ["6 kB → 95 ms (±7)", "a measurement: the number, the unit and the symbol are identical in either language"],
  /*
   * Forms review. Interval tokens used as a control's visible label.
   *
   * `Radio` is a documentation element, so a short `label` on it is treated as
   * prose without a verb — which is right for "Monthly" and wrong for `1d`: the
   * token names a candle interval, it is the value the API expects, and it is the
   * same three characters in either language. Translating it would break the
   * correspondence between the control, the code beside it and the chart it
   * selects.
   */
  ["1h", "a candle interval, used as a control label — an identifier, not prose"],
  ["1d", "a candle interval, used as a control label — an identifier, not prose"],
  ["1w", "a candle interval, used as a control label — an identifier, not prose"],
]);

/**
 * Attributes that carry human copy. `title` is included because documentation
 * sections are titled with it; it is filtered by word count on non-docs
 * elements so a fixture like `label="Search"` is not pulled in.
 */
export const COPY_ATTRS = new Set([
  "title",
  "subtitle",
  "heading",
  "label",
  "eyebrow",
  "description",
  "lead",
  "caption",
  "note",
  "hint",
  "error",
  "message",
  "summary",
  "placeholder",
  "emptyText",
  "emptyDescription",
  "content",
  "useCase",
  "ariaLabel",
  "aria-label",
  "aria-description",
  "ariaDescription",
  "meta",
  "header",
  "case",
  /*
   * The two copy attributes `ExperienceFrame` takes.
   *
   * They are listed here rather than renamed because the names are the API: a
   * reference experience has a *journey* the browser test drives and an
   * *appearance* it pins, and calling them `description`/`note` to satisfy an
   * extractor would be the tail wagging the dog. Listing them means the checker
   * requires a Chinese rendering for every one of the sixteen, which is what
   * makes the coverage claim true rather than approximately true.
   */
  "journey",
  "appearance",
]);

/**
 * Attributes that are never copy. An explicit list beats a clever heuristic:
 * a new styling prop is then a one-line change here rather than a silent
 * translation of a class string.
 */
export const SKIP_ATTRS = new Set([
  "className",
  "class",
  "stageClassName",
  "code",
  "href",
  "src",
  "alt",
  "id",
  "key",
  "name",
  "type",
  "value",
  "defaultValue",
  "variant",
  "size",
  "tone",
  "layout",
  "icon",
  "as",
  "tag",
  "role",
  "target",
  "rel",
  "format",
  "unit",
  "locale",
  "xKey",
  "yKey",
  "columnId",
  "palette",
  "mode",
  "side",
  "orientation",
  "status",
  "kind",
  "density",
  "symbol",
  "minSize",
  "align",
  "justify",
  "width",
  "height",
  "range",
  "state",
  "data-testid",
  "aria-hidden",
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-haspopup",
  "aria-live",
  "aria-current",
  "step",
  "min",
  "max",
]);

/**
 * Elements that render documentation chrome. A short copy attribute on one of
 * these is prose even without a verb ("The model"), because the element exists
 * to explain something.
 */
export const DOC_ELEMENTS = new Set([
  "Section",
  "SubSection",
  "Demo",
  /*
   * The Components V2 example.
   *
   * `Demo` was listed from the start — it is documentation chrome, so a short
   * `title` on it is prose even without a verb. `Example` is the same idea with
   * a different reading path, and leaving it out was not a policy: it was an
   * omission, and it is why "Bare rows", "Featured run" and "Portfolio overview"
   * could sit on a Chinese page in English while this check reported 100%. A
   * one-word example title is a name for a capability, which is exactly what a
   * reader needs translated.
   */
  "Example",
  "DemoShell",
  "PageHeader",
  "ChartPanel",
  "Callout",
  "Field",
  "FormField",
  "FormSection",
  "Fieldset",
  "EmptyState",
  "ErrorState",
  "Alert",
  "AlertDialog",
  "Tooltip",
  "HoverCard",
  "CommandMenu",
  "DataDetails",
  "PaletteRow",
  "WorkspacePaneHeader",
  "InspectorPane",
  "InspectorSection",
  "InspectorRow",
  "ControlRow",
  "Checkbox",
  "Radio",
  "Switch",
  "SelectItem",
  "Rating",
  "TradingViewTile",
  "TokenTable",
  "PropsTable",
  "DataTable",
]);

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&times;": "×",
  "&middot;": "·",
  "&minus;": "−",
  "&copy;": "©",
};

/** JSX text arrives with HTML entities intact; the dictionary is plain text. */
export function decodeEntities(text) {
  return text.replace(/&[a-zA-Z#0-9]+;/g, (match) => ENTITIES[match] ?? match);
}

/** One canonical form for a source sentence: collapsed whitespace, trimmed. */
export function normalize(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return normalize(text).split(" ").filter(Boolean).length;
}

/**
 * Is this string *code* rather than prose?
 *
 * The array rule below collects a sentence-shaped literal wherever it is written,
 * because an array element has no property name to key on. That rule is right for
 * `{["Tooltips — markup, typography, …"]}` and wrong for a code sample, and a
 * code sample is exactly what a Showcase is full of: a usage snippet is built as
 * an array of source lines, and every one of them is several words long.
 *
 *   const usageSnippet = () => [
 *     'import { Visual } from "@luc/ui/charts"',   // ← not prose
 *     'import "@luc/ui/styles.css"',
 *   ].join("\n");
 *
 * Before this test existed, those two lines were counted as documentation prose
 * on **every** route, so `verify:i18n` demanded a Chinese rendering of an import
 * statement — and the honest fix is not to invent one.
 *
 * The test is deliberately narrow: two shapes that cannot be a sentence in this
 * repository, both anchored at the start so a sentence that merely *mentions*
 * `import` stays prose ("Import the stylesheet once at the app root.").
 */
export function isCodeString(text) {
  const value = text.trim();
  if (!value) return false;
  /*
   * A module statement, single- or multi-line:
   *   import { Visual } from "@luc/ui/charts";
   *   import {
   *     Visual,
   *   } from "@luc/ui/charts";
   *   import "@luc/ui/styles.css";
   *   export { default } from "./x";
   */
  if (/^(?:import|export)\b/.test(value)) return true;
  /*
   * A JSX/HTML line. `normalize()` has already collapsed the newlines inside a
   * multi-line element, so `"<Visual\n  elementId=\"x\"\n/>"` arrives here as
   * `<Visual elementId="x" />` and has to be caught by the tag shape.
   */
  if (/^<\/?[A-Za-z][\w.:-]*[\s/>]/.test(value)) return true;
  return false;
}

/** A string that reads like a sentence rather than a label or a value. */
function isSentence(text) {
  const value = normalize(text);
  if (value.length < 4) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\s/.test(value)) return false;
  return wordCount(value) >= 4;
}

/**
 * A shorter bar for a property inside a documentation data array.
 *
 * `usage: "Dialogs, popovers, tooltips."` is prose at three words — a table
 * cell a reader reads, not a fixture. The four-word rule exists to keep a
 * chart's inline sample data out of the dictionary; inside a page's own
 * documented tables there is nothing to protect against, and a missed three-word
 * cell is exactly the kind of leak that survives a page-by-page review.
 */
function isDataProse(text) {
  const value = normalize(text);
  if (value.length < 10) return false;
  /*
   * A class list is not prose. `"flex items-center gap-3"` is an element of an
   * array in every component file, and asking a translator for it would be
   * absurd; the shape test is what keeps that array rule usable.
   */
  if (/^[a-z0-9-_:/\[\].% ]+$/.test(value)) return false;
  if (/^(?:[a-z-]+:)?[a-z0-9-]+(?: [a-z0-9-]+)+$/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\s/.test(value)) return false;
  if (/^[a-z0-9_.-]+$/.test(value)) return false;
  return wordCount(value) >= 2;
}

/**
 * Extract every translatable string from a page's source.
 *
 * Returns `{ text, kind, start, end }` where `start`/`end` are character
 * offsets into `source` that a codemod can replace. Kinds:
 *
 *   `attr`     — a copy attribute value (`description="…"`)
 *   `text`     — a JSX text node (`<p>Some prose.</p>`)
 *   `wrapped`  — a sentence already inside `tcs("…")`, which only needs a
 *                dictionary entry
 *   `propRow`  — a `description` in a `PropsTable` row; localised inside the
 *                table component, so it needs a dictionary entry but no rewrite
 *   `data`     — a prose property in a module-level constant; the render site
 *                decides whether it is wrapped or looked up by the component
 */
export function extractProse(ts, source, fileName = "page.tsx") {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = [];

  const exempt = (text) => PROSE_EXEMPTS.has(normalize(text));

  const push = (node, kind, textOverride) => {
    const raw = textOverride ?? node.getText(sf);
    const text = normalize(
      kind === "text" ? raw : typeof textOverride === "string" ? textOverride : raw,
    );
    if (!text) return;
    found.push({ text, kind, start: node.getStart(sf), end: node.getEnd() });
  };

  const visit = (node, codeDepth, tableOwner) => {
    /*
     * A sentence that already goes through `tcs` still has to exist in the
     * dictionary — that is the whole measurement. Collecting it here is what
     * stops the coverage number from collapsing to zero the moment the codemod
     * has run.
     */
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "tcs" &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const argument = node.arguments[0];
      if (!exempt(argument.text)) found.push({
        text: normalize(argument.text),
        kind: "wrapped",
        start: argument.getStart(sf),
        end: argument.getEnd(),
      });
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = (ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName).getText(sf);
      const nextDepth = codeDepth + (CODE_ELEMENTS.has(tagName) ? 1 : 0);
      const nextTable = TABLE_ELEMENTS.has(tagName) ? tagName : null;
      const attributes = ts.isJsxElement(node)
        ? node.openingElement.attributes
        : node.attributes;
      for (const property of attributes.properties) {
        if (!ts.isJsxAttribute(property) || !property.initializer) continue;
        if (!ts.isStringLiteral(property.initializer)) continue;
        const name = property.name.getText(sf);
        if (SKIP_ATTRS.has(name)) continue;
        if (!COPY_ATTRS.has(name)) continue;
        // `PageHeader` titles and leads are localised by the route dictionary
        // (`lib/i18n/routes.zh.ts`), which is keyed by route rather than by
        // source text — a page header is unique copy, not a shared sentence.
        if (tagName === "PageHeader" && (name === "title" || name === "lead")) continue;
        const value = normalize(property.initializer.text);
        if (!value) continue;
        if (exempt(value)) continue;
        if (!(DOC_ELEMENTS.has(tagName) || isSentence(value))) continue;
        found.push({
          text: value,
          kind: "attr",
          start: property.initializer.getStart(sf),
          end: property.initializer.getEnd(),
        });
      }
      ts.forEachChild(node, (child) => visit(child, nextDepth, nextTable));
      return;
    }
    if (ts.isJsxText(node) && codeDepth === 0) {
      const text = normalize(node.text);
      if (isSentence(text) && !exempt(text)) {
        found.push({ text, kind: "text", start: node.getStart(sf), end: node.getEnd() });
      }
    }
    // `PropsTable` rows are objects, not attributes: `{ name, type, description }`.
    if (
      tableOwner &&
      ts.isPropertyAssignment(node) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      (node.name.text === "description" || node.name.text === "usage") &&
      ts.isStringLiteral(node.initializer) &&
      isSentence(node.initializer.text)
    ) {
      found.push({
        text: normalize(node.initializer.text),
        kind: "propRow",
        start: node.initializer.getStart(sf),
        end: node.initializer.getEnd(),
      });
    }
    if (
      ts.isPropertyAssignment(node) &&
      node.name &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      DATA_PROSE_KEYS.has(ts.isIdentifier(node.name) ? node.name.text : node.name.text) &&
      ts.isStringLiteral(node.initializer) &&
      isDataProse(node.initializer.text) &&
      !isCodeString(node.initializer.text) &&
      !exempt(node.initializer.text)
    ) {
      found.push({
        text: normalize(node.initializer.text),
        kind: "data",
        start: node.initializer.getStart(sf),
        end: node.initializer.getEnd(),
      });
    }
    /*
     * A literal inside an array — `{["Tooltips — markup, typography, …"]}` — is
     * the one prose shape with no property name to key on. The two-word bar
     * keeps a fixture list of tickers out; a sentence-shaped element is prose
     * wherever it is written.
     */
    if (
      ts.isArrayLiteralExpression(node) &&
      node.elements.some(
        (element) =>
          ts.isStringLiteral(element) && isDataProse(element.text) && !isCodeString(element.text),
      )
    ) {
      for (const element of node.elements) {
        if (!ts.isStringLiteral(element)) continue;
        if (!isDataProse(element.text) || isCodeString(element.text) || exempt(element.text)) continue;
        found.push({
          text: normalize(element.text),
          kind: "data",
          start: element.getStart(sf),
          end: element.getEnd(),
        });
      }
    }
    ts.forEachChild(node, (child) => visit(child, codeDepth, tableOwner));
  };

  visit(sf, 0, null);
  return found;
}
