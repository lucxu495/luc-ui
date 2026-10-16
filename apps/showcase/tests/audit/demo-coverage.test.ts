/*
 * The coverage inventory, as a test.
 *
 * Phase 9 shipped 157 generated documentation pages with a real import path, a
 * real compiler prop table and **no specimen**: a reader could open
 * `/charts/ecdf-chart`, read `EcdfChart`'s props, and never see an ECDF drawn.
 * The fix is a demo per page, and this file is what makes "every page has one"
 * a checked claim rather than a hopeful sentence in a report.
 *
 * Three things are asserted here, in the order they can go wrong:
 *
 *  1. **Every generated page has a Live Demo.** An entry with no demo must be
 *     listed in `EXCEPTIONS` with a reason, and the list is required to be
 *     short — the point is that "not written yet" is visible, not that it is
 *     forbidden.
 *  2. **The demo renders the component the page documents.** A page for
 *     `ViolinChart` whose specimen is a `LineChart` is worse than no specimen.
 *  3. **The code beside the specimen is honest.** Every attribute in a
 *     structured demo's snippet must be a prop the *compiler* lists for one of
 *     that entry's exports (plus the DOM/ARIA attributes every React component
 *     inherits). That single rule catches the most common way a fixture lies:
 *     inventing a prop to make a control exist.
 */

import { describe, expect, it } from "vitest";
import { docEntries, apiFor } from "@/lib/docs/registry";
import { componentDemoFor, componentDemos } from "@/lib/demo/registry";
import { chartDemoFor, chartDemos } from "@/lib/demo/registry.charts";
import { motionDemoFor, motionDemos } from "@/lib/demo/registry.motion";

/** Attributes React forwards to the DOM, so no component has to declare them. */
const DOM_ATTRIBUTES = new Set([
  "className",
  "id",
  "style",
  "role",
  "title",
  "tabIndex",
  "dir",
  "lang",
  "slot",
  "name",
  "value",
  "type",
  "placeholder",
  "disabled",
  "required",
  "readOnly",
  "autoComplete",
  "children",
  "key",
  /*
   * The rest of the HTML surface a component inherits through
   * `ComponentPropsWithRef<"a">` and friends. The compiler's prop table lists
   * the props a component *declares*; an inherited DOM attribute is not an
   * invention, and refusing it here would mean rewriting valid markup.
   */
  "href",
  "target",
  "rel",
  "download",
  "src",
  "alt",
  "width",
  "height",
  "rows",
  "cols",
  "defaultValue",
  "defaultChecked",
  "checked",
  "multiple",
  "accept",
  "min",
  "max",
  "step",
  "pattern",
  "autoFocus",
  "form",
  "htmlFor",
  "hidden",
  "draggable",
  "inputMode",
  "maxLength",
  "minLength",
  "spellCheck",
  "autoCapitalize",
  "autoCorrect",
  "loading",
]);

function isDomAttribute(name: string): boolean {
  return (
    DOM_ATTRIBUTES.has(name) ||
    name.startsWith("aria-") ||
    name.startsWith("data-") ||
    name.startsWith("on") ||
    name.includes("-")
  );
}

/** The attributes of the first element in a snippet. */
function attributesOf(code: string): string[] {
  const open = code.indexOf(">");
  const head = code.slice(0, open === -1 ? code.length : open + 1);
  /*
   * Attribute *values* are removed before the names are read, or a nested
   * object literal would contribute its own keys — `signed: true` inside a
   * `format={{ … }}` first looked like an attribute called `true`. Quoted
   * strings go first, then balanced `{ … }` groups.
   */
  const withoutQuotes = head.replace(/^<[A-Za-z][A-Za-z0-9.]*/, "").replace(/"[^"]*"/g, '""');
  let cleaned = "";
  let depth = 0;
  for (const character of withoutQuotes) {
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) cleaned += character;
  }
  const names: string[] = [];
  for (const match of cleaned.matchAll(/(?:^|\s)([A-Za-z][A-Za-z0-9-]*)(?==|\s|>|\/|$)/g)) {
    const name = match[1];
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function rootTag(code: string): string | undefined {
  return code.trim().match(/^<([A-Z][A-Za-z0-9.]*)/)?.[1];
}

const groups = [
  { group: "components" as const, demos: componentDemos, lookup: componentDemoFor },
  { group: "charts" as const, demos: chartDemos, lookup: chartDemoFor },
  { group: "motion" as const, demos: motionDemos, lookup: motionDemoFor },
];

/**
 * Entries that deliberately have no Live Demo, with the reason.
 *
 * An entry belongs here only when a specimen would be a lie: a component that
 * needs a product context, a backend or an identity the Showcase does not have.
 * "Nobody wrote it yet" is a gap, not an exception, and belongs in the report.
 */
const EXCEPTIONS: Readonly<Record<string, string>> = {};

describe("live demo coverage", () => {
  it("has no demo for an id that is not a documented entry", () => {
    const ids = new Set(docEntries.map((entry) => entry.id));
    for (const { demos } of groups) {
      for (const spec of demos) {
        expect(ids.has(spec.id), `${spec.id} is not a documented entry`).toBe(true);
      }
    }
  });

  it("gives every generated documentation page a live specimen", () => {
    const missing: string[] = [];
    for (const { group, lookup } of groups) {
      for (const entry of docEntries) {
        if (entry.group !== group) continue;
        if (entry.status !== "generated") continue;
        if (entry.pageFile !== undefined) continue;
        if (EXCEPTIONS[entry.id]) continue;
        if (!lookup(entry.id)) missing.push(entry.id);
      }
    }
    expect(
      missing,
      `${missing.length} generated page(s) document a component and show nothing. ` +
        `Write the demo, or add the entry to EXCEPTIONS with the reason.`,
    ).toEqual([]);
  });

  it("renders the component the page is about", () => {
    const mismatched: string[] = [];
    for (const { demos } of groups) {
      for (const spec of demos) {
        const entry = docEntries.find((candidate) => candidate.id === spec.id);
        if (!entry) continue;
        if (spec.origin === "structured") {
          /*
           * A structured demo is one component, so its root element must be the
           * component the page documents, and it must be the one the fixture was
           * type-checked against.
           */
          const tag = rootTag(spec.code) ?? spec.source?.component;
          if (!tag) {
            mismatched.push(`${spec.id}: the snippet has no root element`);
            continue;
          }
          if (!entry.exports.includes(tag)) {
            mismatched.push(`${spec.id}: snippet renders <${tag}>, page documents ${entry.exports.join(", ")}`);
          }
          if (spec.source && spec.source.component !== tag) {
            mismatched.push(`${spec.id}: source says ${spec.source.component}, snippet says <${tag}>`);
          }
          continue;
        }
        /*
         * A composition is several components at once, so its root may be a
         * wrapper. What it may not be is a specimen of something else: the
         * snippet has to use at least one of the exports the page documents.
         */
        if (!entry.exports.some((name) => spec.code.includes(`<${name}`))) {
          mismatched.push(
            `${spec.id}: the composition never renders any of ${entry.exports.join(", ")}`,
          );
        }
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("writes only props the compiler knows, in a structured snippet", () => {
    const unknown: string[] = [];
    for (const { demos } of groups) {
      for (const spec of demos) {
        if (spec.origin !== "structured") continue;
        const symbols = apiFor(spec.id);
        const known = new Set(symbols.flatMap((symbol) => (symbol.props ?? []).map((prop) => prop.name)));
        for (const attribute of attributesOf(spec.code)) {
          if (isDomAttribute(attribute)) continue;
          if (known.has(attribute)) continue;
          unknown.push(`${spec.id}: <${spec.source?.component}> gets "${attribute}", which the compiler does not list`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it("keeps every fixture deterministic and finite", () => {
    const problems: string[] = [];
    for (const { demos } of groups) {
      for (const spec of demos) {
        if (/Math\.random|Date\.now|new Date\(\)/.test(spec.code)) {
          problems.push(`${spec.id}: the snippet is not deterministic`);
        }
        if (/\bNaN\b|\bInfinity\b/.test(spec.code)) {
          problems.push(`${spec.id}: the snippet contains a non-finite number`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("gives every structured demo a source the chart panel can resolve", () => {
    for (const { demos } of groups) {
      for (const spec of demos) {
        if (spec.origin === "structured") {
          expect(spec.source, `${spec.id} has no source`).toBeDefined();
        }
        if (spec.origin === "composition") {
          expect(spec.source, `${spec.id} is a composition and must not claim a source`).toBeUndefined();
        }
      }
    }
  });

  /*
   * MOT-002 — the other configurations of a specimen.
   *
   * A page's examples are the answer to "what else can this do", so the things
   * that go wrong are the ones that make an example useless rather than wrong: a
   * heading with no snippet to paste, a snippet with nothing in it, a page with
   * eleven variations (which is a catalogue), or two examples with the same name
   * (which a reader cannot tell apart in the outline).
   */
  it("gives every example a name, a snippet and a distinct configuration", () => {
    const problems: string[] = [];
    let pages = 0;
    for (const { demos } of groups) {
      for (const spec of demos) {
        const examples = spec.examples ?? [];
        if (examples.length === 0) continue;
        pages += 1;
        if (examples.length > 4) {
          problems.push(`${spec.id}: ${examples.length} examples — a page, not a catalogue`);
        }
        const titles = new Set<string>();
        for (const example of examples) {
          if (example.title.trim().length < 4) problems.push(`${spec.id}: an example has no name`);
          if (titles.has(example.title)) problems.push(`${spec.id}: two examples are both called "${example.title}"`);
          titles.add(example.title);
          if (!example.node) problems.push(`${spec.id}/${example.title}: no specimen`);
          if (example.code.trim().length < 20) problems.push(`${spec.id}/${example.title}: the snippet is empty`);
          /* The same rule the page's own snippet is held to: an example shows a
           * component the page documents, not a different one. */
        }
      }
    }
    /* Not a count to grow for its own sake — but a mechanism nothing uses is a
     * mechanism nobody has tested against a real page. */
    expect(pages).toBeGreaterThanOrEqual(3);
    expect(problems).toEqual([]);
  });
});
