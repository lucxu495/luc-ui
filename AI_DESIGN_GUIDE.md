# LUC UI — guide for AI coding agents

You are adding to a design system, not to a page. The goal is that a reviewer
cannot tell which session wrote which component.

## Ground rules

1. **Read before you write.** `DESIGN_SYSTEM.md` → the relevant showcase page →
   the component source. The showcase pages are executable documentation.
2. **Tokens before values.** If you need a value that does not exist, add a token
   to `packages/ui/src/tokens/tokens.css` (both themes) and document it.
3. **Compose, do not wrap.** A new component must add visual identity, API
   consistency, accessibility policy, theming, motion or composition. Wrapping
   Radix for a nicer name is not a component.
4. **Change the system, then the page.** If a page needs a new shadow, the
   answer is a token and a rule — never a page-local class string.

## Concrete rules

These replace vague instructions like "make it premium" or "use subtle spacing".

| Instead of | Do this |
| --- | --- |
| "Make it premium." | Passive cards have no persistent glow. Only the selected card carries `glow.subtle`. |
| "Use subtle spacing." | Use the 4pt scale utilities (`p-3`, `gap-2`). Justify any new step in the PR. |
| "Use elegant animation." | Functional transitions use `motion.fast`/`motion.normal`. No spring overshoot on analytical surfaces. |
| "Improve the contrast." | Pick a different token, not a lighter grey: `text-fg-muted` is 4.8:1 in light, `text-fg-disabled` is for disabled controls only. |
| "Round the corners a bit." | Use the radius for the role: controls `md`, cards `lg`, dialogs `xl`. |
| "Add a hover effect." | Interactive surfaces move exactly one border step and one elevation step, in `motion.fast`. |
| "Add a loading spinner." | Content and data use `Skeleton`; small actions use `Spinner`; measurable operations use `Progress`. |
| "Animate it in." | Wrap the *region* in `Reveal`. Never reveal text the user came to read. |
| "Add a chart." | Pick the family first (`docs/CHART_GUIDE.md` §3). A pie needs a real whole and ≤6 parts; anything else is a bar chart. |
| "Make the chart pretty." | Token colours, LUC tooltip markup, grid at `chart.grid`, tabular figures. An engine default theme is a bug. |
| "Add a moving average." | Pass it in as a prepared series. LUC UI components never compute an indicator. |
| "Show all the points." | Never decimate silently. If a series needs thinning, thin it in the data layer and say so. |
| "Add a dropdown." | Decide first: `Select` for a few known values, `Combobox` for search, `CommandMenu` for actions, `FacetFilter` for multi-select. |
| "Make the table sortable and filterable." | Use `DataTable` with `columns`, `toolbar` and `footer` slots. Do not hand-roll a `<table>`. |
| "Make it translucent like a modern menu." | Foreground surfaces are opaque. Translucency belongs on decorative shells only. |
| "Add a row action menu." | `Popover` + `Button`s for now. A full `ContextMenu` does not exist yet — do not fake one with `Select`. |
| "Show a toast." | `toast.success(...)`. Never a bespoke banner, never `alert()`. |
| "Open a drawer." | `Sheet`. It is a panel: no drag gesture, no grab handle. |
| "Fetch the rows in the table." | The table renders what you give it. Fetch in the page, pass `data` and controlled state. |
| "Add a form." | Compose `Form` + `Field` + `FieldSection`/`FieldGroup` + `SubmitButton`. Read `docs/FORM_GUIDE.md` before wiring state — LUC does not own values. |
| "Validate this field." | `Field error`, next to the control. A toast is never the only signal that a submit failed. |
| "Show a saving state." | `SubmitButton loadingText`. It keeps its width and stays in the tab order. |
| "Collect a percentage." | `PercentageInput scale="fraction" | "percent"` — the scale is required because 0.12 is ambiguous. |
| "Collect a number." | `NumberInput`. Do not set `step` unless the domain really is a grid: a step snaps typed input onto it. |
| "Collect a date." | `DatePicker` with `CalendarDate`. Never `new Date("2026-09-27")` — that is UTC midnight and reads as the previous day west of Greenwich. |
| "Collect a date and time." | `DateTimePicker` (local wall clock) or `ZonedDateTimePicker` (zone in the value). Pick one deliberately; never let the component guess. |
| "Collect a period." | `DateRangePicker` with consumer-defined `presets`. Both ends inclusive; no 23:59:59. |
| "Collect a time." | `TimePicker`. A time-only value has no date and no zone — if it needs one, that is a `ZonedDateTime`. |
| "Collect a code." | `OtpInput` inside a `Field`, so the code has a label and an error slot. |
| "Collect files." | `FileInput` for a row, `DropZone` when dragging is the point. Neither uploads — hand `File` objects to a callback. |
| "Collect tags." | `TagInput`; use `validate` for shape rules and let the message render under the field. |
| "Dim this disabled field." | Do not use `opacity` on a field: it drops the label, message and chips below 4.5:1. Disable the control's surface and value instead. |
| "Render today's date during SSR." | Inject `todayValue`, or read the clock in an effect. A server's "now" and a browser's are different instants. |
| "Build the app frame and a sidebar." | `AppShell` + `Sidebar` + `AppShellTopbar`. Never page-local shell CSS. |
| "Show the current location." | `Breadcrumbs` from a `{ label, href }[]`: it owns the landmark, the list and `aria-current`. |
| "Add a resizable split." | `Workspace` + `WorkspaceGroup` + `WorkspacePane` + `WorkspaceResizeHandle`. |
| "Show details for the selected row." | `InspectorPane`; it collapses to zero without unmounting. |
| "Wire the header to the URL." | A `param` set from `@luc/ui/url-state`, bound with `useUrlState` or the product's framework adapter. |
| "Remember the collapsed sidebar." | `sidebarPersistKey` on `AppShell`. Personal state is local, never in the URL. |
| "Put the period in the URL." | A `dateOnlyParam` pair (`from`, `to`), not a `range=1y` preset that drifts. |
| "Import one component." | `@luc/ui/components/button`, not a source path and not the whole barrel. |
| "Restyle a Button for this page." | Use a variant, or change the component. Consumer changes are layout only. |
| "Let the user drag a threshold." | `Slider` from `@luc/ui/slider`; `RangeSlider` for a pair. Never a styled `<input type=range>` and never a chart-library slider. |
| "Add row actions." | `DropdownMenu` from `@luc/ui/dropdown-menu`; the same actions on the object itself are `ContextMenu`. A menu runs actions — a value belongs to `Select` or `Combobox`. |
| "Show a page-level warning." | `Alert` (or `Callout` for a persistent explanation) from `@luc/ui/alert`. Field errors stay on the field; a toast is for the result of an action. |
| "Show an empty table/page/pane." | `EmptyState` from `@luc/ui/empty-state`, unless the chart or DataTable family already has a domain-specific one. |
| "Let me style one overlay." | Use `--elevation-*` for the shadow; `shadow-overlay` is already the token. Do not hard-code a box-shadow. |

## Before adding a component

Answer these five questions in the pull request:

1. What existing component is closest, and why is it not enough? Check
   `docs/COMPONENT_INVENTORY.md` first — if the family exists, use it; the
   inventory is the list an agent is expected to search before inventing.
2. Which tokens does it use? (If the answer is "a new one", add it properly.)
3. What are its states, and how is each one rendered?
4. What is its keyboard path and its accessible name?
5. What does it do under `prefers-reduced-motion`?

## Recipes

### Adding a component

```
packages/ui/src/components/<name>.tsx        implementation
packages/ui/src/components/<name>.test.tsx   behaviour tests
packages/ui/src/index.ts                     export
apps/showcase/app/components/<name>/page.tsx showcase page
docs/sources/source-registry.md              provenance row
```

### Adding a token

1. Pick the layer: core (theme-independent) or semantic (theme-dependent).
2. Add it to `light` **and** `dark`.
3. Bridge it in `@theme inline` if it needs a utility.
4. Document it in `DESIGN_SYSTEM.md`.
5. Add it to the relevant foundations showcase page.

### Adding a brand palette or a type voice

1. Copy an existing `[data-palette="…"]` block in `tokens.css` and keep the
   **lightness trajectory** — only hue and chroma move. Seven palettes generated
   from one recipe is what makes the set coherent.
2. Fill both the light block and the four-selector dark block; the light block
   must never be reachable from a dark root.
3. Do not touch the status colours. `positive` / `negative` / `warning` / `info`
   are meaning, not brand, and the token file deliberately offers no override.
4. Keep the accent hue clear of the status hues (26 / 66 / 156 / 252). `ember`
   sits ~18° from `warning`; say so where it is used.
5. Do not add derived tokens to the palette block — `--surface-selected`,
   `--line-accent`, `--glow-*`, `--calendar-*` and the chart accents are re-derived
   once in the shared `[data-palette]` block, which is what makes a scoped palette
   work on a subtree.
6. Run `pnpm --filter @luc/ui test src/tokens/palette-tokens.test.ts`. It computes
   contrast from the declared values; a palette that fails AA fails the test, and
   that is the point.
7. A type voice only re-points `--font-sans` / `--font-display` / `--font-mono`.
   Do not bundle a font the repository does not already ship — the preset exists
   to show the mechanism, and the family is the consumer's choice.

### Choosing a palette for a page

1. `data-palette` belongs on a **wrapper**, not on components:
   `<section data-palette="ember">`. One attribute, no props, no provider.
2. Scoping is the demonstration tool, not the default. A real product sets the
   palette once on `<html>`.
3. `data-palette`, `data-typeface`, `data-density` and `data-motion` compose
   freely — but do not mix two palettes in one view unless the point *is* the
   comparison.

### Adding a page to the Showcase

1. `apps/showcase/app/<section>/<page>/page.tsx`.
2. Add the route to `apps/showcase/lib/navigation.ts`.
3. Add it to the QA registry: an entry in `apps/showcase/qa/routes.mjs` with its
   `groups` (and a rule in `qa/route-map.mjs` if a source change should select
   it). A route that is not in the registry is not covered by any tier — that is
   how the Design Lab experiment went unreviewed for a whole cycle.
4. Compose from `@luc/ui` only. Page-local styling belongs in the system.

### Touching an effect (glow, spotlight, shimmer)

1. Read `packages/ui/src/hooks/use-spotlight.ts` — pointer work is rAF-throttled
   and writes CSS variables, never React state.
2. Keep the effect *behind* content, at single-digit alpha.
3. Provide the reduced-motion path in the same commit.
4. Re-run `pnpm --filter @luc/showcase qa:visual` and look at the screenshots.

### Adding a table column

```
textColumn("symbol", { header: "Symbol", locked: true, pin: "start" })
numericColumn("sharpe", { header: "Sharpe", decimals: 2, tone: "signed" })
percentColumn("cagr", { header: "CAGR", decimals: 1 })
statusColumn("status", { header: "Status", filterable: true, filterFn: "arrHas", map: toStatus })
```

1. The helper owns alignment, tabular figures, em-dash handling and tone.
2. `sortDescFirst` defaults to `false`, so the first click on any column sorts
   ascending. Override it per column only when the domain demands it.
3. A facet filter needs `filterable: true` **and** `filterFn: "arrHas"` on the
   column (scalar values). `arrIncludesSome` is for array-valued cells.
4. Never format inline. If a column needs a different shape, extend
   `docs`-documented helpers rather than writing `toFixed` in a page.

### Choosing the selection primitive

The four are not interchangeable, and blurring them is the most common mistake:

```
Select       few known options, no search    <Select>…</Select>
Combobox     search, then choose             <Combobox options={…} />
FacetFilter  multi-select a dimension        <FacetFilter columnId="status" />
CommandMenu  run something                   <CommandMenu>…</CommandMenu>
```

1. A `Select` must never navigate.
2. A `CommandMenu` must never be a form field.
3. Validate a facet column with `filterFn: "arrHas"` or the filter silently
   matches nothing.

### Overlay opacity and layering

1. Text surfaces are opaque (`surface-overlay`). No backdrop-blur-only panels.
2. Sticky and pinned table cells stay opaque in every state.
3. Use the `z.*` token that matches the layer; never a literal `z-index`.
4. If a new scrolling container hosts sticky or floating children, give it
   `isolation: isolate` so their internal indices stay inside it.

### Chart to table

When a chart's numbers matter beyond the plot, pair it with `ChartDataTable`
through a `ChartDataViewToggle`, and pass the *visible* series. Do not build a
second data path, do not recompute anything, and do not claim it fixes canvas
accessibility — see `docs/ACCESSIBILITY.md`.

### Forms

```
Form                    one submit lifecycle, one error summary
  Field                 label + description + one message slot
  Fieldset/FieldGroup   a group per question / a responsive field grid
  FormActions           the action row (sticky inside a Sheet)
  SubmitButton          reads the form status; holds its width
```

1. `@luc/ui` owns presentation; the product owns values. React Hook Form gets a
   bridge from `@luc/ui/forms/react-hook-form`; TanStack Form composes with
   `Field` directly (recipe in `docs/FORM_GUIDE.md`).
2. One message renders at a time: error → validating → success → description.
3. Required is marked with a single accent asterisk plus the `required`
   attribute. Never "(required)", never a red asterisk.
4. Numbers commit on blur or Enter; partial input is never reported as a value.
5. A field that is disabled dims its *control*, never its text.

### Dates and times

1. Date-only values are `CalendarDate`. `time.ts`/`datetime/format.ts` never
   build a `Date` from a date-only string.
2. A time-only value is `Time`; a local wall clock is `CalendarDateTime`; a
   zoned value is `ZonedDateTime`. `DateTimePicker` and `ZonedDateTimePicker`
   exist separately so the choice is explicit.
3. Ranges are inclusive at both ends. Business meaning belongs to the consumer.
4. Pass `locale` explicitly. Without it the server and the browser disagree and
   React reports a hydration mismatch.
5. Presets are consumer data (`{ id, label, range }`); the active preset is
   derived from the value.
6. Format through `formatDateOnly` / `formatDateRange` / `formatTimeValue`.
   `Intl.formatRange` is not portable between Node and the browser.

### Applications (V0.5)

```
AppShell              frame, sidebar column, topbar, status strip, skip link
  Sidebar             header / content (the nav landmark) / footer
  AppShellTopbar      mobile trigger, breadcrumbs, actions
Workspace             panes in JSX, sizes in local storage
  WorkspaceGroup      a split; nested groups live inside a pane
  InspectorPane       a detail pane that collapses to zero
```

1. `AppShell` takes slots, not a config object: `sidebar`, `topbar`, `statusBar`.
2. Routing is injected: `pathname`, `renderLink`, `onNavigate`. Nothing in
   `@luc/ui` imports a router.
3. Three kinds of state, three homes: shareable to the URL, personal to local
   storage, ephemeral nowhere.
4. A workspace is not a dashboard, and a pane body is focusable because it
   scrolls.

### Provider widgets (V0.6)

```
@luc/ui/tradingview
  TradingView*        27 typed wrappers (16 Web Components, 11 iframes)
  TRADINGVIEW_CATALOG the registry: format, official URL, min size, legacy map
  TRADINGVIEW_TOKEN_BRIDGE   LUC tokens → the provider's published CSS properties
  TradingViewWidgetFrame     optional titled surface; never overlaps the widget
```

| Need | Use | Never |
| --- | --- | --- |
| A standard market view on provider data | `@luc/ui/tradingview` | Re-building it with LUC's engines |
| Your data, your overlays | `@luc/ui/charts` → `FinancialChart` | Feeding provider content into it |
| A symbol click that stays on your site | `symbolUrl` template or `onSymbolNavigate` | Rewriting the attribution anchors |
| A provider option LUC does not model | `config` with a real comment | Passing a URL or an element name |

1. **A wrapper renders nothing until it is in view**, and never loads a provider
   script until then.
2. **Closed sets stay closed.** `region` and `metric` on the economic map are
   closed unions because the provider *throws* on an unknown value.
3. **Attribution is not yours to style.** The provider's copyright block is
   reproduced verbatim and nothing is placed over a widget box.
4. **Web Components are themed through published tokens only.** Never inspect or
   target a closed shadow root.
5. **An iframe is themed through its configuration only.** Do not claim more.

## What you must not do

- Do not invent a border radius, shadow, duration, easing, z-index or colour.
- Do not add a second icon family.
- Do not import from `luc-cron`, `luc-jobs`, `luc-hermes`, `luc-injest`,
  ClickHouse, analytics or backend code. `luc-ui` must stay liftable into
  another repository.
- Do not copy source from `MIT + Commons Clause` projects (Animate UI, React
  Bits). Implement the behaviour yourself and record it in the source registry.
- Do not ship a component without a showcase page and at least one test.
- Do not use `text-fg-disabled` for content, `alert()` for dialogs, or a
  spinner for a known layout.
- Do not virtualise a table that fits on one screen, or turn a table into cards.
- Do not make a table fetch, compute, or silently convert units.
- Do not install a second primitive stack, toast library, or command-menu
  engine. One engine per capability is the rule.
- Do not install a second form engine, a second date system, or a validation
  library that `@luc/ui` imports. Validators arrive through resolvers.
- Do not parse a date-only value with `new Date(...)`, and do not format dates
  inline with `toLocaleDateString`.
- Do not dim a field with `opacity`, and do not use `text-fg-disabled` for
  anything a user has to read.
- Do not let a form component call an API, upload a file, or compute a business
  rule.
- Do not write page-local shell CSS, a second sidebar, or a second drawer.
- Do not put pane sizes, hover state or open menus in the URL, and do not encode
  a view as one JSON parameter.
- Do not import `@luc/ui/src/...` or `@luc/ui/dist/...`; use a public subpath.
- Do not override a component's colours, radius, padding or motion from a page.
- Do not scrape a TradingView widget, read its shadow DOM, or use provider
  content as a data source. Widgets are display integrations.
- Do not remove, hide, recolour or cover provider attribution, and do not pass a
  script URL from props — the loader accepts the three official hosts only.
- Do not hand-roll a widget embed when `@luc/ui/tradingview` has a wrapper, and do
  not wrap a legacy embed that the registry lists as replaced.
- Do not make a chart's marks appear only on hover, and do not fix a crowded
  matrix by hiding labels without a documented policy.
- Do not rename a semantic token to match a utility name (or vice versa) — the
  two namespaces are bridged on purpose. Use `var(--elevation-sm)` in arbitrary
  values and `shadow-sm` in classes.
- Do not force `role="alert"` (or any live role) onto static content; `Alert`
  and `Callout` are silent until the caller asks with `live`.
- Do not use a slider for a value the user must type exactly — that is
  `NumberInput`. Do not use a menu to pick a form value.
- Do not replace a domain empty state (chart, DataTable) with the generic
  `EmptyState` purely for reuse.

## Definition of done

```bash
cd luc-ui
pnpm verify        # typecheck + lint + unit tests + Showcase build + package gates
pnpm qa:browser    # behaviour checks against a running Showcase
pnpm qa:visual     # screenshots + axe against a running Showcase
```

`pnpm verify:package` runs the package build, `publint`, the consumer
tree-shaking scenarios (including the bundle baseline) and `attw`. If your change
alters a public entry point, run it before asking for review.

Then confirm, from the screenshots: dark and light both hold up, no layout
shift, no glow creep, no accidental second accent, and the density still feels
like a product rather than a marketing page.
