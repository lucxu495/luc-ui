/*
 * The routes the Showcase actually has, read from the file system.
 *
 * Three test files need this — the navigation integrity test, the area test and
 * the visual-element manifest test — and a claim like "every area prefix matches a
 * real page" is only worth checking against the disk. The app directory is
 * *found* rather than assumed, because these tests run under the library's Vitest
 * whose working directory is `packages/ui`, not this app.
 */

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const CANDIDATES = ["app/page.tsx", "apps/showcase/app/page.tsx"];

/** The Showcase app root — the directory that contains `app/`. */
export function findAppRoot(start = process.cwd()): string {
  let dir = start;
  for (let depth = 0; depth < 6; depth += 1) {
    for (const candidate of CANDIDATES) {
      const full = path.join(dir, candidate);
      if (existsSync(full)) return path.dirname(path.dirname(full));
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`app-routes: no Showcase app above ${start}`);
}

/**
 * Every route with a `page.tsx`, one entry per name.
 *
 * A route group `(name)` contributes no segment. A dynamic segment `[param]`
 * contributes its literal bracket form, so a caller can tell a page that exists
 * from one that is generated — `/visuals/elements/[element]` generates
 * `/visuals/elements/waterfall`, and the catalog test is the consumer that cares
 * about the difference.
 */
export function collectRoutes(dir: string, base = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      found.push(...collectRoutes(full, `${base}${segment}`));
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      found.push(base === "" ? "/" : base);
    }
  }
  return found;
}

/** The union of every route on disk: literal and dynamic alike. */
export function showcaseRoutes(): ReadonlySet<string> {
  return new Set(collectRoutes(path.join(findAppRoot(), "app")));
}

/**
 * True when a route is served — literally, or by a dynamic sibling.
 *
 * Only the last segment may be dynamic, which is how every dynamic route in this
 * app is shaped (`[component]`, `[chart]`, `[motion]`, `[category]`,
 * `[direction]`).
 */
export function routeExists(routes: ReadonlySet<string>, route: string): boolean {
  if (routes.has(route)) return true;
  const parent = route.replace(/\/[^/]+$/, "");
  for (const candidate of routes) {
    if (!/\/\[[^\]]+\]$/.test(candidate)) continue;
    if (candidate.replace(/\/\[[^\]]+\]$/, "") === parent) return true;
  }
  return false;
}
