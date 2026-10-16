# Phase 9 Hardening — architecture, ownership and coordination

Owner: Lead (`/root`). Written before any parallel work started, on
2026-10-09, against branch `main` at `3110331` with a dirty worktree.

## 1. The defect this phase exists to fix

Phase 9 produced a documentation platform whose pages are generated from the
public API. It shipped 223 registry entries:

| group | entries | generated (no handwritten page) |
| --- | --- | --- |
| components | 103 | 52 |
| charts | 76 | 76 |
| motion | 35 | 29 |
| integrations | 9 | 0 |

The 157 generated pages carried the real import path, the real compiler props,
installation commands and an AI brief — and **no specimen**. `/charts/ecdf-chart`
rendered an API table and a link to a family overview; a reader could read about
`EcdfChart` and never see one. `components/doc-pages/examples.tsx` held fifteen
hand-written specimens, and eight Playground adapters existed, so 134 of the 157
pages showed nothing at all.

Levels, defined so that claims can be checked one at a time:

* **Live Demo** — the real public component, on its own page, with a
  deterministic fixture, plus the JSX that reproduces it.
* **Interactive Playground** — the same component with the reader driving props.
* **Professional Studio** — domain editing beyond props (`/studios/*`).

A page is not a Live Demo because it has a Playground shell, an image, or a
CSS mock. `tests/unit/demo-coverage.test.ts` is the machine check.

## 2. Contracts

### 2.1 `DemoSpec` — `lib/demo/types.ts`

```ts
interface DemoSpec {
  id: string;                       // matches DocEntry.id, one demo per page
  node: ReactNode;                  // the real component with the fixture
  code: string;                     // the JSX that reproduces `node`
  origin: "structured" | "composition";
  note?: string;                    // one sentence about the fixture
  layout?: "inline" | "block" | "grid" | "stage";
  height?: number;
  bare?: boolean;
}
```

### 2.2 Builders — `lib/demo/jsx.ts`

* `demo<Props>({ id, component, props, render, note? })` — the default. `render`
  receives the same props object whose literal is printed into `code`, so the
  specimen and the snippet cannot drift. **The props type is passed
  explicitly**; without it TypeScript widens `"decimal"` to `string` and the
  spread stops checking.
* `composition({ id, node, code, note? })` — for a specimen assembled from
  several components, or one that needs state. `code` is written by hand and
  the demo is marked as such.

### 2.3 Registries

One registry per route tree, so a Button page never loads the charting surface:

* `lib/demo/registry.ts` → `/components/[component]`
* `lib/demo/registry.charts.ts` → `/charts/[chart]`
* `lib/demo/registry.motion.ts` → `/motion/[motion]`

Each exposes `xxxDemoFor(id)`. A duplicated id throws at module load
(`indexDemos`).

### 2.4 Page integration (Lead-owned, already landed)

`DocEntryPage` takes `demo?: ReactNode`; the route resolves it from its own
registry; `DemoStage` maps a `DemoSpec` onto the existing `Demo` frame. A page
with a demo shows **Live preview → Playground → Usage → Installation → API**;
a page without one keeps the old fallback and says so.

## 3. Rules every demo author must follow

1. **Real component, real import.** Never a screenshot, never a CSS mock, never
   a stand-in. The fixture must exercise the component's actual API.
2. **Deterministic.** No `Math.random`, no `Date.now`, no locale-dependent
   formatting. A date is an ISO string with an explicit zone.
3. **Scientifically valid.** Chart fixtures must satisfy the chart's own
   contract: monotone ECDF, unit-sum ternary, valid OHLC invariants, drawdown
   ≤ 0, ratio-vs-percent declared by `format`, non-finite values excluded. The
   library renders prepared values; nothing in a demo may imply a computation
   the component does not do.
4. **Compact enough to print.** The fixture is inlined in the copyable snippet,
   so keep it small enough to read (≈24 rows maximum; reduce a 240-point sample
   to a representative subset instead of pasting it). A demo whose code is
   unusable is not a demo.
5. **No invented props.** Only props the compiler lists for that export.
6. **Interactive ⇒ island.** Anything that needs state is a `"use client"`
   component under `components/demo/islands/`, and the demo is a `composition`.
   Reduced motion is the library's contract; do not disable it.
7. **Prose is translated, or it is not prose.** Every string that renders into
   the page as a sentence goes in `note` (or through `tcs`/`tc`) and gets a
   Simplified Chinese pair. Keep fixture labels to three words or fewer — they
   are data, not documentation.

## 4. File ownership (single writer per file)

| Owner | Writable |
| --- | --- |
| Lead | `lib/demo/{types,jsx,index,registry*}.ts*`, `lib/demo/components/{data-display,typography}.tsx`, `components/demo/islands/*`, `components/docs/*`, `app/**` route wiring, `tests/unit/*`, `qa/**`, `lib/i18n/**`, `package.json`, `docs/audits/phase-9-hardening/**` |
| Agent A (charts I) | `lib/demo/charts/{general,statistical,financial}.tsx` |
| Agent B (charts II) | `lib/demo/charts/{scientific,multidimensional,workflow,time,diagnostics,geographic}.tsx` |
| Agent C (components) | `lib/demo/components/{actions,forms,layout,navigation,feedback,overlays,media,experiences}.tsx` |
| Agent D (motion) | `lib/demo/motion/{typography,surfaces,spatial,feedback}.tsx` |

Forbidden for everyone: `packages/ui/**`, `luc-ui/**` outside the rows above,
every other LUC subproject, shared root files, `.context/**`, lockfiles.

`components/demo/islands/` is shared, so it is protected by a naming rule
rather than a lock: the three existing islands (`table-demo`, `list-demo`,
`details-demo`) belong to the Lead and are **not** editable by anyone else; a
new island an agent needs is a **new file** named with the agent's letter —
`c-<name>.tsx` for Agent C, `d-<name>.tsx` for Agent D. No agent edits a file
it did not create.

## 5. Verification

Per-batch, in the agent's own tree:

```
cd luc-ui/apps/showcase && pnpm typecheck
cd luc-ui && pnpm --filter @luc/ui test:showcase
```

At integration (Lead): the coverage test, `pnpm verify`, browser QA
(`qa:behaviour --group=docs`), a Docker rebuild, then the deployment checks.

The host is shared and memory-constrained: one heavy command at a time, two
implementation agents to start with, and browser/Docker work stays with the
Lead.
