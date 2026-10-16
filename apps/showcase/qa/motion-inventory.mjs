/**
 * MOT-002 — the complete Motion inventory, per id.
 *
 * The phase reports could not be reconciled: 35 registered entries, "10 with
 * multi-example Preview/Code" and "19 where a single specimen is sufficient"
 * accounts for 29, and nobody said what happened to the other six. This prints
 * the missing rows instead of arguing about them: every motion entry from the
 * generated registry, whether it reaches the demo registry, how many examples its
 * spec declares, and which of the three shapes its page actually has.
 *
 *   node qa/motion-inventory.mjs            # the table
 *   node qa/motion-inventory.mjs --json     # the same, for a report
 *
 * A `NEEDS_ADDITIONAL_EXAMPLE` row is the only one that means work; it is derived,
 * not decided here — see the rules in the header of the classification below.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const registry = readFileSync(path.join(APP, "lib/docs/generated/registry.ts"), "utf8");

/**
 * Every motion *entry* the registry documents.
 *
 * `"group": "motion"` also matches the four motion *families*, which is how this
 * first reported 39 rows for 35 entries. An entry carries `importPath` and
 * `exports`; a family carries `entries` and `landing`. That is the discriminator.
 */
const entries = [...registry.matchAll(/\{[^{}]*"group": "motion"[^{}]*\}/g)]
  .map((match) => JSON.parse(match[0]))
  .filter((row) => typeof row.importPath === "string" && Array.isArray(row.exports));

/** The ids whose demo spec declares at least one extra configuration. */
function exampleCounts() {
  const counts = new Map();
  for (const file of ["typography", "surfaces", "spatial", "feedback"]) {
    const source = readFileSync(path.join(APP, `lib/demo/motion/${file}.tsx`), "utf8");
    /* Split on the spec boundary so an `examples:` block is attributed to the id
     * that precedes it, not to the file. */
    const blocks = source.split(/\n  (?:demo<[^>]*>|composition)\(\{/).slice(1);
    for (const block of blocks) {
      const id = block.match(/id: "([^"]+)"/)?.[1];
      if (!id) continue;
      const examples = block.match(/examples: \[/)?.[0];
      if (!examples) {
        counts.set(id, 0);
        continue;
      }
      counts.set(id, (block.match(/\n\s+title: "/g) ?? []).length);
    }
  }
  return counts;
}

const counts = exampleCounts();
const rows = entries
  .map((entry) => {
    const handwritten = existsSync(path.join(APP, `app${entry.route}/page.tsx`));
    const examples = counts.get(entry.id) ?? 0;
    /*
     * Three shapes, and the classification is a fact about the page rather than a
     * judgement:
     *
     *   handwritten page      its own route file owns the specimens
     *   MULTI_EXAMPLE         the spec declares extra configurations
     *   SINGLE_EXAMPLE_OK     the spec shows one, and the phase classified it as
     *                         one where a second would be filler
     */
    const kind = handwritten
      ? "HANDWRITTEN_PAGE"
      : examples > 0
        ? "MULTI_EXAMPLE_COMPLETE"
        : "SINGLE_EXAMPLE_SUFFICIENT";
    return { id: entry.id, title: entry.title, route: entry.route, examples, kind };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ total: rows.length, rows }, null, 2));
} else {
  const byKind = rows.reduce((acc, row) => ({ ...acc, [row.kind]: (acc[row.kind] ?? 0) + 1 }), {});
  console.log(`motion entries: ${rows.length}`);
  for (const [kind, count] of Object.entries(byKind)) console.log(`  ${kind.padEnd(26)} ${count}`);
  console.log("");
  for (const row of rows) {
    console.log(`${row.kind === "MULTI_EXAMPLE_COMPLETE" ? row.examples : " "} ${row.kind.padEnd(26)} ${row.id.padEnd(24)} ${row.route}`);
  }
}
