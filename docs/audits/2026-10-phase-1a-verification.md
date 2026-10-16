# LUC UI Phase 1A verification record

Date: 2026-10-08. The work changed documentation, catalog generation/checking, one documentation-coupled test, and an external-consumer smoke script. No component implementation, public export map, license, lockfile, Luc Web file or other subproject source was changed. The prior audit files and concurrent untracked files were left alone.

## What the catalog proves

`packages/ui/scripts/generate-catalog.mjs` reads the package source and packed export keys, resolves the public TypeScript barrels with the compiler, and writes `docs/component-catalog.json` plus `docs/COMPONENT_CATALOG.md`. It checks annotated Showcase routes and import examples in the entry docs, topical guides and skill. `--check` compares generated files to source; `--self-test` deliberately introduces an invalid symbol, a documented path and an export-map mismatch and verifies rejection. The annotations in `packages/ui/scripts/catalog-annotations.json` hold usage guidance, not a second export list.

The catalog currently resolves **34 declared package paths**. It distinguishes all publicly reachable symbols from the curated composition advice. Direct imports of undeclared `src/`/`dist/` paths remain unsupported (`packages/ui/package.json`, `docs/PUBLIC_API.md`).

## Commands and outcomes

The host's `pnpm` Corepack shim expected a missing `pnpm.cjs` while pnpm 12.6.0 had `pnpm.mjs`. For this run, a temporary `/tmp/luc-pnpm-wrapper/pnpm` invoked that installed `pnpm.mjs` without changing the repo. Commands below used `PATH=/tmp/luc-pnpm-wrapper:$PATH` where they call `pnpm`.

| Gate | Exact command | Outcome |
| --- | --- | --- |
| Catalog freshness | `node scripts/generate-catalog.mjs --check` in `luc-ui/packages/ui` | **Pass:** 34 public paths and documented import examples resolve. |
| Deliberate drift | `node scripts/generate-catalog.mjs --self-test` in `luc-ui/packages/ui` | **Pass:** invalid symbol, documented subpath and export-map difference detected. |
| Script syntax | `node --check scripts/generate-catalog.mjs && node --check scripts/independent-consumer.mjs` in `luc-ui/packages/ui` | **Pass.** |
| Package build | `pnpm --filter @luc/ui build:package` in `luc-ui` | **Pass:** tsdown plus CSS/client-directive postbuild. |
| Packed export/tarball | `pnpm --filter @luc/ui verify:package` in `luc-ui` | **Pass:** export parity, publint, packed files and dist metadata. |
| Packed declarations | `pnpm --filter @luc/ui verify:types` in `luc-ui` | **Pass:** attw ESM/bundler profile. |
| Independent install | `pnpm --filter @luc/ui test:independent-consumer` in `luc-ui` | **Pass:** fresh `/tmp/luc-ui-independent-*` npm install of the `.tgz`, React/React DOM 19 peers, TS declarations, Button/DataTable/Chart/ChartSyncGroup/Workspace imports, SSR output, client directive split, Tailwind v4 token/utility generation from packed `dist`, and button-only heavy-import isolation. Temporary fixture was removed after the run. |
| Docs-coupled regression | `pnpm exec vitest run src/forms/public-api.test.tsx` in `luc-ui/packages/ui` | **Pass:** 4/4; now reads the generated catalog rather than a hand-maintained Markdown table. |
| Full source gate | `pnpm verify` in `luc-ui` | **Fail before lint/tests:** existing `src/charts/components/chart.test.tsx` has nine TS18047 nullable-`panel` errors. |
| Package lint | `pnpm --filter @luc/ui lint` in `luc-ui` | **Fail:** three existing exhaustive-deps warnings in `src/charts/adapters/echarts/echart-surface.tsx`, `src/charts/components/distribution-charts.tsx`, `src/charts/components/sequence-charts.tsx` with `--max-warnings 0`. |
| Package tests | `pnpm --filter @luc/ui test` in `luc-ui` | **Fail:** 612 passed / 2 failed (69 files); both failures in `src/motion/kinetic.test.tsx`, where duplicate buttons match `Open study` and `Detail`. The documentation-coupled forms test passes. |
| Existing bundle baseline | `pnpm --filter @luc/ui test:consumer` in `luc-ui` | **Fail:** charts entry 59.1 KB raw versus 52.2 KB baseline plus 4.2 KB allowance. Button-only remains 5.7 KB raw / 2.1 KB gzip and passes the no-heavy-engine checks. The baseline was not updated. |

The failed gates point to chart/motion files outside Phase 1A's implementation scope. They were recorded rather than altered to make a green report. Full visual/release QA was not run because no component visuals changed.

## Remaining work

1. Restore the existing TypeScript, lint, unit and charts bundle gates in a separately scoped maintenance task; investigate the measured charts growth before changing the baseline.
2. The `.context/docs/luc-ui/index.md` handoff should mention the generated catalog, new commands and independent install proof. This request restricted writes to `luc-ui/**`, so it was not edited.
3. For Phase 1B, verify `SharedHighlight` semantics and disabled-button readability in both themes, then clarify Card/selected-track composition as proposed in `2026-10-productization-blueprint.md`. Keep the generic/package boundary and use targeted browser QA.
