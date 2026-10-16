/**
 * Merge handoff dictionaries into the Chinese prose dictionary.
 *
 * Each documentation agent writes its sentences into its own file under
 * `docs/audits/phase-9/i18n/` — one writer per file, so parallel work never
 * collides — and this script performs the single write into
 * `lib/i18n/prose.zh.ts`. The alternative (every agent editing one dictionary)
 * is how a translation gets silently overwritten by the next agent's patch.
 *
 *   node apps/showcase/scripts/i18n-merge.mjs            # report only
 *   node apps/showcase/scripts/i18n-merge.mjs --write    # apply
 *
 * It is deliberately conservative:
 *
 *  - a sentence that already has a rendering is left alone (a later agent may
 *    not overwrite an earlier one);
 *  - a pair with an empty or English-looking Chinese side is refused;
 *  - identical keys inside one file are collapsed, and the file is reported.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
/*
 * Two handoff directories, one writer.
 *
 * Phase 9's agents wrote into `phase-9/i18n/`; Phase 9 Hardening's write into
 * `phase-9-hardening/i18n/`. Both are the same mechanism — one file per agent,
 * merged by this script so no two agents ever patch the dictionary at once —
 * and keeping the older directory readable means a sentence an earlier agent
 * owed can still land without being retyped.
 *
 * Phase 10A and 10B used the same mechanism, and their directories are gone:
 * those phases built the Visuals product, and their handoffs and dictionaries
 * moved with it to the `luc-visuals` repository. Nothing is owed from them here.
 */
const handoffDirs = [
  path.join(appRoot, "../../docs/audits/phase-9/i18n"),
  path.join(appRoot, "../../docs/audits/phase-9-hardening/i18n"),
  path.join(appRoot, "../../docs/audits/phase-9-5/i18n"),
];
const prosePath = path.join(appRoot, "lib/i18n/prose.zh.ts");
const END_MARKER = "  /* ---- end of dictionary ---- */";

const write = process.argv.includes("--write");

/** Existing keys, read the same way the coverage checker reads them. */
function existingKeys(source) {
  const keys = new Set();
  for (const match of source.matchAll(/^ {2}"((?:[^"\\]|\\.)*)"\s*:\s*"/gm)) {
    keys.add(match[1].replace(/\\(["\\])/g, "$1"));
  }
  return keys;
}

function escape(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Keys that describe the handoff rather than carrying a translation. */
const METADATA_KEYS = [
  "agent",
  "surface",
  "since",
  "sources",
  "merge",
  "note",
  "leftUntranslatedOnPurpose",
  "unresolved",
];

/**
 * Accept the shapes agents actually write — and *find* them rather than being
 * told where they are.
 *
 *   { "sentence in English": "中文" }
 *   { "sentences": [{ "en": "…", "zh": "…" }] }
 *   { "sentences": { "…": "…" } }
 *   { "elementRegistry": { "…": "…" }, "uiStrings": { "…": "…" } }
 *
 * The third was once refused as "no Chinese characters" because the key
 * `sentences` was taken for a sentence, and the fourth was refused for the same
 * reason: a translator who groups their work by surface writes a container, and
 * a merge tool that loses that work over a shape it did not anticipate is worse
 * than one that reads four. So a container is now simply walked — any object
 * whose values are all strings is a set of pairs, whatever it is called — and
 * the keys that describe the handoff are skipped by name.
 *
 * Arrays of `{en, zh}` are still read, because that is the one shape that is not
 * a map at all. Anything else (a nested list of notes, a version string) carries
 * no pairs and contributes none.
 */
function pairsFrom(json) {
  const pairs = [];
  const walk = (node, depth) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === "object" && "en" in item && "zh" in item) {
          pairs.push([String(item.en ?? ""), String(item.zh ?? "")]);
        }
      }
      return;
    }
    if (!node || typeof node !== "object" || depth > 3) return;
    const entries = Object.entries(node);
    const isStringMap = entries.every(([, value]) => typeof value === "string");
    if (isStringMap) {
      for (const [key, value] of entries) {
        if (METADATA_KEYS.includes(key)) continue;
        pairs.push([key, value]);
      }
      return;
    }
    for (const [key, value] of entries) {
      if (METADATA_KEYS.includes(key)) continue;
      walk(value, depth + 1);
    }
  };
  walk(json, 0);
  return pairs;
}

const prose = await readFile(prosePath, "utf8");
const known = existingKeys(prose);

const files = (
  await Promise.all(
    handoffDirs.map(async (dir) =>
      (await readdir(dir).catch(() => []))
        .filter((name) => name.endsWith(".json"))
        .map((name) => path.join(dir, name)),
    ),
  )
)
  .flat()
  .sort();
const added = [];
const skipped = [];
const rejected = [];

for (const file of files) {
  const raw = JSON.parse(await readFile(file, "utf8"));
  const seen = new Set();
  const block = [];
  for (const [en, zh] of pairsFrom(raw)) {
    const source = en.replace(/\s+/g, " ").trim();
    const target = zh.replace(/\s+/g, " ").trim();
    if (!source || !target) {
      rejected.push(`${file}: empty pair`);
      continue;
    }
    if (seen.has(source)) {
      rejected.push(`${file}: duplicate key in file — ${source.slice(0, 60)}`);
      continue;
    }
    seen.add(source);
    if (known.has(source)) {
      skipped.push(`${file}: already translated — ${source.slice(0, 60)}`);
      continue;
    }
    /* A rendering that is still mostly ASCII is almost always an unfinished
     * translation, and silent English is exactly what this dictionary exists to
     * prevent. */
    if (!/[\u3400-\u9fff]/.test(target)) {
      rejected.push(`${file}: no Chinese characters — ${source.slice(0, 60)}`);
      continue;
    }
    block.push(`  ${JSON.stringify(source)}: ${JSON.stringify(target)},`);
    known.add(source);
  }
  if (block.length) added.push([file, block]);
}

const total = added.reduce((count, [, block]) => count + block.length, 0);
console.log(`  handoff files        : ${files.length}`);
console.log(`  new sentences        : ${total}`);
console.log(`  already translated   : ${skipped.length}`);
console.log(`  refused              : ${rejected.length}`);
for (const item of rejected) console.log(`    ! ${item}`);

if (!write) {
  console.log("dry run — pass --write to apply");
  process.exit(0);
}

if (total === 0) {
  console.log("nothing to write");
  process.exit(0);
}

const insertion = added
  .flatMap(([file, block]) => [
    ``,
    `  /* ---- ${path.basename(file).replace(/\.json$/, "")} ---- */`,
    ...block,
  ])
  .join("\n");

if (!prose.includes(END_MARKER)) {
  console.error(`i18n-merge: could not find the end marker in ${path.relative(appRoot, prosePath)}`);
  process.exit(1);
}

const next = prose.replace(END_MARKER, `${insertion}\n\n${END_MARKER}`);
await writeFile(prosePath, next, "utf8");
console.log(`  wrote ${total} sentence(s) into lib/i18n/prose.zh.ts`);
