# Brief — professional Studios (Agent E)

Owner: one implementation agent, working only inside `luc-ui/**`.
Plan of record: `luc-ui/docs/audits/phase-9/00-architecture-and-coordination.md`.
Also read: `luc-ui/DESIGN_SYSTEM.md`, `luc-ui/docs/CHART_GUIDE.md`,
`luc-ui/apps/showcase/AGENTS.md`.

Ignore everything in the worktree about `luc-intelligence`, `luc-jobs`,
`luc-api` and `.context`: other agents own those and they are not your business.

## Context to consume, not reinvent

- Verified chart catalogue: `apps/showcase/components/charts/chart-catalog-data.ts`
  (`chartGroups`; entries carry `id`, `name`, `symbol`, `kind`, `status`
  (`public`/`engine`/`planned`/`blocked`), `engine`
  (`echarts`/`lightweight-charts`/`canvas-projection`), optional `note`).
  `pnpm --filter @luc/showcase catalog:charts` verifies it against real exports.
- Deterministic fixtures: `apps/showcase/lib/chart-packs-data.ts`,
  `chart-packs-v5-data.ts`, `mock-data.ts`, `table-data.ts`.
- Appearance registry (palettes, type voices, personalities):
  `apps/showcase/lib/appearance.ts`, `components/showcase/apply-appearance.tsx`,
  `lib/use-appearance.ts`.
- Motion: read the real props in `packages/ui/src/motion/**`
  (`intensity-profiles.ts`, `tokens.ts`) before adding any control.
  `MotionIntensityProvider` scales motion in a subtree.
- Blocks: registry `apps/showcase/lib/blocks.tsx` (12 real Blocks, each with a
  `uses` list), components in `apps/showcase/components/blocks/blocks.tsx`.
  The Template Composer composes those; it does not invent new ones.
- Documentation registry: 76 chart pages with kebab-case ids
  (`line-chart`, `violin-chart`, `drawdown-chart`). Link freely. Never import
  `lib/docs/registry.ts` into a client component (700 KB of API tables);
  `lib/docs/nav.ts` is the client-safe projection.
- The navigation already links `/studios/charts`, `/studios/motion`,
  `/studios/themes`, `/studios/composer`: those routes must exist or the QA
  sweep reports a 404.

## Deliverables

### 1. `/studios/charts` — Chart Studio (flagship)

At least four meaningfully different families from the public catalogue: a
general time series (`LineChart`), a statistical one (`ViolinChart` or
`BoxPlotChart`), a financial one (`DrawdownChart` or `CandlestickChart`), and a
matrix or field one (`HeatmapChart` or `ContourChart`).

- Deterministic example datasets.
- Local CSV/JSON paste-and-parse (never `eval`, never `fetch`) with shape
  validation and a clear message when the shape is wrong.
- Controls only for what the component really supports; the primary experimental
  treatment of a Studio for a user to pick from, then a more advanced one with
  secondary options.
- Copyable, valid TSX generated from the state on screen (imports from
  `@luc/ui/charts`).
- Correctness visible in the UI: the unit of every series; never infer ratio vs
  percent from magnitude; log scales need strictly positive values; reject
  non-finite and missing values with a message rather than drawing a silent
  hole; state the drawdown sign convention; say plainly when a chart needs
  precomputed input, because the library computes nothing.
- Honest per-capability coverage (what is editable today, what is not).

### 2. `/studios/motion` — Motion Studio

Only real supported props: duration, intensity, spring/damping preset,
amplitude, perspective, layer depth, loop/play/pause where supported. Live
preview, a reduced-motion note, and a theme/background choice. No invented knobs.

### 3. `/studios/themes` — Theme Studio

Existing tokens only: palette, typeface or type voice, personality, surface
depth, radius, contrast. A preview that covers several component families at
once, and a valid copyable configuration (`data-palette`, `data-typeface`,
`data-personality`, `data-space`, theme attribute) that matches the preview.

### 4. `/studios/composer` — Template Composer

Choose an archetype (personal / marketing / product), move blocks up and down,
remove blocks, edit heading and body text, live preview, and copy the resulting
JSX outline. No general-purpose site builder; never execute pasted code.

### 5. Pure logic in `apps/showcase/lib/studios/**`

So it is testable without a browser: CSV/JSON parsing, shape validation, unit
derivation, config → JSX serialization, theme → attribute mapping.

### 6. Tests in `apps/showcase/tests/unit/studio-*.test.ts`

Write `import { describe, it, expect } from "vitest";` explicitly — the Showcase
config disables globals. Cover: the parser rejects wrong shapes and non-finite
values; the serializer reproduces the configuration it was given; theme mapping
round-trips; deterministic fixtures produce identical output twice.

## Hard rules

Writable: `apps/showcase/app/studios/**`, `apps/showcase/lib/studios/**`,
`apps/showcase/components/studios/**`, `apps/showcase/tests/unit/studio-*.test.ts`,
`docs/audits/phase-9/i18n/agent-e.json`, `docs/audits/phase-9/agent-e-report.md`.
Nothing else — not `packages/ui/src/**`, not `lib/docs/**`, not `lib/i18n/**`,
not `lib/navigation.ts`, not `lib/blocks.tsx`, not `components/blocks/**`, not
`components/playground/**`, not `components/docs/**`, not `qa/**`, not
`app/components/**`, not `app/charts/**`, not any `package.json` or
`next.config.ts`.

- Charts and heavy engines are client islands; keep pure logic importable by a
  test. Do not make a Studio page a client component wholesale.
- Deterministic only: no `Math.random()`, no `Date.now()`, no locale-dependent
  formatting in fixtures (hydration safety).
- No fabricated financial claims: illustrative data, never a recommendation,
  never dressed up as live market data.
- TypeScript strict, no `any`, no non-null assertions, no `@ts-ignore`. Public
  `@luc/ui` import paths only.
- Bilingual: every user-visible English sentence needs a natural Simplified
  Chinese rendering in `docs/audits/phase-9/i18n/agent-e.json`, shaped
  `{"sentences":[{"en":"…","zh":"…"}]}`. The Lead merges it. Identifiers and prop
  names stay untranslated.

## Verification (focused only; one heavy command at a time on this shared host)

```bash
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm typecheck
cd /home/luc/code/luc-quant/luc-ui && pnpm --filter @luc/ui test:showcase
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm lint
```

No `next build`, no Playwright, no `qa:*`, no Docker.

## Report

Write `docs/audits/phase-9/agent-e-report.md`: what each Studio does, files
changed, the exact commands you ran with their real output, honest per-Studio
coverage, and any blocker. Then send a concise final summary.
