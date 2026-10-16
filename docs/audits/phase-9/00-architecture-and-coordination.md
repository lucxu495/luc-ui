# Phase 9 — Checkpoint 0: architecture, contracts and ownership

**Date:** 2026-10-09 (UTC)
**Scope of writes:** `luc-ui/**` only. Everything else in `luc-quant` is read-only.
**Git state at inspection:** branch `main`, HEAD `3110331`, `git status` clean.

This is the plan of record. Implementation checkpoints append their own audit
documents beside it; this file is only rewritten when a decision changes.

---

## 1. What actually exists (verified, not assumed)

| Thing | Reality |
| --- | --- |
| Showcase app | `luc-ui/apps/showcase`, Next 16 App Router, `output: "standalone"`, `transpilePackages: ["@luc/ui"]` |
| Locale routing | `apps/showcase/middleware.ts` rewrites `/zh/**` onto `/**` and sets `x-luc-locale`. There is exactly one copy of every page — no `[locale]` directory |
| Component library | `luc-ui/packages/ui/src`, 35 subpath entries, 1364 catalogued exports, ~160 component modules |
| Generated catalog | `luc-ui/docs/component-catalog.json`, produced by `packages/ui/scripts/generate-catalog.mjs`, guarded by `pnpm --filter @luc/ui catalog:check` |
| Catalog annotations | `packages/ui/scripts/catalog-annotations.json` — per **subpath** `category` / `use` / `avoid` / `a11y` / `showcase` |
| Navigation | `apps/showcase/lib/navigation.ts`, 504 lines, a static `NavGroup[]` |
| i18n | `lib/i18n/{config,messages,provider,prose.zh,routes.zh}.ts`; `tcs(sentence)` looks the Chinese rendering up **by the English sentence**; `scripts/i18n-coverage.mjs` fails on any untranslated sentence |
| QA | `apps/showcase/qa/*.mjs`; `scripts/qa-server.mjs` builds the Docker image and runs a tier against it; `qa/routes.mjs` is a manual route registry (91 entries for 148 routes) |
| Tests | 89 Vitest files in `packages/ui/src`, run from `packages/ui`. The Showcase has no unit runner — only `tests/visual.spec.mjs` (Playwright) |
| Docker | `luc-ui/docker-compose.yml` → container `luc-ui-showcase`, image `luc-ui/showcase:1.0.0`, `127.0.0.1:3000`, healthy since 2026-10-09T12:56Z, image id `1c5c7ea32051` |
| Rollback tags | `luc-ui/showcase:rollback-20261009-pre-phase-8` = `47d1ce33584f`, one per earlier phase |
| Host resources | 15 GB RAM, ~5 GB available, 5 GB swap in use, 8 cores, load ~6.3, 26 GB disk free |

Phase 8's reported numbers (148 routes, 898 tests, 109 behaviour checks, 238 axe
scans, 76 chart types) are consistent with the tree. They are treated as a
baseline to verify at Checkpoint 5, not as facts to quote.

---

## 2. The central architectural decision

Phase 8's Showcase is a **page-per-topic gallery**: `/components/inputs` covers
six inputs, `/charts/statistical` lists nine charts. Phase 9 needs
**page-per-component documentation**. Hand-writing 300 pages is not the answer,
and neither is a shallow template applied blindly.

The decision:

> **One documentation registry, one dynamic route per surface, chrome in a
> layout, content in the page.**

- `lib/docs/registry.ts` is the single canonical identity map. It is assembled
  from the **generated** `docs/component-catalog.json` (real exports, real
  TypeScript signatures, real import paths) plus handwritten curation.
- `app/components/[component]/page.tsx` and `app/charts/[chart]/page.tsx`
  generate a page for every registered id via `generateStaticParams`.
- `app/components/layout.tsx` and `app/charts/layout.tsx` own the shared
  chrome — breadcrumbs, family context, on-this-page anchors, related links,
  previous/next — for **both** the generated pages and the ~30 hand-written
  pages that already exist. A layout is the only place chrome can live without
  touching every page file.
- The sidebar, the search index, breadcrumbs and previous/next all read the
  same registry, so there is no second catalogue to drift.

Next.js resolves a static segment before a dynamic one. That is a feature here:
`/components/select` (hand-written, rich) *is* the canonical page for the
`select` id, and `/components/rating` (no static directory) is served by the
dynamic route. No URL breaks. A test asserts that no registered id collides
with a static directory that is a category page rather than the component's own
page.

### Accepted consequence

A generated page is honest but plainer than a curated one. The registry
therefore records coverage status per component and the UI states it:

| status | meaning |
| --- | --- |
| `curated` | handwritten page with real examples |
| `generated` | registry-driven page: real import path, real API table, real live preview from a family example where one exists |
| `reference` | id appears in the API surface but has no standalone page yet (helpers, constants, sub-parts); it is listed on its family page |

No page claims more than it has.

---

## 3. Canonical identifiers and integration contracts

### 3.1 `DocEntry` (`apps/showcase/lib/docs/types.ts`)

```ts
export type DocStatus = "curated" | "generated" | "reference";

export interface DocEntry {
  /** Canonical kebab-case id. Also the route slug. */
  id: string;
  /** Public display name, e.g. "LineChart". */
  title: string;
  /** Family id from families.ts. */
  family: string;
  /** Import statement the page tells the reader to write. */
  importPath: string;
  /** Named exports this page documents. Resolved against the catalog. */
  exports: string[];
  /** One sentence: what it is for. */
  summary: string;
  /** Route, always `/components/<id>` or `/charts/<id>`. */
  route: string;
  status: DocStatus;
  /** Playground adapter id, when the component has dynamic controls. */
  playground?: string;
  /** Related ids. Validated to exist. */
  related?: string[];
}
```

Validation is a **unit test**, not a runtime hope: every `importPath` must exist
in the catalog, every named export must be a real export of that entry, every
`family` and `related` id must resolve, and no two entries may share an `id`.

### 3.2 Family taxonomy (`lib/docs/families.ts`)

Three levels maximum: **group → family → component**. Component families follow
the real import paths, not invention:

```
Components
  Actions          Button, IconButton, ButtonGroup, Toggle, Toolbar, Link
  Forms            Input, Textarea, Select, NativeSelect, Combobox, Checkbox,
                   RadioGroup, Switch, Slider, Rating, SegmentedControl,
                   DateField/DatePicker, Form primitives, Field, NumberInput,
                   CurrencyInput, PercentageInput, PasswordInput, OtpInput,
                   FileInput/DropZone, TagInput, ColorPicker
  Layout           Container, Grid, Inline, Stack, Section, Separator,
                   ScrollArea, AspectRatio, Panel, Card
  Navigation       Sidebar, AppShell, Breadcrumbs, PageHeader, Tabs, Pagination,
                   Stepper, TreeView
  Feedback         Alert, Callout, Progress, Spinner, Skeleton, EmptyState,
                   StatusBadge, FreshnessBadge, Toast, NotificationCenter,
                   GuidedTour
  Overlays         Dialog, AlertDialog, Sheet, Popover, HoverCard, Tooltip,
                   DropdownMenu, ContextMenu, Command, Lightbox
  Data display     DataTable, VirtualDataTable, FacetFilter, Timeline,
                   TransferList, KanbanBoard, SortableList, Metric, Delta,
                   Timestamp, DataDetails, StatCard
  Media            Avatar, Carousel, ImageGallery, ImageCompare
  Application      Workspace, InspectorPane, OutlineDrawer, UrlState, Providers
  AI               ChatMessage, MessageList, StreamingText, PromptComposer,
                   ToolCallTimeline, AgentActivity
  Typography       Heading, Text, NumericText, Code, Kbd
  Experiences      ProfileHero, SocialLinks, ExperienceTimeline, ProjectShowcase,
                   PublicationList, ReadingShelf, NowSection
Charts
  General          LineChart, AreaChart, BarChart, ComposedChart, ScatterChart
  Distribution     HistogramChart, BoxPlotChart, ViolinChart
  Statistical      QqPlotChart, EcdfChart, RocCurveChart, CalibrationChart
  Financial        CandlestickChart, DrawdownChart, EfficientFrontierChart,
                   VolatilitySmileChart, PnlAttributionChart
  Scientific       ContourChart, SpectrogramChart, VectorFieldChart
  Matrix           HeatmapChart, CorrelationMatrix, CalendarHeatmap
  Relational       ScatterRegressionChart, QuadrantScatterChart
  Composition      PieChart, TreemapChart, SunburstChart, FunnelChart
  Flow and network SankeyChart, GraphChart, ChordChart, DendrogramChart
  Geospatial       ChoroplethChart, GeoScatterChart, GeoTrajectoryChart
  Radial           RadarChart, GaugeChart, PolarRoseChart, WindRoseChart
  Sequence         EventTimeline, RegimeStrip, GanttChart
Motion
  Typography       KineticHeadline, TextReveal, ScrambleText, ShimmerText,
                   NumberTicker
  Surfaces         SpotlightSurface, GlareSurface, TiltSurface, BorderGlow,
                   AuroraSurface, MotionSurface, InteractiveGrid
  Spatial          CardStack, MorphingDialog, MorphingPopover, ParallaxScene,
                   MagnifyDock, OrbitField
  Feedback         PressRipple, ClickBurst, DataChangeFlash, FadeSwap, Collapse
Integrations
  TradingView      the provider widgets, grouped by catalog category
```

### 3.3 Playground contract (`apps/showcase/components/playground/`)

The engine is **Showcase-only**. It is never exported from `@luc/ui`.

```ts
type Control =
  | { kind: "boolean"; name; label; default: boolean }
  | { kind: "enum";    name; label; default: string; options: {value,label}[] }
  | { kind: "number";  name; label; default: number; min?; max?; step? }
  | { kind: "text";    name; label; default: string; placeholder? }
  | { kind: "color";   name; label; default: string }
  | { kind: "list";    name; label; default: string[] }   // multi-enum
  | { kind: "fixture"; name; label; default: string; options: {value,label}[] }
  | { kind: "slot";    name; label; default: string; options: {value,label}[] };

interface PlaygroundSpec {
  id: string;                 // matches DocEntry.playground
  component: string;          // display name used in generated code
  importPath: string;
  controls: Control[];
  /** Values a control cannot express are documented, never faked. */
  unsupported?: { name: string; reason: string }[];
  render: (values: ControlValues) => ReactNode;   // the live preview
  serialize: (values: ControlValues) => string;   // the JSX body (no imports)
}
```

`serialize` output plus `importPath` go through one typed serializer that emits
the final snippet with its import line. Preview and code therefore read the
**same** `values` object, so they cannot disagree by construction. Both are pure
functions of `values`, which is what makes them unit-testable without a browser.

Rules:

- `slot` and `fixture` controls choose from a **typed local registry** of React
  nodes and data objects; nothing evaluates user text.
- A control that would need a function or an arbitrary `ReactNode` is listed in
  `unsupported` and the page says so, instead of pretending.
- Reset restores the declared defaults.

### 3.4 Installation and AI contracts

- `lib/docs/install.ts` is the only place an install command is written. It
  knows two distribution modes — `source` (today: the pnpm workspace and the
  packed tarball) and `package` (not yet published) — and emits npm / pnpm /
  yarn / bun variants. The `package` mode is labelled *intended publication
  usage* until a release exists. No page invents a version.
- `lib/docs/ai-prompt.ts` builds the copy-for-AI block from a `DocEntry` plus
  the live playground values: purpose, import path, setup, chosen props, data
  contract, accessibility expectations. It never claims an MCP server exists.

### 3.5 Studio contracts

Studios are Showcase routes under `app/studios/**` with their pure logic in
`lib/studios/**` so it can be unit-tested:

| Studio | Route | Contract |
| --- | --- | --- |
| Chart Studio | `/studios/charts` | deterministic fixtures + CSV/JSON import + shape validation + serializable config → valid JSX |
| Motion Studio | `/studios/motion` | real motion props (duration, intensity, amplitude, perspective, depth) with reduced motion honoured |
| Theme Studio | `/studios/themes` | existing tokens only: palette, type voice, personality, depth, radius, contrast |
| Template Composer | `/studios/composer` | reorder and edit real Blocks in a personal, marketing or product page; no code execution |

Chart correctness rules carried into the Studio: never infer ratio vs percent
from magnitude; respect basis points; drawdown sign conventions; timezone
semantics stated; missing or non-finite values rejected with a message. The
Studio never performs analytics beyond the deterministic fixture generators that
already ship.

---

## 4. Checkpoints and batches

| # | Deliverable | Owner |
| --- | --- | --- |
| 0 | This document; `lib/docs/{types,families,registry}.ts`; playground engine core and serializer; install/AI modules; Vitest wiring for the Showcase; QA route auto-discovery | Lead |
| 1 | Homepage; global navigation; registry-driven sidebar; search; `/docs/*` getting started; component doc chrome | Lead, Agent A, Agent B |
| 2 | Playground shell, controls and 8 reference adapters, with preview/code equivalence tests | Lead, Agent C |
| 3 | Registry coverage across the public catalogue: generated component pages, per-chart pages, family landing pages | Agent B, Agent D |
| 4 | Chart Studio, Motion Studio, Theme Studio, install/AI blocks on every page, shadcn-compatible registry proof of concept with a clean external fixture | Agent D, Lead |
| 5 | Blocks and Templates gallery, QA (Vitest, typecheck, lint, Playwright, axe, i18n), Docker deploy, Chinese terminal report | Lead |

---

## 5. File ownership

### Lead-owned (nobody else writes these)

```
apps/showcase/lib/navigation.ts
apps/showcase/lib/i18n/**
apps/showcase/lib/docs/{types,families,registry}.ts
apps/showcase/lib/docs/registry/**
apps/showcase/components/docs/**
apps/showcase/components/playground/{types,serialize,state,panel}.ts(x)
apps/showcase/components/shell/**
apps/showcase/app/layout.tsx, app/page.tsx
apps/showcase/app/components/layout.tsx
apps/showcase/app/charts/layout.tsx
apps/showcase/qa/routes.mjs, qa/route-map.mjs, qa/behaviour.mjs
apps/showcase/scripts/i18n-*.mjs
apps/showcase/vitest.config.ts, apps/showcase/tests/unit/**
apps/showcase/package.json, packages/ui/package.json, luc-ui/package.json
luc-ui/docker-compose.yml, luc-ui/Dockerfile, luc-ui/docs/audits/phase-9/**
```

### Agent A — website and brand

Writable: `apps/showcase/components/home/**`,
`docs/audits/phase-9/i18n/agent-a.json`, `docs/audits/phase-9/agent-a-report.md`.
Deliverable: homepage sections, hero, product story, resource links.
Forbidden: `lib/navigation.ts`, the docs registry, i18n dictionaries, any chart
or playground file.

### Agent B — component documentation

Writable: `apps/showcase/app/components/[component]/**`,
`apps/showcase/app/charts/[chart]/**`, `apps/showcase/components/doc-pages/**`,
`docs/audits/phase-9/i18n/agent-b.json`, `docs/audits/phase-9/agent-b-report.md`.
Deliverable: the generated component and chart pages, family landing pages,
discovery UX (breadcrumbs, anchors, related, previous/next, empty search).
Forbidden: `lib/docs/registry.ts`, `lib/navigation.ts`,
`components/playground/**`.

### Agent C — playground and code generation

Writable: `apps/showcase/components/playground/adapters/**`,
`apps/showcase/components/playground/controls/**`,
`apps/showcase/tests/unit/playground-*.test.ts`,
`docs/audits/phase-9/i18n/agent-c.json`, `docs/audits/phase-9/agent-c-report.md`.
Deliverable: the eight reference adapters (Button, Input, Card,
KineticHeadline, LineChart, ViolinChart, ProfileHero, an AI component), control
renderers, serializer tests.
Forbidden: the engine core files (`types.ts`, `serialize.ts`, `state.ts`,
`panel.tsx`), the registry.

### Agent D — chart studio and scientific correctness

Writable: `apps/showcase/app/studios/**`, `apps/showcase/lib/studios/**`,
`apps/showcase/tests/unit/studio-*.test.ts`,
`docs/audits/phase-9/i18n/agent-d.json`, `docs/audits/phase-9/agent-d-report.md`.
Deliverable: Chart Studio with CSV/JSON import, shape validation, units,
config to JSX, deterministic fixtures; honest limitation notes.
Forbidden: `packages/ui/src/charts/**` internals.

---

## 6. Parallelism and host budget

The host is shared and loaded (load 6.3, ~5 GB RAM free, 5 GB swap in use).

- **Maximum two implementation agents at a time.** Three only for work that
  touches no shared file and runs no build.
- **Exactly one owner of a full browser QA run or a Docker build** — the Lead.
  Agents run focused Vitest and `tsc --noEmit`, never `qa:full` and never
  `docker compose build` concurrently.
- Heavy `next build` and Docker image builds happen in Docker only; the host
  build is known to fail in this sandbox (Turbopack's PostCSS worker cannot
  bind a port).

---

## 7. i18n and QA integration (why parallel work stays safe)

Two shared artefacts cannot be edited concurrently without conflicts:
`lib/i18n/prose.zh.ts` and `qa/routes.mjs`. Both are handled by design rather
than by locking:

1. **Sentences.** Each agent writes `{"en": "...", "zh": "..."}` pairs into
   `docs/audits/phase-9/i18n/<agent>.json`. The Lead runs one merge step that
   inserts them into `prose.zh.ts` in its existing shape. Agents never open the
   dictionary.
2. **Routes.** `qa/routes.mjs` is rewritten to **discover** every `page.tsx` on
   disk and union it with the explicit coverage policy (mobile, light, groups).
   A route an agent adds is therefore covered at dark desktop the moment it
   exists, and the policy file only states extra coverage. This also fixes a
   real Phase 8 weakness: 148 routes but 91 registry entries meant a new page
   could ship unmeasured.

---

## 8. Repository boundaries

Unchanged and non-negotiable for this phase: writes stay inside `luc-ui/**`.
No commits, no pushes, no npm publish, no new GitHub repository, no billing, no
`luc-web` / `luc-api` / `luc-cron` / `luc-jobs` edits, no shared root
`package.json` or lockfile edits, no destructive git commands, no Docker prune,
no restart of any non-Showcase container. The current Showcase image is tagged
as the rollback target before any deploy.

---

## 9. What Phase 9 does not do

- It does not implement `@luc/render` or `@luc/mcp`. It records the boundary
  (serializable theme settings, deterministic chart configs, explicit data
  schemas, no Node-only code in client UI) and documents the direction.
- It does not create a Pro surface, a paywall or a licence check.
- It does not publish anything.
- It does not add chart types to raise a count.
