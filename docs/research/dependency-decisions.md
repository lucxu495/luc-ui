# LUC UI — dependency decisions

Frozen **2026-09-26**. "Runtime now?" means: shipped in the Showcase and the
`@luc/ui` bundle today. Versions are the ones installed and verified in this
build.

The rule we applied: **research widely, depend narrowly**. A dependency is only
accepted when it removes a class of bug we would otherwise own forever.

| Capability | Chosen technology | Resolved version | Alternatives studied | Why selected | Runtime now? | Runtime later? |
| --- | --- | --- | --- | --- | --- | --- |
| Accessible primitives | `radix-ui` (unified package) | 1.6.7 | Headless UI, Ark UI, React Aria, Base UI, Park UI | Complete coverage for our set, `data-state` styling contract, collision-aware overlays, one package instead of twenty | yes | yes |
| Styling engine | Tailwind CSS v4 + `@tailwindcss/postcss` | 4.3.3 | CSS Modules, vanilla-extract, Panda, StyleX | v4's CSS-first `@theme` maps directly onto a token layer; utilities keep components small; no runtime | yes | yes |
| Class composition | `class-variance-authority` + `clsx` + `tailwind-merge` | 0.7.1 / 2.1.1 / 3.7.0 | Hand-written conditional classes | Variants as data; predictable `className` overrides. Needed a custom font-size group — see below | yes | yes |
| Animation — imperative | `motion` (`motion/react`) | 13.4.4 | react-spring, GSAP, Web Animations API, CSS only | Used only for the number ticker's value tween, which CSS cannot express | yes | yes |
| Animation — declarative | Plain CSS transitions and keyframes | — | Motion components everywhere | CSS respects the global reduced-motion clamp and keeps components dependency-free | yes | yes |
| Icons | `@remixicon/react` | 4.9.0 | Lucide, Heroicons, Phosphor, Font Awesome | One family, line + fill, tree-shakeable, permissive license | yes | yes |
| Fonts | `@fontsource-variable/inter`, `inter-tight`, `jetbrains-mono` | 5.3.0 | Google Fonts CDN, `next/font/google`, system fonts | Self-hosted, offline-safe, no third-party request at runtime, OFL 1.1 | yes | yes |
| Framework (Showcase) | Next.js App Router | 16.3.6 | Vite + React Router, Astro | Static generation of 30 routes, file-based routing for the docs tree, React 19 | yes | Showcase only |
| UI runtime | React / React DOM | 19.3.0 | React 18 | Ref-as-prop removes `forwardRef` noise; required by Next 16 | yes | yes |
| Language | TypeScript | 5.9.3 | TypeScript 7 (native port) | 5.9.3 is the widest-compatibility stable line for ESLint, Vitest and Next. TS 7 can follow later | dev only | dev only |
| Unit testing | Vitest + Testing Library | 5.0.2 / 16.3.3 | Jest, node:test | Native ESM + TS, jsdom environment, behaviour-first queries | dev only | dev only |
| Browser QA | Playwright + axe-core | 1.63.0 / 4.13.0 | Puppeteer, headless Chrome CLI | Screenshots, real interaction, console-error capture and accessibility scans in one harness | dev only | dev only |
| Positioning engine | Floating UI (transitively via Radix) | 1.7.x | popper.js, custom | Solved problem; consumed through Radix rather than directly | transitive | transitive |
| General chart engine | Apache ECharts (modular) | 6.1.0 | Nivo, Unovis, Recharts, Chart.js, visx, G2, Plotly | Breadth from one API — line to heatmap to sankey to gauge — with good large-data behaviour, and a documented escape hatch. Apache-2.0 | yes | yes |
| Financial chart engine | TradingView Lightweight Charts | 5.2.1 | ECharts candlestick, react-financial-charts, visx | Candles, volume, panes, price scales and crosshair are native; small API; very fast. Apache-2.0 + attribution notice (kept visible) | yes | yes |
| Sparklines | Own SVG components | — | ECharts, Lightweight Charts | 8–60 points per table row must not cost a chart instance each | yes | yes |
| Chart synchronisation | Own normalised bus | — | ECharts `connect`, uPlot cursor sync | Cross-engine sync is the requirement; neither engine's native mechanism crosses engines | yes | yes |
| Custom visualisation | visx + SVG | — | D3 directly, canvas | Composable primitives over D3 scales while staying in React. Nothing needed it in V0.2 | deferred | when needed |
| Data table engine | TanStack Table (`@tanstack/react-table` v9) | 9.2.4 | AG Grid, Glide Data Grid, own row models | Headless row models and state; `tableFeatures()` keeps the shipped feature set explicit and tree-shakeable. MIT | yes | yes |
| Row virtualisation | TanStack Virtual | 3.14.13 | react-window, Glide, own scroll maths | Only the visible window plus overscan is mounted, behind one opt-in component. MIT | yes (opt-in) | yes |
| Combobox behaviour | Downshift (`useCombobox`) | 9.4.0 | Base UI, Ariakit, Headless UI, own reducer | The ARIA combobox state machine, owned by a library that has done it for years; LUC owns all markup. MIT | yes | yes |
| Select behaviour | Radix Select (existing `radix-ui`) | 1.6.7 | Base UI Select, own listbox | Already installed; no second primitive stack for one dropdown. MIT | yes | yes |
| Resizable panels | react-resizable-panels | — | Split.js, custom | Persisted, keyboard-accessible layouts | deferred | V0.3 |
| Toasts | Sonner | 2.0.8 | Radix Toast, custom | Stacking, swipe dismissal, hover pause, promise transitions and the live region; the skin is 100% LUC. MIT | yes | yes |
| Command palette | cmdk | 1.1.1 | own fuzzy filter, Radix Combobox | Filtering, ranking and active-descendant handling in a small package. MIT | yes | yes |
| Drag and drop | dnd-kit | — | react-dnd, custom | Keyboard sensors and accessibility | deferred | when needed |
| Drawer / sheet | Radix Dialog (existing) | 1.6.7 | vaul, own focus trap | A sheet is a panel, not a drag gesture. Radix already supplies the focus trap, restore and Escape semantics we refuse to hand-roll. vaul is unmaintained. MIT | yes | yes |
| Table semantics reference | React Aria (React Spectrum) | — | — | Virtualised table semantics, collection APIs, row selection. Apache-2.0, no code copied | reference only | reference only |
| DataGrid boundary reference | Glide Data Grid | — | — | Where DataTable stops: canvas cells, editing, fill handles. MIT, no code copied | reference only | reference only |
| Theming provider | Own implementation (`LucProvider`) | ~100 lines | next-themes | The contract is small (class + `data-theme` + storage + system). A framework-named dependency buys nothing functional | yes | yes |
| Numeric ticker | Own implementation (`NumberTicker`) | ~120 lines | number-flow | We need stable width, tabular digits and a formatter escape hatch, not per-digit motion | yes | yes |
| Reduced motion | Own hook + CSS clamp | ~60 lines | Motion's hook alone | CSS owns the blanket clamp; the hook handles behavioural decisions | yes | yes |
| Glow / spotlight / shimmer / reveal | Own implementations | see source registry | Magic UI, Motion Primitives, React Bits, Uiverse | Two upstreams are Commons Clause licensed, and none share our token + reduced-motion contract | yes | yes |
| Date & time behaviour | React Aria Components + `@internationalized/date` | 1.21.1 / 3.12.4 | React DayPicker, date-fns, own calendar, Base UI | The only studied system with distinct `CalendarDate` / `CalendarDateTime` / `ZonedDateTime` / `Time` values, real locale data and a calendar + range + time + number field set. Apache-2.0. LUC owns every pixel | yes | yes |
| Form state | None forced: LUC primitives + optional React Hook Form adapter | `react-hook-form` 7.89.0 as an optional peer | TanStack Form, own store, Formik | Forcing an engine on every consumer would break LUC's portability rule. RHF is the most mature choice for the *adapter*; TanStack Form composes with `Field` without one (recipe in `docs/FORM_GUIDE.md`). MIT | optional peer | optional peer |
| Validation | Standard Schema via the consumer's resolver | `@hookform/resolvers` 5.9.1 (Showcase) | Zod-only API, Yup, own rules | `@luc/ui` never imports a validation library: `rules` and resolvers pass through, so Zod 4, Valibot or hand-written `validate` all work | Showcase only | consumer's choice |
| Number entry | React Aria `NumberField` (already in the date dependency) | 1.21.1 | react-number-format, own parser | Locale parsing, caret safety and spinbutton semantics without a second engine; LUC adds the steppers, the unit suffix and the `CurrencyInput`/`PercentageInput` contracts | yes | yes |
| OTP / PIN entry | `input-otp` | 1.5.0 | own slot state machine, react-otp-input | One real input with `autocomplete="one-time-code"` behind visible slots — the behaviour that makes paste and screen readers work. MIT, ~118 KB unpacked | yes | yes |
| File selection | React Aria `FileTrigger` + `DropZone` (already in the tree) | 1.21.1 | react-dropzone, own drag handling | The picker, the keyboard path and the drop target arrive with the same semantics as our date and number fields; validation stays ours (name + reason, never silence) | yes | yes |
| Tag input | Own, composed from `Input` + `Tag` | — | react-tag-input, Downshift multi-select, React Aria `TokenField` | Commit keys, paste splitting and chip removal are a text input plus chips; a fifth selection dependency would add more than it removes. `TokenField` is the upgrade path for prompt-style fields | yes | yes |

## Decisions worth explaining

### Why one unified `radix-ui` package instead of twenty `@radix-ui/react-*` packages

One dependency entry, one version to track, and a namespace import that makes
the primitive explicit at the call site (`<RadixDialog.Content>`). It also keeps
`pnpm-lock.yaml` readable, which matters for a foundation other teams consume.

### Why we did not adopt a motion library wholesale

Every Tier 1 interaction (tabs, tooltips, dialogs, selection controls) is CSS
transition work. Adding a component-animation library for those would mean two
motion systems, and the reduced-motion clamp would only cover one of them.
Motion for React is present, and used where an interpolated numeric value is
required — something CSS genuinely cannot express.

### The tailwind-merge font-size trap (found by browser QA)

Because LUC UI renames the type scale to semantic roles, `text-label` looks like
a colour to `tailwind-merge`. It silently dropped real colour classes —
including the primary button's `text-accent-on-accent`, producing a 1.77:1
label. `src/utils/cn.ts` now registers the LUC type-scale names as a font-size
group, and `src/utils/cn.test.ts` locks the behaviour in.

### Deliberate non-dependencies

- **No `lucide-react`** alongside Remix Icon — one icon family, one visual weight.
- **No CSS-in-JS runtime** — the system must work in a static export and inside
  server components without a style registry.
- **No component library as a base** (Mantine, Chakra, MUI) — their component
  APIs would become the product's API.
- **No React wrapper around ECharts or Lightweight Charts.** A wrapper would own
  the lifecycle, resize, event and sync seams we specifically want to own. The
  adapters are ~200 lines each and give full control of theme and teardown.
- **No third chart engine.** Plotly, Chart.js, Recharts, Nivo, G2, Vega-Lite,
  uPlot and ChartGPU were all studied; none of them earns a second rendering
  path while ECharts covers the shapes and Lightweight Charts covers finance.
- **No silent decimation.** If a series needs thinning, the data layer does it —
  a chart that quietly drops points is a chart that lies.

## Version policy

1. Pin exact versions in `package.json` (no `^`), so refreshing the lockfile is
   a deliberate act.
2. Prefer the stable line over the newest major. TypeScript 5.9.3 was chosen over
   7.x for exactly this reason, and the reasoning is recorded above.
3. Record every new runtime dependency here with the same columns.

## Bundle impact (measured 2026-09-26)

Measured on the production Showcase build, raw and gzip, from
`apps/showcase/.next/static/chunks`. The V0.3 numbers are the size of the chunk
that *carries* the dependency; chunks are shared per route, so treat them as
upper bounds rather than as the dependency's own weight.

| Artefact | Raw | gzip | Loads on |
| --- | --- | --- | --- |
| Lightweight Charts chunk | ~187 KB | ~59 KB | financial routes only |
| Lightweight Charts secondary chunk | ~90 KB | ~25 KB | financial routes only |
| TanStack Table chunk | ~88 KB | ~23 KB | routes that render a DataTable |
| Data-viz route chunk (TanStack Virtual + cmdk + shared) | ~129 KB | ~37 KB | table, palette and chart routes |
| Downshift chunk | ~31 KB | ~10 KB | Combobox routes |
| Sonner chunk | ~51 KB | ~14 KB | any route that can fire a toast (one chunk, app-wide) |
| Showcase client JS, all routes | ~3.4 MB | ~1.1 MB | split per route |

Notes:

1. Both engines are loaded through a dynamic `import()` inside an effect, so
   neither is in the server bundle and neither blocks first paint.
2. ECharts is registered from `echarts/core` with a fixed component list.
   Growing that list is a deliberate act: every addition changes the shared
   chunk every analytical route pays for.
3. An analytics-only route never downloads Lightweight Charts, and a page that
   renders only sparklines downloads neither engine.
4. Re-measure after adding a chart family, and record the number here.
5. V0.3 adds ~180 KB raw / ~50 KB gzip of behaviour libraries across the whole
   Showcase, and none of it is on a route that does not use it except Sonner,
   which is mounted once in the app shell so any page can raise a toast.

## Revisit triggers

| Decision | Revisit when |
| --- | --- |
| Radix as the primitive layer | Base UI reaches parity on dialogs, tooltips and tabs, and we need a widget Radix lacks |
| Own theming provider | A product needs multi-tenant theming our provider cannot express |
| ECharts as the general engine | Bundle size becomes a problem for the small-chart case, or Unovis matures |
| Motion for React | Everything it does becomes expressible in CSS for our use cases |
| Own NumberTicker | We need per-digit motion, at which point adopt number-flow instead of extending ours |

## V0.5 rows

| Capability | Chosen technology | Resolved version | Alternatives studied | Why selected | Runtime now? | Runtime later? |
| --- | --- | --- | --- | --- | --- | --- |
| Resizable panes | `react-resizable-panels` | 4.13.3 | Hand-rolled pointer resize, `allotment`, `react-mosaic` | Separator role + aria values + keyboard resize for free; v4's `Group`/`Panel`/`Separator` API and `data-separator` states fit a token-driven skin; MIT | yes (`@luc/ui` dependency) | yes |
| URL state (core) | LUC codecs + `useUrlState` (no dependency) | — | `nuqs` in the library, Next `searchParams`, TanStack Router search state | The library must stay router-agnostic and pure-testable; the vocabulary is ours, the plumbing is the framework's | yes | yes |
| URL state (Showcase adapter) | `nuqs` | 2.10.1 | Raw `useSearchParams` + `router.replace` | Shallow updates, per-call history policy, `clearOnDefault`, a testing adapter | Showcase only | Showcase only |
| Package build | `tsdown` | 0.23.0 | Vite library mode, `unbuild`, `tsup`, `tsc` | `unbundle` keeps one module per source module (real subpaths, real tree shaking) and preserves `"use client"`; fastest of the four on this package | dev only | dev only |
| Package validation | `publint` + `@arethetypeswrong/cli` | 0.3.24 / 0.18.5 | `npm pack` inspection alone | `publint` can lint the *packed tarball*, which is the only way to catch a `publishConfig` mistake; `attw` for resolution modes | dev only | dev only |
| Design-system lint | Two LUC-native ESLint rules | — | `shadcn-ui/lint` 0.2.0, `eslint-plugin-tailwindcss` | The upstream ruleset is 0.2.x and needs a contract per component; the two rules that pay off today are 60 lines and produce zero false positives except a documented `themeColor` exception | dev only | dev only; revisit `@shadcn/lint` in V1.0 |

Bundle impact, measured from the production build rather than estimated:
`react-resizable-panels` is external to the package graph and adds ~10 KB gzip
to a product that imports `@luc/ui/workspace`. nuqs (~14 KB gzip) exists only in
the Showcase. tsdown, publint and attw are dev-only and ship nothing.

## V0.6 rows

| Capability | Chosen technology | Resolved version | Alternatives studied | Why selected | Runtime now? | Runtime later? |
| --- | --- | --- | --- | --- | --- | --- |
| TradingView widget integration | LUC-native adapters + the provider's own runtime | provider-served, unpinned | `react-ts-tradingview-widgets`, `react-tradingview-widget`, a direct `<script>` snippet per page | No new dependency: the provider ships both formats, and the community wrappers cover only the iframe half, set `script.src` from props, and have no loader dedupe or theme bridge. LUC owns the lifecycle, the theme contract and the failure states, and loads the provider's code from its own hosts. | no | no |
| Design-system lint | Two LUC-native ESLint rules (unchanged from V0.5) | — | `@shadcn/lint` 0.2.x | Still needs a contract per component; deferred to V1.0 with a documented plan. | dev only | dev only |

Bundle impact, measured from the compiled package rather than estimated:

| Entry | Raw | Gzip |
| --- | --- | --- |
| `@luc/ui/components/button` | 5.7 KB | 2.1 KB |
| `@luc/ui/date-picker` | 23.9 KB | 6.9 KB |
| `@luc/ui/app-shell` + `/workspace` | 24.8 KB | 7.3 KB |
| `@luc/ui/tradingview` | 43.3 KB | 11.3 KB |
| `@luc/ui/charts` | 43.7 KB | 13.5 KB |
| `@luc/ui` (barrel) | 9.3 KB | 3.0 KB |

The button-only bundle is byte-identical to V0.5, contains none of the
integration's host strings, and the TradingView entry loads no provider script
until a wrapper renders.

## Revisit triggers (V0.6 additions)

| Decision | Revisit when |
| --- | --- |
| No vendored provider code, official loader URLs only | TradingView publishes a self-hosting recommendation, or an offline/air-gapped product needs it |
| Closed-union props for provider enums (`region`, `metric`) | The provider adds an option, or it starts failing softly instead of throwing |
| TradingView stays out of the root barrel | A product wants one import for everything and accepts the bundle |

## V1.0 rows

| Capability | Chosen technology | Resolved version | Alternatives studied | Why selected | Runtime now? | Runtime later? |
| --- | --- | --- | --- | --- | --- | --- |
| `Slider`, `RangeSlider` | `radix-ui` → `@radix-ui/react-slider` | 1.4.7 (inside `radix-ui@1.6.7`) | A hand-written pointer/keyboard slider; React Aria `Slider`; Base UI Slider | Already a direct dependency, already the primitive layer for Select/Dialog/Tooltip; correct `role="slider"` per thumb, `minStepsBetweenThumbs`, RTL and a real form input. Writing it by hand would mean re-implementing pointer maths and the ARIA model for no product benefit. | yes (already) | yes |
| `DropdownMenu`, `ContextMenu` | `radix-ui` → `@radix-ui/react-dropdown-menu` / `-context-menu` | 2.1.24 / 2.3.7 | `cmdk` for menus (wrong job); Base UI Menu; a hand-rolled roving-focus list | The menu platform the package already ships (Select, Dialog, Popover) and the one that handles submenu intent, typeahead and focus restore. `cmdk` stays the command palette, which is a different component with a different contract. | yes (already) | yes |
| `Alert`, `Callout`, `EmptyState` | LUC-native | — | Chakra Alert, Mantine Alert/EmptyState, shadcn recipes | These are pure composition over tokens; a dependency would add a styling system, not a behaviour. The only decision worth encoding is the ARIA policy, which LUC owns. | no | no |
| Keyboard chart inspection | LUC-native over the existing sync bus | — | A separate charting library with keyboard support; making the canvas itself a widget | The sync bus already models a pinned cursor, and `ChartDataTable` is the complete accessible representation. A new dependency here would duplicate a contract LUC already has. | no | no |
| Design-system lint | Two LUC-native ESLint rules (retained) | — | `@shadcn/lint`; `eslint-plugin-tailwindcss` | Re-evaluated at the freeze: `@shadcn/lint` is still pre-1.0 and needs a hand-written contract per component before it says anything. LUC's two rules cover the actual failure modes (raw colour literals, deep package imports) in ~60 lines, with no dependency and no false positives beyond the documented `themeColor` exception. Contracts that cannot be expressed as a lint rule are encoded as the `className`/token rules in `DESIGN_SYSTEM.md` §9 and the inventory rule in `COMPONENT_INVENTORY.md`. | dev only | dev only; revisit only if upstream reaches a stable contract format |
| Bundle budget | `scripts/consumer-test.mjs` + `bundle-baseline.json` | — | `size-limit`, `bundlesize`, a single global size number | The harness that already measures *isolation* (button-only must not pull an engine) now also measures regression per entry point, with a tolerance of 8% or 1 KB, whichever is larger. One global number would either be meaningless across a 2.5 KB menu and a 44 KB chart entry, or would fail on a 300-byte refactor. | dev only | dev only |
| Type-resolution validation | `@arethetypeswrong/cli` (`attw`) | 0.18.5 | `publint` alone (already run) | publint checks the manifest and the packed file list; attw checks that each declared entry point actually resolves for a consumer's resolver. It runs with the `esm-only` profile because the package is intentionally ESM-only, and the two CSS entries are excluded (they have no types; their existence is asserted by `verify-package.mjs`). | dev only | dev only |

Bundle impact at the freeze, measured from the compiled package:

| Entry | Raw | Gzip |
| --- | --- | --- |
| `@luc/ui/components/button` | 5.7 KB | 2.1 KB |
| `@luc/ui/slider` | 6.2 KB | 2.4 KB |
| `@luc/ui/dropdown-menu` + `context-menu` | 2.5 KB | 1.0 KB |
| `@luc/ui/alert` + `empty-state` | 4.5 KB | 1.6 KB |
| `@luc/ui/date-picker` | 23.9 KB | 6.9 KB |
| `@luc/ui/app-shell` + `/workspace` | 24.8 KB | 7.3 KB |
| `@luc/ui/tradingview` | 43.3 KB | 11.3 KB |
| `@luc/ui/charts` | 43.6 KB | 13.4 KB |
| `@luc/ui` (barrel) | 9.3 KB | 3.0 KB |

The button-only bundle is unchanged from V0.6 (5.7 KB raw / 2.1 KB gzip) and
still contains no chart engine, no date system and no provider host string.

### Revisit triggers (V1.0 additions)

| Decision | Revisit when |
| --- | --- |
| Native lint rules instead of `@shadcn/lint` | The upstream package reaches a stable contract format *and* a contract would catch something LUC's rules cannot express |
| Bundle tolerance of 8% / 1 KB | A legitimate feature lands that cannot fit, in which case the baseline is regenerated deliberately with `LUC_UPDATE_BASELINE=1` and the reason recorded here |
| ESM-only package | A real consumer needs CommonJS `require()`, which would mean adding a CJS build and a `require` condition to every entry |

## The two chart baselines, re-recorded (2026-10-12)

`chart-statistical` and `charts-financial` were the two entries that tripped the
revisit trigger above: both grew past the 8%-or-1 KB allowance, and no source
change in the pass that noticed them. This is the recorded reason, with the
measurement behind it.

| Entry | Was | Now | Delta | Allowance | Over |
| --- | --- | --- | --- | --- | --- |
| `charts-statistical` | 45,224 B (44.2 KB) | 49,671 B (48.5 KB) | +4,447 B | +3,617 B | +830 B |
| `charts-financial` | 43,547 B (42.5 KB) | 48,575 B (47.4 KB) | +5,028 B | +3,483 B | +1,545 B |

Both numbers are raw bytes from a fresh `build:package`, measured by
`scripts/consumer-test.mjs` with every third-party module external — the same
harness and the same tolerance the previous baseline used. Nothing else changed:
the diff touches these two entries and no others, so every other budget stays as
tight as it was, and `pnpm --filter @luc/ui test:consumer` passes.

### What grew, measured from the import graph

The increase is chart *core*, shared by every chart family, and it is the sum of
work that landed between the baseline commit (`31103311`) and this one — ~3,400
lines under `src/charts/**`, none of it in this pass:

| Module in the built graph | Cost | What it is |
| --- | --- | --- |
| `core/theme-tokens.js` | 5.4 KB (new) | The resolved token values as data, so a DOM-free renderer (SSR, print, image capture) and the DOM path go through one mapping instead of each keeping a copy. `core/theme.ts` shrank by more than this: its literal tables moved here. |
| `core/diagnostics.js` | 1.9 KB (new) | The `finished`-frame digest QA reads as `data-luc-chart-diagnostics` — the artifact that made "eleven broken charts passed five hundred screenshots" measurable. |
| `core/gesture.js` | 1.5 KB (new) | Reader-input attribution for a synchronised group: "the window moved" is emitted for a pan and for a resize alike, and only the reader's own gesture may move the siblings. |
| `core/sync.js` | +113 lines | The range half of the group bus. |
| `adapters/echarts/echart-surface.js` | +196 lines | The arm/disarm lifecycle, the diagnostics hook and the gesture wiring. |

### What was checked, and what was rejected

- **Not a lost tree-shaking flag.** The package already declares
  `sideEffects: ["**/*.css"]`, and the new modules are side-effect free.
- **Not a barrel leak.** The statistical entry's module list contains no
  `range-group`, no `theme-tokens-light` and no other family's option builder;
  `core/range-group.ts` is 339 lines and is *absent* from both bundles. The
  entry's only static imports are `clsx`, `tailwind-merge` and `react`; ECharts
  itself stays behind a dynamic import.
- **Not a toolchain change.** `tsdown.config.mjs` and `pnpm-lock.yaml` are
  untouched since the baseline commit, and `package.json`'s `exports` did not
  change.
- **Not fixable by lazy loading without changing behaviour.** The obvious
  candidate is `watchPlateGesture`, which the ECharts surface arms on every
  chart. Deferring it would save ≤1.5 KB and would break gesture attribution for
  a chart inside a sync group — the reader's pan would stop moving its siblings,
  or a programmatic zoom would start moving them. The bytes are load-bearing.
- **Not the budget's fault.** Raising the tolerance, disabling the scenario or
  editing the measurement was rejected outright; the tolerance still catches a
  >3.6 KB / >3.5 KB regression in these two entries, which is what it is for.

The shape of the number, for whoever reads it next: a statistical chart is 48 KB
because it carries a theme bridge, a diagnostics digest, a gesture watcher and a
sync bus alongside its marks — not because it carries a chart engine, a date
system or a provider script, all three of which this scenario still forbids.

## The four chart baselines, re-recorded again (2026-10-14)

`pnpm verify` reached `verify:package` red on four entries, all chart-side, and
again with no source change in the pass that noticed them. The feature that grew
them is `a05a2a08` — *direct axis manipulation and a resizable inspector frame* —
which added `charts/core/axis-drag.ts` (+165 lines) and
`charts/core/inspector-size.ts` (+195 lines) and the drag wiring in
`adapters/echarts/echart-surface.tsx`.

| Entry | Was | Now | Delta |
| --- | --- | --- | --- |
| `charts` | 60,621 B (59.2 KB) | 71,233 B (69.6 KB) | +10,612 B |
| `charts-statistical` | 49,671 B (48.5 KB) | 55,794 B (54.5 KB) | +6,123 B |
| `charts-financial` | 48,575 B (47.4 KB) | 54,696 B (53.4 KB) | +6,121 B |
| `financial-engine` | 34,630 B (33.8 KB) | 37,768 B (36.9 KB) | +3,138 B |

**Only these four moved.** The other thirteen entries keep their 2026-10-12
values even though a fresh measurement drifts 46–237 B above several of them:
that drift is inside the 8%/1 KB allowance, and re-recording it would have bought
the gate nothing while widening thirteen windows. A baseline is only worth its
tightness, so the four that were genuinely over are raised to what they measure
and nothing else is touched.

### What grew, measured from the bundle

The same harness the previous re-record used, plus a module listing of the
`charts-statistical` scenario (28 modules, 72.7 KB rendered):

| Module in the built graph | Cost | What it is |
| --- | --- | --- |
| `charts/core/axis-drag.js` | 2,751 B rendered in that bundle (4,588 B in `dist`) | the pure geometry behind dragging a time or value axis — `plotRect`, `windowFractions`, `scaleValueRange`, `axisBandAt` |
| `charts/core/inspector-size.js` | 5,900 B in `dist`, absent from the family entries | the resizable inspector frame's sizing rules, imported by `charts/components/fullscreen.tsx`, which is why the umbrella `charts` entry grew 4.4 KB more than the families |
| `charts/adapters/echarts/echart-surface.js` | 13,865 B rendered (was ~11.6 KB) | the drag start/move/end handling itself, which is where the rest of the family delta sits |

### What was checked, and what was rejected

- **Not a barrel leak, not another family.** The statistical bundle contains no
  financial, geographic or radial option builder, no `range-group`, no
  `lightweight-charts` and no provider script — the scenario's `forbidden` list
  is unchanged and still passes.
- **Not a toolchain or tolerance change.** `tsdown.config.mjs`, the lockfile and
  `TOLERANCE_RELATIVE` are untouched; the tolerance still fails a >4.4 KB
  regression in `charts-statistical`.
- **Lazy-loading the drag geometry was rejected.** `echart-surface.tsx` imports
  the helpers statically and uses them inside its own pointer handler; deferring
  them with a dynamic `import()` would save ≤1.4 KB gzip per entry and make the
  first drag an asynchronous path, which is the trade the 2026-10-12 section
  already declined for `watchPlateGesture`. The bytes are the feature.
- **Editing the measurement, disabling the scenario or raising the tolerance was
  rejected outright**, as before.

The shape of the number, for whoever reads it next: a statistical chart is 54 KB
because it carries a theme bridge, a diagnostics digest, a gesture watcher, a
sync bus *and* the axis-drag geometry alongside its marks — not because it
carries a chart engine, a date system or a provider script.
