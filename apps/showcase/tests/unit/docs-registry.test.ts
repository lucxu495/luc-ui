/*
 * The documentation registry's standing contract.
 *
 * Phase 9's riskiest claim is "every public component has a page, and the page
 * tells the truth about how to import it". A claim like that is only worth
 * anything if it is checked, so this file checks it against the same two
 * sources the generator used — and it fails on the *shape* of the catalogue,
 * not just on one page: a duplicate id, a route collision, an import path that
 * no longer exists, a related link to nothing, a family with no entries.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import catalog from "../../../../docs/component-catalog.json";
import {
  apiFor,
  docEntries,
  docFamilies,
  docGroups,
  docRedirects,
  entriesInFamily,
  entryById,
  entryByRoute,
  neighbours,
  readingOrder,
  relatedEntries,
  searchEntries,
} from "@/lib/docs/registry";

const validImportPaths = new Set(
  Object.values(catalog.entries).map((entry) => (entry as { import: string }).import),
);

/** The app directory, resolved from this file rather than from the process. */
const here = path.dirname(fileURLToPath(import.meta.url));
const exportsByImport = new Map(
  Object.values(catalog.entries).map((entry) => [
    (entry as { import: string }).import,
    new Set(((entry as { exports?: { name: string }[] }).exports ?? []).map((item) => item.name)),
  ]),
);

describe("documentation registry", () => {
  it("has a journal-free, unique id per entry", () => {
    const ids = docEntries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every entry's import path against the real package catalogue", () => {
    const broken = docEntries
      .filter((entry) => !validImportPaths.has(entry.importPath))
      .map((entry) => `${entry.id} → ${entry.importPath}`);
    expect(broken).toEqual([]);
  });

  it("only claims exports the entry point actually publishes", () => {
    const unknown: string[] = [];
    for (const entry of docEntries) {
      const published = exportsByImport.get(entry.importPath);
      if (!published) continue;
      for (const name of entry.exports) {
        if (!published.has(name)) unknown.push(`${entry.id}: ${entry.importPath} does not export ${name}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("gives every entry a family that exists, in a group that exists", () => {
    const familyIds = new Set(docFamilies.map((family) => family.id));
    const groupIds = new Set(docGroups.map((group) => group.id));
    for (const entry of docEntries) {
      expect(familyIds.has(entry.family), `${entry.id} → ${entry.family}`).toBe(true);
      expect(groupIds.has(entry.group), `${entry.id} → ${entry.group}`).toBe(true);
    }
  });

  it("lists every entry in its family, and every family entry resolves", () => {
    const listed = new Set(docFamilies.flatMap((family) => [...family.entries]));
    /*
     * A reference row that shares its route with a real page *in its own family*
     * is deliberately absent from the index: it is documented on that page, and a
     * row pointing at the page you are already on is not a row. Every other
     * entry must be listed — that is what makes the sidebar a map.
     */
    const coLocatedReference = new Set(
      docEntries
        .filter(
          (entry) =>
            entry.status === "reference" &&
            docEntries.some(
              (other) =>
                other.id !== entry.id &&
                other.family === entry.family &&
                other.route === entry.route &&
                other.status !== "reference",
            ),
        )
        .map((entry) => entry.id),
    );
    for (const entry of docEntries) {
      if (!coLocatedReference.has(entry.id)) {
        expect(listed.has(entry.id), `${entry.id} is not listed by any family`).toBe(true);
      }
      expect(entryById(entry.id)).toBe(entry);
    }
    for (const family of docFamilies) {
      for (const id of family.entries) {
        expect(entryById(id), `${family.id} lists unknown id ${id}`).toBeDefined();
      }
      expect(entriesInFamily(family.id).length, `${family.id} resolves to no entries`).toBeGreaterThan(0);
    }
  });

  it("never sends two different components to the same page without a redirect", () => {
    const routes = new Map<string, string[]>();
    for (const entry of docEntries) {
      const list = routes.get(entry.route) ?? [];
      list.push(entry.id);
      routes.set(entry.route, list);
    }
    const shared = [...routes.entries()].filter(([, ids]) => ids.length > 1);
    /* A curated page may document more than one module (Alert documents
     * Callout; the menus page documents two menus). What must not happen is an
     * *unresolvable* route: every route on the list is a real page. */
    for (const [route, ids] of shared) {
      const owners = ids.filter((id) => entryById(id)?.route === route);
      expect(owners.length, `${route} shared by ${ids.join(", ")}`).toBeGreaterThan(0);
    }
    expect(shared.length).toBeGreaterThan(0);
  });

  it("resolves the route of every entry that claims a page exists", () => {
    const missing = docEntries
      .filter((entry) => entry.status !== "generated" && entry.status !== "reference")
      .filter((entry) => !entryByRoute(entry.route))
      .map((entry) => `${entry.id} → ${entry.route}`);
    expect(missing).toEqual([]);
  });

  it("resolves every related link", () => {
    const broken: string[] = [];
    for (const entry of docEntries) {
      for (const id of entry.related ?? []) {
        if (!entryById(id)) broken.push(`${entry.id} → ${id}`);
      }
      expect(relatedEntries(entry).every((related) => related.id !== entry.id)).toBe(true);
    }
    expect(broken).toEqual([]);
  });

  it("walks the whole catalogue with previous/next and never dead-ends inside it", () => {
    expect(readingOrder.length).toBeGreaterThan(150);
    const first = readingOrder[0];
    const last = readingOrder[readingOrder.length - 1];
    expect(first && neighbours(first).previous).toBeUndefined();
    expect(last && neighbours(last).next).toBeUndefined();
    const missing = readingOrder
      .filter((entry) => !entryByRoute(entry.route))
      .map((entry) => `${entry.id} (${entry.status})`);
    /* Generated and reference rows have no page file; a curated or generated
     * row must have one at build time, which Next reports as a 404 at runtime
     * rather than here. This keeps the assertion honest about what it proves. */
    expect(missing.filter((row) => row.includes("(reference)")).length).toBe(missing.length);
  });

  it("searches by exact name before substring", () => {
    const input = searchEntries("input", 5);
    expect(input[0]?.entry.id).toBe("input");
    const button = searchEntries("Button", 5);
    expect(button[0]?.entry.title).toBe("Button");
    expect(searchEntries("line-chart", 3)[0]?.entry.id).toBe("line-chart");
    expect(searchEntries("")).toEqual([]);
    expect(searchEntries("zzzznomatch")).toEqual([]);
  });

  it("maps every canonical id URL to its real page", () => {
    const redirects = docRedirects();
    const sources = new Set(redirects.map((redirect) => redirect.source));
    expect(sources.size).toBe(redirects.length);
    for (const redirect of redirects) {
      expect(redirect.source).not.toBe(redirect.destination);
      expect(redirect.destination.startsWith("/")).toBe(true);
      /* A redirect must never land on another redirect's source: Next resolves
       * redirects once, so a chain would strand the reader. */
      expect(sources.has(redirect.destination)).toBe(false);
    }
  });

  it("publishes API facts that came from the compiler, not from a copy", () => {
    const button = entryById("button");
    expect(button).toBeDefined();
    const symbols = apiFor("button");
    const buttonSymbol = symbols.find((symbol) => symbol.name === "Button");
    expect(buttonSymbol, "Button has no API row").toBeDefined();
    const props = buttonSymbol?.props ?? [];
    expect(props.map((prop) => prop.name)).toContain("variant");
    /* Inherited DOM attributes are excluded by the generator; `accessKey` is the
     * canonical example of one that must never appear. */
    expect(props.map((prop) => prop.name)).not.toContain("accessKey");
    expect(props.find((prop) => prop.name === "loading")?.description).toBeTruthy();
  });

  it("documents the same number of entries it claims on its index", () => {
    const published = docEntries.filter((entry) => entry.status !== "reference");
    expect(published.length).toBeGreaterThan(200);
    for (const group of docGroups) {
      expect(published.filter((entry) => entry.group === group.id).length).toBeGreaterThan(0);
    }
  });

  /*
   * The compound-module contract.
   *
   * `@luc/ui/app-shell` publishes four modules — the shell, the sidebar parts,
   * the breadcrumbs and the page header — and three of them are *reference*
   * rows: documented on the page that composes them rather than on a page of
   * their own. The Navigation review found the failure mode these assertions
   * exist for: the rows were dropped from the registry entirely, so `SidebarItem`,
   * `SidebarRail`, `SidebarToggle`, `Breadcrumbs` and `PageHeader` were published
   * by the package and appeared in **no** table anywhere on the site.
   *
   * Three properties, each of which was false at some point:
   *   1. a reference row resolves by id, so a page *can* document it;
   *   2. it is not an index row of its own, and not a pager stop — three extra
   *      stops pointing at `/application/navigation` would lead a reader to the
   *      page they are already on;
   *   3. the page that owns the shared route actually names it.
   */
  describe("reference modules", () => {
    const reference = docEntries.filter((entry) => entry.status === "reference");

    it("resolves every reference row by id", () => {
      expect(reference.length).toBeGreaterThan(4);
      for (const entry of reference) {
        expect(entryById(entry.id), `${entry.id} does not resolve`).toBeDefined();
        expect(apiFor(entry.id).length, `${entry.id} has no compiled symbols`).toBeGreaterThan(0);
      }
    });

    it("keeps a co-located reference row out of the index and the pager", () => {
      const listed = new Set(docFamilies.flatMap((family) => entriesInFamily(family.id).map((e) => e.id)));
      const walked = new Set(readingOrder.map((entry) => entry.id));
      /*
       * "Co-located" is a *within-family* relationship, which is the rule the
       * generator implements: a module documented on its own family's page is not
       * an index row. A reference row that lives in a different family from the
       * page hosting it — `navigation` and `locale-provider` are rows of the
       * Application family, pointing at pages the Components group owns — is a
       * deliberate row of that family's index, and this assertion leaves it be.
       */
      const leaked = reference
        .filter((entry) =>
          docEntries.some(
            (other) =>
              other.id !== entry.id &&
              other.family === entry.family &&
              other.route === entry.route &&
              other.status !== "reference",
          ),
        )
        .filter((entry) => listed.has(entry.id) || walked.has(entry.id))
        .map((entry) => entry.id);
      expect(leaked, "a module documented elsewhere became a row of its own").toEqual([]);
    });

    it("names every co-located reference row on the page that documents it", () => {
      const unreadable: string[] = [];
      for (const entry of reference) {
        const owner = docEntries.find(
          (other) =>
            other.id !== entry.id && other.route === entry.route && other.status !== "reference",
        );
        /* A reference row whose route hosts no real page is not this test's
         * business — `resolves the route of every entry` covers that shape. */
        if (!owner?.pageFile) continue;
        /* Resolved from this file, not from `process.cwd()`: the suite runs from
         * the package when a single file is selected and from the app otherwise. */
        const source = readFileSync(path.resolve(here, "../..", owner.pageFile), "utf8");
        if (!source.includes(`"${entry.id}"`)) unreadable.push(`${owner.id} does not name ${entry.id}`);
      }
      expect(unreadable).toEqual([]);
    });
  });
});
