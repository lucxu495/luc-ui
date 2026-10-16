/*
 * LEG-003 — one component inventory.
 *
 * Three documents describe the same components: `COMPONENT_INVENTORY.md` (hand-
 * written, and the only one nothing verified), `COMPONENT_CATALOG.md` (generated
 * from the package barrels, checked by `catalog:check`) and the Showcase registry
 * (generated and checked by `docs:registry:check`). The action item's criterion is
 * that the generated artefacts are *named as the single source* in the human
 * document, and that stale counts are removed or asserted.
 *
 * Both halves are cheap to keep true and impossible to keep true by hand: the
 * inventory claimed "29 entries" for subpath exports while `package.json` had 35,
 * which is exactly the drift the criterion is about. So the statement is asserted
 * here, and the one count a reader might act on is compared against the file that
 * owns it.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

/* `apps/showcase/tests/unit` → `apps/`, and one more to the `luc-ui` root. */
const ROOT = path.resolve(__dirname, "../../../..");

const read = (relative: string) => readFile(path.join(ROOT, relative), "utf8");

describe("the human documents point at the generated ones", () => {
  it("names the checked artefacts in the inventory and the catalog", async () => {
    const [inventory, catalog] = await Promise.all([
      read("docs/COMPONENT_INVENTORY.md"),
      read("docs/COMPONENT_CATALOG.md"),
    ]);
    /* The catalog names what generates and checks it. */
    expect(catalog).toContain("generate-catalog.mjs");
    expect(catalog).toContain("catalog:check");
    /* The inventory is the hand-written one, so it has to point at both generated
     * artefacts and say what verifies each — the catalog, and the registry the
     * Showcase renders from. */
    expect(inventory).toContain("COMPONENT_CATALOG.md");
    expect(inventory).toContain("generate-catalog.mjs");
    expect(inventory).toContain("catalog:check");
    expect(inventory).toContain("docs-registry.mjs");
    expect(inventory).toContain("docs:registry:check");
  });

  it("states the real export-map count, exactly, and cannot go stale silently", async () => {
    const [inventory, manifest, catalog] = await Promise.all([
      read("docs/COMPONENT_INVENTORY.md"),
      read("packages/ui/package.json"),
      read("docs/component-catalog.json"),
    ]);
    const manifestKeys = Object.keys(
      (JSON.parse(manifest) as { exports: Record<string, unknown> }).exports,
    ).sort();
    expect(manifestKeys.length).toBeGreaterThan(0);

    const row = inventory.split("\n").find((line) => line.startsWith("| Subpath exports"));
    expect(row, "the subpath-exports row is gone").toBeTruthy();
    /*
     * The declared number is *read*, not searched for. `toContain("42")` would
     * also pass for "142", for a date, or for a stray figure elsewhere in the
     * row — and this row has now gone stale twice (the hand-written "29", then
     * "35" when the `./components/*` entries landed), each time because the
     * check was satisfied by something other than the number a reader acts on.
     */
    const declared = /(\d+)\s+entries/.exec(row ?? "");
    expect(declared, `the row states no count: ${row}`).toBeTruthy();
    expect(Number(declared?.[1])).toBe(manifestKeys.length);
    /* …and the row says where the number comes from, so a reader can re-derive it. */
    expect(row).toContain("package.json");

    /*
     * The generated half of the same claim, so an addition cannot silently
     * stale either document: `catalog:check` compares the catalogue
     * byte-for-byte, and this asserts its enumeration covers *every* key in the
     * manifest — a new export fails here too, before anyone reads the row.
     */
    const catalogKeys = Object.keys(
      (JSON.parse(catalog) as { entries: Record<string, unknown> }).entries,
    ).sort();
    expect(catalogKeys).toEqual(manifestKeys);
  });

  it("keeps the catalog and the registry as the only generated inventories", async () => {
    /* A third hand-maintained list is what the action item exists to prevent: the
     * inventory's family rows may carry rationale, but no *enumeration* of
     * exports, which is what the generated catalog is for. */
    const inventory = await read("docs/COMPONENT_INVENTORY.md");
    expect(inventory).toMatch(/not a\s+source of truth|not a source of truth/i);
  });
});
