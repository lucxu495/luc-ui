/*
 * Areas, and the sidebar they select.
 *
 * Phase 10A's central navigation decision is that the sidebar shows the groups of
 * the *current area* rather than every group on the site, and that the header shows
 * every area. Both rest on one declaration (`lib/discovery/areas.ts`), and a
 * declaration that names a group nobody defined — or a route nobody wrote —
 * degrades into something nobody notices: a silently shorter menu.
 *
 * So this file asks the file system and the navigation model, not the author.
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import { findAppRoot, collectRoutes, routeExists, showcaseRoutes } from "./support/app-routes";
import {
  DOCS_FALLBACK,
  HOME_AREA,
  NAV_AREAS,
  NESTED_AREAS,
  PRIMARY_AREAS,
  SECONDARY_AREAS,
  areaForRoute,
  nestedAreasOf,
} from "@/lib/discovery/areas";
import { navGroupIds, navigation, sidebarForArea } from "@/lib/navigation";
import type { NavigationGroup } from "@luc/ui/app-shell";

const routes = showcaseRoutes();
const appRoot = findAppRoot();

/** The navigation model projected into the shell's shape, without localisation. */
const groups: NavigationGroup[] = navigation.map((group) => ({
  id: group.id,
  label: group.title,
  items: group.items.map((item) => ({
    id: item.href ?? `group:${item.title}`,
    label: item.title,
    href: item.href,
  })),
}));

describe("navigation areas", () => {
  it("names only groups that exist", () => {
    const known = new Set<string>(navGroupIds);
    const unknown: string[] = [];
    for (const area of NAV_AREAS) {
      for (const group of area.sidebar) {
        if (!known.has(group)) unknown.push(`${area.id} → ${group}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("gives every area a landing page that exists", () => {
    const missing = NAV_AREAS.filter((area) => !routeExists(routes, area.href)).map(
      (area) => `${area.id} → ${area.href}`,
    );
    expect(missing).toEqual([]);
  });

  it("routes every page on disk into a declared area, never the fallback by accident", () => {
    /*
     * The fallback exists so an undeclared prefix degrades to the documentation
     * area rather than to an empty sidebar. It must therefore be unreachable for a
     * real route except where a route genuinely belongs to it — which is what this
     * asserts, route by route, against the disk.
     */
    const undeclared = collectRoutes(path.join(appRoot, "app"))
      .filter((route) => !route.includes("[") && route !== "/")
      .filter((route) => areaForRoute(route).id === DOCS_FALLBACK.id)
      .filter(
        (route) =>
          !DOCS_FALLBACK.prefixes.some(
            (prefix) => route === prefix || route.startsWith(`${prefix}/`),
          ),
      );
    expect(undeclared).toEqual([]);
  });

  it("puts the front door in the home area and nothing else", () => {
    expect(areaForRoute("/")).toBe(HOME_AREA);
    expect(HOME_AREA.prefixes).toEqual([]);
  });

  it("prefers the longest prefix, so a nested area could win", () => {
    expect(areaForRoute("/charts/line-chart").id).toBe("charts");
    expect(areaForRoute("/components/buttons").id).toBe("components");
    /* Phase 2 extracted the Visuals product into its own repository, so
     * `/visuals/**` is no longer a route this Showcase serves. The longest-prefix
     * rule is still asserted — here by the Build subareas below, which are the
     * same shape: a subtree that belongs to an area of its own rather than to
     * the one whose prefix it shares a first segment with. */
    /* IA-007: the four Build subareas own their own subtrees. A pattern is not
     * "Build" but "Patterns" — that is what makes the sidebar, the breadcrumb and
     * the header panel able to say the same thing about the same page. */
    expect(areaForRoute("/blocks").id).toBe("blocks");
    expect(areaForRoute("/templates").id).toBe("templates");
    expect(areaForRoute("/patterns/research-workspace").id).toBe("patterns");
    expect(areaForRoute("/experiences/personal/career").id).toBe("experiences");
    /* IA V3: the design foundations are part of the design system, so they
     * resolve to Components. They used to resolve to Docs, which is what made
     * opening Typography from Components swap the whole sidebar for the
     * documentation taxonomy. */
    expect(areaForRoute("/foundations/spacing").id).toBe("components");
    expect(areaForRoute("/date-time/calendar").id).toBe("components");
    expect(areaForRoute("/integrations/tradingview").id).toBe("components");
    expect(areaForRoute("/application/workspace").id).toBe("components");
    expect(areaForRoute("/forms/validation").id).toBe("components");
    expect(areaForRoute("/data/table").id).toBe("components");
    /* What is left in Docs is documentation. */
    expect(areaForRoute("/docs/installation").id).toBe("docs");
    expect(areaForRoute("/experiments/design-lab").id).toBe("docs");
  });

  it("selects the sidebar groups an area declares, in order", () => {
    for (const area of NAV_AREAS) {
      const selected = sidebarForArea(area, groups).map((group) => group.id);
      expect(selected, area.id).toEqual([...area.sidebar]);
    }
  });

  it("shows a component page a component sidebar, not the whole site", () => {
    /* The defect Phase 10A set out to fix: ten groups on every page. */
    const components = sidebarForArea(areaForRoute("/components/buttons"), groups);
    /*
     * Four sections, and every one of them is the same product: what the system
     * is made of, what it gives you, how it moves, what it connects to. Still not
     * "the whole site" — the assertion is about scope, so it names the scope.
     */
    expect(components.map((group) => group.id)).toEqual([
      "foundations",
      "components",
      "motion",
      "integrations",
    ]);
    /*
     * IA V3 — the pages that used to be someone else's.
     *
     * Foundations, the application frame, the form guides, the data guides, date
     * and time and the integrations all document this library, so each of them
     * renders this sidebar. Before, every one of them rendered the Docs taxonomy
     * and marked no row current.
     */
    for (const route of [
      "/foundations/typography",
      "/date-time/calendar",
      "/application/workspace",
      "/forms/validation",
      "/data/table",
      "/integrations/tradingview",
      "/components/calendar",
    ]) {
      expect(
        sidebarForArea(areaForRoute(route), groups).map((group) => group.id),
        route,
      ).toEqual(["foundations", "components", "motion", "integrations"]);
    }
    /*
     * NAV-004 — Motion is a section of Components, not a sidebar of its own.
     *
     * The reported defect: `/motion/**` rendered "Motion / Part of Components"
     * while every page beside it rendered the four sections. Motion was declared
     * a Components family (`parent: "components"`) *and* a separate area, and the
     * shell honours the area — so a reader who clicked into the motion gallery
     * lost the four sections they had been browsing. The parent link was a
     * gesture at the model; this is the model.
     */
    for (const route of [
      "/motion",
      "/motion/kinetic",
      "/motion/card-stack",
      "/motion/aurora-surface",
      "/motion/intensity",
    ]) {
      expect(
        sidebarForArea(areaForRoute(route), groups).map((group) => group.id),
        route,
      ).toEqual(["foundations", "components", "motion", "integrations"]);
    }
    const charts = sidebarForArea(areaForRoute("/charts/line-chart"), groups);
    expect(charts.map((group) => group.id)).toEqual(["charts"]);
    const patterns = sidebarForArea(areaForRoute("/patterns/workspace"), groups);
    expect(patterns.map((group) => group.id)).toEqual(["patterns"]);
  });

  it("has closed the navigation gaps this phase found", () => {
    /*
     * These pages had *no* sidebar entry before Phase 10A — they were reachable only
     * by typing a URL. Asserted here so the gap cannot reopen quietly.
     */
    const wasOrphaned = [
      "/forms/validation",
      "/data/table",
      "/date-time/calendar",
      "/experiments/design-lab",
      "/patterns/workspace",
      "/experiences/personal/garden",
    ];
    const listed = new Set<string>();
    for (const group of navigation) {
      for (const item of group.items) {
        if (item.href) listed.add(item.href);
        for (const child of item.children ?? []) if (child.href) listed.add(child.href);
      }
    }
    expect(wasOrphaned.filter((route) => !listed.has(route))).toEqual([]);
  });

  it("keeps every area in the header, with a distinct label", () => {
    const headerAreas = NAV_AREAS.filter((area) => area.id !== "home");
    const labels = headerAreas.map((area) => area.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(headerAreas.length).toBeGreaterThanOrEqual(8);
  });

  /*
   * The header's tier split is a product decision (`OPEN-02`), so it is
   * asserted rather than reviewed once. Four capability families stay visible —
   * a reader who has to open a disclosure to discover that Motion exists does
   * not find it — and the four supporting destinations keep their row behind
   * one menu.
   */
  it("keeps the capability families in the primary tier and Motion inside Components", () => {
    /*
     * Motion is not a tier at all any more, and that is the NAV-004 fix: it was
     * `nested`, which is a *sidebar identity* — the thing the reader saw switch.
     * It is a section of Components, declared by the Components area's prefix
     * list and its sidebar list, so there is nothing left for a tier to say about
     * it. `/motion/**` still routes because the prefix moved, not because an area
     * claims it.
     */
    /*
     * Phase 2 removed the fourth primary area with the Visuals product itself.
     * The tier still says what it always said: the areas a reader enters from
     * the header.
     */
    expect(PRIMARY_AREAS.map((area) => area.id)).toEqual(["components", "charts"]);
    /*
     * Studios moved into Build (IA V3): a page composer is the tool you use to
     * arrange the blocks and templates Build documents, not a fifth product
     * competing with it for the same row.
     */
    expect(SECONDARY_AREAS.map((area) => area.id)).toEqual(["explore", "build", "docs"]);
    expect(NAV_AREAS.some((area) => area.id === "motion")).toBe(false);
    expect(areaForRoute("/motion/card-stack").id).toBe("components");
    /* Home owns `/` and is neither: it is the front door, not a destination a
     * header entry competes for. */
    expect(NAV_AREAS.some((area) => area.id === "home" && area.tier === "primary")).toBe(false);
  });

  /*
   * NAV-001 — a nested area owns its sidebar, and names its parent once.
   *
   * The defect this was written for: a nested area printing its parent's whole
   * tree above its own, which read as "the sidebar switched to Components". The
   * parent relationship is still declared and the shell renders it as one row,
   * but it may not be expressed by borrowing the parent's navigation.
   *
   * NAV-004 is the mirror image and is fixed above: an area that only *is* a
   * section of another one must not be an area at all, because any area — nested
   * or not — replaces the sidebar the reader was using.
   */
  it("gives a nested area its own sidebar and a parent it can link to", () => {
    for (const area of NESTED_AREAS) {
      expect(area.parent, `${area.id} is nested but names no parent`).toBeDefined();
      const parent = NAV_AREAS.find((candidate) => candidate.id === area.parent);
      expect(parent, `${area.id} names a parent area that does not exist`).toBeDefined();
      expect(parent?.href.startsWith("/"), `${area.id}'s parent has no landing to link to`).toBe(true);
      expect(parent?.tier, `${area.id}'s parent is itself nested`).not.toBe("nested");
      /* The parent's own navigation group must not be inside the nested area's
       * list: printing the parent's tree above the child's is the shape of the
       * defect, whatever the two ids happen to be called. */
      expect(area.sidebar, `${area.id} borrows its parent's navigation`).not.toContain(parent?.id);
    }
    /* The nested set is Build's five, and nothing else: a nested area is a
     * region of the product with its own navigation, not a family of a library. */
    expect(NESTED_AREAS.map((area) => area.id)).toEqual([
      "blocks",
      "templates",
      "patterns",
      "experiences",
      "studios",
    ]);
  });

  /*
   * IA-007 — Build is a parent with four subareas, not one area with four
   * prefixes.
   *
   * The reported symptom was that `/patterns` showed the same sidebar as
   * `/blocks` and marked the Blocks row current, so the navigation disagreed with
   * the page about where the reader was. The fix is structural, so the assertions
   * are about the structure: who owns each route, who has a landing of their own,
   * and what the switcher is derived from.
   */
  it("gives each Build subarea its own ownership of its routes", () => {
    const build = NAV_AREAS.find((area) => area.id === "build");
    expect(build?.tier).toBe("secondary");
    /* No prefixes: Build is not a route. Its landing is shared with the subarea
     * that really is a page, which is what `isParentOnly` reads in the shell. */
    expect(build?.prefixes).toEqual([]);
    const shared = NAV_AREAS.filter((area) => area.href === build?.href);
    expect(shared.map((area) => area.id)).toEqual(["build", "blocks"]);

    const subareas = NESTED_AREAS.filter((area) => area.parent === "build");
    expect(subareas.map((area) => area.id)).toEqual([
      "blocks",
      "templates",
      "patterns",
      "experiences",
      /* IA V3: the editors are the fifth row of the same family. A reader who
       * has a template open should be able to reach the composer that arranges
       * it without leaving Build. */
      "studios",
    ]);
    for (const subarea of subareas) {
      expect(areaForRoute(subarea.href).id, `${subarea.href} is not ${subarea.id}`).toBe(subarea.id);
      /*
       * The landing lives inside the area's own subtree. For four of them the two
       * are the same string — Blocks is `/blocks` — and for Studios the area owns
       * `/studios` while its landing is the first workspace, `/studios/charts`.
       * Asserting equality would have forced a second `/studios` landing page
       * just to satisfy the test.
       */
      expect(subarea.prefixes.some((prefix) => subarea.href.startsWith(prefix)), subarea.id).toBe(true);
    }
    /* The switcher the shell renders is derived from `parent`, so it cannot list
     * three of the four, or list a fifth destination that is not a Build subarea. */
    expect(nestedAreasOf("build").map((area) => area.label)).toEqual([
      "Blocks",
      "Templates",
      "Patterns",
      "Experiences",
      "Studios",
    ]);
  });

  it("keeps each Build subarea's sidebar scope its own", () => {
    /* The defect: `/patterns` rendering Blocks' navigation. Now the only group a
     * subarea shows besides its own is the family switcher, and Patterns' own
     * group is Patterns'. */
    expect(sidebarForArea(areaForRoute("/patterns"), groups).map((group) => group.id)).toEqual([
      "patterns",
    ]);
    expect(sidebarForArea(areaForRoute("/experiences/personal/career"), groups).map((group) => group.id)).toEqual([
      "experiences",
    ]);
    /* Blocks and Templates are single pages, so they declare no content group and
     * their sidebar is the switcher alone. */
    expect(sidebarForArea(areaForRoute("/blocks"), groups)).toEqual([]);
    expect(sidebarForArea(areaForRoute("/templates"), groups)).toEqual([]);
  });
});
