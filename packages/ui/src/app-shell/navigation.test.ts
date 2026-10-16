import { describe, expect, it } from "vitest";
import {
  filterNavigation,
  findActiveNavigationItem,
  flattenNavigation,
  isNavigationItemActive,
  isNavigationItemCurrent,
  navigationCommandEntries,
  normalizePathname,
  type NavigationGroup,
} from "./navigation";

const groups: NavigationGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "home", label: "Overview", href: "/" }],
  },
  {
    id: "research",
    label: "Research",
    items: [
      {
        id: "datasets",
        label: "Datasets",
        icon: null,
        children: [
          { id: "prices", label: "Price series", href: "/research/datasets/prices" },
          { id: "flows", label: "Flow series", href: "/research/datasets/flows" },
        ],
      },
      { id: "reports", label: "Reports", href: "/research/reports", badge: 3 },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ id: "settings-root", label: "Settings", href: "/settings", disabled: true }],
  },
];

describe("normalizePathname", () => {
  it("drops a trailing slash, a query and a hash", () => {
    expect(normalizePathname("/research/")).toBe("/research");
    expect(normalizePathname("/research?range=1y")).toBe("/research");
    expect(normalizePathname("/research#top")).toBe("/research");
    expect(normalizePathname("")).toBe("/");
  });
});

describe("isNavigationItemActive", () => {
  it("matches on a path segment boundary", () => {
    expect(isNavigationItemActive("/charts/timeseries", "/charts")).toBe(true);
    expect(isNavigationItemActive("/charts-archive", "/charts")).toBe(false);
    expect(isNavigationItemActive("/charts", "/charts")).toBe(true);
  });

  it("treats the root as an exact match", () => {
    expect(isNavigationItemActive("/", "/")).toBe(true);
    expect(isNavigationItemActive("/research", "/")).toBe(false);
  });
});

describe("findActiveNavigationItem", () => {
  it("separates 'the page I am on' from 'the section containing it'", () => {
    // Active is a prefix match; current is exact, and only one link may claim it.
    expect(isNavigationItemActive("/charts/matrix", "/charts")).toBe(true);
    expect(isNavigationItemCurrent("/charts/matrix", "/charts")).toBe(false);
    expect(isNavigationItemCurrent("/charts/matrix", "/charts/matrix")).toBe(true);
    expect(isNavigationItemCurrent("/charts", "/charts")).toBe(true);
    expect(isNavigationItemCurrent("/charts-archive", "/charts")).toBe(false);
    expect(isNavigationItemCurrent("/research/", "/research")).toBe(true);
  });

  it("returns the most specific match in a tree", () => {
    expect(findActiveNavigationItem(groups, "/research/datasets/prices")?.id).toBe("prices");
    expect(findActiveNavigationItem(groups, "/research/reports/2026")?.id).toBe("reports");
    expect(findActiveNavigationItem(groups, "/nothing-here")).toBeUndefined();
  });
});

describe("flattenNavigation", () => {
  it("walks parents before children, in order", () => {
    expect(flattenNavigation(groups).map((item) => item.id)).toEqual([
      "home",
      "datasets",
      "prices",
      "flows",
      "reports",
      "settings-root",
    ]);
  });
});

describe("navigationCommandEntries", () => {
  it("derives palette entries from the same model, including nested pages", () => {
    const entries = navigationCommandEntries(groups);
    expect(entries.map((entry) => entry.href)).toContain("/research/datasets/flows");
    expect(entries[0]?.groupLabel).toBe("Overview");
    expect(entries.every((entry) => entry.haystack === entry.haystack.toLowerCase())).toBe(true);
  });

  it("accepts command-only extras", () => {
    const entries = navigationCommandEntries(groups, [
      { id: "copy", label: "Copy view link", action: () => {} },
    ]);
    expect(entries.at(-1)?.id).toBe("copy");
  });
});

describe("filterNavigation", () => {
  it("keeps a parent whose child matches", () => {
    const filtered = filterNavigation(groups, "flow");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.items[0]?.id).toBe("datasets");
    expect(filtered[0]?.items[0]?.children?.map((child) => child.id)).toEqual(["flows"]);
  });

  it("returns everything for an empty query and nothing for no match", () => {
    expect(filterNavigation(groups, "  ")).toHaveLength(3);
    expect(filterNavigation(groups, "zzz")).toHaveLength(0);
  });
});

describe("navigationCommandEntries", () => {
  it("skips a parent that only discloses its children", () => {
    const entries = navigationCommandEntries([
      {
        id: "g",
        label: "Group",
        items: [
          {
            id: "group:TradingView",
            label: "TradingView",
            children: [{ id: "/integrations/tradingview", label: "Overview", href: "/integrations/tradingview" }],
          },
        ],
      },
    ]);
    expect(entries.map((entry) => entry.label)).toEqual(["Overview"]);
  });

  it("drops entries that cannot navigate, and still accepts command-only extras", () => {
    const action = () => {};
    const entries = navigationCommandEntries(
      [
        {
          id: "g",
          label: "Group",
          items: [
            { id: "a", label: "Action", action },
            { id: "b", label: "Inert" },
            { id: "c", label: "Page", href: "/page" },
          ],
        },
      ],
      [{ id: "x", label: "Copy view link", action }],
    );
    expect(entries.map((entry) => entry.label)).toEqual(["Page", "Copy view link"]);
  });
});
