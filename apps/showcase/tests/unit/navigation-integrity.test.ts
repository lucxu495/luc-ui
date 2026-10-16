/*
 * Every link in the navigation resolves.
 *
 * A sidebar is the one place in a documentation site where a broken target is
 * guaranteed to be seen, and Phase 9 changed navigation from a hand-written
 * table into one derived partly from the generated registry. That is exactly
 * when a link can appear for a page nobody wrote — so this test asks the file
 * system, not the author.
 *
 * A href is satisfied by any of three things, and nothing else:
 *   - a literal `page.tsx` at that path;
 *   - a dynamic route that generates it (`[component]`, `[chart]`, `[motion]`);
 *   - a redirect the registry declares for it.
 */

import { describe, expect, it } from "vitest";
import { flatNavigation, navigation } from "@/lib/navigation";
import { docEntries, docRedirects } from "@/lib/docs/registry";
import { navEntries, navFamilies } from "@/lib/docs/nav";
import { routeExists, showcaseRoutes } from "./support/app-routes";

/*
 * "Exists" means a literal `page.tsx`, or a dynamic sibling that generates the
 * route — `/visuals/elements/[element]/page.tsx` serves
 * `/visuals/elements/waterfall`, and the catalog links to it on purpose. The route walker in
 * `tests/unit/support/app-routes.ts` is the one place that definition lives, and it
 * is the same definition `scripts/docs-registry.mjs` uses when it validates a
 * catalog row.
 */
const onDisk = showcaseRoutes();
const generated = new Set(docEntries.map((entry) => entry.route));
const redirected = new Set(docRedirects().map((redirect) => redirect.source));

describe("navigation integrity", () => {
  it("links only to routes that exist, are generated, or redirect", () => {
    const broken: string[] = [];
    for (const item of flatNavigation) {
      const href = item.href;
      if (!href || href.startsWith("http")) continue;
      /* Query strings and hash fragments are not part of the route. */
      const route = href.split("?")[0]?.split("#")[0] ?? href;
      if (routeExists(onDisk, route) || generated.has(route) || redirected.has(route)) continue;
      broken.push(`${item.title} → ${route}`);
    }
    expect(broken).toEqual([]);
  });

  it("has a unique href per item, so active state cannot be ambiguous", () => {
    const hrefs = flatNavigation.flatMap((item) => (item.href ? [item.href] : []));
    const duplicates = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
    expect([...new Set(duplicates)]).toEqual([]);
  });

  it("never lists a route that only redirects", () => {
    const redirectSources = new Set(docRedirects().map((redirect) => redirect.source));
    const listed = flatNavigation.flatMap((item) =>
      item.href && redirectSources.has(item.href.split("?")[0] ?? item.href) ? [item.href] : [],
    );
    expect(listed).toEqual([]);
  });

  /*
   * NAV-004 — every Motion capability is reachable from the sidebar.
   *
   * The reported defect was a sidebar identity swap, and fixing it exposed a
   * second one underneath: `claimRoutes` dropped an item whose href was already
   * taken, and motion's *Feedback* family declares `/motion` as its landing — the
   * same href as the gallery row six lines above it. The whole family went with
   * it, so fifteen documented entries (PressRipple, CardStack's four siblings and
   * MotionIntensityProvider among them) had no sidebar row at all. Nothing
   * noticed, because the routes still answered and the pages still rendered.
   *
   * Asserted against the generated projection rather than a list of names: a new
   * motion entry that lands in no family fails here on the day it is added.
   */
  it("lists every motion capability under the Motion section", () => {
    const motionGroup = navigation.find((group) => group.id === "motion");
    expect(motionGroup, "there is no motion group").toBeDefined();
    const listed = new Set(
      motionGroup!.items.flatMap((item) => [
        ...(item.href ? [item.href] : []),
        ...(item.children ?? []).flatMap((child) => (child.href ? [child.href] : [])),
      ]),
    );
    const documented = navEntries.filter((entry) => entry.group === "motion").map((entry) => entry.route);
    expect(documented.length).toBeGreaterThan(30);
    expect(documented.filter((route) => !listed.has(route))).toEqual([]);

    /* And the family that collided still carries its children: the fix kept the
     * row and dropped only its link, rather than dropping the row. */
    const feedback = navFamilies.find((family) => family.id === "motion-feedback");
    const feedbackRow = motionGroup!.items.find((item) => item.title === feedback?.title);
    expect(feedbackRow?.children?.length).toBe(feedback?.entries.length);
    expect(feedbackRow?.href).toBeUndefined();
  });
});
