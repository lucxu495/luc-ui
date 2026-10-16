# Phase 6 verification log

Every command below was run in this phase, in this order, on the machine that
serves `127.0.0.1:3000`. Exit codes are the real ones.

## 1. Static gates

| # | Command | Working directory | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | `npx tsc --noEmit` | `apps/showcase` | 0 | no diagnostics |
| 2 | `npx eslint . --max-warnings 0` | `apps/showcase` | 0 | no problems |
| 3 | `npx next build` | `apps/showcase` | 0 | every route built (prod build; used to prove the server/client boundaries hold) |
| 4 | `npx vitest run` | `packages/ui` | 0 | **820 passed / 84 files** |
| 5 | `node scripts/i18n-coverage.mjs` | `apps/showcase` | 0 | headers 131/131 · bodies 131/131 · prose 12 180/12 180 · nav 145/145 + 132/132 · chrome 88/88 · content keys 581/581 · 34 sentences ahead of the extractor |
| 6 | `node scripts/i18n-pending.mjs --count` | `apps/showcase` | 0 | `pending unique sentences: 0` |
| 7 | `node scripts/chart-catalog.mjs` | `apps/showcase` | 0 | 81 entries · public 79 · engine 0 · planned 1 · blocked 1 · 76 distinct plots · 78 components · 3 renderers · 5 variants |
| 8 | `pnpm verify` | `luc-ui` | 0 | typecheck + lint + tests + `verify:i18n` + `verify:charts` + `catalog:check` + package build + `verify:package` + `test:consumer` + `verify:types` |

Note on the first `pnpm verify` attempt: it failed at `catalog:check` because the
generated `docs/component-catalog.json` was stale after four new library props.
`pnpm --filter @luc/ui catalog:generate` regenerated it (34 public paths, 10 path
fixtures) and the second run passed. That is the gate doing its job, not a
regression.

## 2. Package / consumer evidence

From the `verify:package` stage (independent consumer harness):

* 34 public entry paths; every declared path resolves for ESM and bundler
  consumers (attw table, all `OK`).
* Button-only bundle: **10.9 KB raw / 3.6 KB gzip, unchanged** from Phase 5 —
  no budget was raised in this phase.
* The subpath isolation assertion (`✓ subpath imports stay isolated`) passes.

## 3. Browser QA against the deployed container

```
$ pnpm qa:full            # luc-ui
  server      : rebuilding image (546 inputs changed)
  server      : healthy
  qa          : mode=full (image rebuilt)
  screenshots : 384
  behaviour   : 81/81 passed
  a11y        : 0 violation(s) across 203 scans
  counters    : providerReady=147 · providerErrors=8 · axeScans=203
  problems    : none
```

Routes: 130. Slowest: `date-time-calendar` 22.8s, `tradingview-overview` 16.7s,
`home` 14.3s.

## 4. Chinese rendering check (deployed)

```
$ LUC_QA_BASE_URL=http://127.0.0.1:3000 node qa/i18n-live.mjs
LUC UI Showcase — Chinese rendering check (130 routes, http://127.0.0.1:3000)
  routes with no English prose leak : 130/130
```

Progression of this check during the phase, kept here because it shows what the
check actually caught:

| Run | Leak routes | Unique segments | Note |
| --- | --- | --- | --- |
| 1 | 56 | 255 | detector was reading the RSC flight payload (`<script>`) — most hits were the English *source* of translated strings |
| 2 | 36 | 97 | after excluding `script, style, template, noscript` and CJK-bearing segments |
| 3 | 23 | 62 | after wrapping the module-level data prose at its render sites |
| 4 | 21 | 58 | palette/typeface/personality registries, `case`/`why` table columns |
| 5 | 11 | 18 | chart-registry notes, `ariaDescription` overrides, `case` key |
| 6 | 3 | 8 | feedback `case` column, home personality notes, Choropleth `ariaDescription` |
| 7 | **0** | **0** | on the deployed image `7460118b9f18` |

## 5. Deployment record (Asia/Singapore)

| Item | Value |
| --- | --- |
| Compose project / service | `luc-ui` / `showcase` |
| Container | `luc-ui-showcase` — running, healthy |
| Endpoint | `127.0.0.1:3000` |
| Previous image | `luc-ui/showcase:1.0.0` = `00829f809b2d` (also tagged `rollback-20261009-pre-phase-6`) |
| Current image | `luc-ui/showcase:1.0.0` = `7460118b9f18` |
| Container start | 2026-10-09 13:07 SGT (05:07 UTC) |
| Other services | untouched — `luc-api`, `luc-web`, `prefect-*`, `luc-redis` all kept their own uptime |
| Rollback | `docker tag luc-ui/showcase:rollback-20261009-pre-phase-6 luc-ui/showcase:1.0.0 && docker compose -p luc-ui up -d showcase` |

## 6. Not run in this phase

| Check | Why |
| --- | --- |
| `pnpm qa:providers` (live third-party tier) | not re-run this cycle; the stub provider tier ran inside `qa:full` |
| `pnpm qa:baseline` (Playwright snapshots) | the screenshot sweep in `qa:full` was the visual evidence used; committed baselines were not regenerated |
| Real-device touch | no device available; pointer contracts + 390px captures stand in |
| Luc Web build / visual regression | out of write scope; source-level compatibility only |
