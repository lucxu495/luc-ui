/**
 * What UX-005 owes, and what it does not.
 *
 * Two things must both be true, and they pull in opposite directions:
 *
 *   1. a **registry entry** page with nothing at its foot fails — that is the
 *      defect the check exists for, and it must keep failing;
 *   2. a **collection** page with nothing at its foot passes — `/charts/catalog`
 *      is a catalogue of charts, not a chart, and the probe calling that a failure
 *      is what sent somebody looking for a missing footer that was never missing.
 *
 * Both are asserted here against the same function the browser probe uses, so the
 * rule cannot drift away from the thing it governs. The last case is the negative
 * regression the brief asks for: a real entry route, fed an empty footer, must
 * produce failures.
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { classifyRoute, entryRoutes, footerProblems } from "./page-kind.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NAV = path.resolve(HERE, "../lib/docs/generated/nav.ts");

const navRows = async () =>
  [...(await readFile(NAV, "utf8")).matchAll(/"r": "([^"]+)",\s*"f": "([^"]+)",\s*"g": "([^"]+)",\s*"s": "([^"]+)"/g)].map(
    (match) => ({ route: match[1], family: match[2], group: match[3], status: match[4] }),
  );

const goodFooter = {
  related: [
    { href: "/components/alert-dialog", name: "AlertDialog" },
    { href: "/components/toast", name: "Toast" },
  ],
  prevNext: [
    { href: "/components/accordion", name: "Previous Accordion" },
    { href: "/components/alert-dialog", name: "Next AlertDialog" },
  ],
};

describe("page kinds", () => {
  it("tells an entry from a collection using the registry's own routes", async () => {
    const routes = entryRoutes(await navRows());
    assert.equal(classifyRoute("/components/alert", routes), "entry");
    assert.equal(classifyRoute("/charts/line-chart", routes), "entry");
    assert.equal(classifyRoute("/motion/card-stack", routes), "entry");
    /* The catalogue is the case that started this: it lists charts and is not one. */
    assert.equal(classifyRoute("/charts/catalog", routes), "collection");
    assert.equal(classifyRoute("/docs/reference", routes), "collection");
  });
});

describe("the footer contract", () => {
  it("passes an entry page that has related links and both pagers", () => {
    assert.deepEqual(footerProblems("/components/alert", "entry", goodFooter), []);
  });

  it("fails an entry page with no footer at all", () => {
    const problems = footerProblems("/components/alert", "entry", { related: [], prevNext: [] });
    assert.ok(problems.length >= 2, problems.join(" | "));
    assert.match(problems.join(" | "), /only 0 related link/);
    assert.match(problems.join(" | "), /previous\/next has 0 link/);
  });

  it("fails an entry page whose footer is a single link, or points at itself", () => {
    const one = footerProblems("/components/alert", "entry", {
      related: [{ href: "/components/alert", name: "Alert" }],
      prevNext: goodFooter.prevNext,
    });
    assert.match(one.join(" | "), /only 1 related link/);
    assert.match(one.join(" | "), /points at the page itself/);
  });

  it("says nothing at all about a collection page — that is the correction", () => {
    assert.deepEqual(footerProblems("/charts/catalog", "collection", { related: [], prevNext: [] }), []);
  });

  it("still lets a real entry route fail when its navigation is missing", async () => {
    /*
     * The negative regression. `/components/alert` is a real registered entry
     * with a real footer *today*; if that footer ever disappears, the same call
     * the browser probe makes must report it — which is what this asserts by
     * feeding the function the empty footer such a page would produce.
     */
    const routes = entryRoutes(await navRows());
    const route = "/components/alert";
    assert.equal(classifyRoute(route, routes), "entry");
    const problems = footerProblems(route, "entry", { related: [], prevNext: [] });
    assert.ok(problems.length > 0, "an entry page without its footer must fail");
  });
});
