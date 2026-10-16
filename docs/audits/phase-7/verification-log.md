# Phase 7 verification log

Every command below was run on the machine that serves `127.0.0.1:3000`. Exit
codes are the real ones. `127.0.0.1:3100` is a host production build used for the
fast iteration loop; the deployed container is `127.0.0.1:3000`.

## 1. Engineering gates

| # | Command | Working directory | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | `pnpm verify` | `luc-ui` | **0** | typecheck → lint → 829 tests → `verify:i18n` → `verify:charts` (catalogue + unit contract) → `catalog:check` → package build → `verify:package` → `test:consumer` → `verify:types` |
| 2 | `npx vitest run` | `packages/ui` | 0 | **829 passed / 86 files** (was 820/84) |
| 3 | `npx eslint . --max-warnings 0` | `apps/showcase` | 0 | no problems |
| 4 | `npx tsc --noEmit` | `apps/showcase` | 0 | no diagnostics |
| 5 | `npx next build` | `apps/showcase` | 0 | every route builds |
| 6 | `node scripts/i18n-coverage.mjs` | `apps/showcase` | 0 | headers 131/131 · **bodies 131/131** · nav 145/145 + 132/132 · chrome 88/88 · content keys 581/581 · prose **12 180/12 180** |
| 7 | `node scripts/chart-catalog.mjs` | `apps/showcase` | 0 | 81 entries · public 79 · engine 0 · planned 1 · blocked 1 · 76 distinct plots · 78 components · 3 renderers |
| 8 | `node qa/chart-units.mjs` | `apps/showcase` | 0 | **11/11** unit contracts |
| 9 | `pnpm test:consumer` | `packages/ui` | 0 | 17 bundle rows; `✓ subpath imports stay isolated`; button-only **10.9 KB raw / 3.6 KB gzip, unchanged** |

Note on the `catalog:check` failure during the phase: it failed once, correctly,
because `DialogContent` and `SheetContent` changed their destructured parameter
list. `catalog:generate` was re-run and the diff was reviewed: 4 signature rows,
0 removed exports, 0 new paths. The second `pnpm verify` passed.

## 2. Structural probe

```
$ node qa/inspect.mjs --all                       # 131 routes
summary {"routes":131,"hOverflow":0,"clip":0,"tiny":130,"collapsed":0,"console":0,"errors":0}
```

`tiny: 130` is one row per route and is the Showcase's own appearance bar. Six of
those are chrome (the sidebar rail and five segmented/radio controls) and are
excluded from the per-component triage; what remained is recorded in the audit's
issue table. After the fixes the remaining findings are: the date/time segment
band (accepted deviation), third-party TradingView attribution (not LUC's DOM),
and inline-adjacent links that satisfy WCAG 2.5.8's spacing exception.

## 3. Chart verification

```
$ node qa/chart-geometry.mjs --route-groups=charts     # against the deployed container
plots 126 · failing 0

$ node qa/chart-assertions.mjs
10/10 assertions passed

$ node qa/chart-units.mjs
11/11 chart unit contracts hold
```

## 4. Browser QA (Chromium, deployed container)

```
$ pnpm qa:full
  server      : rebuilding image (549 inputs changed)
  server      : healthy
  qa          : mode=full (image rebuilt)
  routes      : 131
  screenshots : 389
  behaviour   : 93/93 passed
  a11y        : 0 violation(s) across 204 scans
  counters    : providerReady=147 · providerErrors=8 · axeScans=204
  problems    : none
```

Slowest routes: `date-time-calendar` 25.0 s · `date-time-date-range` 17.4 s ·
`tradingview-overview` 16.4 s · `patterns-research-workspace` 15.4 s ·
`home` 14.7 s. The route sweep took 395.8 s; the behaviour suite 154.4 s.

## 5. Cross-browser

```
$ node qa/browsers.mjs
  chromium  routes=29 failures=0
  firefox   routes=29 failures=0
  webkit    UNAVAILABLE — host system is missing libhyphen, libsecret, libGLESv2, libx264
engines ran=2 unavailable=1 failing=0
```

The 29 rows are 26 desktop routes plus 3 mobile (390×844) routes, each carrying
the structural probe and an axe scan in the engine's own browser.

## 6. Chinese rendering (deployed)

```
$ LUC_QA_BASE_URL=http://127.0.0.1:3000 node qa/i18n-live.mjs
LUC UI Showcase — Chinese rendering check (131 routes, http://127.0.0.1:3000)
  routes with no English prose leak : 131/131
```

## 7. Deployment

| Item | Value |
| --- | --- |
| Compose project / service | `luc-ui` / `showcase` |
| Container | `luc-ui-showcase` — running, healthy |
| Endpoint | `127.0.0.1:3000` |
| Previous image | `luc-ui/showcase:1.0.0` = `7460118b9f18` (tagged `rollback-20261009-pre-phase-7`) |
| Current image | `luc-ui/showcase:1.0.0` = **`47d1ce33584f`** |
| Container start | 2026-10-09 16:16 SGT (08:16 UTC) |
| Other services | untouched — `luc-api`, `luc-web`, `prefect-*`, `luc-redis`, `luc-clickhouse` kept their own uptime |
| Rollback | `docker tag luc-ui/showcase:rollback-20261009-pre-phase-7 luc-ui/showcase:1.0.0 && docker compose -p luc-ui up -d showcase` |

## 8. Not run in this phase

| Check | Why |
| --- | --- |
| WebKit / Safari-compatible pass | browser installs, host libraries missing; installing them is a system-package change |
| Real-device touch | no device; pointer contracts plus 390 px captures stand in |
| `pnpm qa:providers` (live third-party tier) | the deterministic stub tier ran inside `qa:full`; the live tier needs provider availability and was not re-run this cycle |
| `pnpm qa:baseline` (Playwright pixel baselines) | baselines were not regenerated; the demo-level before/after pairs in `evidence/` are the visual evidence for this phase |
| Luc Web build / visual regression | out of write scope |
