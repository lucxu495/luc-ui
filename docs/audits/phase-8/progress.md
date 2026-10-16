# Phase 8 — durable progress checkpoint

Updated 2026-10-09, working tree only (`main` at `fce3614`, nothing committed).

## Done

1. Read the actual baseline before writing anything: git state, `AGENTS.md`, the
   `.context` handoff, Phase 4–7 audits, the design system, the chart catalogue
   and the QA harness. Baseline `pnpm verify` was green at 829 tests / 86 files.
2. Fixed the open chart defect at the root. `timeAxisTickPlan` pairs the label
   scale with the tick count; `timeSpanMs` gives six family components the span
   of their own data; `axis-time.test.ts` renders nine spans across four widths
   through the real engine (43 assertions). Month labels now end at 330 days.
3. Built `@luc/ui/experiences`: seven composites, one new subpath, catalog
   annotations, a tsdown entry, publishConfig parity, 16 unit tests and a
   consumer isolation scenario.
4. Built sixteen reference products plus the `/experiences` hub — four
   general-purpose, four personal, eight vertical. All typechecked, all linted
   at `--max-warnings 0`, all fully bilingual.
5. Closed the bilingual gap in the same pass: 148/148 route headers, 14096/14096
   prose sentences, 163/163 navigation labels, 149/149 descriptions, 88/88
   chrome strings. The two new copy attributes (`journey`, `appearance`) were
   added to the extractor's `COPY_ATTRS`, so the checker requires them rather
   than trusting them.
6. Registered everything: the sidebar group, the QA route registry (16 new
   routes in an `experiences` group), the changed-file to route mapping, and a
   16-check behaviour group driven from the public API rather than test ids.
7. Extended the packed-package proof so `@luc/ui/experiences` must resolve,
   typecheck and server-render from an installed tarball outside the workspace.
8. Verified: `pnpm verify` exit 0 (898 tests / 89 files); the `experiences`
   behaviour group 16/16; the catalog regenerated and in sync.
9. Preserved the rollback image (`rollback-20261009-pre-phase-8` =
   `47d1ce33584f`) and rebuilt the Showcase.

## In flight

- The full 148-route sweep with every behaviour group.
- The chart geometry probe extended to the two experience pages with charts.
- The cross-browser pass (Chromium and Firefox).
- The live bilingual spot-check against the deployed container.

## Remaining after that

- `docs/audits/phase-8/verification-log.md` with exact commands and outputs.
- A `DESIGN_SYSTEM.md` cross-reference, the `.context` version note and the
  README section for the new subpath.
- The Chinese terminal report (sections A to M).

## Exact continuation commands

```bash
cd /home/luc/code/luc-quant/luc-ui
pnpm verify                                   # tests, i18n, charts, package, consumer
node scripts/qa-server.mjs --mode=full        # 148 routes + all behaviour groups
node scripts/qa-server.mjs --mode=behaviour --group=experiences
node apps/showcase/qa/chart-geometry.mjs --route-groups=charts
node apps/showcase/qa/chart-assertions.mjs
node apps/showcase/qa/chart-units.mjs
node apps/showcase/qa/inspect.mjs --all
node apps/showcase/qa/browsers.mjs
node apps/showcase/scripts/i18n-coverage.mjs
```

Rollback:

```bash
docker tag luc-ui/showcase:rollback-20261009-pre-phase-8 luc-ui/showcase:1.0.0
docker compose -p luc-ui up -d showcase
```

## Known limits at the checkpoint

WebKit cannot launch on this host; no physical device was used; per-chart
zoom/brush geometry is asserted behaviourally rather than by pixels; Luc Web was
not built or opened.
