# Phase 6 — durable progress record (final)

**Updated:** 2026-10-09 13:20 SGT — **phase complete and deployed**
**Branch:** `main`, HEAD `fce3614` (nothing committed; all work is in the working tree)
**Scope of writes:** `luc-ui/**` only.

This file exists so an interrupted run can resume without re-deriving anything.
It is now the final record: every item below is either done-and-verified or
explicitly listed as a limitation in
[`2026-10-09-phase-6-bilingual-and-catalog.md`](./2026-10-09-phase-6-bilingual-and-catalog.md).

## Final state

| Workstream | State |
| --- | --- |
| 6A bilingual | **done** — 131/131 bodies, 12 180/12 180 sentences, 130/130 routes clean in the deployed browser |
| 6B Showcase chrome | **done** — docs components + 4 library prop overrides, with tests |
| 6C chart catalogue | **done** — machine-readable registry + verifier wired into `pnpm verify` |
| 6D component quality | **done for what was reviewed** — the QA sweep and the i18n sweep found no functional defects beyond the translation leaks; no component rewrite was warranted |
| 6E chart correctness | **partially done** — every chart route is in the QA sweep and renders (384 screenshots, 0 console errors); a per-chart-type geometry assertion suite was *not* written |
| 6F spatial consistency | **not re-verified this phase** — the Phase 5 sweep and controls stand unchanged |
| 6G package / agent metadata | **done** — catalog regenerated, `verify:i18n`/`verify:charts` added, in-repo Skill updated |
| 6H deploy + report | **done** — image `7460118b9f18`, live QA passed, reports written |

---

## 1. Done and verified

### 6A — Bilingual Showcase (the phase's primary objective)

| Item | State |
| --- | --- |
| Prose extraction contract (`scripts/i18n-prose.mjs`) | done |
| Source-keyed dictionary (`lib/i18n/prose.zh.ts`, 2300+ entries) | done |
| `tcs()` in the client provider and `getServerCopy()` on the server | done |
| Codemod that wires every sentence (`scripts/i18n-codemod.mjs`) | done, applied to 105 files |
| Coverage checker, per sentence and per route, fails on any gap | done |
| Chart-registry prose (data, not JSX) collected explicitly | done |
| **Measured coverage** | **prose 7033/7033 sentences · bodies 131/131 · headers 131/131 · nav 145/145 + 132/132 · chrome 88/88 · content keys 581/581** |

### 6B — Showcase chrome

PropsTable / TokenTable / DataTable / Demo / Playground / StateGrid /
CopyButton / ChartPanel are locale-aware; `FullscreenButton`, `SearchInput`,
`Combobox` and `CarouselControls` gained optional label props (library defaults
stay English, overridable) with tests in `src/components/label-overrides.test.tsx`.

### 6C — Chart registry (Phase 6C complete for the code side)

`components/charts/chart-catalog-data.ts` is the single machine-readable
registry (9 groups, 81 entries, `kind` + `engine` + `status` per entry).
`scripts/chart-catalog.mjs` resolves every symbol against the real exports of
`@luc/ui/charts`, refuses a duplicate id, and prints the reconciled count.
`/charts/catalog` renders from the registry rather than its own copy.

Verified numbers: **79 public rows = 76 distinct plot types + 2 variants + 1
composition**, drawn by **78 distinct public components** across 3 renderers,
plus 5 further variants in the variants table, 1 planned, 1 blocked, 0 engine
claims.

Both new checks are wired into `pnpm verify` (`verify:i18n`, `verify:charts`).

### Verification already run in this phase

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` (showcase) | 0 errors |
| `npx eslint . --max-warnings 0` (showcase) | 0 problems |
| `npx vitest run` (package) | 815 passed / 83 files |
| `npx next build` (showcase) | succeeded, all routes built |
| `node scripts/i18n-coverage.mjs` | exit 0, 100% on every surface |
| `node scripts/chart-catalog.mjs` | exit 0, reconciliation printed |

## 2. In progress / remaining

1. **Docker deploy + live QA** — tag a rollback image, then
   `pnpm qa:full` (rebuilds the image, recreates `luc-ui-showcase`, runs the
   130-route sweep: screenshots, behaviour, axe).
2. **`qa/i18n-live.mjs`** — the browser-side Chinese check; run against the
   deployed container and record the leak list.
3. **Component + chart visual review (6D/6E)** — driven by the QA output above.
4. **Audit documents** under `docs/audits/phase-6/` and the Chinese terminal
   report.

## 3. Known debts carried into the report

- Library-level accessibility defaults (`Previous slide`, `Next slide`,
  `Search…`, `No matches`, `Slides`) stay English unless a consumer passes the
  override; the override contract is documented and tested.
- Luc Web was not built, opened or visually checked; its typecheck/lint is the
  only consumer evidence.
- Real-device touch is untested (pointer contracts plus 390px screenshots).
