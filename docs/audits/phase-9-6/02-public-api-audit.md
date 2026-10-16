# Phase 9.6 — public API quality, overlay coverage, static render, registry

Four workstreams from the brief, each with what was measured rather than what
was intended.

## 1. Public API audit (workstream B)

Measured over `packages/ui/src` (excluding tests) at `HEAD`+worktree:

| Check | Result |
| --- | --- |
| `any` in public source (`: any`, `<any>`, `as any`) | **0**. The two textual matches are the word "any" inside prose comments |
| `@ts-ignore` / `@ts-expect-error` | **0** |
| Non-null assertions (`x!.y`) | 3 files, 5 uses (`datetime/date-picker.tsx`, `workspace/outline-drawer.tsx`, `charts/adapters/echarts/cartesian.ts`) — each on a value the surrounding code has already narrowed |
| `eslint-disable` lines | 20, every one carrying a reason: 9 are `jsx-a11y` opt-outs for a container that owns a roving-tabindex or a pointer contract, 4 are `react-hooks` synchronisation exemptions with the reason inline |
| Files with `"use client"` | 195 of 279 source files; the 84 without it are pure logic (formatters, layout maths, token tables, variants) |
| Value-change prop naming | components expose `onValueChange` exclusively (29 declarations). The 40 `onChange` declarations are *not* props: they are the adapter parameter of `useControllableState`, the subscribe callback of `useMediaQuery`/`useReducedMotion`, and TanStack's own option names passed through by the table. One convention, no drift |
| Controlled/uncontrolled | 15 modules use `useControllableState`, which is the single implementation of the `value`/`defaultValue`/`onValueChange` triple |

**No breaking change was made in this phase.** The four additions are
additive:

1. `ChartSpec.renderer` + `ChartSurface`/`ChartProps.renderer` — optional, defaults
   to the existing `"canvas"`.
2. `ChartProps.eager` — optional pass-through of a prop `ChartSurface` already had.
3. `chartThemeFromTokens`, `chartThemeFallback`, `darkChartTheme`,
   `lightChartTheme`, `CHART_THEME_TOKEN_NAMES`, `DARK_…`/`LIGHT_CHART_THEME_TOKEN_VALUES`,
   `DEFAULT_CHART_THEME_METRICS`, `ChartThemeMode`, `ChartThemeMetrics`,
   `ChartThemeTokenName` — new exports.
4. `staticChartSpec`, `CHART_STATIC_CAPTURE`, `CHART_STATIC_ANIMATION`,
   `CHART_STATIC_RENDERER` — new exports.

The docs registry picked all of them up on regeneration (368 symbols keep their
props tables; the new functions appear in the charts family), and
`catalog:check` and `docs:registry:check` both pass.

### One real reproducibility defect fixed

`apps/showcase/scripts/docs-registry.mjs` produced **different `api.ts`
depending on the directory it was started from**. `pnpm verify:docs` runs it
with the Showcase as cwd; a contributor following the suggestion printed by a
root-level run generated the other variant and the gate failed with a 40-line
diff in which only `React.HTMLAttributes` had become `HTMLAttributes`. The
compiler host is now pinned to the library root
(`host.getCurrentDirectory = () => uiRoot`), and the two cwds produce
byte-identical output — verified by hashing the file after each.

### Follow-up recorded, not fixed

The DOM-free theme tables add ~0.5 KB raw to `charts-financial` and
`financial-engine` (measured: 43.5 → 44.0 KB and 33.8 → 34.1 KB, both inside the
8 % budget). The first implementation was ~3.9 KB and would have failed the
budget; it was split so that only the dark table travels with interactive
charts. A `@luc/ui/charts/static` subpath would take the remaining 0.5 KB out of
the interactive graph entirely, and is the natural next step if the surface
grows. `button-only` is unchanged at 10.9 KB raw / 3.6 KB gzip.

## 2. Overlay coverage (workstream A2)

Phase 9.5 asserted Sheet's four edges and nothing else; Dialog, Drawer, Popover,
Tooltip, HoverCard and the three menus were verified by reading code. That is not
coverage, so this phase added two checks to the `geometry` group:

* `checkOverlayLifecycles` — Dialog, AlertDialog, Popover, DropdownMenu,
  ContextMenu. Each is opened through its own real trigger and then measured on
  five facts: the surface is inside the viewport, it leaves the DOM, the body
  lock is released (`pointer-events` and document overflow), no backdrop or
  portal wrapper is orphaned, and focus is on something other than `body`.
* `checkSheetFocusRestoration` — a Sheet opened and closed **from the keyboard**
  returns focus to the control that opened it. Phase 9.5 proved the panel leaves
  from the right edge; this proves the keyboard user is not left at the top of
  the document.

Two measurement defects were fixed while adding them, and both are the same
class of error the previous phase recorded: a check that reports the harness's
own behaviour. `page.getByRole("button").first()` selects the **application
shell's** first button, not the demo's, so three families "never opened"; the
triggers are named now. And the Sheet loop's `.first()` matched a leftover node
from the previous direction's exit, measuring a 0×0 box — the panel is now
selected by the edge it claims to be on, and each iteration starts from a
measured "nothing is open".

Tooltip and HoverCard are **not** in the geometry check. Both are pointer- or
focus-driven surfaces with no dismissal lifecycle to complete — the failure
modes the check exists for (a stuck lock, an orphaned backdrop, lost focus) do
not exist for them, and their open behaviour is already asserted in the
`primitives` group. Recorded here rather than implied by silence.

## 3. Static rendering (workstream C)

The contract is written for consumers in [`docs/STATIC_RENDERING.md`](../STATIC_RENDERING.md).
The measurements behind it:

| Question | Finding | Evidence |
| --- | --- | --- |
| Can animation be disabled? | Yes — `spec.animation: "none"`; reduced motion also zeroes it | `useChartMotion` returns `intro: 0`; the capture fixture asserts a settled transform |
| Can dimensions be fixed? | Yes — `height` accepts a number; row-derived heights are pure functions | `core/sizing.ts` (no DOM) |
| How is readiness detected? | `onReady`, plus two frames | fixture: waits on an app-set marker, then samples pixels |
| Do fonts/images affect capture? | Yes — the host must load both; LUC UI never fetches | `resolveChartTheme` reads `--font-*`; documented |
| Is canvas crisp at high density? | Yes when captured at `deviceScaleFactor ≥ 2` | PNG captured at 2× (2160×2400 from a 1080×1200 box) |
| Which visualisations support vectors? | Everything ECharts paints when `renderer: "svg"`; Lightweight Charts is canvas-only; 3D surfaces are WebGL | fixture: 16 `<path>` elements with geometry, no `<canvas>` |
| Do tooltips/overlays affect capture? | They cannot appear — there is no pointer. A value that must be called out is an annotation | documented limitation |
| Are units/legends preserved? | `staticChartSpec` changes three properties and nothing else | unit test + fixture axis labels |
| Is rendering deterministic? | Same spec + same tokens + reduced motion ⇒ same marks; the theme is data, not measurement | `theme-tokens.test.ts` proves the table matches `tokens.css` |
| Does any of this reach basic imports? | No — `button-only` is unchanged at 10.9 KB / 3.6 KB gzip, and the SVG renderer is a lazy registration | `consumer-test.mjs` |

### The DOM-free token bridge

`luc-render`'s integration notes asked for exactly this: *"the static fallback
cannot read CSS variables, so it currently carries a copy of the default
palette"*. `CHART_THEME_TOKEN_VALUES` is that copy — but it is **verified
against the stylesheet** rather than maintained beside it:
`charts/core/theme-tokens.test.ts` parses `tokens/tokens.css`, resolves `var()`
aliases within the block and `color-mix(…, transparent)` to an explicit alpha,
and compares every token as resolved RGB in both modes. A designer moving a
series colour now fails the test instead of silently shipping a PDF in the old
blue.

Two structural limits are stated in the module rather than discovered later:
the table describes the **default palette** (a `data-palette` or personality
overrides the accent in CSS only), and the **light** table lives in its own
module so interactive chart bundles do not carry it.

## 4. Source registry (workstream F)

`pnpm verify:registry` → 4 items, 6 files installed into a clean fixture,
typecheck clean. The generator walks the real import graph and rewrites relative
imports to the consumer alias, so an item is *derived*, never retyped; the
consumer-facing rules are in [`docs/SOURCE_POLICY.md`](../SOURCE_POLICY.md).

**What was not done, and why.** The obvious move is to add items until the
registry "covers" the library. That would produce a second, drifting copy of
every component — the exact failure the generator exists to prevent — and the
honest position is that source distribution is viable for a component whose
transitive closure is *files* (utilities, hooks, a primitive) and not for one
whose closure is a *plugin* (Tailwind preset), a provider tree, or a CSS layer
the consumer has to install in order. The four items are the ones where that
test passes and has been verified end to end. Everything else stays npm-only,
and `SOURCE_POLICY.md` says so.

Consequence, stated plainly: **the registry is a verified proof of concept, not
a distribution channel for the library.** Phase 9.6 does not change that, and
no coverage claim is made from four items.
