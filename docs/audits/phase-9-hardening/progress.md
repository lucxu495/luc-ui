# Phase 9 Hardening — progress log

Append-only. Owner: Lead (`/root`). Times are UTC.

## Reconnaissance (before any write)

| Fact | Value |
| --- | --- |
| branch / HEAD | `main` / `3110331`, worktree dirty (Phase 9 uncommitted) |
| registry entries | 223 (components 103, charts 76, motion 35, integrations 9) |
| generated (no handwritten page) | 157 (components 52, charts 76, motion 29) |
| pages with a specimen before this phase | 15 (`examples.tsx`) + 8 Playgrounds, i.e. **134 generated pages showed nothing** |
| charts rendered on their own page | 0 of 76 |
| i18n at start | prose 100%, navigation descriptions **12/51** |
| host | load average 12.7 on 8 cores, 5 GB available, swap full |

The defect was confirmed by reading the rendered page, not the source:
`/charts/ecdf-chart` returned an API table, an install block and a link to a
family overview, with no chart on it.

## Landed by the Lead (before delegation)

| Item | Where | Evidence |
| --- | --- | --- |
| Demo framework: `DemoSpec`, typed JSX printer, `demo()` / `composition()`, duplicate-id guard | `lib/demo/{types,jsx,index}.ts` | `pnpm typecheck` clean |
| Three registries split by route tree | `lib/demo/registry{,.charts,.motion}.ts` | chart pages cannot load component demos |
| Page integration: `Live preview` section, `DemoStage`, `demo` prop on `DocEntryPage` | `components/doc-pages/entry-page.tsx`, `components/docs/demo-stage.tsx`, the three `[id]` routes | 79 showcase tests green |
| Reference implementation (10 demos + 3 islands) | `lib/demo/components/{data-display,typography}.tsx`, `components/demo/islands/{table,list,details}-demo.tsx` | see the batch log below |
| `required` control flag so `aria-label` / headline text / message sender survive at their defaults | `components/playground/{types,engine}.ts` + 4 adapters | `playground-engine.test.ts` now asserts required props are emitted |
| Client-safe Playground projection, so the four handwritten client pages can finally mount a panel | `scripts/docs-registry.mjs` → `generated/playgrounds.ts`, `lib/docs/playground-entries.ts`, `components/docs/playground-section.tsx` (now a client component) | Input, Card, ChatMessage, KineticHeadline pages |
| Chinese navigation descriptions completed | `lib/i18n/messages.ts` | coverage `navigation descriptions 51/51` |
| i18n checker now sees demo prose | `scripts/i18n-coverage.mjs` | `lib/demo/**` attributed to its route group |
| Sheet-Escape flake replaced with a state wait | `qa/behaviour.mjs` | root cause: a fixed 450 ms sleep racing the exit animation |
| New browser checks: live specimen + matching code, and a hydration check that drives an island | `qa/behaviour.mjs` | run at integration |
| Generic chart panel built from each chart's own Live Demo fixture | `components/playground/registry.charts.ts` | wired at integration, once the demos exist |

## Delegated

| Agent | Files | Demos |
| --- | --- | --- |
| A (charts I) | `lib/demo/charts/{general,statistical,financial}.tsx` | 37 |
| C (components) | `lib/demo/components/{actions,forms,layout,navigation,feedback,overlays,media,experiences}.tsx` | 41 |
| B, D | charts II (39) and motion (29) | held back until a slot frees |

## Delegation outcome, and the change of plan

Both subagents were spawned with briefs on disk and completed with "no task in
the message I received": the initial payload did not reach either of them, and
they said so rather than inventing work. A third attempt with a shorter message
behaved the same way. The demos were therefore written by the Lead, sequentially,
with the file-ownership boundaries kept as designed — which is why the ownership
table above was worth writing even though the parallel path did not happen.

## Landed after the delegation attempt

| Batch | Files | Demos |
| --- | --- | --- |
| Components | `lib/demo/components/*.tsx` (10 files) | 52 (52 generated pages) |
| Charts | `lib/demo/charts/*.tsx` (9 files) | 76 (all chart pages) |
| Motion | `lib/demo/motion/*.tsx` (4 files) | 29 |
| Islands | `components/demo/islands/{table,list,details,geo,c-guided-tour,d-motion}.tsx` | — |

Result: **157/157 generated pages render a real specimen**, enforced by
`tests/audit/demo-coverage.test.ts`. Coverage table, exceptions and the defects
found while writing the fixtures are in `01-coverage-and-implementation.md`.

## Verification summary

| Command | Result |
| --- | --- |
| `pnpm verify` (luc-ui) | exit 0 |
| `pnpm --filter @luc/ui test` | 898 passed / 89 files |
| `pnpm --filter @luc/ui test:showcase` | 85 passed / 11 files |
| `i18n-coverage.mjs` | 56169/56169 (100%), nav descriptions 51/51 |
| `pnpm qa:full` (deployed) | 167 routes, 475 screenshots, **144/144** behaviour, **0** axe violations / 257 scans, no console errors |
| `docker ps` | `luc-ui/showcase:1.0.0` = `ecd3d78618c6`, healthy since 19:21 UTC |

## Open

1. Five curated routes render real components but no framed specimen
   (`/application/outline-drawer` and four TradingView pages) — flagged for
   review, not counted as covered.
2. Chart panels are family-common controls (height, state, accessible name);
   per-chart series and domain controls are not implemented.
3. WebKit remains unavailable on this host.
