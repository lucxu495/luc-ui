# LUC UI — Packaging guide

## What ships

`@luc/ui` is a **compiled** package: ESM plus declarations, one output module
per source module, with a curated export map and one public stylesheet.

## How it is published

Not to a registry. A release is a git tag whose commit root *is* the built
package; `docs/RELEASES.md` is the contract, `docs/CONSUMERS.md` the consumer
recipe.

```bash
pnpm --filter @luc/ui release:build     # pack + unpack into luc-ui/release/
pnpm --filter @luc/ui release:check     # rebuild and compare (in `pnpm verify`)
pnpm --filter @luc/ui test:git-consumer # install the release from a local git ref
```

Everything below is unchanged by that: the release tree is the packed tarball
unpacked, so the manifest, the export map, the CSS and the bundle sizes described
here are what a consumer installs — the only difference is which transport
delivers them.

```bash
cd luc-ui
pnpm build:package     # tsdown + post-build (CSS copy, directive check)
pnpm verify:package    # exports, tarball, publint, size report
pnpm test:consumer     # bundler smoke test through the public subpaths
```

## Public entry points

| Subpath | What it is |
| --- | --- |
| `@luc/ui` | The whole surface, for convenience |
| `@luc/ui/components/button`, `/input`, `/select`, `/combobox`, `/sheet`, `/toast`, `/command` | One component, one import |
| `@luc/ui/app-shell` | Shell, sidebar, breadcrumbs, page header |
| `@luc/ui/workspace` | Panes, handles, inspector |
| `@luc/ui/url-state` | Codecs and parameter sets (no React) |
| `@luc/ui/data-table` | DataTable, columns, toolbar |
| `@luc/ui/charts`, `@luc/ui/financial-chart` | Chart chrome and the two engines |
| `@luc/ui/forms`, `@luc/ui/forms/react-hook-form` | Form primitives; the optional adapter |
| `@luc/ui/datetime`, `@luc/ui/date-picker`, `@luc/ui/calendar` | Date and time |
| `@luc/ui/layout`, `/motion`, `/hooks`, `/providers`, `/utils`, `/data` | Foundations |
| `@luc/ui/styles.css`, `@luc/ui/tokens.css` | The stylesheet and the raw tokens |

The map is hand-curated on purpose: `exports: true` in the build tool would
publish every internal file, including the chart adapters.

## Consuming it

```css
/* app/globals.css */
@import "tailwindcss";
@import "@luc/ui/styles.css";
```

```tsx
import { Button } from "@luc/ui/components/button";
import { AppShell } from "@luc/ui/app-shell";
```

**Tailwind is required**, and this is stated rather than hidden. The components
are styled with Tailwind utility classes, so the consumer's Tailwind build
compiles them; the package's stylesheet carries the tokens, the base layer, the
utilities, the chart styles and the toast skin, and its `@source` already points
at the compiled modules. You do not scan our source tree, and there is no second
CSS file to remember.

No `transpilePackages`. The published manifest points at `dist`.

## Peer dependencies

| Package | Kind | Why |
| --- | --- | --- |
| `react`, `react-dom` | peer, required | A component library must not own React. |
| `react-hook-form` | peer, **optional** | Only reachable through `@luc/ui/forms/react-hook-form`. |
| Everything else (`radix-ui`, `echarts`, `lightweight-charts`, `react-aria-components`, `@internationalized/date`, `@tanstack/*`, `downshift`, `cmdk`, `sonner`, `motion`, `input-otp`, `react-resizable-panels`, `@remixicon/react`, `clsx`, `class-variance-authority`, `tailwind-merge`) | dependency | Installed for you; external to the bundle, so your bundler decides what to include. |

## Tree shaking

Subpath imports are isolated because the build is unbundled. Measured by
`pnpm test:consumer`, with every third-party module external, minified:

| Entry | Raw | Gzip |
| --- | --- | --- |
| `components/button` | 5.7 KB | 2.1 KB |
| `date-picker` | 23.9 KB | 6.9 KB |
| `app-shell` + `workspace` | 24.7 KB | 7.2 KB |
| `charts` (chrome only) | 43.4 KB | 13.4 KB |

The assertions are the contract: a button-only bundle that contains `echarts`,
`lightweight-charts` or the date system fails the test. Chart engines stay
dynamically imported, so they never load on a page that does not draw one.

## Client boundaries

`"use client"` is preserved on every module that has it. The build verifies this
after bundling — a directive silently dropped by a minifier is a React Server
Components bug that only appears in a real app.

## Validation

`pnpm verify:package` checks the artefact that would be published:

1. every declared export path exists, in source and in `dist`;
2. the source map and the published map declare the same subpaths (no drift);
3. `publint` lints the packed tarball;
4. the tarball contains `dist` and `README.md`, and no `src`;
5. a size report for the whole package.

`pnpm verify` runs typecheck, lint, tests, the Showcase production build and
these package gates. Nothing is published by any of them.

### V1.0 additions

1. **`attw` (Are The Types Wrong) runs against the packed artifact** through
   `scripts/verify-types.mjs`, with the `esm-only` profile. The two CSS entry
   points are excluded because a stylesheet has no types; their existence is
   asserted by `verify-package.mjs` instead. The ignore is a documented
   limitation of an ESM-only package, not a silenced error — Node 10 resolution
   cannot see `exports` subpaths at all, and a CommonJS `require()` of an ESM
   module is expected to need `import()`.
2. **A bundle baseline is a gate.** `scripts/consumer-test.mjs` measures each
   representative entry point and compares it with
   `packages/ui/bundle-baseline.json`. It fails only on a *meaningful*
   regression — more than 8% or 1 KB over the recorded size, whichever is
   larger. Regenerate deliberately with `LUC_UPDATE_BASELINE=1 pnpm
   test:consumer` and record why in `docs/research/dependency-decisions.md`.
3. **Tiers.** `pnpm verify` is the fast gate (typecheck, lint, tests, Showcase
   build, package gates). `pnpm qa:browser` is behaviour-only, `pnpm qa:visual`
   adds screenshots and axe, and `pnpm verify:release` runs everything.

At the V1.0 freeze the numbers were: tarball **665 files / 662.2 KB**, dist
**177 modules / 167 declaration files**, and entry points from **5.7 KB**
(button only) to **43.6 KB** (charts).

## Design contracts as lint rules

Two house rules run in both packages (`eslint-rules/no-raw-color-literals.mjs`):

- **no-raw-color-literals** — colour comes from a token; a literal in a utility
  class or an inline style is an error. `themeColor` metadata in
  `app/layout.tsx` is the one documented exception.
- **no-deep-package-imports** — `@luc/ui/src/...` and `@luc/ui/dist/...` are
  errors; use a public subpath.

`@shadcn/lint` is the mature version of this idea. It was re-evaluated at V1.0
and **not adopted**: it is still 0.2.x, it needs a hand-written contract per
component before it reports anything, and it would overlap with the two rules
above. The decision, and what would reverse it, is recorded in
`docs/research/dependency-decisions.md` under "V1.0 rows". The contracts that
cannot be expressed as a lint rule live in `DESIGN_SYSTEM.md` §9 and in the
"check the inventory first" rule at the top of `docs/COMPONENT_INVENTORY.md`.

## What a consumer may change

| Allowed | Not allowed |
| --- | --- |
| Layout: width, margin, grid/flex placement | Colours, borders, radius, shadows |
| Documented variants and sizes | Internal padding of a component's slots |
| Density (`data-density`) | Motion durations or easing |
| Token overrides at the product-theme layer | One-off arbitrary values in a class |
