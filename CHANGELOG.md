# Changelog

All notable changes to `@luc/ui`. The foundation rounds (V0.1–V0.6) shipped as
a single uncommitted working tree; V1.0 is the first frozen release.

## 1.1.0 — 2026-10-28

Adds professional financial crosshair and TradingView-style axis drag scaling for Cartesian ECharts charts. New optional `crosshair` and `axisDrag` controls default to enabled, with `crosshair: false` preserving Tooltip behavior. Includes independent dual-Y-axis labels (including percentage/USD units), time-axis labels, axis-specific scaling/reset, mouse and mobile gestures, accessibility/theme support, and fixes for Brush registration and invalid-time Tooltip handling.

Existing Luc UI consumers should update their pinned Git tag to `v1.1.0` and verify chart interactions; unrelated chart types are unaffected.

## 1.0.1 — 2026-10-18

`@luc/ui@1.0.1` is the second public Git-tag release. It is available from the
immutable `v1.0.1` tag and the public GitHub Release. The npm registry package
is still unavailable.

This candidate contains no public-export, prop-shape or package-layout break.
It adds the official Luc UI identity, public installation and contribution
guides, isolated Vite and Next.js consumer verification, complete component and
chart documentation, and the accessibility corrections accumulated since the
first release.

Consumer-visible corrections:

* Heading text can break inside an otherwise unbreakable identifier, preventing
  long component names and paths from making a consumer page scroll sideways.
* Date and time segments reserve a 24 px minimum target width in squeezed
  layouts.
* Indeterminate progress uses its reduced-motion form instead of a travelling
  animation when motion is reduced.
* The README, logo, favicon, social metadata and installation examples point at
  the current public entry points and the immutable `v1.0.1` install tag.

Documentation and release infrastructure:

* All canonical component, Motion, Chart and TradingView entries now expose
  usable Usage examples, public API references and implementation boundaries.
* Clean consumers install the packed artifact with plain npm, build Vite and
  Next.js applications for production, and load both in Chromium.
* GitHub Actions separates deterministic verification, clean consumers,
  functional browser QA and Linux visual regression into independent required
  checks.
* Reviewed Darwin and Linux visual baselines now cover both the library
  surfaces and the Showcase's own navigation, documentation, chart and motion
  pages.
* Release artifacts record their source commit, ship a SHA-256 checksum and are
  verified again from the public Git tag in clean Vite and Next.js projects.

## 1.0.0 — first public release

The version `packages/ui/package.json` has declared since the V1.0 freeze, and
the first one published. Two things changed in how it reaches a consumer:

* **It is installable from a git tag.** `github:lucxu495/luc-ui#v1.0.0` resolves
  to a commit on the `release` branch whose root is the built package — `dist`
  JavaScript, declarations, CSS and the manifest, with no install scripts and
  the commit pinned in the lockfile. `docs/RELEASES.md` is the contract,
  `docs/CONSUMERS.md` the consumer's side of it, and
  `pnpm --filter @luc/ui test:git-consumer` is the proof. Nothing is published
  to a registry.
* **The licence is MIT**, and the package ships a `LICENSE` and a `repository`
  field so a consumer can find the source it came from.

The repository is now only the UI system. The `@luc/visuals` product, its
Showcase routes and its design record live in their own repository and consume
`@luc/ui` through the same public exports as any other consumer
(`docs/EXTRACTION_PHASE_1.md`, `docs/EXTRACTION_PHASE_2.md`).

Four defects the inherited backlog carried are fixed rather than re-listed:

* the hidden file input in `FileUpload` has an accessible name (`inputLabel`,
  defaulting to `title`), which clears a critical axe finding;
* a labelled `MagnifyDockItem` is a `group` instead of a bare `div`, which
  clears the `aria-prohibited-attr` finding and keeps the control inside it in
  the accessibility tree;
* the alert live-region check now enters the scenario it asserts instead of
  measuring the page's (correct) default of having no live region;
* the navigation spill check no longer counts zero-width nodes as content
  crossing the container's edge.

## Unreleased

### 6.0.0 — the whole Showcase in Chinese, and a chart count that can be checked

The phase that pays off the documentation debt rather than measuring it again.
Nothing was added to the component surface; four library props gained optional
label overrides, and the Showcase gained a translation system, a machine-readable
chart registry and two checks that fail the build when either drifts.

* **131/131 routes are fully bilingual.** 12 180 documentation sentences have a
  Chinese rendering, keyed by their English source (`tcs`). The English stays in
  the page as the fallback, so an English reader sees byte-identical output.
* **The Showcase's own chrome is localized**: `PropsTable`, `TokenTable`,
  `DataTable`, `Demo`, `Playground`, `StateGrid`, `CopyButton`, `ChartPanel`.
  `DataTable` stays server-compatible so a page can keep passing `render`
  functions across the boundary.
* **Library labels gained overrides** (English defaults preserved):
  `FullscreenButton.label` / `.tooltip`, `SearchInput.clearLabel`,
  `Combobox.clearLabel` / `.openLabel` / `.closeLabel`,
  `CarouselControls.dotsLabel`.
* **A browser-side check** (`apps/showcase/qa/i18n-live.mjs`) loads `/zh<route>`
  for all 130 routes and asserts that no English prose is visible. Result on the
  deployed build: 130/130 clean.
* **A chart registry** (`apps/showcase/components/charts/chart-catalog-data.ts`)
  plus `scripts/chart-catalog.mjs`: every symbol is resolved against the real
  exports of `@luc/ui/charts`, ids must be unique, and the count is printed as
  *plot types / variants / compositions / components / renderers* rather than one
  number. Verified: 81 entries, 79 public rows, 76 distinct plot types, 78
  distinct components, 3 renderers, 1 planned, 1 blocked.
* **`pnpm verify` now includes `verify:i18n` and `verify:charts`.**

### 5.0.0 — the component ecosystem, scientific charts, and a spatial control

The breadth cycle. Phase 4 established the spatial *language*; this release
spends the same cycle on **how much a developer can build without leaving the
library**: twelve new component families, ten new public chart types, and the
`data-space` control promoted from a foundations page to a global product
control. Additive at the API level — no export was removed or re-typed, and no
dependency was added.

**Twelve component families** (root barrel; field-shaped controls also on
`@luc/ui/forms`)

| Added | Why it exists |
| --- | --- |
| `TreeView` | A hierarchy with a real `tree`/`treeitem` keyboard contract: one Tab stop, arrows walk the visible rows, `*` opens a level |
| `FileUpload` | Selection stays the browser's; transfer stays the application's — LUC owns the drop surface, per-file state and rejections |
| `ColorPicker` + `utils/color.ts` | Hex in, hex out. Pointer square as a shortcut, three sliders + a hex field as the keyboard path |
| `TransferList` | Two listboxes, one Tab stop each, `aria-activedescendant`, Ctrl/Cmd+A per pane |
| `NotificationCenter` | Accumulated state: unread badge, mark-all-read, dismiss. The panel's open state stays local |
| `GuidedTour` | Selector-driven spotlight drawn with one box-shadow; Escape and focus restore from any step |
| `SortableList` | Native HTML drag for pointers, pick-up/move/drop with a live region for keyboards — no dnd dependency |
| `KanbanBoard` | The two-axis case: Up/Down inside a column, Left/Right across columns |
| `ImageGallery` + `Lightbox` | Two states of one contract; the viewer reuses the shared Dialog |
| `ImageCompare` | A real range input over two images, so the keyboard path is the platform's |
| AI surface: `ChatMessage`, `MessageList`, `StreamingText`, `PromptComposer`, `ToolCallTimeline`, `AgentActivity` | Provider-neutral primitives that render only what the application supplies |

`ChatMessage` takes `from`, not `role`: on a component that renders a DOM
element, `role` collides with the ARIA attribute and makes every consumer with
`eslint-plugin-jsx-a11y` report a false error.

**Ten chart types** (`@luc/ui/charts`) — diagnostics, networks, geography and a
dependency-free 3D surface: `AutocorrelationChart`, `SurvivalCurveChart`,
`PrecisionRecallChart`, `FeatureImportanceChart`, `ChordChart` (+ `chordLayout`),
`DendrogramChart`, `ChoroplethChart`, `GeoTrajectoryChart` (+
`unwrapLongitudes`), `Surface3DChart`, `VolatilitySurfaceChart`.

The 3D surface is rotations + orthographic projection + painter's algorithm in
a single `custom` series — no WebGL renderer, no GPU context, no `echarts-gl`,
and the view is controllable and keyboard-rotatable. `/charts/catalog` now
reports its own numbers (78 public entries naming 78 distinct components) and
lists the deliberate non-types (adjacency matrix, alluvial, 2D volatility
heatmap) so the count cannot be inflated by renaming a renderer reuse.

**Spatial control promoted**: `data-space="flat|layered|deep"` is now part of
the Showcase Appearance control (persisted, pre-paint, next to palette, type
voice and personality) because it rescales the shared lift/press tokens for the
whole tree rather than one page.

Known gap: 102 legacy Showcase routes still render long-form page bodies in
English (`node apps/showcase/scripts/i18n-coverage.mjs --missing`). Headers,
navigation, chrome and every existing long-form key are complete in both
languages.

### 4.0.0 — a universal spatial language, twelve component families, five chart packs

The spatial *language* cycle. The user's correction after Phase 3 was that
spatial belonged in the Motion Gallery rather than in the library; this release
moves it into the recipe of every family and then spends the same cycle on
breadth: seventeen component families and thirty-five chart types. Additive at
the API level: no export was removed or re-typed and no dependency was added.

**Spatial design language** (`@luc/ui/tokens.css`, `@luc/ui/styles.css`)

| Added | What it is |
| --- | --- |
| `--spatial-depth`, `--spatial-lift`, `--spatial-lift-sm`, `--spatial-sink`, `--spatial-press-scale`, `--spatial-lift-unit`, `--spatial-sink-unit` | One depth scale for the library. A personality sets the distance unit; `data-space="flat|layered|deep"` overrides the scale for a subtree. |
| `--elevation-rest`, `--elevation-hover`, `--elevation-active`, `--elevation-float`, `--layer-2-shadow`, `--layer-3-shadow`, `--well-shadow` | The four-rung ladder, the two stacked overlay steps, and the sunken well. Bridged to Tailwind as `shadow-rest` … `shadow-well`. |
| `luc-rest`, `luc-hover`, `luc-float`, `luc-float-high`, `luc-well`, `luc-settle` | The rungs as utilities, so a consumer can build its own surface in the same language. |
| `data-space` | A public attribute (`flat` / `layered` / `deep`) that rescales travel across a subtree without touching a component. |

Re-pointed at the tokens: `luc-press` and `luc-lift` (both were hard-coded).
Applied across Button, IconButton, Card, Panel, Input, Textarea, Select,
Combobox, InputGroup, Dialog, Sheet, Popover, Tooltip, Menus, Command, Tabs,
SegmentedControl, Progress, Slider, Toast, Calendar, DatePicker, AppShell and
DataTable rows. Documentation: `DESIGN_SYSTEM.md` §8.7; Showcase
`/foundations/spatial`.

**Components — P0 wave** (`@luc/ui`, root barrel; no new dependency)

| Added | What it is |
| --- | --- |
| `Accordion` + `Collapsible` | `card` / `flush` variants, Radix-height animation, `aside` slot on the trigger. |
| `AlertDialog` | Confirmation with a different contract from `Dialog`: `danger` by default, cancel first, no scrim dismissal. |
| `Pagination` + `PaginationSummary` + `paginationWindow` | Table-free paging with a pure, tested window function and a `compact` mode. |
| `ScrollArea` | Themed, always-present scrollbars — the piece several overlays were missing. |
| `Toggle` + `ToggleGroup` | Independent pressed controls; pressed reads as depth, not as a colour flip. |
| `Avatar` + `AvatarGroup` + `initialsOf` | Deterministic tint hashed from the name, CJK-aware initials, overflow as real text. |

**Components — P1 wave** (root barrel; no new dependency)

| Added | What it is |
| --- | --- |
| `AspectRatio` | Ratio presets plus any number; reserves space before media loads. |
| `KbdGroup` (and `Kbd` `variant`/`size`) | A shortcut announced as one chord. |
| `Label` | For controls LUC does not own; the required asterisk is `aria-hidden`. |
| `ButtonGroup` + `Toolbar` | One joint for a group; one tab stop and arrow keys for a toolbar. |
| `InputGroup` (+ `Addon` / `Input` / `Separator`) | The shared field shell as a composition contract. |
| `HoverCard` | A preview with content, distinct from `Tooltip` in delay and intent. |
| `NativeSelect` | The platform picker inside the LUC field chrome. |
| `Timeline` | An ordered sequence; the rail stops at the last item. |
| `Stepper` | `aria-current="step"`, future steps not reachable. |
| `Carousel` (+ `Track` / `Item` / `Controls` / `useCarousel`) | Dependency-free, on native `scroll-snap`, with a keyboard contract and opt-in autoplay. |
| `Rating` | A radiogroup with half steps; read-only renders as `role="img"`. |

**Charts — five new packs** (`@luc/ui/charts`)

| Pack | Added |
| --- | --- |
| Statistical | `EcdfChart`, `QqPlotChart`, `ViolinChart`, `RocCurveChart`, `CalibrationChart`, `ConfusionMatrixChart`, `ErrorBarChart`, `ResidualChart` |
| Scientific | `ParallelCoordinatesChart`, `PolarRoseChart`, `WindRoseChart`, `TernaryChart`, `VectorFieldChart`, `ContourChart`, `SpectrogramChart`, `ThemeRiverChart`, `RidgelineChart`, `HexbinChart` |
| Workflow | `GanttChart`, `DumbbellChart`, `SlopeChart`, `LollipopChart`, `BulletChart`, `BumpChart`, `MekkoChart` |
| Quantitative | `CandlestickChart`, `DrawdownChart`, `VolatilitySmileChart`, `EfficientFrontierChart`, `FactorExposureChart`, `PnlAttributionChart` |
| Multidimensional | `ScatterMatrixChart`, `HierarchyTreeChart`, `GeoScatterChart` |

Plus `registerEChartsMap`, `formatRatio`, `ratioAxis`, `ratioOrFormatAxis`, and
the ECharts registrations (`ThemeRiverChart`, `ParallelChart`, `MapChart`,
`ParallelComponent`, `SingleAxisComponent`, `GeoComponent`) that make the new
families drawable. The rule is unchanged and enforced by the props types: **the
library renders, it does not estimate.**

**Showcase**: fifteen new routes (nine components, five chart groups, one chart
catalogue, one spatial foundation), a fully bilingual chart catalogue, and
`components/*` + chart pages written in both languages at creation. Bilingual
coverage: page headers 121/121, navigation 135/135, chrome 82/82, long-form keys
380/380, page bodies 19/121.

**Verification**: `pnpm verify` exit 0; **763 package tests / 81 files**; the
public path count is unchanged at 34.

Evidence: [`docs/audits/phase-4/`](./docs/audits/phase-4/).

### 3.0.0 — spatial motion, provider lifecycle and a bilingual component map

The spatial cycle. Additive at the API level: six new motion families, one new
`material` prop on `TiltSurface`, one new hook, and two semantic token groups.
No export was removed or re-typed and no dependency was added.

**Motion — spatial** (`@luc/ui/motion`)

| Added | What it is |
| --- | --- |
| `ParallaxScene` / `ParallaxLayer` | Depth as a coordinate system: the scene publishes one pointer offset as inherited custom properties, each layer multiplies it by `depth`, `z` and `axis`. |
| `OrbitField` / `OrbitFieldRing` / `OrbitFieldNode` / `OrbitFieldCore` | Rings that rotate on the compositor with seats that counter-rotate at the ring's exact period, can be real buttons, and rest while the pointer is on them. |
| `ExpandableSurface` + `Trigger` / `Content` / `Close` | A surface that grows out of its own rectangle in flow — one shared layout identity, no portal, no scroll lock, focus in on open and back on Escape. |
| `KineticHeadline` | Layout-aware word transition when the text changes. One accessible string; the animated layer is `aria-hidden`. |
| `CardStack` / `CardStackItem` / `CardStackControls` / `useCardStack` | Depth as navigation: keyboard, a 48px touch drag, `inert` cards behind the active one, and a composable controls slot. |
| `SelectionBeam` | Connects two live DOM nodes with a travelling packet, re-anchored by a `revision` prop. |

**Hooks** (`@luc/ui/hooks`): `useParallax` — the depth bus behind `ParallaxScene`.

**The contract** (`@luc/ui/tokens.css`)

| Added | What it is |
| --- | --- |
| `--glass-*`, `--layer-shadow` | The translucent material tier, derived from `--surface-overlay`, so a palette or personality still applies. |
| `luc-glass`, `luc-orbit-*`, `luc-beam-dash`, `luc-layer` | The spatial utilities. |
| `TiltSurface material="glass"` | A leaning surface that also reads as physical. |

**Fixes**

| Fixed | What it was |
| --- | --- |
| TradingView iframe lifecycle | A settled embed was parked for the full 5s teardown grace, so a theme flip held the old widget next to the new one. Settled embeds now release in 600ms; the long grace stays for scripts still in flight. Verified live. |
| `CardStack` controls | The overlay slot sat under the card layers, so the deck's own controls were unclickable. Overlay content now renders at `z-10` and layer z-indices are bounded. |
| Orbit label tilt | A reversed ring's angle is `-360t/T`, so the counter-rotation has to run forwards. Labels no longer arrive tilted by the live angle. |

**Showcase**

| Added | What it does |
| --- | --- |
| `/motion/spatial` | The V3.0 gallery: one control board (depth, tilt, orbit speed, material, freeze, intensity) driving six interactive families, with before/after notes and the rejected alternatives. |
| `/components` in Chinese | The component map is now fully bilingual, including the "new in V1" marker and the per-family descriptions. |
| `scripts/i18n-coverage.mjs` | Measures bilingual coverage per surface and fails on a missing or orphaned translation key. |

### 2.1.0 — signature motion, visual personality and a bilingual Showcase

The visual-transformation cycle. Additive at the API level: five new motion
primitives, one opt-out prop on the Button family, and one new attribute-scoped
token layer. No export was removed or re-typed and no dependency was added.

**Motion** (`@luc/ui/motion`)

| Added | What it is |
| --- | --- |
| `PressRipple` / `usePressRipple` / `RippleLayer` | Press ink spawned at the pointer position, sized to the surface. Used by `Button` and `IconButton` by default. |
| `AuroraSurface` | A drifting, palette-derived atmosphere for a hero, auth screen or empty state. Compositor-only, masked and vignetted. |
| `BeamFlow` | A packet travelling a smooth path through two or more waypoints. One SVG, non-scaling strokes, no ResizeObserver. |
| `MagnifyDock` / `MagnifyDockItem` | Pointer-proximity magnification for a dense toolbar. No React re-render on pointer move. |
| `Marquee` | A seamless, pausable stream: two copies of the track, the second hidden from assistive technology. |
| `usePointerGlow` + `luc-cursor-light` | One shared, frame-throttled cursor tracker behind the pointer highlight. |

**The contract** (`@luc/ui/tokens.css`)

| Added | What it is |
| --- | --- |
| `[data-personality="…"]` | Four materials — `instrument` (default), `editorial`, `dense`, `expressive` — each moving geometry, control heights, density, type proportions, motion physics and glow strength together. Works on any subtree, like the palettes. |

**Components**

| Changed | What it does |
| --- | --- |
| `Button` / `IconButton` | Press ink plus a pointer-tracked highlight; opt out with `tactile={false}`. |
| `Input` / `Textarea` / `Select` | Hover lift and a focus state that adds an inner highlight to the accent border. |
| `Slider` | Thumb grows on hover and drag; the filled range carries an accent gradient. |
| `Popover`, menus, `Select` and `Combobox` lists | Unfold from their anchor (4px travel, scale from 0.962) instead of fading in. |

**Showcase**

| Added | What it does |
| --- | --- |
| `/motion` | A gallery index of every kinetic primitive, grouped by intent, each naming its public API. |
| `/motion/signature` | The five new primitives with live controls: intensity level, tone, density, state, speed and replay. |
| `/foundations/personality` | Four personality subtrees rendering the same specimens, with a per-column apply control. |
| Homepage | One AuroraSurface hero, a live signature stage, a capability marquee, four personality cards, seven live palettes, four cross-industry vignettes. |
| Bilingual Showcase | English and Simplified Chinese. The locale lives in the URL (`/zh/...`), the middleware rewrites it onto one copy of every page, and the layout resolves it from the header, then the cookie, then `Accept-Language`. Navigation, chrome and all 97 page headers are translated; long-form body copy is translated on the homepage, motion gallery, signature motion and personality pages, and the gap is disclosed in the language switcher itself. |

**Bundle note**

The tactile layer is shared by every entry point that renders a control, so the
recorded baselines moved: `button-only` 5,803 to 11,010 bytes raw (2,104 to 3,711
gzip), `barrel` 9,368 to 14,729 raw, and `charts` shrank slightly. This is a
disclosed, measured trade-off; see
`docs/audits/phase-2/2026-10-08-phase-2-visual-transformation.md` section 3.3.

### 2.0.0 — brand palettes, type roles and the Design Lab handoff

Additive at the API level: one new `Button` variant, one new CSS-only hover
gesture, and two attribute-scoped token layers. No export was removed or
re-typed, no dependency was added, and the default rendering is unchanged.

**The contract** (`@luc/ui/tokens.css`)

| Added | What it is |
| --- | --- |
| `[data-palette="…"]` | Seven accent families — `cyan` (default), `violet`, `cobalt`, `emerald`, `rose`, `ember`, `graphite`. Ten declarations per mode; everything derived from the accent (`surface.selected`, `line.accent`, `glow.*`, `calendar.*`, `chart.marker|selection|band`) is re-derived in the block so the attribute works on *any* subtree, not only on `<html>`. |
| `[data-typeface="…"]` | Four type voices — `inter` (default), `humanist`, `editorial`, `technical` — each re-pointing `--font-sans` / `--font-display` / `--font-mono` together. |
| `--fg-on-accent` as a palette-controlled token | Keeps "text on an accent fill" a pair the palette owns, so contrast is a property of the palette rather than an accident. |
| `Button variant="accent"` | The tinted twin of `primary`, matching `IconButton`'s existing `accent` variant. |
| `luc-sheen` utility + `luc-sheen` keyframes | One soft highlight crossing a filled button on hover. Never loops, never fires on scroll, removed entirely under reduced motion. Applied to `primary` and `accent`. |

**Gates**

| Added | What it protects |
| --- | --- |
| `tokens/palette-tokens.test.ts` | Every palette defines the whole accent ramp in both modes; no light palette block can reach a dark root; the derived tokens are present; and WCAG contrast for `accent.on-accent` on `accent.default` and `text.accent` on `surface.default` is **computed** from the declared oklch values and asserted ≥ 4.5:1. |

**Showcase**

| Added / changed | What it does |
| --- | --- |
| `/foundations/themes` | Seven palettes and four type voices as live, JavaScript-free subtrees, with the measured contrast table. |
| `/patterns/industries` | Four products — AI/dev tools, commerce, creator, finance — built from the same public components, each scoped to its own palette and type voice. |
| Appearance control in the topbar | Sets the brand palette and type voice for the whole Showcase and remembers them between visits. |
| Experiments navigation group | The Design Lab and its three treatments are reachable from the sidebar (and the group opens itself when the current route is inside it). |
| `experiments` QA group | The four Design Lab routes are now part of the standard sweep instead of being excluded from it. |
| Docs table + status bar | A horizontally scrollable region is now a named, focusable `region`; the shell status bar ellipsizes its title instead of scrolling below the `xs` breakpoint. |

### 1.3.0 — axis, scale and domain

Additive. No V1.0–V1.2 public API changed shape, no dependency was added, and no
engine was replaced. The theme is *presentation correctness*: what a chart's axes
mean, and where its values come from.

**The contract** (`@luc/ui/charts`, `charts/core/axis.ts`)

| Added | What it is |
| --- | --- |
| `YScaleMode` (`"linear" \| "log"`) | The only scale vocabulary. A presentation mapping of the same real values — never a data transform. |
| `AxisSide`, `DEFAULT_Y_AXIS_SIDE` (`"right"`) | An ordinary single-Y-axis chart puts its plate on the right; a second axis is a deliberate, documented exception. |
| `ChartScaleCapability`, `normalizeScaleCapability`, `resolveScaleMode`, `isLogEligible` | Allowed/default modes. A log request over non-positive data resolves to linear with a reason instead of an engine-drawn `[1, 10]` axis. |
| `resolveAxisBounds` / `resolveAxisDomain` / `axisBoundFn` | The shared domain policy: zero-aware headroom, marker headroom, declared reference levels folded in, flat/near-flat handling, multiplicative log padding, and bounds that follow the *visible* extent. |
| `minHeadroom` / `maxHeadroom` | An edge that is padding rather than a reported value — so its tick keeps its split line but loses its number. |
| `CHART_PLOT_LAYOUT`, `resolveChartPlotRect`, `AXIS_LABEL_MARGIN` | One plot rectangle for a stack: the axis gutter is reserved, not measured from whatever label happens to render. |
| `ScaleSelector` (chart chrome) | The `Linear / Log` control. Renders nothing unless the chart offers two modes; keyboard- and screen-reader-correct. |
| `ChartSpec.scale`, `AxisSpec.scaleMode` / `position` / `zeroBaseline` / `padding` / `marker` | The declared capability and the per-axis domain knobs. |

**Upgraded**

| Changed | What it does now |
| --- | --- |
| `buildCartesianOption` | Defaults the single axis to the right, resolves the scale against the data, applies the padded domain as extent functions (so zoom keeps its headroom), folds declared reference levels into the extent, and uses the shared plot rectangle. |
| `LightweightSurface` | Accepts `priceScale` (`side`, `mode`) and unit-aware `priceFormatter` / `tickFormatter`; reserves `minimumWidth` on the plate so a stack shares one plot width. |
| `FinancialChart` | Takes `priceScale` and renders the plate through the LUC formatter (a currency axis reads `$83,402`, not `83402.01`). |
| `FullscreenResearchView` | Takes an optional `scale` slot, so opening fullscreen shows the same axis as the inline chart. |
| `numericAxisFormatter` | Abbreviates from 10 000 up and keeps the currency (`$124.7K`) instead of `700000.00`. |
| `formatNumber` | A value that rounds to zero no longer prints `-0.0`. |
| Distribution, band, relationship, waterfall charts | Their value plates moved to the right, matching the contract. |

**Fixed while auditing the full suite** (three pre-existing defects, all in the
V1.2 kinetic showcase rather than the chart work):

| Fixed | Why |
| --- | --- |
| `MorphingDialogTrigger` / `MorphingPopoverTrigger` | Radix puts `aria-haspopup` / `aria-expanded` on the trigger, which is invalid on a role-less `div` (axe `aria-allowed-attr`). They now render `role="button"` with Enter/Space activation, so the trigger is keyboard-operable too. |
| `motion-kinetic` slider | A slider thumb with no accessible name; the demo now passes `label`. |
| `motion-kinetic` transition demo | Used `Tabs` as a view switcher with no `TabsContent`, publishing an `aria-controls` that pointed nowhere (`aria-valid-attr-value`). It now uses `SegmentedControl`, the control LUC has for switching content in place. |

### 1.2.0 — premium motion & kinetic interaction

Additive. No V1.0/V1.1 public API changed shape, no dependency was added, and
Motion remains the single animation engine. The theme is *expressive by
decision*: the system now has a vocabulary for how loud an interaction is
allowed to be.

**Interaction intensity**

| Added | What it is |
| --- | --- |
| `MotionIntensityProvider` (`intensity`, `pointer`, `ambient`) | Scopes one of `none`/`functional`/`expressive`/`showcase`; reduced motion always resolves to `none`. |
| `useMotionIntensity` / `useMotionProfile` | The raw level and the resolved `{ pointer, ambient, travel, glow, depth, stagger }` profile. |
| `intensityProfiles`, `pointer`, `surfaceResponse`, `depth`, `ambient` (tokens) | Cursor geometry, hover/press geometry, depth amounts and loop budgets — one place, not dozens. |

**New kinetic primitives**

| Added | What it is |
| --- | --- |
| `Magnetic` | Leans toward the pointer, springs home, travel hard-clamped; inert on touch and under reduced motion. |
| `TiltSurface` | 3D lean with an optional glare layer and a spring release. |
| `GlareSurface` | A reflection that follows the pointer across a surface. |
| `BorderTrail` + `BorderTrailLayer` | An SVG dash travelling a rounded-rect perimeter, correct at any size or radius. |
| `InteractiveGrid` | A technical grid that lights up near the pointer, with an optional slow drift. |
| `ClickBurst` | 4–8 rays from the pointer on a completion; nothing renders under reduced motion. |
| `IconMorph` | One glyph dissolving into the next inside a fixed-size box. |
| `TransitionPanel` | A directional swap in one slot; the outgoing panel leaves the flow. |
| `TextReveal` / `ScrambleText` | SSR-safe blurred/masked/word/character headline entrance; a short status decode. |
| `Pressable` | Spring hover lift and press compression, scaled by the resolved intensity. |
| `MorphingDialog` / `MorphingPopover` | Shared-`layoutId` geometry over Radix's focus, Escape, scroll-lock and unmount contract. |

**Upgraded**

| Changed | What changed |
| --- | --- |
| `SpotlightSurface` | Gains `border` and `texture` layers, all driven by the same pointer write, scaled by the intensity profile. |
| `BorderGlow` | Ring strength follows the profile; the travelling ring is now gated on `profile.ambient`. |
| `MotionSurface` | Composes lift + pointer spotlight scaled by intensity; `--surface-lift` is a token, not a literal. |
| `Card` | New `interaction="static\|interactive\|selectable\|featured"` intent. |
| `Button` / `IconButton` | Optional `magnetic` lean and `trail` beam (rendered inside the control's own box). |
| `NumberTicker` / `MetricValue` | New `variant="digits"` digit-level roll that moves only the digits that changed. `MetricValue` defaults to it and it renders the final value in the markup. |
| `luc-press` | A short spring compression (`luc-press-spring`), still clamped under reduced motion. |
| `FullscreenChart` | Now builds on `MorphingDialog`, so the panel grows out of the chart card. |
| Charts (ECharts) | Series focus thickens and glows; new `SeriesSpec.currentPoint` marks the latest real observation with a lit core and a ripple; scatter hover grows with a halo; heatmap hover lights the cell, prints its value and emphasises the label. |

**Docs** — `docs/MOTION_GUIDE.md` (V1.2 sections),
`docs/INTERACTION_MATRIX.md` (new: the canonical motion contract),
`DESIGN_SYSTEM.md` §8.4 (the design statement), `docs/CHART_GUIDE.md`.

**Showcase** — `/motion/kinetic`, with live intensity / pointer / ambient
controls, demonstrating micro, surfaces, overlays, data, charts and atmosphere.

### 1.1.0 — motion, colour and research visualization

Driven by real Luc Web / BTC-product and research needs. Additive: no V1.0
public API changed shape and no chart engine was added.

**Motion**

| Added | What it is |
| --- | --- |
| `motion/tokens.ts` (`duration`, `easing`, `spring`, `distance`, `transitionCss`, `chartMotion`) | The JS half of the motion contract, mirrored from `tokens.css`. Spring presets (`soft`/`responsive`/`snappy`) and travel distances (`xs`/`sm`/`md`) are new. |
| `StaggerGroup` + `StaggerItem` | A short, ordered entrance for a set of related items (delegates to `Reveal`, so viewport/reduced-motion behaviour is shared). |
| `Collapse` | Animated height + opacity disclosure with a real button trigger (`aria-expanded`/`aria-controls`) and `onOpenChange`. |
| `FadeSwap` + `Presence` | Crossfade between the same slot's states; mount/unmount without a hard cut. |
| `SharedHighlight` | One gliding indicator for a set of view options — links (navigation) or buttons (state), `track` or `underline`. |
| `MotionSurface` | Restrained hover/selected feedback (1px lift, border step, optional per-theme glow). |
| `DataChangeFlash` | A one-shot semantic tint when a value actually changed; never on first paint, never on a timer. |

**Colour**

| Added | What it is |
| --- | --- |
| `chart.seq.*` / `chart.div.*` tokens + `sequentialPalette` / `divergingPalette` / `fanPalette` / `rampColor` | Continuous ramps for "how much" and "which side", interpolated from theme anchors. |
| `seriesColor` / `seriesSlot` / `benchmarkColor` | Deterministic series → colour assignment: `price` → slot 0, `benchmark` → slot 1, macro factors, funding, open interest, risk, on-chain, then a stable hash. Filtering a series no longer repaints the others. |
| `parseOklch` + `parseColor` support for `oklch()` | The fallback theme is authored in oklch; ramps and contrast maths now resolve real channels before the DOM exists. |

**Charts**

| Added / upgraded | What it is |
| --- | --- |
| `DistributionChart` | Histogram + optional prepared density curve + prepared median/mean/percentile references + optional signed split. |
| `FanChart` | Nested quantile bands on one hue with layered opacity, plus the median; tooltip shows every quantile. |
| `RangeBandChart` | A centre line with one interval fill. |
| `ScatterRegressionChart` | Observations plus a **prepared** fit, optional confidence band and zero guides. |
| `QuadrantScatterChart` | A scatter split by two reference lines with named quadrants. |
| `RegimeStrip` | A categorical time strip (custom series) with deterministic per-state colours. |
| `EventTimeline` | Dated, categorised events with optional guides. |
| `SmallMultiples` + `SmallMultiple` | A layout primitive for a grid of related panels. |
| `HeatmapChart` `palette="diverging"` + `midpoint` | A symmetric diverging domain centred on the midpoint. |
| `ChartSpec.animation` / `universalTransition` / `pointCount` | The chart animation budget, opt-in morphs and the large-data clamp. |
| Shared `blur`/`emphasis` state | Hover focuses the read series and softly de-emphasises the rest, identically in every family. |

**Showcase** — a new `/charts/uncertainty` page demonstrates the ramps, the fan,
the range band, the prepared regression, the quadrants, the distribution, the
regime strip, the event timeline and small multiples in dark and light themes.

* `@luc/ui/components/button` now also exports `buttonVariants`, matching
  `docs/PUBLIC_API.md` and `docs/COMPONENT_INVENTORY.md`. Additive; the entry
  already imported the recipe, so the button-only bundle is unchanged.
  `IconButton` and `Link` remain root-barrel exports and the docs now say so.

## 1.0.0 — the frozen foundation

### Added — the four remaining foundational primitives

| Family | What it is |
| --- | --- |
| `Slider`, `RangeSlider` (`@luc/ui/slider`) | Continuous and range numeric controls on Radix Slider. Controlled and uncontrolled, `sm \| md \| lg`, horizontal and vertical, `showValue`, `formatValue`, consumer-declared marks, form integration with no unit rescaling. |
| `DropdownMenu*` (`@luc/ui/dropdown-menu`) | Actions and options attached to a trigger: items, labels, separators, checkbox items, radio groups, submenus, shortcuts, a destructive tone and an `inset` alignment. |
| `ContextMenu*` (`@luc/ui/context-menu`) | The same menu language attached to a target, on one shared implementation (`components/menu-shared.tsx`). |
| `Alert` / `Callout` (`@luc/ui/alert`) | Inline status messages with five tones, opt-in live semantics (`off \| polite \| assertive`), actions and optional dismissal. Callout is the persistent, non-live variant. |
| `EmptyState` (`@luc/ui/empty-state`) | The reusable nothing-here-yet surface, with `sm`/`md` sizes, an icon slot, two actions and a controllable heading level. |

### Added — hardening

* `ChartInspectionArea` (`@luc/ui/charts`): a focusable plot region that steps a
  cursor across the prepared x values with the arrow keys, Home/End, Enter and
  Escape, and announces each step. Pinning is no longer pointer-only.
* `LUC_UI_TOKEN_VERSION` and `--luc-token-version`: a token schema version.
* Bundle baseline gate (`packages/ui/bundle-baseline.json` + the consumer test),
  with an 8%/1 KB tolerance per entry point.
* `verify:types` — Are The Types Wrong against the packed artifact, ESM profile.
* CI tiers: `pnpm verify` (fast), `pnpm qa:browser` (behaviour), `pnpm
  qa:visual` (screenshots), `pnpm verify:release` (everything).

### Fixed

* **Elevation tokens never reached the utility layer.** `shadow-sm|md|lg|xs`
  compiled to Tailwind's default grey shadows, and `shadow-overlay` was not a
  utility at all — so every overlay in the system (dialog, sheet, popover,
  tooltip, select, combobox, command, calendar, date picker, chart tooltip)
  rendered with no shadow. The semantic layer is now `--elevation-*` and the
  Tailwind `--shadow-*` namespace is bridged to it.
* Workspace separators are documented and tested against the full WAI-ARIA
  contract the engine emits (`role`, `aria-orientation`, `aria-valuenow/min/max`,
  `aria-controls`, `tabindex`), and the default label is asserted.
* **Two sidebar rows claimed to be the current page.** `SidebarItem` and
  `SidebarSubmenu` set `aria-current="page"` whenever the route *started with*
  the item's href, so on `/components/alert` both "Overview" and "Alerts" were
  current — and both were painted as selected. `isNavigationItemCurrent()` now
  makes the exact-match claim (exposed for consumers too), the section ancestor
  keeps a quiet accent label instead of a selected surface, and `data-current`
  distinguishes the two states. Found by the Showcase QA sweep.
* **A range slider's thumbs could lose their names.** Passing an explicit
  `aria-label={undefined}` erased the primitive's own "Minimum"/"Maximum"
  default, because the thumb spreads its props *after* computing it. The
  defaults are now repeated when no label is supplied (axe:
  `aria-input-field-name`).
* **A scrollable code block was not keyboard-reachable** in the Showcase's
  `Demo` (axe: `scrollable-region-focusable`); the `<pre>` is focusable now.
* **Two Showcase pages shipped a nested `<Text>`**, which renders `<p>` inside
  `<p>`, gets repaired by the HTML parser and therefore surfaced as a React
  hydration error rather than as invalid markup. A DOM-nesting sweep over the
  raw server HTML of every route is now part of the QA suite.

### Documentation

New: `docs/PUBLIC_API.md`, `docs/V1_API_AUDIT.md`, `docs/V1_TOKEN_AUDIT.md`,
`docs/VERSIONING.md`, `MIGRATION_V1.md`, this changelog. Updated:
`docs/COMPONENT_INVENTORY.md`, `docs/ACCESSIBILITY.md`, `DESIGN_SYSTEM.md`,
`AI_DESIGN_GUIDE.md`, `skills/luc-ui/SKILL.md`, `README.md`.

### Not included

No MultiCombobox, DataGrid editing, drag-and-drop, masked inputs, upload
progress, TreeView, Carousel, Timeline, Stepper, Menubar, product theme or
product components. See `docs/COMPONENT_INVENTORY.md` for why each is deferred.

## 0.6.0 — TradingView integration

27 typed TradingView widget wrappers (16 Web Components, 11 iframes) with a
registry, a shared loader, a theme bridge, lazy loading, SSR safety, failure and
retry states, and the `@luc/ui/tradingview` subpath. Plus three bug fixes:
combobox adornment geometry, correlation-matrix value policy, and box-plot marks
that only appeared on hover.

## 0.5.0 — application language

`AppShell`, `Sidebar`, `Topbar`, `Breadcrumbs`, `PageHeader`, the navigation
model, mobile navigation, `Workspace` with resizable panes and an inspector,
local persistence, URL state and shareable views, and the compiled package with
curated subpaths, publint and consumer tree-shaking tests.

## 0.4.0 — forms and date/time

`Form`/`Field` primitives, the optional React Hook Form adapter, number,
currency, percentage, password, OTP, file and tag inputs, and the
`CalendarDate`/`Time`/`CalendarDateTime`/`ZonedDateTime` date semantics with the
calendar, picker and range components built on them.

## 0.3.0 — data and product interaction

`DataTable` and `VirtualDataTable`, the column helpers, toolbars and facets,
`Select`, `Combobox`, `Toaster`, `Sheet`, `CommandMenu`, and the accessible
`ChartDataTable` fallback.

## 0.2.0 — chart language

ECharts and Lightweight Charts behind one `ChartSpec`, the analytical chart
catalog, LUC tooltips, annotations, `ChartSyncGroup` cross-engine
synchronisation, fullscreen research mode and PNG export.

## 0.1.0 — visual language

Semantic tokens, dark/light themes, typography, density, surfaces, motion, the
core controls, layouts and the creative surfaces.
