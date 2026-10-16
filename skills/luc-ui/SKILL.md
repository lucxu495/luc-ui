---
name: luc-ui
description: Find and use LUC UI public components, or maintain their tokens, motion, themes, charts and Showcase without breaking the design and package contract.
---

# LUC UI maintainer skill

Use this skill when selecting `@luc/ui` components or changing this repository. Its
discovery path is the generated catalog, the actual public barrel and a working
Showcase example. Component names and prop signatures are **not** maintained in
this skill.

## Component discovery before implementation

1. Search `docs/COMPONENT_CATALOG.md` for the need or symbol. The
   machine-readable `docs/component-catalog.json` records exact exports,
   import paths, TypeScript signatures and declaring files. Both are generated
   from `packages/ui/package.json` and public barrels by
   `packages/ui/scripts/generate-catalog.mjs`.
2. Follow its Showcase link, then inspect the actual component props and test.
   For Button use `@luc/ui/components/button` (`Button` is a native button;
   `buttonVariants` styles anchors); for DataTable use `@luc/ui/data-table`
   (native table); for chart sync use `ChartSyncGroup` from `@luc/ui/charts`;
   for resizable panes use `Workspace` from `@luc/ui/workspace`.
   Phase 5 families, all on the root barrel (fields also on `@luc/ui/forms`):
   `TreeView` · `FileUpload` · `ColorPicker` (+ `parseHexColor`, `readableInk`
   from `@luc/ui/utils`) · `TransferList` · `NotificationCenter` ·
   `GuidedTour` · `SortableList` · `KanbanBoard` · `ImageGallery` +
   `Lightbox` · `ImageCompare` · the AI surface (`ChatMessage`, `MessageList`,
   `StreamingText`, `PromptComposer`, `ToolCallTimeline`, `AgentActivity`).
   Chart additions live in `@luc/ui/charts`: `AutocorrelationChart`,
   `SurvivalCurveChart`, `PrecisionRecallChart`, `FeatureImportanceChart`,
   `ChordChart` + `chordLayout`, `DendrogramChart`, `ChoroplethChart`,
   `GeoTrajectoryChart` + `unwrapLongitudes`, `Surface3DChart`,
   `VolatilitySurfaceChart`.
   Phase 8 adds one subpath, `@luc/ui/experiences` — the layer-C assemblies a
   product page is made of: `ProfileHero` · `SocialLinks` · `ExperienceTimeline` ·
   `ProjectShowcase` · `PublicationList` · `ReadingShelf` · `NowSection`. Reach
   for these before hand-rolling a personal-site section; see
   `docs/EXPERIENCE_GUIDE.md` for the published/recipe boundary and for the
   recipes (pricing table, quiz, checkout stepper, instrument panel) that are
   deliberately *not* published. Sixteen working reference products, one per
   family, are at `/experiences` in the Showcase.
3. Two API conventions worth knowing before you write a call site:
   `ChatMessage` takes **`from`**, not `role` (a `role` prop on a component that
   renders a DOM element collides with the ARIA attribute and makes
   `eslint-plugin-jsx-a11y` report a false error in *your* code); and
   `data-space="flat|layered|deep"` on any subtree rescales the shared lift and
   press tokens, so depth is a consumer-side decision.
3. Read `docs/DEVELOPER_GUIDE.md` for provider/CSS/SSR setup, then the relevant
   specialist guide (`CHART_GUIDE.md`, `FORM_GUIDE.md`, `WORKSPACE_GUIDE.md`,
   etc.). Never deep-import `src` or `dist`.
4. Decide whether the need is a composition, a variant of an existing primitive,
   or genuinely new generic UI. Keep product routes, analytics, financial
   calculations and domain narratives outside `@luc/ui`.
5. Verify the affected layer: `pnpm --filter @luc/ui catalog:check`, focused
   unit test, `pnpm verify` for package changes, and `pnpm qa:changed` or a
   targeted browser group for visuals. A release-wide QA run is a freeze gate.

## Required startup sequence

1. Read `DESIGN_SYSTEM.md` completely. It is the contract.
2. Read `AI_DESIGN_GUIDE.md` for the concrete do/don't table.
3. Read the showcase page for the component you are about to change (in
   `apps/showcase/app/`). The showcase is executable documentation.
4. Inspect the component source in `packages/ui/src/`.
5. Check `docs/sources/source-registry.md` before copying any idea from another
   project, and `docs/research/license-matrix.md` before copying any source.

Do not start editing before step 4. Most mistakes in this repository come from
re-implementing something the system already has.

## Work loop

```
read DESIGN_SYSTEM.md
  -> read the relevant showcase page
  -> read the component + its test
  -> decide: reuse / extend / new component
  -> edit tokens first if a value is missing
  -> edit component + test + showcase page together
  -> run typecheck, lint, test, build
  -> run the visual QA and actually look at the screenshots
  -> update docs (DESIGN_SYSTEM.md, source registry) if the system changed
```

## Choosing the right move

| Situation | Do this |
| --- | --- |
| An existing component nearly fits | Add a variant or prop to it. |
| A value is missing | Add a token (light **and** dark) and document it. |
| A page needs local styling | It almost certainly needs a token or a component instead. |
| A new feel is wanted | Design it as a component in `@luc/ui`, document it, show it. |
| An upstream has a nice effect | Classify it in the source registry first, then implement it LUC-native. |
| A new chart is needed | Read `docs/CHART_GUIDE.md` §3 first — the shape usually already exists as a property of an existing family. |

## Charts (V0.2)

Read `docs/CHART_GUIDE.md` before touching anything under
`packages/ui/src/charts/`. The short version:

- **Pick the family before the component.** Time series → line/area. Categories →
  bar. Distribution → histogram/box plot. Relationship → scatter/bubble. Matrix →
  heatmap/correlation/calendar. Part-to-whole → donut only with a real whole and
  six or fewer parts. Price → `FinancialChart`.
- **The engine never leaks.** Only `charts/adapters/**` may import ECharts or
  Lightweight Charts. Everything else goes through a spec or a family component.
  `extendOption` and `onReady` are the documented escape hatches — do not add a
  third.
- **Never accept an engine default.** Tooltips go through `tooltipShell()` and the
  `luc-chart-tooltip` markup. Candle colours, crosshair, panes and price scales
  come from the resolved theme, not from the library's defaults.
- **No analytics.** SMA, RSI, MACD, drawdown, correlations, bins and outliers are
  prepared by the caller. Mock generators in the Showcase may compute them for
  demos; production components may not.
- **No silent decimation.** If a series needs thinning, the data layer thins it.
- **Colour comes from tokens.** `tone`, then `palette`, then the palette index. A
  categorical series must never be used to mean "up"; `positive`/`negative` are a
  separate axis.
- **Reduced motion.** `useChartMotion` zeroes intro and update durations. Charts
  keep working; they just stop travelling.
- **Loading, empty and error never initialise an engine.** `ChartSurface`
  resolves the state first.
- **A theme flip must not remount a chart.** Rebuild the option and re-apply it;
  never re-create the instance.
- **Keep the Lightweight Charts attribution visible.** `attributionLogo` stays on.

### Adding a chart family

```
packages/ui/src/charts/components/<family>-chart.tsx   component
packages/ui/src/charts/index.ts                        export
packages/ui/src/charts/components/chart.test.tsx       behaviour (states, legend)
apps/showcase/app/charts/<family>/page.tsx             demo page
apps/showcase/lib/navigation.ts                        nav entry
apps/showcase/qa/routes.mjs                           route + capture variants
docs/CHART_GUIDE.md §3                                 selection rule
docs/sources/source-registry.md                        provenance row
```

### Adding an annotation or a token

Annotations are data (`AnnotationSpec`), so a new kind is a type change plus a
case in `adapters/echarts/marks.ts`. Chart tokens go in `tokens.css` under both
`:root` and `.dark`, and are documented in `DESIGN_SYSTEM.md` §5.

## Data, selection and feedback (V0.3)

### Choosing the component

| Need | Use | Never |
| --- | --- | --- |
| A few known options | `Select` | Navigation, or a list you have to search |
| Search, then choose | `Combobox` | Running an action |
| Run something | `CommandMenu` | Choosing a field value |
| Multi-select a dimension | `FacetFilter` (`filterFn: "arrHas"`) | Single-choice semantics |
| Rows, columns, sorting | `DataTable` | A hand-rolled `<table>` |
| Thousands of rows | `VirtualDataTable` | Virtualising a 20-row table |
| Feedback | `toast.success(...)` | A bespoke banner |
| A side panel | `Sheet` | A drag gesture or a grab handle |

### DataTable rules

1. **Format, never compute.** Columns render prepared values; the table never
   derives a metric and never converts a unit.
2. **Columns carry the semantics.** `numericColumn` right-aligns and applies
   tabular figures; `tone: "signed"` uses the semantic tokens; `null`/`NaN`
   render an em dash.
3. **Control the state you need to control.** Pass `sorting` + `onSortingChange`
   (or pagination/filters/selection) and the table stops owning that slice —
   this is the server-side path, and the table never fetches.
4. **Virtualise only the body**, only above a few hundred rows, and keep real
   `<tr>` elements. `rowHeight` must match the rendered row.
5. **Sticky and pinned cells are opaque** in every state.
6. **The toolbar and the footer are slots.** Compose `DataTableToolbar`,
   `FacetFilter`, `ColumnVisibilityMenu`, `DataTableSelectionCount` and
   `DataTablePagination`; do not invent a second filter chrome.
7. **`sortDescFirst` is `false` by default** so the first click means the same
   thing on every column type. Override per column only with a reason.
8. **A facet column without `filterFn: "arrHas"` silently matches nothing.**
   `arrIncludesSome` is for array-valued cells.

### Overlay and feedback rules

1. **Text surfaces are opaque.** No backdrop-blur-only panels; blur is an
   enhancement, never the readability mechanism.
2. **Use the `z.*` layer table** in `DESIGN_SYSTEM.md` §8b. No literal z-index.
3. **A scrolling container with sticky or floating children gets
   `isolation: isolate`.**
4. **Combobox owns a query, not the DOM text.** React writing `value` back to
   the field drops keystrokes when two arrive in one batch; the browser owns the
   text and React writes it only on select/clear/caller change.
5. **Sonner keeps its behaviour; LUC owns the skin** in `styles/toast.css`,
   written against `.luc-toaster` so it wins on specificity rather than order.
6. **Never install a second engine for a capability we already have** — one
   primitive stack (Radix), one toast library, one command-menu library.

### Charts and accessibility

Pair a chart with `ChartDataTable` behind a `ChartDataViewToggle`, and pass the
legend-visible series. That is the honest answer to "canvas has no text" — it is
opt-in, it is not a CSV export, and it does not fix the canvas itself.

### Adding a table page

```
apps/showcase/components/tables/<name>-columns.tsx   shared column set
apps/showcase/lib/<name>-data.ts                     deterministic demo rows
apps/showcase/app/data/<name>/page.tsx               table page
apps/showcase/app/patterns/<name>/page.tsx           composition page
apps/showcase/lib/navigation.ts                      nav entry
apps/showcase/qa/routes.mjs                         route + capture variants
docs/sources/source-registry.md                      provenance row
```

## Forms and date/time (V0.4)

Read `docs/FORM_GUIDE.md` before touching anything with a `<form>` in it, and
`docs/DATE_TIME_GUIDE.md` before touching a date.

### Choosing the component

| Need | Use | Never |
| --- | --- | --- |
| A form | `Form` + `Field` + `SubmitButton` | Wiring ids and `aria-describedby` by hand |
| Field state | `Field` (`error`, `validating`, `success`, `description`) | A second message stack |
| Repeating rows | `FieldArray` + the engine's array | Drag-and-drop, or a bespoke list |
| A known date | `DatePicker` (`CalendarDate`) | `new Date("YYYY-MM-DD")` |
| A period | `DateRangePicker` (`{ start, end }`) | A timestamp pair, or 23:59:59 |
| A wall clock | `TimePicker` (`Time`) | A time with an implied zone |
| A moment in a zone | `ZonedDateTimePicker` | A local time plus a hidden zone |
| A number | `NumberInput` | A text input with `parseFloat` |
| A percentage | `PercentageInput scale=…` | An ambiguous 0.12 |
| A code | `OtpInput` | Six separate inputs |
| Files | `FileInput` / `DropZone` | A component that uploads |

### Form rules

1. **LUC owns presentation, the product owns values.** React Hook Form gets a
   bridge at `@luc/ui/forms/react-hook-form`; TanStack Form composes with `Field`
   directly. Never add a second adapter without removing the first.
2. **One message at a time**: error, then validating, then success, then
   description.
3. **Required** is one accent asterisk plus the `required` attribute.
4. **A failed submit** produces `FormErrorSummary`; a toast is never the only
   signal.
5. **Numbers commit on blur/Enter**, and a `step` is a decision: it snaps typed
   input onto the grid.
6. **Never dim a field with `opacity`.** It drops the label, message and chips
   below 4.5:1, and it fires when any descendant is disabled.

### Date and time rules

1. **Four kinds, four types**: `CalendarDate`, `Time`, `CalendarDateTime`,
   `ZonedDateTime`. `Date` is an instant and appears only in
   `dateOnlyFromInstant(instant, timeZone)`.
2. **Never `new Date("YYYY-MM-DD")`**, and never format inline — use
   `formatDateOnly` / `formatDateRange` / `formatTimeValue`.
3. **Pass `locale` explicitly** so server and client agree; that is also what
   `LocaleProvider` is for.
4. **Inject `todayValue`** in demos and tests, and never render a live clock
   during SSR.
5. **`Intl.formatRange` is not portable** between Node and the browser; the LUC
   helpers build range strings from two single formats.
6. **Presets are consumer data**, and the active preset is derived from the
   value.

### Adding a form or date component

```
packages/ui/src/forms/…            or packages/ui/src/datetime/…
packages/ui/src/forms/index.ts     export
<component>.test.tsx               behaviour tests (states, keyboard, semantics)
apps/showcase/app/…/page.tsx       demo page (variants, sizes, states, both themes)
apps/showcase/lib/navigation.ts    nav entry
apps/showcase/qa/routes.mjs          route; qa/behaviour.mjs behaviour check
docs/FORM_GUIDE.md | docs/DATE_TIME_GUIDE.md   the contract
docs/sources/source-registry.md    provenance row
```

## Applications (V0.5)

Read `docs/APP_SHELL_GUIDE.md` before building a frame,
`docs/NAVIGATION_GUIDE.md` before a nav list, `docs/WORKSPACE_GUIDE.md` before a
split, `docs/URL_STATE_GUIDE.md` before putting anything in a URL, and
`docs/PACKAGING_GUIDE.md` before changing the package.

### Choosing the surface

| Need | Use | Never |
| --- | --- | --- |
| An application frame | `AppShell` + `Sidebar` + `AppShellTopbar` | Page-local shell CSS |
| A link that knows the route | `renderLink` on `AppShell` | Importing a router into `@luc/ui` |
| A page's identity | `PageHeader` (+ `Breadcrumbs`) | A hand-rolled heading block |
| Resizable regions | `Workspace` + `WorkspaceGroup` + `WorkspacePane` | `flex-1` divs, or a dashboard |
| Details for a selection | `InspectorPane` | A Sheet that unmounts the pane |
| Shareable state | A `param` set from `@luc/ui/url-state` | One JSON parameter, or React state alone |
| Remembered layout | `persistKey` / `sidebarPersistKey` | Pane sizes in the URL |
| One component | `@luc/ui/components/button` | A source path, or the barrel for one thing |

### Rules

1. **Routing is injected, never imported.** `pathname`, `renderLink`,
   `onNavigate`. A consumer without a router gets a real anchor.
2. **Three kinds of state, three homes.** Shareable to the URL, personal to
   local storage, ephemeral nowhere. The precedence is one-directional.
3. **A sidebar's scrolling region is the `nav` landmark**, and it has a name.
4. **The rail keeps the label in the DOM** and reveals it with a tooltip.
5. **A pane body is focusable**, and a separator keeps its `aria-valuenow` and
   arrow-key resizing.
6. **Sizes are versioned and validated**, keyed by the pane set.
7. **Escape has one owner per layer** and the page decides, not the library.
8. **`pnpm verify` includes the package gates**; a subpath import must stay
   isolated, and `pnpm test:consumer` is what proves it.

### Adding a shell, workspace or URL-state change

```
packages/ui/src/app-shell/… | workspace/… | url-state/…
packages/ui/src/<module>/index.ts        export
<component>.test.tsx                     behaviour tests (landmarks, keys, URL)
apps/showcase/app/application/…/page.tsx demo page
apps/showcase/lib/navigation.ts          nav entry
apps/showcase/qa/routes.mjs + qa/behaviour.mjs  route + behaviour check
docs/APP_SHELL_GUIDE.md | NAVIGATION_GUIDE.md | WORKSPACE_GUIDE.md | URL_STATE_GUIDE.md
docs/sources/source-registry.md          provenance row
```

## Integrations (V0.6)

Read `docs/TRADINGVIEW_GUIDE.md` before touching anything under
`packages/ui/src/integrations/`, and
`docs/research/v0.6-tradingview-policy-audit.md` before changing a prop, a URL or
an attribution.

### Choosing the lane

| Need | Use | Never |
| --- | --- | --- |
| Provider market data, standard market views | `@luc/ui/tradingview` | Re-implementing it with our engines |
| Our prepared OHLC | `@luc/ui/charts` → `FinancialChart` | Feeding provider values into it |
| Our analytics | `@luc/ui/charts` research families | Live quotes |
| A new widget | A typed wrapper + a registry row | A raw snippet pasted into a page |

### Rules

1. **The registry is the source.** Format, official URL, attribute encodings,
   size floor and legacy relationships live in `core/catalog.ts`. A wrapper reads
   it; it does not restate it.
2. **Two formats, two depths.** Web Components take `theme` + published CSS
   custom properties. iframe widgets take the provider's config keys only.
3. **Only symbol links move.** `symbol-url` / `tv-link-open`. Attribution is
   reproduced verbatim and never covered.
4. **Closed unions for closed sets.** The provider throws on an unknown
   `region`/`metric`; type it, do not "validate later".
5. **No provider code in the repo.** Loader URLs come from the registry, the
   allow-list accepts three hosts, and nothing is self-hosted.
6. **The integration is its own entry point.** `pnpm test:consumer` asserts that
   a button-only bundle contains none of it.

### Adding a widget

```
packages/ui/src/integrations/tradingview/core/catalog.ts        registry row
packages/ui/src/integrations/tradingview/widgets/<category>.tsx typed wrapper
packages/ui/src/integrations/tradingview/widgets/index.ts       export
apps/showcase/app/integrations/tradingview/<category>/page.tsx  live preview
apps/showcase/qa/routes.mjs                                    route + a check
docs/TRADINGVIEW_GUIDE.md                                       the contract
docs/research/v0.6-tradingview-policy-audit.md                  the catalog + policy
```

## Final primitives and the V1 freeze

> **V4.0 note (2026-10-08).** The freeze below still governs *process*: land the
> component, its test and its Showcase page together, and record the public
> change. Phase 4 added seventeen component families and thirty-five chart
> types anyway, because the user explicitly asked for breadth — so read the next
> two sections before adding anything else.

## Spatial design language (V4.0)

Every surface in the library now names its **layer** instead of choosing a
shadow. Before touching a component's elevation, read `DESIGN_SYSTEM.md` §8.7.

### The rungs

| Class | Token | Use for |
| --- | --- | --- |
| `luc-rest` / `shadow-rest` | `--elevation-rest` | A resting interactive surface: a card, a button, a row. |
| `luc-hover` / `shadow-hover` | `--elevation-hover` | The same surface answering a pointer or a roving focus. |
| `luc-float` | `--layer-2-shadow` | A floating overlay: menus, popovers, tooltips, a combobox list. |
| `luc-float-high` | `--layer-3-shadow` | The highest layer: dialog, sheet, command palette. |
| `luc-well` / `shadow-well` | `--well-shadow` | A surface content sits *inside*: fields, progress tracks, segmented and tab tracks, a pressed toggle. |

### Rules

1. **Never write `shadow-sm` / `shadow-md` / `shadow-lg` by hand again.** They
   are Tailwind's ladder, not LUC's; a component that reaches for them reads as a
   different design system. If a new surface needs a rung, use one of the five.
2. **Travel comes from tokens.** Hover lift is
   `translateY(calc(-1 * var(--spatial-lift)))`; press is
   `translateY(var(--spatial-sink)) scale(var(--spatial-press-scale))` (the
   `luc-lift` and `luc-press` utilities already do this). A hard-coded `1px` or
   `0.985` is a defect: it ignores the personality and `data-space`.
3. **A field is a well; a button is a surface.** That single distinction is what
   stops a form row from reading as a row of buttons. Do not give an input a
   resting elevation rung.
4. **A dense row moves least.** A `DataTable` row takes the surface step plus
   `shadow-xs` and no travel — a row that moved would break column alignment for
   the whole row.
5. **`data-space` is the only depth control.** `flat` (0), `layered` (1),
   `deep` (1.6) scale a subtree. Do not add a per-component depth prop; if a
   surface needs to opt out of travel, put it in a `data-space="flat"` subtree.
6. **Reduced motion keeps the end state.** Nothing may depend on the travel for
   meaning, and nothing may be dimmed or hidden to compensate for it.

## Phase 4 component additions

| Need | Use |
| --- | --- |
| Sections that open and close | `Accordion` / `AccordionItem`; `Collapsible` for one region |
| Confirming something irreversible | `AlertDialog` — never a `Dialog` with a flag, never `toast()` |
| Page navigation over a known total | `Pagination` + `PaginationSummary`. `DataTablePagination` stays the table's own binding |
| A themed scroll region | `ScrollArea`. Do not reach for `overflow-auto` in an overlay |
| Independent on/off controls | `Toggle` / `ToggleGroup` (multiple) or `ToggleGroup` (single, a radiogroup) |
| One value from N, with a sliding indicator | `SegmentedControl` — the two are *not* interchangeable |
| Identity for a person, team or agent | `Avatar` / `AvatarGroup`. `name` drives both the label and the tint |
| Actions that belong together | `ButtonGroup`; add `Toolbar` when the strip needs one tab stop |
| A field with a prefix/suffix | `InputGroup` + `InputGroupAddon` |
| A preview with content and actions | `HoverCard` (a Tooltip only labels) |
| The platform picker (mobile) | `NativeSelect` |
| A dated sequence / progress | `Timeline` / `Stepper` |
| A media rail | `Carousel` — dependency-free, on native `scroll-snap` |
| A score on a scale | `Rating`; read-only renders as `role="img"` |

Two traps worth naming: `Avatar`'s tint must stay **deterministic** (a random
colour moves when a list re-sorts), and `Carousel` must keep its track focusable
with `role="region"` and a label — a keyboard user cannot drag a rail.

## Adding a chart family (V4.0)

Read `docs/CHART_GUIDE.md` §21 first. The checklist when adding one:

1. **Register the engine module** in `adapters/echarts/runtime.ts` (series *and*
   any component the series needs — an unregistered one is a silent no-op that
   still passes tests).
2. **Take prepared data only.** If the chart would bin, smooth, fit, difference
   or optimise, stop: that belongs upstream.
3. **Name any display transform** in the component's JSDoc, and keep the tooltip
   reporting the caller's numbers.
4. **Draw geometric marks with a `custom` series**, not one DOM node per datum.
5. **Route the empty input to `ChartEmptyState`** with copy that names what was
   missing.
6. **Deterministic fixtures only.** A Showcase fixture is generated from a fixed
   seed at module load; `Math.random()` in a fixture is a hydration mismatch.
   Fixture code runs at **module evaluation**, so a bug there is a 500 on the
   whole route rather than a broken chart — guard every index before reading it.
7. **Update `/charts/catalog`** with the new type and its status.

V1.0 closed the surface. New families are no longer added for completeness; a
family is added when a real product needs it and the inventory says nothing
existing covers the job.

### Choosing the component

| Need | Use |
| --- | --- |
| A continuous value (threshold, lookback, weight, opacity) | `Slider` from `@luc/ui/slider`. A pair → `RangeSlider`. |
| An exact value the user must type | `NumberInput` / `CurrencyInput` / `PercentageInput`. Never a slider. |
| Actions or options attached to a trigger | `DropdownMenu` from `@luc/ui/dropdown-menu`. |
| The same actions attached to an object (row, chart, cell) | `ContextMenu` from `@luc/ui/context-menu`. |
| A value the form owns | `Select` or `Combobox`. A menu is not a form field. |
| Global navigation/search | `CommandMenu`. |
| A status message about something that happened | `Alert` from `@luc/ui/alert`. |
| Persistent context next to the thing it explains | `Callout` (same module), which is quieter and never a live region. |
| A field-level error | `Field`'s `error`. Never an `Alert`. |
| A transient confirmation | `toast()`. |
| Nothing to show yet | `EmptyState` from `@luc/ui/empty-state`, unless the chart or DataTable family already provides a domain-specific one. |

### Rules for the new primitives

- `Slider` takes and returns a **number**; `RangeSlider` takes and returns a
  **sorted `[min, max]` tuple**. Never accept the primitive's raw array shape,
  never rescale a unit, and keep `formatValue` display-only.
- Every slider thumb needs a name: a single thumb inherits the `Field` label, a
  range needs `label` or `thumbLabels`.
- A disabled slider changes colour, never the whole control's opacity.
- Menus are opaque and dense (`py-1.5`, `text-label`). A destructive row is a
  negative label, not a filled red row — the click has not happened yet.
- Alert and Callout are silent (`live="off"`) by default. Use `"polite"` for a
  status that appears after mount and `"assertive"` only for something the
  reader must act on. Never force a live role on static content.
- `EmptyState` has no live region, and its `titleAs` selects a real heading
  level rather than inventing one.
- `ChartInspectionArea` is the keyboard path over prepared x values. It is an
  enhancement; `ChartDataTable` stays the complete semantic fallback.

### Freeze rules

- Public API changes go in `docs/PUBLIC_API.md` and `CHANGELOG.md` in the same
  change, and a breaking one also needs `MIGRATION_V1.md` (or its successor).
- A new public subpath needs three edits, always together: `package.json`
  `exports`, `publishConfig.exports`, and `tsdown.config.mjs`.
- A token whose value or meaning changes updates `LUC_UI_TOKEN_VERSION` /
  `--luc-token-version` only when the schema changes, and is recorded in
  `docs/V1_TOKEN_AUDIT.md`.
- Run `pnpm verify:package` after any entry-point or bundle change; the consumer
  test fails when an entry grows more than 8% (or 1 KB) over
  `packages/ui/bundle-baseline.json`. Regenerate deliberately with
  `LUC_UPDATE_BASELINE=1` and say why.

## Spatial motion (V3.0)

Six families, one export each, all reading the same resolved intensity profile
as everything else in `@luc/ui/motion`. Before inventing a seventh, read
`docs/MOTION_GUIDE.md` §"V3.0 — spatial motion"; the anti-patterns at the end of
that section are the ones this codebase has already paid for.

| Family | Reach for | Do not |
| --- | --- | --- |
| Depth & materials | `ParallaxScene` + `ParallaxLayer` (depth bus in custom properties), `TiltSurface material="glass"`, `luc-glass` | Move a layer that carries text; the scene's content layer stays at `depth={0}` |
| Geometry | `OrbitField` + ring/node/core | Build a second rotation engine; rings are CSS on the compositor and rest on hover/focus |
| Continuity | `ExpandableSurface` (+ `Trigger` / `Content` / `Close`) | Reach for a modal to reveal detail that belongs in the flow |
| Kinetic type | `KineticHeadline` | Split text per character, or render two copies into the accessibility tree |
| Depth navigation | `CardStack` + `CardStackItem` + `CardStackControls` | Add a `controls` boolean — compose the controls slot instead |
| Linked data | `SelectionBeam` (two refs + `revision`) | Teach it about tables or charts; it takes refs and nothing else |

Three rules that are easy to get wrong and are already covered by tests:

1. **Counter-rotation.** A ring with `direction="reverse"` runs a *rotating*
   keyframe set backwards, so its angle is `-360t/T` and its labels need the
   **forward** keyframe set. Use the `counterClass` logic in
   `motion/orbit-field.tsx`, never `animation-direction: reverse` on the label.
2. **Ring radius** is a percentage of the field's **width**: `50` is the largest
   ring that fits; anything above overflows on purpose.
3. **Glass stacks badly.** Overlapping translucent surfaces show each other's
   text. `CardStack` refuses the material on purpose.

Budgets: the whole V3.0 surface costs **+6.2 KB raw / +2.2 KB gzip** for the
one-primitive `@luc/ui/motion` consumer, and there is no new dependency. If a
new spatial effect cannot be expressed as `transform`/`opacity` with no React
render per pointer frame, it is not ready.

## Hard rules



- Never introduce a raw colour, radius, shadow, duration, easing or z-index
  inside a component. Tokens only.
- Never use `text-fg-disabled` for content a user must read.
- Never let a passive surface carry a glow.
- Never leave an effect without its reduced-motion path in the same commit.
- Never copy source from an `MIT + Commons Clause` project (Animate UI, React
  Bits) or from paid content.
- Never import from another product's repository (`luc-visuals`, `luc-quant`),
  ClickHouse, analytics or backend code. This repository is the library: anything
  that is not `@luc/ui` and its own Showcase does not belong in it.
- Never add a second icon family, a CSS-in-JS runtime, or a component library as
  a base.
- Never add a dependency to `packages/ui` that is not in its published peer or
dependency set: the package is consumed as a build, and a missing peer is a
broken install for everyone downstream.
- Never let a chart component import an engine outside `charts/adapters/**`, and
  never let a chart compute an indicator.
- Never disable the Lightweight Charts attribution logo.
- Never make a table fetch, compute a metric, or silently convert units.
- Never ship a translucent surface that carries text, and never let a sticky or
  pinned table cell show scrolled content through it.
- Never wire a `Select` to navigation or use a `CommandMenu` as a form field.
- Never virtualise a table that fits on one screen.
- Never install a second primitive stack, toast library or command-menu engine.
- Never install a second form engine or date system, and never make
  `@luc/ui` import a validation library.
- Never parse a date-only value with `new Date(...)`, and never render a clock
  during server rendering.
- Never use `opacity` to dim a field, and never use a toast as the only signal
  that a form failed.
- Never write page-local shell CSS, a second sidebar, or a second drawer.
- Never import a router inside `@luc/ui`, and never import `@luc/ui/src/...`
  from a product.
- Never put pane sizes, hover state or open menus in the URL, and never encode a
  view as one JSON parameter.
- Never invent a `z-index`; use the `z.*` layer table.
- Never make every app a resizable research terminal. Most pages are a page.
- Never scrape a TradingView widget, read its closed shadow DOM, or treat
  provider content as a data source. Never cover or recolour its attribution.
- Never pass a script URL from props into the loader, and never wrap a legacy
  embed that `TRADINGVIEW_LEGACY_EMBEDS` marks as replaced.
- Never let a chart's marks appear only on hover, and never hide matrix labels
  without the documented `labelMode` policy.
- Never rename a semantic token to match a Tailwind utility name (or the
  reverse). `--elevation-*` is the value, `shadow-*` is the utility; the bridge
  in `tokens.css` is what connects them.
- Never add a live role to static content, and never let a new message component
  announce itself by default.
- Never use a menu to pick a value a form owns, and never use a slider for a
  value that must be typed exactly.
- Never replace a domain empty state with the generic `EmptyState` purely for
  reuse.
- Never add a component family that the inventory classifies as deferred without
  reporting it first.

## Verification

### The two checks that now fail the build (V6.0)

`pnpm verify` runs both, so a change that breaks either cannot ship:

```bash
pnpm --filter @luc/showcase i18n:check      # node scripts/i18n-coverage.mjs
pnpm --filter @luc/showcase catalog:charts  # node scripts/chart-catalog.mjs
```

**`i18n:check`** walks every `.tsx`/`.ts` under `app/`, `components/` and `lib/`,
extracts each translatable sentence with the contract in
`scripts/i18n-prose.mjs`, and fails when one has no entry in
`lib/i18n/prose.zh.ts`. It also fails on a duplicate key and on a translation
whose English source exists nowhere. Consequences worth knowing:

* a new page starts red until its sentences are translated — that is the point,
  and it is cheaper than a review that finds the leak later;
* prose in a module-level array (`{ title: …, body: … }`) is prose too;
* a sentence behind a **new** prop name is invisible until that name is in
  `DATA_PROSE_KEYS` or `COPY_ATTRS`;
* `tcs("…")` is the wrapper. Wrap at the render site when the value comes from a
  module-level constant the codemod cannot reach, and use `tn(...)` for
  navigation labels (they are keyed by source in `navZh`).

**`catalog:charts`** loads `components/charts/chart-catalog-data.ts`, resolves
every `symbol` against the real exports of `@luc/ui/charts`, and fails on a
duplicate id, a planned/blocked row that names a component, or a composite that
does not name two. Adding a chart means adding a registry entry (`id`, `kind`,
`status`, `engine`) and letting the script report the new count — never editing a
number in prose.

**`qa/i18n-live.mjs`** is the renderer-side check: it loads `/zh<route>` for every
route in the QA registry and reports visible English prose. Run it against the
deployed container after a deploy
(`LUC_QA_BASE_URL=http://127.0.0.1:3000 node qa/i18n-live.mjs`). Its allow-list
at the top of the file is where a deliberate English default belongs, with a
reason.

```bash
cd luc-ui
pnpm verify                            # ~1.5 min: typecheck + lint + unit tests + package gates
pnpm qa:changed                        # ~1 min: only the routes your diff can reach
pnpm qa:behaviour -- --group=primitives # ~25 s: one behaviour group
pnpm qa:full                           # ~5 min: all 91 routes + all 71 behaviour checks
pnpm qa:providers                      # ~20 s: live TradingView smoke
pnpm qa:baseline                       # ~26 s: 15 pixel-diff baselines
pnpm qa:release                        # ~8 min: everything, once, at a freeze
```

Every QA command starts the Showcase container itself (rebuilding the image only
when the hashed inputs changed) and waits until it answers. There is no manual
build/start step, and no `networkidle`.

**Rules.**

1. Never run `qa:release` or `qa:full` after an ordinary edit.
2. While iterating: `pnpm verify`, then `pnpm qa:changed` or a targeted
   `--routes=` / `--group=`.
3. Freeze the code before a full/release run; never edit while it runs.
4. Never wait for third-party network idle — provider readiness is
   `data-luc-tv-status`, and only after scrolling the widget into view.
5. Read `artifacts/qa-report.json` timings before theorising about slowness.
6. The host `next build` does not work here; the Docker path in `qa:*` is the
   supported one, and it is bounded.

The QA run must report: 0 axe violations, all behaviour checks passing, and no
console errors. Then open a few screenshots in `artifacts/screenshots/`
— a green run is not the same as a good-looking run.

Full detail: `docs/QA_WORKFLOW.md`.

## Documentation obligations

Update in the **same change**:

- `DESIGN_SYSTEM.md` — when a rule, token or component contract changes.
- `docs/sources/source-registry.md` — when a component's provenance changes.
- `docs/research/license-matrix.md` and `dependency-decisions.md` — when a
  dependency is added or reclassified.
- The showcase page — always, for any component work.
- `apps/showcase/qa/routes.mjs` — when a route is added; add a behaviour
  assertion in `apps/showcase/qa/behaviour.mjs` when the route has one.
- `docs/QA_WORKFLOW.md` — when a QA tier, readiness rule or artifact path
  changes.
- `docs/COMPONENT_INVENTORY.md` and `docs/PUBLIC_API.md` — when a public family
  or subpath is added, moved or frozen.
- `CHANGELOG.md` — for any user-visible change; `docs/PUBLIC_API.md` and, if
  consumers must edit code, `MIGRATION_V1.md` for a breaking one.
- `docs/V1_API_AUDIT.md` / `docs/V1_TOKEN_AUDIT.md` — when a convention or a
  token changes meaning.

## Common mistakes seen in this repository

0. **Assuming a provider icon's own `width`/`height` will respect your slot.**
   Remix Icon ships `width="24"`, and an `<svg>` is an inline box on the text
   baseline: a slot that only sets `size-4` on itself renders a 24px glyph 4px
   low. Put the size on the slot and constrain the glyph (`[&_svg]:size-full`).


1. **Assuming `tailwind-merge` understands our type scale.** It does not by
   default; `text-label` looks like a colour and silently drops real colour
   classes. See `packages/ui/src/utils/cn.ts` and its test.
2. **Making a selected surface translucent.** Effect layers behind a card then
   bleed through it. Use `surface-selected`.
3. **Hiding content behind a scroll animation.** `Reveal` renders visible by
   default and only animates from a hidden state once JavaScript confirms the
   element starts below the fold.
4. **Adding a `<Tooltip>` without a provider.** Use `LucProvider` (or
   `TooltipProvider`) at the app root.
5. **Putting an `<a>` inside a `<button>`.** Style the link with the exported
   `buttonVariants` recipe instead.
6. **Leaving a `<Select>` trigger without a name.** The `Field` label binds to
   the trigger through its `id`; a trigger used outside a `Field` needs an
   `aria-label`. axe reports this as a critical defect and it is not stylistic.
7. **Styling engine HTML with a bare child selector.** `.luc-chart-tooltip-shell
   > div` matched our own tooltip panel and zeroed its background, which is how
   the V0.2 tooltip shipped see-through. Reset the shell, never the payload.
8. **Controlling a combobox's DOM value from state.** Two keystrokes in one
   React batch drop a character. Let the browser own the text; write to it only
   on select, clear, or a caller-driven change.
9. **Fighting an upstream stylesheet with `!important`.** Sonner is themed
   through its CSS variables (`--normal-bg`, `--normal-text`, …), and our rules
   are scoped with `.luc-toaster` so they win on specificity.
10. **Assuming TanStack v9 is v8.** `VisibilityState` is `ColumnVisibilityState`,
    pinning is `start`/`end` not `left`/`right`, `useTable` takes a `features`
    object from `tableFeatures()`, and the row selection state is a map of
    present-`true` keys. Read `node_modules/@tanstack/table-core/dist` before
    guessing.
11. **Hiding a panel with a class.** `react-resizable-panels` sets `display:
    flex` inline on its roots, so a pane cannot be hidden or re-flowed; change
    the composition instead (that is what `Workspace`'s stacked and focus modes
    do).
12. **Putting `flex-1` on a bounded workspace.** `flex-1` means `flex-basis: 0`,
    which silently beats an explicit `h-[30rem]`. Use `flex-1` only when the
    parent really is a bounded flex column (the shell's content area is).
13. **Writing defaults into the URL.** `clearOnDefault` and the codecs omit
    them; if a parameter shows up in a "default" link, the default is wrong.
14. **One `Sidebar` per shell with a second `<nav>`.** The scrolling region is
    the landmark; a second one gives a screen reader two navs with one name.
15. **Reading `localStorage` during render** to avoid a one-frame settle. The
    cost is a hydration mismatch on every page — a bug, not a trade.

## Definition of done

- Component, test and showcase page land together.
- Dark and light screenshots hold up; no glow creep, no second accent, no
  layout shift.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
- Visual QA: 0 violations, all behaviour checks pass.
- Docs updated; provenance recorded.
