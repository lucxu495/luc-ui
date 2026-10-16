# Brief — Playground reference adapters (Agent C, round 2)

Round 1 delivered exactly one adapter (`adapters/button.tsx`) and then spent its
turn on Lead-owned files, which caused a merge collision. This round has one
job, and the file list below is the whole of your writable scope.

## Read first

- `apps/showcase/components/playground/types.ts` — the `Control` union,
  `Placement`, `PlaygroundSpec`, `UnsupportedProp`.
- `apps/showcase/components/playground/engine.ts` — `defaultsOf`,
  `normalizeValue(s)`, `isDirty`, `serializeProps`, `serializeAttribute`,
  `buildSnippet`, `expectedPropNames`, `propsInElement`.
- `apps/showcase/components/playground/state.ts` — `usePlaygroundState`.
- `apps/showcase/components/playground/shell.tsx` — the UI shell (Lead-owned).
- `apps/showcase/components/playground/registry.ts` — where adapters register.
- `apps/showcase/components/playground/adapters/button.tsx` — **the reference
  adapter; every adapter you write follows this shape.**
- `apps/showcase/tests/unit/playground-engine.test.ts` — the standing contract.
  It already iterates every registered adapter and asserts: defaults produce no
  props; changing a control makes that prop appear in the generated element;
  enumerated domains reject unknown values; every `unsupported` entry has a
  reason; generated snippets have balanced angle brackets.

## Deliverables

Seven more adapters in `apps/showcase/components/playground/adapters/`, each
exporting one `PlaygroundSpec`, registered in `registry.ts`:

| File | Component | Import path |
| --- | --- | --- |
| `input.tsx` | `Input` | `@luc/ui/components/input` |
| `card.tsx` | `Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`) | `@luc/ui` |
| `kinetic-headline.tsx` | `KineticHeadline` | `@luc/ui/motion` |
| `line-chart.tsx` | `LineChart` | `@luc/ui/charts` |
| `violin-chart.tsx` | `ViolinChart` | `@luc/ui/charts` |
| `profile-hero.tsx` | `ProfileHero` | `@luc/ui/experiences` |
| `ai-message.tsx` | `ChatMessage` | `@luc/ui` |

Rules for all of them:

- Read the real component source under `packages/ui/src/**` for prop names and
  types. `apps/showcase/lib/docs/generated/api.ts` lists every real prop per
  export and is the fastest way to check. Never invent a prop.
- The two chart adapters go in a NEW
  `apps/showcase/components/playground/registry.charts.ts`, plus a new client
  component `apps/showcase/components/playground/chart-boundary.tsx` exporting
  `<ChartPlayground entry={entry} />`, mirroring `boundary.tsx`. Reason: a chart
  adapter pulls a rendering engine, and a Button page must not load ECharts
  because a chart page exists in the same application.
- Deterministic fixtures only: no `Math.random()`, no `Date.now()`, no
  locale-dependent formatting. Same input, same output, on server and client.
- Anything that cannot honestly be a control (a callback, a ref, a formatter, an
  arbitrary `ReactNode`, a whole dataset) goes in `unsupported` with a reason.
  A `ReactNode` slot uses the `slot` control kind with a closed option set, and
  the generated code must import whatever the slot needs (`extraImports`).
- You own `components/playground/controls/**`: improve the renderers where the
  first pass is thin. Keep every union member handled (exhaustive switch), keep
  each control keyboard-operable, and keep the visible label and the accessible
  name from drifting.

## Tests

`apps/showcase/tests/unit/playground-adapters.test.ts`, importing
`{ describe, it, expect } from "vitest"` explicitly (no globals):

- each adapter's `component` really is exported from its `importPath`
  (read `luc-ui/docs/component-catalog.json`);
- fixtures are deterministic: serializing twice gives identical output;
- chart fixture values are finite numbers;
- each `serialize` output contains its component name.

## Writable files — nothing else

```
apps/showcase/components/playground/adapters/**
apps/showcase/components/playground/controls/**
apps/showcase/components/playground/registry.ts
apps/showcase/components/playground/registry.charts.ts
apps/showcase/components/playground/chart-boundary.tsx
apps/showcase/tests/unit/playground-adapters.test.ts
docs/audits/phase-9/i18n/agent-c.json
docs/audits/phase-9/agent-c-report.md
```

**Do not touch**: `components/playground/{types,engine,state,shell,boundary}.ts(x)`,
`lib/**` (including `lib/i18n/**`, `lib/navigation.ts`, `lib/docs/**`),
`components/docs/**`, `components/home/**`, `components/blocks/**`, `app/**`,
`qa/**`, `scripts/**`, `next.config.ts`, any `package.json`. If you believe one
of those needs a change, report it instead of making it — a second writer in
those files is what caused this round to exist.

## Verification (focused only; one heavy command at a time)

```bash
cd /home/luc/code/luc-quant/luc-ui && pnpm --filter @luc/ui test:showcase
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm typecheck
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm lint
```

No `next build`, no Playwright, no `qa:*`, no Docker.

## Report

Append to `docs/audits/phase-9/agent-c-report.md`: adapters written, controls
improved, the exact commands and their real output, which props you declared
unsupported and why. Then send a concise final summary.
