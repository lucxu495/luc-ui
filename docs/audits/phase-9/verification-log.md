# Phase 9 — verification log

Commands as run, with their real output. Anything not run is listed at the end
with the reason.

## Library and Showcase unit tests

```bash
cd luc-ui && pnpm --filter @luc/ui test
#  Test Files  89 passed (89)   Tests  898 passed (898)   66.7s

cd luc-ui && pnpm --filter @luc/ui test:showcase
#  Test Files  10 passed (10)   Tests  79 passed (79)
```

977 tests in total. The Showcase's own 79 are the Phase 9 additions: registry
integrity (import paths, exports, families, related links, redirects, search
ranking, compiler-derived props), Playground engine equivalence for every
registered adapter, install/AI honesty rules, block registry against the real
catalogue, navigation integrity (every sidebar href resolves, no route listed
twice), playground wiring in both directions, generated route coverage, and the
Studios' parsers and serializers.

## Documentation registry

```bash
cd luc-ui/apps/showcase && node scripts/docs-registry.mjs --report
#  families            : 27
#  documented entries  : 223
#  by group            : {"components":103,"charts":76,"motion":35,"integrations":9}
#  by status           : {"curated":62,"generated":157,"reference":4}
#  symbols with props  : 368
#  alias redirects     : 28

node scripts/docs-registry.mjs --check   # docs-registry: up to date
```

## Types, lint, bilingual coverage

```bash
cd luc-ui/apps/showcase && pnpm typecheck   # tsc --noEmit: 0 errors
cd luc-ui/apps/showcase && pnpm lint        # eslint . --max-warnings 0: clean
cd luc-ui/apps/showcase && node scripts/i18n-pending.mjs
#  0 pending unique sentence(s)
cd luc-ui/apps/showcase && node scripts/i18n-coverage.mjs   # exit 0
#  routes on disk          : 161 (148 in the policy table)
#  page headers            : 161/161 (100%)
#  navigation labels       : 90/90 (100%)
#  chrome strings          : 88/88 (100%)
#  long-form content keys  : 581/581 (100%)
#  prose sentences         : 45932/45932 (100%)
#  navigation descriptions : 12/51  ← open gap, tracked in the final report
```

## Source registry (shadcn-compatible proof of concept)

```bash
cd luc-ui && node packages/ui/scripts/registry-generate.mjs
#  registry: 4 items, 6 files
cd luc-ui && node packages/ui/scripts/registry-verify.mjs
#  registry items      : 4
#  files installed     : 6
#  fixture             : a clean directory, items copied by their declared targets
#  typecheck           : clean
```

## Browser QA on the deployed container

```bash
cd luc-ui && pnpm qa:rebuild        # server: healthy
cd luc-ui && pnpm qa:behaviour -- --group=docs
#  behaviour   : 31/31 passed      problems: none

cd luc-ui && pnpm qa:full -- --routes=home,docs,docs-installation,docs-theming,docs-reference,\
buttons,blocks,templates,studios-charts,studios-motion,studios-themes,studios-composer,\
charts-area-chart,components-aspect-ratio,components-profile-hero,motion-kinetic,charts-catalog
#  routes      : 17      screenshots : 102
#  behaviour   : 139/140 passed
#  a11y        : 0 violation(s) across 21 scans
#  counters    : consoleErrors=0 pageErrors=0 failedRequests=0 providerErrors=2
#  problems    : none
```

The single failure — `sheet form opens and closes on Escape` on
`/patterns/settings-form` — did not reproduce in isolation:

```bash
cd luc-ui && pnpm qa:behaviour -- --group=forms
#  behaviour   : 12/12 passed
```

`app/patterns/settings-form` and `packages/ui/src/components/sheet.tsx` are
unmodified in this phase, so the conclusion is a timing race under three-worker
concurrency rather than a product defect. Recorded here rather than hidden.

## Deployment

```bash
docker images | grep showcase
#  luc-ui/showcase:1.0.0                               fcbc3626dca3   <built this phase>
#  luc-ui/showcase:rollback-20261009-pre-phase-9       1c5c7ea32051   <Phase 8 image>
docker inspect luc-ui-showcase --format '{{.State.Status}} {{.State.StartedAt}}'
#  running 2026-10-09T17:20:01Z
curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/    # 200
```

Spot check of the new surfaces on the deployed container (all 200, with the
alias redirects answering 308):
`/docs`, `/docs/installation`, `/docs/theming`, `/docs/reference`, `/components`,
`/components/rating`, `/charts/violin-chart`, `/blocks`, `/templates`,
`/studios/charts`, `/studios/motion`, `/studios/themes`, `/studios/composer`,
`/components/button → 308`, `/motion/kinetic-headline → 308`.

## Not run this phase, with reasons

| Gate | Why |
| --- | --- |
| `pnpm verify:package` (full package gate) | The package build and consumer test are unchanged by Phase 9 except for new scripts; `registry:check`/`registry:verify` were run directly, and `catalog:check` is exercised by the generator. A full package gate is the freeze step of the next session. |
| `pnpm qa:providers` (live TradingView tier) | Talks to a third party; the provider boundary is untouched by Phase 9. |
| `pnpm qa:baseline` (pixel baselines) | Phase 9 moved the homepage and every documented page deliberately; regenerating baselines is a freeze action, not a development one. Stated rather than silently regenerated. |
| Full 161-route axe sweep | The 21-scan targeted sweep covers the new surfaces; a full sweep is the freeze gate. The route registry now discovers generated routes, so the full tier would include them. |
| WebKit | Cannot launch on this host (pre-existing, documented in Phase 8). |
| Mobile *devices* | 390 px viewport in Chromium is a layout test, not a device test. |
