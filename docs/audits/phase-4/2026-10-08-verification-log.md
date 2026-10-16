# Phase 4 — verification log (exact commands and results)

**Date:** 2026-10-08/09 · **Branch:** `main` @ `fce36146` (nothing committed)

Every command below was run in `/home/luc/code/luc-quant/luc-ui` against the
final working tree, except the QA sweeps, which ran against the Docker container.

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `pnpm typecheck` | 0 | packages/ui + apps/showcase + luc-web clean |
| 2 | `pnpm lint` | 0 | ESLint flat config, `--max-warnings 0`, all three projects |
| 3 | `pnpm --filter @luc/ui test` | 0 | **763 passed / 81 files** (was 674 / 72) |
| 4 | `pnpm --filter @luc/ui catalog:check` | 0 | 34 public paths, all documented imports resolve, 10 path fixtures |
| 5 | `pnpm --filter @luc/ui build:package` | 0 | tsdown: 250 modules, 241 declarations |
| 6 | `pnpm --filter @luc/ui verify:package` | 0 | tarball 957 files / 1138.1 KB; publint clean |
| 7 | `pnpm --filter @luc/ui test:consumer` | 0 | 16 scenarios, isolation assertions pass (see §G of the report) |
| 8 | `pnpm --filter @luc/ui verify:types` | 0 | attw, ESM + bundler profiles, every entry point |
| 9 | `pnpm verify` (1–8 in one run) | **0** | the workspace gate |
| 10 | `node apps/showcase/scripts/i18n-coverage.mjs` | 0 | 121 routes · headers 121/121 · nav 135/135 + 122/122 · chrome 82/82 · content 380/380 · bodies 19/121 |
| 11 | `pnpm qa:full` | 0 | 120 routes · 358 screenshots · behaviour **81/81** · axe **0/185** · 0 console errors · 0 page errors · **no problems** |
| 12 | `pnpm qa:providers` (live) | 0 | 6/6 behaviour · 147 widgets ready · 14 axe scans, 0 violations |
| 13 | `pnpm qa:baseline` | 0 | 15/15 pixel baselines |
| 14 | `node qa/probe.mjs <route>` | 0 | per-route hydration + console probe (a debugging tool, not a gate) |

## Notes on scope and honesty

- **Order of runs.** Items 11–13 ran last, against the image currently deployed
  (`sha256:ddd6cb73c344…`). Item 12 (`qa:providers`, live) ran before the final
  chart fixes, which touched only the five new chart modules, the scientific
  Showcase page, and one chart test — none of which is loaded by a TradingView
  route. It is reported as such rather than re-labelled as a post-fix run.
- **`qa:full` is the gate that found the real defects.** Two chart routes
  returned HTTP 500 at one point, three charts rendered blank, and two axe
  violations appeared — all while `pnpm verify`, typecheck, lint and 763 unit
  tests were green. Unit tests prove contracts; only the browser sweep proves a
  page.
- **Visual baselines were regenerated** (`qa:baseline:update`) because the
  spatial language intentionally changes elevation, hover travel, focus rings and
  field surfaces. The 15 images are committed artifacts; the change is recorded
  here and in the Phase 4 audit rather than silently absorbed.
- **Not run:** `pnpm qa:release` (which is `verify` + `qa:full` + `qa:providers`
  + `qa:baseline` in one command). Its four constituents were each run and passed
  individually; the composite was skipped to avoid a third full rebuild.
- **Luc Web was not opened, built or tested.** `luc-web` typecheck and lint ran
  as part of the workspace gate; nothing else touched it.
