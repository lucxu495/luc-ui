# Package modularity and import-cost audit

**Date:** 2026-10-08 · **Scope:** `@luc/ui` packaging, exports and per-entry cost.
**Status:** audit only. No package was split and no entry point was added by
this audit, with one exception noted in §6 (a new `motion-spatial` scenario in
the consumer harness — a measurement, not a feature).

---

## 1. How this was measured

Everything below comes from the repository's own harness, run on this tree:

| Command | What it produced |
| --- | --- |
| `pnpm --filter @luc/ui build:package` | `dist/` — 227 modules, 217 declaration files |
| `pnpm --filter @luc/ui verify:package` | exports/tarball/metadata agreement, own-module sizes |
| `node scripts/consumer-test.mjs` | a real Vite consumer build per entry point (table in §3) |
| `pnpm --filter @luc/ui catalog:check` | 34 public paths, all documented imports resolve, 10 path fixtures |
| `pnpm --filter @luc/ui verify:types` | `attw` on the ESM profile |

## 2. Current exports architecture

- **One package, many entry points.** `@luc/ui` keeps a single install and a
  stable `exports` map with **34 keys**: 31 code entries, `styles.css`,
  `tokens.css`, and `package.json`.
- **`exports` in the repo points at source** (`./src/*.ts`) so the Showcase
  consumes TypeScript directly; `publishConfig.exports` points at the compiled
  `dist/`, so a consumer resolves `dist/index.js` and `dist/index.d.ts`. The
  consumer harness resolves against `dist/`, which is the shape a real
  application sees.
- **Heavy engines are isolated by entry, not by convention.**
  `@luc/ui/charts`, `@luc/ui/financial-chart` and `@luc/ui/tradingview` are the
  only paths that may reach a chart engine or a provider script. The consumer
  test fails the build if a non-chart entry's bundle contains `echarts`,
  `lightweight-charts` or a TradingView host string.
- **CSS is a side effect and is declared as one.**
  `"sideEffects": ["**/*.css"]` keeps the stylesheet from being tree-shaken
  away while letting every `.ts`/`.tsx` module be dropped when unused.
- **Client boundaries are explicit.** Every interactive module carries
  `"use client"` and the build preserves the directive
  (`postbuild.mjs` reports how many it restored); SSR-only entries stay free of
  browser globals.

## 3. Per-entry cost, measured

Vite production build of a consumer that imports exactly one entry
(`bundle-baseline.json` is generated from this run):

| Entry | Raw | Gzip |
| --- | --- | --- |
| `@luc/ui/components/button` (button-only) | 10.8 KB | 3.6 KB |
| `@luc/ui/menus` (dropdown + context) | 2.8 KB | 1.2 KB |
| `@luc/ui/alert` + `@luc/ui/empty-state` | 4.5 KB | 1.6 KB |
| `@luc/ui/motion` — one primitive (`ParallaxScene`) | **6.2 KB** | **2.2 KB** |
| `@luc/ui/slider` | 6.4 KB | 2.4 KB |
| `@luc/ui` barrel (Button + toast + Field) | 14.4 KB | 4.6 KB |
| `@luc/ui/date-picker` + `@luc/ui/calendar` | 28.6 KB | 8.4 KB |
| `@luc/ui/app-shell` + `@luc/ui/workspace` | 29.6 KB | 8.7 KB |
| `@luc/ui/tradingview` | 52.0 KB | 13.7 KB |
| `@luc/ui/charts` | 59.1 KB | 18.1 KB |

Package-level numbers, for the other half of the cost:

| Measure | Value |
| --- | --- |
| Packed tarball | **863 files · 994.7 KB** |
| Compiled JS | 227 modules · 941.1 KB total · **230.2 KB gzip of everything** |
| Root entry, own module only | 25.3 KB (`app-shell` 1.5 KB, `workspace` 0.8 KB, `url-state` 0.8 KB) |

## 4. What the numbers actually say

1. **Installation cost ≠ bundle cost ≠ runtime cost.** A consumer downloads
   ~995 KB of tarball (fonts and CSS included) and bundles between 2.8 KB and
   59 KB depending on what it imports. The gzip figure that matters is per
   entry, and it is the one the harness enforces.
2. **Tree shaking works, and it is proven per entry, not asserted.** Adding a
   motion primitive costs 6.2 KB raw / 2.2 KB gzip and pulls in neither a chart
   engine nor a provider script. `motion-spatial` was added to the harness in
   this cycle precisely so that claim is checked on every run.
3. **The barrel is a convenience with a real ceiling.** 14.4 KB raw for
   `Button + toast + Field` is fine for an app that will use most of the
   library; it is the wrong import for a page that needs one control. The
   documentation should keep saying so.
4. **The chart entry dominates, by design.** `@luc/ui/charts` is 59.1 KB raw /
   18.1 KB gzip, and that is the point of a separate entry: the engines are
   loaded on demand and never reach a non-chart consumer.

## 5. Heavy-dependency boundaries, verified

| Dependency | Reached only from | Enforcement |
| --- | --- | --- |
| `echarts` (Apache-2.0) | `@luc/ui/charts`, `@luc/ui/financial-chart` via `charts/adapters/**` | `forbidden` strings in the consumer test; `luc/no-deep-package-imports` lint rule |
| `lightweight-charts` (Apache-2.0) | same | same |
| TradingView provider hosts | `@luc/ui/tradingview` only | consumer test rejects any provider host string in other entries; the loader is the only place a script URL is built |
| `react-aria-components`, `@internationalized/date` (Apache-2.0) | `@luc/ui/datetime`, `@luc/ui/date-picker` | consumer test `forbidden` list |
| `motion` (Motion for React) | `@luc/ui/motion` and the primitives that use it | entry isolation (this audit) |
| `sonner`, `cmdk`, `downshift`, `input-otp`, `@tanstack/*` | their own components | per-entry measurement above |

## 6. Changes made by this audit

One, and it is a measurement rather than a feature: a `motion-spatial` scenario
was added to `scripts/consumer-test.mjs`, and its size recorded in
`bundle-baseline.json` (6,206 bytes raw / 2,227 gzip). Recording a new entry is
not raising a budget — the existing 8%-or-1 KB tolerance applies to every entry
unchanged, and re-running the harness with the new scenario moved the other nine
entries by at most 30 bytes (build-to-build variance).

## 7. Recommendations (not implemented)

1. **Keep one package.** Nothing measured here justifies a repository-wide
   split: the entries are already isolated, the tarball is under 1 MB, and a
   multi-package split would introduce version skew for no measured gain.
2. **Split only when a dependency forces it.** The two candidates that meet that
   bar are the dnd layer (a ~10 KB dependency that most consumers do not want)
   and media/editor adapters (heavy, opinionated, licence-sensitive). Both are
   proposed as *extra entry points*, not extra packages.
3. **Publish a per-entry weight class** in the generated catalog (small / medium
   / heavy, derived from this harness) so an agent or a developer can choose an
   import without reading the bundle table.
4. **Keep the consumer harness as the gate.** It is the only mechanism here that
   measures what a consumer actually ships, and it caught nothing this cycle —
   which is the desired outcome, and worth preserving.
5. **Do not raise tolerances.** The 8%-or-1 KB rule was not touched; the only
   baseline change was a new entry.
