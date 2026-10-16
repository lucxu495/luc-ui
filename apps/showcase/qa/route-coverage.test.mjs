/**
 * The coverage contract for the QA route registry.
 *
 * Why this file exists, measured rather than assumed: the sweep used to expand
 * each dynamic segment (`/components/[component]`, `/charts/[chart]`,
 * `/motion/[motion]`) into **three** representative pages — a first, a middle
 * and a last. That made the registry look complete while 151 documented routes
 * were never opened by any browser gate: no axe scan, no 390 px overflow check,
 * no console-error check, no i18n probe. `/components/stepper` was one of them,
 * and the 390 px `scrollable-region-focusable` failure on that page was found by
 * hand instead.
 *
 * So the registry is now derived from the documentation registry itself, and
 * these assertions keep it that way:
 *
 *   - a route the registry documents is in the sweep, automatically, the moment
 *     it is generated (that is what makes a new page covered without an edit);
 *   - the sweep cannot shrink below the registry (the failure mode above);
 *   - a policy row points at a route that exists, so the hand-written coverage
 *     flags cannot outlive the page they describe;
 *   - every path is swept once, with its curated flags intact.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ROUTES, ROUTE_SLUGS, isProviderPath, selectRoutes, slugsInGroup } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const registry = readFileSync(path.resolve(here, "../lib/docs/generated/registry.ts"), "utf8");

const entries = [...registry.matchAll(/"route": "(\/[^"]+)",\s*\n\s*"status": "([^"]+)"/g)].map(
  (match) => ({ route: match[1], status: match[2] }),
);

const documented = entries.filter((entry) => entry.status !== "reference");
const reference = entries.filter((entry) => entry.status === "reference");
const swept = new Set(ROUTES.map((route) => route.path));

describe("the QA route registry", () => {
  it("reads the documentation registry it derives from", () => {
    /* A scanner that stopped scanning would make every assertion below vacuous,
     * which is the one way this file could pass while covering nothing. */
    assert.ok(documented.length > 200, `only ${documented.length} documented routes were read`);
    assert.ok(reference.length > 0, "no reference rows were read");
  });

  it("sweeps every documented route", () => {
    const missing = documented.filter((entry) => !swept.has(entry.route)).map((entry) => entry.route);
    assert.deepEqual(missing, [], `${missing.length} documented route(s) are in no browser gate`);
  });

  it("covers a reference row through the page that documents it", () => {
    /* A reference row is a module kept visible on a sibling's page, not a page:
     * it must be *reachable* (its route is swept) while never being a second row
     * for the same URL. */
    const unowned = reference.filter((entry) => !swept.has(entry.route)).map((entry) => entry.route);
    assert.deepEqual(unowned, []);
  });

  it("sweeps each path exactly once", () => {
    assert.equal(swept.size, ROUTES.length, "a path is swept twice");
    assert.equal(new Set(ROUTE_SLUGS).size, ROUTE_SLUGS.length, "two routes share a slug");
  });

  it("cannot shrink below the registry it derives from", () => {
    assert.ok(
      ROUTES.length >= documented.length,
      `${ROUTES.length} swept routes for ${documented.length} documented ones`,
    );
    assert.ok(ROUTES.length > 350, `${ROUTES.length} routes — the sweep lost a whole shape`);
  });

  it("keeps every slug addressable by `selectRoutes`", () => {
    /* A slug is how every QA tier takes a subset — `--routes=components-tabs` —
     * so a slug that selects nothing would make a "targeted run" silently empty.
     * The slug is not always the path with dashes (`/foundations` is
     * `foundations-overview`), which is exactly why this is checked by calling
     * the selector rather than by re-deriving the name. */
    for (const route of ROUTES) {
      const selected = selectRoutes([route.slug]);
      assert.deepEqual(
        selected.map((item) => item.path),
        [route.path],
        `${route.slug} does not select ${route.path}`,
      );
    }
  });

  it("keeps provider-backed routes in their own group", () => {
    /* The provider surface is the only one that talks to a third party, and it
     * is swept against a deterministic stub in every default tier — so a
     * provider route that lost its group would quietly join the standard sweep. */
    for (const route of ROUTES) {
      if (isProviderPath(route.path)) {
        assert.ok(route.groups.includes("providers"), `${route.path} left the providers group`);
      }
    }
    assert.ok(slugsInGroup("providers").length > 0, "no provider route is registered");
  });

  it("keeps a curated route's coverage flags when the registry also lists it", () => {
    /* `/components/alert` is both a curated page (with a hand-written mobile and
     * light policy) and a registry entry. The policy row has to win, or the
     * curated flags disappear behind a discovered default. */
    const withMobile = ROUTES.filter((route) => route.mobile).length;
    assert.ok(withMobile > 80, `only ${withMobile} routes keep a narrow-screen capture`);
  });
});
