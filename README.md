# LUC UI

A reusable visual and interaction system for LUC products — Luc Quant, Luc CV
and whatever comes next. It is its own repository and its own pnpm workspace:
nothing here imports from `luc-cron`, `luc-jobs`, `luc-hermes`, `luc-injest`,
`luc-web`, ClickHouse, analytics or backend code, and nothing outside this
repository is needed to install, build, test or run it.

Until 2026-10-16 it lived as `luc-ui/` inside the `luc-quant` monorepo, where
the pnpm workspace root was the repository root one level up. This repository is
that directory promoted to a repository root; the extraction, its evidence and
what it deliberately left alone are recorded in
[`docs/EXTRACTION_PHASE_1.md`](./docs/EXTRACTION_PHASE_1.md).

On 2026-10-16 the **LUC Visuals** product was extracted into its own, private
repository (`luc-visuals`): the `@luc/visuals` package, its eleven gallery routes
and the copy that belonged to them. This repository is now only the UI system.
`luc-visuals` depends on `@luc/ui` the way any consumer does — as a packed,
versioned package through `@luc/ui`'s published exports — so the dependency runs
one way and nothing in here knows Visuals exists. That split is recorded in
[`docs/EXTRACTION_PHASE_2.md`](./docs/EXTRACTION_PHASE_2.md).

**Version**: 1.0.0 — the frozen foundation
**Character**: precise, calm, elegant, intelligent, technical, refined.
**Principle**: quiet at rest, alive on interaction.

## What is here

```
./
├── apps/showcase/        Next.js UI laboratory, visual QA target and documentation
├── packages/ui/          @luc/ui — tokens, components, layout, motion, data, table, forms, date & time, charts, app shell, workspace, URL state, TradingView integrations
├── docs/                 research, licence matrix, motion/accessibility/chart/form/date-time/source guides,
│                         the TradingView guide, the component inventory, and the V1 freeze docs
│                         (PUBLIC_API, V1_API_AUDIT, V1_TOKEN_AUDIT, VERSIONING, PACKAGING_GUIDE)
├── skills/luc-ui/        the Codex skill for working in this system
├── artifacts/            QA output: committed pixel baselines + generated
│                         screenshots and qa-report.json (see artifacts/README.md)
├── Dockerfile            production image for the private review server
├── docker-compose.yml    loopback-only Showcase service
├── .dockerignore         keeps the image free of installs, artifacts and caches
├── DESIGN_SYSTEM.md      the rules
└── AI_DESIGN_GUIDE.md    concrete guidance for AI coding agents
```

## Quick start

```bash
git clone https://github.com/lucxu495/luc-ui.git
cd luc-ui
pnpm install          # Node >= 22, pnpm >= 10
pnpm dev              # the Showcase at http://localhost:3000
pnpm verify           # the fast gate: types, lint, tests, package, release artifact
```

`pnpm install` is the whole setup. Nothing outside this repository is needed to
install, build, test or run it.

## Three layers, one grammar

`@luc/ui` is published as a single package with stable subpaths, and it has three
layers of reusable code:

| Layer | What it is | Where |
| --- | --- | --- |
| Foundations | Tokens, palettes, type voices, personalities, spatial material, motion | `@luc/ui/tokens.css`, `@luc/ui/styles.css`, `data-space` |
| Components | One control at a time: `Button`, `DataTable`, `TreeView`, `KanbanBoard`, `Chart`, … | the root barrel, plus `charts`, `data-table`, `forms`, `motion`, … |
| Experiences | The assemblies a *page* is made of: `ProfileHero`, `ExperienceTimeline`, `PublicationList`, `ReadingShelf`, … | `@luc/ui/experiences` |

Everything a product page contains that is *not* in layer C is a recipe —
composition of primitives with the application's own content. The boundary is
written down, with the reasoning and the recipe list, in
[`docs/EXPERIENCE_GUIDE.md`](./docs/EXPERIENCE_GUIDE.md).

Sixteen working reference products — marketing, SaaS, publishing, community,
four personal sites, and one journey each for AI, science, quant, commerce,
education, media, productivity and community — are at **`/experiences`** in the
Showcase. Each names the public components it is built from and is driven by a
browser test rather than a screenshot.

```bash
pnpm install                  # repository root — it is the pnpm workspace root
pnpm dev                      # Showcase on http://localhost:3000
```

From a remote machine, forward the port instead of exposing it publicly:

```bash
# on the server, from the repository root
pnpm --filter @luc/showcase dev --hostname 0.0.0.0

# on your laptop
ssh -L 3000:localhost:3000 <server>
# then open http://localhost:3000
```

## Private review via Docker (production build)

For human visual review, run the production Showcase in Docker instead of the
dev server:

```bash
# on the server, from the repository root
docker compose up -d --build
docker compose ps                 # expect: Up ... (healthy)

# on your Mac (nothing is exposed publicly; the port is bound to 127.0.0.1)
ssh -L 3000:localhost:3000 luc@<SERVER_IP>
# open http://localhost:3000

# if local port 3000 is taken
ssh -L 3001:localhost:3000 luc@<SERVER_IP>
# open http://localhost:3001
```

| Command | What it does |
| --- | --- |
| `docker compose up -d --build` | Build the image and (re)start the Showcase |
| `docker compose ps` | Status, including the healthcheck result |
| `docker compose logs -f` | Follow runtime logs |
| `docker compose down` | Stop and remove the container |

The image runs the Next.js standalone production server as the unprivileged
`node` user. The host port is published on `127.0.0.1` only — never `0.0.0.0`.
Use `LUC_UI_SHOWCASE_PORT=3005 docker compose up -d` if host port 3000 is busy.
`artifacts/screenshots/` and Playwright browsers are excluded from the image by
`.dockerignore`.

## Using the package

`@luc/ui` is not on a registry. Consumers install it from a git tag, which is
the built package, tagged once per release:

```bash
pnpm add @luc/ui@github:lucxu495/luc-ui#v1.0.0
```

```json
{ "dependencies": { "@luc/ui": "github:lucxu495/luc-ui#v1.0.0" } }
```

The tag points at a commit on the `release` branch whose root *is* `@luc/ui` —
built JavaScript, declarations, CSS and the package manifest, with no install
scripts. The lockfile records the commit, so an install is byte-reproducible
from the ref alone. `docs/RELEASES.md` is the contract; `docs/CONSUMERS.md` has
the whole consumer recipe, including the tarball alternative used by
`@luc/visuals`, `luc-render` and `luc-web`'s earlier revisions.

```tsx
// app/layout.tsx
import { LucProvider, lucThemeInitScript } from "@luc/ui";
import "@luc/ui/styles.css";

<html lang="en" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: lucThemeInitScript({ defaultTheme: "dark" }) }} />
  </head>
  <body>
    <LucProvider defaultTheme="dark">{children}</LucProvider>
  </body>
</html>
```

```tsx
import { Button, Card, StatCard, Tabs } from "@luc/ui";
```

The stylesheet is Tailwind CSS v4. Import it **after** `@import "tailwindcss"`.
The packed stylesheet scans its installed `dist` modules, including in an app
outside this workspace:

```css
@import "tailwindcss";
@import "@luc/ui/styles.css";
/* @luc/ui/styles.css already scans its packed dist modules. */
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Showcase dev server |
| `pnpm build` | Build the publishable `@luc/ui` package (`tsdown` + declarations) |
| `pnpm build:showcase` | Ensure the production Showcase container is built and running |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm lint` | ESLint across the workspace |
| `pnpm test` | Current Vitest suite |
| `pnpm verify` | The fast gate: typecheck · lint · tests · package build · publint · attw · consumer isolation and bundle baseline |
| `pnpm qa:changed` | Browser QA for the routes the working-tree diff can reach |
| `pnpm qa:behaviour` | The 71 browser behaviour checks (optionally `-- --group=<name>`) |
| `pnpm qa:full` | All 91 routes + all behaviour checks, deterministic provider |
| `pnpm qa:providers` | Live TradingView: all ten provider routes swept, wrapper contract asserted |
| `pnpm qa:baseline` | Pixel-diff the committed visual baselines |
| `pnpm qa:release` | Everything, once, before a freeze |
| `pnpm qa:clean` | Remove generated QA artifacts (never the baselines) |

## Visual QA

```bash
pnpm qa:changed      # while iterating: only what your diff can reach (~1 min)
pnpm qa:full         # milestone sweep: 91 routes + 71 checks (~5 min)
```

Each `qa:*` command ensures the Showcase container is current (hashing the inputs
the image copies, rebuilding only when they changed, then waiting until it
answers on loopback). There is no manual build/start step.

A full sweep captures 278 screenshots (desktop 1440×1000, mobile 390×844, dark
and light) into `luc-ui/artifacts/screenshots/`, runs 132 axe-core scans, and
exercises 71 browser behaviour checks — overlays and menus, the data table,
charts and cross-engine sync, forms and date/time semantics, the app shell and
workspace, URL state, reduced motion, and the TradingView wrapper contract.
`luc-ui/artifacts/qa-report.json` records per-phase and per-route timings.

`pnpm qa:baseline` asserts 15 committed pixel-diff baselines in
`luc-ui/artifacts/baselines/`. Full detail: `docs/QA_WORKFLOW.md`.

## Where to read next

1. `DESIGN_SYSTEM.md` — the rules (start here).
2. `apps/showcase` — the living documentation; `pnpm dev` and read it.
3. `docs/MOTION_GUIDE.md`, `docs/ACCESSIBILITY.md`, `docs/CHART_GUIDE.md`,
   `docs/FORM_GUIDE.md`, `docs/DATE_TIME_GUIDE.md`, `docs/APP_SHELL_GUIDE.md`,
   `docs/NAVIGATION_GUIDE.md`, `docs/WORKSPACE_GUIDE.md`,
   `docs/URL_STATE_GUIDE.md`, `docs/PACKAGING_GUIDE.md`.
4. `docs/research/` — what was studied, what was licensed, what was decided.
5. `skills/luc-ui/SKILL.md` — how to work in this repository without breaking it.

## Status

Implemented in V0.1: design tokens, dark and light themes, typography, layout
primitives, 24 core components, 6 motion primitives, 7 data primitives, chart
chrome, the Showcase, the agent skill and the research documentation.

Implemented in V0.2–V0.3: the chart system (Apache ECharts + TradingView
Lightweight Charts, chart tokens, tooltips, annotations, synchronisation,
fullscreen research view), the data table (TanStack Table/Virtual, column
helpers, filters, selection, pagination, virtualisation), Select, Combobox,
Toast, Sheet, CommandMenu and the chart-to-table accessibility view.

Implemented in V0.4: the form foundation (`Form`, `FormSection`, `Fieldset`,
`FieldGroup`, `FieldArray`, `FormActions`, `SubmitButton`, `FormErrorSummary`,
extended `Field` states), the optional React Hook Form adapter, `NumberInput` /
`CurrencyInput` / `PercentageInput`, `PasswordInput`, `OtpInput`, `FileInput` /
`DropZone`, `TagInput`, and the date and time system (`Calendar`,
`RangeCalendar`, `DateField`, `DatePicker`, `DateRangePicker` with presets,
`MonthPicker`, `YearPicker`, `TimePicker`, `DateTimePicker`,
`ZonedDateTimePicker`, `LocaleProvider`, date/time formatters).

Implemented in V0.5: the application framework — `AppShell` (frame, sidebar with
an expanded/rail/off-canvas lifecycle, topbar, status strip, skip link,
landmarks), the navigation model and its three surfaces (sidebar, mobile drawer,
command palette), `Breadcrumbs` and `PageHeader`; the `Workspace` (resizable
horizontal, vertical and nested panes, accessible separators, focus mode,
versioned local layout persistence) and `InspectorPane`; router-agnostic URL
state (`param` sets and codecs, `useUrlState`, compiled on the Showcase side
through a nuqs adapter); pinned cross-engine chart inspection; Share View; and a
real distributable package (compiled ESM + declarations, curated subpath
exports, one public stylesheet, `publint` and a consumer tree-shaking test).
Two house rules became lint rules: no raw colour literals, no deep package
imports.

Implemented in V0.6: the TradingView integration system — a typed wrapper for
every current, officially documented widget (27 of them: 16 Web Components and
11 iframes), a widget registry that also drives the Showcase catalog, a loader
that deduplicates provider modules and is safe under SSR and StrictMode, a theme
bridge built only on the provider's published tokens, an iframe adapter that owns
its own markup so the provider cannot desynchronise React's tree, lazy loading,
loading/error/retry states, a documented attribution boundary, and a dedicated
`@luc/ui/tradingview` entry point that a button-only consumer never pulls. The
round also fixed three reported defects: the shared search/combobox icon
alignment, the correlation-matrix value-label policy, and the box plot whose
marks were only painted on hover. The component inventory and the pre-V1.0 gap
audit live in `docs/COMPONENT_INVENTORY.md`.

Implemented in **V1.0 — final primitives + hardening + API freeze**: the four
MUST-HAVE gaps from the V0.6 audit (`Slider` / `RangeSlider`,
`DropdownMenu` / `ContextMenu`, `Alert` / `Callout`, and the generic
`EmptyState`), a keyboard path for pinned chart inspection
(`ChartInspectionArea`), a full public-API audit, a token audit that fixed a real
defect in the elevation bridge (`shadow-overlay` had never been a utility, so
every overlay rendered without a shadow), accessibility hardening for the
workspace separators and the new primitives, a bundle baseline wired into the
package gates, Are The Types Wrong against the packed artifact, and the
documentation freeze (`docs/PUBLIC_API.md`, `docs/V1_API_AUDIT.md`,
`docs/V1_TOKEN_AUDIT.md`, `docs/VERSIONING.md`, `CHANGELOG.md`,
`MIGRATION_V1.md`).

Deferred on purpose, with the reasoning in `docs/COMPONENT_INVENTORY.md`:
DatePicker/Calendar mobile sheet behaviour, masked input, file upload progress,
DataTable editing (the DataGrid boundary), multi-select Combobox,
drag-and-drop, TreeView, Carousel, Timeline, Stepper, Menubar, `@shadcn/lint`,
publishing `@luc/ui` to a registry, and any Luc Quant-specific UI.

Implemented in Phase 2 (Community Edition): **brand palettes and type voices**.
Seven accent families (`cyan`, `violet`, `cobalt`, `emerald`, `rose`, `ember`,
`graphite`) and four type voices select with one attribute — `data-palette` /
`data-typeface` on `<html>`, or on any subtree, so one page can show four
products. Status colours are deliberately outside the palette layer, and every
palette's accent pairs are contrast-gated in unit tests and re-measured in the
browser. `Button` gained a tinted `accent` variant and a single signature hover
sweep. See `DESIGN_SYSTEM.md` §4a, `/foundations/themes` and
`/patterns/industries` in the Showcase, and
`docs/audits/phase-2/2026-10-08-phase-2-community-edition.md` for what is done
and what is not.
