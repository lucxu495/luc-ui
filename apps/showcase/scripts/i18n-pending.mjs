/**
 * The translator's worklist.
 *
 * Prints every documentation sentence that has no Chinese rendering yet, once
 * per unique sentence, grouped by the first route that uses it. Duplicates
 * across pages collapse, so the list is exactly the work, not the work plus its
 * repetitions.
 *
 *   node apps/showcase/scripts/i18n-pending.mjs            # human list
 *   node apps/showcase/scripts/i18n-pending.mjs --json     # machine list
 *   node apps/showcase/scripts/i18n-pending.mjs --count    # just the numbers
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { extractProse } from "./i18n-prose.mjs";
import { loadCatalogProse, loadTradingViewProse } from "./chart-catalog-strings.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");

async function collect(dir, match, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, match, out);
    else if (match(full)) out.push(full);
  }
  return out;
}

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
  const keys = new Set();
  for (const match of source.slice(open, end).matchAll(/^\s{2}"((?:[^"\\]|\\.)*)"\s*:\s*"/gm)) {
    keys.add(match[1].replace(/\\(["\\])/g, "$1"));
  }
  return keys;
}

const known = proseKeys(await readFile(path.join(appRoot, "lib/i18n/prose.zh.ts"), "utf8"));
const files = [
  ...(await collect(path.join(appRoot, "app"), (file) => file.endsWith(".tsx"))),
  ...(await collect(path.join(appRoot, "components"), (file) => file.endsWith(".tsx") || file.endsWith(".ts"))),
];

const pending = new Map();
let occurrences = 0;
// The chart registry is data; its prose is collected separately.
const catalog = await loadCatalogProse();
const providerStrings = await loadTradingViewProse();
for (const text of [...catalog.strings, ...providerStrings]) {
  occurrences += 1;
  if (known.has(text)) continue;
  const entry = pending.get(text) ?? {
    text,
    occurrences: 0,
    files: new Set(),
    kinds: new Set(),
  };
  entry.occurrences += 1;
  entry.files.add("components/charts/chart-catalog-data.ts");
  entry.kinds.add("data");
  pending.set(text, entry);
}
for (const file of files) {
  const source = await readFile(file, "utf8");
  const items = extractProse(ts, source, file);
  for (const item of items) {
    occurrences += 1;
    if (known.has(item.text)) continue;
    const entry = pending.get(item.text) ?? {
      text: item.text,
      occurrences: 0,
      files: new Set(),
      kinds: new Set(),
    };
    entry.occurrences += 1;
    entry.files.add(path.relative(appRoot, file));
    entry.kinds.add(item.kind);
    pending.set(item.text, entry);
  }
}

const list = [...pending.values()].sort(
  (a, b) => [...b.files][0].localeCompare([...a.files][0]) || b.occurrences - a.occurrences,
);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      list.map((entry) => ({
        text: entry.text,
        occurrences: entry.occurrences,
        files: [...entry.files],
        kinds: [...entry.kinds],
      })),
      null,
      1,
    ),
  );
} else if (process.argv.includes("--count")) {
  console.log(`pending unique sentences: ${list.length}`);
  console.log(`occurrences            : ${occurrences}`);
  console.log(`already translated     : ${known.size}`);
} else {
  let file = "";
  for (const entry of list) {
    const first = [...entry.files][0];
    if (first !== file) {
      file = first;
      console.log(`\n## ${file}`);
    }
    console.log(`  [${entry.occurrences}] ${entry.text}`);
  }
  console.log(`\n${list.length} pending unique sentence(s)`);
}
